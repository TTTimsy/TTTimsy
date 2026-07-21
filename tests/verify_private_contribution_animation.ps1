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

if ($generator -notmatch 'id="pixel-mountains"') {
  throw 'The pixel mountain layer is missing.'
}

if ($generator -notmatch 'id="sword-dais"') {
  throw 'The sword dais layer is missing.'
}

if ($generator -notmatch 'sword-flight-\$\{index\}') {
  throw 'The sequential flying-sword animation is missing.'
}

if ($generator -notmatch 'data:image/png;base64') {
  throw 'The flying-sword sprite is not embedded in the generated SVG.'
}

if ($generator -match '[\u3400-\u9FFF]') {
  throw 'Visible Chinese characters remain in the animation generator.'
}

if ($generator -match 'shooter|launcher|bullet|bubble|explosion') {
  throw 'Bubble-shooter artwork remains in the generator.'
}

Write-Host 'Private contribution animation workflow checks passed.'
