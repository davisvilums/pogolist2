// Evolution rules shared by the Pokemon grid and the sidebar name list.
// Relies on the `evolvesFrom` parent ids in pokelist.json.

import { getOwnedIds } from "./collections";

export const defaultEvolutionRules = {
  lowestStageOnly: false,
  branchingFamilies: false,
  regionalFamilies: false,
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

// Megas, Primals and Gigantamax are powered-up versions of one Pokemon, not a
// choice between evolutions
const isBattleForm = (p) => /(^|-)(mega(-[xyz])?|primal|gmax)$/.test(p.form || "");

// id -> Set of what a hundo of it is sure to become: evolutions followed only while
// there is a single evolution path (Poliwag -> Poliwhirl, then Poliwrath or Politoed
// is a choice, so it stops), plus Mega/Primal/Gigantamax forms along the way
export function buildDescendants(pokemonData) {
  const byId = new Map((pokemonData || []).map((p) => [p.id, p]));
  const children = new Map();
  (pokemonData || []).forEach((p) =>
    (p.evolvesFrom || []).forEach((parent) => {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(p.id);
    })
  );

  const descendants = new Map();
  const collect = (id, result, seen) => {
    // Totems can't be obtained, so they are never followed
    const kids = (children.get(id) || []).filter((c) => !seen.has(c) && !/totem/.test(byId.get(c).form || ""));
    const battleForms = kids.filter((c) => isBattleForm(byId.get(c)));
    const evolutions = kids.filter((c) => !isBattleForm(byId.get(c)));
    battleForms.forEach((c) => result.add(c));
    if (evolutions.length === 1) {
      seen.add(evolutions[0]);
      result.add(evolutions[0]);
      collect(evolutions[0], result, seen);
    }
  };
  byId.forEach((_, id) => {
    const result = new Set();
    collect(id, result, new Set([id]));
    if (result.size) descendants.set(id, result);
  });
  return descendants;
}

// A collection's ids for the current variant mode (e.g. shundos), plus what they
// surely evolve into when "related" is on. Only upwards: a hundo Clefairy can become
// Clefable, but never Cleffa.
export function getCollectionIds(collection, descendants, variantMode) {
  const ids = getOwnedIds(collection, variantMode);
  if (!collection.related || !descendants) return ids;
  const result = new Set(ids);
  ids.forEach((id) => (descendants.get(id) || []).forEach((child) => result.add(child)));
  return [...result];
}

// Family filters: keep only Pokemon whose family can branch or has regional forms
// (`familyFlags` from add-family-order.js). Works on Pokemon entries.
export function applyFamilyRules(entries, rules) {
  if (!rules) return entries;
  const wanted = [rules.branchingFamilies && "branching", rules.regionalFamilies && "regional"].filter(Boolean);
  if (!wanted.length) return entries;
  return entries.filter((p) => wanted.every((flag) => (p.familyFlags || []).includes(flag)));
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
