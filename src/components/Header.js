import { styled, alpha } from "@mui/material/styles";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import LabelIcon from "@mui/icons-material/Label";

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open, width }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${width}px)`,
    marginLeft: `${width}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    // marginLeft: theme.spacing(3),
    marginLeft: "auto",
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

export default function Header(props) {
  const {
    open,
    width,
    handleDrawerOpen,
    searchTerm,
    setSearchTerm,
    showCollectionTags,
    setShowCollectionTags,
  } = props;

  return (
    <AppBar position="fixed" open={open} width={width}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={{ mr: 2, ...(open && { display: "none" }) }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div">
          Personal Pokedex
        </Typography>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          <Tooltip
            title={
              showCollectionTags
                ? "Hide collection tags"
                : "Show collection tags"
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "white",
                marginRight: "10px",
              }}
            >
              <LabelIcon
                sx={{ fontSize: 20, opacity: showCollectionTags ? 1 : 0.5 }}
              />
              <Switch
                size="small"
                checked={showCollectionTags}
                onChange={(e) => setShowCollectionTags(e.target.checked)}
                color="default"
                sx={{
                  "& .MuiSwitch-thumb": { backgroundColor: "white" },
                  "& .MuiSwitch-track": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  },
                  "& .Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "rgba(255,255,255,0.5) !important",
                  },
                }}
              />
            </div>
          </Tooltip>
          <Search sx={{ marginLeft: 0, marginRight: 0 }}>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ "& .MuiInputBase-input": { paddingRight: searchTerm ? "32px" : undefined } }}
            />
            {searchTerm && (
              <IconButton
                size="small"
                onClick={() => setSearchTerm("")}
                sx={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "inherit",
                  padding: "4px",
                }}
              >
                <ClearIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Search>
        </div>
      </Toolbar>
    </AppBar>
  );
}
