import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

const defaultFilters = {
  released: true,
  unreleased: false,
  normal: true,
  legendary: false,
  mythical: false,
  ultra: false,
  mega: false,
  baby: true,
  gmax: false,
  totem: false,
  build: false,
  variants: false,
  costume: false,
  g1: true,
  g2: true,
  g3: true,
  g4: true,
  g5: true,
  g6: true,
  g7: true,
  g8: true,
  g9: true,
  // The one pill set to "only" (or null)
  only: null,
};

const chipKeys = Object.keys(defaultFilters).filter((key) => key !== "only");

// Pills belong to groups; "only" replaces its own group's on/off pills
const STATUS = ["released", "unreleased"];
const KINDS = ["normal", "legendary", "mythical", "ultra", "mega", "baby", "gmax", "totem", "build", "variants", "costume"];
const GENERATIONS = ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9"];

// Load filters from localStorage or use defaults
const getStoredFilters = () => {
  try {
    const stored = localStorage.getItem("pokemonFilters");
    if (stored) {
      // Only keep known filters, so renamed or removed ones don't linger as chips
      const parsed = JSON.parse(stored);
      const filters = Object.fromEntries(
        Object.keys(defaultFilters).map((key) => [key, key in parsed ? parsed[key] : defaultFilters[key]])
      );
      if (!chipKeys.includes(filters.only)) filters.only = null;
      return filters;
    }
  } catch (e) {
    console.error("Error loading filters from localStorage:", e);
  }
  return defaultFilters;
};

const filtersList = getStoredFilters();

// With shiny sprites on, "released"/"unreleased" refer to the shiny being out
const runFilters = (pl, filters, showShiny) => {
  if (!filters) return pl;
  const isReleased = (p) => (showShiny ? p.shinyReleased : p.released);
  const hasTag = (p, tag) => !!(p.tags && p.tags.includes(tag));
  // Whether a Pokemon belongs to a pill
  const matches = (p, key) => {
    if (key === "released") return isReleased(p);
    if (key === "unreleased") return !isReleased(p);
    if (key === "normal") return !(p.tags && p.tags.length);
    if (GENERATIONS.includes(key)) return p.gen === Number(key.slice(1));
    return hasTag(p, key);
  };
  const only = filters.only;
  const groupOf = (key) => [STATUS, KINDS, GENERATIONS].find((group) => group.includes(key));

  // "Only" pill: keep just its Pokemon, and its group's other pills don't apply
  if (only) pl = pl.filter((p) => matches(p, only));
  [STATUS, KINDS, GENERATIONS]
    .filter((group) => group !== groupOf(only))
    .forEach((group) =>
      group
        .filter((key) => !filters[key])
        .forEach((key) => {
          pl = pl.filter((p) => !matches(p, key));
        })
    );
  return pl;
};

const pillTooltip = { on: "Shown · click to hide", off: "Hidden · click to show only these", only: "Showing only these · click to include normally" };

// Filters cycle on -> off -> only -> on (used by the pills and the header's costume button)
export const cycleFilter = (filters, key) => {
  if (filters.only === key) return { ...filters, only: null, [key]: true };
  if (filters[key]) return { ...filters, [key]: false };
  return { ...filters, only: key };
};

export const filterState = (filters, key) => (filters.only === key ? "only" : filters[key] ? "on" : "off");

const TagFilters = ({ filters, setFilters, children }) => {
  const handleClick = (key) => setFilters((current) => cycleFilter(current, key));
  const stateOf = (key) => filterState(filters, key);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {chipKeys.map((key) => {
        const state = stateOf(key);
        return (
          <Tooltip key={key} title={pillTooltip[state]} enterDelay={800} disableInteractive>
            <Chip
              label={state === "only" ? `only ${key}` : key}
              size="small"
              clickable
              color={state === "only" ? "warning" : state === "on" ? "primary" : "default"}
              onClick={() => handleClick(key)}
              sx={{ margin: "2px" }}
            />
          </Tooltip>
        );
      })}
      {children}
    </Box>
  );
};
const evolutionFilterOptions = [
  {
    key: "branchingFamilies",
    label: "branching evolutions",
    tooltip: "Only families where a Pokémon can evolve more than one way",
  },
  {
    key: "regionalFamilies",
    label: "regional forms",
    tooltip: "Only families with an Alolan, Galarian, Hisuian or Paldean form",
  },
  {
    key: "lowestStageOnly",
    label: "lowest stage only",
    tooltip: "When a Pokémon and its evolution are both shown, only show the earlier stage",
  },
];

// Rendered as extra chips at the end of the TagFilters row
const EvolutionFilters = ({ rules, setRules }) =>
  evolutionFilterOptions.map(({ key, label, tooltip }) => (
    <Tooltip key={key} title={tooltip}>
      <Chip
        label={label}
        size="small"
        clickable
        variant={rules[key] ? "filled" : "outlined"}
        color={rules[key] ? "warning" : "default"}
        onClick={() => setRules((current) => ({ ...current, [key]: !current[key] }))}
        sx={{ margin: "2px" }}
      />
    </Tooltip>
  ));

export { filtersList, TagFilters, EvolutionFilters, runFilters };
