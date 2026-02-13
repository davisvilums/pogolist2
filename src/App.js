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

// Data version - increment this when pokelist.json structure changes
const DATA_VERSION = 8;

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
    visibility: "ignore", // "ignore" | "hide" | "spotlight"
    pokemon: [289, 248, 468, 473, 149, 409, 464, 609, 612],
  },
];

export default function PersistentDrawerLeft() {
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
      visibility:
        typeof item.visibility === "string"
          ? item.visibility
          : "ignore", // Convert old boolean/number to "ignore"
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
  const [showCollectionTags, setShowCollectionTags] = React.useState(() => {
    return JSON.parse(localStorage.getItem("showCollectionTags")) || false;
  });
  const [tagVisibility, setTagVisibility] = React.useState(() => {
    return JSON.parse(localStorage.getItem("tagVisibility")) || {};
  });

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
  const updateSelected = (l) => {
    const selectedIndex = list.findIndex((o) => o.selected === true);

    if (selectedIndex !== -1) {
      const oldPokemonList = list[selectedIndex].pokemon;

      if (l.length > oldPokemonList.length) {
        const added = l.filter((p) => !oldPokemonList.includes(p));
        if (added.length > 0) {
          setLastAction({
            type: "add",
            pokemonId: added[0],
            collectionIndex: selectedIndex,
          });
        }
      } else {
        setLastAction(null);
      }

      const newList = list.map((item, index) => {
        if (index === selectedIndex) {
          return { ...item, pokemon: l };
        }
        return item;
      });
      setList(newList);
    }
  };

  const handleUndo = () => {
    if (lastAction && lastAction.type === "add") {
      const { pokemonId, collectionIndex } = lastAction;

      const newList = list.map((item, index) => {
        if (index === collectionIndex) {
          return {
            ...item,
            pokemon: item.pokemon.filter((id) => id !== pokemonId),
          };
        }
        return item;
      });

      setList(newList);
      setLastAction(null); // Only one undo.
    }
  };

  const removePokemonFromCollection = (pokemonId, collectionId) => {
    const newList = list.map((item) => {
      if (item.id === collectionId) {
        return {
          ...item,
          pokemon: item.pokemon.filter((id) => id !== pokemonId),
        };
      }
      return item;
    });
    setList(newList);
  };

  React.useEffect(() => {
    localStorage.setItem("showCollectionTags", JSON.stringify(showCollectionTags));
  }, [showCollectionTags]);

  React.useEffect(() => {
    localStorage.setItem("tagVisibility", JSON.stringify(tagVisibility));
  }, [tagVisibility]);

  React.useEffect(() => {
    let obj = list.find((o) => o.selected === true);
    if (obj) {
      setSelected(obj);
    } else {
      setSelected({});
    }
    localStorage.setItem("collection", JSON.stringify(list));
  }, [list]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Header
        width={drawerWidth}
        open={open}
        handleDrawerOpen={handleDrawerOpen}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showCollectionTags={showCollectionTags}
        setShowCollectionTags={setShowCollectionTags}
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
            lastAction={lastAction}
            handleUndo={handleUndo}
            searchTerm={searchTerm}
            showCollectionTags={showCollectionTags}
            tagVisibility={tagVisibility}
            removePokemonFromCollection={removePokemonFromCollection}
          />
        )}
      </Main>
    </Box>
  );
}
