// Shared costume helpers for add-costumes.js and update-availability.js

// Pokemon GO asset images (the same repository Leek Duck's shiny checklist uses)
const ASSET_URL =
  'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon%20-%20256x256/Addressable%20Assets';

// Older costumes are separate "c" codes (pm25.cFALL_2018). Newer ones are stored as
// forms (pm25.fGOTOUR_2026_A); these form names mark costumes rather than real forms.
const COSTUME_FORMS = /\d{4}|^(DOCTOR|HORIZONS|JEJU|KARIYUSHI|KURTA|POP_STAR|ROCK_STAR)$|^(TSHIRT|FLYING)_/;
// Costumes whose form name doesn't follow the pattern above
const SPECIES_COSTUME_FORMS = { 150: ['A'] }; // Armored Mewtwo

// Parse a Pokemon GO asset name like "pm710.fAVERAGE.cFALL_2022"
function parseAssetName(assetName) {
  const match = assetName.match(/^pm(\d+)(?:\.f([A-Za-z0-9_]+))?(?:\.c([A-Za-z0-9_]+))?/);
  if (!match) return null;
  return { dex: Number(match[1]), form: match[2] || '', costume: match[3] || '' };
}

function isCostumeForm(dex, form) {
  if (!form) return false;
  return COSTUME_FORMS.test(form) || (SPECIES_COSTUME_FORMS[dex] || []).includes(form);
}

// Whether an asset name is a costume (either kind)
function isCostumeAsset(assetName) {
  const parsed = parseAssetName(assetName);
  return !!parsed && (!!parsed.costume || isCostumeForm(parsed.dex, parsed.form));
}

module.exports = { ASSET_URL, parseAssetName, isCostumeForm, isCostumeAsset };
