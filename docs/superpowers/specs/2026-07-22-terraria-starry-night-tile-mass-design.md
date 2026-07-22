# Terraria Starry-Night Tile-Mass Design

## Goal

Turn the contribution scene into a legible, saturated, opaque night landscape
that combines Terraria's clear tile masses with the broad blue-yellow rhythm
of *The Starry Night*. The result is an original pixel composition, not a
copy of either reference.

## Composition

The transparent SVG has four unambiguous layers:

1. **Sky currents:** two connected, stepped cobalt bands in the top sky. Each
   band is made from 4px-high, 16px-or-wider joined shelves; no free-floating
   sky fragments are allowed.
2. **Celestial anchors:** exactly three gold-white star whorls. Each whorl is a
   connected 6–8px tile glyph with a solid bright core and blue halo, never a
   lone pixel or a long warm-colored line.
3. **Land:** a distant indigo ridge, two teal framing cliffs, and one blue
   river basin. Every land mass has a main block, a shadow shelf, and a bright
   edge shelf, all opaque and at least two pixels thick.
4. **Mineral calendar:** contribution dates are connected jade crystal clusters
   that sit naturally on the terrain. Inactive dates are one compact dormant
   stone tile, not decorative debris.

## Palette and Shape Rules

Dark mode uses a compact high-saturation palette: deep navy, cobalt blue,
moon blue, teal cliff, jade, moon-white, and gold-white. Light mode maps each
role to an equally distinct, saturated value. There are no gray haze colors,
alpha-blended static blocks, or random single-pixel accents.

All static tiles must be at least 2px in both dimensions; star points and
terrain edges are not exceptions. The only one-pixel elements allowed anywhere
are the existing animated smoke particles, whose group opacity creates motion.

## Contribution Silhouettes

Each active contribution uses an opaque, connected shape with no isolated
fragment:

- `sprout` (tier 1): a 3×4 teal crystal with a 2px dark base.
- `seam` (tier 2): a wider jade crystal with a 2px moon-white cap.
- `lode` (tier 3): a forked 8px-wide jade seam with a 3×3 bright core plate.
- `geode` (tier 4): a compact 10px-wide crystal mass with a 4×4 moon-white
  core and one connected gold-white outer cap.

The existing count-aware thresholds remain unchanged. Day titles, actual
counts, and `data-level` stay available; `data-vein-shape` records the named
silhouette.

## Non-Visual Boundaries and Verification

GraphQL, token resolution, output names, workflow, README, private
contribution support, SVG accessibility, and the 88-pixel smoke cap remain
unchanged. No gradients, filters, raster assets, scripts, paths, canvas-sized
backdrop, or external fonts are allowed.

Tests must verify the two sky-current layers, three connected star whorls,
opaque terrain colors, absence of any 1px static rectangle, four connected
vein-shape variants, titles, smoke cap, and old-art removal. After pushing,
validate both workflow-generated SVGs and fast-forward local `main` to the
resulting commit.
