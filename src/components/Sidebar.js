import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import DataImportExport from "./DataImportExport";

import IconPlus from "@mui/icons-material/ControlPoint";
import IconCross from "@mui/icons-material/CancelOutlined";
import IconEmpty from "@mui/icons-material/RadioButtonUncheckedOutlined";
import IconFull from "@mui/icons-material/RadioButtonChecked";
import IconRemove from "@mui/icons-material/RemoveCircleOutline";
import StarIcon from "@mui/icons-material/Star";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// Visibility states: "ignore" | "hide" | "spotlight"
const visibilityStates = {
  ignore: {
    title: "Ignore (click to hide)",
    icon: <IconEmpty sx={{ opacity: 0.5 }} />,
    next: "hide"
  },
  hide: {
    title: "Hidden (click to spotlight)",
    icon: <VisibilityOffIcon color="error" />,
    next: "spotlight"
  },
  spotlight: {
    title: "Spotlight (click to ignore)",
    icon: <StarIcon sx={{ color: "#ffc107" }} />,
    next: "ignore"
  },
};

function SortableItem({
  id,
  item,
  index,
  edit,
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
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  };

  // Get current visibility state (default to "ignore" for backwards compatibility)
  const currentVisibility = item.visibility || "ignore";
  const visState = visibilityStates[currentVisibility] || visibilityStates.ignore;

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
          <Tooltip title={visState.title} placement="left">
            <IconButton
              size="small"
              onClick={(e) => {
                handleVisibility(index);
                e.stopPropagation();
              }}
            >
              {visState.icon}
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

// Extract first name only (remove regional variants like alola, galar, spring, etc.)
function getFirstName(name) {
  if (!name) return "";
  // Split by hyphen or space and take only the first part
  const parts = name.toLowerCase().split(/[-\s]/);
  // Capitalize first letter
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

function SelectedPokemonNames({ list, pokemonData }) {
  // Find the selected collection
  const selectedCollection = list.find((item) => item.selected);

  // Get Pokemon names for the selected collection (only visible ones)
  const getSelectedNames = () => {
    if (!selectedCollection || !selectedCollection.pokemon || !pokemonData) {
      return "";
    }

    // Check for spotlight collection
    const spotlightCollection = list.find((c) => c.visibility === "spotlight");

    // Build set of hidden Pokemon IDs
    const hiddenPokemonIds = new Set();
    list.forEach((collection) => {
      if (collection.visibility === "hide" && collection.pokemon) {
        collection.pokemon.forEach((id) => hiddenPokemonIds.add(id));
      }
    });

    const names = selectedCollection.pokemon
      .filter((id) => {
        // If spotlight is active, only show Pokemon that are in the spotlight collection
        if (spotlightCollection) {
          return spotlightCollection.pokemon?.includes(id);
        }
        // Otherwise, exclude hidden Pokemon
        return !hiddenPokemonIds.has(id);
      })
      .map((id) => {
        const pokemon = pokemonData.find((p) => p.id === id);
        return pokemon ? getFirstName(pokemon.name) : null;
      })
      .filter(Boolean);

    return names.join(", ");
  };

  return (
    <Box sx={{ p: 2, pt: 0 }}>
      <TextField
        multiline
        minRows={3}
        maxRows={12}
        value={getSelectedNames()}
        placeholder="Selected Pokemon names will appear here"
        variant="outlined"
        size="small"
        fullWidth
        InputProps={{
          readOnly: true,
          sx: { resize: "vertical", overflow: "auto" },
        }}
      />
    </Box>
  );
}

export default function Sidebar({
  edit,
  list,
  setList,
  pokemonData,
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
        id: uuidv4(),
        text: text,
        visibility: "ignore", // New default state
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
    setList(newList);
  };
  const handleSelect = (index) => {
    const newList = list.map((item) => {
      if (list[index] !== item) item["selected"] = false;
      return item;
    });
    newList[index]["selected"] = !list[index]["selected"];
    setList(newList);
  };
  const handleRename = (event, index) => {
    const newList = [...list];
    newList[index]["text"] = event.target.value;
    setList(newList);
  };
  const handleVisibility = (index) => {
    const newList = [...list];
    const currentVis = newList[index]["visibility"] || "ignore";
    const nextVis = visibilityStates[currentVis]?.next || "ignore";

    // If setting to spotlight, clear other spotlights first
    if (nextVis === "spotlight") {
      newList.forEach((item, i) => {
        if (i !== index && item.visibility === "spotlight") {
          item.visibility = "ignore";
        }
      });
    }

    newList[index]["visibility"] = nextVis;
    setList(newList);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure all items have stable IDs (migration for existing data)
  const getItemId = (item, index) => item.id || `legacy-${index}`;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = list.findIndex((item, i) => getItemId(item, i) === active.id);
      const newIndex = list.findIndex((item, i) => getItemId(item, i) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        // Migrate items to have stable IDs if they don't have them
        const newList = arrayMove(list, oldIndex, newIndex).map((item) => {
          if (!item.id) {
            return { ...item, id: uuidv4() };
          }
          return item;
        });
        setList(newList);
      }
    }
  };

  return (
    <>
      <List>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={list.map((item, index) => getItemId(item, index))}
            strategy={verticalListSortingStrategy}
          >
            {list.map((item, index) => (
              <SortableItem
                key={getItemId(item, index)}
                id={getItemId(item, index)}
                item={item}
                index={index}
                edit={edit}
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
      <SelectedPokemonNames list={list} pokemonData={pokemonData} />
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
