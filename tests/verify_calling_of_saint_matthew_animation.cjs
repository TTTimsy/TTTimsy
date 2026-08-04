const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ARTWORKS } = require('../scripts/baroque-artworks.cjs');
const { buildAnimatedSvg } = require('../scripts/generate-spirit-vein-svg.cjs');
const { TARGET_COLUMNS, TARGET_ROWS, PALETTE, loadArtworkPixelArt, TRANSITION_SECONDS, HOLD_SECONDS, SEGMENT_SECONDS, CYCLE_SECONDS, transitionDelayFor } = require('../scripts/calling-of-saint-matthew-pixels.cjs');

assert.deepEqual(ARTWORKS.map(({ id }) => id), ['calling-of-saint-matthew', 'denial-of-saint-peter', 'jewish-bride', 'syndics']);
assert.equal(TARGET_COLUMNS, 159);
assert.equal(TARGET_ROWS, 21);
assert.equal(TRANSITION_SECONDS, 10);
assert.equal(HOLD_SECONDS, 4);
assert.equal(SEGMENT_SECONDS, 14);
assert.equal(CYCLE_SECONDS, 56);
const artworkPixels = loadArtworkPixelArt(ARTWORKS);
assert.equal(artworkPixels.length, 4);
assert.ok(artworkPixels.every((pixels) => pixels.length === 3339));
assert.ok(artworkPixels.every((pixels) => pixels.every((pixel) => PALETTE.includes(pixel))));
assert.equal(transitionDelayFor(2, 21, 8), transitionDelayFor(2, 21, 8));
assert.notEqual(transitionDelayFor(2, 21, 8), transitionDelayFor(3, 21, 8));

const svg = buildAnimatedSvg({ themeName: 'dark', profileName: 'Timsy' });
assert.match(svg, /viewBox="0 0 159 21"/);
assert.match(svg, /id="baroque-pixel-carousel"/);
assert.match(svg, /data-artworks="calling-of-saint-matthew,denial-of-saint-peter,jewish-bride,syndics"/);
assert.equal((svg.match(/class="baroque-pixel"/g) || []).length, 3339);
assert.equal((svg.match(/class="baroque-pixel"[^>]*width="1" height="1"/g) || []).length, 3339);
assert.match(svg, /dur="56s"/);
assert.doesNotMatch(svg, /matthew-pixel|contribution-day|contribution-cell-frame|pulse-bridge|contribution-root-halo/i);
assert.doesNotMatch(svg, /<(?:image|filter|script|path|circle|ellipse)\b/);

for (const filename of ['TTTimsy-contribution-animation.svg', 'TTTimsy-contribution-animation-dark.svg']) {
  const artifact = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  assert.match(artifact, /id="baroque-pixel-carousel"/);
  assert.match(artifact, /dur="56s"/);
  assert.equal((artifact.match(/class="baroque-pixel"/g) || []).length, 3339);
  assert.doesNotMatch(artifact, /matthew-pixel|contribution-cell-frame|pulse-bridge|contribution-root-halo/i);
}

console.log('Baroque pixel carousel SVG checks passed.');
