# Terraria Starry-Night Tile-Mass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fragmented terrain with an original, saturated, opaque Terraria × Starry Night composition made entirely from large readable tile masses.

**Architecture:** Keep the GraphQL, accessibility, output, and bounded smoke paths intact. Rebuild the static SVG painter around two cobalt sky-current groups, three connected star whorls, three opaque landscape masses, and four connected mineral calendar silhouettes; test all static rectangles as at least 2px in each dimension.

**Tech Stack:** Node.js CommonJS, static SVG/SMIL, Node `assert`, PowerShell workflow guard, GitHub Actions.

---

### Task 1: Replace the scene contract with readable tile-mass tests

**Files:**
- Modify: `tests/verify_pixel_xianxia_animation.cjs`

- [ ] **Step 1: Add a static-rectangle parser to the test**

Add these helpers after the initial `svg` creation:

```js
function groupContent(markup, id) {
  const match = markup.match(new RegExp(`<g id="${id}">([\\s\\S]*?)</g>`));
  assert.ok(match, `missing ${id}`);
  return match[1];
}

function rectDimension(tag, attribute) {
  const match = tag.match(new RegExp(`${attribute}="(\\d+)"`));
  assert.ok(match, `missing ${attribute} in ${tag}`);
  return Number(match[1]);
}
```

- [ ] **Step 2: Write failing sky, terrain, and no-singleton assertions**

Require the two new sky-current groups and exactly three connected star whorls:

```js
assert.match(svg, /id="pixel-sky-currents"/);
assert.equal((svg.match(/class="sky-current"/g) || []).length, 2);
assert.equal((svg.match(/class="star-whorl"/g) || []).length, 3);
assert.match(groupContent(svg, 'pixel-far-ridges'), /fill="#254a8d" opacity="1"/);
assert.match(groupContent(svg, 'pixel-frame-ridges'), /fill="#166c83" opacity="1"/);
assert.match(groupContent(svg, 'pixel-river-valley'), /fill="#1266a8" opacity="1"/);
```

Collect `<rect>` tags, excluding `cycle-timer` and `smoke-micro-pixel`, then require every static rectangle to be at least 2px wide and 2px high:

```js
const staticRects = [...svg.matchAll(/<rect\b[^>]*\/>/g)]
  .map(([tag]) => tag)
  .filter((tag) => !tag.includes('cycle-timer') && !tag.includes('smoke-micro-pixel'));
assert.ok(staticRects.every((tag) => rectDimension(tag, 'width') >= 2 && rectDimension(tag, 'height') >= 2));
```

- [ ] **Step 3: Add four named mineral-shape assertions**

Build a single-week fixture with counts `1`, `4`, `12`, and `20`, each with `level: 1`. Assert the output includes these exact wrappers:

```js
assert.match(shapeSvg, /data-level="1" data-vein-shape="sprout"/);
assert.match(shapeSvg, /data-level="2" data-vein-shape="seam"/);
assert.match(shapeSvg, /data-level="3" data-vein-shape="lode"/);
assert.match(shapeSvg, /data-level="4" data-vein-shape="geode"/);
```

Retain contribution title, smoke cap, old-art prohibition, no-background, and SVG primitive assertions.

- [ ] **Step 4: Run the focused test and confirm it fails**

Run: `node tests/verify_pixel_xianxia_animation.cjs`

Expected: failure on `pixel-sky-currents`, because the existing painter has only scattered star shapes and static one-pixel rectangles.

### Task 2: Rebuild the sky and terrain as opaque, saturated tile masses

**Files:**
- Modify: `scripts/generate-spirit-vein-svg.cjs`

- [ ] **Step 1: Replace the palette with high-saturation roles**

Add `skyCobalt` and `skyMoon` to both themes. Use this exact dark palette:

```js
skyCobalt: '#2d5cbd',
skyMoon: '#73b7e8',
farRock: '#254a8d',
nearRock: '#166c83',
ridgeShadow: '#082b3e',
ridgeEdge: '#5ce1e6',
riverDeep: '#073a70',
riverShadow: '#1266a8',
riverGlint: '#65f0e6',
jadeDim: '#0b8f70',
jadeCore: '#18c77d',
jadeBright: '#dff7b0',
starfire: '#ffe995',
```

Use the same semantic roles for light mode with distinct saturated colors. Keep `opacity="1"` for every static layer.

- [ ] **Step 2: Add two connected sky-current masses**

Create `buildSkyCurrents({ width, theme })` before `buildStarfire`. Each current is a `class="sky-current"` group formed by 4px-high, 16px-or-wider overlapping shelves. Use no isolated rectangles:

```js
const upper = [[0.05, 8, 54], [0.11, 12, 72], [0.2, 16, 48]];
const lower = [[0.52, 11, 62], [0.59, 15, 78], [0.69, 19, 46]];
```

Render `upper` in `skyCobalt`, `lower` in `skyMoon`, and add the resulting `pixel-sky-currents` group before celestial and terrain layers.

- [ ] **Step 3: Reduce mountains to three whole masses**

Update `steppedPeak` to use only 6px-high body slabs and 2px-high highlight/shadow shelves:

```js
for (let y = apexY, row = 0; y < baseY; y += 6, row += 1) {
  const progress = (y - apexY) / height;
  const currentHalf = Math.max(8, Math.round(halfWidth * (0.24 + progress * 0.76)));
  blocks.push(rectPixel(apexX - currentHalf, y, currentHalf * 2, 6, fill));
  if (row % 2 === 0) blocks.push(rectPixel(apexX + 2, y + 4, Math.max(12, currentHalf - 4), 2, depthFill));
  if (row % 2 === 1) blocks.push(rectPixel(apexX - currentHalf, y, Math.max(10, Math.round(currentHalf * 0.42)), 2, capFill));
}
```

Emit one distant indigo peak, then two lower teal cliffs; remove tree fragments and all one-pixel rock details.

- [ ] **Step 4: Make river and mist read as single objects**

Replace the current river with three 6px-high blue shelves and three 4px-high cyan shelves. Retain `pixel-mist-banks` but emit two opaque 20px-by-4px horizon banks only. Every rectangle generated by these functions must be at least 2px in both dimensions.

- [ ] **Step 5: Replace stars with three connected whorls**

Replace `buildStarfire` with three fixed `class="star-whorl"` groups. Each whorl uses 2px-by-2px blocks and a `skyMoon` halo plus `starfire` core:

```js
const whorl = (x, y) => `
  <g class="star-whorl">
    ${rectPixel(x, y, 4, 4, theme.starfire)}
    ${rectPixel(x - 2, y, 2, 2, theme.skyMoon)}
    ${rectPixel(x + 4, y + 2, 2, 2, theme.skyMoon)}
    ${rectPixel(x, y - 2, 2, 2, theme.skyMoon)}
    ${rectPixel(x + 2, y + 4, 2, 2, theme.skyMoon)}
  </g>`;
```

Use three positions that do not overlap either sky-current mass.

### Task 3: Render four connected mineral silhouettes and simplify smoke colors

**Files:**
- Modify: `scripts/generate-spirit-vein-svg.cjs`
- Test: `tests/verify_pixel_xianxia_animation.cjs`

- [ ] **Step 1: Add named active-cell shape metadata**

Define:

```js
const veinShapeNames = ['', 'sprout', 'seam', 'lode', 'geode'];
```

Use `data-vein-shape="${veinShapeNames[tier]}"` on every active `spirit-vein-cell` wrapper. Keep the existing count-aware tier thresholds.

- [ ] **Step 2: Replace dormant shards with one stone tile**

Delete inactive-day random arithmetic. Emit one centered `4px × 2px` opaque `inactiveStone` block inside each inactive cell, retaining its title and wrapper.

- [ ] **Step 3: Use fixed, connected active fragment sets**

Build `sprout` from a 4px-by-4px `jadeDim` core and a connected 2px-by-2px dark base. Add only connected 2px-or-larger blocks for higher tiers:

```js
const fragmentsByTier = {
  1: [rectPixel(coreX, coreY, 4, 4, theme.jadeDim), rectPixel(coreX + 1, coreY + 4, 2, 2, theme.ridgeShadow)],
  2: [rectPixel(coreX, coreY, 6, 4, theme.jadeCore), rectPixel(coreX + 2, coreY - 2, 2, 2, theme.jadeBright), rectPixel(coreX + 2, coreY + 4, 2, 2, theme.ridgeShadow)],
  3: [rectPixel(coreX, coreY, 8, 4, theme.jadeCore), rectPixel(coreX + 2, coreY - 2, 4, 2, theme.jadeBright), rectPixel(coreX + 2, coreY + 4, 3, 3, theme.jadeBright)],
  4: [rectPixel(coreX, coreY, 10, 6, theme.jadeCore), rectPixel(coreX + 3, coreY + 1, 4, 4, theme.jadeBright), rectPixel(coreX + 4, coreY - 2, 2, 2, theme.starfire)],
};
```

Set `coreX` and `coreY` per tier so every fragment remains centred within its 14px cell. Do not append random or one-pixel fragments.

- [ ] **Step 4: Keep smoke within the opaque mineral palette**

Retain eight `smoke-micro-pixel` rectangles per actor and their existing animated group opacity. Use only `jadeDim`, `jadeCore`, and `jadeBright` child fills; this is the only static-size exception for 1px particles.

- [ ] **Step 5: Run the focused test and confirm green**

Run: `node tests/verify_pixel_xianxia_animation.cjs`

Expected: `Terraria spirit-vein SVG checks passed.`

### Task 4: Verify and publish regenerated SVGs

**Files:**
- Verify: `scripts/generate-spirit-vein-svg.cjs`
- Verify: `tests/verify_pixel_xianxia_animation.cjs`
- Verify: `tests/verify_private_contribution_animation.ps1`
- Verify after workflow: `TTTimsy-contribution-animation.svg`
- Verify after workflow: `TTTimsy-contribution-animation-dark.svg`

- [ ] **Step 1: Run fresh local verification**

Run:

```powershell
node --check scripts/generate-spirit-vein-svg.cjs
node tests/verify_pixel_xianxia_animation.cjs
pwsh -File tests/verify_private_contribution_animation.ps1
git diff --check
```

Expected: syntax succeeds, both tests print success, and `git diff --check` has no whitespace errors.

- [ ] **Step 2: Commit only the implementation, test, and replacement plan**

Run:

```powershell
git add -- scripts/generate-spirit-vein-svg.cjs tests/verify_pixel_xianxia_animation.cjs docs/superpowers/plans/2026-07-22-terraria-starry-night-tile-mass.md
git commit -m "feat: build starry-night tile masses"
```

Do not stage the deleted superseded plan because it was never committed.

- [ ] **Step 3: Synchronize and push `main`**

Run `git fetch origin main`, inspect `git log --oneline HEAD..origin/main`, and integrate any remote commits without discarding local work. Re-run Step 1 after an integration. Push `main` only when the local branch is clean and verified.

- [ ] **Step 4: Validate workflow artifacts and local/remote equality**

Wait for `Generate Contribution Animation` to succeed, fetch and fast-forward its generated-SVG commit, then validate both SVGs as XML. Assert exactly two `sky-current` groups, exactly three `star-whorl` groups, no static 1px rectangles, opaque terrain palette markers, at least two contribution tiers, and absence of old flying-sword/raster identifiers. Finish only after `git rev-list --left-right --count HEAD...origin/main` prints `0 0`.
