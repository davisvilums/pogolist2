const fs = require('fs');
const path = require('path');
const { isCostumeAsset } = require('./costumes');

// Updates `released` and `shinyReleased` in pokelist.json (and released.json)
// from community-maintained Pokemon GO data. Niantic publishes no official list.
//
// Sources:
// - Leek Duck shiny checklist (https://leekduck.com/shiny/): every released shiny,
//   per form, with its release date
// - Pokemon Database (https://pokemondb.net/go/unavailable): species and forms that
//   are in the game code but not obtainable yet
// - pokemon-go-api (https://pokemon-go-api.github.io/pokemon-go-api/): the game
//   master, i.e. which species and forms exist in Pokemon GO at all
//
// Run after add-family-order.js (it needs each entry's `dex` and `form`).
// Usage: node scripts/update-availability.js

const DATA_DIR = path.join(__dirname, '../public/data');
const SHINY_URL = 'https://leekduck.com/shiny/pms.json';
const UNAVAILABLE_URL = 'https://pokemondb.net/go/unavailable';
const POKEDEX_URL = 'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json';

const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

async function get(url, type = 'json') {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (personal pokedex updater)' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return type === 'json' ? res.json() : res.text();
}

// Our PokeAPI form names -> Pokemon GO form tokens, where the plain
// upper-case version doesn't match
const FORM_ALIASES = {
  galar: 'GALARIAN',
  'galar-zen': 'GALARIAN_ZEN',
  'galar-standard': 'GALARIAN_STANDARD',
  hisui: 'HISUIAN',
  'paldea-combat-breed': 'PALDEA_COMBAT',
  'paldea-blaze-breed': 'PALDEA_BLAZE',
  'paldea-aqua-breed': 'PALDEA_AQUA',
  east: 'EAST_SEA',
  west: 'WEST_SEA',
  sunshine: 'SUNNY',
  'poke-ball': 'POKEBALL',
  'pom-pom': 'POMPOM',
  10: 'TEN_PERCENT',
  50: 'FIFTY_PERCENT',
  '10-power-construct': 'COMPLETE_TEN_PERCENT',
  '50-power-construct': 'COMPLETE_FIFTY_PERCENT',
  'two-segment': 'TWO',
  'three-segment': 'THREE',
};

// Aliases that only apply to one species: dex -> { form: token }
const SPECIES_FORM_ALIASES = {
  744: { 'own-tempo': 'DUSK' }, // Own Tempo Rockruff evolves into Dusk Lycanroc
  800: { dusk: 'DUSK_MANE', dawn: 'DAWN_WINGS' },
  999: { roaming: 'COIN_A1' },
};

// Battle-only forms that are in the game code but can't be obtained
const NEVER_OBTAINABLE = ['eternatus-eternamax', 'cramorant-gulping', 'cramorant-gorging', 'mimikyu-busted'];

// Released in GO but missing as a separate form in the game master data
const KNOWN_RELEASED = ['ursaluna-bloodmoon'];

// Species whose form tokens carry the species name (UNOWN_B, BURMY_PLANT)
const PREFIXED_FORMS = { 201: 'UNOWN', 412: 'BURMY', 413: 'WORMADAM' };

// Form tokens Leek Duck uses for a species' default look
const DEFAULT_TOKENS = ['NORMAL', 'HERO', 'UNOWN_A'];

function goTokens(entry) {
  const form = entry.form;
  if (!form) return [];
  const mega = form.match(/(^|-)(mega(-[xyz])?|primal)$/);
  if (mega) return [mega[2].toUpperCase().replace(/-/g, '_')];
  if (/(^|-)gmax$/.test(form)) return ['GIGANTAMAX'];
  const speciesAlias = (SPECIES_FORM_ALIASES[entry.dex] || {})[form];
  if (speciesAlias) return [speciesAlias];
  const special = {
    'crowned': entry.dex === 888 ? 'CROWNED_SWORD' : 'CROWNED_SHIELD',
    ice: entry.dex === 898 ? 'ICE_RIDER' : 'ICE',
    shadow: 'SHADOW_RIDER',
    exclamation: 'UNOWN_EXCLAMATION_POINT',
    question: 'UNOWN_QUESTION_MARK',
  }[form];
  if (special) return [special];
  let token = FORM_ALIASES[form] || form.toUpperCase().replace(/-PLUMAGE$/, '').replace(/-/g, '_');
  if (PREFIXED_FORMS[entry.dex] && !token.startsWith(PREFIXED_FORMS[entry.dex])) {
    token = `${PREFIXED_FORMS[entry.dex]}_${token}`;
  }
  return [token];
}

// Loose comparison key for form labels from different sources
const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/GALARIAN/g, 'GALAR')
    .replace(/HISUIAN/g, 'HISUI')
    .replace(/POKE_BALL/g, 'POKEBALL')
    .replace(/^_|_$/g, '');

function parseUnavailable(html) {
  const rows = [];
  for (const row of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (cells.length < 3) continue;
    const dex = parseInt(cells[0].replace(/<[^>]+>/g, ''), 10);
    const name = (cells[1].match(/<a[^>]*>([\s\S]*?)<\/a>/) || [])[1] || '';
    const small = (cells[1].match(/<small[^>]*>([\s\S]*?)<\/small>/) || [])[1] || '';
    // "Fan Rotom" -> "FAN", "Galarian Zen Mode" -> "GALAR_ZEN", "Ice Rider" -> "ICE"
    const label = norm(
      small
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z]+;|&#\d+;/g, (e) => ({ '&eacute;': 'é' }[e] || ''))
        .replace(new RegExp(`\\b${name.replace(/<[^>]+>/g, '').trim()}\\b`, 'i'), '')
        .replace(/\b(Form|Forme|Mode|Pattern|Face|Rider|Mask)\b/gi, '')
    );
    if (dex) rows.push({ dex, label });
  }
  return rows;
}

function isUnavailable(entry, unavailableRows) {
  const entryLabel = norm(entry.form || '');
  const isBase = entry.id === entry.dex;
  return unavailableRows.some((row) => {
    if (row.dex !== entry.dex) return false;
    if (!row.label || row.label === 'NORMAL' || row.label === 'TEAL') return isBase;
    if (row.label === 'METEOR') return /meteor$/.test(entry.form || '');
    if (row.label === 'CORE') return entry.dex === 774 && !/meteor$/.test(entry.form || '');
    return entryLabel === row.label;
  });
}

async function main() {
  console.log('Fetching Leek Duck shinies, Pokemon Database unavailable list and GO game master...');
  const [shinies, unavailableHtml, pokedex] = await Promise.all([
    get(SHINY_URL),
    get(UNAVAILABLE_URL, 'text'),
    get(POKEDEX_URL),
  ]);
  const unavailableRows = parseUnavailable(unavailableHtml);
  console.log(`${shinies.length} shiny entries, ${unavailableRows.length} unavailable rows, ${pokedex.length} species in GO`);

  // dex -> released shiny form tokens ('' for no form); costume asset names released
  const shinyForms = new Map();
  const costumeShinies = new Set();
  for (const s of shinies) {
    if (s.released_date > today) continue; // announced but not out yet
    const form = (s.aa_fn.match(/\.f([A-Z0-9_]+)/) || [])[1] || '';
    if (isCostumeAsset(s.aa_fn)) {
      costumeShinies.add(s.aa_fn);
      continue;
    }
    if (!shinyForms.has(s.dex)) shinyForms.set(s.dex, new Set());
    shinyForms.get(s.dex).add(form);
  }

  // dex -> form tokens that exist in the GO game master
  const codedForms = new Map();
  for (const p of pokedex) {
    const tokens = new Set();
    const strip = (key) => key.replace(new RegExp(`^${p.id}_`), '');
    Object.keys(p.regionForms || {}).forEach((k) => tokens.add(strip(k)));
    Object.keys(p.megaEvolutions || {}).forEach((k) => tokens.add(strip(k)));
    (p.assetForms || []).forEach((a) => a.form && tokens.add(a.form));
    if (p.hasGigantamaxEvolution) tokens.add('GIGANTAMAX');
    if ((p.assetForms || []).some((a) => a.isFemale)) tokens.add('FEMALE');
    codedForms.set(p.dexNr, tokens);
  }

  const file = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pokelist.json'), 'utf8'));
  const changes = { released: [], unreleased: [], shinyOn: [], shinyOff: [] };
  const unmatchedForms = new Set();

  // dex -> form tokens that have their own entry in our list
  const listedTokens = new Map();
  for (const entry of file.pokelist) {
    if (entry.costume) continue;
    if (!listedTokens.has(entry.dex)) listedTokens.set(entry.dex, new Set());
    goTokens(entry).forEach((t) => listedTokens.get(entry.dex).add(t));
  }

  for (const entry of file.pokelist) {
    if (entry.costume) {
      // Costumes (add-costumes.js) only exist once released; shiny needs an exact match
      const shinyReleased = costumeShinies.has(entry.costume);
      if (shinyReleased !== !!entry.shinyReleased) changes[shinyReleased ? 'shinyOn' : 'shinyOff'].push(entry.name);
      entry.shinyReleased = shinyReleased;
      continue;
    }
    const tokens = goTokens(entry);
    const form = entry.form || '';
    const shinyTokens = shinyForms.get(entry.dex) || new Set();
    // A species' main entry also counts forms we don't list separately, e.g.
    // Spinda's numbered spot patterns or Sinistea's Antique/Phony
    const unlistedShiny = [...shinyTokens].some((t) => t && !listedTokens.get(entry.dex).has(t));
    const hasShiny =
      tokens.some((t) => shinyTokens.has(t)) ||
      (!tokens.length && (shinyTokens.has('') || DEFAULT_TOKENS.some((t) => shinyTokens.has(t)) || unlistedShiny)) ||
      // default forms Leek Duck files without a form (e.g. deoxys-normal -> pm386)
      (entry.id === entry.dex && (shinyTokens.has('') || unlistedShiny));

    let released;
    if (/totem/.test(form) || /-(build|mode)$/.test(entry.name) || NEVER_OBTAINABLE.includes(entry.name)) {
      released = false; // never obtainable in GO
    } else if (KNOWN_RELEASED.includes(entry.name)) {
      released = true;
    } else if (/(^|-)(mega(-[xyz])?|primal)$/.test(form)) {
      // Megas and Primals are released together with their shiny in GO
      released = hasShiny;
    } else if (/(^|-)gmax$/.test(form)) {
      // Gigantamax can arrive in Max Battles before its shiny does
      released = hasShiny || !!entry.released;
    } else if (!codedForms.has(entry.dex) || isUnavailable(entry, unavailableRows)) {
      released = false;
    } else if (!tokens.length || entry.id === entry.dex) {
      released = true;
    } else {
      const coded = codedForms.get(entry.dex);
      released = tokens.some((t) => coded.has(t)) || hasShiny;
      if (!released) unmatchedForms.add(entry.name);
    }

    const shinyReleased = released && hasShiny;
    if (released !== !!entry.released) changes[released ? 'released' : 'unreleased'].push(entry.name);
    if (shinyReleased !== !!entry.shinyReleased) changes[shinyReleased ? 'shinyOn' : 'shinyOff'].push(entry.name);
    entry.released = released;
    entry.shinyReleased = shinyReleased;
  }

  fs.writeFileSync(path.join(DATA_DIR, 'pokelist.json'), JSON.stringify(file, null, 2));
  const releasedIds = file.pokelist.filter((p) => p.released).map((p) => p.id).sort((a, b) => a - b);
  fs.writeFileSync(path.join(DATA_DIR, 'released.json'), JSON.stringify({ released: releasedIds }, null, 2) + '\n');

  const count = (key) => file.pokelist.filter((p) => p[key]).length;
  console.log(`\nReleased: ${count('released')} of ${file.pokelist.length}, shiny released: ${count('shinyReleased')}`);
  console.log(`Now released (${changes.released.length}): ${changes.released.join(', ')}`);
  console.log(`Now unreleased (${changes.unreleased.length}): ${changes.unreleased.join(', ')}`);
  if (unmatchedForms.size) console.log(`Forms not found in GO data (marked unreleased): ${[...unmatchedForms].join(', ')}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
