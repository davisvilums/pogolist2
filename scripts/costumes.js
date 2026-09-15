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

// Bounding box [x, y, width, height] of the visible (non-transparent) pixels of an
// 8-bit RGBA PNG, so cards can crop the empty space around small costume images
function pngVisibleBox(buffer) {
  const zlib = require('zlib');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const [bitDepth, colorType, , , interlace] = buffer.subarray(24, 29);
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) return null;

  const idat = [];
  for (let offset = 8; offset < buffer.length; ) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idat.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const data = zlib.inflateSync(Buffer.concat(idat));

  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(height * stride);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const filter = data[y * (stride + 1)];
    const row = y * stride;
    const prev = row - stride;
    for (let i = 0; i < stride; i++) {
      const raw = data[y * (stride + 1) + 1 + i];
      const left = i >= bpp ? pixels[row + i - bpp] : 0;
      const up = y > 0 ? pixels[prev + i] : 0;
      const upLeft = y > 0 && i >= bpp ? pixels[prev + i - bpp] : 0;
      let value;
      if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + ((left + up) >> 1);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const [pa, pb, pc] = [Math.abs(p - left), Math.abs(p - up), Math.abs(p - upLeft)];
        value = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      } else value = raw;
      pixels[row + i] = value & 0xff;
    }
    for (let x = 0; x < width; x++) {
      if (pixels[row + x * bpp + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return [minX, minY, maxX - minX + 1, maxY - minY + 1];
}

module.exports = { ASSET_URL, parseAssetName, isCostumeForm, isCostumeAsset, pngVisibleBox };
