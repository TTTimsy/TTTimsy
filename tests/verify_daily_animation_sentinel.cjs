const assert = require('node:assert/strict');
const {
  createDailyState,
  decideMaintenance,
  shanghaiDateHour,
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

console.log('Daily animation sentinel checks passed.');
