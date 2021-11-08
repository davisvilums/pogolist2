import * as React from "react";
import TablePagination from "@mui/material/TablePagination";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import PokemonCard from "./PokemonCard";
import { TagFilters, filtersList, runFilters } from "./TagFilters";
import Toolbar from "./Toolbar";
import Pagination from "./Pagination";

const PokemonWrap = styled("div")`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`;

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export default function Body(props) {
  const [order, setOrder] = React.useState("desc");
  const [orderBy, setOrderBy] = React.useState("cp");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [itemsPerPage, setItemsPerPage] = React.useState(50);
  const [itemsPerCol, setItemsPerCol] = React.useState(10);
  const [totalRows, setTotalRows] = React.useState(50);
  const [showfilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState(filtersList);
  const [rows, setRows] = React.useState(props.data);
  const [open, setOpen] = React.useState(props.open);
  const ref = React.useRef(null);

  React.useEffect(() => {
    setOpen(props.open);
  }, [props.open]);

  React.useMemo(() => {
    if (!rows) return "";
    let pl = props.data;

    pl = runFilters(pl, filters);

    setRows(pl);
  }, [filters]);

  React.useEffect(() => {
    console.log("rows", rows);
  }, [rows]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <Toolbar
        numSelected={selected.length}
        rowCount={rows.length}
        handleSelectAllClick={handleSelectAllClick}
        handleRequestSort={handleRequestSort}
        orderBy={orderBy}
        order={order}
        toggleFilters={() => setShowFilters(!showfilters)}
      />
      {showfilters && <TagFilters filtersList={filters} setFilters={setFilters} />}

      <PokemonWrap ref={ref}>
        {stableSort(rows, getComparator(order, orderBy))
          .slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage)
          .map((row, index) => {
            const isItemSelected = isSelected(row.name);

            return (
              <PokemonCard
                pokemon={row}
                key={row.name}
                select={(event) => handleClick(event, row.name)}
                key={row.name}
                selected={isItemSelected}
              />
            );
          })}
      </PokemonWrap>
      <Pagination length={rows.length} setItemsPerPage={setItemsPerPage} updatePage={setPage} />
    </Paper>
  );
}
