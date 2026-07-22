# Terraria Purity Biome Refinement Design

## Goal

Rework the spiritual-vein contribution scene into a compact Terraria-inspired
night biome. The scene must read through decisive tile masses, saturated
opaque color, and a small repeatable palette instead of atmospheric haze or
micro-pixel noise.

## Visual Rules

- Preserve the transparent SVG canvas, no border, no text in the artwork, and
  the existing accessible day titles.
- Restrict each theme to three solid terrain tones: distant indigo mountain,
  near teal cliff, and dark cut shadow. A bright cyan edge is the only rock
  highlight.
- Build exactly three legible landscape masses: a stepped far mountain range,
  two lower corner cliffs, and one central blue-green river basin. Every mass
  has a main fill, a shadow shelf, and a highlight shelf of at least two pixels
  where visible; no isolated terrain specks are allowed.
- Replace mist strips and random inactive shards with intentional, compact tile
  forms. All static SVG pixels are fully opaque.
- Use five fixed gold-white star shapes at the top of the sky. Each is a 2–3px
  cross and no warm-colored rectangle may be wider than two pixels.

## Contribution Veins

Contribution cells become four named mineral silhouettes rather than scaled
squares. Each higher tier adds a complete branch or core plate, not random
single-pixel decoration:

1. `sprout`: a small teal three-tile crystal.
2. `seam`: a four-to-six-tile jade vein with one bright cap.
3. `lode`: a broad jade branch with a moon-white core plate.
4. `geode`: a compact crystal cluster with a gold-white star point.

The existing count-aware tier calculation remains, so reported contribution
counts can elevate the visual tier even when GitHub reports a low quartile.
The date title and real count remain unchanged.

## Animation and Boundaries

The existing smoke actor cap, deterministic source/destination pairing, and
accessible static contribution base stay intact. Moving pixels may fade through
their group opacity, but their child colors use the same opaque mineral palette.

Do not change GraphQL requests, token handling, output names, workflow,
README, or private-contribution behavior. Do not add gradients, filters,
raster assets, scripts, external fonts, paths, or a canvas-sized background
rectangle.

## Verification

Update the deterministic scene test to require the purity-biome palette,
opaque terrain blocks, five fixed star shapes, no low-opacity static terrain
decorations, and the four count-aware contribution silhouettes. Retain the
existing checks for generated SVG layers, bounded smoke pixels, titles, and
the absence of old flying-sword content. Regenerate both output SVGs through
GitHub Actions and validate their XML, palette markers, and local/remote sync.
