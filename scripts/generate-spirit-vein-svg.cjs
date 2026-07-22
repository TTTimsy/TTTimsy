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
    inactiveStone: '#3b628e',
    skyCobalt: '#4f78c6',
    skyMoon: '#96d6ea',
    farRock: '#4264a8',
    nearRock: '#14899a',
    ridgeShadow: '#0f3b68',
    ridgeEdge: '#68d3d4',
    riverDeep: '#215aa5',
    riverShadow: '#438cc7',
    riverGlint: '#83e7de',
    mist: '#a5d7e5',
    jadeDim: '#169b78',
    jadeCore: '#18c582',
    jadeBright: '#ecf7c4',
    starfire: '#f6c85f',
    ink: '#0d3862',
  },
  dark: {
    inactiveStone: '#203e70',
    skyCobalt: '#2859b6',
    skyMoon: '#7fc7e6',
    farRock: '#214889',
    nearRock: '#0a788b',
    ridgeShadow: '#061a39',
    ridgeEdge: '#49cbd0',
    riverDeep: '#07316e',
    riverShadow: '#1666a7',
    riverGlint: '#65e1da',
    mist: '#3a75b5',
    jadeDim: '#08755f',
    jadeCore: '#05b878',
    jadeBright: '#d9f6b8',
    starfire: '#ffd166',
    ink: '#0b315b',
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

function evenTile(value, minimum = 2) {
  return Math.max(minimum, Math.round(value / 2) * 2);
}

function steppedPeak({ apexX, apexY, baseY, halfWidth, fill, capFill, depthFill, opacity = 1 }) {
  const blocks = [];
  const height = Math.max(1, baseY - apexY);

  for (let y = apexY, row = 0; y < baseY; y += 6, row += 1) {
    const progress = (y - apexY) / height;
    const currentHalf = Math.max(8, evenTile(halfWidth * (0.24 + progress * 0.76)));
    blocks.push(rectPixel(apexX - currentHalf, y, currentHalf * 2, 6, fill, opacity));

    if (capFill && row % 2 === 1) {
      const capWidth = Math.max(10, evenTile(currentHalf * 0.42));
      blocks.push(rectPixel(apexX - currentHalf, y, capWidth, 2, capFill, 1));
    }
    if (depthFill && row % 2 === 0) {
      const shadowWidth = Math.max(12, currentHalf - 4);
      blocks.push(rectPixel(apexX + 2, y + 4, shadowWidth, 2, depthFill, 1));
    }
  }

  return blocks;
}

function buildFarRidges({ width, horizonY, sceneBottom, theme }) {
  const ridgeBlocks = [
    ...steppedPeak({
      apexX: Math.round(width * 0.5),
      apexY: horizonY + 8,
      baseY: sceneBottom - 6,
      halfWidth: Math.round(width * 0.34),
      fill: theme.farRock,
      capFill: theme.ridgeEdge,
      depthFill: theme.ridgeShadow,
      opacity: 1,
    }),
  ];

  return `<g id="pixel-far-ridges">${ridgeBlocks.join('')}</g>`;
}

function buildFrameRidges({ width, gridBottom, sceneBottom, theme }) {
  const frameBlocks = [
    ...steppedPeak({
      apexX: Math.round(width * 0.11),
      apexY: gridBottom + 10,
      baseY: sceneBottom,
      halfWidth: Math.round(width * 0.12),
      fill: theme.nearRock,
      capFill: theme.ridgeEdge,
      depthFill: theme.ridgeShadow,
      opacity: 1,
    }),
    ...steppedPeak({
      apexX: Math.round(width * 0.89),
      apexY: gridBottom + 10,
      baseY: sceneBottom,
      halfWidth: Math.round(width * 0.12),
      fill: theme.nearRock,
      capFill: theme.ridgeEdge,
      depthFill: theme.ridgeShadow,
      opacity: 1,
    }),
    rectPixel(0, sceneBottom - 10, evenTile(width * 0.18), 8, theme.ridgeShadow, 1),
    rectPixel(Math.round(width * 0.82), sceneBottom - 10, evenTile(width * 0.18), 8, theme.ridgeShadow, 1),
  ];

  return `<g id="pixel-frame-ridges">${frameBlocks.join('')}</g>`;
}

function buildRiverValley({ width, sceneBottom, theme }) {
  const riverTop = sceneBottom - 31;
  const riverBlocks = [
    rectPixel(Math.round(width * 0.17), riverTop, evenTile(width * 0.65), 6, theme.riverDeep, 1),
    rectPixel(Math.round(width * 0.23), riverTop + 6, evenTile(width * 0.54), 6, theme.riverShadow, 1),
    rectPixel(Math.round(width * 0.31), riverTop + 12, evenTile(width * 0.38), 6, theme.riverDeep, 1),
    rectPixel(Math.round(width * 0.28), riverTop + 2, 18, 4, theme.riverGlint, 1),
    rectPixel(Math.round(width * 0.48), riverTop + 8, 26, 4, theme.riverGlint, 1),
    rectPixel(Math.round(width * 0.57), riverTop + 14, 20, 4, theme.riverGlint, 1),
  ];

  return `<g id="pixel-river-valley">${riverBlocks.join('')}</g>`;
}

function buildMistBanks({ width, gridTop, sceneBottom, theme }) {
  const mistY = sceneBottom - 44;
  const banks = [
    [0.12, mistY + 2, 62, 4],
    [0.64, mistY + 7, 58, 4],
  ];

  return `<g id="pixel-mist-banks">${banks
    .map(([xRatio, y, blockWidth, blockHeight]) =>
      rectPixel(Math.round(width * xRatio), y, blockWidth, blockHeight, theme.mist, 1)
    )
    .join('')}</g>`;
}

function buildSkyCurrents({ width, theme }) {
  const currents = [
    { fill: theme.skyCobalt, shelves: [[0.05, 8, 54], [0.11, 12, 72], [0.2, 16, 48]] },
    { fill: theme.skyMoon, shelves: [[0.52, 11, 62], [0.59, 15, 78], [0.69, 19, 46]] },
  ];

  return `<g id="pixel-sky-currents">${currents
    .map(({ fill, shelves }) =>
      `<g class="sky-current">${shelves
        .map(([xRatio, y, blockWidth]) => rectPixel(Math.round(width * xRatio), y, blockWidth, 4, fill, 1))
        .join('')}</g>`
    )
    .join('')}</g>`;
}

function buildStarfire({ width, theme }) {
  const whorl = (x, y) => `<g class="star-whorl">${[
    rectPixel(x, y, 4, 4, theme.starfire, 1),
    rectPixel(x, y - 2, 4, 2, theme.skyMoon, 1),
    rectPixel(x + 4, y, 2, 4, theme.skyMoon, 1),
    rectPixel(x + 2, y + 4, 2, 2, theme.skyMoon, 1),
    rectPixel(x - 2, y + 2, 2, 2, theme.skyMoon, 1),
  ].join('')}</g>`;

  return `<g id="pixel-starfire">${[
    whorl(Math.round(width * 0.41), 7),
    whorl(Math.round(width * 0.47), 22),
    whorl(Math.round(width * 0.9), 7),
  ].join('')}</g>`;
}

function resolveSpiritTier(day) {
  const countTier = day.count >= 20 ? 4 : day.count >= 10 ? 3 : day.count >= 4 ? 2 : 1;
  return Math.max(countTier, Math.max(1, Math.min(4, day.level || 1)));
}

const veinShapeNames = ['', 'sprout', 'seam', 'lode', 'geode'];

function buildContributionShrine({ gridWidth, rowCount, cell, paddingX, gridTop, theme }) {
  const left = Math.max(0, paddingX - 6);
  const right = paddingX + gridWidth + 6;
  const top = Math.max(2, gridTop - 8);
  const bottom = gridTop + rowCount * cell + 4;
  const frameWidth = right - left;
  const blocks = [
    rectPixel(left + 4, top, frameWidth - 8, 4, theme.ridgeShadow, 1),
    rectPixel(left + 8, top + 4, frameWidth - 16, 2, theme.skyMoon, 1),
    rectPixel(left + 4, bottom - 6, frameWidth - 8, 6, theme.ridgeShadow, 1),
    rectPixel(left + 8, bottom - 6, frameWidth - 16, 2, theme.skyMoon, 1),
    rectPixel(left, top + 4, 6, 8, theme.ridgeShadow, 1),
    rectPixel(right - 6, top + 4, 6, 8, theme.ridgeShadow, 1),
    rectPixel(left, bottom - 10, 6, 10, theme.ridgeShadow, 1),
    rectPixel(right - 6, bottom - 10, 6, 10, theme.ridgeShadow, 1),
  ];

  return `<g id="contribution-shrine">${blocks.join('')}</g>`;
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
        cells.push(
          `<g class="spirit-vein-cell" data-date="${escapeXml(day.date)}">${title}${rectPixel(
            cx - 2,
            cy - 1,
            4,
            2,
            theme.inactiveStone,
            1
          )}</g>`
        );
        return;
      }

      const tier = resolveSpiritTier(day);
      const layouts = [null, [cx - 2, cy - 3], [cx - 3, cy - 2], [cx - 4, cy - 2], [cx - 5, cy - 3]];
      const [coreX, coreY] = layouts[tier];
      const fragmentsByTier = {
        1: [
          rectPixel(coreX, coreY, 4, 4, theme.jadeDim, 1),
          rectPixel(coreX + 1, coreY + 4, 2, 2, theme.ridgeShadow, 1),
        ],
        2: [
          rectPixel(coreX, coreY, 6, 4, theme.jadeCore, 1),
          rectPixel(coreX + 2, coreY - 2, 2, 2, theme.jadeBright, 1),
          rectPixel(coreX + 2, coreY + 4, 2, 2, theme.ridgeShadow, 1),
        ],
        3: [
          rectPixel(coreX, coreY, 8, 4, theme.jadeCore, 1),
          rectPixel(coreX + 2, coreY - 2, 4, 2, theme.jadeBright, 1),
          rectPixel(coreX + 2, coreY + 4, 4, 2, theme.jadeBright, 1),
        ],
        4: [
          rectPixel(coreX, coreY, 10, 6, theme.jadeCore, 1),
          rectPixel(coreX + 3, coreY + 1, 4, 4, theme.jadeBright, 1),
          rectPixel(coreX + 4, coreY - 2, 2, 2, theme.starfire, 1),
        ],
      };
      const fragments = fragmentsByTier[tier];

      activeDates.push({ cx, cy, date: day.date, count: day.count, level: tier });
      cells.push(
        `<g class="spirit-vein-cell" data-date="${escapeXml(day.date)}" data-level="${tier}" data-vein-shape="${veinShapeNames[tier]}">${title}${fragments.join('')}</g>`
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
    [-4, 0, 2, 2, theme.jadeDim, 1], [-2, 0, 2, 2, theme.jadeCore, 1],
    [-2, -2, 2, 2, theme.jadeBright, 1], [0, -2, 2, 2, theme.jadeDim, 1],
    [0, -4, 2, 2, theme.jadeCore, 1], [2, -4, 2, 2, theme.jadeBright, 1],
    [2, -6, 2, 2, theme.jadeDim, 1], [4, -6, 2, 2, theme.jadeCore, 1],
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
  const rowCount = Math.max(1, ...data.map((week) => week.length));
  const gridBottom = gridTop + rowCount * cell;
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
  ${buildSkyCurrents({ width, theme })}
  ${buildStarfire({ width, theme })}
  ${buildFarRidges({ width, horizonY: gridBottom + 4, sceneBottom, theme })}
  ${buildFrameRidges({ width, gridBottom, sceneBottom, theme })}
  ${buildRiverValley({ width, sceneBottom, theme })}
  ${buildMistBanks({ width, gridTop, sceneBottom, theme })}
  ${buildContributionShrine({ gridWidth, rowCount, cell, paddingX, gridTop, theme })}
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
