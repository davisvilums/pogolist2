const fs = require('fs');
const path = require('path');

// Adds a `familyOrder` rank to every entry in pokelist.json so the app can sort
// Pokemon by evolution family: each family in national dex order, members
// following the evolution tree, and each species' forms (mega, regional, gmax)
// right after it. Also adds `evolvesFrom` (parent entry ids), which the app
// uses to hide evolutions.
//
// Usage: node scripts/add-family-order.js

const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';
const POKELIST_PATH = path.join(__dirname, '../public/data/pokelist.json');

const query = `{
  pokemon_v2_pokemonspecies {
    id
    name
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

// Paradox Pokemon aren't in any evolution chain, but each is modelled on an
// older Pokemon. Place them right after that Pokemon's family.
// paradox species id -> species id it is based on
const PARADOX_BASES = {
  984: 232, // Great Tusk -> Donphan
  985: 39, // Scream Tail -> Jigglypuff
  986: 591, // Brute Bonnet -> Amoonguss
  987: 200, // Flutter Mane -> Misdreavus
  988: 637, // Slither Wing -> Volcarona
  989: 82, // Sandy Shocks -> Magneton
  990: 232, // Iron Treads -> Donphan
  991: 225, // Iron Bundle -> Delibird
  992: 297, // Iron Hands -> Hariyama
  993: 635, // Iron Jugulis -> Hydreigon
  994: 637, // Iron Moth -> Volcarona
  995: 248, // Iron Thorns -> Tyranitar
  1005: 373, // Roaring Moon -> Salamence
  1006: 282, // Iron Valiant -> Gardevoir
  1009: 245, // Walking Wake -> Suicune
  1010: 640, // Iron Leaves -> Virizion
  1020: 244, // Gouging Fire -> Entei
  1021: 243, // Raging Bolt -> Raikou
  1022: 639, // Iron Boulder -> Terrakion
  1023: 638, // Iron Crown -> Cobalion
};

// Rank every species: families ordered by their lowest dex number, then a
// depth-first walk of the evolution tree (branches in dex order), then any
// Paradox Pokemon based on that family.
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

    const familyIds = new Set(family.map((s) => s.id));
    Object.entries(PARADOX_BASES)
      .filter(([, baseId]) => familyIds.has(baseId))
      .map(([paradoxId]) => Number(paradoxId))
      .sort((a, b) => a - b)
      .forEach(visit);
  }
  return rank;
}

// Species whose regular form evolves from a regional form of the previous stage
// child species name -> parent entry name
const REGIONAL_PARENTS = {
  perrserker: 'meowth-galar',
  sirfetchd: 'farfetchd-galar',
  'mr-rime': 'mr-mime-galar',
  cursola: 'corsola-galar',
  obstagoon: 'linoone-galar',
  runerigus: 'yamask-galar',
  sneasler: 'sneasel-hisui',
  overqwil: 'qwilfish-hisui',
  basculegion: 'basculin-white-striped',
  clodsire: 'wooper-paldea',
};

// Transformations and forme changes (not separate collectibles):
// entry name -> the entries they are made from
const TRANSFORMATION_PARENTS = {
  'castform-sunny': ['castform'],
  'castform-rainy': ['castform'],
  'castform-snowy': ['castform'],
  'deoxys-attack': ['deoxys-normal'],
  'deoxys-defense': ['deoxys-normal'],
  'deoxys-speed': ['deoxys-normal'],
  'rotom-heat': ['rotom'],
  'rotom-wash': ['rotom'],
  'rotom-frost': ['rotom'],
  'rotom-fan': ['rotom'],
  'rotom-mow': ['rotom'],
  'dialga-origin': ['dialga'],
  'palkia-origin': ['palkia'],
  'giratina-origin': ['giratina-altered'],
  'shaymin-sky': ['shaymin-land'],
  'tornadus-therian': ['tornadus-incarnate'],
  'thundurus-therian': ['thundurus-incarnate'],
  'landorus-therian': ['landorus-incarnate'],
  'enamorus-therian': ['enamorus-incarnate'],
  'kyurem-black': ['kyurem'],
  'kyurem-white': ['kyurem'],
  'keldeo-resolute': ['keldeo-ordinary'],
  'meloetta-pirouette': ['meloetta-aria'],
  'hoopa-unbound': ['hoopa'],
  'wishiwashi-school': ['wishiwashi-solo'],
  'mimikyu-busted': ['mimikyu-disguised'],
  'necrozma-dusk': ['necrozma'],
  'necrozma-dawn': ['necrozma'],
  'necrozma-ultra': ['necrozma-dusk', 'necrozma-dawn'],
  'magearna-original': ['magearna'],
  // Zygarde grows 10% -> 50% -> Complete
  'zygarde-50': ['zygarde-10'],
  'zygarde-10-power-construct': ['zygarde-10'],
  'zygarde-50-power-construct': ['zygarde-50'],
  'zygarde-complete': ['zygarde-50', 'zygarde-50-power-construct'],
  'zygarde-mega': ['zygarde-complete'],
  'cramorant-gulping': ['cramorant'],
  'cramorant-gorging': ['cramorant'],
  'eiscue-noice': ['eiscue-ice'],
  'morpeko-hangry': ['morpeko-full-belly'],
  'zacian-crowned': ['zacian'],
  'zamazenta-crowned': ['zamazenta'],
  'eternatus-eternamax': ['eternatus'],
  'zarude-dada': ['zarude'],
  'calyrex-ice': ['calyrex'],
  'calyrex-shadow': ['calyrex'],
  'ogerpon-wellspring-mask': ['ogerpon'],
  'ogerpon-hearthflame-mask': ['ogerpon'],
  'ogerpon-cornerstone-mask': ['ogerpon'],
  'terapagos-terastal': ['terapagos'],
  'terapagos-stellar': ['terapagos-terastal'],
};

// Megas, Primals, Gmax and totems come from the same species' regular form
const SPECIAL_FORM = /(^|-)(mega(-[xyz])?|primal|gmax|totem)(?=-|$)/;
const REGIONAL_FORM = /(^|-)(alola|galar|hisui|paldea)(-|$)/;

// Pick the entries matching a form suffix: exact match ("alola"), then the
// longest prefix ("galar" for "galar-zen"), then the default form, then any.
function matchBySuffix(candidates, suffix) {
  const exact = candidates.filter((c) => c.suffix === suffix);
  if (exact.length) return exact;
  const prefixed = candidates
    .filter((c) => c.suffix && suffix.startsWith(c.suffix + '-'))
    .sort((a, b) => b.suffix.length - a.suffix.length);
  if (prefixed.length) return prefixed.filter((c) => c.suffix === prefixed[0].suffix);
  const plain = candidates.filter((c) => c.suffix === '');
  return plain.length ? plain : candidates;
}

// Direct evolution parents for every entry, as pokelist ids
function linkEvolutions(pokelist, speciesOf, species) {
  const speciesById = new Map(species.map((s) => [s.id, s]));
  const bySpecies = new Map();
  const info = new Map();
  for (const entry of pokelist) {
    const s = speciesById.get(speciesOf.get(entry));
    if (!s) continue;
    if (entry.costume) {
      // Costumes can't evolve and aren't a form other entries evolve from
      delete entry.evolvesFrom;
      continue;
    }
    const suffix = entry.name === s.name ? '' : entry.name.replace(`${s.name}-`, '');
    const item = { entry, species: s, suffix, special: SPECIAL_FORM.test(suffix) };
    info.set(entry, item);
    // National dex number and form name, used to match Pokemon GO availability data
    entry.dex = s.id;
    if (suffix) entry.form = suffix;
    else delete entry.form;
    if (!bySpecies.has(s.id)) bySpecies.set(s.id, []);
    bySpecies.get(s.id).push(item);
  }

  const byName = new Map(pokelist.map((e) => [e.name, e]));
  for (const item of info.values()) {
    let parents = [];
    if (TRANSFORMATION_PARENTS[item.entry.name]) {
      parents = TRANSFORMATION_PARENTS[item.entry.name].filter((n) => byName.has(n)).map((n) => info.get(byName.get(n)));
    } else if (item.special) {
      const regular = bySpecies.get(item.species.id).filter((c) => !c.special);
      const baseSuffix = item.suffix.replace(SPECIAL_FORM, '').replace(/^-/, '');
      // Exact form first (Original Magearna's Mega); otherwise skip transformations
      const exact = regular.filter((c) => c.suffix === baseSuffix);
      const untransformed = regular.filter((c) => !TRANSFORMATION_PARENTS[c.entry.name]);
      if (exact.length) parents = exact;
      else if (regular.length) parents = matchBySuffix(untransformed.length ? untransformed : regular, baseSuffix);
    } else if (REGIONAL_PARENTS[item.species.name] && byName.has(REGIONAL_PARENTS[item.species.name])) {
      parents = [info.get(byName.get(REGIONAL_PARENTS[item.species.name]))];
    } else if (item.species.evolves_from_species_id) {
      const candidates = (bySpecies.get(item.species.evolves_from_species_id) || []).filter((c) => !c.special);
      if (candidates.length) parents = matchBySuffix(candidates, item.suffix);
      // A regional form (e.g. Alolan Raichu, Hisuian Typhlosion) can't be evolved
      // from the regular previous stage in Pokemon GO
      if (REGIONAL_FORM.test(item.suffix) && !parents.some((p) => REGIONAL_FORM.test(p.suffix))) {
        parents = [];
      }
    }

    if (parents.length) item.entry.evolvesFrom = parents.map((p) => p.entry.id).sort((a, b) => a - b);
    else delete item.entry.evolvesFrom;
  }
}

function findSpeciesId(entry, pokemonSpecies, formPokemon) {
  if (entry.costume) return entry.dex; // costumes (add-costumes.js) already know their species
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

  // The GraphQL data is frozen before the Legends: Z-A Megas; look those up in REST
  // (checked before the form-id fallback, whose id range overlaps these Megas)
  for (const entry of pokelist) {
    if (pokemonSpecies.has(entry.id) || entry.id >= 20000) continue;
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${entry.id}`);
    if (!res.ok) continue;
    const pokemon = await res.json();
    if (pokemon.name !== entry.name) continue;
    pokemonSpecies.set(entry.id, Number(pokemon.species.url.split('/').filter(Boolean).pop()));
  }

  const unmatched = [];
  const speciesOf = new Map();
  const keyed = pokelist.map((entry) => {
    const speciesId = findSpeciesId(entry, pokemonSpecies, formPokemon);
    if (speciesId === null) unmatched.push(entry.name);
    else speciesOf.set(entry, speciesId);
    return {
      entry,
      speciesRank: speciesId === null ? Infinity : speciesRank.get(speciesId),
      // The species' default Pokemon (or its expanded colour/pattern forms)
      // first, then other forms like megas by id
      isDefault: entry.id === speciesId || !pokemonSpecies.has(entry.id) ? 0 : 1,
      // Costumes go after all of a species' regular forms
      isCostume: entry.costume ? 1 : 0,
    };
  });

  linkEvolutions(pokelist, speciesOf, data.pokemon_v2_pokemonspecies);

  // How many steps a form is from its species' first form (Zygarde 10% -> 50% ->
  // Complete, Charizard -> Mega), so forms sort in stage order
  const byId = new Map(pokelist.map((e) => [e.id, e]));
  const stageInSpecies = (entry, seen = new Set()) => {
    const sameSpeciesParents = (entry.evolvesFrom || [])
      .map((id) => byId.get(id))
      .filter((p) => p && speciesOf.get(p) === speciesOf.get(entry) && !seen.has(p));
    if (!sameSpeciesParents.length) return 0;
    seen.add(entry);
    return 1 + Math.max(...sameSpeciesParents.map((p) => stageInSpecies(p, seen)));
  };
  keyed.forEach((k) => (k.stage = stageInSpecies(k.entry)));

  keyed.sort(
    (a, b) =>
      a.speciesRank - b.speciesRank ||
      a.isCostume - b.isCostume ||
      a.stage - b.stage ||
      a.isDefault - b.isDefault ||
      a.entry.id - b.entry.id
  );
  keyed.forEach((k, i) => (k.entry.familyOrder = i + 1));

  fs.writeFileSync(POKELIST_PATH, JSON.stringify(file, null, 2));

  console.log(`Added familyOrder and evolvesFrom to ${pokelist.length} Pokemon`);
  console.log('Run scripts/update-availability.js next to refresh released and shiny status');
  if (unmatched.length) console.log(`No species found (sorted last): ${unmatched.join(', ')}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
