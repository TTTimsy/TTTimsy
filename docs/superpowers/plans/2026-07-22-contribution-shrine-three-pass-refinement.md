# Contribution Shrine Three-Pass Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the contribution calendar the primary visual focus through three independently verified passes: shrine hierarchy, gemstone palette, and connected 2px material detail.

**Architecture:** Keep the single CommonJS SVG painter and its GraphQL/SMIL interfaces intact. Add one dynamic, transparent `contribution-shrine` layer between terrain and calendar cells, then refine the existing theme roles and fixed pixel glyphs without adding SVG primitives or asset dependencies. Each pass lands on `main`, waits for the existing workflow to regenerate the real SVGs, then uses a temporary headless-browser screenshot for visual inspection.

**Tech Stack:** Node.js CommonJS, static SVG/SMIL, Node `assert`, PowerShell, GitHub Actions, Microsoft Edge headless screenshot mode.

**Execution note:** The user has explicitly authorized direct commits and pushes to `main`; do not create a worktree or PR for this plan.

---

## File Structure

- `scripts/generate-spirit-vein-svg.cjs` remains the only production SVG
  painter. It owns the theme roles, dynamic shrine geometry, terrain placement,
  mineral silhouettes, and smoke sprite dimensions.
- `tests/verify_pixel_xianxia_animation.cjs` is the regression contract for
  SVG structure, composition order, palette, tile grammar, named contribution
  shapes, and animation limits.
- `tests/verify_private_contribution_animation.ps1` stays a workflow/data
  guard; only extend it when the production layer identifier needs protection.
- `TTTimsy-contribution-animation.svg` and
  `TTTimsy-contribution-animation-dark.svg` remain workflow-generated only;
  do not hand-edit them.

## Common Preview Loop

Run this after each workflow-generated SVG commit. The commands create only
temporary files under the operating system temp directory; they do not change
repository assets.

```powershell
$previewRoot = Join-Path $env:TEMP 'tttimsy-contribution-preview'
New-Item -ItemType Directory -Path $previewRoot -Force | Out-Null
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$darkSvg = (Resolve-Path 'TTTimsy-contribution-animation-dark.svg').Path -replace '\\', '/'
$lightSvg = (Resolve-Path 'TTTimsy-contribution-animation.svg').Path -replace '\\', '/'
& $edge --headless=new --disable-gpu --default-background-color=0D1117 "--screenshot=$previewRoot\pass-dark.png" --window-size=1440,360 "file:///$darkSvg"
& $edge --headless=new --disable-gpu --default-background-color=FFFFFF "--screenshot=$previewRoot\pass-light.png" --window-size=1440,360 "file:///$lightSvg"
```

Open both temporary PNGs with `view_image`. Inspect at normal display size:
the contribution cells must be the first visual read; the landscape must stay
outside or below the calendar envelope; no isolated small marks may read as
unexplained noise. Delete the temporary preview directory only after the next
pass has been accepted; never add it to Git.

## Task 1: Pass One — Add the Dynamic Contribution Shrine

**Files:**
- Modify: `tests/verify_pixel_xianxia_animation.cjs`
- Modify: `tests/verify_private_contribution_animation.ps1`
- Modify: `scripts/generate-spirit-vein-svg.cjs`

- [ ] **Step 1: Add hierarchy regression assertions**

In `tests/verify_pixel_xianxia_animation.cjs`, directly after the existing
layer-ID assertions, add the following contract. Keep `groupContent` and
`rectDimension` as the existing helpers.

```js
assert.match(svg, /id="contribution-shrine"/);

const shrineIndex = svg.indexOf('id="contribution-shrine"');
const terrainIndex = svg.indexOf('id="pixel-mist-banks"');
const contributionIndex = svg.indexOf('id="contribution-spirit-vein"');
assert.ok(terrainIndex < shrineIndex, 'the shrine must sit above the terrain');
assert.ok(shrineIndex < contributionIndex, 'contribution cells must sit above the shrine');

const shrineRects = [...groupContent(svg, 'contribution-shrine').matchAll(/<rect\b[^>]*\/>/g)]
  .map(([tag]) => tag);
assert.equal(shrineRects.length, 8, 'the shrine should have only lintel, plinth, and four piers');
assert.ok(
  shrineRects.every((tag) => rectDimension(tag, 'height') <= 10),
  'the shrine must remain an open frame rather than a filled calendar panel'
);
```

In `tests/verify_private_contribution_animation.ps1`, add a source guard
before the existing old-art checks:

```powershell
if ($generator -notmatch 'id="contribution-shrine"') {
  throw 'The contribution shrine layer is missing.'
}
```

- [ ] **Step 2: Run the focused test and confirm red**

Run:

```powershell
node tests/verify_pixel_xianxia_animation.cjs
```

Expected: failure mentioning `contribution-shrine`, because the current SVG
painter has no calendar frame.

- [ ] **Step 3: Add one dynamic open-frame painter**

In `scripts/generate-spirit-vein-svg.cjs`, insert this complete function before
`buildContributionSpiritVeins`:

```js
function buildContributionShrine({ gridWidth, rowCount, cell, paddingX, gridTop, theme }) {
  const left = Math.max(0, paddingX - 6);
  const right = paddingX + gridWidth + 6;
  const top = Math.max(2, gridTop - 8);
  const bottom = gridTop + rowCount * cell + 4;
  const frameWidth = right - left;
  const blocks = [
    rectPixel(left + 4, top, frameWidth - 8, 4, theme.ridgeShadow, 1),
    rectPixel(left + 8, top + 4, frameWidth - 16, 2, theme.skyMoon, 1),
    rectPixel(left + 4, bottom - 6, frameWidth - 8, 6, theme.ridgeShadow, 1),
    rectPixel(left + 8, bottom - 6, frameWidth - 16, 2, theme.skyMoon, 1),
    rectPixel(left, top + 4, 6, 8, theme.ridgeShadow, 1),
    rectPixel(right - 6, top + 4, 6, 8, theme.ridgeShadow, 1),
    rectPixel(left, bottom - 10, 6, 10, theme.ridgeShadow, 1),
    rectPixel(right - 6, bottom - 10, 6, 10, theme.ridgeShadow, 1),
  ];

  return `<g id="contribution-shrine">${blocks.join('')}</g>`;
}
```

Inside `buildAnimatedSvg`, calculate the calendar row count and lower edge
next to the existing `gridWidth` declaration:

```js
const rowCount = Math.max(1, ...data.map((week) => week.length));
const gridBottom = gridTop + rowCount * cell;
```

Move the landscape down by changing the painter calls to these exact forms:

```js
${buildFarRidges({ width, horizonY: gridBottom + 4, sceneBottom, theme })}
${buildFrameRidges({ width, gridBottom, sceneBottom, theme })}
${buildRiverValley({ width, sceneBottom, theme })}
${buildMistBanks({ width, gridTop, sceneBottom, theme })}
${buildContributionShrine({ gridWidth, rowCount, cell, paddingX, gridTop, theme })}
${contributionScene.markup}
```

Change the frame-ridge signature and apex values so the cliffs begin below the
calendar, never through its centre:

```js
function buildFrameRidges({ width, gridBottom, sceneBottom, theme }) {
  const frameBlocks = [
    ...steppedPeak({
      apexX: Math.round(width * 0.11),
      apexY: gridBottom + 10,
      baseY: sceneBottom,
      halfWidth: Math.round(width * 0.12),
      fill: theme.nearRock,
      capFill: theme.ridgeEdge,
      depthFill: theme.ridgeShadow,
      opacity: 1,
    }),
    ...steppedPeak({
      apexX: Math.round(width * 0.89),
      apexY: gridBottom + 10,
      baseY: sceneBottom,
      halfWidth: Math.round(width * 0.12),
      fill: theme.nearRock,
      capFill: theme.ridgeEdge,
      depthFill: theme.ridgeShadow,
      opacity: 1,
    }),
    rectPixel(0, sceneBottom - 10, Math.round(width * 0.18), 8, theme.ridgeShadow, 1),
    rectPixel(Math.round(width * 0.82), sceneBottom - 10, Math.round(width * 0.18), 8, theme.ridgeShadow, 1),
  ];

  return `<g id="pixel-frame-ridges">${frameBlocks.join('')}</g>`;
}
```

- [ ] **Step 4: Run the local regression suite and confirm green**

Run:

```powershell
node --check scripts/generate-spirit-vein-svg.cjs
node tests/verify_pixel_xianxia_animation.cjs
pwsh -File tests/verify_private_contribution_animation.ps1
git diff --check
```

Expected: syntax exits `0`; both test commands print their success message;
`git diff --check` prints no error.

- [ ] **Step 5: Commit and publish hierarchy pass**

Run:

```powershell
git add -- scripts/generate-spirit-vein-svg.cjs tests/verify_pixel_xianxia_animation.cjs tests/verify_private_contribution_animation.ps1 docs/superpowers/plans/2026-07-22-contribution-shrine-three-pass-refinement.md
git commit -m "feat: frame contribution shrine"
git fetch origin main
git log --oneline HEAD..origin/main
git push origin main
```

Expected: no remote-only commit appears before push. If a remote commit does
appear, integrate it without discarding local work, rerun Step 4, then push.

- [ ] **Step 6: Inspect the real pass-one artifacts**

Wait for the `Generate Contribution Animation` workflow associated with the
pass-one commit to succeed:

```powershell
$run = gh run list --workflow generate-contribution-animation.yml --branch main --limit 1 --json databaseId,status,conclusion,headSha,url | ConvertFrom-Json | Select-Object -First 1
if (-not $run) { throw 'No contribution-animation workflow run was found.' }
gh run watch $run.databaseId --exit-status
git fetch origin main
git pull --ff-only origin main
```

Run the **Common Preview Loop**, then inspect both PNGs with `view_image`.
Accept this pass only when cells read before terrain and the shrine interior is
visibly open. Keep the working tree clean before starting Task 2.

## Task 2: Pass Two — Tune the Controlled Gemstone Palette

**Files:**
- Modify: `tests/verify_pixel_xianxia_animation.cjs`
- Modify: `scripts/generate-spirit-vein-svg.cjs`

- [ ] **Step 1: Add palette regression tests**

Replace the three existing dark landscape colour assertions with the following
dark and light contracts:

```js
const lightSvg = buildAnimatedSvg({ data, themeName: 'light', profileName: 'Timsy' });

assert.match(groupContent(svg, 'contribution-shrine'), /fill="#061a39" opacity="1"/);
assert.match(groupContent(svg, 'pixel-far-ridges'), /fill="#214889" opacity="1"/);
assert.match(groupContent(svg, 'pixel-frame-ridges'), /fill="#0a788b" opacity="1"/);
assert.match(groupContent(svg, 'pixel-river-valley'), /fill="#1666a7" opacity="1"/);
assert.match(groupContent(lightSvg, 'contribution-shrine'), /fill="#0f3b68" opacity="1"/);
assert.match(groupContent(lightSvg, 'pixel-far-ridges'), /fill="#4264a8" opacity="1"/);
assert.match(groupContent(lightSvg, 'pixel-frame-ridges'), /fill="#14899a" opacity="1"/);
assert.match(groupContent(lightSvg, 'pixel-river-valley'), /fill="#438cc7" opacity="1"/);
assert.doesNotMatch(groupContent(svg, 'pixel-river-valley'), /#ffd166/);
assert.doesNotMatch(groupContent(svg, 'contribution-shrine'), /#ffd166/);
```

- [ ] **Step 2: Run the focused test and confirm red**

Run:

```powershell
node tests/verify_pixel_xianxia_animation.cjs
```

Expected: failure on the first `#061a39` shrine assertion, because the old
palette remains in the painter.

- [ ] **Step 3: Replace only the semantic theme values**

Replace the entire `themes` object with this palette. Do not add a third theme,
per-rectangle opacity, gradients, or new colour roles.

```js
const themes = {
  light: {
    inactiveStone: '#3b628e',
    skyCobalt: '#4f78c6',
    skyMoon: '#96d6ea',
    farRock: '#4264a8',
    nearRock: '#14899a',
    ridgeShadow: '#0f3b68',
    ridgeEdge: '#68d3d4',
    riverDeep: '#215aa5',
    riverShadow: '#438cc7',
    riverGlint: '#83e7de',
    mist: '#a5d7e5',
    jadeDim: '#169b78',
    jadeCore: '#18c582',
    jadeBright: '#ecf7c4',
    starfire: '#f6c85f',
    ink: '#0d3862',
  },
  dark: {
    inactiveStone: '#203e70',
    skyCobalt: '#2859b6',
    skyMoon: '#7fc7e6',
    farRock: '#214889',
    nearRock: '#0a788b',
    ridgeShadow: '#061a39',
    ridgeEdge: '#49cbd0',
    riverDeep: '#07316e',
    riverShadow: '#1666a7',
    riverGlint: '#65e1da',
    mist: '#3a75b5',
    jadeDim: '#08755f',
    jadeCore: '#05b878',
    jadeBright: '#d9f6b8',
    starfire: '#ffd166',
    ink: '#0b315b',
  },
};
```

- [ ] **Step 4: Run the local regression suite and confirm green**

Run:

```powershell
node --check scripts/generate-spirit-vein-svg.cjs
node tests/verify_pixel_xianxia_animation.cjs
pwsh -File tests/verify_private_contribution_animation.ps1
git diff --check
```

Expected: syntax exits `0`; both test commands print their success message;
`git diff --check` prints no error.

- [ ] **Step 5: Commit, publish, and inspect palette pass**

Run:

```powershell
git add -- scripts/generate-spirit-vein-svg.cjs tests/verify_pixel_xianxia_animation.cjs
git commit -m "style: refine gemstone night palette"
git fetch origin main
git log --oneline HEAD..origin/main
git push origin main
```

After pushing, wait for and fetch the exact workflow result:

```powershell
$run = gh run list --workflow generate-contribution-animation.yml --branch main --limit 1 --json databaseId,status,conclusion,headSha,url | ConvertFrom-Json | Select-Object -First 1
if (-not $run) { throw 'No contribution-animation workflow run was found.' }
gh run watch $run.databaseId --exit-status
git fetch origin main
git pull --ff-only origin main
git status --short
git rev-list --left-right --count HEAD...origin/main
```

Expected: the workflow succeeds, the final two commands report a clean tree
and `0 0`. Run the **Common Preview Loop** and inspect both PNGs: dark mode
must read as midnight cobalt with restrained gold; light mode must retain the
same hierarchy rather than looking washed out. Do not start Task 3 until this
check passes.

## Task 3: Pass Three — Enforce Connected Two-Pixel Material Grammar

**Files:**
- Modify: `tests/verify_pixel_xianxia_animation.cjs`
- Modify: `scripts/generate-spirit-vein-svg.cjs`

- [ ] **Step 1: Add even-tile, smoke, and mineral-detail regression tests**

Replace the existing `staticRects` assertion block with this complete block:

```js
const visibleRects = [...svg.matchAll(/<rect\b[^>]*\/>/g)]
  .map(([tag]) => tag)
  .filter((tag) => !tag.includes('cycle-timer'));
assert.ok(
  visibleRects.every((tag) => rectDimension(tag, 'width') >= 2 && rectDimension(tag, 'height') >= 2),
  'visible layers must not contain one-pixel blocks'
);
assert.ok(
  visibleRects.every((tag) => rectDimension(tag, 'width') % 2 === 0 && rectDimension(tag, 'height') % 2 === 0),
  'every visible tile must use the two-pixel material grammar'
);
assert.ok(
  visibleRects.every((tag) => tag.includes('opacity="1"')),
  'every visible tile must remain opaque'
);

const smokeRectTags = visibleRects.filter((tag) => tag.includes('smoke-micro-pixel'));
assert.ok(
  smokeRectTags.every((tag) => rectDimension(tag, 'width') === 2 && rectDimension(tag, 'height') === 2),
  'smoke should be connected two-pixel energy tiles rather than micro-noise'
);

const lodeCell = shapeSvg.match(/<g class="spirit-vein-cell"[^>]*data-vein-shape="lode"[^>]*>([\s\S]*?)<\/g>/);
assert.ok(lodeCell, 'the lode fixture must be present');
assert.match(lodeCell[1], /width="4" height="2" fill="#d9f6b8" opacity="1"/);
assert.doesNotMatch(lodeCell[1], /width="3"|height="3"/);

const goldTags = svg.match(/<rect[^>]*fill="#ffd166"[^>]*\/>/g) || [];
assert.equal(goldTags.length, 4, 'gold should appear only in three star cores and the single geode cap');
```

- [ ] **Step 2: Run the focused test and confirm red**

Run:

```powershell
node tests/verify_pixel_xianxia_animation.cjs
```

Expected: failure on smoke dimensions or the 3x3 lode fragment, proving the
old output still violates the two-pixel material grammar.

- [ ] **Step 3: Quantize terrain and rebuild the connected sprites**

Add this helper immediately before `steppedPeak`:

```js
function evenTile(value, minimum = 2) {
  return Math.max(minimum, Math.round(value / 2) * 2);
}
```

In `steppedPeak`, replace the width calculations with these exact values:

```js
const currentHalf = Math.max(8, evenTile(halfWidth * (0.24 + progress * 0.76)));
const capWidth = Math.max(10, evenTile(currentHalf * 0.42));
const shadowWidth = Math.max(12, currentHalf - 4);
```

Wrap every ratio-derived static width in `evenTile`, including the two bottom
frame slabs and all three river shelf widths. For example:

```js
rectPixel(0, sceneBottom - 10, evenTile(width * 0.18), 8, theme.ridgeShadow, 1)
rectPixel(Math.round(width * 0.17), riverTop, evenTile(width * 0.65), 6, theme.riverDeep, 1)
```

Replace `buildStarfire` with this connected clockwise tile glyph:

```js
function buildStarfire({ width, theme }) {
  const whorl = (x, y) => `<g class="star-whorl">${[
    rectPixel(x, y, 4, 4, theme.starfire, 1),
    rectPixel(x, y - 2, 4, 2, theme.skyMoon, 1),
    rectPixel(x + 4, y, 2, 4, theme.skyMoon, 1),
    rectPixel(x + 2, y + 4, 2, 2, theme.skyMoon, 1),
    rectPixel(x - 2, y + 2, 2, 2, theme.skyMoon, 1),
  ].join('')}</g>`;

  return `<g id="pixel-starfire">${[
    whorl(Math.round(width * 0.41), 7),
    whorl(Math.round(width * 0.47), 22),
    whorl(Math.round(width * 0.9), 7),
  ].join('')}</g>`;
}
```

In `fragmentsByTier`, replace the tier-three lower bright plane with a 4x2
connected plane and retain the even tier-four cap:

```js
3: [
  rectPixel(coreX, coreY, 8, 4, theme.jadeCore, 1),
  rectPixel(coreX + 2, coreY - 2, 4, 2, theme.jadeBright, 1),
  rectPixel(coreX + 2, coreY + 4, 4, 2, theme.jadeBright, 1),
],
4: [
  rectPixel(coreX, coreY, 10, 6, theme.jadeCore, 1),
  rectPixel(coreX + 3, coreY + 1, 4, 4, theme.jadeBright, 1),
  rectPixel(coreX + 4, coreY - 2, 2, 2, theme.starfire, 1),
],
```

Replace the smoke sprite with this one continuous, stepped eight-tile energy
shape. Keep its existing class name, actor count, timing, and group opacity.

```js
const smokePixels = [
  [-4, 0, 2, 2, theme.jadeDim, 1], [-2, 0, 2, 2, theme.jadeCore, 1],
  [-2, -2, 2, 2, theme.jadeBright, 1], [0, -2, 2, 2, theme.jadeDim, 1],
  [0, -4, 2, 2, theme.jadeCore, 1], [2, -4, 2, 2, theme.jadeBright, 1],
  [2, -6, 2, 2, theme.jadeDim, 1], [4, -6, 2, 2, theme.jadeCore, 1],
];
```

- [ ] **Step 4: Run the full local verification and confirm green**

Run:

```powershell
node --check scripts/generate-spirit-vein-svg.cjs
node tests/verify_pixel_xianxia_animation.cjs
pwsh -File tests/verify_private_contribution_animation.ps1
git diff --check
```

Expected: syntax succeeds, both test commands print success, and no whitespace
errors are reported.

- [ ] **Step 5: Commit, publish, and inspect detail pass**

Run:

```powershell
git add -- scripts/generate-spirit-vein-svg.cjs tests/verify_pixel_xianxia_animation.cjs
git commit -m "feat: refine connected pixel materials"
git fetch origin main
git log --oneline HEAD..origin/main
git push origin main
```

Wait for and fetch the final workflow result:

```powershell
$run = gh run list --workflow generate-contribution-animation.yml --branch main --limit 1 --json databaseId,status,conclusion,headSha,url | ConvertFrom-Json | Select-Object -First 1
if (-not $run) { throw 'No contribution-animation workflow run was found.' }
gh run watch $run.databaseId --exit-status
git fetch origin main
git pull --ff-only origin main
git status --short
git rev-list --left-right --count HEAD...origin/main
```

Expected: the workflow succeeds, the final two commands report a clean tree
and `0 0`. Run the **Common Preview Loop**. Inspect that stars read as
deliberate spirals, smoke as a coherent moving energy sprite, and every static
material detail as a connected 2px object.

## Task 4: Final Artifact Audit and Synchronization

**Files:**
- Verify: `scripts/generate-spirit-vein-svg.cjs`
- Verify: `tests/verify_pixel_xianxia_animation.cjs`
- Verify: `tests/verify_private_contribution_animation.ps1`
- Verify: `TTTimsy-contribution-animation.svg`
- Verify: `TTTimsy-contribution-animation-dark.svg`

- [ ] **Step 1: Validate both workflow-generated SVGs as XML and enforce the final contract**

Run this PowerShell audit after fast-forwarding the final workflow commit:

```powershell
$files = @('TTTimsy-contribution-animation.svg', 'TTTimsy-contribution-animation-dark.svg')
foreach ($file in $files) {
  $raw = Get-Content -LiteralPath $file -Raw
  [xml]$document = $raw
  if (([regex]::Matches($raw, 'class="sky-current"')).Count -ne 2) { throw "$file lacks two sky currents" }
  if (([regex]::Matches($raw, 'class="star-whorl"')).Count -ne 3) { throw "$file lacks three star whorls" }
  if ($raw -notmatch 'id="contribution-shrine"') { throw "$file lacks the contribution shrine" }
  $rects = [regex]::Matches($raw, '<rect\b[^>]*\/>')
  foreach ($rect in $rects) {
    $tag = $rect.Value
    if ($tag.Contains('cycle-timer')) { continue }
    $width = [int]([regex]::Match($tag, 'width="(\d+)"').Groups[1].Value)
    $height = [int]([regex]::Match($tag, 'height="(\d+)"').Groups[1].Value)
    if ($width -lt 2 -or $height -lt 2 -or $width % 2 -ne 0 -or $height % 2 -ne 0 -or -not $tag.Contains('opacity="1"')) {
      throw "$file has an invalid visible tile: $tag"
    }
  }
  if ($raw -match 'data:image/|sword-dais|sword-flight|starfire-flare|flying-sword') { throw "$file has legacy or raster content" }
  Write-Output "$file passed XML and two-pixel artifact audit."
}
```

- [ ] **Step 2: Re-run source and workflow checks**

Run:

```powershell
node --check scripts/generate-spirit-vein-svg.cjs
node tests/verify_pixel_xianxia_animation.cjs
pwsh -File tests/verify_private_contribution_animation.ps1
git diff --check
```

Expected: every command exits `0`.

- [ ] **Step 3: Confirm repository equality**

Run:

```powershell
git fetch origin main
git status --short
git rev-list --left-right --count HEAD...origin/main
```

Expected: `git status --short` prints nothing and divergence is exactly `0 0`.
