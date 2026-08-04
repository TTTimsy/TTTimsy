const assert = require('node:assert/strict');
const path = require('node:path');
const { buildAnimatedSvg } = require('../scripts/generate-spirit-vein-svg.cjs');

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

const calendar = Array.from({ length: 53 }, (_, week) =>
  Array.from({ length: 7 }, (_, weekday) => ({
    date: week === 0 && weekday === 0 ? '2026-01-01' : `2026-${String(week + 1).padStart(2, '0')}-${String(weekday + 1).padStart(2, '0')}`,
    count: week === 0 && weekday === 0 ? 0 : 4,
    level: week === 0 && weekday === 0 ? 0 : week === 0 && weekday === 1 ? 1 : 4,
    weekday,
  }))
);
const svg = buildAnimatedSvg({ data: calendar, themeName: 'dark', profileName: 'Timsy' });
assert.match(svg, /id="calling-of-saint-matthew-mosaic"/);
assert.equal((svg.match(/class="matthew-pixel"/g) || []).length, 3339);
assert.equal((svg.match(/data-subpixel="[0-2],[0-2]"/g) || []).length, 3339);
assert.match(svg, /data-date="2026-01-01" data-count="0" data-level="0"/);
assert.match(svg, /dur="18s"/);
assert.match(svg, /begin="0s"/);
assert.doesNotMatch(svg, /<(?:image|filter|script|path|circle|ellipse)\b/);
assert.doesNotMatch(svg, /data:image\/png;base64|spirit-vein|terraria|smoke-actor/i);

console.log('Calling of Saint Matthew SVG checks passed.');
