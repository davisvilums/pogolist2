import * as React from "react";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { styled } from "@mui/material/styles";
import PokemonCard from "./PokemonCard";
import { TagFilters, EvolutionFilters, filtersList, runFilters } from "./TagFilters";
import {
  buildAncestors,
  buildDescendants,
  getCollectionIds,
  applyEvolutionRules,
} from "../data/evolution";
import SortPanel, { FilterSetChips } from "./Toolbar";
import Pagination from "./Pagination";

// Copies the app bar's responsive minHeight rules as `top` offsets
const toTopOffsets = (style) =>
  Object.fromEntries(
    Object.entries(style).map(([key, value]) =>
      key === "minHeight" ? ["top", value] : [key, toTopOffsets(value)]
    )
  );

// Sticky area below the app bar showing the panel picked in the header
const PanelArea = styled("div")(({ theme }) => ({
  position: "sticky",
  zIndex: theme.zIndex.appBar - 1,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  ...toTopOffsets(theme.mixins.toolbar),
  "&:empty": { display: "none" },
}));

// Every panel shares this height (filters only grow when their chips wrap on narrow screens)
const PANEL_HEIGHT = 56;

const SortPanelWrap = styled("div")({
  height: PANEL_HEIGHT,
});

const FiltersPanel = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  minHeight: PANEL_HEIGHT,
  padding: theme.spacing(0.5, 2),
}));

const SearchPanel = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  height: PANEL_HEIGHT,
  padding: theme.spacing(0, 2),
}));

const PokemonWrap = styled("div")`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`;

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export default function Body({
  data,
  list,
  selected,
  setSelected,
  activePanel,
  searchTerm,
  setSearchTerm,
  showCollectionTags,
  showShiny,
  tagVisibility,
  removePokemonFromCollection,
  filterSets,
  activeFilterSetId,
  setActiveFilterSetId,
  activeFilterSetMode,
  setActiveFilterSetMode,
  evolutionRules,
  setEvolutionRules,
  setVisiblePokemonIds,
}) {
  const [order, setOrder] = React.useState(() => {
    return localStorage.getItem("sortOrder") || "desc";
  });
  const [orderBy, setOrderBy] = React.useState(() => {
    return localStorage.getItem("sortOrderBy") || "cp";
  });
  const [page, setPage] = React.useState(0);
  const [itemsPerPage, setItemsPerPage] = React.useState(50);
  const [warning, setWarning] = React.useState("");
  const [filters, setFilters] = React.useState(filtersList);
  const [rows, setRows] = React.useState(data);
  const ref = React.useRef(null);
  const ancestors = React.useMemo(() => buildAncestors(data), [data]);
  const descendants = React.useMemo(() => buildDescendants(data), [data]);

  // Share what's on screen (all pages) with the sidebar name list
  React.useEffect(() => {
    if (setVisiblePokemonIds) setVisiblePokemonIds(rows.map((p) => p.id));
  }, [rows, setVisiblePokemonIds]);

  React.useEffect(() => {
    localStorage.setItem("sortOrder", order);
    localStorage.setItem("sortOrderBy", orderBy);
  }, [order, orderBy]);

  React.useMemo(() => {
    if (!rows) return "";
    let pl = data;

    // Apply tag/generation filters
    pl = runFilters(pl, filters);

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      pl = pl.filter((item) => item.name.toLowerCase().includes(search));
    }

    // Apply per-collection visibility (show/hide)
    const showCols = list.filter((c) => c.visibility === "show");
    const hideCols = list.filter((c) => c.visibility === "hide");

    if (showCols.length > 0) {
      const showIds = new Set();
      showCols.forEach((c) => getCollectionIds(c, descendants).forEach((id) => showIds.add(id)));
      pl = pl.filter((item) => showIds.has(item.id));
    }
    if (hideCols.length > 0) {
      const hideIds = new Set();
      hideCols.forEach((c) => getCollectionIds(c, descendants).forEach((id) => hideIds.add(id)));
      pl = pl.filter((item) => !hideIds.has(item.id));
    }

    // Apply active filter set
    const activeFs = filterSets.find((fs) => fs.id === activeFilterSetId);
    if (activeFs) {
      const fsShowCols = list.filter((c) => activeFs.filters[c.id] === "show");
      const fsHideCols = list.filter((c) => activeFs.filters[c.id] === "hide");

      if (fsShowCols.length > 0) {
        const effectiveInvert = activeFs.invert !== (activeFilterSetMode === "exclude");
        if (activeFs.mode === "and") {
          pl = pl.filter((item) => {
            const inAll = fsShowCols.every((c) => c.pokemon && c.pokemon.includes(item.id));
            return effectiveInvert ? !inAll : inAll;
          });
        } else {
          const ids = new Set();
          fsShowCols.forEach((c) => (c.pokemon || []).forEach((id) => ids.add(id)));
          pl = pl.filter((item) =>
            effectiveInvert ? !ids.has(item.id) : ids.has(item.id)
          );
        }
      }

      if (fsHideCols.length > 0) {
        const ids = new Set();
        fsHideCols.forEach((c) => (c.pokemon || []).forEach((id) => ids.add(id)));
        pl = pl.filter((item) => !ids.has(item.id));
      }
    }

    // Hide evolutions based on the evolution rules
    const visibleIds = new Set(applyEvolutionRules(pl.map((p) => p.id), evolutionRules, ancestors));
    pl = pl.filter((p) => visibleIds.has(p.id));

    setRows(pl);
    setWarning("");
  }, [filters, list, selected.pokemon, data, searchTerm, filterSets, activeFilterSetId, activeFilterSetMode, evolutionRules, ancestors, descendants]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleClick = (event, id) => {
    if (selected.pokemon) {
      const sl = { ...selected };
      const pokemon = sl.pokemon;
      const selectedIndex = pokemon.indexOf(id);
      let newPokelist = [];

      if (selectedIndex === -1) {
        newPokelist = newPokelist.concat(pokemon, id);
      } else if (selectedIndex === 0) {
        newPokelist = newPokelist.concat(pokemon.slice(1));
      } else if (selectedIndex === pokemon.length - 1) {
        newPokelist = newPokelist.concat(pokemon.slice(0, -1));
      } else if (selectedIndex > 0) {
        newPokelist = newPokelist.concat(
          pokemon.slice(0, selectedIndex),
          pokemon.slice(selectedIndex + 1)
        );
      }
      sl.pokemon = newPokelist;
      setSelected(newPokelist);
      setWarning("");
    } else {
      setWarning("Please select a collection to add pokemon");
    }
  };

  // const isSelected = (id) => selected.pokemon.indexOf(id) !== -1 ? true: false;
  const isSelected = (id) => {
    if (!selected.pokemon) return false;
    else return selected.pokemon.indexOf(id) !== -1;
    // console.log(selected.pokemon);
    // return 1;
  };

  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <PanelArea>
        {activePanel === "info" && (
          <SortPanelWrap>
            <SortPanel order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          </SortPanelWrap>
        )}
        {activePanel === "filters" && (
          <FiltersPanel>
            <TagFilters filtersList={filters} setFilters={setFilters}>
              <EvolutionFilters rules={evolutionRules} setRules={setEvolutionRules} />
            </TagFilters>
            <FilterSetChips
              filterSets={filterSets}
              activeFilterSetId={activeFilterSetId}
              setActiveFilterSetId={setActiveFilterSetId}
              activeFilterSetMode={activeFilterSetMode}
              setActiveFilterSetMode={setActiveFilterSetMode}
            />
          </FiltersPanel>
        )}
        {activePanel === "search" && (
          <SearchPanel>
            <TextField
              autoFocus
              size="small"
              sx={{ width: 260, maxWidth: "100%" }}
              placeholder="Search Pokémon…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchTerm("")}
              inputProps={{ "aria-label": "search" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label="clear search" onClick={() => setSearchTerm("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </SearchPanel>
        )}
      </PanelArea>
      <Snackbar
        open={!!warning}
        autoHideDuration={3000}
        onClose={() => setWarning("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setWarning("")}>
          {warning}
        </Alert>
      </Snackbar>

      <PokemonWrap ref={ref}>
        {stableSort(rows, getComparator(order, orderBy))
          .slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage)
          .map((row, index) => {
            const isItemSelected = isSelected(row.id);

            const pokemonCollections = showCollectionTags
              ? list.filter((c) =>
                  c.pokemon &&
                  c.pokemon.includes(row.id) &&
                  tagVisibility[c.id] !== false
                )
              : [];

            return (
              <PokemonCard
                pokemon={row}
                key={row.name}
                select={(event) => handleClick(event, row.id)}
                selected={isItemSelected}
                collections={pokemonCollections}
                showCollectionTags={showCollectionTags}
                removePokemonFromCollection={removePokemonFromCollection}
                showShiny={showShiny}
              />
            );
          })}
      </PokemonWrap>
      <Pagination
        length={rows.length}
        setItemsPerPage={setItemsPerPage}
        updatePage={setPage}
      />
    </Paper>
  );
}
