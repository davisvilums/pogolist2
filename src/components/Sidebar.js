import { useState, useRef, useEffect } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import DragHandleIcon from "@mui/icons-material/DragHandle";

// import CheckIcon from "@mui/icons-material/Check";
// import ClearIcon from "@mui/icons-material/Clear";
// import RemoveIcon from "@mui/icons-material/Remove";
import IconPlus from "@mui/icons-material/ControlPoint";
import IconCross from "@mui/icons-material/CancelOutlined";
import IconCheck from "@mui/icons-material/CheckCircleOutlined";
import IconEmpty from "@mui/icons-material/RadioButtonUncheckedOutlined";

// {index % 3 === 0 ? <IconCheck /> : index % 3 === 1 ? <IconCross /> : <IconEmpty />}

const listD = [
  {
    name: "Robin",
    selected: false,
    visibility: 1,
  },
  {
    name: "Dennis",
    selected: false,
    visibility: 0,
  },
];

export default function Sidebar({ edit, updateList }) {
  const [list, setList] = useState(listD);
  const [name, setName] = useState("");

  const textInput = useRef(null);

  useEffect(() => {
    updateList(list);
  }, [list]);

  // setCollectoion((list) => [...list, "somedata"]);
  // setItem((prevCol) => [...prevCol, "somedata"]);

  const handleChange = (event) => {
    setName(event.target.value);
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };
  const handleAdd = () => {
    if (name !== "") {
      const newList = list.concat({ name: name, visibility: 0, selected: false });
      setList(newList);
      setName("");
      if (textInput.current) textInput.current.focus();
    }
  };
  const handleRemove = (index) => {
    const newList = [...list];
    newList.splice(index, 1);
    console.log(newList);
    setList(newList);
  };
  const handleSelect = (index) => {
    const newList = list.map((item) => {
      if (list[index] != item) item["selected"] = false;
      return item;
    });
    newList[index]["selected"] = !list[index]["selected"];
    setList(newList);
  };
  const handleRename = (event, index) => {
    const newList = [...list];
    // console.log(newList, index);
    newList[index]["name"] = event.target.value;
    setList(newList);
  };
  const handleVisibility = (index) => {
    const newList = [...list];
    const vis = (newList[index]["visibility"] + 1) % 3;
    // console.log(newList[index]["visibility"], vis);
    newList[index]["visibility"] = vis;
    // console.log(newList);
    setList(newList);
  };

  const btn = [
    { title: "Ignore", item: <IconEmpty /> },
    { title: "Show", item: <IconCheck color="secondary" /> },
    { title: "Hide", item: <IconCross color="error" /> },
  ];

  return (
    <>
      <List>
        {list.map((item, index) => (
          <ListItem
            button
            key={index}
            selected={item.selected}
            onClick={() => handleSelect(index)}
            secondaryAction={
              edit ? (
                <IconButton
                  aria-label="delete"
                  size="small"
                  onClick={(e) => {
                    handleRemove(index);
                    e.stopPropagation();
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    handleVisibility(index);
                    e.stopPropagation();
                  }}
                >
                  <Tooltip title={btn[item.visibility].title} placement="left">
                    {btn[item.visibility].item}
                  </Tooltip>
                </IconButton>
              )
            }
          >
            <DragHandleIcon className="drag" />
            {edit ? (
              <TextField
                hiddenLabel
                placeholder="Add Collection"
                variant="standard"
                value={item.name}
                fullWidth
                sx={{ mr: 1 }}
                onChange={(e) => handleRename(e, index)}
              />
            ) : (
              <ListItemText primary={item.name} />
            )}
          </ListItem>
        ))}
        <ListItem>
          <TextField
            hiddenLabel
            placeholder="Add Collection"
            variant="filled"
            value={name}
            size="small"
            fullWidth
            sx={{ mr: 1 }}
            onChange={handleChange}
            inputRef={textInput}
            onKeyPress={handleKeyPress}
          />
          <IconButton
            aria-label="Add"
            size="small"
            onClick={handleAdd}
            disabled={name ? false : true}
          >
            <IconPlus color={name ? "primary" : "default"} />
          </IconButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        {["All mail", "Trash", "Spam"].map((text, index) => (
          <ListItem button key={text}>
            <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
