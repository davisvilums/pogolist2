import * as React from "react";
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
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import IconCross from "@mui/icons-material/CancelOutlined";
import IconCheck from "@mui/icons-material/CheckCircleOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import GetDataGrahp from "./data/GetDataGrahp";

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
    text: "Test Collection",
    selected: true,
    visibility: 0,
    pokemon: [289, 248, 468, 473, 149, 409, 464, 609, 612],
  },
];

export default function PersistentDrawerLeft() {
  const drawerWidth = 320;
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [edit, setEdit] = React.useState(false);
  const [list, setList] = React.useState(
    JSON.parse(localStorage.getItem("collection")) || listD
  );
  const [selected, setSelected] = React.useState([]);
  const [showCollections, setCollections] = React.useState(false);
  const [focusedCollection, setFocusedCollection] = React.useState(null);
  const [pokemonData, setPokemonData] = React.useState(
    JSON.parse(localStorage.getItem("pokelist")) || ""
  );
  const [lastAction, setLastAction] = React.useState(null);

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
        } catch (error) {
          console.error("Error fetching Pokemon data:", error);

          // If pokelist.json fails, try GraphQL
          try {
            const newPokeList = await GetDataGrahp();
            console.log("newPokeList", newPokeList);
            setPokemonData(newPokeList);
            localStorage.setItem("pokelist", JSON.stringify(newPokeList));
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
  const handleCollections = () => {
    setCollections(!showCollections);
    if (focusedCollection) setFocusedCollection(null);
  };
  const handleFocusCollection = (index) => {
    setFocusedCollection(focusedCollection === index ? null : index);
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
          <Tooltip title="Edit Collections" placement="left">
            <IconButton sx={{}} onClick={() => setEdit(!edit)}>
              <EditIcon color={edit ? "primary" : "default"} />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              focusedCollection !== null
                ? "Show all collections"
                : "Focus on current collection"
            }
            placement="right"
          >
            <span>
              <IconButton
                onClick={() => {
                  const selectedIndex = list.findIndex((item) => item.selected);
                  if (selectedIndex !== -1) {
                    handleFocusCollection(selectedIndex);
                  }
                }}
                disabled={!list.some((item) => item.selected)}
              >
                {focusedCollection !== null ? (
                  <VisibilityOffIcon />
                ) : (
                  <VisibilityIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Typography
            variant="p"
            id="tableTitle"
            sx={{ m: "0 auto 0 20px" }}
          ></Typography>
          <Box
            sx={{
              mr: "4px",
              order: { xs: 1, sm: "initial" },
              width: { xs: "100%", sm: "initial" },
              display: "flex",
              gap: 0.5,
            }}
          >
            <Tooltip
              title={
                showCollections
                  ? "Hide selected collections"
                  : "Show selected collections"
              }
              placement="right"
            >
              <Button onClick={handleCollections}>
                {showCollections ? "Hide" : "Show"}
                &nbsp;
                {showCollections ? (
                  <IconCross color="error" />
                ) : (
                  <IconCheck color="secondary" />
                )}
              </Button>
            </Tooltip>
          </Box>
        </DrawerHeader>
        <Divider />
        <Sidebar
          edit={edit}
          setList={setList}
          list={list}
          showCollections={showCollections}
          focusedCollection={focusedCollection}
          handleFocusCollection={handleFocusCollection}
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
            showCollections={showCollections}
            toggleCollections={handleCollections}
            lastAction={lastAction}
            handleUndo={handleUndo}
            focusedCollection={focusedCollection}
          />
        )}
      </Main>
    </Box>
  );
}
