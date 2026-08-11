# Daily Animation Sentinel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub-native daily guard that restores the public animation from immutable benchmark files, records every scheduled maintenance commit, and shows a warm status card on the profile README.

**Architecture:** A CommonJS sentinel module owns the pure scheduling, integrity checking, restoration and presentation functions. A small CLI persists daily state, writes the README status region and status SVG, and tells the workflow whether a maintenance commit is needed. A scheduled workflow initializes the day at 00:00 Asia/Shanghai and, on later hourly runs, force-restores the benchmark and commits its audit trail to `main`.

**Tech Stack:** Node.js 20 built-in modules (`node:assert`, `node:crypto`, `node:fs`, `node:path`), GitHub Actions, Git.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `benchmark/TTTimsy-contribution-animation.svg` | Immutable light animation source. |
| `benchmark/TTTimsy-contribution-animation-dark.svg` | Immutable dark animation source. |
| `benchmark/manifest.json` | SHA-256 allowlist for the immutable sources. |
| `automation/daily-maintenance-state.json` | Committed daily schedule and execution evidence. |
| `assets/animation-sentinel-status.svg` | Generated warm visual status card embedded by README. |
| `scripts/daily-animation-sentinel.cjs` | Sentinel API and CLI. |
| `tests/verify_daily_animation_sentinel.cjs` | Behaviour and static workflow tests. |
| `.github/workflows/daily-animation-sentinel.yml` | Scheduled direct-to-`main` maintenance. |
| `README.md` | Stable markers around the generated status-card image. |
| `package.json` | Test command includes the sentinel suite. |

### Task 1: Define daily scheduling state with failing tests

**Files:**
- Create: `tests/verify_daily_animation_sentinel.cjs`
- Create: `scripts/daily-animation-sentinel.cjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing scheduling test**

```js
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
```

- [ ] **Step 2: Run the test and verify it fails because the module does not exist**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: `MODULE_NOT_FOUND` for `../scripts/daily-animation-sentinel.cjs`.

- [ ] **Step 3: Implement the minimal scheduling API**

```js
#!/usr/bin/env node

const HOUR_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
});

function shanghaiDateHour(now) {
  const parts = Object.fromEntries(HOUR_FORMATTER.formatToParts(now)
    .filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));
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
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: `Daily animation sentinel checks passed.`

- [ ] **Step 5: Include the new suite in the package test command**

```json
{
  "scripts": {
    "generate": "node scripts/generate-spirit-vein-svg.cjs",
    "test": "node tests/verify_calling_of_saint_matthew_animation.cjs && node tests/verify_daily_animation_sentinel.cjs"
  }
}
```

- [ ] **Step 6: Run the complete test command and commit**

Run: `npm test`

Expected: both animation and sentinel suites pass.

```bash
git add scripts/daily-animation-sentinel.cjs tests/verify_daily_animation_sentinel.cjs package.json
git commit -m "feat: add daily sentinel scheduling"
```

### Task 2: Create immutable benchmark assets and integrity guard

**Files:**
- Create: `benchmark/TTTimsy-contribution-animation.svg`
- Create: `benchmark/TTTimsy-contribution-animation-dark.svg`
- Create: `benchmark/manifest.json`
- Modify: `scripts/daily-animation-sentinel.cjs`
- Modify: `tests/verify_daily_animation_sentinel.cjs`

- [ ] **Step 1: Append failing benchmark-integrity and restoration tests**

```js
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { verifyBenchmark, restoreAnimations } = require('../scripts/daily-animation-sentinel.cjs');

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
```

- [ ] **Step 2: Run the test and verify the missing API fails**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: `verifyBenchmark is not a function`.

- [ ] **Step 3: Add hash validation and unconditional copy functions**

```js
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ANIMATION_FILES = ['TTTimsy-contribution-animation.svg', 'TTTimsy-contribution-animation-dark.svg'];
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

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
```

Export `verifyBenchmark` and `restoreAnimations` together with the Task 1 API.

- [ ] **Step 4: Materialize the trusted benchmark and manifest**

Run: `node scripts/generate-spirit-vein-svg.cjs`

Then copy the two generated root SVGs into `benchmark/` once, and generate the manifest from those exact bytes:

```powershell
Copy-Item TTTimsy-contribution-animation.svg benchmark/TTTimsy-contribution-animation.svg
Copy-Item TTTimsy-contribution-animation-dark.svg benchmark/TTTimsy-contribution-animation-dark.svg
node -e "const c=require('node:crypto'),f=require('node:fs'),p=require('node:path');const names=['TTTimsy-contribution-animation.svg','TTTimsy-contribution-animation-dark.svg'];const files=Object.fromEntries(names.map(n=>{const b=f.readFileSync(p.join('benchmark',n));return[n,c.createHash('sha256').update(b).digest('hex')]}));f.writeFileSync('benchmark/manifest.json',JSON.stringify({files},null,2)+'\n')"
```

Do not add any code path that writes `benchmark/`; only this initial, reviewed creation establishes the reference.

- [ ] **Step 5: Run both suites and commit**

Run: `npm test`

Expected: both suites pass; the benchmark mismatch assertion fails before any root animation is changed.

```bash
git add benchmark scripts/daily-animation-sentinel.cjs tests/verify_daily_animation_sentinel.cjs TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg
git commit -m "feat: add immutable animation benchmark"
```

### Task 3: Render the warm homepage card and persist sentinel executions

**Files:**
- Create: `automation/daily-maintenance-state.json`
- Create: `assets/animation-sentinel-status.svg`
- Modify: `README.md`
- Modify: `scripts/daily-animation-sentinel.cjs`
- Modify: `tests/verify_daily_animation_sentinel.cjs`

- [ ] **Step 1: Append failing presentation and state tests**

```js
const { renderStatusSvg, replaceReadmeStatus, advanceMaintenance } = require('../scripts/daily-animation-sentinel.cjs');

const normal = { date: '2026-08-11', planned: 15, completed: 4, alert: false, lastMaintainedAt: '2026-08-11T01:00:00+08:00' };
const warning = { ...normal, alert: true };
assert.match(renderStatusSvg(normal), /#d8a657/);
assert.match(renderStatusSvg(normal), /4\s*\/\s*15/);
assert.match(renderStatusSvg(warning), /#d94841/);
assert.match(renderStatusSvg(warning), /发现偏差 · 已覆写恢复/);
const readme = '<!-- animation-sentinel:start -->old<!-- animation-sentinel:end -->';
assert.match(replaceReadmeStatus(readme), /assets\/animation-sentinel-status\.svg/);
assert.throws(() => replaceReadmeStatus('# no markers'), /status markers/);
assert.deepEqual(advanceMaintenance(normal, { drifted: true }, '2026-08-11T02:00:00+08:00'), {
  ...warning, completed: 5, lastMaintainedAt: '2026-08-11T02:00:00+08:00',
});
```

- [ ] **Step 2: Run the test and verify the new presentation API fails**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: `renderStatusSvg is not a function`.

- [ ] **Step 3: Implement status-card functions**

```js
function renderStatusSvg(state) {
  const warning = state.alert;
  const accent = warning ? '#d94841' : '#d8a657';
  const message = warning ? '发现偏差 · 已覆写恢复' : '基准守护运行中';
  const dots = Array.from({ length: state.planned }, (_, index) => `<circle cx="${34 + index * 14}" cy="105" r="4" fill="${index < state.completed ? accent : '#4a3328'}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="130" viewBox="0 0 760 130" role="img" aria-label="Animation Sentinel ${state.completed}/${state.planned}"><rect width="760" height="130" rx="18" fill="#1d1411"/><rect x="14" y="14" width="732" height="102" rx="12" fill="#2b1c17" stroke="${accent}"/><text x="34" y="50" fill="#f2dfb5" font-family="Georgia,serif" font-size="22">Animation Sentinel · 动画守护</text><text x="34" y="82" fill="${accent}" font-family="Georgia,serif" font-size="32">${state.completed} / ${state.planned}</text><text x="180" y="79" fill="#f2dfb5" font-family="Arial,sans-serif" font-size="15">预计提交 ${state.planned + 1} 条 · ${message}</text>${dots}</svg>\n`;
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
```

- [ ] **Step 4: Add a CLI that only writes mutable paths**

Implement `main()` in `scripts/daily-animation-sentinel.cjs` to parse `--root <directory>`, `--now <ISO>` and `--random <0..1>`, load or create `automation/daily-maintenance-state.json`, call `decideMaintenance`, and:

```js
if (decision.kind === 'maintain' || decision.kind === 'initialize-and-maintain') {
  const result = restoreAnimations(root);
  state = advanceMaintenance(state, result, now.toISOString());
}
fs.mkdirSync(path.join(root, 'automation'), { recursive: true });
fs.writeFileSync(path.join(root, 'automation', 'daily-maintenance-state.json'), `${JSON.stringify(state, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'assets', 'animation-sentinel-status.svg'), renderStatusSvg(state));
fs.writeFileSync(path.join(root, 'README.md'), replaceReadmeStatus(fs.readFileSync(path.join(root, 'README.md'), 'utf8')));
console.log(JSON.stringify({ action: decision.kind, state }));
```

Set the GitHub Actions output when it is available so the workflow can skip completed days:

```js
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `action=${decision.kind}\n`);
```

The CLI must never write `benchmark/`, and must exit nonzero before mutable writes if `verifyBenchmark()` fails.

- [ ] **Step 5: Insert stable README markers and create initial state artifacts**

Place this immediately after the contribution animation `<picture>` block:

```md
<!-- animation-sentinel:start -->
<img src="https://raw.githubusercontent.com/TTTimsy/TTTimsy/main/assets/animation-sentinel-status.svg" alt="Animation Sentinel maintenance status" width="100%" />
<!-- animation-sentinel:end -->
```

Run: `node scripts/daily-animation-sentinel.cjs --now 2026-08-10T16:00:00.000Z --random 0.7`

Expected: state has `date: "2026-08-11"`, `planned: 15`, `completed: 0`; the card is warm gold and shows `0 / 15`.

- [ ] **Step 6: Run both suites and commit**

Run: `npm test`

Expected: both suites pass.

```bash
git add README.md automation/daily-maintenance-state.json assets/animation-sentinel-status.svg scripts/daily-animation-sentinel.cjs tests/verify_daily_animation_sentinel.cjs
git commit -m "feat: show animation sentinel status"
```

### Task 4: Schedule direct GitHub maintenance and contribution audit commits

**Files:**
- Create: `.github/workflows/daily-animation-sentinel.yml`
- Modify: `tests/verify_daily_animation_sentinel.cjs`

- [ ] **Step 1: Append the failing workflow contract test**

```js
const workflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'daily-animation-sentinel.yml'), 'utf8');
assert.match(workflow, /cron:\s*'0 \* \* \* \*'/);
assert.match(workflow, /TZ:\s*Asia\/Shanghai/);
assert.match(workflow, /contents:\s*write/);
assert.match(workflow, /git config user\.email "\$\{\{ github\.repository_owner \}\}@users\.noreply\.github\.com"/);
assert.match(workflow, /git commit --allow-empty/);
assert.match(workflow, /node scripts\/daily-animation-sentinel\.cjs/);
assert.match(workflow, /steps\.sentinel\.outputs\.action != 'idle'/);
```

- [ ] **Step 2: Run the test and verify it fails because the workflow is absent**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: `ENOENT` for `daily-animation-sentinel.yml`.

- [ ] **Step 3: Add the scheduled workflow**

```yaml
name: Daily Animation Sentinel

on:
  workflow_dispatch:
  schedule:
    - cron: '0 * * * *'

permissions:
  contents: write

concurrency:
  group: daily-animation-sentinel
  cancel-in-progress: false

jobs:
  maintain:
    runs-on: ubuntu-latest
    env:
      TZ: Asia/Shanghai
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm

      - run: npm ci

      - name: Restore benchmark and update maintenance evidence
        id: sentinel
        run: node scripts/daily-animation-sentinel.cjs

      - name: Commit scheduled maintenance
        if: steps.sentinel.outputs.action != 'idle'
        run: |
          git config user.name "${{ github.repository_owner }} Animation Sentinel"
          git config user.email "${{ github.repository_owner }}@users.noreply.github.com"
          git add TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg README.md assets/animation-sentinel-status.svg automation/daily-maintenance-state.json
          git commit --allow-empty -m "chore: animation sentinel maintenance [skip ci]"
          for attempt in 1 2 3; do
            git pull --rebase origin main && git push origin HEAD:main && exit 0
            git rebase --abort || true
            sleep "$attempt"
          done
          exit 1
```

The CLI must output `action: "idle"` after the day has completed. Add a workflow condition so the commit step is skipped for idle runs; all initialization and maintenance runs commit, including identical animation content.

- [ ] **Step 4: Run the workflow contract test and complete suite**

Run: `npm test`

Expected: both suites pass and the workflow test confirms cron, author identity and empty-commit behaviour.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/daily-animation-sentinel.yml tests/verify_daily_animation_sentinel.cjs
git commit -m "ci: schedule daily animation sentinel"
```

### Task 5: Verify real CLI transitions and protect generated workflow scope

**Files:**
- Modify: `tests/verify_daily_animation_sentinel.cjs`
- Modify: `.github/workflows/generate-contribution-animation.yml`
- Modify: `README.md` only if the marker test reveals a placement issue

- [ ] **Step 1: Append the failing end-to-end CLI test**

```js
const childProcess = require('node:child_process');
const root = path.join(__dirname, '..');
const cliRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'animation-sentinel-cli-'));
fs.cpSync(path.join(root, 'benchmark'), path.join(cliRoot, 'benchmark'), { recursive: true });
fs.mkdirSync(path.join(cliRoot, 'assets'));
for (const filename of ['README.md', 'TTTimsy-contribution-animation.svg', 'TTTimsy-contribution-animation-dark.svg']) fs.copyFileSync(path.join(root, filename), path.join(cliRoot, filename));
const first = childProcess.execFileSync(process.execPath, ['scripts/daily-animation-sentinel.cjs', '--root', cliRoot, '--now', '2026-08-10T17:00:00.000Z', '--random', '0.7'], { cwd: root, encoding: 'utf8' });
assert.match(first, /"action":"initialize-and-maintain"/);
const current = JSON.parse(fs.readFileSync(path.join(cliRoot, 'automation', 'daily-maintenance-state.json'), 'utf8'));
assert.equal(current.completed, 1);
assert.equal(current.alert, false);
assert.match(fs.readFileSync(path.join(cliRoot, 'README.md'), 'utf8'), /animation-sentinel:start/);
fs.rmSync(cliRoot, { recursive: true, force: true });
```

- [ ] **Step 2: Run the test and verify it fails because the CLI does not yet parse deterministic flags or emit compact JSON**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: failure identifying the missing `--now` / `--random` CLI handling or mismatched output.

- [ ] **Step 3: Implement deterministic CLI arguments and no-op completion**

Parse `process.argv.slice(2)` as exact `--root`, `--now` and `--random` value pairs. Reject malformed dates and random values outside `[0, 1)`. Use the parsed values in `shanghaiDateHour()` and `createDailyState()`, and finish with:

```js
console.log(JSON.stringify({ action: decision.kind, state }));
```

When `decision.kind === 'idle'`, do not rewrite the state, README, status SVG, or animation files; this allows the workflow to skip Git work cleanly.

- [ ] **Step 4: Ensure the existing generator cannot retrigger from sentinel output**

Keep the existing generator workflow's `push.paths` limited to its current source inputs. Do not add `benchmark/**`, `automation/**`, `assets/animation-sentinel-status.svg`, `README.md`, or `TTTimsy-contribution-animation*.svg`; verify this by adding negative assertions to the workflow contract test.

- [ ] **Step 5: Run focused and complete verification**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: deterministic initialization/maintenance passes, and all static workflow assertions pass.

Run: `npm test`

Expected: both suites pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/daily-animation-sentinel.cjs tests/verify_daily_animation_sentinel.cjs .github/workflows/generate-contribution-animation.yml README.md automation/daily-maintenance-state.json assets/animation-sentinel-status.svg
git commit -m "test: cover sentinel maintenance lifecycle"
```

### Task 6: Final integrity verification and documentation handoff

**Files:**
- Modify: `README.md` only if automated checks identify marker drift
- Modify: `docs/superpowers/specs/2026-08-11-daily-animation-sentinel-design.md` only if implementation uncovered a required factual correction

- [ ] **Step 1: Check the immutable benchmark against its manifest**

Run: `node -e "const s=require('./scripts/daily-animation-sentinel.cjs'); console.log(Object.keys(s.verifyBenchmark(process.cwd())).join(','))"`

Expected: both animation filenames print and the command exits 0.

- [ ] **Step 2: Exercise one clean and one drifted restoration in a disposable copy**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: the suite proves clean files are still copied and drifted files set a persistent alert without modifying benchmark files.

- [ ] **Step 3: Run final checks**

Run: `npm test`

Expected: all tests pass with no warnings.

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: no uncommitted tracked changes in the feature worktree.

- [ ] **Step 4: Commit any factual documentation correction, then request review**

```bash
git add README.md docs/superpowers/specs/2026-08-11-daily-animation-sentinel-design.md
git commit -m "docs: finalize animation sentinel usage"
```

Only run this commit when the prior steps produced a tracked documentation change. Then request code review before merge; do not push or merge without user direction.
