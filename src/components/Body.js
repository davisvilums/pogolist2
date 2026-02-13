import * as React from "react";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import PokemonCard from "./PokemonCard";
import { TagFilters, filtersList, runFilters } from "./TagFilters";
import Toolbar from "./Toolbar";
import Pagination from "./Pagination";

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
  lastAction,
  handleUndo,
  searchTerm,
}) {
  const [order, setOrder] = React.useState("desc");
  const [orderBy, setOrderBy] = React.useState("cp");
  const [page, setPage] = React.useState(0);
  const [itemsPerPage, setItemsPerPage] = React.useState(50);
  const [showfilters, setShowFilters] = React.useState(false);
  const [warning, setWarning] = React.useState("");
  const [filters, setFilters] = React.useState(filtersList);
  const [rows, setRows] = React.useState(data);
  const ref = React.useRef(null);

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

    // Check for spotlight collection (only one can be active)
    const spotlightCollection = list.find((c) => c.visibility === "spotlight");

    if (spotlightCollection) {
      // Spotlight mode: show only Pokemon in the spotlighted collection
      const spotlightPokemon = spotlightCollection.pokemon || [];
      pl = pl.map((item) => {
        item.show = spotlightPokemon.includes(item.id);
        return item;
      });
    } else {
      // Normal mode: apply hide filters
      const hiddenPokemonIds = new Set();

      list.forEach((collection) => {
        if (collection.visibility === "hide" && collection.pokemon) {
          collection.pokemon.forEach((id) => hiddenPokemonIds.add(id));
        }
      });

      pl = pl.map((item) => {
        item.show = !hiddenPokemonIds.has(item.id);
        return item;
      });
    }

    pl = pl.filter((p) => p.show === true);

    setRows(pl);
    setWarning("");
  }, [filters, list, selected.pokemon, data, searchTerm]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    // if (event.target.checked) {
    //   const newSelecteds = rows.map((n) => n.id);
    //   setSelected(newSelecteds);
    //   return;
    // }
    // setSelected([]);
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

  let title = "Pokedex";
  if (list) {
    let obj = list.find((o) => o.selected === true);
    if (obj) title = obj.text;
  }

  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <Toolbar
        title={title}
        numSelected={selected.length}
        rowCount={rows.length}
        handleSelectAllClick={handleSelectAllClick}
        handleRequestSort={handleRequestSort}
        warning={warning}
        orderBy={orderBy}
        order={order}
        toggleFilters={() => setShowFilters(!showfilters)}
        lastAction={lastAction}
        handleUndo={handleUndo}
      />
      {showfilters && (
        <TagFilters filtersList={filters} setFilters={setFilters} />
      )}

      <PokemonWrap ref={ref}>
        {stableSort(rows, getComparator(order, orderBy))
          .slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage)
          .map((row, index) => {
            const isItemSelected = isSelected(row.id);

            return (
              <PokemonCard
                pokemon={row}
                key={row.name}
                select={(event) => handleClick(event, row.id)}
                selected={isItemSelected}
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
