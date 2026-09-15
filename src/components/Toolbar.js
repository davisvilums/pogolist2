import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const sortOptions = [
  { id: "cp", label: "CP" },
  { id: "name", label: "Name" },
  { id: "order", label: "Order" },
  { id: "familyOrder", label: "Family" },
  { id: "id", label: "ID" },
];

// Sort options as pills; the active one is filled and shows its direction
function SortPills({ order, orderBy, onRequestSort }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
      <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5, display: { xs: "none", sm: "block" } }}>
        Sort by:
      </Typography>
      {sortOptions.map(({ id, label }) => {
        const active = orderBy === id;
        const Arrow = order === "asc" ? ArrowUpwardIcon : ArrowDownwardIcon;
        return (
          <Chip
            key={id}
            label={label}
            size="small"
            clickable
            color={active ? "primary" : "default"}
            variant={active ? "filled" : "outlined"}
            icon={active ? <Arrow fontSize="small" /> : undefined}
            onClick={(event) => onRequestSort(event, id)}
          />
        );
      })}
    </Box>
  );
}

// Custom filter set chips: click cycles show -> exclude -> off
export function FilterSetChips({
  filterSets,
  activeFilterSetId,
  setActiveFilterSetId,
  activeFilterSetMode,
  setActiveFilterSetMode,
}) {
  if (!filterSets || filterSets.length === 0) return null;
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", justifyContent: "flex-end", alignContent: "flex-start" }}>
      {filterSets.map((fs) => {
        const isActive = activeFilterSetId === fs.id;
        const mode = isActive ? activeFilterSetMode : null;
        return (
          <Chip
            key={fs.id}
            label={fs.name}
            size="small"
            color={mode === "show" ? "primary" : mode === "exclude" ? "error" : "default"}
            variant={isActive ? "filled" : "outlined"}
            onClick={() => {
              if (!isActive) {
                setActiveFilterSetId(fs.id);
                setActiveFilterSetMode("show");
              } else if (mode === "show") {
                setActiveFilterSetMode("exclude");
              } else {
                setActiveFilterSetId(null);
                setActiveFilterSetMode("show");
              }
            }}
          />
        );
      })}
    </Box>
  );
}

// Sort panel shown below the app bar
export default function SortPanel({ order, orderBy, onRequestSort }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", height: "100%", px: 2 }}>
      <SortPills order={order} orderBy={orderBy} onRequestSort={onRequestSort} />
    </Box>
  );
}
