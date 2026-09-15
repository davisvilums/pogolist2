const fs = require('fs');
const path = require('path');
const { ASSET_URL, parseAssetName, isCostumeForm, isCostumeAsset, pngVisibleBox } = require('./costumes');

// Adds costume Pokemon (event hats, outfits, clones...) to pokelist.json, tagged
// "costume". Costumes come from the GO game master (pokemon-go-api) plus Leek Duck's
// shiny checklist for newer ones the game master data doesn't have yet.
// Existing costume entries keep their ids, so collections stay valid on reruns.
//
// Run after add-new-megas.js, then add-family-order.js and update-availability.js.
// Usage: node scripts/add-costumes.js

const POKELIST_PATH = path.join(__dirname, '../public/data/pokelist.json');
const POKEDEX_URL = 'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json';
const SHINY_URL = 'https://leekduck.com/shiny/pms.json';
const FIRST_COSTUME_ID = 30001;

const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

// Friendlier names for costume codes Leek Duck has no name for
const LABELS = { COPY_2019: 'clone', A: 'armored' };

// Asset files whose regular and shiny images are spelled differently
const SPRITE_OVERRIDES = { 'pm133.cMAY_2023': 'pm133.cMay_2023' };

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f'’]/g, '') // accents and apostrophes: "New Year's", "PokÉxciting"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (personal pokedex updater)' } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

// "pm710.fAVERAGE.cFALL_2022" -> "average-fall-2022"
function costumeLabel({ form, costume }) {
  const parts = [];
  if (form) parts.push(LABELS[form] || form);
  if (costume) parts.push(LABELS[costume] || costume.replace(/_NOEVOLVE$/, ''));
  return slug(parts.join('-'));
}

// The regular entry a costume is based on: same dex, matching regional form if any
function findBase(pokelist, { dex, form }) {
  const candidates = pokelist.filter((p) => p.dex === dex && !p.costume);
  const goForm = (p) => (p.form || '').toUpperCase().replace(/-/g, '_').replace(/^GALAR$/, 'GALARIAN');
  const realForm = isCostumeForm(dex, form) ? '' : form;
  return (
    (realForm && candidates.find((p) => goForm(p) === realForm)) ||
    candidates.find((p) => p.id === dex) ||
    candidates[0]
  );
}

async function main() {
  console.log('Fetching GO game master and Leek Duck shinies...');
  const [pokedex, shinies] = await Promise.all([getJSON(POKEDEX_URL), getJSON(SHINY_URL)]);

  // Released costumes: in the game master, or their shiny is already out.
  // Keyed case-insensitively without the female ".g2" suffix; Leek Duck's spelling
  // wins because it matches the asset file names.
  const costumes = new Map();
  const keyOf = (name) => name.replace(/\.g2$/, '').toUpperCase();
  // Leek Duck's readable costume names, e.g. "Safari Hat"
  const displayNames = new Map(
    shinies.filter((s) => s.name_suffix).map((s) => [keyOf(s.aa_fn), s.name_suffix])
  );
  for (const species of pokedex) {
    for (const asset of species.assetForms || []) {
      const name = `pm${species.dexNr}${asset.form ? `.f${asset.form}` : ''}${asset.costume ? `.c${asset.costume}` : ''}`;
      if (isCostumeAsset(name)) costumes.set(keyOf(name), name);
    }
  }
  for (const shiny of shinies) {
    const name = shiny.aa_fn.replace(/\.g2$/, '');
    if (!isCostumeAsset(name)) continue;
    if (costumes.has(keyOf(name)) || shiny.released_date <= today) costumes.set(keyOf(name), name);
  }

  const file = JSON.parse(fs.readFileSync(POKELIST_PATH, 'utf8'));
  const pokelist = file.pokelist;
  const existing = new Map(pokelist.filter((p) => p.costume).map((p) => [keyOf(p.costume), p]));
  const usedNames = new Set(pokelist.map((p) => p.name));
  let nextId = Math.max(FIRST_COSTUME_ID - 1, ...pokelist.map((p) => p.id).filter((id) => id >= FIRST_COSTUME_ID)) + 1;

  let added = 0;
  const skipped = [];
  for (const [key, assetName] of [...costumes.entries()].sort()) {
    if (existing.has(key)) continue;
    const parsed = parseAssetName(assetName);
    const base = findBase(pokelist, parsed);
    if (!base) {
      skipped.push(assetName);
      continue;
    }
    const speciesName = base.form ? base.name.slice(0, -(base.form.length + 1)) : base.name;
    // Names must be unique (cards are keyed by name): readable name first, then with
    // the event code, then mark non-evolving twins, then number
    const code = costumeLabel(parsed);
    const readable = displayNames.has(key) ? slug(displayNames.get(key)) : code;
    let name = `${speciesName}-${readable}`;
    if (usedNames.has(name) && readable !== code) name = `${speciesName}-${readable}-${code}`;
    if (usedNames.has(name) && /_NOEVOLVE$/.test(parsed.costume)) name += '-no-evolve';
    for (let n = 2; usedNames.has(name); n++) name = `${speciesName}-${readable}-${n}`;
    usedNames.add(name);
    pokelist.push({
      cp: base.cp,
      name,
      order: base.order,
      id: nextId++,
      kind: 'normal',
      gen: base.gen,
      tags: [...base.tags.filter((t) => !['variants', 'build', 'totem'].includes(t)), 'costume'],
      visible: true,
      released: true,
      sprite: `${ASSET_URL}/${SPRITE_OVERRIDES[assetName] || assetName}.icon.png`,
      shinySprite: `${ASSET_URL}/${assetName}.s.icon.png`,
      selected: false,
      dex: parsed.dex,
      costume: assetName,
    });
    added++;
  }

  // Costume images have lots of empty space; measure the visible area of the regular
  // and shiny image so cards can crop to it (spriteBox: [x, y, width, height])
  const unmeasured = pokelist.filter((p) => p.costume && !p.spriteBox);
  const measure = async (url) => {
    const res = await fetch(url);
    return res.ok ? pngVisibleBox(Buffer.from(await res.arrayBuffer())) : null;
  };
  for (let i = 0; i < unmeasured.length; i += 16) {
    await Promise.all(
      unmeasured.slice(i, i + 16).map(async (entry) => {
        const boxes = (await Promise.all([measure(entry.sprite), measure(entry.shinySprite)])).filter(Boolean);
        if (!boxes.length) return;
        const x = Math.min(...boxes.map((b) => b[0]));
        const y = Math.min(...boxes.map((b) => b[1]));
        const right = Math.max(...boxes.map((b) => b[0] + b[2]));
        const bottom = Math.max(...boxes.map((b) => b[1] + b[3]));
        entry.spriteBox = [x, y, right - x, bottom - y];
      })
    );
  }
  console.log(`Measured image bounds for ${unmeasured.length} costumes`);

  pokelist.sort((a, b) => b.cp - a.cp);
  fs.writeFileSync(POKELIST_PATH, JSON.stringify(file, null, 2));

  console.log(`Added ${added} costumes (${existing.size} already in the list), ${costumes.size} costumes found`);
  if (skipped.length) console.log(`No base Pokemon in the list for: ${skipped.join(', ')}`);
  console.log('Run scripts/add-family-order.js and scripts/update-availability.js next');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
