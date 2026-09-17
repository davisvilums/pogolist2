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

// What each Pokemon can evolve into, in two flavours:
// - single: what a hundo is sure to become. Evolutions are followed only while there
//   is a single evolution path (Poliwag -> Poliwhirl, then Poliwrath or Politoed is a
//   choice, so it stops)
// - all: every evolution, including all branches (Eevee -> all Eeveelutions)
// Both include Mega/Primal/Gigantamax forms along the way; totems are never followed.
export function buildDescendants(pokemonData) {
  const byId = new Map((pokemonData || []).map((p) => [p.id, p]));
  const children = new Map();
  (pokemonData || []).forEach((p) =>
    (p.evolvesFrom || []).forEach((parent) => {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(p.id);
    })
  );

  const build = (followBranches) => {
    const descendants = new Map();
    const collect = (id, result, seen) => {
      const kids = (children.get(id) || []).filter((c) => !seen.has(c) && !/totem/.test(byId.get(c).form || ""));
      const battleForms = kids.filter((c) => isBattleForm(byId.get(c)));
      const evolutions = kids.filter((c) => !isBattleForm(byId.get(c)));
      battleForms.forEach((c) => result.add(c));
      if (evolutions.length === 1 || followBranches) {
        evolutions.forEach((c) => {
          seen.add(c);
          result.add(c);
          collect(c, result, seen);
        });
      }
    };
    byId.forEach((_, id) => {
      const result = new Set();
      collect(id, result, new Set([id]));
      if (result.size) descendants.set(id, result);
    });
    return descendants;
  };
  // Other forms sharing a Pokedex number (regional and other forms, not costumes)
  const sameDex = new Map();
  byId.forEach((p) => {
    if (p.costume || p.dex === undefined) return;
    if (!sameDex.has(p.dex)) sameDex.set(p.dex, []);
    sameDex.get(p.dex).push(p.id);
  });
  const formsOf = new Map();
  byId.forEach((p) => formsOf.set(p.id, p.costume ? [] : sameDex.get(p.dex) || []));

  return { single: build(false), all: build(true), formsOf };
}

// A collection's ids for the current variant mode (e.g. shundos), plus what they evolve
// into when "related" is on. Only upwards: a hundo Clefairy can become Clefable, never
// Cleffa. A starred collection shows every evolution path, so branches can be marked
// while evolving, plus every form sharing a Pokedex number (regional and other forms),
// so a variant picked by mistake can be corrected. A hidden one only hides what the
// hundo is sure to become.
export function getCollectionIds(collection, descendants, variantMode) {
  const ids = getOwnedIds(collection, variantMode);
  if (!collection.related || !descendants) return ids;
  const starred = collection.visibility === "show";
  const map = starred ? descendants.all : descendants.single;
  const result = new Set(ids);
  ids.forEach((id) => (map.get(id) || []).forEach((child) => result.add(child)));
  if (starred) [...result].forEach((id) => (descendants.formsOf.get(id) || []).forEach((form) => result.add(form)));
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
