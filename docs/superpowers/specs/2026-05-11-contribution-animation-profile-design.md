# Contribution Animation Profile Design

## Goal

Replace the current snake animation in the `TTTimsy/TTTimsy` profile README with a light-yellow animated contribution graph inspired by `Man0dya/Readme-Contribution-Graph-Generator`. The animation should appear as the main profile cover on `https://github.com/TTTimsy` and update automatically from the account's public GitHub contribution data.

## Current State

The profile repository `TTTimsy/TTTimsy` currently contains:

- `README.md`, which embeds a snake SVG from an `output` branch path.
- `.github/workflows/snake.yml`, which generates snake SVGs with `Platane/snk`.

The requested direction is to stop using the snake effect and use the bubble-shooter style animated contribution graph instead.

## Approach

Use the reference project's automated generator pattern:

- Add `scripts/generate-svg.cjs` to fetch contribution data from the GitHub GraphQL API using `GITHUB_TOKEN`.
- Add `.github/workflows/generate-contribution-animation.yml` to run the script on push, manual dispatch, and a daily schedule.
- Commit generated SVGs directly to the profile repository root.
- Update `README.md` to show the generated SVGs at the top of the profile README using a light/dark `<picture>` block.
- Replace the old snake workflow with the new contribution-animation workflow.

## Visual Direction

Use a soft light-yellow theme:

- Empty contribution dots: `#fff8dc`
- Low contribution dots: `#fff1a8`
- Medium contribution dots: `#f7d774`
- High contribution dots: `#e6b84f`
- Highest contribution dots: `#d4a72c`
- Shooter: `#d4a72c`
- Explosion ring: `#f2b84b`
- Particles: `#ffd966`

For dark mode, keep the same yellow identity while making empty cells darker so the animation remains visible:

- Empty dark cells: `#161b22`
- Yellow contribution scale from muted gold to bright gold.

## README Layout

The README should become a profile cover rather than a utility snippet:

- Centered greeting: `Hi, I'm Timsy`
- Short understated subtitle
- Light/dark contribution animation block
- Simple decorative divider

The README should not keep the snake references.

## Data Flow

1. GitHub Actions runs on push, manual dispatch, and daily schedule.
2. The workflow checks out the repository and installs Node 20.
3. `scripts/generate-svg.cjs` reads `CONTRIBUTION_USERNAME` or the repository owner.
4. The script queries GitHub GraphQL contribution calendar data with `GITHUB_TOKEN`.
5. The script writes light and dark animated SVG files into the repository root.
6. `stefanzweifel/git-auto-commit-action` commits changed SVGs.
7. `README.md` references the generated SVG files with relative paths.

## Error Handling

- If `GITHUB_TOKEN` is missing, the script exits with a clear error.
- If the username cannot be resolved, the script exits with a clear error.
- If the GraphQL response is invalid, the script logs the raw response and exits non-zero so the Actions run fails visibly.

## Verification

After implementation:

- Confirm `README.md` no longer references snake files.
- Confirm `README.md` references `TTTimsy-contribution-animation.svg` and `TTTimsy-contribution-animation-dark.svg`.
- Run the workflow manually with `gh workflow run`.
- Confirm the latest workflow run succeeds.
- Confirm generated SVG files exist in the repository root.
- Confirm generated SVG contains SMIL animation tags.

## Scope

This change only affects the profile README animation system in `TTTimsy/TTTimsy`. It does not change unrelated profile content, repository settings, or other repositories.