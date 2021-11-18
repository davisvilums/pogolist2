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
  const [list, setList] = React.useState(JSON.parse(localStorage.getItem("collection")) || listD);
  const [update, setUpdate] = React.useState(true);
  const [selected, setSelected] = React.useState([]);
  const [showCollections, setCollections] = React.useState(false);
  const [pokemonData, setPokemonData] = React.useState(
    JSON.parse(localStorage.getItem("pokelist")) || ""
  );

  React.useEffect(async () => {
    if (!pokemonData) {
      var pokelist;
      fetch("./data/pokelist.json")
        .then((response) => response.json())
        .then((data) => {
          pokelist = data.pokelist;

          fetch("./data/released.json")
            .then((response) => response.json())
            .then((data) => {
              const result = pokelist.map((item) => {
                // if (data.released.includes(item.id)) item.released = true;
                item.released = data.released.includes(item.id);
                return item;
              });
              setPokemonData(result);
              // localStorage.setItem("pokelist", JSON.stringify(result));
            });
        });
    }
    // if (!pokemonData) {
    //   let newPokeList = await GetDataGrahp();
    //   setPokemonData(newPokeList);
    //   localStorage.setItem("pokelist", JSON.stringify(newPokeList));
    // }
  }, []);

  const handleDrawerClose = () => {
    setOpen(false);
  };
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleCollections = () => {
    setCollections(!showCollections);
  };
  const updateSelected = (l) => {
    let obj = list.find((o) => o.selected === true);

    if (obj) {
      let i = list.indexOf(obj);
      list[i].pokemon = l;
      setList(list);
      setUpdate(!update);
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
  }, [list, update]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Header width={drawerWidth} open={open} handleDrawerOpen={handleDrawerOpen} />
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
            {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          <Tooltip title="Edit Collections" placement="left">
            <IconButton sx={{}} onClick={() => setEdit(!edit)}>
              <EditIcon color={edit ? "primary" : "default"} />
            </IconButton>
          </Tooltip>
          <Typography variant="p" id="tableTitle" sx={{ m: "0 auto 0 20px" }}>
            Collections
          </Typography>
          <Box
            sx={{
              // ml: "auto",
              mr: "6px",
              order: { xs: 1, sm: "initial" },
              width: { xs: "100%", sm: "initial" },
            }}
          >
            <Tooltip
              title={showCollections ? "Hide selected collections" : "Show selected collections"}
              placement="right"
            >
              <Button onClick={handleCollections}>
                {showCollections ? "Hide" : "Show"}
                &nbsp;
                {showCollections ? <IconCross color="error" /> : <IconCheck color="secondary" />}
              </Button>
            </Tooltip>
          </Box>
        </DrawerHeader>
        <Divider />
        <Sidebar edit={edit} setList={setList} list={list} showCollections={showCollections} />
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
          />
        )}
      </Main>
    </Box>
  );
}
