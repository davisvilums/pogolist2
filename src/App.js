import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Body from "./components/Body";
import Tooltip from "@mui/material/Tooltip";
import GetDataGrahp from "./data/GetDataGrahp";
import { defaultEvolutionRules } from "./data/evolution";
import { removeOwned, variantModeKey } from "./data/collections";
import { filtersList, cycleFilter, filterState } from "./components/TagFilters";

// Data version - increment this when pokelist.json structure changes
const DATA_VERSION = 29;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open, width }) => ({
    flexGrow: 1,
    // padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${width}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  })
);

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-start",
}));

const listD = [
  {
    id: "default-collection",
    text: "Test Collection",
    selected: true,
    pokemon: [289, 248, 468, 473, 149, 409, 464, 609, 612],
  },
];

export default function PersistentDrawerLeft({ themeMode, toggleThemeMode }) {
  const drawerWidth = 320;
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [edit, setEdit] = React.useState(false);
  const [list, setList] = React.useState(() => {
    const stored = JSON.parse(localStorage.getItem("collection")) || listD;
    // Migrate old data: add unique IDs and convert visibility format
    return stored.map((item) => ({
      ...item,
      id: item.id || uuidv4(), // Add unique ID if missing
      visibility: item.visibility || "ignore",
    }));
  });
  const [selected, setSelected] = React.useState([]);
  const [pokemonData, setPokemonData] = React.useState(() => {
    const storedVersion = localStorage.getItem("pokelistVersion");
    if (storedVersion && parseInt(storedVersion) >= DATA_VERSION) {
      const stored = localStorage.getItem("pokelist");
      if (stored) return JSON.parse(stored);
    }
    // Clear outdated cache
    localStorage.removeItem("pokelist");
    return "";
  });
  const [lastAction, setLastAction] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchRelated, setSearchRelated] = React.useState(() => {
    return JSON.parse(localStorage.getItem("searchRelated")) || false;
  });
  const [showCollectionTags, setShowCollectionTags] = React.useState(() => {
    return JSON.parse(localStorage.getItem("showCollectionTags")) || false;
  });
  const [showShiny, setShowShiny] = React.useState(() => {
    return JSON.parse(localStorage.getItem("showShiny")) || false;
  });
  const [showDynamax, setShowDynamax] = React.useState(() => {
    return JSON.parse(localStorage.getItem("showDynamax")) || false;
  });
  const [showShadow, setShowShadow] = React.useState(() => {
    return JSON.parse(localStorage.getItem("showShadow")) || false;
  });
  // Which variant hundos collections refer to: "", "shiny", "dynamax" or "dynamax+shiny"
  const variantMode = variantModeKey({ shiny: showShiny, dynamax: showDynamax, shadow: showShadow });
  const [tagVisibility, setTagVisibility] = React.useState(() => {
    return JSON.parse(localStorage.getItem("tagVisibility")) || {};
  });
  const [visiblePokemonIds, setVisiblePokemonIds] = React.useState([]);
  // Which sticky panel shows below the app bar: "info", "filters", "search" or none
  // Tag filters live here so the header's costume button and the filter pills share them
  const [filters, setFilters] = React.useState(filtersList);
  const [activePanel, setActivePanel] = React.useState(() => {
    const stored = localStorage.getItem("activePanel");
    return stored === null ? "info" : stored || null;
  });
  const [evolutionRules, setEvolutionRules] = React.useState(() => {
    // Only keep known rules, so removed ones don't linger in saved settings
    const stored = JSON.parse(localStorage.getItem("evolutionRules")) || {};
    return Object.fromEntries(
      Object.entries(defaultEvolutionRules).map(([key, value]) => [key, key in stored ? stored[key] : value])
    );
  });
  const [filterSets, setFilterSets] = React.useState(() => {
    return JSON.parse(localStorage.getItem("filterSets")) || [];
  });
  const [activeFilterSetId, setActiveFilterSetId] = React.useState(() => {
    return localStorage.getItem("activeFilterSetId") || null;
  });
  const [activeFilterSetMode, setActiveFilterSetMode] = React.useState(() => {
    return localStorage.getItem("activeFilterSetMode") || "show";
  });
  const [editingFilterSetId, setEditingFilterSetId] = React.useState(null);

  React.useEffect(() => {
    async function fetchPokemonData() {
      if (!pokemonData) {
        try {
          // First try to fetch from pokelist.json
          const pokemonResponse = await fetch("./data/pokelist.json");
          const pokemonJson = await pokemonResponse.json();
          const pokelist = pokemonJson.pokelist;

          const releasedResponse = await fetch("./data/released.json");
          const releasedData = await releasedResponse.json();

          const result = pokelist.map((item) => {
            if (releasedData.released.includes(item.id)) {
              item.released = true;
            }
            return item;
          });
          setPokemonData(result);
          localStorage.setItem("pokelist", JSON.stringify(result));
          localStorage.setItem("pokelistVersion", DATA_VERSION.toString());
        } catch (error) {
          console.error("Error fetching Pokemon data:", error);

          // If pokelist.json fails, try GraphQL
          try {
            const newPokeList = await GetDataGrahp();
            console.log("newPokeList", newPokeList);
            setPokemonData(newPokeList);
            localStorage.setItem("pokelist", JSON.stringify(newPokeList));
            localStorage.setItem("pokelistVersion", DATA_VERSION.toString());
          } catch (graphError) {
            console.error("Error fetching from GraphQL:", graphError);
          }
        }
      }
    }

    fetchPokemonData();
  }, [pokemonData]); // Added pokemonData as dependency since we check its value

  const handleDrawerClose = () => {
    setOpen(false);
  };
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  // Receives the selected collection's new { pokemon, variants } lists
  const updateSelected = (lists) => {
    const selectedIndex = list.findIndex((o) => o.selected === true);

    if (selectedIndex !== -1) {
      const previous = list[selectedIndex];
      const total = (c) =>
        (c.pokemon || []).length +
        (c.shiny || []).length +
        Object.values(c.variants || {}).reduce((sum, ids) => sum + ids.length, 0);
      // Undo restores the lists from before the last add
      setLastAction(
        total(lists) > total(previous)
          ? {
              type: "add",
              collectionIndex: selectedIndex,
              previous: { pokemon: previous.pokemon, variants: previous.variants, shiny: previous.shiny },
            }
          : null
      );

      setList(list.map((item, index) => (index === selectedIndex ? { ...item, ...lists } : item)));
    }
  };

  const handleUndo = () => {
    if (lastAction && lastAction.type === "add") {
      const { previous, collectionIndex } = lastAction;
      setList(list.map((item, index) => (index === collectionIndex ? { ...item, ...previous } : item)));
      setLastAction(null); // Only one undo.
    }
  };

  const removePokemonFromCollection = (pokemonId, collectionId) => {
    setList(
      list.map((item) =>
        item.id === collectionId ? { ...item, ...removeOwned(item, pokemonId, variantMode) } : item
      )
    );
  };

  React.useEffect(() => {
    localStorage.setItem("showCollectionTags", JSON.stringify(showCollectionTags));
  }, [showCollectionTags]);

  React.useEffect(() => {
    localStorage.setItem("showShiny", JSON.stringify(showShiny));
  }, [showShiny]);

  React.useEffect(() => {
    localStorage.setItem("showDynamax", JSON.stringify(showDynamax));
  }, [showDynamax]);

  React.useEffect(() => {
    localStorage.setItem("showShadow", JSON.stringify(showShadow));
  }, [showShadow]);

  React.useEffect(() => {
    try {
      localStorage.setItem("pokemonFilters", JSON.stringify(filters));
    } catch (e) {
      console.error("Error saving filters to localStorage:", e);
    }
  }, [filters]);

  React.useEffect(() => {
    localStorage.setItem("searchRelated", JSON.stringify(searchRelated));
  }, [searchRelated]);

  React.useEffect(() => {
    localStorage.setItem("tagVisibility", JSON.stringify(tagVisibility));
  }, [tagVisibility]);

  React.useEffect(() => {
    localStorage.setItem("evolutionRules", JSON.stringify(evolutionRules));
  }, [evolutionRules]);

  React.useEffect(() => {
    localStorage.setItem("activePanel", activePanel || "");
  }, [activePanel]);

  React.useEffect(() => {
    localStorage.setItem("filterSets", JSON.stringify(filterSets));
  }, [filterSets]);

  React.useEffect(() => {
    if (activeFilterSetId === null) {
      localStorage.removeItem("activeFilterSetId");
    } else {
      localStorage.setItem("activeFilterSetId", activeFilterSetId);
    }
  }, [activeFilterSetId]);

  React.useEffect(() => {
    localStorage.setItem("activeFilterSetMode", activeFilterSetMode);
  }, [activeFilterSetMode]);

  React.useEffect(() => {
    let obj = list.find((o) => o.selected === true);
    if (obj) {
      setSelected(obj);
    } else {
      setSelected({});
    }
    localStorage.setItem("collection", JSON.stringify(list));

    // Clean up stale collection references from filter sets when collections are deleted
    const listIds = new Set(list.map((c) => c.id));
    setFilterSets((prev) => {
      const cleaned = prev.map((fs) => {
        const newFilters = {};
        for (const [colId, role] of Object.entries(fs.filters)) {
          if (listIds.has(colId)) newFilters[colId] = role;
        }
        return Object.keys(newFilters).length !== Object.keys(fs.filters).length
          ? { ...fs, filters: newFilters }
          : fs;
      });
      return JSON.stringify(cleaned) !== JSON.stringify(prev) ? cleaned : prev;
    });
  }, [list]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Header
        width={drawerWidth}
        open={open}
        handleDrawerOpen={handleDrawerOpen}
        showCollectionTags={showCollectionTags}
        setShowCollectionTags={setShowCollectionTags}
        showShiny={showShiny}
        setShowShiny={setShowShiny}
        showDynamax={showDynamax}
        setShowDynamax={setShowDynamax}
        showShadow={showShadow}
        setShowShadow={setShowShadow}
        costumeState={filterState(filters, "costume")}
        cycleCostume={() => setFilters((current) => cycleFilter(current, "costume"))}
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
        lastAction={lastAction}
        handleUndo={handleUndo}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        searchTerm={searchTerm}
        title={selected.text || "Personal Pokedex"}
        pokemonCount={pokemonData ? visiblePokemonIds.length : null}
      />
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
          <Tooltip title="Edit Collections" placement="right">
            <IconButton onClick={() => setEdit(!edit)}>
              <EditIcon color={edit ? "primary" : "default"} />
            </IconButton>
          </Tooltip>
        </DrawerHeader>
        <Divider />
        <Sidebar
          edit={edit}
          setList={setList}
          list={list}
          pokemonData={pokemonData}
          showCollectionTags={showCollectionTags}
          tagVisibility={tagVisibility}
          setTagVisibility={setTagVisibility}
          filterSets={filterSets}
          setFilterSets={setFilterSets}
          activeFilterSetId={activeFilterSetId}
          activeFilterSetMode={activeFilterSetMode}
          editingFilterSetId={editingFilterSetId}
          setEditingFilterSetId={setEditingFilterSetId}
          evolutionRules={evolutionRules}
          visiblePokemonIds={visiblePokemonIds}
          variantMode={variantMode}
        />
      </Drawer>
      <Main open={open} width={drawerWidth}>
        <DrawerHeader />
        {pokemonData && (
          <Body
            data={pokemonData}
            list={list}
            selected={selected}
            setSelected={updateSelected}
            activePanel={activePanel}
            filters={filters}
            setFilters={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchRelated={searchRelated}
            setSearchRelated={setSearchRelated}
            showCollectionTags={showCollectionTags}
            showShiny={showShiny}
            variantMode={variantMode}
            tagVisibility={tagVisibility}
            removePokemonFromCollection={removePokemonFromCollection}
            filterSets={filterSets}
            activeFilterSetId={activeFilterSetId}
            setActiveFilterSetId={setActiveFilterSetId}
            activeFilterSetMode={activeFilterSetMode}
            setActiveFilterSetMode={setActiveFilterSetMode}
            evolutionRules={evolutionRules}
            setEvolutionRules={setEvolutionRules}
            setVisiblePokemonIds={setVisiblePokemonIds}
          />
        )}
      </Main>
    </Box>
  );
}
