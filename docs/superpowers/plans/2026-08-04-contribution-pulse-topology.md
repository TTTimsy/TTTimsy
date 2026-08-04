# Contribution Pulse Topology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Make the Caravaggio contribution animation visibly follow real contribution clusters through a 24-second “holy-light circuit” topology.

**Architecture:** Add a pure topology module that converts the padded 53×7 calendar into deterministic active components, root nodes, breadth-first propagation edges, and distance fields. The existing pixel module renders those data structures as cell frames, bridges, node halos, directional subpixel timing, and distance-based reveal timing; the generator remains the API and SVG-file boundary.

**Tech Stack:** Node.js 20, CommonJS, pngjs, SVG SMIL, Node assert.

---

## File structure

- Create: scripts/contribution-pulse-topology.cjs — calendar graph and deterministic timing metadata only.
- Modify: scripts/calling-of-saint-matthew-pixels.cjs — topology-aware SVG layers and 24-second timing.
- Modify: scripts/generate-spirit-vein-svg.cjs — import topology-aware renderer and update accessibility copy.
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs — topology, SVG contract, no-data, and artifact checks.
- Modify: TTTimsy-contribution-animation.svg and TTTimsy-contribution-animation-dark.svg — regenerated artifacts.

### Task 1: Test and implement contribution topology

**Files:**
- Create: scripts/contribution-pulse-topology.cjs
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs

- [ ] **Step 1: Write failing graph tests**

Add this fixture and assertions:

    const { buildContributionTopology } = require('../scripts/contribution-pulse-topology.cjs');

    const smallCalendar = [
      [
        { date: 'a', count: 2, level: 2, weekday: 0 },
        { date: 'b', count: 0, level: 0, weekday: 1 },
        { date: 'c', count: 9, level: 4, weekday: 2 },
      ],
      [
        { date: 'd', count: 4, level: 3, weekday: 0 },
        { date: 'e', count: 7, level: 4, weekday: 1 },
        { date: 'f', count: 0, level: 0, weekday: 2 },
      ],
    ];
    const topology = buildContributionTopology(smallCalendar, { weeks: 2, days: 3 });
    assert.equal(topology.components.length, 2);
    assert.equal(topology.components[0].root.date, 'e');
    assert.equal(topology.components[0].members.length, 3);
    assert.ok(topology.bridges.some((edge) => edge.from.date === 'e' && edge.to.date === 'd'));
    assert.ok(topology.bridges.every((edge) => edge.from.count > 0 && edge.to.count > 0));
    assert.equal(topology.distanceByCoordinate.get('0,1'), 1);

- [ ] **Step 2: Run the test to verify failure**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: failure because contribution-pulse-topology.cjs does not exist.

- [ ] **Step 3: Implement the pure graph API**

Export buildContributionTopology(data, { weeks = 53, days = 7 }). Flatten the calendar into records with weekIndex and weekday. Treat count greater than zero as active. Connect active records at Chebyshev distance one, including diagonals, only when their week and weekday coordinates are within bounds.

For every component, select root with this comparator:

    function compareRootCandidate(left, right) {
      return right.count - left.count || left.date.localeCompare(right.date);
    }

Build a BFS tree from its root. For same-distance frontier records, sort by count descending then date ascending. Export bridges only from parent to child. Build distanceByCoordinate for every calendar coordinate as its minimum Chebyshev distance to any active coordinate; with no active cells store Infinity for every coordinate.

- [ ] **Step 4: Run graph tests**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: graph assertions pass; later old SVG assertions may remain the only failures until Task 3.

- [ ] **Step 5: Commit topology data**

Run: git add scripts/contribution-pulse-topology.cjs tests/verify_calling_of_saint_matthew_animation.cjs

Run: git commit -m "feat: derive contribution pulse topology"

### Task 2: Test and implement topology-driven SVG layers

**Files:**
- Modify: scripts/calling-of-saint-matthew-pixels.cjs
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs

- [ ] **Step 1: Replace old 18-second renderer assertions with pulse assertions**

For the existing 53×7 fixture, assert:

    assert.match(svg, /id="contribution-cell-frames"/);
    assert.match(svg, /id="contribution-pulse-bridges"/);
    assert.match(svg, /id="contribution-root-halos"/);
    assert.equal((svg.match(/class="contribution-cell-frame"/g) || []).length, 371);
    assert.ok((svg.match(/class="pulse-bridge"/g) || []).length > 0);
    assert.ok((svg.match(/class="contribution-root-halo"/g) || []).length > 0);
    assert.match(svg, /dur="24s"/);
    assert.doesNotMatch(svg, /dur="18s"|smoke-actor|spirit-vein|terraria/i);

- [ ] **Step 2: Run the renderer test to verify failure**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: failure because current SVG has neither the three topology layer IDs nor a 24-second duration.

- [ ] **Step 3: Implement timing and cell-frame helpers**

Replace REVEAL_SECONDS, HOLD_SECONDS, RETURN_SECONDS, and CYCLE_SECONDS with:

    const INITIAL_SECONDS = 3;
    const TOPOLOGY_SECONDS = 8;
    const FIELD_REVEAL_SECONDS = 5;
    const FULL_IMAGE_SECONDS = 4;
    const RETURN_SECONDS = 4;
    const CYCLE_SECONDS = 24;

Export cellPulseTimes(day, topologyRecord). It returns initial, topologyStart, topologyEnd, fullColorStart, holdEnd, and returnStart. Root nodes start at second 3; tree depth contributes 0.72 seconds; a deterministic subpixel offset is at most 0.18 seconds. Inactive cells use 11 plus distance times 0.42 seconds, clamped below 16. All return starts are the reverse of their reveal ordering distributed through seconds 20–24.

Render one contribution-cell-frame rect per day with a dark-gold stroke, one contribution-root-halo group per root, and one pulse-bridge rect or two-pixel diagonal bridge per exported bridge. Each bridge animates opacity only during its child timing window. Sort bridges by parent count descending and parent date ascending, then retain only the first 1,000.

- [ ] **Step 4: Implement directional 3×3 timing**

For non-root cells, derive the entry vector from parent coordinate to child coordinate. Schedule the entry-edge subpixels first, center subpixel second, and exit-edge subpixels third. For root cells, schedule center, four orthogonal pixels, then four corners. Keep each rect's final fill equal to its sampled palette color; only its initial fill and keyTimes change.

Emit SVG groups in this order:

    <g id="contribution-cell-frames">...</g>
    <g id="contribution-pulse-bridges">...</g>
    <g id="calling-of-saint-matthew-mosaic">...</g>
    <g id="contribution-root-halos">...</g>

- [ ] **Step 5: Run the renderer test**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: all topology layer, count, duration, and forbidden-markup assertions pass.

- [ ] **Step 6: Commit SVG layer implementation**

Run: git add scripts/calling-of-saint-matthew-pixels.cjs tests/verify_calling_of_saint_matthew_animation.cjs

Run: git commit -m "feat: animate contribution pulse circuits"

### Task 3: Integrate no-data behavior and public SVG generation

**Files:**
- Modify: scripts/generate-spirit-vein-svg.cjs
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs
- Modify: TTTimsy-contribution-animation.svg
- Modify: TTTimsy-contribution-animation-dark.svg

- [ ] **Step 1: Write failing no-data and determinism assertions**

Add a 53×7 calendar whose entries all have count and level zero. Assert:

    const emptySvg = buildAnimatedSvg({ data: emptyCalendar, themeName: 'dark', profileName: 'Timsy' });
    assert.equal((emptySvg.match(/class="pulse-bridge"/g) || []).length, 0);
    assert.equal((emptySvg.match(/class="contribution-root-halo"/g) || []).length, 0);
    assert.equal(buildAnimatedSvg({ data: calendar, themeName: 'dark', profileName: 'Timsy' }), svg);

- [ ] **Step 2: Run the test to verify failure**

Run: node tests/verify_calling_of_saint_matthew_animation.cjs

Expected: failure until empty calendars omit pulse layers and repeated rendering is byte-for-byte stable.

- [ ] **Step 3: Finish generator integration**

Update the SVG title and description to mention contribution pulse topology and 24-second animation. Ensure buildAnimatedSvg loads picture.png once per render, invokes buildContributionTopology through buildContributionMosaic, and keeps the existing GraphQL query, partial-week padding, output filenames, and nonzero CLI failure behavior.

- [ ] **Step 4: Run the test suite**

Run: npm test

Expected: Calling of Saint Matthew SVG checks passed.

- [ ] **Step 5: Generate real artifacts**

Run: PowerShell command that sets GITHUB_TOKEN from gh auth token and CONTRIBUTION_USERNAME to TTTimsy only for npm run generate, then removes both variables.

Expected: both TTTimsy contribution SVG files are written.

- [ ] **Step 6: Verify and commit artifacts**

Run: npm test

Expected: Calling of Saint Matthew SVG checks passed.

Run: git diff --check

Expected: exit code 0 with no output.

Run: git add scripts/generate-spirit-vein-svg.cjs tests/verify_calling_of_saint_matthew_animation.cjs TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg

Run: git commit -m "chore: publish contribution pulse topology"

## Plan self-review

- Spec coverage: Task 1 covers 8-neighbor components, deterministic roots, BFS bridges, and distance fields. Task 2 covers frames, bridges, halos, directional 3×3 flow, bridge cap, and the full 24-second cycle. Task 3 covers no-data fallback, deterministic output, real contribution generation, and artifacts.
- Completeness scan: all tasks name paths, APIs, data rules, commands, and expected outcomes.
- Type consistency: buildContributionTopology returns components, bridges, and distanceByCoordinate; cellPulseTimes consumes topology records; buildContributionMosaic owns SVG composition; buildAnimatedSvg remains the public renderer.

