# Spirit-Vein Landscape Contribution Animation Design

## Goal

Replace the arcade bubble-shooter contribution animation with a calm Chinese
fantasy landscape scroll. The animation must continue to display the real
GitHub contribution calendar, including private contribution counts, while
feeling like an elegant cultivation-world scene rather than a game interface.

## Visual Direction

The scene is a pale ink-wash mountain range on rice-paper white in light mode
and deep indigo night in dark mode. Low, middle, and high contribution levels
appear as increasingly luminous celadon spirit-lamps: dim jade for light
activity, then pale gold and moon-white for high activity. Empty dates remain
subtle stone-grey nodes so the yearly calendar's seven-by-week structure is
still readable.

Three translucent mountain ridges, a mist bank, and a thin river make a
horizontal scroll behind the calendar. They are decorative background layers;
they never replace, hide, or change the date positions of the contribution
nodes.

## Animation

The contribution nodes are visited chronologically by a small moon-white
spirit-light. At each active date it creates a restrained jade-and-gold ripple
and a four-petal lotus flare, then fades. A slow moving highlight on the river
and drifting mist add life between visits. The cycle repeats without a harsh
flash, explosion, or opaque overlay.

The implementation caps sequentially animated active dates at 120 so the
generated SVG remains responsive in a GitHub profile README. All active dates
remain visible and retain their exact `title` text even when they are not in the
animated subset.

## Data and Accessibility

`requestContributionWeeks`, `normalizeWeeks`, contribution counts, levels,
dates, and per-day SVG titles remain unchanged. The new SVG has a descriptive
title and description that identify it as an animated spirit-vein landscape
based on GitHub contribution data. Light and dark output filenames and README
embedding remain unchanged.

## Technical Boundaries

The generator remains dependency-free Node.js and emits self-contained SVG.
It uses SVG/SMIL animation elements already supported by the current output:
`animate`, `set`, and animated presentation attributes. It does not embed a
token, private repository name, remote image, script, filter URL, or external
font.

## Verification

1. Extend the PowerShell regression check to require the private-read secret,
   the spirit-vein SVG labels, mountain and river layer identifiers, and at
   least one sequential spirit-light animation identifier.
2. Run the check against the previous shooter output first and confirm it
   fails.
3. After implementation, run the check, `node --check`, and the existing
   missing-token guard.
4. Push to `main`, allow the existing workflow to regenerate both SVG files,
   and confirm both contain the landscape identifiers, nonzero `spirit-step-`
   animations, unchanged README image references, and a successful Actions
   run.

## Scope

This change only redesigns the generated SVG scene and its static regression
test. It does not change contribution retrieval, Actions secret handling,
schedule, README layout, or unrelated profile content.
