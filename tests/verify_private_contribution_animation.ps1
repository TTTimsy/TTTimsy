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

if ($generator -notmatch 'id="pixel-far-ridges"') {
  throw 'The far pixel ridge layer is missing.'
}

if ($generator -notmatch 'id="pixel-frame-ridges"') {
  throw 'The frame pixel ridge layer is missing.'
}

if ($generator -notmatch 'id="pixel-river-valley"') {
  throw 'The pixel river valley layer is missing.'
}

if ($generator -notmatch 'id="contribution-spirit-vein"') {
  throw 'The contribution spirit-vein layer is missing.'
}

if ($generator -notmatch 'id="contribution-shrine"') {
  throw 'The contribution shrine layer is missing.'
}

if ($generator -notmatch 'id="spirit-smoke-actors"') {
  throw 'The drifting spirit-smoke layer is missing.'
}

if ($generator -match 'loadFlyingSwordDataUri|data:image/png;base64|sword-dais|sword-flight|flying-sword') {
  throw 'Flying-sword artwork remains in the generator.'
}

if ($generator -match '[\u3400-\u9FFF]') {
  throw 'Visible Chinese characters remain in the animation generator.'
}

if ($generator -match 'shooter|launcher|bullet|bubble|explosion') {
  throw 'Bubble-shooter artwork remains in the generator.'
}

Write-Host 'Private contribution animation workflow checks passed.'
