const assert = require('node:assert/strict');
const path = require('node:path');

const {
  TARGET_COLUMNS,
  TARGET_ROWS,
  PALETTE,
  loadPixelArt,
} = require('../scripts/calling-of-saint-matthew-pixels.cjs');

const sourcePath = path.join(__dirname, '..', 'picture.png');
const first = loadPixelArt(sourcePath);
const second = loadPixelArt(sourcePath);

assert.equal(TARGET_COLUMNS, 159);
assert.equal(TARGET_ROWS, 21);
assert.equal(first.length, TARGET_COLUMNS * TARGET_ROWS);
assert.deepEqual(first, second);
assert.ok(first.every((pixel) => PALETTE.includes(pixel)));
assert.ok(new Set(first).size >= 8);

console.log('Calling of Saint Matthew SVG checks passed.');
