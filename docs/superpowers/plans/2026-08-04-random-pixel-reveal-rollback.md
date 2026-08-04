# Random Pixel Reveal Rollback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Restore the compact random pixel reveal animation without contribution topology visuals.

**Architecture:** Simplify the existing pixel renderer to 159×21 one-unit pixels and its original deterministic random 10/4/4 timing. Delete SVG-only topology layers from rendering while leaving calendar retrieval and source-image sampling intact.

**Tech Stack:** Node.js, CommonJS, pngjs, SVG SMIL, Node assert.

---

### Task 1: Restore renderer contracts

**Files:**
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs
- Modify: scripts/calling-of-saint-matthew-pixels.cjs
- Modify: scripts/generate-spirit-vein-svg.cjs

- [ ] **Step 1: Write failing assertions**

    assert.match(svg, /viewBox="0 0 159 21"/);
    assert.equal((svg.match(/class="matthew-pixel"[^>]*width="1" height="1"/g) || []).length, 3339);
    assert.match(svg, /dur="18s"/);
    assert.doesNotMatch(svg, /contribution-cell-frame|pulse-bridge|contribution-root-halo|contribution-pulse-topology/);

- [ ] **Step 2: Verify red**

Run: npm test

Expected: failure because the current output is 424×56 and includes topology layers.

- [ ] **Step 3: Restore minimal renderer**

Set REVEAL_SECONDS = 10, HOLD_SECONDS = 4, RETURN_SECONDS = 4, CYCLE_SECONDS = 18. Map each subpixel to x = weekIndex * 3 + subX and y = weekday * 3 + subY with width and height 1. BuildContributionMosaic returns only calling-of-saint-matthew-mosaic and contribution-day groups. Remove frames, bridges, and halos. Set buildAnimatedSvg viewBox to 159×21.

- [ ] **Step 4: Verify green**

Run: npm test

Expected: Calling of Saint Matthew SVG checks passed.

### Task 2: Generate and publish rollback artifacts

**Files:**
- Modify: TTTimsy-contribution-animation.svg
- Modify: TTTimsy-contribution-animation-dark.svg

- [ ] **Step 1: Generate**

Run PowerShell with GITHUB_TOKEN from gh auth token and CONTRIBUTION_USERNAME TTTimsy for npm run generate only.

- [ ] **Step 2: Verify**

Run: npm test

Expected: Calling of Saint Matthew SVG checks passed.

Run: git diff --check

Expected: no output.

- [ ] **Step 3: Commit**

Run: git add scripts/calling-of-saint-matthew-pixels.cjs scripts/generate-spirit-vein-svg.cjs tests/verify_calling_of_saint_matthew_animation.cjs TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg

Run: git commit -m "feat: restore random pixel reveal"

## Plan self-review

- The two tasks restore every specified visual and timing rule, preserve input sampling, and verify generated artifacts.

