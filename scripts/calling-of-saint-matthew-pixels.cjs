const fs = require('fs');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

const TARGET_WEEKS = 53;
const DAYS_PER_WEEK = 7;
const SUBPIXELS_PER_DAY = 3;
const TARGET_COLUMNS = TARGET_WEEKS * SUBPIXELS_PER_DAY;
const TARGET_ROWS = DAYS_PER_WEEK * SUBPIXELS_PER_DAY;
const FOCAL_Y = 0.36;
const TRANSITION_SECONDS = 10;
const HOLD_SECONDS = 4;
const SEGMENT_SECONDS = TRANSITION_SECONDS + HOLD_SECONDS;
const CYCLE_SECONDS = SEGMENT_SECONDS * 4;
const PIXEL_TRANSITION_SECONDS = 0.25;
const LAST_REVEAL_DELAY = TRANSITION_SECONDS - PIXEL_TRANSITION_SECONDS;
const PALETTE = ['#090706', '#16100c', '#2b1b12', '#432918', '#5d3a20', '#794a25', '#965f2c', '#b77a38', '#d29a4e', '#edd08a', '#3d1e0f', '#6a2117', '#98351f', '#bd5730', '#d67c43', '#f0bf72'];

function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }

function cropBounds(width, height, focalY = FOCAL_Y) {
  const cropHeight = width * TARGET_ROWS / TARGET_COLUMNS;
  if (width < TARGET_COLUMNS || height < cropHeight) throw new Error(`Source image is too small for a ${TARGET_COLUMNS}x${TARGET_ROWS} pixel crop.`);
  return { left: 0, top: clamp(Math.round(height * focalY - cropHeight / 2), 0, height - cropHeight), width, height: cropHeight };
}

function parseHex(color) { return [Number.parseInt(color.slice(1, 3), 16), Number.parseInt(color.slice(3, 5), 16), Number.parseInt(color.slice(5, 7), 16)]; }
function squaredDistance(color, red, green, blue) { const [r, g, b] = parseHex(color); return (r - red) ** 2 + (g - green) ** 2 + (b - blue) ** 2; }
function nearestPaletteColor(red, green, blue) { return PALETTE.reduce((best, color) => squaredDistance(color, red, green, blue) < squaredDistance(best, red, green, blue) ? color : best, PALETTE[0]); }

function hash32(value) {
  let hash = 0x811c9dc5;
  for (const character of value) { hash ^= character.codePointAt(0); hash = Math.imul(hash, 0x01000193); }
  return hash >>> 0;
}

function transitionDelayFor(transitionIndex, pixelX, pixelY) { return (hash32(`${transitionIndex}:${pixelX}:${pixelY}`) % 10000) / 10000 * LAST_REVEAL_DELAY; }
function escapeXml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function decodeImage(sourcePath) {
  const bytes = fs.readFileSync(sourcePath);
  return /\.jpe?g$/i.test(sourcePath) ? jpeg.decode(bytes, { useTArray: true, maxMemoryUsageInMB: 1024 }) : PNG.sync.read(bytes);
}

function loadPixelArt(sourcePath, focalY = FOCAL_Y) {
  const image = decodeImage(sourcePath);
  if (!image?.width || !image?.height || !image?.data || image.data.length !== image.width * image.height * 4) throw new Error(`Unable to decode RGBA pixels from ${sourcePath}`);
  const crop = cropBounds(image.width, image.height, focalY);
  const pixels = [];
  for (let y = 0; y < TARGET_ROWS; y += 1) for (let x = 0; x < TARGET_COLUMNS; x += 1) {
    const sourceX = clamp(Math.floor(crop.left + (x + 0.5) * crop.width / TARGET_COLUMNS), 0, image.width - 1);
    const sourceY = clamp(Math.floor(crop.top + (y + 0.5) * crop.height / TARGET_ROWS), 0, image.height - 1);
    const offset = (sourceY * image.width + sourceX) * 4;
    pixels.push(nearestPaletteColor(image.data[offset], image.data[offset + 1], image.data[offset + 2]));
  }
  return pixels;
}

function loadArtworkPixelArt(artworks) {
  return artworks.map(({ id, sourcePath, focalY }) => { try { return loadPixelArt(sourcePath, focalY); } catch (error) { throw new Error(`Unable to sample ${id}: ${error.message}`); } });
}

function buildBaroqueMosaic({ artworks, artworkPixels }) {
  if (artworks.length !== 4 || artworkPixels.length !== 4 || artworkPixels.some((pixels) => pixels.length !== TARGET_COLUMNS * TARGET_ROWS)) throw new Error('Expected four complete Baroque artwork pixel arrays.');
  const pixels = [];
  for (let y = 0; y < TARGET_ROWS; y += 1) for (let x = 0; x < TARGET_COLUMNS; x += 1) {
    const colors = artworkPixels.map((artwork) => artwork[y * TARGET_COLUMNS + x]);
    const delays = colors.map((_, index) => transitionDelayFor(index, x, y));
    const keyTimes = [0, delays[0], delays[0] + PIXEL_TRANSITION_SECONDS, SEGMENT_SECONDS + delays[1], SEGMENT_SECONDS + delays[1] + PIXEL_TRANSITION_SECONDS, SEGMENT_SECONDS * 2 + delays[2], SEGMENT_SECONDS * 2 + delays[2] + PIXEL_TRANSITION_SECONDS, SEGMENT_SECONDS * 3 + delays[3], SEGMENT_SECONDS * 3 + delays[3] + PIXEL_TRANSITION_SECONDS, CYCLE_SECONDS].map((time) => (time / CYCLE_SECONDS).toFixed(4));
    const values = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2], colors[3], colors[3], colors[0], colors[0]];
    pixels.push(`<rect class="baroque-pixel" x="${x}" y="${y}" width="1" height="1" fill="${colors[0]}"><animate attributeName="fill" values="${values.join(';')}" keyTimes="${keyTimes.join(';')}" dur="${CYCLE_SECONDS}s" begin="0s" repeatCount="indefinite" /></rect>`);
  }
  return `<g id="baroque-pixel-carousel" data-artworks="${escapeXml(artworks.map(({ id }) => id).join(','))}">${pixels.join('')}</g>`;
}

module.exports = { TARGET_WEEKS, DAYS_PER_WEEK, SUBPIXELS_PER_DAY, TARGET_COLUMNS, TARGET_ROWS, PALETTE, TRANSITION_SECONDS, HOLD_SECONDS, SEGMENT_SECONDS, CYCLE_SECONDS, PIXEL_TRANSITION_SECONDS, LAST_REVEAL_DELAY, cropBounds, nearestPaletteColor, transitionDelayFor, escapeXml, loadPixelArt, loadArtworkPixelArt, buildBaroqueMosaic };
