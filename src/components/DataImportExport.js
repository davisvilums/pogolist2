import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import GetAppIcon from "@mui/icons-material/GetApp";
import PublishIcon from "@mui/icons-material/Publish";

export default function DataImportExport() {
  const importData = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      localStorage.setItem("collection", e.target.result);
      window.location.reload(false);
    };
  };
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Button
        // onClick={() => downloadData()}
        color="primary"
        variant="contained"
        href={`data:text/json;charset=utf-8,${encodeURIComponent(
          localStorage.getItem("collection")
        )}`}
        download="collections.json"
      >
        <GetAppIcon />
        &nbsp;&nbsp;&nbsp;Export Collections
      </Button>
      <Button color="primary" variant="contained" component="label">
        <PublishIcon />
        &nbsp;&nbsp;&nbsp;Import Collections
        <input type="file" onChange={importData} hidden />
      </Button>
    </Stack>
  );
}
