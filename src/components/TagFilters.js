import { useEffect, useState } from "react";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";

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
      return { ...defaultFilters, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Error loading filters from localStorage:", e);
  }
  return defaultFilters;
};

const filtersList = getStoredFilters();

const runFilters = (pl, filters) => {
  // console.log(pl, filters);
  if (filters) {
    if (!filters["normal"]) pl = pl.filter((p) => p.tags && p.tags.length);
    if (!filters["mega"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("mega"));
    if (!filters["gmax"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("gmax"));
    if (!filters["legendary"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("legendary"));
    if (!filters["mythical"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("mythical"));
    if (!filters["ultra"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("ultra"));
    if (!filters["baby"])
      pl = pl.filter((p) => p.tags && !p.tags.includes("baby"));
    if (!filters["unreleased"]) pl = pl.filter((p) => p.released);
    if (!filters["released"]) pl = pl.filter((p) => !p.released);
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

const TagFilters = ({ filtersList, setFilters }) => {
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
        justifyContent: "center",
        flexWrap: "wrap",
        pb: "2px",
      }}
    >
      {filters &&
        Object.keys(filters).map((f) => (
          <Chip
            key={f}
            label={f}
            clickable
            color={filters[f] ? "primary" : "default"}
            onClick={() => handleClick(f)}
            sx={{ margin: "0 2px 5px" }}
          />
        ))}
    </Box>
  );
};
export { filtersList, TagFilters, runFilters };
