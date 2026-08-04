const assert = require('node:assert/strict');
const path = require('node:path');

const {
  TARGET_COLUMNS,
  TARGET_ROWS,
  PALETTE,
  loadPixelArt,
  initialColorForLevel,
  animationDelayFor,
  REVEAL_SECONDS,
  HOLD_SECONDS,
  RETURN_SECONDS,
  CYCLE_SECONDS,
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
assert.equal(REVEAL_SECONDS, 10);
assert.equal(HOLD_SECONDS, 4);
assert.equal(RETURN_SECONDS, 4);
assert.equal(CYCLE_SECONDS, 18);
assert.equal(initialColorForLevel('#d29a4e', 0), '#090706');
assert.notEqual(initialColorForLevel('#d29a4e', 1), initialColorForLevel('#d29a4e', 4));
assert.equal(animationDelayFor('2026-01-02', 1, 2), animationDelayFor('2026-01-02', 1, 2));
assert.notEqual(animationDelayFor('2026-01-02', 1, 2), animationDelayFor('2026-01-03', 1, 2));

console.log('Calling of Saint Matthew SVG checks passed.');
