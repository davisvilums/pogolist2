import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import TableC from "@mui/material/Table";
import TableCellC from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import { styled } from "@mui/material/styles";
import Alert from "@mui/material/Alert";

const Table = styled(TableC)`
  width: initial;
`;
const TableCell = styled(TableCellC)`
  border-bottom: none;
`;
const headCells = [
  {
    id: "cp",
    numeric: true,
    disablePadding: false,
    label: "CP",
  },
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "Name",
  },
  {
    id: "order",
    numeric: true,
    disablePadding: false,
    label: "Order",
  },
  {
    id: "id",
    numeric: true,
    disablePadding: false,
    label: "ID",
  },
];

function EnhancedTableHead({ order, orderBy, onRequestSort }) {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ display: { xs: "none", sm: "block" } }}>Sort&nbsp;by:</TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align="right"
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default function ToolbarPoke(props) {
  const {
    numSelected,
    rowCount,
    handleSelectAllClick,
    handleRequestSort,
    warning,
    order,
    orderBy,
    toggleFilters,
    title,
  } = props;

  return (
    <Toolbar
      sx={{
        pl: { xs: 1, sm: 3 },
        pr: { xs: 1, sm: 3 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
        flexWrap: { xs: "wrap", sm: "initial" },
      }}
    >
      <Box sx={{ mr: "auto", display: "flex", alignItems: "center" }}>
        {/* <Checkbox
          color="primary"
          indeterminate={numSelected > 0 && numSelected < rowCount}
          checked={rowCount > 0 && numSelected === rowCount}
          onChange={handleSelectAllClick}
          inputProps={{
            "aria-label": "select all desserts",
          }}
        /> */}
        {warning ? (
          <Alert severity="warning"> {warning}</Alert>
        ) : numSelected > 0 ? (
          <Typography color="inherit" variant="subtitle1" component="div">
            {numSelected} selected
          </Typography>
        ) : (
          <Typography variant="h6" id="tableTitle" component="div">
            {title}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          ml: "auto",
          order: { xs: 1, sm: "initial" },
          width: { xs: "100%", sm: "initial" },
        }}
      >
        <TableContainer>
          <Table
            aria-labelledby="tableTitle"
            size="small"
            sx={{
              padding: "0 15px",
              width: "inital !important",
              border: "none",
            }}
          >
            <EnhancedTableHead
              numSelected={numSelected}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rowCount}
            />
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ ml: 2 }}>
        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton onClick={toggleFilters}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Toolbar>
  );
}
