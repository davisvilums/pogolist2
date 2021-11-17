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
import { Container, Draggable } from "react-smooth-dnd";
import { arrayMoveImmutable } from "array-move";

// import CheckIcon from "@mui/icons-material/Check";
// import ClearIcon from "@mui/icons-material/Clear";
// import RemoveIcon from "@mui/icons-material/Remove";
import IconPlus from "@mui/icons-material/ControlPoint";
import IconCross from "@mui/icons-material/CancelOutlined";
import IconCheck from "@mui/icons-material/CheckCircleOutlined";
import IconEmpty from "@mui/icons-material/RadioButtonUncheckedOutlined";
import IconFull from "@mui/icons-material/RadioButtonChecked";
import IconRemove from "@mui/icons-material/RemoveCircleOutline";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import IconBox from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckIcon from "@mui/icons-material/Check";
import ArrowRightIcon from "@mui/icons-material/ArrowForwardIos";
import RemoveIcon from "@mui/icons-material/Remove";

export default function Sidebar({ edit, list, setList, showCollections }) {
  const [text, setText] = useState("");

  const textInput = useRef(null);

  const handleChange = (event) => {
    setText(event.target.value);
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };
  const handleAdd = () => {
    if (text !== "") {
      const newList = list.concat({ text: text, visibility: false, selected: false, pokemon: [] });
      setList(newList);
      setText("");
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
    newList[index]["text"] = event.target.value;
    setList(newList);
  };
  const handleVisibility = (index) => {
    const newList = [...list];
    // const vis = (newList[index]["visibility"] + 1) % 2;
    newList[index]["visibility"] = !newList[index]["visibility"];
    setList(newList);
  };

  const onDrop = ({ removedIndex, addedIndex }) => {
    setList((list) => arrayMoveImmutable(list, removedIndex, addedIndex));
  };

  const btn = [
    { title: "Ignore", item: <IconEmpty /> },
    { title: "Show", item: <IconCheck color="secondary" /> },
    { title: "Hide", item: <IconCross color="error" /> },
  ];

  return (
    <>
      <List>
        <Container onDrop={onDrop}>
          {list.map((item, index) => (
            <Draggable key={index}>
              <ListItem
                button
                key={index}
                selected={item.selected}
                onClick={() => handleSelect(index)}
                secondaryAction={
                  edit ? (
                    <Tooltip title="Remove" placement="left">
                      <IconButton
                        aria-label="delete"
                        size="small"
                        onClick={(e) => {
                          handleRemove(index);
                          e.stopPropagation();
                        }}
                      >
                        <IconRemove color="error" />
                        {/* <DeleteIcon /> */}
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={
                        !item.visibility
                          ? showCollections
                            ? "Collection Hidden"
                            : "Collection Visible"
                          : showCollections
                          ? "Collection Visible"
                          : "Collection Hidden"
                      }
                      placement="left"
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          handleVisibility(index);
                          e.stopPropagation();
                        }}
                      >
                        {item.visibility
                          ? showCollections
                            ? btn[1].item
                            : btn[2].item
                          : btn[0].item}
                      </IconButton>
                    </Tooltip>
                  )
                }
              >
                {edit ? (
                  <DragHandleIcon className="drag" />
                ) : (
                  <>
                    {item.selected ? (
                      <IconFull color="primary" />
                    ) : (
                      <IconEmpty sx={{ opacity: 0.5 }} />
                    )}
                  </>
                )}
                {edit ? (
                  <TextField
                    hiddenLabel
                    placeholder="Add Collection"
                    variant="standard"
                    value={item.text}
                    fullWidth
                    sx={{ mr: 1, ml: 1 }}
                    onChange={(e) => handleRename(e, index)}
                  />
                ) : (
                  <ListItemText primary={item.text} sx={{ ml: 1 }} />
                )}
              </ListItem>
            </Draggable>
          ))}
        </Container>
        <ListItem>
          <TextField
            hiddenLabel
            placeholder="Add Collection"
            variant="filled"
            value={text}
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
            disabled={text ? false : true}
          >
            <IconPlus color={text ? "primary" : "default"} />
          </IconButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        {/* {["All mail", "Trash", "Spam"].map((text, index) => (
          <ListItem button key={text}>
            <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))} */}
      </List>
    </>
  );
}
