const fs = require('fs');
const path = require('path');

// Adds a `familyOrder` rank to every entry in pokelist.json so the app can sort
// Pokemon by evolution family: each family in national dex order, members
// following the evolution tree, and each species' forms (mega, regional, gmax)
// right after it.
//
// Usage: node scripts/add-family-order.js

const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';
const POKELIST_PATH = path.join(__dirname, '../public/data/pokelist.json');

const query = `{
  pokemon_v2_pokemonspecies {
    id
    evolution_chain_id
    evolves_from_species_id
  }
  pokemon_v2_pokemon {
    id
    pokemon_species_id
  }
  pokemon_v2_pokemonform {
    id
    pokemon_id
  }
}`;

async function fetchData() {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// Rank every species: families ordered by their lowest dex number, then a
// depth-first walk of the evolution tree (branches in dex order).
function rankSpecies(species) {
  const children = new Map();
  const chains = new Map();
  for (const s of species) {
    if (s.evolves_from_species_id) {
      if (!children.has(s.evolves_from_species_id)) children.set(s.evolves_from_species_id, []);
      children.get(s.evolves_from_species_id).push(s.id);
    }
    const chainId = s.evolution_chain_id ?? `solo-${s.id}`;
    if (!chains.has(chainId)) chains.set(chainId, []);
    chains.get(chainId).push(s);
  }
  for (const list of children.values()) list.sort((a, b) => a - b);

  const families = [...chains.values()].sort(
    (a, b) => Math.min(...a.map((s) => s.id)) - Math.min(...b.map((s) => s.id))
  );

  const rank = new Map();
  const visit = (id) => {
    if (rank.has(id)) return;
    rank.set(id, rank.size);
    for (const child of children.get(id) || []) visit(child);
  };
  for (const family of families) {
    const roots = family.filter((s) => !s.evolves_from_species_id).map((s) => s.id).sort((a, b) => a - b);
    roots.forEach(visit);
    family.forEach((s) => visit(s.id)); // safety net for broken chains
  }
  return rank;
}

function findSpeciesId(entry, pokemonSpecies, formPokemon) {
  if (pokemonSpecies.has(entry.id)) return pokemonSpecies.get(entry.id);
  // Expanded form entries use form id + 10000 (see update-pokelist.js)
  const pokemonId = formPokemon.get(entry.id - 10000);
  if (pokemonId && pokemonSpecies.has(pokemonId)) return pokemonSpecies.get(pokemonId);
  return null;
}

async function main() {
  console.log('Fetching species and evolution data from PokeAPI...');
  const data = await fetchData();

  const speciesRank = rankSpecies(data.pokemon_v2_pokemonspecies);
  const pokemonSpecies = new Map(data.pokemon_v2_pokemon.map((p) => [p.id, p.pokemon_species_id]));
  const formPokemon = new Map(data.pokemon_v2_pokemonform.map((f) => [f.id, f.pokemon_id]));

  const file = JSON.parse(fs.readFileSync(POKELIST_PATH, 'utf8'));
  const pokelist = file.pokelist;

  const unmatched = [];
  const keyed = pokelist.map((entry) => {
    const speciesId = findSpeciesId(entry, pokemonSpecies, formPokemon);
    if (speciesId === null) unmatched.push(entry.name);
    return {
      entry,
      speciesRank: speciesId === null ? Infinity : speciesRank.get(speciesId),
      // The species' default Pokemon first, then its forms by id
      isDefault: entry.id === speciesId ? 0 : 1,
    };
  });

  keyed.sort((a, b) => a.speciesRank - b.speciesRank || a.isDefault - b.isDefault || a.entry.id - b.entry.id);
  keyed.forEach((k, i) => (k.entry.familyOrder = i + 1));

  fs.writeFileSync(POKELIST_PATH, JSON.stringify(file, null, 2));

  console.log(`Added familyOrder to ${pokelist.length} Pokemon`);
  if (unmatched.length) console.log(`No species found (sorted last): ${unmatched.join(', ')}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
