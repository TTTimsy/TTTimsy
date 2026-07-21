# Spirit-Vein Landscape Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bubble-shooter contribution SVG with a tested, self-contained Chinese-fantasy spirit-vein landscape animation.

**Architecture:** Refactor `scripts/generate-svg.cjs` so its pure SVG builder can be imported by a Node assertion script while direct execution continues to fetch the calendar and write the two existing SVG files. The builder renders decorative ink-mountain and river layers behind date-positioned contribution lamps, then uses SMIL spirit-light, ripple, lotus, mist, and river animations without external assets.

**Tech Stack:** Node.js 20/CommonJS, self-contained SVG/SMIL, PowerShell, GitHub Actions, GitHub CLI.

---

### Task 1: Define failing visual and data-preservation checks

**Files:**
- Modify: `tests/verify_private_contribution_animation.ps1`
- Create: `tests/verify_spirit_vein_animation.cjs`
- Test: `tests/verify_private_contribution_animation.ps1`
- Test: `tests/verify_spirit_vein_animation.cjs`

- [ ] **Step 1: Extend the PowerShell source check**

Append these checks after the existing token checks:

```powershell
if ($generator -notmatch 'id="ink-mountains"') { throw 'The spirit-vein mountain layer is missing.' }
if ($generator -notmatch 'id="spirit-river"') { throw 'The spirit-vein river layer is missing.' }
if ($generator -notmatch 'id="spirit-step-') { throw 'The sequential spirit-light animation is missing.' }
if ($generator -match 'shooter|bullet|explosion') { throw 'Bubble-shooter artwork remains in the generator.' }
```

- [ ] **Step 2: Write the deterministic SVG test**

Create `tests/verify_spirit_vein_animation.cjs`:

```js
const assert = require('node:assert/strict');
const { buildAnimatedSvg } = require('../scripts/generate-svg.cjs');

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
```

- [ ] **Step 3: Run both tests to verify the old artwork fails**

Run:

```powershell
pwsh -File tests/verify_private_contribution_animation.ps1
node tests/verify_spirit_vein_animation.cjs
```

Expected: the PowerShell test fails with `The spirit-vein mountain layer is missing.` and the Node test cannot import a usable `buildAnimatedSvg` from the old generator.

### Task 2: Build the testable spirit-vein landscape SVG

**Files:**
- Create: `scripts/generate-spirit-vein-svg.cjs`
- Delete: `scripts/generate-svg.cjs`
- Test: `tests/verify_private_contribution_animation.ps1`
- Test: `tests/verify_spirit_vein_animation.cjs`

- [ ] **Step 1: Make direct execution and importing distinct**

Move the token and username validation into `main()`. Replace the unconditional final call with:

```js
if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { buildAnimatedSvg, normalizeWeeks };
```

The direct `node scripts/generate-svg.cjs` path must retain its existing missing-token error text.

- [ ] **Step 2: Replace arcade theme fields and scene builder**

Replace `shooter`, `bullet`, `explosion`, and `sparkle` theme fields with `paper`, `mist`, `mountainNear`, `mountainFar`, `river`, `lamp`, `lampBright`, `lotus`, and `spirit` colors. In `buildAnimatedSvg`, retain the current week/day `cx`, `cy`, `count`, `date`, `level`, and `<title>` generation, but generate this layer order:

```text
svg defs: paper gradient, mist gradient, river gradient
background paper rectangle
ink-mountains group: three low-opacity ridge paths
spirit-river path and moving river-light stroke
contribution-lamps group: all dated nodes and titles
spirit-light group: at most 120 active-date paths and lotus ripples
foreground drifting-mist group
```

Use exact identifiers `ink-mountains`, `spirit-river`, `spirit-step-${index}`, and `lotus-ripple-${index}`. Active dates use a maximum 120-item chronological subset. Each spirit-step begins at `cycle.begin + index * 0.34s`; the cycle duration is at least 8 seconds and includes a one-second pause. No output string may contain `shooter`, `bullet`, or `explosion`.

- [ ] **Step 3: Preserve labels and generated filenames**

Use an SVG title of `${username} spirit-vein contribution landscape` and a description that says it is an animated Chinese-fantasy landscape based on GitHub contribution data. Do not change `normalizeWeeks`, the GraphQL query, output filenames, or the light/dark output loop.

- [ ] **Step 4: Run local verification**

Run:

```powershell
node --check scripts/generate-spirit-vein-svg.cjs
pwsh -File tests/verify_private_contribution_animation.ps1
node tests/verify_spirit_vein_animation.cjs
$env:GITHUB_TOKEN = $null
$env:GH_TOKEN = $null
$env:GITHUB_AUTH_TOKEN = $null
node scripts/generate-spirit-vein-svg.cjs
```

Expected: syntax and both tests pass; the last command exits nonzero with `GITHUB_TOKEN, GH_TOKEN, or GITHUB_AUTH_TOKEN is required.` and writes no SVG.

- [ ] **Step 5: Commit the implementation**

```bash
git add scripts/generate-spirit-vein-svg.cjs scripts/generate-svg.cjs .github/workflows/generate-contribution-animation.yml tests/verify_private_contribution_animation.ps1 tests/verify_spirit_vein_animation.cjs docs/superpowers/plans/2026-07-21-spirit-vein-landscape-animation.md
git commit -m "feat: render spirit-vein contribution landscape"
```

### Task 3: Publish and verify the profile animation

**Files:**
- Verify: `TTTimsy-contribution-animation.svg`
- Verify: `TTTimsy-contribution-animation-dark.svg`
- Verify: `README.md`

- [ ] **Step 1: Synchronize and push**

Run `git fetch origin main` and `git log --oneline HEAD..origin/main`. If the log is empty, run `git push origin main`.

- [ ] **Step 2: Wait for the push-triggered workflow**

Use `gh run list --repo TTTimsy/TTTimsy --workflow generate-contribution-animation.yml --limit 1 --json databaseId,status,conclusion,event`, then `gh run watch <databaseId> --repo TTTimsy/TTTimsy --exit-status`.

Expected: the run concludes successfully. Do not dispatch another run while the push-triggered run is active.

- [ ] **Step 3: Fetch and inspect the generated SVGs**

Run `git pull --ff-only origin main`, then verify both generated files contain `id="ink-mountains"`, `id="spirit-river"`, and a nonzero count of `id="spirit-step-[0-9]+"`. Verify README retains both SVG URLs with `rg -n 'TTTimsy-contribution-animation\.svg|TTTimsy-contribution-animation-dark\.svg' README.md`.

- [ ] **Step 4: Verify contribution attribution**

Run `git log -2 --format='%h %an <%ae> %s'` and confirm each new authored commit uses `TTTimsy <texturelin@gmail.com>`.
