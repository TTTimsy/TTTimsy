#!/usr/bin/env node

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

module.exports = { createDailyState, decideMaintenance, shanghaiDateHour };
