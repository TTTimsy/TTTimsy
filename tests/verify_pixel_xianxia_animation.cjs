const assert = require('node:assert/strict');

const { buildAnimatedSvg } = require('../scripts/generate-spirit-vein-svg.cjs');

const data = [
  [
    { count: 0, date: '2026-01-01', level: 0, weekday: 0 },
    { count: 2, date: '2026-01-02', level: 2, weekday: 1 },
    { count: 0, date: '2026-01-03', level: 0, weekday: 2 },
  ],
  [
    { count: 5, date: '2026-01-04', level: 4, weekday: 0 },
    { count: 0, date: '2026-01-05', level: 0, weekday: 1 },
    { count: 1, date: '2026-01-06', level: 1, weekday: 2 },
  ],
];

const svg = buildAnimatedSvg({ data, themeName: 'dark', profileName: 'Timsy' });

assert.match(svg, /shape-rendering="crispEdges"/);
assert.match(svg, /id="pixel-far-ridges"/);
assert.match(svg, /id="pixel-frame-ridges"/);
assert.match(svg, /id="pixel-river-valley"/);
assert.match(svg, /id="pixel-mist-banks"/);
assert.match(svg, /id="contribution-spirit-vein"/);
assert.match(svg, /id="spirit-smoke-actors"/);
assert.match(svg, /id="smoke-actor-0"/);
assert.match(svg, /2026-01-02: 2 contributions/);
assert.match(svg, /2026-01-04: 5 contributions/);
assert.match(svg, /2026-01-06: 1 contributions/);
const actorMatch = svg.match(/<g id="smoke-actor-0" data-source-date="([^"]+)" data-destination-date="([^"]+)"/);
assert.ok(actorMatch, 'the first smoke actor must expose its source and destination dates');
assert.notEqual(actorMatch[1], actorMatch[2], 'smoke must reassemble at a different active date');

const smokePixels = svg.match(/class="smoke-micro-pixel"/g) || [];
assert.ok(smokePixels.length > 0, 'active contributions should create drifting smoke');
assert.ok(smokePixels.length <= 90, 'the animation must cap moving micro-pixels');
assert.equal(smokePixels.length % 8, 0, 'each smoke actor should own eight micro-pixels');

const viewBoxMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
assert.ok(viewBoxMatch, 'SVG should declare a numeric viewBox');
const fullCanvasRect = new RegExp(
  `<rect[^>]*x="0"[^>]*y="0"[^>]*width="${viewBoxMatch[1]}"[^>]*height="${viewBoxMatch[2]}"`
);
assert.doesNotMatch(svg, fullCanvasRect);
assert.doesNotMatch(svg, /data:image\/png;base64,|sword-dais|sword-flight|starfire-flare|flying-sword/i);
assert.doesNotMatch(svg, /<(?:image|circle|ellipse|path|text|linearGradient|radialGradient|filter)\b/);
assert.doesNotMatch(svg, /[\u3400-\u9fff]/);
assert.doesNotMatch(svg, /shooter|launcher|bullet|bubble|explosion/i);

const denseData = Array.from({ length: 12 }, (_, weekIndex) =>
  Array.from({ length: 7 }, (_, dayIndex) => ({
    count: 1,
    date: `2026-02-${String(weekIndex * 7 + dayIndex + 1).padStart(2, '0')}`,
    level: 2,
    weekday: dayIndex,
  }))
);
const denseSvg = buildAnimatedSvg({ data: denseData, themeName: 'dark', profileName: 'Timsy' });
assert.equal((denseSvg.match(/id="smoke-actor-/g) || []).length, 11, 'smoke actor count should be capped at eleven');
assert.equal((denseSvg.match(/class="smoke-micro-pixel"/g) || []).length, 88, 'dense calendars should cap at 88 moving pixels');

assert.match(svg, /fill="#18324b" opacity="1"/, 'mountain bodies should be opaque');
assert.match(svg, /fill="#77a4af" opacity="1"/, 'mountains should expose a distinct rocky edge layer');
const staticStars = svg.match(/<rect[^>]*fill="#f8d888"[^>]*>/g) || [];
assert.ok(staticStars.length >= 8, 'the night sky should retain visible, sparse starfire');
assert.ok(staticStars.every((star) => /width="[12]"/.test(star)), 'starfire must not form a long yellow line');

const countTierSvg = buildAnimatedSvg({
  data: [[{ count: 12, date: '2026-02-01', level: 1, weekday: 0 }]],
  themeName: 'dark',
  profileName: 'Timsy',
});
assert.match(countTierSvg, /data-date="2026-02-01" data-level="3"/, 'contribution count should strengthen a low reported level');

console.log('Terraria spirit-vein SVG checks passed.');
