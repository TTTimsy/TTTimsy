# Theme-aware Baroque palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate visibly distinct light and dark Baroque carousel SVG assets without changing the carousel's geometry or timing.

**Architecture:** Keep the light palette unchanged and add a dark-theme palette with brighter warm values. Pass the palette selected by `themeName` through the existing image sampling functions, so the source pixels are quantised correctly before SVG animation markup is built.

**Tech Stack:** Node.js CommonJS, `pngjs`, `jpeg-js`, Node's strict assertions.

---

### Task 1: Specify and prove theme-specific output

**Files:**
- Modify: `tests/verify_calling_of_saint_matthew_animation.cjs`

- [ ] **Step 1: Write the failing test**

Add light-theme generation beside the existing dark-theme generation and assert that the generated SVG strings differ while retaining the existing structural assertions.

```js
const lightSvg = buildAnimatedSvg({ themeName: 'light', profileName: 'Timsy' });
const darkSvg = buildAnimatedSvg({ themeName: 'dark', profileName: 'Timsy' });

assert.notEqual(lightSvg, darkSvg);
```

Read both committed SVG files into separate variables and add this assertion after their per-file checks:

```js
assert.notEqual(lightArtifact, darkArtifact);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: failure at `assert.notEqual(lightSvg, darkSvg)` because `themeName` is currently only validated and both generated outputs are identical.

### Task 2: Select the palette from the requested theme

**Files:**
- Modify: `scripts/calling-of-saint-matthew-pixels.cjs`
- Modify: `scripts/generate-spirit-vein-svg.cjs`

- [ ] **Step 1: Add the dark palette and palette-aware sampling**

Keep the existing `PALETTE` as the light palette. Define `DARK_PALETTE` with sixteen brighter warm colours and make `nearestPaletteColor`, `loadPixelArt`, and `loadArtworkPixelArt` accept an optional palette argument defaulting to `PALETTE`.

```js
function nearestPaletteColor(red, green, blue, palette = PALETTE) {
  return palette.reduce((best, color) => squaredDistance(color, red, green, blue) < squaredDistance(best, red, green, blue) ? color : best, palette[0]);
}
```

Use the supplied palette in `loadPixelArt`, and pass it from `loadArtworkPixelArt`.

- [ ] **Step 2: Pass the selected palette into the generator**

Import `PALETTE` and `DARK_PALETTE` in `scripts/generate-spirit-vein-svg.cjs`, select with `{ light: PALETTE, dark: DARK_PALETTE }[themeName]`, and call `loadArtworkPixelArt(ARTWORKS, palette)`.

- [ ] **Step 3: Run the test to verify it passes**

Run: `npm test`

Expected: `Baroque pixel carousel SVG checks passed.`

### Task 3: Regenerate and verify committed SVG artefacts

**Files:**
- Modify: `TTTimsy-contribution-animation.svg`
- Modify: `TTTimsy-contribution-animation-dark.svg`

- [ ] **Step 1: Regenerate both assets**

Run: `npm run generate`

Expected: both `TTTimsy-contribution-animation.svg` and `TTTimsy-contribution-animation-dark.svg` are written.

- [ ] **Step 2: Verify generated assets and repository consistency**

Run: `npm test; git diff --check; git status --short`

Expected: test output is `Baroque pixel carousel SVG checks passed.`, `git diff --check` emits no errors, and status lists only the intended generator, test, documentation, and SVG changes.
