// Evolution rules shared by the Pokemon grid and the sidebar name list.
// Relies on the `evolvesFrom` parent ids in pokelist.json.

export const defaultEvolutionRules = {
  hideEvolutionsOfHidden: false,
  lowestStageOnly: false,
};

// id -> Set of every id it can be evolved from (parents, grandparents, ...)
export function buildAncestors(pokemonData) {
  const parents = new Map();
  (pokemonData || []).forEach((p) => parents.set(p.id, p.evolvesFrom || []));

  const ancestors = new Map();
  const collect = (id) => {
    if (ancestors.has(id)) return ancestors.get(id);
    const result = new Set();
    ancestors.set(id, result); // guards against cycles in bad data
    for (const parent of parents.get(id) || []) {
      result.add(parent);
      collect(parent).forEach((a) => result.add(a));
    }
    return result;
  };
  parents.forEach((_, id) => collect(id));
  return ancestors;
}

// Ids hidden by collections: collections set to "hide", plus the active filter
// set's hidden collections and, when it is inverted/excluded, its shown ones.
export function getCollectionHiddenIds(list, filterSets, activeFilterSetId, activeFilterSetMode) {
  const hidden = new Set();
  const add = (cols) => cols.forEach((c) => (c.pokemon || []).forEach((id) => hidden.add(id)));

  add(list.filter((c) => c.visibility === "hide"));

  const active = filterSets.find((fs) => fs.id === activeFilterSetId);
  if (active) {
    add(list.filter((c) => active.filters[c.id] === "hide"));
    const showCols = list.filter((c) => active.filters[c.id] === "show");
    const inverted = active.invert !== (activeFilterSetMode === "exclude");
    if (inverted && showCols.length > 0) {
      if (active.mode === "and") {
        (showCols[0].pokemon || [])
          .filter((id) => showCols.every((c) => c.pokemon && c.pokemon.includes(id)))
          .forEach((id) => hidden.add(id));
      } else {
        add(showCols);
      }
    }
  }
  return hidden;
}

// Apply the evolution rules to a list of already-visible ids.
// - hideEvolutionsOfHidden: drop ids that evolve from a collection-hidden id
// - lowestStageOnly: drop ids that evolve from another visible id
export function applyEvolutionRules(ids, rules, ancestors, hiddenIds) {
  if (!rules || !ancestors) return ids;
  let result = ids;
  if (rules.hideEvolutionsOfHidden) {
    result = result.filter((id) => {
      for (const a of ancestors.get(id) || []) if (hiddenIds.has(a)) return false;
      return true;
    });
  }
  if (rules.lowestStageOnly) {
    const visible = new Set(result);
    result = result.filter((id) => {
      for (const a of ancestors.get(id) || []) if (visible.has(a)) return false;
      return true;
    });
  }
  return result;
}
