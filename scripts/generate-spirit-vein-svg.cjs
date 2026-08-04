#!/usr/bin/env node

const fs = require('fs');
const { ARTWORKS } = require('./baroque-artworks.cjs');
const { buildBaroqueMosaic, escapeXml, loadArtworkPixelArt } = require('./calling-of-saint-matthew-pixels.cjs');

function resolveUsername() { return (process.env.CONTRIBUTION_USERNAME && process.env.CONTRIBUTION_USERNAME.trim()) || (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.split('/')[0]) || 'TTTimsy'; }

function buildAnimatedSvg({ themeName, profileName = 'GitHub user' }) {
  if (!['light', 'dark'].includes(themeName)) throw new Error(`Unknown theme: ${themeName}`);
  const mosaic = buildBaroqueMosaic({ artworks: ARTWORKS, artworkPixels: loadArtworkPixelArt(ARTWORKS) });
  const label = `${profileName} Baroque pixel carousel`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="100%" viewBox="0 0 159 21" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(label)}" shape-rendering="crispEdges"><title>${escapeXml(label)}</title><desc>Four Baroque paintings overwrite one another in a repeating pixel animation.</desc>${mosaic}</svg>\n`;
}

function main() {
  const username = resolveUsername();
  for (const [filename, themeName] of [[`${username}-contribution-animation.svg`, 'light'], [`${username}-contribution-animation-dark.svg`, 'dark']]) {
    fs.writeFileSync(filename, buildAnimatedSvg({ themeName, profileName: username }), 'utf8');
    console.log(`Wrote ${filename}`);
  }
}

if (require.main === module) main();

module.exports = { buildAnimatedSvg, resolveUsername };
