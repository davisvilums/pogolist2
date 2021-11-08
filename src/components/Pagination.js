import * as React from "react";
import Box from "@mui/material/Box";
import TablePagination from "@mui/material/TablePagination";

export default function Pagination({ length, setItemsPerPage, updatePage }) {
  const [page, setPage] = React.useState(0);
  const [totalRows, setTotalRows] = React.useState(50);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [itemsPerCol, setItemsPerCol] = React.useState(10);
  const ref = React.useRef(null);

  // Calculate on resize
  React.useEffect(() => {
    window.addEventListener("resize", handleResize);
    setTimeout(handleResize, 200);
  });

  const handleChangeRowsPerPage = (event) => {
    var items = parseInt(event.target.value, 10);
    setRowsPerPage(items);
    setPage(0);
    updatePage(0);
    setItemsPerPage(itemsPerCol * items);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    updatePage(newPage);
  };

  const handleResize = () => {
    var ic = 10;
    if (ref.current && ref.current.offsetWidth) ic = Math.floor(ref.current.offsetWidth / 99);
    if (ic !== itemsPerCol) {
      var tr = Math.ceil(length / ic);
      setItemsPerCol(ic);
      setItemsPerPage(ic * rowsPerPage);
      setTotalRows(tr);
    }
  };

  return (
    <Box ref={ref}>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalRows}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelDisplayedRows={({ from, to, count }) => {
          var to_p = to * itemsPerCol > length ? length : to * itemsPerCol;
          return `${from * itemsPerCol - (itemsPerCol - 1)}-${to_p} of ${length}`;
        }}
      />
    </Box>
  );
}
