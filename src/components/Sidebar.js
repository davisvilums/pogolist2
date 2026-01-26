import { useState, useRef } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DataImportExport from "./DataImportExport";

import IconPlus from "@mui/icons-material/ControlPoint";
import IconCross from "@mui/icons-material/CancelOutlined";
import IconCheck from "@mui/icons-material/CheckCircleOutlined";
import IconEmpty from "@mui/icons-material/RadioButtonUncheckedOutlined";
import IconFull from "@mui/icons-material/RadioButtonChecked";
import IconRemove from "@mui/icons-material/RemoveCircleOutline";

const btn = [
  { title: "Ignore", item: <IconEmpty /> },
  { title: "Show", item: <IconCheck color="secondary" /> },
  { title: "Hide", item: <IconCross color="error" /> },
];

function SortableItem({
  id,
  item,
  index,
  edit,
  showCollections,
  handleSelect,
  handleRemove,
  handleVisibility,
  handleRename,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      button
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
        <DragHandleIcon className="drag" {...attributes} {...listeners} />
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
  );
}

export default function Sidebar({
  edit,
  list,
  setList,
  showCollections,
  focusedCollection,
  handleFocusCollection,
}) {
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
      const newList = list.concat({
        text: text,
        visibility: false,
        selected: false,
        pokemon: [],
      });
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = list.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = list.findIndex((_, i) => `item-${i}` === over.id);
      setList(arrayMove(list, oldIndex, newIndex));
    }
  };

  return (
    <>
      <List>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={list.map((_, index) => `item-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            {list.map((item, index) => (
              <SortableItem
                key={`item-${index}`}
                id={`item-${index}`}
                item={item}
                index={index}
                edit={edit}
                showCollections={showCollections}
                handleSelect={handleSelect}
                handleRemove={handleRemove}
                handleVisibility={handleVisibility}
                handleRename={handleRename}
              />
            ))}
          </SortableContext>
        </DndContext>
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
      <DataImportExport />
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
