import { styled, alpha } from "@mui/material/styles";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import LabelIcon from "@mui/icons-material/Label";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import UndoIcon from "@mui/icons-material/Undo";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

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

// Buttons that switch the sticky panel below the app bar; one open at a time
const PanelButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginLeft: theme.spacing(1),
  padding: 2,
  borderRadius: 999,
  backgroundColor: alpha(theme.palette.common.white, 0.08),
  "& .MuiIconButton-root": { opacity: 0.55 },
  "& .MuiIconButton-root.active": {
    opacity: 1,
    backgroundColor: alpha(theme.palette.common.white, 0.18),
  },
}));

const panels = [
  { id: "filters", label: "filters", Icon: FilterListIcon },
  { id: "info", label: "sort", Icon: SortIcon },
  { id: "search", label: "search", Icon: SearchIcon },
];

export default function Header(props) {
  const {
    open,
    width,
    handleDrawerOpen,
    showCollectionTags,
    setShowCollectionTags,
    showShiny,
    setShowShiny,
    lastAction,
    handleUndo,
    themeMode,
    toggleThemeMode,
    activePanel,
    setActivePanel,
    searchTerm,
    title,
    pokemonCount,
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
        {/* Selected collection and how many Pokémon are on screen */}
        <Typography variant="h6" noWrap component="div" sx={{ minWidth: 0 }}>
          {title}
        </Typography>
        {pokemonCount !== null && (
          <Typography variant="body1" component="div" sx={{ ml: 1.5, opacity: 0.7, flexShrink: 0 }}>
            {pokemonCount}
          </Typography>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          <Tooltip title="Undo last add">
            <span>
              <IconButton
                color="inherit"
                aria-label="undo last add"
                onClick={handleUndo}
                disabled={!lastAction}
                sx={{ mr: 1, "&.Mui-disabled": { color: "inherit", opacity: 0.3 } }}
              >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={showShiny ? "Show regular sprites" : "Show shiny sprites"}>
            <IconButton
              color="inherit"
              aria-label="toggle shiny sprites"
              aria-pressed={showShiny}
              onClick={() => setShowShiny(!showShiny)}
              sx={{ mr: 1 }}
            >
              <AutoAwesomeIcon
                sx={{
                  opacity: showShiny ? 1 : 0.5,
                  color: showShiny ? "#ffd54f" : "inherit",
                }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              showCollectionTags
                ? "Hide collection tags"
                : "Show collection tags"
            }
          >
            <IconButton
              color="inherit"
              aria-label="toggle collection tags"
              aria-pressed={showCollectionTags}
              onClick={() => setShowCollectionTags(!showCollectionTags)}
              sx={{ mr: 1 }}
            >
              {showCollectionTags ? (
                <LabelIcon />
              ) : (
                <LabelOutlinedIcon sx={{ opacity: 0.5 }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title={themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
            <IconButton
              color="inherit"
              aria-label="toggle dark theme"
              aria-pressed={themeMode === "dark"}
              onClick={toggleThemeMode}
            >
              {themeMode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <PanelButtons>
            {panels.map(({ id, label, Icon }) => {
              const active = activePanel === id;
              return (
                <Tooltip key={id} title={active ? `Hide ${label}` : `Show ${label}`}>
                  <IconButton
                    color="inherit"
                    aria-label={`toggle ${label}`}
                    aria-pressed={active}
                    className={active ? "active" : ""}
                    onClick={() => setActivePanel(active ? null : id)}
                  >
                    {/* Search icon turns yellow while a search is applied but its panel is hidden */}
                    <Icon sx={id === "search" && searchTerm && !active ? { color: "#ffd54f" } : undefined} />
                  </IconButton>
                </Tooltip>
              );
            })}
          </PanelButtons>
        </div>
      </Toolbar>
    </AppBar>
  );
}
