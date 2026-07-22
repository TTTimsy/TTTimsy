#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const levelNumber = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const themes = {
  light: {
    inactiveStone: '#7b8793',
    farRock: '#a9b4bd',
    nearRock: '#687988',
    ridgeShadow: '#435564',
    riverShadow: '#93b3bd',
    riverGlint: '#e1f0ec',
    mist: '#d6e4e3',
    jadeDim: '#5c937f',
    jadeCore: '#2e7764',
    jadeBright: '#c9e7ac',
    starfire: '#bc8d3f',
    ink: '#354754',
  },
  dark: {
    inactiveStone: '#2b3a48',
    farRock: '#172a42',
    nearRock: '#233b50',
    ridgeShadow: '#101f30',
    riverShadow: '#17394b',
    riverGlint: '#4d8791',
    mist: '#36566a',
    jadeDim: '#246b62',
    jadeCore: '#4aaa89',
    jadeBright: '#c9e7ae',
    starfire: '#dfbd62',
    ink: '#9ab6c2',
  },
};

function resolveUsername() {
  const explicitUsername = process.env.CONTRIBUTION_USERNAME && process.env.CONTRIBUTION_USERNAME.trim();
  const repoOwner = process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.split('/')[0];
  return explicitUsername || repoOwner;
}

function resolveGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_AUTH_TOKEN;
}

function requestContributionWeeks(login, token) {
  return new Promise((resolve, reject) => {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                  contributionLevel
                  date
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    const body = JSON.stringify({ query, variables: { username: login } });
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: '/graphql',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v4+json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'tttimsy-pixel-xianxia',
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`GitHub API returned HTTP ${res.statusCode}`);
            }

            const parsed = JSON.parse(responseBody);
            if (parsed.errors) {
              throw new Error(`GraphQL error: ${JSON.stringify(parsed.errors)}`);
            }

            const weeks = parsed?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
            if (!Array.isArray(weeks)) {
              throw new Error('GitHub API response did not contain contribution weeks.');
            }

            resolve(weeks);
          } catch (error) {
            console.error('Failed to parse GitHub response.');
            console.error(responseBody);
            reject(error);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function normalizeWeeks(weeks) {
  return weeks.map((week) =>
    week.contributionDays.map((day) => ({
      count: day.contributionCount,
      date: day.date,
      level: levelNumber[day.contributionLevel] || 0,
      weekday: day.weekday,
    }))
  );
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rectPixel(x, y, width, height, fill, opacity = 1, extra = '') {
  return `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(width)}" height="${Math.round(height)}" fill="${fill}" opacity="${opacity}"${extra} />`;
}

function steppedPeak({ apexX, apexY, baseY, halfWidth, fill, capFill, opacity = 1 }) {
  const blocks = [];
  const height = Math.max(1, baseY - apexY);

  for (let y = apexY, row = 0; y < baseY; y += 3, row += 1) {
    const progress = (y - apexY) / height;
    const currentHalf = Math.max(2, Math.round(halfWidth * (0.12 + progress * 0.88)));
    blocks.push(rectPixel(apexX - currentHalf, y, currentHalf * 2, 3, fill, opacity));

    if (capFill && row % 4 === 1) {
      const capWidth = Math.max(2, Math.round(currentHalf * 0.32));
      blocks.push(rectPixel(apexX - currentHalf, y, capWidth, 1, capFill, opacity * 0.72));
    }
  }

  return blocks;
}

function buildFarRidges({ width, horizonY, sceneBottom, theme }) {
  const ridgeBlocks = [
    ...steppedPeak({
      apexX: Math.round(width * 0.14),
      apexY: horizonY + 12,
      baseY: sceneBottom - 6,
      halfWidth: Math.round(width * 0.18),
      fill: theme.farRock,
      capFill: theme.ink,
      opacity: 0.63,
    }),
    ...steppedPeak({
      apexX: Math.round(width * 0.39),
      apexY: horizonY + 21,
      baseY: sceneBottom - 7,
      halfWidth: Math.round(width * 0.15),
      fill: theme.farRock,
      capFill: theme.ink,
      opacity: 0.54,
    }),
    ...steppedPeak({
      apexX: Math.round(width * 0.67),
      apexY: horizonY + 17,
      baseY: sceneBottom - 5,
      halfWidth: Math.round(width * 0.16),
      fill: theme.farRock,
      capFill: theme.ink,
      opacity: 0.58,
    }),
    ...steppedPeak({
      apexX: Math.round(width * 0.89),
      apexY: horizonY + 8,
      baseY: sceneBottom - 5,
      halfWidth: Math.round(width * 0.2),
      fill: theme.farRock,
      capFill: theme.ink,
      opacity: 0.66,
    }),
  ];

  return `<g id="pixel-far-ridges">${ridgeBlocks.join('')}</g>`;
}

function buildFrameRidges({ width, gridTop, sceneBottom, theme }) {
  const frameBlocks = [
    ...steppedPeak({
      apexX: Math.round(width * 0.11),
      apexY: gridTop + 12,
      baseY: sceneBottom,
      halfWidth: Math.round(width * 0.14),
      fill: theme.nearRock,
      capFill: theme.ridgeShadow,
      opacity: 0.76,
    }),
    ...steppedPeak({
      apexX: Math.round(width * 0.91),
      apexY: gridTop + 18,
      baseY: sceneBottom,
      halfWidth: Math.round(width * 0.15),
      fill: theme.nearRock,
      capFill: theme.ridgeShadow,
      opacity: 0.8,
    }),
    rectPixel(0, sceneBottom - 10, Math.round(width * 0.21), 8, theme.ridgeShadow, 0.78),
    rectPixel(Math.round(width * 0.79), sceneBottom - 10, Math.round(width * 0.21), 8, theme.ridgeShadow, 0.78),
  ];

  const treeBases = [
    [Math.round(width * 0.04), sceneBottom - 24],
    [Math.round(width * 0.18), sceneBottom - 19],
    [Math.round(width * 0.82), sceneBottom - 22],
    [Math.round(width * 0.96), sceneBottom - 26],
  ];
  treeBases.forEach(([x, y]) => {
    frameBlocks.push(
      rectPixel(x, y, 2, 10, theme.ridgeShadow, 0.88),
      rectPixel(x - 3, y + 2, 8, 2, theme.nearRock, 0.94),
      rectPixel(x - 2, y - 2, 6, 3, theme.nearRock, 0.94)
    );
  });

  return `<g id="pixel-frame-ridges">${frameBlocks.join('')}</g>`;
}

function buildRiverValley({ width, sceneBottom, theme }) {
  const riverTop = sceneBottom - 31;
  const riverBlocks = [
    rectPixel(Math.round(width * 0.19), riverTop, Math.round(width * 0.61), 5, theme.riverShadow, 0.7),
    rectPixel(Math.round(width * 0.25), riverTop + 5, Math.round(width * 0.51), 7, theme.riverShadow, 0.78),
    rectPixel(Math.round(width * 0.31), riverTop + 12, Math.round(width * 0.39), 6, theme.riverShadow, 0.66),
    rectPixel(Math.round(width * 0.37), riverTop + 18, Math.round(width * 0.28), 4, theme.riverShadow, 0.56),
  ];
  const glintOffsets = [
    [0.27, 2, 11], [0.36, 8, 6], [0.47, 4, 15], [0.58, 14, 8], [0.69, 9, 12], [0.43, 20, 5],
  ];
  glintOffsets.forEach(([xRatio, yOffset, glintWidth], index) => {
    riverBlocks.push(
      rectPixel(Math.round(width * xRatio), riverTop + yOffset, glintWidth, 1, theme.riverGlint, index % 2 ? 0.54 : 0.7)
    );
  });

  return `<g id="pixel-river-valley">${riverBlocks.join('')}</g>`;
}

function buildMistBanks({ width, gridTop, sceneBottom, theme }) {
  const mistY = sceneBottom - 44;
  const banks = [
    [0.07, mistY + 4, 24, 2], [0.16, mistY, 38, 2], [0.28, mistY + 5, 31, 2],
    [0.49, mistY + 2, 46, 2], [0.66, mistY + 6, 29, 2], [0.78, mistY + 1, 43, 2],
    [0.02, gridTop + 9, 16, 1], [0.88, gridTop + 14, 18, 1],
  ];

  return `<g id="pixel-mist-banks">${banks
    .map(([xRatio, y, blockWidth, blockHeight], index) =>
      rectPixel(Math.round(width * xRatio), y, blockWidth, blockHeight, theme.mist, index < 6 ? 0.28 : 0.2)
    )
    .join('')}</g>`;
}

function buildStarfire({ width, theme }) {
  const stars = [
    [0.08, 10], [0.21, 16], [0.32, 8], [0.48, 14], [0.59, 7], [0.73, 18], [0.86, 11], [0.95, 23],
  ];

  return `<g id="pixel-starfire">${stars
    .map(([xRatio, y], index) => rectPixel(Math.round(width * xRatio), y, index % 3 === 0 ? 2 : 1, 1, theme.starfire, 0.46))
    .join('')}</g>`;
}

function buildContributionSpiritVeins({ data, cell, paddingX, gridTop, theme }) {
  const activeDates = [];
  const cells = [];

  data.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      const x = paddingX + weekIndex * cell;
      const y = gridTop + dayIndex * cell;
      const cx = x + Math.floor(cell / 2);
      const cy = y + Math.floor(cell / 2);
      const title = `<title>${escapeXml(`${day.date}: ${day.count} contributions`)}</title>`;

      if (!day.count) {
        const shardX = cx - 2 + ((weekIndex + dayIndex) % 3);
        const shardY = cy - 1 + ((weekIndex * 2 + dayIndex) % 2);
        const shards = [rectPixel(shardX, shardY, 2, 1, theme.inactiveStone, 0.38)];
        if ((weekIndex * 5 + dayIndex) % 5 === 0) {
          shards.push(rectPixel(shardX + 3, shardY + 1, 1, 1, theme.inactiveStone, 0.24));
        }
        cells.push(`<g class="spirit-vein-cell" data-date="${escapeXml(day.date)}">${title}${shards.join('')}</g>`);
        return;
      }

      const tier = Math.max(1, Math.min(4, day.level || 1));
      const coreSize = tier >= 4 ? 5 : tier >= 2 ? 4 : 3;
      const coreX = cx - Math.floor(coreSize / 2);
      const coreY = cy - Math.floor(coreSize / 2);
      const fragments = [
        rectPixel(coreX, coreY, coreSize, coreSize, theme.jadeCore, 0.96),
        rectPixel(coreX - 3, coreY + coreSize - 1, 3, 1, theme.jadeDim, 0.82),
        rectPixel(coreX + coreSize, coreY - 2, 1, 3, theme.jadeDim, 0.76),
      ];

      if (tier >= 2) {
        fragments.push(
          rectPixel(coreX - 5, coreY + coreSize, 3, 1, theme.jadeDim, 0.72),
          rectPixel(coreX + coreSize + 1, coreY - 4, 1, 2, theme.jadeBright, 0.62)
        );
      }
      if (tier >= 3) {
        fragments.push(
          rectPixel(coreX + 1, coreY - 4, 1, 2, theme.jadeBright, 0.82),
          rectPixel(coreX - 2, coreY + coreSize + 1, 2, 1, theme.jadeDim, 0.7)
        );
      }
      if (tier === 4) {
        fragments.push(
          rectPixel(cx - 1, cy - 1, 2, 2, theme.jadeBright, 0.96),
          rectPixel(coreX + coreSize + 3, coreY - 4, 1, 1, theme.starfire, 0.84)
        );
      }

      activeDates.push({ cx, cy, date: day.date, count: day.count, level: tier });
      cells.push(
        `<g class="spirit-vein-cell" data-date="${escapeXml(day.date)}" data-level="${tier}">${title}${fragments.join('')}</g>`
      );
    });
  });

  return { activeDates, markup: `<g id="contribution-spirit-vein">${cells.join('')}</g>` };
}

function buildSpiritSmoke({ activeDates, theme }) {
  const actorCount = Math.min(11, activeDates.length);
  const actorDuration = 2.05;
  const cycleDuration = Math.max(7.8, actorCount * 0.28 + 3.3).toFixed(2);
  const smokePixels = [
    [-5, 1, 2, 1, theme.jadeDim, 0.7], [-3, -2, 1, 3, theme.jadeCore, 0.86],
    [-1, 2, 2, 2, theme.jadeBright, 0.8], [1, -4, 1, 2, theme.jadeDim, 0.72],
    [3, -1, 2, 1, theme.jadeCore, 0.78], [4, 2, 1, 2, theme.jadeBright, 0.66],
    [0, -6, 1, 1, theme.starfire, 0.72], [-6, -2, 1, 1, theme.jadeDim, 0.62],
  ];

  const actors = Array.from({ length: actorCount }, (_, index) => {
    const source = activeDates[index % activeDates.length];
    let destinationIndex = (index * 3 + 1) % activeDates.length;
    if (activeDates.length > 1 && destinationIndex === index % activeDates.length) {
      destinationIndex = (destinationIndex + 1) % activeDates.length;
    }
    const destination = activeDates[destinationIndex];
    const plumeX = source.cx + 8 + (index % 4) * 3 - (index % 2 ? 2 : 0);
    const plumeY = source.cy - 10 - (index % 3) * 3;
    const begin = (0.28 + index * 0.28).toFixed(2);
    const liftId = `smoke-lift-${index}`;

    return `
    <g id="smoke-actor-${index}" data-source-date="${escapeXml(source.date)}" data-destination-date="${escapeXml(destination.date)}" transform="translate(${source.cx} ${source.cy})" opacity="0">
      <animateTransform id="${liftId}" attributeName="transform" type="translate" from="${source.cx} ${source.cy}" to="${plumeX} ${plumeY}" begin="cycle.begin+${begin}s" dur="1.45s" fill="freeze" />
      <animateTransform attributeName="transform" type="translate" from="${plumeX} ${plumeY}" to="${destination.cx} ${destination.cy}" begin="${liftId}.end" dur="0.01s" fill="freeze" />
      <animate attributeName="opacity" values="0;1;1;0;0;1;0" keyTimes="0;0.05;0.48;0.7;0.76;0.82;1" begin="cycle.begin+${begin}s" dur="${actorDuration}s" fill="freeze" />
      ${smokePixels
        .map(([x, y, pixelWidth, pixelHeight, fill, opacity]) =>
          rectPixel(x, y, pixelWidth, pixelHeight, fill, opacity, ' class="smoke-micro-pixel"')
        )
        .join('')}
    </g>`;
  });

  return { cycleDuration, markup: `<g id="spirit-smoke-actors">${actors.join('')}</g>` };
}

function buildAnimatedSvg({ data, themeName, profileName = 'GitHub user' }) {
  const theme = themes[themeName];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeName}`);
  }

  const cell = 14;
  const paddingX = 14;
  const gridTop = 26;
  const gridWidth = Math.max(cell, data.length * cell);
  const width = Math.max(280, gridWidth + paddingX * 2);
  const height = 178;
  const sceneBottom = height - 6;
  const contributionScene = buildContributionSpiritVeins({ data, cell, paddingX, gridTop, theme });
  const smokeScene = buildSpiritSmoke({ activeDates: contributionScene.activeDates, theme });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(profileName)} pixel spiritual-vein contribution landscape" shape-rendering="crispEdges">
  <title>${escapeXml(profileName)} pixel spiritual-vein contribution landscape</title>
  <desc>Animated hard-edge pixel landscape where contribution activity becomes jade spiritual veins and drifting energy.</desc>
  <rect id="cycle-timer" x="-1" y="-1" width="1" height="1" fill="none" opacity="0">
    <animate id="cycle" attributeName="x" from="-1" to="0" begin="0s;cycle.end+1.2s" dur="${smokeScene.cycleDuration}s" fill="freeze" />
  </rect>
  ${buildStarfire({ width, theme })}
  ${buildFarRidges({ width, horizonY: gridTop + 64, sceneBottom, theme })}
  ${buildFrameRidges({ width, gridTop, sceneBottom, theme })}
  ${buildRiverValley({ width, sceneBottom, theme })}
  ${buildMistBanks({ width, gridTop, sceneBottom, theme })}
  ${contributionScene.markup}
  ${smokeScene.markup}
</svg>
`;
}

async function main() {
  const username = resolveUsername();
  const githubToken = resolveGitHubToken();

  if (!githubToken) {
    console.error('GITHUB_TOKEN, GH_TOKEN, or GITHUB_AUTH_TOKEN is required.');
    process.exit(1);
  }

  if (!username) {
    console.error('Unable to resolve username. Set CONTRIBUTION_USERNAME or GITHUB_REPOSITORY.');
    process.exit(1);
  }

  console.log(`Generating Terraria spirit-vein contribution animation for ${username}`);
  const weeks = await requestContributionWeeks(username, githubToken);
  const data = normalizeWeeks(weeks);

  const outputs = [
    [`${username}-contribution-animation.svg`, buildAnimatedSvg({ data, themeName: 'light', profileName: username })],
    [`${username}-contribution-animation-dark.svg`, buildAnimatedSvg({ data, themeName: 'dark', profileName: username })],
  ];

  outputs.forEach(([filename, content]) => {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`Wrote ${filename}`);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { buildAnimatedSvg, normalizeWeeks };
