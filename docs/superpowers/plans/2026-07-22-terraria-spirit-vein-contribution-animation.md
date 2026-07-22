# Terraria Spirit-Vein Contribution Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flying-sword contribution animation with a self-contained, transparent Terraria-like pixel landscape where accessible contribution cells read as jade spiritual-vein terrain and a looped smoke system migrates energy between active cells.

**Architecture:** Keep the GraphQL request, environment-variable token resolution, weekly calendar normalization, generated filenames, and workflow unchanged. Refactor only the SVG scene construction in the Node generator: a fixed set of rectangular pixel terrain layers surrounds an accessibility-preserving contribution layer, while deterministic `<g>` animation actors move limited micro-pixel clusters between active-cell anchors.

**Tech Stack:** Node.js CommonJS, static SVG/SMIL, Node `assert`, PowerShell source guards, GitHub Actions.

---

### Task 1: Replace the scene-contract test with the new landscape requirements

**Files:**
- Modify: `tests/verify_pixel_xianxia_animation.cjs`

**Step 1: Write the failing assertions**

Replace the flying-sword expectations with assertions for the four static terrain layers, contribution spirit-vein layer, and smoke actor container. Retain contribution-title assertions, and add explicit negative checks for the old sprite/flight identifiers and banned SVG primitives.

The test should assert all of the following from a small deterministic fixture:

```js
assert.match(svg, /id="pixel-far-ridges"/);
assert.match(svg, /id="pixel-frame-ridges"/);
assert.match(svg, /id="pixel-river-valley"/);
assert.match(svg, /id="pixel-mist-banks"/);
assert.match(svg, /id="contribution-spirit-vein"/);
assert.match(svg, /id="spirit-smoke-actors"/);
assert.match(svg, /id="smoke-actor-0"/);
assert.doesNotMatch(svg, /data:image\/png;base64,|sword-dais|sword-flight|starfire-flare|flying-sword/i);
assert.doesNotMatch(svg, /<(?:image|circle|ellipse|path|text|linearGradient|radialGradient|filter)\b/);
```

Count `class="smoke-micro-pixel"` occurrences and assert that the total is nonzero and no higher than 90. Preserve the current transparent-canvas and Chinese-text guards.

**Step 2: Run the test to verify it fails**

Run: `node tests/verify_pixel_xianxia_animation.cjs`

Expected: failure because the old generator lacks the new layer IDs and still emits flying-sword content.

**Step 3: Keep the fixture focused**

Use at least three active fixture days so the test also proves that a smoke source can reassemble at a different contribution cell. Do not add snapshot files or live API dependencies.

**Step 4: Do not commit yet**

Leave this failing test in the worktree until the generator and source guard are updated together.

### Task 2: Update the private-contribution source guard for the new SVG contract

**Files:**
- Modify: `tests/verify_private_contribution_animation.ps1`

**Step 1: Replace stale flying-sword checks**

Keep the checks that protect `CONTRIBUTION_READ_TOKEN`, reject the automatic repository token, and ensure no public-only data claim is introduced. Replace the old art assertions with source-level checks for:

```powershell
'id="pixel-far-ridges"'
'id="pixel-frame-ridges"'
'id="pixel-river-valley"'
'id="contribution-spirit-vein"'
'id="spirit-smoke-actors"'
```

Add negative checks for `loadFlyingSwordDataUri`, `data:image/png;base64`, `sword-dais`, `sword-flight`, and `flying-sword`.

**Step 2: Run the guard to verify it fails**

Run: `pwsh -File tests/verify_private_contribution_animation.ps1`

Expected: failure on the missing new terrain layer source marker while the old implementation remains present.

**Step 3: Preserve workflow scope**

Do not modify `.github/workflows/generate-contribution-animation.yml`; it should continue to call the same script with the same private-read secret and output-file pattern.

### Task 3: Refactor the SVG generator into a transparent pixel landscape

**Files:**
- Modify: `scripts/generate-spirit-vein-svg.cjs`

**Step 1: Remove raster/flying-sword dependencies**

Remove `path` and `loadFlyingSwordDataUri`, all sword dais/flight/flare construction, and every reference to `pixel-xianxia-flying-sword.png`. Keep `fs` only for writing the generated SVGs and retain `https` for GraphQL.

**Step 2: Define terrain-oriented theme tokens and rectangle helpers**

Replace sword-oriented tokens with color tokens for distant rock, foreground rock, river shadow, river glint, jade core, jade glow, mist, starfire, and muted inactive cells. Keep both light and dark themes readable on GitHub, with the dark theme tuned to the transparent GitHub dark background.

Build the scene strictly from integer-aligned `rect` fragments through a helper like:

```js
const rectPixel = (x, y, width, height, fill, opacity = 1, extra = '') =>
  `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(width)}" height="${Math.round(height)}" fill="${fill}" opacity="${opacity}"${extra} />`;
```

Do not introduce a backdrop rectangle, image element, gradients, filters, paths, external assets, scripts, or fonts.

**Step 3: Build the four terrain layers around the grid**

Emit stable groups named exactly `pixel-far-ridges`, `pixel-frame-ridges`, `pixel-river-valley`, and `pixel-mist-banks` before the contribution layer. Use stepped 1–5px rectangular fragments to form left/right framing peaks, a broad calm central river-valley corridor, sparse banks/trees, and broken low-contrast mist strips. Leave the central contribution area open enough that its terrain reinterpretation remains legible.

**Step 4: Transform contribution cells into spiritual-vein terrain**

For every calendar day, retain a `<title>` with the exact `YYYY-MM-DD: N contributions` content. Render inactive days as restrained, low-opacity stone/noise fragments instead of a separate bright grid. Render active days as compact, level-scaled jade clusters: stronger level means a larger/brighter core and more adjacent vein pixels. Place the resulting groups inside `id="contribution-spirit-vein"`.

Collect active day anchors in deterministic week/day order. Do not change the `normalizeWeeks` data shape or API request behavior.

**Step 5: Add bounded, deterministic smoke actors**

Create `id="spirit-smoke-actors"` containing a maximum of 11 `id="smoke-actor-N"` groups. Each actor owns exactly eight `class="smoke-micro-pixel"` rectangles, so at most 88 moving pixels exist globally. Animate each actor from an active source anchor upward/right with a small deterministic left offset, fade it while travelling, then use a discrete visibility/reset sequence so its particles appear at a different active destination anchor for the next cycle.

Coordinate actors from the collected active anchors using deterministic modular indices, for example source index `N` and destination index `(N * 3 + 1) % activeDates.length`, while guaranteeing a different destination when there is more than one active day. Start all actors from the shared cycle trigger with staggered begin offsets. Keep a short pause before the next cycle so the loop reads as continuous smoke rather than a sword traversal.

**Step 6: Update accessible metadata**

Retain `<title>` and `role="img"`, but rename the SVG title, aria-label, and description to accurately describe a pixel spiritual-vein contribution landscape with drifting energy. Do not add Chinese text.

### Task 4: Run all local verification and inspect the generated structure

**Files:**
- Verify: `scripts/generate-spirit-vein-svg.cjs`
- Verify: `tests/verify_pixel_xianxia_animation.cjs`
- Verify: `tests/verify_private_contribution_animation.ps1`

**Step 1: Check JavaScript syntax**

Run: `node --check scripts/generate-spirit-vein-svg.cjs`

Expected: exits 0.

**Step 2: Run the focused scene test**

Run: `node tests/verify_pixel_xianxia_animation.cjs`

Expected: prints the updated landscape-check success message and exits 0.

**Step 3: Run the workflow/source guard**

Run: `pwsh -File tests/verify_private_contribution_animation.ps1`

Expected: prints the private-contribution workflow success message and exits 0.

**Step 4: Verify the missing-token safety path without writing output**

In a PowerShell child process with `GITHUB_TOKEN`, `GH_TOKEN`, and `GITHUB_AUTH_TOKEN` removed, run the generator. Confirm that it exits nonzero and reports that a token is required before any GraphQL request/output write.

**Step 5: Perform whitespace and repository checks**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; only the intended generator, test, and plan changes are candidates for staging. Preserve the user's untracked concept art, handoff document, and prompt document.

### Task 5: Commit the implementation, publish it, and collect generated artifacts

**Files:**
- Commit: `scripts/generate-spirit-vein-svg.cjs`
- Commit: `tests/verify_pixel_xianxia_animation.cjs`
- Commit: `tests/verify_private_contribution_animation.ps1`
- Commit: `docs/superpowers/plans/2026-07-22-terraria-spirit-vein-contribution-animation.md`

**Step 1: Review staged diff deliberately**

Stage only the four implementation/plan files above; do not stage `assets/概念图.png`, `交接.md`, or `docs/qinglu-landscape-concept-prompt.md`. Review `git diff --cached` to ensure no token or user-added asset is included.

**Step 2: Commit implementation**

Run: `git commit -m "feat: render terraria spirit-vein contributions"`

Expected: one local commit containing the complete generator and test change.

**Step 3: Synchronize before publication**

Run:

```powershell
git fetch origin main
git log --oneline HEAD..origin/main
```

If remote `main` has new commits, integrate them without discarding local changes, re-run Task 4 verification, and only then continue. If an integration choice requires non-fast-forward history rewriting, stop and ask the user.

**Step 4: Push and monitor the existing generation workflow**

Push the commit to `origin main`. Confirm the `Generate Contribution Animation` GitHub Actions run completes successfully, then fast-forward local `main` to the workflow's generated SVG commit. Inspect both generated SVGs for the new structural IDs and absence of raster/sword content before reporting completion.

**Step 5: Final handoff**

Report the commit(s), workflow status, and that the generated light/dark SVGs have been refreshed. Mention any external workflow failure plainly with the exact next action; do not claim generated assets were updated until their workflow commit is present locally.
