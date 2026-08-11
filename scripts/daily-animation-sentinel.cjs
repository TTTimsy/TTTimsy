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
  return crypto.createHash('sha256').update(value).digest('hex');
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

module.exports = {
  createDailyState, decideMaintenance, restoreAnimations, shanghaiDateHour, verifyBenchmark,
};
