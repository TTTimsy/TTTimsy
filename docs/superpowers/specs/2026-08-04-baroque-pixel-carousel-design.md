# Baroque Pixel Carousel Design

## Goal

Replace the single-image random reveal with a looping, pixel-art carousel of four Baroque paintings. The next painting must visibly overwrite the current one pixel by pixel; it must never fade through black or reintroduce contribution-grid decorations.

## Curated sequence

1. Caravaggio, *The Calling of Saint Matthew* — retain the existing `picture.png` as the opening image.
2. Caravaggio, *The Denial of Saint Peter* — download a public-domain collection image from the Metropolitan Museum of Art: https://www.metmuseum.org/art/collection/search/437986
3. Rembrandt, *Isaac and Rebecca, Known as ‘The Jewish Bride’* — download a public-domain collection image from the Rijksmuseum: https://www.rijksmuseum.nl/en/collection/object/Isaac%2Band%2BRebecca%2C%2BKnown%2Bas%2B%E2%80%98The%2BJewish%2BBride%E2%80%99--019c1265e6dbf108d4587ab2b7c02c66
4. Rembrandt, *The Sampling Officials of the Amsterdam Drapers’ Guild, Known as ‘The Syndics’* — download a public-domain collection image from the Rijksmuseum: https://www.rijksmuseum.nl/en/collection/object/The-Sampling-Officials-of-the-Amsterdam-Drapers-Guild-Known-as-The-Syndics--575b43f479d021359fb5f63b32f7c234

The order deliberately moves from Caravaggio’s dramatic darkness to Rembrandt’s warmer, grouped portraits before resolving back to the existing opening work.

## Visual behavior

- The SVG remains a crisp `159×21` canvas: 53 columns × 7 rows, with each calendar position represented by a `3×3` group of 1px pixels.
- Each painting is sampled with the existing cover-style crop rule: preserve aspect ratio, crop vertically around an artwork-specific focal point, and never stretch the source.
- The animation has four 14-second segments, for a 56-second repeating cycle.
- In every segment, the outgoing picture remains visible while the incoming picture overwrites its 3339 pixels in a deterministic random order over 10 seconds. It then remains fully visible for 4 seconds.
- Pixel order is derived from the transition index and the pixel coordinate. Therefore it is visually random while replaying identically each loop.
- No dark reset, contribution-cell frame, bridge, root halo, or other topology visual is rendered.

## Architecture

- Add three local source image files next to `picture.png`; define an ordered artwork manifest containing display title, source path, and focal point.
- Extend the pixel sampler to load every manifest image into an independently sampled 159×21 palette array.
- Replace the current two-state reveal animation with a single four-artwork SMIL color sequence per pixel. All transitions are encoded in one SVG so the README remains self-contained and needs no browser JavaScript.
- Continue generating the light and dark SVG filenames expected by `README.md`; the visual content is intentionally the same because the paintings provide their own dark palette.
- Keep the contribution calendar fetch only if required by surrounding workflow compatibility; the artwork timing and colors must not depend on contribution levels or counts.

## Validation

- Test that all four artwork assets decode and each samples to 3339 palette colors.
- Test the `159×21` viewBox, 3339 unit pixels, 56-second duration, and four ordered artwork transitions.
- Test that deterministic timing differs across coordinates and transitions.
- Reject rendered SVG containing prior topology classes or unsupported raster embedding.
- Regenerate both committed SVG artifacts and run `npm test` plus `git diff --check` before publishing.

## Scope boundaries

- This animation is a README visual only. It does not create, alter, or imitate GitHub’s actual green contribution graph.
- No interactive controls, labels, captions, or browser-side JavaScript are added.
