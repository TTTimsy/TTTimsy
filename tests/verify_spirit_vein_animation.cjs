const assert = require('node:assert/strict');

const { buildAnimatedSvg } = require('../scripts/generate-spirit-vein-svg.cjs');

const data = [[
  { count: 0, date: '2026-01-01', level: 0, weekday: 0 },
  { count: 1, date: '2026-01-02', level: 1, weekday: 1 },
  { count: 4, date: '2026-01-03', level: 4, weekday: 2 },
]];

const svg = buildAnimatedSvg({ data, themeName: 'light' });

assert.match(svg, /id="ink-mountains"/);
assert.match(svg, /id="spirit-river"/);
assert.match(svg, /id="spirit-step-0"/);
assert.match(svg, /id="lotus-ripple-0"/);
assert.match(svg, /2026-01-02: 1 contributions/);
assert.match(svg, /2026-01-03: 4 contributions/);
assert.doesNotMatch(svg, /shooter|bullet|explosion/);

console.log('Spirit-vein landscape SVG checks passed.');
