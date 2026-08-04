# Baroque Pixel Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace the single dark-to-light reveal with a 56-second carousel in which four Baroque paintings overwrite one another pixel by pixel.

**Architecture:** Three downloaded public-domain images and the existing picture.png form an ordered local manifest. The renderer samples all four into the same 159×21 palette grid and gives every coordinate one SMIL fill sequence containing four deterministic overwrite transitions. Generation becomes local-only, so the workflow does not fetch contribution data or use a contribution-read secret.

**Tech Stack:** Node.js CommonJS, pngjs, jpeg-js, SVG SMIL, Node assert, GitHub Actions.

---

## File structure

- Create: assets/baroque/caravaggio-denial-of-saint-peter.jpg — downloaded source artwork.
- Create: assets/baroque/rembrandt-jewish-bride.jpg — downloaded source artwork.
- Create: assets/baroque/rembrandt-syndics.jpg — downloaded source artwork.
- Create: scripts/baroque-artworks.cjs — ordered artwork manifest and source paths.
- Modify: scripts/calling-of-saint-matthew-pixels.cjs — focal crops, sampler, timing, and SVG rectangles.
- Modify: scripts/generate-spirit-vein-svg.cjs — local SVG generator.
- Modify: package.json and package-lock.json — JPEG source-image decoder.
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs — carousel contracts.
- Modify: .github/workflows/generate-contribution-animation.yml — local asset generator trigger.
- Modify: TTTimsy-contribution-animation.svg and TTTimsy-contribution-animation-dark.svg — generated artifacts.

### Task 1: Add the approved public-domain source images

**Files:**
- Create: assets/baroque/caravaggio-denial-of-saint-peter.jpg
- Create: assets/baroque/rembrandt-jewish-bride.jpg
- Create: assets/baroque/rembrandt-syndics.jpg

- [ ] **Step 1: Download each collection image and save it under its exact path**

Use the Download Image action on each official collection page, retain the original colour JPEG, and save it exactly as follows.

| Repository path | Collection page |
| --- | --- |
| assets/baroque/caravaggio-denial-of-saint-peter.jpg | https://www.metmuseum.org/art/collection/search/437986 |
| assets/baroque/rembrandt-jewish-bride.jpg | https://www.rijksmuseum.nl/en/collection/object/Isaac%2Band%2BRebecca%2C%2BKnown%2Bas%2B%E2%80%98The%2BJewish%2BBride%E2%80%99--019c1265e6dbf108d4587ab2b7c02c66 |
| assets/baroque/rembrandt-syndics.jpg | https://www.rijksmuseum.nl/en/collection/object/The-Sampling-Officials-of-the-Amsterdam-Drapers-Guild-Known-as-The-Syndics--575b43f479d021359fb5f63b32f7c234 |

- [ ] **Step 2: Verify only the intended binary inputs exist**

Run:

~~~
Get-ChildItem assets\baroque\*.jpg | Select-Object Name, Length
~~~

Expected: exactly the three names above and every Length is positive.

- [ ] **Step 3: Commit the immutable source inputs**

~~~
git add -- assets/baroque
git commit -m "assets: add baroque carousel sources"
~~~

### Task 2: Define failing carousel contracts

**Files:**
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs

- [ ] **Step 1: Add the intended imports before implementation**

Add this module import:

~~~js
const { ARTWORKS } = require('../scripts/baroque-artworks.cjs');
~~~

Extend the pixel-module imports with TRANSITION_SECONDS, SEGMENT_SECONDS, transitionDelayFor, and loadArtworkPixelArt.

- [ ] **Step 2: Replace one-picture timing checks with these contracts**

~~~js
assert.deepEqual(ARTWORKS.map(({ id }) => id), [
  'calling-of-saint-matthew',
  'denial-of-saint-peter',
  'jewish-bride',
  'syndics',
]);
assert.equal(TRANSITION_SECONDS, 10);
assert.equal(HOLD_SECONDS, 4);
assert.equal(SEGMENT_SECONDS, 14);
assert.equal(CYCLE_SECONDS, 56);

const artworkPixels = loadArtworkPixelArt(ARTWORKS);
assert.equal(artworkPixels.length, 4);
assert.ok(artworkPixels.every((pixels) => pixels.length === 3339));
assert.ok(artworkPixels.every((pixels) => pixels.every((pixel) => PALETTE.includes(pixel))));
assert.equal(transitionDelayFor(2, 21, 8), transitionDelayFor(2, 21, 8));
assert.notEqual(transitionDelayFor(2, 21, 8), transitionDelayFor(3, 21, 8));
~~~

Require SVG output to have a 159×21 viewBox, exactly 3339 class="baroque-pixel" unit rectangles, duration="56s", and data-artworks="calling-of-saint-matthew,denial-of-saint-peter,jewish-bride,syndics". Reject matthew-pixel, contribution-day, contribution-cell-frame, pulse-bridge, and contribution-root-halo.

- [ ] **Step 3: Verify the contracts are red**

Run:

~~~
npm test
~~~

Expected: failure because the manifest and sampler do not yet exist, and current SVG duration is 18 seconds.

- [ ] **Step 4: Commit the red test**

~~~
git add -- tests/verify_calling_of_saint_matthew_animation.cjs
git commit -m "test: define baroque carousel contracts"
~~~

### Task 3: Add manifest, focal sampling, and overwrite renderer

**Files:**
- Create: scripts/baroque-artworks.cjs
- Modify: scripts/calling-of-saint-matthew-pixels.cjs
- Modify: package.json
- Modify: package-lock.json

- [ ] **Step 1: Create the fixed artwork manifest**

~~~js
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARTWORKS = [
  { id: 'calling-of-saint-matthew', title: 'The Calling of Saint Matthew', sourcePath: path.join(ROOT, 'picture.png'), focalY: 0.36 },
  { id: 'denial-of-saint-peter', title: 'The Denial of Saint Peter', sourcePath: path.join(ROOT, 'assets', 'baroque', 'caravaggio-denial-of-saint-peter.jpg'), focalY: 0.42 },
  { id: 'jewish-bride', title: 'The Jewish Bride', sourcePath: path.join(ROOT, 'assets', 'baroque', 'rembrandt-jewish-bride.jpg'), focalY: 0.31 },
  { id: 'syndics', title: 'The Syndics', sourcePath: path.join(ROOT, 'assets', 'baroque', 'rembrandt-syndics.jpg'), focalY: 0.37 },
];

module.exports = { ARTWORKS };
~~~

- [ ] **Step 2: Install the decoder required by the downloaded JPEG assets**

Run:

~~~
npm install jpeg-js
~~~

Expected: `jpeg-js` is recorded in both package manifests.

- [ ] **Step 3: Make sampling focal-point aware, decode both PNG and JPEG, and add a manifest sampler**

~~~js
function cropBounds(width, height, focalY = FOCAL_Y) {
  const cropHeight = width * TARGET_ROWS / TARGET_COLUMNS;
  if (width < TARGET_COLUMNS || height < cropHeight) {
    throw new Error('Source image is too small for the target pixel crop.');
  }
  return {
    left: 0,
    top: clamp(Math.round(height * focalY - cropHeight / 2), 0, height - cropHeight),
    width,
    height: cropHeight,
  };
}

function decodeImage(sourcePath) {
  const bytes = fs.readFileSync(sourcePath);
  return /\.jpe?g$/i.test(sourcePath) ? jpeg.decode(bytes, { useTArray: true }) : PNG.sync.read(bytes);
}

function loadPixelArt(sourcePath, focalY = FOCAL_Y) {
  // Keep the existing palette quantisation.
  // Call decodeImage(sourcePath), then cropBounds(image.width, image.height, focalY).
}

function loadArtworkPixelArt(artworks) {
  return artworks.map(({ id, sourcePath, focalY }) => {
    try { return loadPixelArt(sourcePath, focalY); }
    catch (error) { throw new Error('Unable to sample ' + id + ': ' + error.message); }
  });
}
~~~

Require `jpeg-js` as `jpeg`, export `loadArtworkPixelArt` and retain `loadPixelArt`.

- [ ] **Step 3: Replace single-reveal timing with carousel timing**

~~~js
const TRANSITION_SECONDS = 10;
const HOLD_SECONDS = 4;
const SEGMENT_SECONDS = TRANSITION_SECONDS + HOLD_SECONDS;
const CYCLE_SECONDS = SEGMENT_SECONDS * 4;
const PIXEL_TRANSITION_SECONDS = 0.25;
const LAST_REVEAL_DELAY = TRANSITION_SECONDS - PIXEL_TRANSITION_SECONDS;

function transitionDelayFor(transitionIndex, pixelX, pixelY) {
  return (hash32(transitionIndex + ':' + pixelX + ':' + pixelY) % 10000) / 10000 * LAST_REVEAL_DELAY;
}
~~~

- [ ] **Step 4: Implement buildBaroqueMosaic**

Validate four manifest entries and four arrays of 3339 colours. For each x in 0..158 and y in 0..20, gather the four sampled colours and compute:

~~~js
const colors = artworkPixels.map((pixels) => pixels[y * TARGET_COLUMNS + x]);
const delays = colors.map((_, index) => transitionDelayFor(index, x, y));
const keyTimes = [0, delays[0], delays[0] + 0.25,
  14 + delays[1], 14 + delays[1] + 0.25,
  28 + delays[2], 28 + delays[2] + 0.25,
  42 + delays[3], 42 + delays[3] + 0.25, 56]
  .map((time) => (time / CYCLE_SECONDS).toFixed(4));
const values = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2], colors[3], colors[3], colors[0], colors[0]];
~~~

Emit one class="baroque-pixel" rectangle of width="1" and height="1", with a fill animate node using the values, keyTimes, duration 56s, begin 0s, and indefinite repeat. Return only a group id="baroque-pixel-carousel" whose data-artworks attribute is the manifest ID list in order. Do not emit contribution-day groups, initial contribution colors, frames, bridges, halos, or dark reset colors.

- [ ] **Step 5: Verify the renderer layer and commit it**

Run:

~~~
npm test
~~~

Expected: manifest and sampling checks pass; generator output checks may remain red until Task 4.

Then commit:

~~~
git add -- package.json package-lock.json scripts/baroque-artworks.cjs scripts/calling-of-saint-matthew-pixels.cjs
git commit -m "feat: add baroque pixel renderer"
~~~

### Task 4: Make generation local-only, publish, and verify

**Files:**
- Modify: scripts/generate-spirit-vein-svg.cjs
- Modify: tests/verify_calling_of_saint_matthew_animation.cjs
- Modify: .github/workflows/generate-contribution-animation.yml
- Modify: TTTimsy-contribution-animation.svg
- Modify: TTTimsy-contribution-animation-dark.svg

- [ ] **Step 1: Remove the GitHub API dependency from the generator**

Import ARTWORKS, buildBaroqueMosaic, and loadArtworkPixelArt. Make buildAnimatedSvg accept only themeName and profileName, call buildBaroqueMosaic with the manifest and sampled images, and use title text "Baroque pixel carousel" plus description "Four Baroque paintings overwrite one another in a repeating pixel animation."

Delete the https import, token resolution, GraphQL calendar retrieval, and normalizeWeeks. Resolve username from CONTRIBUTION_USERNAME, then GITHUB_REPOSITORY, then literal TTTimsy; generate both existing output filenames without credentials.

- [ ] **Step 2: Update tests to call the local generator**

Remove normalizeWeeks imports, partial-calendar fixtures, topology tests, and data from buildAnimatedSvg calls. Extend artifact assertions to require the 56-second carousel group, all four IDs, 3339 baroque-pixel rectangles, and absence of old topology terms.

- [ ] **Step 3: Verify tests are green**

Run:

~~~
npm test
~~~

Expected: Baroque pixel carousel SVG checks passed.

- [ ] **Step 4: Simplify the workflow**

Replace its triggers with:

~~~yaml
on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'picture.png'
      - 'assets/baroque/**'
      - 'scripts/**'
      - 'package.json'
      - 'package-lock.json'
      - '.github/workflows/generate-contribution-animation.yml'
~~~

Keep Node setup, dependency installation, generated-artifact commit, and write permissions. Remove CONTRIBUTION_READ_TOKEN and any GITHUB_TOKEN line used only by the generator.

- [ ] **Step 5: Regenerate and check both artifacts without credentials**

Run:

~~~
npm run generate
npm test
git diff --check
~~~

Expected: both SVG filenames are written, tests pass, and diff check has no output.

- [ ] **Step 6: Confirm README integration, commit, and push only with fresh evidence**

Run:

~~~
rg -n "TTTimsy-contribution-animation(-dark)?\.svg" README.md
rg -o 'viewBox="0 0 159 21"|id="baroque-pixel-carousel"|data-artworks="[^"]+"|dur="56s"' TTTimsy-contribution-animation.svg
~~~

Expected: README still references both artifact names; all four SVG markers appear.

Commit and publish:

~~~
git add -- scripts/generate-spirit-vein-svg.cjs tests/verify_calling_of_saint_matthew_animation.cjs .github/workflows/generate-contribution-animation.yml TTTimsy-contribution-animation.svg TTTimsy-contribution-animation-dark.svg
git commit -m "feat: publish baroque pixel carousel"
git status --short
git push origin main
git rev-list --left-right --count HEAD...origin/main
~~~

Expected: clean status before push and 0 0 after push. If an automation commit arrives first, fetch origin/main, rebase, preserve the locally regenerated two SVGs while resolving only their conflicts, rerun npm test, then push.

## Plan self-review

- Spec coverage: Tasks 1–3 supply the four approved works, 159×21 cover crops, deterministic 10-second overwrites, 4-second holds, a 56-second loop, and no contribution visuals. Task 4 removes data fetching, regenerates artifacts, protects README integration, and publishes after tests.
- Placeholder scan: artwork pages, paths, timing values, function names, commands, expected outcomes, and commit boundaries are explicit.
- Interface consistency: ARTWORKS, loadArtworkPixelArt, transitionDelayFor, and buildBaroqueMosaic are defined before later generator and test steps consume them.
