#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ANIMATION_FILES = ['TTTimsy-contribution-animation.svg', 'TTTimsy-contribution-animation-dark.svg'];
const HOUR_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
});

function shanghaiDateHour(now) {
  const parts = Object.fromEntries(HOUR_FORMATTER.formatToParts(now)
    .filter(({ type }) => type !== 'literal')
    .map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

function createDailyState(date, random = Math.random) {
  const value = random();
  if (!(value >= 0 && value < 1)) throw new Error('random value must be in [0, 1)');
  return { date, planned: Math.floor(value * 20) + 1, completed: 0, alert: false, lastMaintainedAt: null };
}

function decideMaintenance(state, now) {
  if (state.date !== now.date) return { kind: 'initialize-and-maintain' };
  if (now.hour === 0) return { kind: 'initialize' };
  if (state.completed < state.planned) return { kind: 'maintain' };
  return { kind: 'idle' };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value.replace(/\r\n/g, '\n')).digest('hex');
}

function verifyBenchmark(root) {
  const benchmarkDir = path.join(root, 'benchmark');
  const manifest = JSON.parse(fs.readFileSync(path.join(benchmarkDir, 'manifest.json'), 'utf8'));
  return Object.fromEntries(ANIMATION_FILES.map((name) => {
    const contents = fs.readFileSync(path.join(benchmarkDir, name), 'utf8');
    if (manifest.files[name] !== sha256(contents)) throw new Error(`benchmark hash mismatch: ${name}`);
    return [name, contents];
  }));
}

function restoreAnimations(root) {
  const benchmark = verifyBenchmark(root);
  const drifted = ANIMATION_FILES.some((name) => fs.readFileSync(path.join(root, name), 'utf8') !== benchmark[name]);
  for (const name of ANIMATION_FILES) fs.writeFileSync(path.join(root, name), benchmark[name], 'utf8');
  return { drifted, restored: true };
}

function renderStatusSvg(state) {
  const warning = state.alert;
  const accent = warning ? '#d94841' : '#d8a657';
  const icon = warning
    ? '<path d="M34 34L52 66H16Z" fill="#d94841"/><text x="34" y="58" text-anchor="middle" fill="#1d1411" font-family="Arial,sans-serif" font-size="20">!</text>'
    : '<path d="M34 18L52 26V43C52 55 44 65 34 70C24 65 16 55 16 43V26Z" fill="#d8a657"/>';
  const dots = Array.from({ length: state.planned }, (_, index) => `<circle cx="${90 + index * 14}" cy="105" r="4" fill="${index < state.completed ? accent : '#4a3328'}"/>`).join('');
  const stateName = warning ? 'alert' : 'normal';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="130" viewBox="0 0 760 130" role="img" aria-label="Animation Sentinel ${state.completed}/${state.planned}" data-state="${stateName}"><rect width="760" height="130" rx="18" fill="#1d1411"/><rect x="14" y="14" width="732" height="102" rx="12" fill="#2b1c17" stroke="${accent}"/>${icon}<text x="78" y="62" fill="${accent}" font-family="Georgia,serif" font-size="30">${state.completed} / ${state.planned}</text><text x="78" y="88" fill="#f2dfb5" font-family="Arial,sans-serif" font-size="15">${state.planned + 1}</text>${dots}</svg>\n`;
}

function replaceReadmeStatus(readme) {
  const start = '<!-- animation-sentinel:start -->';
  const end = '<!-- animation-sentinel:end -->';
  if (!readme.includes(start) || !readme.includes(end)) throw new Error('README status markers are missing');
  return readme.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n<img src="https://raw.githubusercontent.com/TTTimsy/TTTimsy/main/assets/animation-sentinel-status.svg" alt="Animation Sentinel maintenance status" width="100%" />\n${end}`);
}

function advanceMaintenance(state, result, timestamp) {
  return { ...state, completed: state.completed + 1, alert: state.alert || result.drifted, lastMaintainedAt: timestamp };
}

function parseArgs(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!args[index].startsWith('--') || args[index + 1] === undefined) throw new Error('arguments must be --name value pairs');
    values[args[index].slice(2)] = args[index + 1];
  }
  return values;
}

function runSentinel({ root, now = new Date(), random = Math.random }) {
  const clock = shanghaiDateHour(now);
  const statePath = path.join(root, 'automation', 'daily-maintenance-state.json');
  const previous = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
  let state = previous && previous.date === clock.date ? previous : createDailyState(clock.date, random);
  let action = decideMaintenance(previous || { ...state, date: previous ? previous.date : 'missing' }, clock).kind;
  if (!previous) action = clock.hour === 0 ? 'initialize' : 'initialize-and-maintain';
  if (action === 'idle') return { action, state };
  if (action === 'maintain' || action === 'initialize-and-maintain') state = advanceMaintenance(state, restoreAnimations(root), now.toISOString());
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets', 'animation-sentinel-status.svg'), renderStatusSvg(state));
  fs.writeFileSync(path.join(root, 'README.md'), replaceReadmeStatus(fs.readFileSync(path.join(root, 'README.md'), 'utf8')));
  return { action, state };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = args.now ? new Date(args.now) : new Date();
  if (Number.isNaN(now.valueOf())) throw new Error('invalid --now value');
  const random = args.random === undefined ? Math.random : () => Number(args.random);
  const result = runSentinel({ root: args.root ? path.resolve(args.root) : process.cwd(), now, random });
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `action=${result.action}\n`);
  console.log(JSON.stringify(result));
}

if (require.main === module) main();

module.exports = {
  advanceMaintenance, createDailyState, decideMaintenance, parseArgs, renderStatusSvg, replaceReadmeStatus, restoreAnimations, runSentinel, shanghaiDateHour, verifyBenchmark,
};
