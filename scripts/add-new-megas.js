const fs = require('fs');
const path = require('path');
const { calculateCP } = require('./update-pokelist');

// PokeAPI's GraphQL endpoint (used by update-pokelist.js) is frozen before the
// Legends: Z-A Megas. This adds any Mega form the REST API has that
// pokelist.json is missing.
//
// Usage: node scripts/add-new-megas.js   (then run add-family-order.js)

const REST_URL = 'https://pokeapi.co/api/v2';
const DATA_DIR = path.join(__dirname, '../public/data');

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function main() {
  const pokelistPath = path.join(DATA_DIR, 'pokelist.json');
  const file = JSON.parse(fs.readFileSync(pokelistPath, 'utf8'));
  const released = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'released.json'), 'utf8')).released;
  const existingIds = new Set(file.pokelist.map((p) => p.id));

  console.log('Fetching Pokemon list from PokeAPI REST...');
  const { results } = await getJSON(`${REST_URL}/pokemon?limit=100000`);
  const missing = results
    .map((r) => ({ name: r.name, id: Number(r.url.split('/').filter(Boolean).pop()) }))
    .filter((p) => p.name.includes('-mega') && !existingIds.has(p.id));

  console.log(`Found ${missing.length} Mega forms missing from pokelist.json`);

  const speciesCache = new Map();
  for (const { id } of missing) {
    const pokemon = await getJSON(`${REST_URL}/pokemon/${id}`);
    const speciesUrl = pokemon.species.url;
    if (!speciesCache.has(speciesUrl)) speciesCache.set(speciesUrl, await getJSON(speciesUrl));
    const species = speciesCache.get(speciesUrl);

    const base = file.pokelist.find((p) => p.id === species.id);
    const tags = [];
    if (species.is_baby) tags.push('baby');
    if (species.is_legendary) tags.push('legendary');
    if (species.is_mythical) tags.push('mythical');
    tags.push('mega');

    const entry = {
      cp: calculateCP(pokemon.stats),
      name: pokemon.name,
      order: base ? base.order + 0.5 : id + 20000,
      id,
      kind: 'normal',
      gen: Number(species.generation.url.split('/').filter(Boolean).pop()),
      tags,
      visible: true,
      released: released.includes(id),
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
      selected: false,
    };
    file.pokelist.push(entry);
    console.log(`  + ${entry.name} (CP ${entry.cp}, G${entry.gen})`);
  }

  // Keep the file's CP-descending order
  file.pokelist.sort((a, b) => b.cp - a.cp);
  fs.writeFileSync(pokelistPath, JSON.stringify(file, null, 2));

  console.log(`\npokelist.json now has ${file.pokelist.length} Pokemon`);
  if (missing.length) console.log('Run scripts/add-family-order.js next to place them in the Family sort');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
