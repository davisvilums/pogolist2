import { useState, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
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
import {
  buildAncestors,
  buildDescendants,
  getCollectionIds,
  applyEvolutionRules,
  applyFamilyRules,
} from "../data/evolution";
import { getOwnedIds } from "../data/collections";

import IconPlus from "@mui/icons-material/ControlPoint";
import IconCross from "@mui/icons-material/CancelOutlined";
import IconEmpty from "@mui/icons-material/RadioButtonUncheckedOutlined";
import IconFull from "@mui/icons-material/RadioButtonChecked";
import IconRemove from "@mui/icons-material/RemoveCircleOutline";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import StarIcon from "@mui/icons-material/Star";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LabelIcon from "@mui/icons-material/Label";
import LabelOffIcon from "@mui/icons-material/LabelOff";
import DeleteIcon from "@mui/icons-material/Delete";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AddIcon from "@mui/icons-material/Add";

// Tooltips for the small icons in a collection row: shown above the icon so they
// don't cover the neighbouring button, and they never block clicks
const rowTooltipProps = { placement: "top", disableInteractive: true, enterDelay: 600 };

function SortableItem({
  id,
  item,
  index,
  edit,
  handleSelect,
  handleRemove,
  handleRename,
  showCollectionTags,
  tagVisible,
  onToggleTagVisibility,
  onCycleVisibility,
  onToggleRelated,
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
          <div style={{ display: "flex", alignItems: "center" }}>
            {showCollectionTags && (
              <Tooltip title={tagVisible ? "Hide tag" : "Show tag"} {...rowTooltipProps}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTagVisibility(item.id);
                  }}
                >
                  {tagVisible ? (
                    <LabelIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  ) : (
                    <LabelOffIcon sx={{ fontSize: 18, opacity: 0.4 }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {item.visibility !== "ignore" && (
              <Tooltip
                title={
                  item.related
                    ? item.visibility === "show"
                      ? "Evolutions and forms included (all evolution paths, regional and other forms)"
                      : "Evolutions included (single evolution paths only)"
                    : item.visibility === "show"
                      ? "Include evolutions and forms (all evolution paths, regional and other forms)"
                      : "Include evolutions (single evolution paths only)"
                }
                {...rowTooltipProps}
              >
                <IconButton
                  size="small"
                  aria-label="include related Pokémon"
                  aria-pressed={!!item.related}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRelated(item.id);
                  }}
                >
                  <AddIcon
                    sx={
                      item.related
                        ? { color: item.visibility === "show" ? "warning.main" : "error.main" }
                        : { opacity: 0.35 }
                    }
                  />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip
              title={
                item.visibility === "show" ? "Showing" :
                item.visibility === "hide" ? "Hiding" : "No filter"
              }
              {...rowTooltipProps}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onCycleVisibility(item.id);
                }}
              >
                {item.visibility === "show" ? (
                  <StarIcon sx={{ color: "warning.main" }} />
                ) : item.visibility === "hide" ? (
                  <VisibilityOffIcon sx={{ color: "error.main" }} />
                ) : (
                  <CircleOutlinedIcon sx={{ opacity: 0.4 }} />
                )}
              </IconButton>
            </Tooltip>
          </div>
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

// Whether the selected collection is currently hidden, so the grid shows what is
// missing from it (collection set to "hide", or hidden/excluded by the filter set)
function isCollectionHidden(collection, filterSets, activeFilterSetId, activeFilterSetMode) {
  if (collection.visibility === "hide") return true;
  const active = filterSets.find((fs) => fs.id === activeFilterSetId);
  if (!active) return false;
  const role = active.filters[collection.id];
  const inverted = active.invert !== (activeFilterSetMode === "exclude");
  return role === "hide" || (role === "show" && inverted);
}

const toNameList = (ids, pokemonData) => {
  const byId = new Map(pokemonData.map((p) => [p.id, p]));
  const names = ids.map((id) => byId.get(id)).filter(Boolean).map((p) => getFirstName(p.name));
  return [...new Set(names)].sort((a, b) => a.localeCompare(b)).join(", ");
};

function SelectedPokemonNames({ list, pokemonData, filterSets, activeFilterSetId, activeFilterSetMode, evolutionRules, visiblePokemonIds, variantMode }) {
  const selectedCollection = list.find((item) => item.selected);
  const ancestors = useMemo(() => buildAncestors(pokemonData), [pokemonData]);
  const descendants = useMemo(() => buildDescendants(pokemonData), [pokemonData]);
  const showOnScreen =
    selectedCollection &&
    isCollectionHidden(selectedCollection, filterSets, activeFilterSetId, activeFilterSetMode);

  const getSelectedNames = () => {
    if (!selectedCollection || !selectedCollection.pokemon || !pokemonData) {
      return "";
    }

    // The selected collection is hidden: list what's on screen instead
    if (showOnScreen) return toNameList(visiblePokemonIds || [], pokemonData);

    // Per-collection visibility, including related descendants
    const visShowCols = list.filter((c) => c.visibility === "show");
    const visShowIds = new Set(visShowCols.flatMap((c) => getCollectionIds(c, descendants, variantMode)));
    const visHideIds = new Set(
      list.filter((c) => c.visibility === "hide").flatMap((c) => getCollectionIds(c, descendants, variantMode))
    );
    const owned = (c, id) => getOwnedIds(c, variantMode).includes(id);

    const visibleIds = getOwnedIds(selectedCollection, variantMode)
      .filter((id) => {
        if (visShowCols.length > 0 && !visShowIds.has(id)) return false;
        if (visHideIds.has(id)) return false;

        // Active filter set
        const active = filterSets.find((fs) => fs.id === activeFilterSetId);
        if (!active) return true;

        const showCols = list.filter((c) => active.filters[c.id] === "show");
        const hideCols = list.filter((c) => active.filters[c.id] === "hide");

        if (hideCols.some((c) => owned(c, id))) return false;

        if (showCols.length > 0) {
          let inShow;
          if (active.mode === "and") {
            inShow = showCols.every((c) => owned(c, id));
          } else {
            inShow = showCols.some((c) => owned(c, id));
          }
          const effectiveInvert = active.invert !== (activeFilterSetMode === "exclude");
          return effectiveInvert ? !inShow : inShow;
        }

        return true;
      });

    const byId = new Map(pokemonData.map((p) => [p.id, p]));
    const familyIds = applyFamilyRules(visibleIds.map((id) => byId.get(id)).filter(Boolean), evolutionRules).map((p) => p.id);
    return toNameList(applyEvolutionRules(familyIds, evolutionRules, ancestors), pokemonData);
  };

  return (
    <Box sx={{ p: 2, pt: 0 }}>
      {showOnScreen && (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
          "{selectedCollection.text}" is hidden, so this lists the Pokémon on screen
        </Typography>
      )}
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

function FilterSetEditor({ filterSet, list, filterSets, setFilterSets }) {
  const updateFilterSet = (updates) => {
    setFilterSets((prev) =>
      prev.map((fs) => (fs.id === filterSet.id ? { ...fs, ...updates } : fs))
    );
  };

  const cycleRole = (collectionId) => {
    const current = filterSet.filters[collectionId] || "ignore";
    const next = current === "ignore" ? "show" : current === "show" ? "hide" : "ignore";
    const newFilters = { ...filterSet.filters };
    if (next === "ignore") {
      delete newFilters[collectionId];
    } else {
      newFilters[collectionId] = next;
    }
    updateFilterSet({ filters: newFilters });
  };

  return (
    <Box sx={{ pl: 2, pr: 2, pb: 1 }}>
      {list.map((col) => {
        const role = filterSet.filters[col.id] || "ignore";
        return (
          <Box
            key={col.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 0.25,
            }}
          >
            <Typography variant="body2" noWrap sx={{ flex: 1, mr: 1 }}>
              {col.text}
            </Typography>
            <Tooltip
              title={role === "ignore" ? "Ignore" : role === "show" ? "Show" : "Hide"}
              placement="left"
            >
              <IconButton size="small" onClick={() => cycleRole(col.id)}>
                {role === "show" ? (
                  <FilterAltIcon sx={{ color: "warning.main" }} />
                ) : role === "hide" ? (
                  <VisibilityOffIcon sx={{ color: "error.main" }} />
                ) : (
                  <FilterAltOutlinedIcon sx={{ opacity: 0.3 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}
      <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Chip
          label="OR"
          size="small"
          color={filterSet.mode === "or" ? "primary" : "default"}
          variant={filterSet.mode === "or" ? "filled" : "outlined"}
          onClick={() => updateFilterSet({ mode: "or" })}
        />
        <Chip
          label="AND"
          size="small"
          color={filterSet.mode === "and" ? "primary" : "default"}
          variant={filterSet.mode === "and" ? "filled" : "outlined"}
          onClick={() => updateFilterSet({ mode: "and" })}
        />
        <Chip
          label="Invert"
          size="small"
          icon={<SwapHorizIcon />}
          color={filterSet.invert ? "error" : "default"}
          variant={filterSet.invert ? "filled" : "outlined"}
          onClick={() => updateFilterSet({ invert: !filterSet.invert })}
        />
      </Box>
    </Box>
  );
}

export default function Sidebar({
  edit,
  list,
  setList,
  pokemonData,
  showCollectionTags,
  tagVisibility,
  setTagVisibility,
  filterSets,
  setFilterSets,
  activeFilterSetId,
  activeFilterSetMode,
  editingFilterSetId,
  setEditingFilterSetId,
  evolutionRules,
  visiblePokemonIds,
  variantMode,
}) {
  const [text, setText] = useState("");
  const [filterSetName, setFilterSetName] = useState("");

  const textInput = useRef(null);
  const filterSetInput = useRef(null);

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

  const handleCycleVisibility = (collectionId) => {
    const newList = list.map((item) => {
      if (item.id === collectionId) {
        const next =
          item.visibility === "ignore" ? "show" :
          item.visibility === "show" ? "hide" : "ignore";
        return { ...item, visibility: next };
      }
      return item;
    });
    setList(newList);
  };

  const handleToggleRelated = (collectionId) => {
    setList(
      list.map((item) =>
        item.id === collectionId ? { ...item, related: !item.related } : item
      )
    );
  };

  const handleToggleTagVisibility = (collectionId) => {
    setTagVisibility((prev) => ({
      ...prev,
      [collectionId]: prev[collectionId] === false ? true : false,
    }));
  };

  const handleAddFilterSet = () => {
    if (filterSetName.trim() === "") return;
    const newFs = {
      id: uuidv4(),
      name: filterSetName.trim(),
      filters: {},
      mode: "or",
      invert: false,
    };
    setFilterSets((prev) => [...prev, newFs]);
    setFilterSetName("");
    setEditingFilterSetId(newFs.id);
    if (filterSetInput.current) filterSetInput.current.focus();
  };

  const handleDeleteFilterSet = (fsId) => {
    setFilterSets((prev) => prev.filter((fs) => fs.id !== fsId));
    if (editingFilterSetId === fsId) setEditingFilterSetId(null);
  };

  const handleRenameFilterSet = (fsId, newName) => {
    setFilterSets((prev) =>
      prev.map((fs) => (fs.id === fsId ? { ...fs, name: newName } : fs))
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getItemId = (item, index) => item.id || `legacy-${index}`;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = list.findIndex((item, i) => getItemId(item, i) === active.id);
      const newIndex = list.findIndex((item, i) => getItemId(item, i) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
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
                handleRename={handleRename}
                showCollectionTags={showCollectionTags}
                tagVisible={tagVisibility[item.id] !== false}
                onToggleTagVisibility={handleToggleTagVisibility}
                onCycleVisibility={handleCycleVisibility}
                onToggleRelated={handleToggleRelated}
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
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        <Typography variant="overline" color="text.secondary">
          Filter Sets
        </Typography>
      </Box>

      <List dense disablePadding>
        {filterSets.map((fs) => (
          <Box key={fs.id}>
            <ListItem
              button
              selected={editingFilterSetId === fs.id}
              onClick={() =>
                setEditingFilterSetId(editingFilterSetId === fs.id ? null : fs.id)
              }
              secondaryAction={
                editingFilterSetId === fs.id ? (
                  <Tooltip title="Delete filter set" placement="left">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFilterSet(fs.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                ) : activeFilterSetId === fs.id ? (
                  <Chip
                    label={activeFilterSetMode}
                    size="small"
                    color={activeFilterSetMode === "show" ? "warning" : "error"}
                    sx={{ height: 20, fontSize: 11 }}
                  />
                ) : null
              }
            >
              {editingFilterSetId === fs.id ? (
                <TextField
                  hiddenLabel
                  variant="standard"
                  value={fs.name}
                  size="small"
                  fullWidth
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleRenameFilterSet(fs.id, e.target.value)}
                />
              ) : (
                <ListItemText primary={fs.name} />
              )}
            </ListItem>
            {editingFilterSetId === fs.id && (
              <FilterSetEditor
                filterSet={fs}
                list={list}
                filterSets={filterSets}
                setFilterSets={setFilterSets}
              />
            )}
          </Box>
        ))}
      </List>

      <Box sx={{ px: 2, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            hiddenLabel
            placeholder="New Filter Set"
            variant="filled"
            value={filterSetName}
            size="small"
            fullWidth
            sx={{ mr: 1 }}
            onChange={(e) => setFilterSetName(e.target.value)}
            inputRef={filterSetInput}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleAddFilterSet();
            }}
          />
          <IconButton
            aria-label="Add filter set"
            size="small"
            onClick={handleAddFilterSet}
            disabled={!filterSetName.trim()}
          >
            <IconPlus color={filterSetName.trim() ? "primary" : "default"} />
          </IconButton>
        </Box>
      </Box>

      <Divider />
      <DataImportExport />
      <SelectedPokemonNames
        list={list}
        pokemonData={pokemonData}
        filterSets={filterSets}
        activeFilterSetId={activeFilterSetId}
        activeFilterSetMode={activeFilterSetMode}
        evolutionRules={evolutionRules}
        visiblePokemonIds={visiblePokemonIds}
        variantMode={variantMode}
      />
      <List>
      </List>
    </>
  );
}
