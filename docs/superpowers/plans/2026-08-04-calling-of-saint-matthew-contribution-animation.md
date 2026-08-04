# Calling of Saint Matthew Contribution Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the Terraria-style profile contribution animation with a looping 3×3-per-day pixel rendition of picture.png, whose initial brightness represents contribution activity.

**Architecture:** Keep the GitHub GraphQL query and output names in scripts/generate-spirit-vein-svg.cjs, but replace its scene construction with a dedicated image-sampling module. The module decodes picture.png, crops it at a stable 36% vertical focal point, quantizes it to 16 colors at 159×21, assigns each pixel a contribution-driven initial color, and serializes per-pixel SVG animations.

**Tech Stack:** Node.js 20, CommonJS, pngjs, SVG SMIL, Node assert, GitHub Actions.

---

## File structure

- picture.png — tracked source artwork.
- package.json / package-lock.json — reproducible pngjs dependency plus generate and test scripts.
- scripts/calling-of-saint-matthew-pixels.cjs — PNG crop/sample/quantization, contribution-state colors, seeded schedule, and mosaic markup.
- scripts/generate-spirit-vein-svg.cjs — retained CLI/API boundary; imports the new renderer and writes the two established output filenames.
- tests/verify_calling_of_saint_matthew_animation.cjs — sampler and SVG-contract checks.
- .github/workflows/generate-contribution-animation.yml — installs locked dependencies before generation.
- TTTimsy-contribution-animation.svg and TTTimsy-contribution-animation-dark.svg — generated public artifacts.

### Task 1: Bootstrap deterministic PNG processing

**Files:**
- Create: package.json
- Create: package-lock.json
- Create: picture.png (stage the user-provided source)
- Modify: .github/workflows/generate-contribution-animation.yml

- [ ] **Step 1: Add the package manifest**

    {
      "name": "tttimsy-profile",
      "private": true,
      "version": "1.0.0",
      "scripts": {
        "generate": "node scripts/generate-spirit-vein-svg.cjs",
        "test": "node tests/verify_calling_of_saint_matthew_animation.cjs"
      },
      "dependencies": {
        "pngjs": "^7.0.0"
      }
    }

Run: npm install --package-lock-only

Expected: package-lock.json locks pngjs 7.x; no node_modules directory is staged.

- [ ] **Step 2: Install the dependency in Actions**

Insert this exact step after Setup Node.js and before Generate animated SVGs:

    - name: Install generator dependencies
      run: npm ci

- [ ] **Step 3: Verify the toolchain**

Run: npm ci

Expected: exit code 0.

Run: node -e "require('pngjs')"

Expected: exit code 0.

- [ ] **Step 4: Commit the bootstrap**

Run: git add package.json package-lock.json picture.png .github/workflows/generate-contribution-animation.yml

Run: git commit -m "build: add reproducible PNG generation dependency"

### Task 2: Implement and test source-image sampling

**Files:**
- Create: scripts/calling-of-saint-matthew-pixels.cjs
- Create: tests/verify_calling_of_saint_matthew_animation.cjs

- [ ] **Step 1: Write the failing sampler contract**

Start the test file with:

    const assert = require('node:assert/strict');
    const path = require('node:path');
    const {
      TARGET_COLUMNS, TARGET_ROWS, PALETTE, loadPixelArt,
    } = require('../scripts/calling-of-saint-matthew-pixels.cjs');

    const source = path.join(__dirname, '..', 'picture.png');
    const first = loadPixelArt(source);
    const second = loadPixelArt(source);
    assert.equal(TARGET_COLUMNS, 159);
    assert.equal(TARGET_ROWS, 21);
    assert.equal(first.length, 3339);
    assert.deepEqual(first, second);
    assert.ok(first.every((color) => PALETTE.includes(color)));
    assert.ok(new Set(first).size >= 8);

- [ ] **Step 2: Run the test to verify failure**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: failure because scripts/calling-of-saint-matthew-pixels.cjs does not exist.

- [ ] **Step 3: Implement the sampler API**

Create a CommonJS module exporting these values and functions:

    const TARGET_WEEKS = 53;
    const DAYS_PER_WEEK = 7;
    const SUBPIXELS_PER_DAY = 3;
    const TARGET_COLUMNS = TARGET_WEEKS * SUBPIXELS_PER_DAY;
    const TARGET_ROWS = DAYS_PER_WEEK * SUBPIXELS_PER_DAY;
    const FOCAL_Y = 0.36;
    const PALETTE = [
      '#090706', '#16100c', '#2b1b12', '#432918',
      '#5d3a20', '#794a25', '#965f2c', '#b77a38',
      '#d29a4e', '#edd08a', '#3d1e0f', '#6a2117',
      '#98351f', '#bd5730', '#d67c43', '#f0bf72',
    ];

    function clamp(value, minimum, maximum) {
      return Math.min(maximum, Math.max(minimum, value));
    }
    function cropBounds(width, height) {
      const cropHeight = width * TARGET_ROWS / TARGET_COLUMNS;
      const cropTop = clamp(Math.round(height * FOCAL_Y - cropHeight / 2), 0, height - cropHeight);
      return { left: 0, top: cropTop, width, height: cropHeight };
    }
    function nearestPaletteColor(red, green, blue) {
      return PALETTE.reduce((best, color) => squaredDistance(color, red, green, blue) < squaredDistance(best, red, green, blue) ? color : best, PALETTE[0]);
    }

Decode with PNG.sync.read(fs.readFileSync(sourcePath)). Use cropHeight = width * TARGET_ROWS / TARGET_COLUMNS and cropTop = clamp(Math.round(height * FOCAL_Y - cropHeight / 2), 0, height - cropHeight). For every output coordinate, sample the centre of its corresponding crop bucket and return its nearest palette color. Throw Error messages that name sourcePath if decode dimensions, crop dimensions, or RGBA data are invalid.

- [ ] **Step 4: Run the sampler contract**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: Calling of Saint Matthew SVG checks passed.

- [ ] **Step 5: Commit the sampler**

Run: git add scripts/calling-of-saint-matthew-pixels.cjs tests/verify_calling_of_saint_matthew_animation.cjs

Run: git commit -m "feat: sample Caravaggio pixel palette"

### Task 3: Add contribution-state colors and deterministic cycle timing

**Files:**
- Modify: scripts/calling-of-saint-matthew-pixels.cjs
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs

- [ ] **Step 1: Write failing color and timing checks**

Add these imports and assertions:

    const {
      initialColorForLevel, animationDelayFor,
      REVEAL_SECONDS, HOLD_SECONDS, RETURN_SECONDS, CYCLE_SECONDS,
    } = require('../scripts/calling-of-saint-matthew-pixels.cjs');

    assert.equal(REVEAL_SECONDS, 10);
    assert.equal(HOLD_SECONDS, 4);
    assert.equal(RETURN_SECONDS, 4);
    assert.equal(CYCLE_SECONDS, 18);
    assert.equal(initialColorForLevel('#d29a4e', 0), '#090706');
    assert.notEqual(initialColorForLevel('#d29a4e', 1), initialColorForLevel('#d29a4e', 4));
    assert.equal(animationDelayFor('2026-01-02', 1, 2), animationDelayFor('2026-01-02', 1, 2));
    assert.notEqual(animationDelayFor('2026-01-02', 1, 2), animationDelayFor('2026-01-03', 1, 2));

- [ ] **Step 2: Run the test to verify missing exports**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: failure stating that initialColorForLevel or animationDelayFor is not a function.

- [ ] **Step 3: Implement exact state rules**

Add constants REVEAL_SECONDS = 10, HOLD_SECONDS = 4, RETURN_SECONDS = 4, CYCLE_SECONDS = 18, PIXEL_TRANSITION_SECONDS = 0.25, and LAST_REVEAL_DELAY = 9.75. Implement a 32-bit FNV-1a hash from the concatenation of date, subpixel column, and subpixel row. animationDelayFor must return hash modulo 10000 divided by 10000 multiplied by 9.75, so every reveal finishes no later than second 10.

Implement mixHex by linearly interpolating each RGB channel and returning lower-case six-digit hexadecimal. initialColorForLevel(finalColor, level) must return PALETTE[0] at level 0 and interpolate from PALETTE[0] to finalColor with factors [0, 0.28, 0.48, 0.70, 1.00] for levels 0–4. Export every constant and helper used by the test.

- [ ] **Step 4: Run the timing contract**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: Calling of Saint Matthew SVG checks passed.

- [ ] **Step 5: Commit timing behavior**

Run: git add scripts/calling-of-saint-matthew-pixels.cjs tests/verify_calling_of_saint_matthew_animation.cjs

Run: git commit -m "feat: map contribution levels to pixel reveal states"

### Task 4: Render the 3×3 animated contribution mosaic

**Files:**
- Modify: scripts/calling-of-saint-matthew-pixels.cjs
- Modify: scripts/generate-spirit-vein-svg.cjs
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs
- Delete: tests/verify_pixel_xianxia_animation.cjs

- [ ] **Step 1: Write failing renderer assertions**

Use a 53-week, seven-day fixture, with the first day count and level both zero, the second day level one, and all remaining days level four. Import buildAnimatedSvg from scripts/generate-spirit-vein-svg.cjs, then assert:

    assert.match(svg, /id="calling-of-saint-matthew-mosaic"/);
    assert.equal((svg.match(/class="matthew-pixel"/g) || []).length, 3339);
    assert.equal((svg.match(/data-subpixel="[0-2],[0-2]"/g) || []).length, 3339);
    assert.match(svg, /data-date="2026-01-01" data-count="0" data-level="0"/);
    assert.match(svg, /dur="18s"/);
    assert.match(svg, /begin="0s"/);
    assert.doesNotMatch(svg, /<(?:image|filter|script|path|circle|ellipse)\b/);
    assert.doesNotMatch(svg, /data:image\/png;base64|spirit-vein|terraria|smoke-actor/i);

- [ ] **Step 2: Run the renderer assertions to prove failure**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: failure because calling-of-saint-matthew-mosaic is absent and the old scene produces neither 3339 pixels nor the required metadata.

- [ ] **Step 3: Implement buildContributionMosaic**

Export buildContributionMosaic({ data, pixelArt, themeName }). It must output one group per contribution date:

    <g class="contribution-day" data-date="DATE" data-count="COUNT" data-level="LEVEL">
      <title>DATE: COUNT contributions</title>
      <!-- exactly nine rect.matthew-pixel children -->
    </g>

For subpixel positions 0–2 in both axes, map calendar coordinates to pixelArt[(weekday * 3 + subY) * 159 + week * 3 + subX]. Set the rectangle fill to initialColorForLevel(finalColor, day.level), include data-subpixel="subX,subY", and append this animate element:

    <animate attributeName="fill"
      values="INITIAL;INITIAL;FINAL;FINAL;INITIAL"
      keyTimes="0;REVEAL_START;REVEAL_END;RETURN_START;1"
      dur="18s"
      begin="0s"
      repeatCount="indefinite" />

DELAY is animationDelayFor(day.date, subX, subY). REVEAL_START is DELAY divided by 18; REVEAL_END is (DELAY + 0.25) divided by 18; RETURN_START is (14 + DELAY / 9.75 * 3.75) divided by 18. This makes every pixel begin in the contribution-state color at time zero, finish revealing by second 10, hold the complete painting through second 14, and finish returning by second 18. Escape XML values before interpolation.

- [ ] **Step 4: Replace the old landscape SVG assembly**

In generate-spirit-vein-svg.cjs retain resolveUsername, resolveGitHubToken, requestContributionWeeks, normalizeWeeks, main, the two existing filenames, and existing nonzero CLI error behavior. Replace theme/terrain/shrine/smoke functions with buildAnimatedSvg that validates themeName, reads path.join(__dirname, '..', 'picture.png') through loadPixelArt, invokes buildContributionMosaic, and returns an SVG containing only title, description, crisp-edge attributes, and:

    <g id="calling-of-saint-matthew-mosaic">MOSAIC_MARKUP</g>

Retain the public CommonJS export of buildAnimatedSvg and normalizeWeeks. Do not embed images or use SVG filter, path, circle, ellipse, script, or external resources.

- [ ] **Step 5: Run the complete renderer verification**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: Calling of Saint Matthew SVG checks passed.

- [ ] **Step 6: Commit the new renderer**

Run: git add scripts/calling-of-saint-matthew-pixels.cjs scripts/generate-spirit-vein-svg.cjs tests/verify_calling_of_saint_matthew_animation.cjs tests/verify_pixel_xianxia_animation.cjs

Run: git commit -m "feat: render Caravaggio contribution mosaic"

### Task 5: Generate and verify public artifacts

**Files:**
- Modify: TTTimsy-contribution-animation.svg
- Modify: TTTimsy-contribution-animation-dark.svg
- Modify: README.md only if its existing image URLs no longer match the output names
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs

- [ ] **Step 1: Add output artifact assertions**

Read both output filenames from the repository root and apply these exact checks to each:

    assert.match(artifact, /id="calling-of-saint-matthew-mosaic"/);
    assert.equal((artifact.match(/class="matthew-pixel"/g) || []).length, 3339);
    assert.doesNotMatch(artifact, /data:image\/png;base64|spirit-vein|terraria/i);

- [ ] **Step 2: Generate both SVG files**

Run: npm run generate

Expected: output names TTTimsy-contribution-animation.svg and TTTimsy-contribution-animation-dark.svg are reported as written. If GitHub token or contribution retrieval fails, do not stage either SVG; resolve that configuration failure, then repeat this step.

- [ ] **Step 3: Run all automated checks**

Run: npm test

Expected: Calling of Saint Matthew SVG checks passed.

Run: git diff --check

Expected: exit code 0 with no output.

- [ ] **Step 4: Inspect the output visually**

Open both generated SVGs locally. Confirm square hard-edge pixels, high-contrast upper-band crop, dark inactive dates, higher initial visibility for higher-contribution dates, scattered ten-second reveal, four-second full-image hold, and scattered four-second return. If a browser fails to animate, rerun npm test before changing source or output; distinguish browser SVG support from renderer failure.

- [ ] **Step 5: Commit generated artifacts**

Run: git add TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg README.md tests/verify_calling_of_saint_matthew_animation.cjs

Run: git commit -m "chore: publish Caravaggio contribution animation"

## Plan self-review

- Spec coverage: Task 2 implements the fixed 36% focal crop, 16-color 159×21 sample. Task 3 implements initial contribution brightness and deterministic 10/4/4 timing. Task 4 maps every date to nine animated pixels and removes all old visual logic. Tasks 1 and 5 make CI reproducible and verify the published artifacts.
- Completeness scan: each task names exact paths, commands, expected output, functions, markup, and values; no deferred requirements remain.
- Type consistency: loadPixelArt, initialColorForLevel, animationDelayFor, buildContributionMosaic, and buildAnimatedSvg are defined before their later use under these same names.
