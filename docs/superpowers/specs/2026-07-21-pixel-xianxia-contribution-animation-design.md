# Pixel Xianxia Contribution Animation Design

## Goal

Replace the current spirit-vein landscape with a compact pixel-art xianxia
scene for the profile contribution animation. It must feel native to GitHub's
dark background, contain no visible text or Chinese characters, and remove all
remaining bubble-shooter language.

## Visual Direction

The generated SVG is a transparent, frameless pixel mountain-and-cloud scene.
It never paints a page-sized background rectangle, border, paper texture, or
rounded card. The GitHub page remains the background in both colour schemes.

The dark palette is deliberately restrained: ink-indigo outlines, deep blue
mountain pixels, jade activity pixels, and sparse old-gold highlights. It
borrows the dark-surface restraint of the Vercel reference rather than its
marketing gradient: decoration stays atmospheric and full-bleed, with no card
chrome. The light palette is a muted inverse with the same contrast hierarchy.

Contribution data is still represented at its original calendar coordinates,
but the regular grid is visually absorbed into the scene. Empty dates become
near-invisible night pixels. Active dates are bright jade-to-gold starfire
pixels, with contribution level determining intensity. Pixel cloud banks,
angular mountain ridges, and a sparse star path frame the calendar without
obscuring an active date.

## Flying Sword and Motion

The former launcher becomes a small, low-left pixel sword dais. It is a subtle
silhouette rather than a mechanical emitter. The former bubble/projectile is
replaced by a clearly recognizable jade-and-gold pixel flying sword with a
short hard-edged spirit-flame trail. There are no balls, collision effects,
explosions, or bubble clusters.

The sword begins at the dais and visits active dates in chronological order.
At each target, its spirit-flame collapses into a brief starfire flare before
the sword continues to the next active date. The cycle is continuous and calm:
the sword is visible at roughly three contribution-cell widths, while the
trail and flare are short enough not to overwhelm the data.

All decorative geometry uses integer-aligned rectangular pixels, stepped paths,
and `shape-rendering="crispEdges"`. Curved ink washes, blur filters, and soft
full-scene gradients are excluded.

## Generated Asset

Use the built-in image generator to create one no-text, transparent pixel-art
flying-sword sprite on a magenta chroma-key backdrop. Remove the chroma key,
crop excess transparent padding, validate alpha coverage, and save the final
PNG under `assets/` with a stable descriptive name. The generator reads that
PNG and embeds it as a data URI inside each output SVG, so the profile has no
external asset request and no visible rectangular image boundary.

The sword is the only raster component. The contribution pixels, sword dais,
mountains, cloud banks, flares, and timing are generated as SVG so they remain
sharp and responsive in a GitHub README.

## Data, Accessibility, and Technical Boundaries

`requestContributionWeeks`, `normalizeWeeks`, token use, private contribution
support, calendar titles, dates, counts, output names, and README picture
embedding remain unchanged. Visible art includes no text. Existing English SVG
accessibility metadata may describe the animation but must not render as a
visible label.

The Node.js generator remains dependency-free. It reads the checked-in PNG with
Node's standard library and emits self-contained SVGs using SMIL motion already
supported by the existing animation. It must cap sequential visits so the SVG
remains practical for a profile README while all contribution cells stay
visible and retain exact titles.

## Verification

1. Add a regression test for the transparent canvas, pixel-scene identifiers,
   embedded flying-sword data URI, sword-dais identifier, chronological flight
   animation, contribution titles, and absence of shooter/bubble vocabulary.
2. Run the new test against the current landscape first and confirm it fails.
3. Generate the sprite with the built-in image tool, chroma-key it to alpha,
   validate dimensions and alpha bounds, and add it to the repository.
4. Update the generator and verify it with `node --check`, the new regression
