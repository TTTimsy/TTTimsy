# Terraria Spirit-Vein Contribution Animation Design

## Goal

Replace the existing flying-sword contribution animation with a true hard-edge
pixel landscape. The real GitHub contribution calendar becomes an integrated
part of a moonlit blue-green river valley: active dates appear as jade spirit
veins along ridges, river glints in the valley, and rare gold-white starfire in
mist. The final scene must feel like a handcrafted Terraria-style game
landscape, not a landscape wallpaper with a calendar drawn over it.

The checked-in `assets/概念图.png` is compositional reference only. It is never
embedded in the output SVG or loaded by a profile visitor.

## Composition and Palette

The SVG remains transparent and frameless so the GitHub background is visible.
It translates the reference image into a low-resolution pixel scene:

- Stepped, dark foreground ridges frame the lower left and lower right edges.
- Two sparse indigo far-ridge bands sit behind the contribution field without
  crossing contribution-cell centres.
- The central 53-by-7 calendar field is the calm river valley. Empty dates are
  faint stone or water pixels; they keep calendar geometry readable without
  becoming a visible grid.
- Active date cells are compact multi-pixel mineral lights. Contribution level
  controls the amount and brightness of jade, celadon, old-gold, and moon-white
  micro-pixels, rather than merely selecting a larger green square.
- Small stepped river currents and a few rigid mist-pixel banks connect the
  field to the terrain. They preserve a deliberately open central valley.

Both light and dark themes use a restrained hierarchy: charcoal and ink-indigo
for terrain, mineral blue-green and celadon for active energy, and rare old-gold
or moon-white for the brightest activity. The artwork uses integer-aligned
rectangles and stepped polygons only, with `shape-rendering="crispEdges"`.
It uses no blur, gradient, opacity haze, text, border, paper texture, external
font, raster backdrop, or full-canvas background rectangle.

## Contribution Data and Static SVG Layers

Contribution retrieval, private-contribution handling, day titles, dates,
counts, output names, and README image embedding remain unchanged. Every date
retains an SVG `<title>` of the form `YYYY-MM-DD: N contributions`.

The generator creates these self-contained SVG layers in order:

1. `pixel-far-ridges` and `pixel-frame-ridges` render static stepped terrain
   around, never over, calendar centres.
2. `pixel-river-valley` adds static current lines and shore pixels between
   cells.
3. `contribution-spirit-vein` renders all real date cells as activity-aware
   micro-pixel clusters.
4. `pixel-mist-banks` supplies sparse static angular cloud pixels.
5. `spirit-smoke-actors` renders animated micro-particle groups above active
   cells.

The former sword sprite, sword dais, flying-sword paths, and starfire flares
are removed from both the generator and generated SVGs.

## Animation

The animation is a seamless smoke cycle, not a sequential visit path. Select a
stable, evenly distributed subset of active dates as smoke origins. Each of ten
to twelve smoke actors contains a small deterministic set of micro-pixels; the
total moving-pixel budget is capped at 90.

At a staggered time, a source cell's added energy micro-pixels fade from their
normal cluster, travel primarily up and right along a stepped path, allow a
small leftward perturbation, and fade out. A matching new cluster appears at a
different deterministic active destination after the actor fades. Source and
destination order is derived from stable date/index arithmetic, so generated
SVGs are repeatable while the motion appears irregular. A single cycle timer
loops only after every actor has completed and a short quiet pause has elapsed.

The base contribution cell never disappears entirely: its date remains visible
and accessible while only its decorative energy micro-pixels participate in the
smoke effect. Motion uses SMIL `set` and `animateTransform` on crisp pixel
groups; it does not use filters, scripts, CSS animation, or external assets.

## Implementation Boundaries

The dependency-free CommonJS generator remains
`scripts/generate-spirit-vein-svg.cjs`. `buildAnimatedSvg` stays importable for
deterministic tests, while direct execution keeps its token, username, GraphQL,
and light/dark output behavior.

The obsolete flying-sword PNG may remain in the repository only until this
change is verified and committed; no generated SVG may reference it. The new
concept image remains unreferenced source material and is not part of the
runtime asset path.

## Verification

Add or replace deterministic Node assertions to require the new terrain,
river-valley, contribution-spirit-vein, and smoke-actor identifiers; preserved
contribution titles; crisp-edge rendering; and bounded smoke actor output.
Assertions must reject the sword sprite data URI, sword/dais/flight identifiers,
and shooter vocabulary.

Run syntax validation, the updated deterministic SVG test, the private-token
workflow guard, and the missing-token generator check. Regenerate both SVGs
through the existing GitHub Actions workflow after the implementation commit,
then inspect the downloaded/generated files for the new identifiers and intact
README references.

## Scope

This change redesigns only the generated SVG scene and its regression tests. It
does not change GitHub account settings, contribution collection, Actions
secrets, schedules, README layout, or repository visibility.
