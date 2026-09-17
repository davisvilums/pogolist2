// Collection membership with variants (shiny, Dynamax, Shadow and combinations).
// A collection keeps hundos in `pokemon` and variant hundos in `variants`, keyed by
// the sorted variant names: { shiny: [...], dynamax: [...], "dynamax+shiny": [...] }.
// The active variant mode (e.g. "dynamax+shiny", or "" for none) decides what a
// collection means. Owning a variant also counts for every mode it contains:
// a shiny Dynamax hundo is also a shundo, a Dynamax hundo and a hundo.

// Sorted, so combination keys are always e.g. "dynamax+shadow+shiny"
export const VARIANTS = ["dynamax", "shadow", "shiny"];

export const variantModeKey = (activeVariants) => VARIANTS.filter((v) => activeVariants[v]).join("+");

const splitKey = (key) => (key ? key.split("+") : []);
const containsMode = (key, mode) => splitKey(mode).every((v) => splitKey(key).includes(v));

// Variant lists, including shundos saved before variants existed (`shiny`)
function getVariants(collection) {
  const variants = { ...(collection.variants || {}) };
  if (collection.shiny && collection.shiny.length) {
    variants.shiny = [...new Set([...(variants.shiny || []), ...collection.shiny])];
  }
  return variants;
}

export function getOwnedIds(collection, mode) {
  const lists = Object.entries(getVariants(collection))
    .filter(([key]) => containsMode(key, mode))
    .map(([, ids]) => ids);
  if (!mode) lists.unshift(collection.pokemon || []);
  if (lists.length === 1) return lists[0];
  return [...new Set(lists.flat())];
}

// Variants a Pokemon is owned as beyond the current mode (for card badges)
export function getExtraVariants(collection, id, mode) {
  const current = splitKey(mode);
  return VARIANTS.filter(
    (v) => !current.includes(v) && getOwnedIds(collection, [...current, v].sort().join("+")).includes(id)
  );
}

// Remove a Pokemon for the current mode: from that variant and every variant
// containing it, keeping the rest of a combination (removing the shundo of a shiny
// Dynamax hundo leaves a Dynamax hundo). A hundo removal clears all variants.
export function removeOwned(collection, id, mode) {
  const variants = getVariants(collection);
  const next = {};
  const add = (key, ids) => {
    if (ids.length) next[key] = [...new Set([...(next[key] || []), ...ids])];
  };
  Object.entries(variants).forEach(([key, ids]) => {
    if (!ids.includes(id) || !containsMode(key, mode)) return add(key, ids);
    add(key, ids.filter((p) => p !== id));
    const rest = splitKey(key).filter((v) => !splitKey(mode).includes(v)).join("+");
    if (mode && rest) add(rest, [id]);
  });
  const pokemon = collection.pokemon || [];
  return { pokemon: mode ? pokemon : pokemon.filter((p) => p !== id), variants: next, shiny: undefined };
}

// Click on a card: add or remove the Pokemon for the current mode.
// Returns the collection's new { pokemon, variants } (and clears the old `shiny`).
export function toggleOwned(collection, id, mode) {
  if (getOwnedIds(collection, mode).includes(id)) return removeOwned(collection, id, mode);
  const variants = getVariants(collection);
  const pokemon = collection.pokemon || [];
  if (mode) variants[mode] = [...(variants[mode] || []), id];
  return { pokemon: pokemon.includes(id) ? pokemon : [...pokemon, id], variants, shiny: undefined };
}
