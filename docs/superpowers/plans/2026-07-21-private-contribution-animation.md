# Private Contribution Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the TTTimsy contribution animation include private contribution counts without exposing its read token.

**Architecture:** The existing generator keeps reading `GITHUB_TOKEN`; only its workflow step receives the `CONTRIBUTION_READ_TOKEN` Actions Secret. The auto-commit action receives no personal token. A PowerShell regression check protects the workflow wiring, and a manually dispatched run verifies it live.

**Tech Stack:** GitHub Actions, Actions Secrets, Node.js 20, PowerShell, GitHub CLI.

---

### Task 1: Add a static workflow regression check

**Files:**
- Create: `tests/verify_private_contribution_animation.ps1`
- Test: `tests/verify_private_contribution_animation.ps1`

- [ ] **Step 1: Write the failing test**

Create `tests/verify_private_contribution_animation.ps1` with:

```powershell
$workflow = Get-Content -LiteralPath '.github/workflows/generate-contribution-animation.yml' -Raw
$generator = Get-Content -LiteralPath 'scripts/generate-svg.cjs' -Raw
if ($workflow -notmatch 'GITHUB_TOKEN:\s*\$\{\{ secrets\.CONTRIBUTION_READ_TOKEN \}\}') { throw 'The SVG generator does not use CONTRIBUTION_READ_TOKEN.' }
if ($workflow -match 'GITHUB_TOKEN:\s*\$\{\{ secrets\.GITHUB_TOKEN \}\}') { throw 'The SVG generator still uses the automatic repository token.' }
if ($generator -match 'generated from public GitHub contribution data') { throw 'The SVG description still claims the contribution data is public only.' }
Write-Host 'Private contribution animation workflow checks passed.'
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pwsh -File tests/verify_private_contribution_animation.ps1`

Expected: `The SVG generator does not use CONTRIBUTION_READ_TOKEN.`

### Task 2: Route the private-read secret only to the generator

**Files:**
- Modify: `.github/workflows/generate-contribution-animation.yml:29-32`
- Modify: `scripts/generate-svg.cjs:204`
- Test: `tests/verify_private_contribution_animation.ps1`

- [ ] **Step 1: Replace the generator-step token source**

Replace the generator environment entry with `GITHUB_TOKEN: ${{ secrets.CONTRIBUTION_READ_TOKEN }}`. Do not add this variable to `Commit and push updated SVGs`.

- [ ] **Step 2: Correct the SVG description**

Replace `<desc>Animated light-yellow contribution graph generated from public GitHub contribution data.</desc>` with `<desc>Animated light-yellow contribution graph generated from GitHub contribution data.</desc>`.

- [ ] **Step 3: Run checks**

Run `pwsh -File tests/verify_private_contribution_animation.ps1`, then clear `GITHUB_TOKEN`, `GH_TOKEN`, and `GITHUB_AUTH_TOKEN` and run `node scripts/generate-svg.cjs`.

Expected: the static check passes; the generator exits with `GITHUB_TOKEN, GH_TOKEN, or GITHUB_AUTH_TOKEN is required.` before writing SVG files.

- [ ] **Step 4: Commit the implementation**

Run `git add .github/workflows/generate-contribution-animation.yml scripts/generate-svg.cjs tests/verify_private_contribution_animation.ps1 docs/superpowers/plans/2026-07-21-private-contribution-animation.md` then `git commit -m "fix: read private contributions for animation"`.

### Task 3: Publish and verify the GitHub Actions integration

**Files:**
- Verify: `TTTimsy-contribution-animation.svg`
- Verify: `TTTimsy-contribution-animation-dark.svg`
- Verify: `README.md`

- [ ] **Step 1: Synchronize before publishing**

Run `git fetch origin main` then `git log --oneline HEAD..origin/main`.

Expected: no output from the log command. If remote commits exist, rebase before push.

- [ ] **Step 2: Push the local commits**

Run `git push origin main`. Expected: `main -> main` succeeds.

- [ ] **Step 3: Dispatch and wait for the generator workflow**

Run `gh workflow run 'Generate Contribution Animation' --repo TTTimsy/TTTimsy`, obtain the newest run ID with `gh run list --repo TTTimsy/TTTimsy --workflow generate-contribution-animation.yml --limit 1`, then run `gh run watch <run-id> --repo TTTimsy/TTTimsy --exit-status`.

Expected: the dispatched run completes successfully.

- [ ] **Step 4: Fetch and inspect the generated commit**

Run `git pull --ff-only origin main`, inspect both SVG files with `Select-String -Pattern 'id="shot-[0-9]+"' -AllMatches`, and check README references with `rg -n 'TTTimsy-contribution-animation\.svg|TTTimsy-contribution-animation-dark\.svg' README.md`.

Expected: both shot counts are greater than zero and README references both SVG files.
