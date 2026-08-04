const fs = require('fs');
const { PNG } = require('pngjs');

const TARGET_WEEKS = 53;
const DAYS_PER_WEEK = 7;
const SUBPIXELS_PER_DAY = 3;
const TARGET_COLUMNS = TARGET_WEEKS * SUBPIXELS_PER_DAY;
const TARGET_ROWS = DAYS_PER_WEEK * SUBPIXELS_PER_DAY;
const FOCAL_Y = 0.36;
const REVEAL_SECONDS = 10;
const HOLD_SECONDS = 4;
const RETURN_SECONDS = 4;
const CYCLE_SECONDS = 18;
const PIXEL_TRANSITION_SECONDS = 0.25;
const LAST_REVEAL_DELAY = REVEAL_SECONDS - PIXEL_TRANSITION_SECONDS;
const PALETTE = [
  '#090706', '#16100c', '#2b1b12', '#432918',
  '#5d3a20', '#794a25', '#965f2c', '#b77a38',
  '#d29a4e', '#edd08a', '#3d1e0f', '#6a2117',
  '#98351f', '#bd5730', '#d67c43', '#f0bf72',
];

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function cropBounds(width, height) {
  const cropHeight = width * TARGET_ROWS / TARGET_COLUMNS;
  if (width < TARGET_COLUMNS || height < cropHeight) {
    throw new Error(`Source image is too small for a ${TARGET_COLUMNS}x${TARGET_ROWS} pixel crop.`);
  }

  return {
    left: 0,
    top: clamp(Math.round(height * FOCAL_Y - cropHeight / 2), 0, height - cropHeight),
    width,
    height: cropHeight,
  };
}

function parseHex(color) {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function squaredDistance(color, red, green, blue) {
  const [paletteRed, paletteGreen, paletteBlue] = parseHex(color);
  return (paletteRed - red) ** 2 + (paletteGreen - green) ** 2 + (paletteBlue - blue) ** 2;
}

function nearestPaletteColor(red, green, blue) {
  return PALETTE.reduce(
    (best, color) => (squaredDistance(color, red, green, blue) < squaredDistance(best, red, green, blue) ? color : best),
    PALETTE[0]
  );
}

function mixHex(from, to, factor) {
  const fromChannels = parseHex(from);
  const toChannels = parseHex(to);
  const value = fromChannels
    .map((channel, index) => Math.round(channel + (toChannels[index] - channel) * factor).toString(16).padStart(2, '0'))
    .join('');
  return `#${value}`;
}

function initialColorForLevel(finalColor, level) {
  const factors = [0, 0.28, 0.48, 0.7, 1];
  const safeLevel = Math.min(4, Math.max(0, Number(level) || 0));
  return safeLevel === 0 ? PALETTE[0] : mixHex(PALETTE[0], finalColor, factors[safeLevel]);
}

function hash32(value) {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function animationDelayFor(date, subpixelX, subpixelY) {
  return (hash32(`${date}:${subpixelX}:${subpixelY}`) % 10000) / 10000 * LAST_REVEAL_DELAY;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildContributionMosaic({ data, pixelArt }) {
  if (data.length !== TARGET_WEEKS || data.some((week) => week.length !== DAYS_PER_WEEK)) {
    throw new Error(`Expected a ${TARGET_WEEKS}x${DAYS_PER_WEEK} contribution calendar.`);
  }
  if (pixelArt.length !== TARGET_COLUMNS * TARGET_ROWS) {
    throw new Error(`Expected ${TARGET_COLUMNS * TARGET_ROWS} source pixels.`);
  }

  const markup = data.map((week, weekIndex) => week.map((day, weekday) => {
    const level = Math.min(4, Math.max(0, Number(day.level) || 0));
    const pixels = [];
    for (let subY = 0; subY < SUBPIXELS_PER_DAY; subY += 1) {
      for (let subX = 0; subX < SUBPIXELS_PER_DAY; subX += 1) {
        const finalColor = pixelArt[(weekday * SUBPIXELS_PER_DAY + subY) * TARGET_COLUMNS + weekIndex * SUBPIXELS_PER_DAY + subX];
        const initialColor = initialColorForLevel(finalColor, level);
        const delay = animationDelayFor(day.date, subX, subY);
        const revealStart = (delay / CYCLE_SECONDS).toFixed(4);
        const revealEnd = ((delay + PIXEL_TRANSITION_SECONDS) / CYCLE_SECONDS).toFixed(4);
        const returnStart = ((REVEAL_SECONDS + HOLD_SECONDS + delay / LAST_REVEAL_DELAY * (RETURN_SECONDS - PIXEL_TRANSITION_SECONDS)) / CYCLE_SECONDS).toFixed(4);
        pixels.push(`<rect class="matthew-pixel" data-subpixel="${subX},${subY}" x="${weekIndex * SUBPIXELS_PER_DAY + subX}" y="${weekday * SUBPIXELS_PER_DAY + subY}" width="1" height="1" fill="${initialColor}"><animate attributeName="fill" values="${initialColor};${initialColor};${finalColor};${finalColor};${initialColor}" keyTimes="0;${revealStart};${revealEnd};${returnStart};1" dur="${CYCLE_SECONDS}s" begin="0s" repeatCount="indefinite" /></rect>`);
      }
    }
    return `<g class="contribution-day" data-date="${escapeXml(day.date)}" data-count="${Number(day.count) || 0}" data-level="${level}"><title>${escapeXml(`${day.date}: ${Number(day.count) || 0} contributions`)}</title>${pixels.join('')}</g>`;
  }).join('')).join('');
  return `<g id="calling-of-saint-matthew-mosaic">${markup}</g>`;
}

function loadPixelArt(sourcePath) {
  const image = PNG.sync.read(fs.readFileSync(sourcePath));
  if (!image?.width || !image?.height || !image?.data || image.data.length !== image.width * image.height * 4) {
    throw new Error(`Unable to decode RGBA pixels from ${sourcePath}`);
  }

  let crop;
  try {
    crop = cropBounds(image.width, image.height);
  } catch (error) {
    throw new Error(`${error.message} (${sourcePath})`);
  }

  const pixels = [];
  for (let y = 0; y < TARGET_ROWS; y += 1) {
    for (let x = 0; x < TARGET_COLUMNS; x += 1) {
      const sourceX = clamp(Math.floor(crop.left + (x + 0.5) * crop.width / TARGET_COLUMNS), 0, image.width - 1);
      const sourceY = clamp(Math.floor(crop.top + (y + 0.5) * crop.height / TARGET_ROWS), 0, image.height - 1);
      const offset = (sourceY * image.width + sourceX) * 4;
      pixels.push(nearestPaletteColor(image.data[offset], image.data[offset + 1], image.data[offset + 2]));
    }
  }

  return pixels;
}

module.exports = {
  TARGET_WEEKS,
  DAYS_PER_WEEK,
  SUBPIXELS_PER_DAY,
  TARGET_COLUMNS,
  TARGET_ROWS,
  PALETTE,
  REVEAL_SECONDS,
  HOLD_SECONDS,
  RETURN_SECONDS,
  CYCLE_SECONDS,
  PIXEL_TRANSITION_SECONDS,
  LAST_REVEAL_DELAY,
  cropBounds,
  nearestPaletteColor,
  mixHex,
  initialColorForLevel,
  animationDelayFor,
  escapeXml,
  buildContributionMosaic,
  loadPixelArt,
};
