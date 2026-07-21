#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');

const levelNumber = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const themes = {
  light: {
    empty: '#d0d7de',
    levels: ['#d0d7de', '#8fb7a4', '#4f927d', '#b88943', '#e7c96b'],
    mountainFar: '#8d99a6',
    mountainNear: '#596777',
    cloud: '#eef3f6',
    star: '#c79a4a',
    jade: '#4f927d',
    flame: '#e7c96b',
    ink: '#374151',
  },
  dark: {
    empty: '#161b22',
    levels: ['#161b22', '#245b56', '#2e8b78', '#b88335', '#f0cf72'],
    mountainFar: '#172e48',
    mountainNear: '#203b5b',
    cloud: '#304967',
    star: '#c89b48',
    jade: '#65c6a8',
    flame: '#f0cf72',
    ink: '#9db8d2',
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

function loadFlyingSwordDataUri() {
  const spritePath = path.join(__dirname, '..', 'assets', 'pixel-xianxia-flying-sword.png');
  return `data:image/png;base64,${fs.readFileSync(spritePath).toString('base64')}`;
}

function buildAnimatedSvg({ data, themeName, profileName = 'GitHub user' }) {
  const theme = themes[themeName];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeName}`);
  }

  const cell = 14;
  const paddingX = 14;
  const gridTop = 28;
  const gridHeight = 7 * cell;
  const gridWidth = Math.max(cell, data.length * cell);
  const width = gridWidth + paddingX * 2;
  const sceneBottom = gridTop + gridHeight + 50;
  const height = sceneBottom + 4;
  const daisX = paddingX + 11;
  const daisY = sceneBottom - 11;
  const maxSwordVisits = 72;
  const flightDuration = 0.38;
  const activeDates = [];
  const rectPixel = (x, y, pixelWidth, pixelHeight, fill, opacity = 1) =>
    `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(pixelWidth)}" height="${Math.round(pixelHeight)}" fill="${fill}" opacity="${opacity}" />`;

  const cells = [];
  data.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      const x = paddingX + weekIndex * cell;
      const y = gridTop + dayIndex * cell;
      const active = day.count > 0;
      const inset = active ? 1 : 4;
      const size = active ? cell - 2 : cell - 8;
      const fill = active ? theme.levels[day.level] || theme.jade : theme.empty;
      const opacity = active ? '0.96' : '0.28';

      if (active && activeDates.length < maxSwordVisits) {
        activeDates.push({
          cx: x + cell / 2,
          cy: y + cell / 2,
          date: day.date,
          count: day.count,
          level: day.level,
        });
      }

      cells.push(`
      <rect x="${x + inset}" y="${y + inset}" width="${size}" height="${size}" fill="${fill}" opacity="${opacity}">
        <title>${escapeXml(`${day.date}: ${day.count} contributions`)}</title>
      </rect>`);
    });
  });

  const mountainBlocks = [
    [0, sceneBottom - 25, Math.max(28, Math.floor(width * 0.18)), 25, theme.mountainFar],
    [Math.floor(width * 0.14), sceneBottom - 38, Math.max(35, Math.floor(width * 0.2)), 38, theme.mountainFar],
    [Math.floor(width * 0.3), sceneBottom - 20, Math.max(42, Math.floor(width * 0.28)), 20, theme.mountainNear],
    [Math.floor(width * 0.52), sceneBottom - 45, Math.max(40, Math.floor(width * 0.2)), 45, theme.mountainNear],
    [Math.floor(width * 0.75), sceneBottom - 29, Math.max(30, width - Math.floor(width * 0.75)), 29, theme.mountainFar],
  ];
  const cloudBlocks = [
    [paddingX + 4, 11, 27, 3],
    [paddingX + 17, 8, 16, 3],
    [Math.max(paddingX + 42, width - 82), 15, 34, 3],
    [Math.max(paddingX + 54, width - 67), 12, 19, 3],
  ];
  const mountains = `<g id="pixel-mountains" opacity="0.8">${mountainBlocks
    .map(([x, y, pixelWidth, pixelHeight, fill]) => rectPixel(x, y, pixelWidth, pixelHeight, fill))
    .join('')}</g>`;
  const cloudBanks = `<g id="pixel-cloud-banks" opacity="0.42">${cloudBlocks
    .map(([x, y, pixelWidth, pixelHeight]) => rectPixel(x, y, pixelWidth, pixelHeight, theme.cloud))
    .join('')}</g>`;
  const swordDais = `<g id="sword-dais">${[
    [daisX - 8, daisY + 5, 17, 3, theme.mountainNear],
    [daisX - 4, daisY + 2, 9, 3, theme.ink],
    [daisX - 1, daisY - 3, 3, 5, theme.jade],
  ]
    .map(([x, y, pixelWidth, pixelHeight, fill]) => rectPixel(x, y, pixelWidth, pixelHeight, fill))
    .join('')}</g>`;
  const swordDataUri = loadFlyingSwordDataUri();
  const swordFlights = activeDates
    .map((target, index) => {
      const source = index === 0 ? { cx: daisX, cy: daisY } : activeDates[index - 1];
      const begin = index === 0 ? 'cycle.begin+0.18s' : `sword-flight-${index - 1}.end+0.14s`;
      const flightId = `sword-flight-${index}`;
      const flareId = `starfire-flare-${index}`;
      const flarePixels = [
        [target.cx - 1, target.cy - 5, 2, 3, theme.flame],
        [target.cx + 3, target.cy - 1, 3, 2, theme.jade],
        [target.cx - 5, target.cy - 1, 3, 2, theme.jade],
        [target.cx - 1, target.cy + 3, 2, 3, theme.flame],
        [target.cx - 1, target.cy - 1, 3, 3, theme.star],
      ];

      return `
      <g class="sword-flight" opacity="0">
        <set attributeName="opacity" to="1" begin="${begin}" />
        <set attributeName="opacity" to="0" begin="${flightId}.end+0.26s" />
        <g>
          <animateTransform id="${flightId}" attributeName="transform" type="translate" from="${source.cx} ${source.cy}" to="${target.cx} ${target.cy}" begin="${begin}" dur="${flightDuration}s" fill="freeze" />
          ${rectPixel(-24, -3, 7, 2, theme.jade, 0.76)}
          ${rectPixel(-18, 1, 5, 2, theme.flame, 0.84)}
          ${rectPixel(-12, -1, 4, 2, theme.star, 0.92)}
          <image class="flying-sword" href="${swordDataUri}" x="-18" y="-18" width="36" height="36" image-rendering="pixelated" />
        </g>
      </g>
      <g id="${flareId}" opacity="0">
        <set attributeName="opacity" to="1" begin="${flightId}.end" />
        <set attributeName="opacity" to="0" begin="${flightId}.end+0.32s" />
        ${flarePixels
          .map(([x, y, pixelWidth, pixelHeight, fill]) => rectPixel(x, y, pixelWidth, pixelHeight, fill))
          .join('')}
      </g>`;
    })
    .join('');
  const cycleDuration = Math.max(7, activeDates.length * (flightDuration + 0.14) + 1.8).toFixed(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(profileName)} pixel xianxia contribution animation" shape-rendering="crispEdges">
  <title>${escapeXml(profileName)} pixel xianxia contribution animation</title>
  <desc>Animated pixel fantasy contribution calendar with a flying sword visiting active dates.</desc>
  <rect id="cycle-timer" x="-1" y="-1" width="1" height="1" fill="none" opacity="0">
    <animate id="cycle" attributeName="x" from="-1" to="0" begin="0s;cycle.end+1.2s" dur="${cycleDuration}s" fill="freeze" />
  </rect>
  ${cloudBanks}
  ${mountains}
  <g id="contribution-starfire">
    ${cells.join('')}
  </g>
  ${swordDais}
  <g id="sword-flights">
    ${swordFlights}
  </g>
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

  console.log(`Generating pixel xianxia contribution animation for ${username}`);
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
