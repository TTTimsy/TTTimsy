$workflow = Get-Content -LiteralPath '.github/workflows/generate-contribution-animation.yml' -Raw
$generator = Get-Content -LiteralPath 'scripts/generate-spirit-vein-svg.cjs' -Raw

if ($workflow -notmatch 'GITHUB_TOKEN:\s*\$\{\{ secrets\.CONTRIBUTION_READ_TOKEN \}\}') {
  throw 'The SVG generator does not use CONTRIBUTION_READ_TOKEN.'
}

if ($workflow -match 'GITHUB_TOKEN:\s*\$\{\{ secrets\.GITHUB_TOKEN \}\}') {
  throw 'The SVG generator still uses the automatic repository token.'
}

if ($generator -match 'generated from public GitHub contribution data') {
  throw 'The SVG description still claims the contribution data is public only.'
}

if ($generator -notmatch 'id="ink-mountains"') {
  throw 'The spirit-vein mountain layer is missing.'
}

if ($generator -notmatch 'id="spirit-river"') {
  throw 'The spirit-vein river layer is missing.'
}

if ($generator -notmatch 'id="spirit-step-') {
  throw 'The sequential spirit-light animation is missing.'
}

if ($generator -match 'shooter|bullet|explosion') {
  throw 'Bubble-shooter artwork remains in the generator.'
}

Write-Host 'Private contribution animation workflow checks passed.'
