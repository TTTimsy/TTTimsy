# Contribution Shrine Three-Pass Refinement Design

## Goal

Make the contribution calendar the unmistakable hero of an original Terraria
night landscape. The finished transparent SVG should feel like a polished
pixel-art relic: contribution activity illuminates a mineral shrine, while the
mountains and sky supply scale without competing for attention.

The work proceeds in three deliberate visual passes: hierarchy first, colour
second, and detail last. A pass is not considered finished until its generated
SVG is structurally audited and visually inspected as a raster preview.

## Fixed Boundaries

- Preserve GraphQL fetching, token handling, output names, workflow, README,
  private-contribution support, accessibility titles, and the 11-actor cap.
- Keep a transparent SVG with no canvas-sized backdrop, gradients, filters,
  raster images, scripts, paths, external fonts, text labels, or watermark.
- Retain only opaque static tiles. Every visible rectangle, including animated
  actor children, uses a width and height that are multiples of 2px.
- No static isolated pixels, hairline strips, random texture, or decorative
  debris. Every tile must belong to a named visual object.

## Pass 1: Contribution-First Hierarchy

### Composition

The calendar becomes the open centre of a **mineral shrine**. Its actual grid
bounds define the shrine bounds, so the composition scales from a short test
fixture to a full year without hand-tuned offsets.

1. Render the subdued sky currents and three star whorls in the upper quarter.
2. Keep one distant ridge low in the scene and crop the teal framing cliffs to
   the far left and right edges. Neither may cross the calendar's inner area.
3. Add `contribution-shrine` after terrain and before active/inactive cells.
   It is an open frame, never a filled panel: a stepped top lintel, a heavier
   bottom plinth, and four compact corner piers. The inside remains fully
   transparent and unobscured.
4. Render calendar mineral cells above the frame and animation last.

The reading order must be: **activity minerals → shrine silhouette → framing
cliffs → distant landscape → sky**. The shrine uses quiet indigo structural
colours so only real contribution cells carry the most luminous colours.

### Dynamic Geometry

Use the existing `paddingX`, `gridTop`, `cell`, and week count to calculate a
rectangular calendar envelope. The lintel and plinth extend 6px beyond the
envelope; corner piers are 6px-wide connected masses at the envelope ends.
Each long structural bar is formed from overlapping 4px-high stepped shelves,
not one canvas-sized background rectangle. At least one 2px moon-blue edge
shelf marks the lintel and plinth, while their main bodies remain dark indigo.

## Pass 2: Controlled Gemstone Palette

The colour system has four luminance bands. Saturation is concentrated in the
contribution cells and used sparingly elsewhere.

| Role | Dark intent | Use |
| --- | --- | --- |
| Structural dark | midnight ink and calm ultramarine | shrine bodies, deep mountain shadow, dormant cells |
| Environmental middle | cobalt, blue-teal, river blue | sky currents, cliffs, ridge faces, water |
| Contribution light | gem jade and moon-mint | active mineral bodies and bright inner planes |
| Accent | one restrained cream-gold | star cores and tier-four mineral caps only |

Dark mode centres on midnight navy, cobalt, gemstone jade, moon-mint, and one
cream-gold accent. Light mode keeps the same hue relationships while raising
the structural values enough to remain legible on a pale GitHub page. Neither
mode introduces neutral grey haze, alpha blending, or an extra competing
green/yellow family.

All static fills have `opacity="1"`. Gold may appear in exactly two named
object families: `star-whorl` and `geode` cells. It must not be used as river,
terrain, shrine, smoke, or inactive-cell decoration.

## Pass 3: Material Grammar and Motion

### Two-Pixel Grammar

Every static silhouette is built on a 2px unit. A detail is valid only if it
is edge-connected to the object it describes and reinforces a material cue.

- Shrine: paired stone joints, connected moon-blue cap shelves, and no extra
  corner ornaments.
- Stars: three connected, same-direction spiral glyphs. Each has a gold core
  and a moon-blue arm; none reads as a cross, dot, or generic sparkle.
- Mountains and river: broad 6px bodies, with 2px connected edge or shadow
  shelves only where a change of plane is needed.
- Minerals: fixed connected silhouettes with even dimensions: `sprout` is a
  4x4 jade body with a 2x2 base; `seam` is a 6x4 body with cap and base;
  `lode` is an 8x4 seam with two connected 4x2 bright planes; `geode` is a
  10x6 mass with a 4x4 moon-mint core and a connected 2x2 gold cap.

### Animation

Each smoke actor remains a bounded 8-rectangle transition from one active day
to another, but its sprite becomes four connected pairs of 2x2 energy tiles.
The actor's animation timing and group opacity retain the existing movement
story; it no longer emits single-pixel visual noise.

## Verification

Automated tests must require:

1. `contribution-shrine` to exist before the contribution-cell layer, with a
   transparent interior and no canvas-sized rectangle.
2. Two sky-current groups, three connected star whorls, one low distant ridge,
   two edge-only framing cliffs, and opaque palette markers for each theme.
3. Static tile dimensions to be positive even integers; every smoke child to
   be 2x2; no forbidden legacy/raster identifiers.
4. Named, connected mineral silhouettes; count-aware tiers; titles; and the
   existing smoke actor and rectangle caps.

After every pass, generate a representative full-year fixture, rasterize it
without altering repository assets, and inspect the preview at normal display
scale. The final pass also validates both workflow-generated SVGs as XML and
confirms local `main` and `origin/main` have a `0 0` divergence count.

## Explicit Non-Goals

This is not a rewrite of the data pipeline, a replacement of the animation
concept, a recreation of a Terraria scene or *The Starry Night*, or a move to
smooth/vector painting. The intent is an original, readable pixel composition
with contribution activity at its centre.
