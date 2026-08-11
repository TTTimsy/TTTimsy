const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  createDailyState,
  decideMaintenance,
  restoreAnimations,
  shanghaiDateHour,
  verifyBenchmark,
} = require('../scripts/daily-animation-sentinel.cjs');

assert.deepEqual(
  shanghaiDateHour(new Date('2026-08-10T16:00:00.000Z')),
  { date: '2026-08-11', hour: 0 },
);
assert.deepEqual(createDailyState('2026-08-11', () => 0), {
  date: '2026-08-11', planned: 1, completed: 0, alert: false, lastMaintainedAt: null,
});
assert.deepEqual(createDailyState('2026-08-11', () => 0.999999), {
  date: '2026-08-11', planned: 20, completed: 0, alert: false, lastMaintainedAt: null,
});
assert.throws(() => createDailyState('2026-08-11', () => 1), /random value/);
assert.equal(decideMaintenance({ date: '2026-08-11', planned: 4, completed: 0, alert: false, lastMaintainedAt: null }, { date: '2026-08-11', hour: 0 }).kind, 'initialize');
assert.equal(decideMaintenance({ date: '2026-08-11', planned: 4, completed: 0, alert: false, lastMaintainedAt: null }, { date: '2026-08-11', hour: 1 }).kind, 'maintain');
assert.equal(decideMaintenance({ date: '2026-08-11', planned: 4, completed: 4, alert: false, lastMaintainedAt: null }, { date: '2026-08-11', hour: 8 }).kind, 'idle');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'animation-sentinel-'));
const benchmarkDir = path.join(tempRoot, 'benchmark');
fs.mkdirSync(benchmarkDir);
const files = {
  'TTTimsy-contribution-animation.svg': '<svg>light</svg>\n',
  'TTTimsy-contribution-animation-dark.svg': '<svg>dark</svg>\n',
};
for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(benchmarkDir, name), value);
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
fs.writeFileSync(path.join(benchmarkDir, 'manifest.json'), JSON.stringify({ files: Object.fromEntries(Object.entries(files).map(([name, value]) => [name, digest(value)])) }));
fs.writeFileSync(path.join(tempRoot, 'TTTimsy-contribution-animation.svg'), 'wrong');
fs.writeFileSync(path.join(tempRoot, 'TTTimsy-contribution-animation-dark.svg'), files['TTTimsy-contribution-animation-dark.svg']);
assert.deepEqual(verifyBenchmark(tempRoot), files);
assert.deepEqual(restoreAnimations(tempRoot), { drifted: true, restored: true });
assert.equal(fs.readFileSync(path.join(tempRoot, 'TTTimsy-contribution-animation.svg'), 'utf8'), files['TTTimsy-contribution-animation.svg']);
const badManifest = path.join(benchmarkDir, 'manifest.json');
fs.writeFileSync(badManifest, JSON.stringify({ files: { ...JSON.parse(fs.readFileSync(badManifest, 'utf8')).files, 'TTTimsy-contribution-animation.svg': '0'.repeat(64) } }));
assert.throws(() => verifyBenchmark(tempRoot), /benchmark hash mismatch/);
fs.rmSync(tempRoot, { recursive: true, force: true });

console.log('Daily animation sentinel checks passed.');
