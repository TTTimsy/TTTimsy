# Pixel Xianxia Contribution Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the profile contribution animation with a frameless pixel-art xianxia scene whose visible activity is visited by a clear jade-and-gold flying sword.

**Architecture:** `scripts/generate-spirit-vein-svg.cjs` remains the dependency-free private-aware calendar entry point. It embeds one checked-in transparent PNG sword sprite as a data URI and generates all other scene geometry as integer-aligned SVG pixels. A Node regression test protects the visual contract, while the PowerShell guard keeps its secret-token checks and asserts the new identifiers.

**Tech Stack:** Node.js 20 standard library, SVG/SMIL, PowerShell, Python Pillow plus the imagegen chroma-key helper, GitHub Actions, GitHub GraphQL.

---

## File structure

- Create: `assets/pixel-xianxia-flying-sword.png` — only checked-in raster source; a 64×64 transparent sprite.
- Create: `tests/verify_pixel_xianxia_animation.cjs` — deterministic SVG contract test.
- Modify: `scripts/generate-spirit-vein-svg.cjs` — embeds the sword and replaces card-like landscape art with transparent pixel scenery.
- Modify: `tests/verify_private_contribution_animation.ps1` — preserves private-token checks and protects the new visual contract.
- Delete: `tests/verify_spirit_vein_animation.cjs` — asserts removed river, round-lamp, and lotus artwork.
- Modify (GitHub Actions only): `TTTimsy-contribution-animation.svg`, `TTTimsy-contribution-animation-dark.svg` — refreshed from private-aware real calendar data.

### Task 1: Define the pixel-scene regression before implementation

**Files:**
- Create: `tests/verify_pixel_xianxia_animation.cjs`
- Read: `scripts/generate-spirit-vein-svg.cjs`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run it against the current generator**

Run: `node tests/verify_pixel_xianxia_animation.cjs`

Expected: FAIL for missing `shape-rendering="crispEdges"` or `id="pixel-mountains"`. Do not weaken the test to make the old landscape pass.

- [ ] **Step 3: Commit the red test**

```powershell
git add -- tests/verify_pixel_xianxia_animation.cjs
git commit -m "test: define pixel xianxia animation contract"
```

### Task 2: Produce and validate the reusable flying-sword sprite

**Files:**
- Create: `assets/pixel-xianxia-flying-sword.png`
- Temporary, never commit: `assets/pixel-xianxia-flying-sword-source.png`, `assets/pixel-xianxia-flying-sword-keyed.png`

- [ ] **Step 1: Generate and inspect the chroma-key source**

Use the built-in image generator without a reference image and this exact prompt:

```text
A single isolated 2D pixel-art xianxia flying sword sprite, 64 by 64 composition. Make the diagonal sword unmistakably readable: pale jade-white blade, old-gold guard and hilt, a short 3–5-pixel hard-edged jade-and-gold spirit-flame trail behind it. Strict retro game sprite pixels, no antialiasing, no soft glow, no border, no frame, no shadow, no characters, no lettering, no Chinese characters, no logo, no scenery, no extra objects. Center it with generous empty space on a perfectly flat solid #ff00ff magenta chroma-key background.
```

Inspect the result. Regenerate if the sword is not recognizable, if it contains text, or if any non-magenta scene/background remains.

- [ ] **Step 2: Remove chroma, crop it, and normalize the final 64×64 sprite**

Save the generated source as `assets/pixel-xianxia-flying-sword-source.png`, then run:

```powershell
python "C:\Users\huawei\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py" --input assets/pixel-xianxia-flying-sword-source.png --out assets/pixel-xianxia-flying-sword-keyed.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
python -c "from PIL import Image; keyed=Image.open('assets/pixel-xianxia-flying-sword-keyed.png').convert('RGBA'); bbox=keyed.getchannel('A').getbbox(); assert bbox is not None, 'sprite has no opaque pixels after chroma removal'; sprite=keyed.crop(bbox); sprite.thumbnail((56,56), Image.Resampling.NEAREST); canvas=Image.new('RGBA',(64,64),(0,0,0,0)); canvas.alpha_composite(sprite,((64-sprite.width)//2,(64-sprite.height)//2)); canvas.save('assets/pixel-xianxia-flying-sword.png')"
Remove-Item -LiteralPath assets/pixel-xianxia-flying-sword-source.png, assets/pixel-xianxia-flying-sword-keyed.png
```

- [ ] **Step 3: Validate alpha bounds and commit only the final sprite**

```powershell
python -c "from PIL import Image; image=Image.open('assets/pixel-xianxia-flying-sword.png').convert('RGBA'); alpha=image.getchannel('A'); bbox=alpha.getbbox(); assert image.size==(64,64), image.size; assert alpha.getextrema()==(0,255), alpha.getextrema(); assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<64 and bbox[3]<64, bbox; print('sprite alpha and bounds checks passed')"
git add -- assets/pixel-xianxia-flying-sword.png
git commit -m "assets: add pixel xianxia flying sword sprite"
```

Expected: `sprite alpha and bounds checks passed` before the commit.

### Task 3: Render transparent pixels and a chronological sword path

**Files:**
- Modify: `scripts/generate-spirit-vein-svg.cjs`
- Read: `assets/pixel-xianxia-flying-sword.png`
- Test: `tests/verify_pixel_xianxia_animation.cjs`

- [ ] **Step 1: Add sprite loading and the no-card palettes**

Add `const path = require('path');`, replace paper/river/mist/lotus colours with these keys, and add the loader below `escapeXml`:

```js
const themes = {
  light: {
    empty: '#d0d7de', levels: ['#d0d7de', '#8fb7a4', '#4f927d', '#b88943', '#e7c96b'],
    mountainFar: '#8d99a6', mountainNear: '#596777', cloud: '#eef3f6',
    star: '#c79a4a', jade: '#4f927d', flame: '#e7c96b', ink: '#374151',
  },
  dark: {
    empty: '#161b22', levels: ['#161b22', '#245b56', '#2e8b78', '#b88335', '#f0cf72'],
    mountainFar: '#172e48', mountainNear: '#203b5b', cloud: '#304967',
    star: '#c89b48', jade: '#65c6a8', flame: '#f0cf72', ink: '#9db8d2',
  },
};

function loadFlyingSwordDataUri() {
  const spritePath = path.join(__dirname, '..', 'assets', 'pixel-xianxia-flying-sword.png');
  return `data:image/png;base64,${fs.readFileSync(spritePath).toString('base64')}`;
}
```

- [ ] **Step 2: Replace `buildAnimatedSvg` with pixel-only layers**

Set `cell = 14`, `paddingX = 14`, `gridTop = 28`, `MAX_SWORD_VISITS = 72`, and use this helper for every SVG decoration and contribution cell:

```js
const rectPixel = (x, y, width, height, fill, opacity = 1) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" opacity="${opacity}" />`;
```

Keep the existing week/day traversal and exact `<title>${escapeXml(`${day.date}: ${day.count} contributions`)}</title>` metadata, but render every cell as an integer-positioned rectangle. Emit only these required visual groups: `id="pixel-mountains"`, `id="pixel-cloud-banks"`, `id="contribution-starfire"`, and `id="sword-dais"`. Build the dais from three small dark/jade rectangles at the lower left.

For active dates in existing week/day order, make flight zero start at `daisX, daisY`; later flights start at the previous active target. Use this chain exactly, so the chronological order cannot overlap:

```js
const begin = index === 0
  ? 'cycle.begin+0.18s'
  : `sword-flight-${index - 1}.end+0.14s`;
```

Each capped flight emits a unique `id="sword-flight-${index}"` transform animation, a 36×36 embedded `<image class="flying-sword" href="${swordDataUri}" x="-18" y="-18" width="36" height="36" image-rendering="pixelated" />`, two or three short rectangular flame pixels, and `id="starfire-flare-${index}"` containing exactly five jade/gold 2×2 or 3×3 rectangles at its target. Render all contribution cells and titles even after the 72-visit cap.

Return an SVG root with `shape-rendering="crispEdges"`, English invisible `title`/`desc` metadata, an invisible cycle timer, and no page-sized background rectangle. Do not emit `path`, `circle`, `ellipse`, `text`, `linearGradient`, curves, blur, Han characters, shooter words, or an external image URL.

- [ ] **Step 3: Verify the minimal implementation and commit it**

```powershell
node --check scripts/generate-spirit-vein-svg.cjs
node tests/verify_pixel_xianxia_animation.cjs
git add -- scripts/generate-spirit-vein-svg.cjs tests/verify_pixel_xianxia_animation.cjs
git commit -m "feat: render pixel xianxia contribution scene"
```

Expected: no syntax output, then `Pixel xianxia SVG checks passed.`

### Task 4: Remove obsolete landscape assertions and retain private-data coverage

**Files:**
- Modify: `tests/verify_private_contribution_animation.ps1`
- Delete: `tests/verify_spirit_vein_animation.cjs`

- [ ] **Step 1: Change only the old visual assertions in the PowerShell guard**

Leave both `CONTRIBUTION_READ_TOKEN` workflow assertions untouched. Replace the old art checks with:

```powershell
if ($generator -notmatch 'id="pixel-mountains"') { throw 'The pixel mountain layer is missing.' }
if ($generator -notmatch 'id="sword-dais"') { throw 'The sword dais layer is missing.' }
if ($generator -notmatch 'id="sword-flight-') { throw 'The sequential flying-sword animation is missing.' }
if ($generator -notmatch 'data:image/png;base64') { throw 'The flying-sword sprite is not embedded in the generated SVG.' }
if ($generator -match '[\u3400-\u9FFF]') { throw 'Visible Chinese characters remain in the animation generator.' }
if ($generator -match 'shooter|launcher|bullet|bubble|explosion') { throw 'Bubble-shooter artwork remains in the generator.' }
```

- [ ] **Step 2: Retire the obsolete test, run both guards, and commit**

```powershell
Remove-Item -LiteralPath tests/verify_spirit_vein_animation.cjs
node tests/verify_pixel_xianxia_animation.cjs
powershell -ExecutionPolicy Bypass -File tests/verify_private_contribution_animation.ps1
git add -- tests/verify_private_contribution_animation.ps1
git rm -- tests/verify_spirit_vein_animation.cjs
git commit -m "test: guard pixel xianxia contribution animation"
```

Expected: `Pixel xianxia SVG checks passed.` followed by `Private contribution animation workflow checks passed.`

### Task 5: Publish and refresh the real calendar outputs

**Files:**
- Modify (Actions-generated): `TTTimsy-contribution-animation.svg`
- Modify (Actions-generated): `TTTimsy-contribution-animation-dark.svg`
- Read: `.github/workflows/generate-contribution-animation.yml`, `README.md`

- [ ] **Step 1: Verify the direct-main change set before pushing**

```powershell
git diff --check HEAD~4..HEAD
git status --short
node --check scripts/generate-spirit-vein-svg.cjs
node tests/verify_pixel_xianxia_animation.cjs
powershell -ExecutionPolicy Bypass -File tests/verify_private_contribution_animation.ps1
```

Expected: no diff-check output, a clean working tree, and both success messages.

- [ ] **Step 2: Push and run the existing private-aware generator workflow**

```powershell
git push origin main
gh workflow run generate-contribution-animation.yml --repo TTTimsy/TTTimsy
$runId = gh run list --repo TTTimsy/TTTimsy --workflow generate-contribution-animation.yml --limit 1 --json databaseId --jq '.[0].databaseId'
gh run watch $runId --repo TTTimsy/TTTimsy --exit-status
```

Expected: status 0. The existing workflow keeps `CONTRIBUTION_READ_TOKEN` as the data credential, so private contribution support is unchanged.

- [ ] **Step 3: Fetch the output commit and check both public SVGs**

```powershell
git pull --ff-only origin main
rg -n 'shape-rendering="crispEdges"|id="pixel-mountains"|id="sword-dais"|data:image/png;base64|<title>' TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg
rg -n 'shooter|launcher|bullet|bubble|explosion|<text|<linearGradient|<path|<circle|<ellipse' TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg
```

Expected: the first command finds all markers in both files; the second has no matches. Confirm README still chooses the dark SVG with `prefers-color-scheme: dark` and no additional external image URL was added.

- [ ] **Step 4: Inspect the public profile in dark and light schemes**

Open `https://github.com/TTTimsy/TTTimsy`. Confirm there is no rectangular image edge, the flying sword remains recognizable at profile width, active dates remain jade/gold pixels, and no Chinese characters occur within the artwork. Finish with `git log -2 --oneline` and `git status --short`; expect the workflow’s `chore: update contribution animation [skip ci]` commit on top and a clean tree.
