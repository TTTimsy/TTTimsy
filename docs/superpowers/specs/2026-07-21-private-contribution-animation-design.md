# Private Contribution Animation Design

## Goal

Regenerate the profile contribution animation from TTTimsy's complete GitHub
contribution calendar, including contributions in private repositories that the
profile already publicizes as anonymous counts.

## Cause

The `Generate animated SVGs` workflow step currently passes the automatic
repository `GITHUB_TOKEN` to the generator. That token can update this
repository, but it cannot request the owner's private contribution totals. The
GraphQL calendar is therefore empty and the generated SVG contains no shots.

## Design

Use the repository Actions secret named `CONTRIBUTION_READ_TOKEN` only for the
generator step, assigning it to the existing `GITHUB_TOKEN` environment
variable that `scripts/generate-svg.cjs` already reads. The secret is a
least-privilege classic personal access token with the `read:user` scope.

Keep the workflow-level `contents: write` permission and the
`git-auto-commit-action` configuration unchanged. That action continues to use
the automatic Actions token to commit the generated SVG files; the private-read
token is neither written to a file nor exposed to the commit step.

Update the SVG description text so it no longer claims that its data is public
only.

## Verification

1. Check the workflow YAML diff: only the generator-step token source changes.
2. Run the generator locally with a deliberately missing token and confirm it
   fails without writing an authenticated response or token value to output.
3. Push the workflow change, manually dispatch the workflow, and confirm its
   generated SVG commit contains `shot-` animation IDs and has a nonzero target
   count.
4. Confirm the profile README continues to reference both generated SVG files.

## Security

The token value stays exclusively in the GitHub Actions secret store. Logs and
committed files must not contain the token, contribution repository names, or
other private repository metadata.
