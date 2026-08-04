# Mosaic Calendar Geometry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Render the contribution topology as a clearly legible 53×7 mosaic calendar without yellow external node boxes.

**Architecture:** Keep topology data unchanged; replace only SVG geometry in calling-of-saint-matthew-pixels.cjs. Map each logical 3×3 pixel group to an 8×8 date brick, reserve gutters for frames and bridges, then regenerate both public SVG files.

**Tech Stack:** Node.js, CommonJS, SVG SMIL, Node assert.

---

### Task 1: Add failing mosaic-geometry assertions

**Files:**
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs

- [ ] **Step 1: Write the failing assertions**

    assert.match(svg, /viewBox="0 0 424 56"/);
    assert.equal((svg.match(/class="contribution-cell-frame"/g) || []).length, 371);
    assert.equal((svg.match(/class="matthew-pixel"[^>]*width="2" height="2"/g) || []).length, 3339);
    assert.doesNotMatch(svg, /class="contribution-root-halo"[^>]*width="3.7"/);
    assert.ok((svg.match(/class="pulse-bridge"[^>]*width="1"/g) || []).length > 0);

- [ ] **Step 2: Verify red**

Run: npm test

Expected: failure because the current viewBox is 159×21 and pixels are 1×1.

### Task 2: Implement brick, gutter, and bridge geometry

**Files:**
- Modify: scripts/calling-of-saint-matthew-pixels.cjs
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs

- [ ] **Step 1: Add fixed geometry constants**

    const CELL_SIZE = 8;
    const PIXEL_SIZE = 2;
    const CELL_CONTENT_SIZE = 6;
    const SVG_WIDTH = 53 * CELL_SIZE;
    const SVG_HEIGHT = 7 * CELL_SIZE;

- [ ] **Step 2: Map each art pixel into its brick**

For week w, weekday d, subpixel sx, sy use x = w * 8 + sx * 2 and y = d * 8 + sy * 2. Render each matthew-pixel at width 2 and height 2. Render contribution-cell-frame as a deep-stone 8×8 rect with a 1-unit right/bottom gutter; active levels add 1–4 low-luminance edge segments inside that gutter.

- [ ] **Step 3: Replace yellow halos and block bridges**

Delete full root-halo rectangles. Render each root as a 2×2 cross within its cell center only. Render horizontal and vertical bridges as 1-unit rectangles in shared gutters; render diagonal bridges as one horizontal and one vertical 1-unit segment. Never create a bridge rectangle wider than the gutter or over pixel-content coordinates.

- [ ] **Step 4: Update SVG viewBox**

Modify buildAnimatedSvg in scripts/generate-spirit-vein-svg.cjs to use viewBox 0 0 424 56.

- [ ] **Step 5: Verify green**

Run: npm test

Expected: Calling of Saint Matthew SVG checks passed.

- [ ] **Step 6: Commit**

Run: git add scripts/calling-of-saint-matthew-pixels.cjs scripts/generate-spirit-vein-svg.cjs tests/verify_calling_of_saint_matthew_animation.cjs

Run: git commit -m "feat: frame contribution mosaic calendar"

### Task 3: Regenerate and publish

**Files:**
- Modify: TTTimsy-contribution-animation.svg
- Modify: TTTimsy-contribution-animation-dark.svg

- [ ] **Step 1: Generate real artifacts**

Run the PowerShell command that sets GITHUB_TOKEN from gh auth token and CONTRIBUTION_USERNAME to TTTimsy for npm run generate only.

Expected: both SVG filenames are written.

- [ ] **Step 2: Verify artifacts**

Run: npm test

Expected: Calling of Saint Matthew SVG checks passed.

Run: git diff --check

Expected: no output.

- [ ] **Step 3: Commit artifacts**

Run: git add TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg

Run: git commit -m "chore: publish framed contribution mosaic"

## Plan self-review

- Spec coverage: Task 1 proves required dimensions and removal of yellow boxes; Task 2 implements 8×8 bricks, 2×2 pixels, gutters, edge heat, interior roots, and narrow bridges; Task 3 generates verified artifacts.
- Completeness scan: every task includes paths, concrete geometry, commands, and expected results.

