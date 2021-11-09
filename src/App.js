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

export default function PersistentDrawerLeft() {
  const drawerWidth = 320;
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [edit, setEdit] = React.useState(false);
  const [list, setList] = React.useState(false);
  const data = JSON.parse(localStorage.getItem("pokelist"));

  const handleDrawerClose = () => {
    setOpen(false);
  };
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const updateList = (l) => {
    setList(l);
  };
  const updateSelected = (l) => {
    let obj = list.find((o) => o.selected === true);

    if (obj) {
      let i = list.indexOf(obj);
      list[i].pokemon = l;
    }
    // console.log("l", list, obj, l);
    setList(list);
    console.log(list);
  };

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
            <IconButton sx={{ ml: "auto" }} onClick={() => setEdit(!edit)}>
              <EditIcon color={edit ? "primary" : "default"} />
            </IconButton>
          </Tooltip>
        </DrawerHeader>
        <Divider />
        <Sidebar edit={edit} updateList={updateList} />
      </Drawer>
      <Main open={open} width={drawerWidth}>
        <DrawerHeader />
        <Body data={data} list={list} updateSelected={updateSelected} />
      </Main>
    </Box>
  );
}
