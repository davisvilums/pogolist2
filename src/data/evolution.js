// Evolution rules shared by the Pokemon grid and the sidebar name list.
// Relies on the `evolvesFrom` parent ids in pokelist.json.

export const defaultEvolutionRules = {
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

// id -> Set of every id it can evolve into (children, grandchildren, ...)
export function buildDescendants(pokemonData) {
  const descendants = new Map();
  buildAncestors(pokemonData).forEach((ancestorIds, id) =>
    ancestorIds.forEach((ancestor) => {
      if (!descendants.has(ancestor)) descendants.set(ancestor, new Set());
      descendants.get(ancestor).add(id);
    })
  );
  return descendants;
}

// A collection's ids, plus what they evolve into when "related" is on.
// Only upwards: a hundo Clefairy can become Clefable, but never Cleffa.
export function getCollectionIds(collection, descendants) {
  const ids = collection.pokemon || [];
  if (!collection.related || !descendants) return ids;
  const result = new Set(ids);
  ids.forEach((id) => (descendants.get(id) || []).forEach((child) => result.add(child)));
  return [...result];
}

// Apply the evolution rules to a list of already-visible ids.
// - lowestStageOnly: drop ids that evolve from another visible id
export function applyEvolutionRules(ids, rules, ancestors) {
  if (!rules || !ancestors || !rules.lowestStageOnly) return ids;
  const visible = new Set(ids);
  return ids.filter((id) => {
    for (const a of ancestors.get(id) || []) if (visible.has(a)) return false;
    return true;
  });
}
