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
assert.match(svg, /id="pixel-mountains"/);
assert.match(svg, /id="pixel-cloud-banks"/);
assert.match(svg, /id="contribution-starfire"/);
assert.match(svg, /id="sword-dais"/);
assert.match(svg, /id="sword-flight-0"/);
assert.match(svg, /id="sword-flight-1"/);
assert.match(svg, /id="starfire-flare-0"/);
assert.match(svg, /data:image\/png;base64,/);
assert.match(svg, /2026-01-02: 2 contributions/);
assert.match(svg, /2026-01-04: 5 contributions/);
assert.match(svg, /2026-01-06: 1 contributions/);
assert.match(svg, /begin="sword-flight-0\.end\+0\.14s"/);
assert.ok(svg.indexOf('id="sword-flight-0"') < svg.indexOf('id="sword-flight-1"'));
assert.doesNotMatch(svg, /<rect width="\d+" height="\d+"/);
assert.doesNotMatch(svg, /<(?:circle|ellipse|path|text|linearGradient)\b/);
assert.doesNotMatch(svg, /[\u3400-\u9fff]/);
assert.doesNotMatch(svg, /shooter|launcher|bullet|bubble|explosion/i);

console.log('Pixel xianxia SVG checks passed.');
