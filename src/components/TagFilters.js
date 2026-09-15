import { useEffect, useState } from "react";
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
  g1: true,
  g2: true,
  g3: true,
  g4: true,
  g5: true,
  g6: true,
  g7: true,
  g8: true,
  g9: true,
};

// Load filters from localStorage or use defaults
const getStoredFilters = () => {
  try {
    const stored = localStorage.getItem("pokemonFilters");
    if (stored) {
      // Only keep known filters, so renamed or removed ones don't linger as chips
      const parsed = JSON.parse(stored);
      return Object.fromEntries(
        Object.keys(defaultFilters).map((key) => [key, key in parsed ? parsed[key] : defaultFilters[key]])
      );
    }
  } catch (e) {
    console.error("Error loading filters from localStorage:", e);
  }
  return defaultFilters;
};

const filtersList = getStoredFilters();

// With shiny sprites on, "released"/"unreleased" refer to the shiny being out
const runFilters = (pl, filters, showShiny) => {
  const isReleased = (p) => (showShiny ? p.shinyReleased : p.released);
  // console.log(pl, filters);
  if (filters) {
    if (!filters["normal"]) pl = pl.filter((p) => p.tags && p.tags.length);
    if (!filters["mega"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("mega"));
    if (!filters["gmax"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("gmax"));
    if (!filters["totem"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("totem"));
    if (!filters["build"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("build"));
    // Hides Unown letters and Minior colours; the regular Unown and red Minior stay
    if (!filters["variants"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("variants"));
    if (!filters["legendary"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("legendary"));
    if (!filters["mythical"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("mythical"));
    if (!filters["ultra"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("ultra"));
    if (!filters["baby"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("baby"));
    if (!filters["unreleased"]) pl = pl.filter((p) => isReleased(p));
    if (!filters["released"]) pl = pl.filter((p) => !isReleased(p));
    if (!filters["g1"]) pl = pl.filter((p) => p.gen !== 1);
    if (!filters["g2"]) pl = pl.filter((p) => p.gen !== 2);
    if (!filters["g3"]) pl = pl.filter((p) => p.gen !== 3);
    if (!filters["g4"]) pl = pl.filter((p) => p.gen !== 4);
    if (!filters["g5"]) pl = pl.filter((p) => p.gen !== 5);
    if (!filters["g6"]) pl = pl.filter((p) => p.gen !== 6);
    if (!filters["g7"]) pl = pl.filter((p) => p.gen !== 7);
    if (!filters["g8"]) pl = pl.filter((p) => p.gen !== 8);
    if (!filters["g9"]) pl = pl.filter((p) => p.gen !== 9);
  }
  return pl;
};

const TagFilters = ({ filtersList, setFilters, children }) => {
  const [filters, setFilter] = useState(filtersList);

  useEffect(() => {
    if (setFilters) setFilters(filters);
    // Save filters to localStorage
    try {
      localStorage.setItem("pokemonFilters", JSON.stringify(filters));
    } catch (e) {
      console.error("Error saving filters to localStorage:", e);
    }
  }, [filters, setFilters]);

  const handleClick = (value) => {
    const nf = Object.assign({}, filters);
    nf[value] = !filters[value];
    setFilter(nf);
  };

  return (
    // <Stack direction="row" spacing={1}>
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {filters &&
        Object.keys(filters).map((f) => (
          <Chip
            key={f}
            label={f}
            size="small"
            clickable
            color={filters[f] ? "primary" : "default"}
            onClick={() => handleClick(f)}
            sx={{ margin: "2px" }}
          />
        ))}
      {children}
    </Box>
  );
};
const evolutionFilterOptions = [
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
        color={rules[key] ? "secondary" : "default"}
        onClick={() => setRules({ ...rules, [key]: !rules[key] })}
        sx={{ margin: "2px" }}
      />
    </Tooltip>
  ));

export { filtersList, TagFilters, EvolutionFilters, runFilters };
