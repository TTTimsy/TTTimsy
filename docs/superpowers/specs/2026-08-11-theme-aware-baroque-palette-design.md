# Theme-aware Baroque pixel palette

## Goal

Make the README's light and dark SVG sources visibly distinct while retaining
the existing four-painting carousel, pixel geometry, timing, and accessibility
metadata.

## Design

The generator will select a palette from the requested theme before sampling
each artwork. The light palette remains the current palette so the light asset
is visually stable. The dark palette uses brighter warm midtones and highlights
so the paintings retain definition against GitHub's dark page background.

The palette is passed through the existing artwork sampling flow rather than
post-processing the generated SVG. This keeps palette quantisation as the
single source of truth for both generated assets.

## Testing

Tests will prove that light and dark SVGs retain the same pixel count, artwork
order, and 56-second animation cycle, while their generated markup differs.
They will also check that both source files are regenerated from the intended
theme. Existing image-decoding and SVG-safety assertions remain in place.

## Scope

Only palette selection, its tests, and the generated SVG artefacts change. The
README embed markup, artwork list, transition timing, and workflow remain
unchanged.

## Benchmark alignment

The checked-in benchmark is the sentinel's immutable runtime source, so this reviewed palette upgrade promotes the regenerated light and dark SVG assets to the benchmark and refreshes its manifest hashes in the same commit. Daily automation remains unable to write `benchmark/`; future benchmark changes require the same explicit review-and-commit process.

