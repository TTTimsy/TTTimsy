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
    paper: '#f7f2e8',
    paperShade: '#eadfcd',
    empty: '#c7c6bd',
    levels: ['#c7c6bd', '#9bb8aa', '#6f9a8d', '#c4a566', '#efe0a8'],
    mountainFar: '#9bad9d',
    mountainNear: '#5f786e',
    mist: '#fffaf0',
    river: '#9ec7c4',
    riverLight: '#eaf8ec',
    lamp: '#85aa98',
    lampBright: '#f4e8ba',
    lotus: '#d5b77d',
    spirit: '#f7f1d4',
    ink: '#44544e',
  },
  dark: {
    paper: '#111a27',
    paperShade: '#182536',
    empty: '#334353',
    levels: ['#334353', '#47746d', '#5c9a88', '#b5965a', '#f0d99b'],
    mountainFar: '#213d4b',
    mountainNear: '#2f5b5d',
    mist: '#9eb8c8',
    river: '#467d82',
    riverLight: '#b7e0d0',
    lamp: '#73ad9d',
    lampBright: '#f2dca0',
    lotus: '#caa96d',
    spirit: '#fbf0c8',
    ink: '#c7d6d4',
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
          'User-Agent': 'tttimsy-spirit-vein-landscape',
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

function buildAnimatedSvg({ data, themeName, profileName = 'GitHub user' }) {
  const theme = themes[themeName];
  const cell = 15;
  const paddingX = 14;
  const gridTop = 44;
  const gridHeight = 7 * cell;
  const gridWidth = Math.max(cell, data.length * cell);
  const width = gridWidth + paddingX * 2;
  const riverY = gridTop + gridHeight + 31;
  const height = riverY + 34;
  const activeDates = [];
  const lamps = [];

  data.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      const cx = paddingX + weekIndex * cell + cell / 2;
      const cy = gridTop + dayIndex * cell + cell / 2;
      const active = day.count > 0;
      const fill = active ? theme.levels[day.level] || theme.lamp : theme.empty;
      const radius = active ? 4.1 : 2.65;
      const index = active && activeDates.length < 120 ? activeDates.length : -1;

      if (index >= 0) {
        activeDates.push({ cx, cy, date: day.date, count: day.count, level: day.level, index });
      }

      lamps.push(`
      <g class="contribution-lamp">
        <circle cx="${cx}" cy="${cy}" r="${radius + (active ? 1.8 : 0)}" fill="${active ? theme.lamp : theme.empty}" opacity="${active ? '0.18' : '0.28'}" />
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="${active ? theme.lampBright : theme.paperShade}" stroke-width="${active ? '0.8' : '0.45'}" opacity="${active ? '0.96' : '0.62'}">
          <title>${escapeXml(`${day.date}: ${day.count} contributions`)}</title>
        </circle>
      </g>`);
    });
  });

  const stepDuration = 0.5;
  const stepGap = 0.34;
  const cycleDuration = Math.max(8, activeDates.length * stepGap + stepDuration + 1.2).toFixed(2);
  const mountainBase = riverY + 5;
  const farPeak = mountainBase - 58;
  const nearPeak = mountainBase - 38;

  const spiritSteps = activeDates
    .map((target, index) => {
      const begin = (index * stepGap).toFixed(2);
      const sourceX = Math.max(paddingX + 3, target.cx - 25);
      const sourceY = riverY - 3;
      return `
      <g class="spirit-visit">
        <circle cx="${sourceX}" cy="${sourceY}" r="2.8" fill="${theme.spirit}" opacity="0">
          <set attributeName="opacity" to="1" begin="cycle.begin+${begin}s" />
          <animate id="spirit-step-${index}" attributeName="cx" from="${sourceX}" to="${target.cx}" begin="cycle.begin+${begin}s" dur="${stepDuration}s" fill="freeze" />
          <animate attributeName="cy" from="${sourceY}" to="${target.cy}" begin="cycle.begin+${begin}s" dur="${stepDuration}s" fill="freeze" />
          <set attributeName="opacity" to="0" begin="spirit-step-${index}.end+0.08s" />
        </circle>
        <circle id="lotus-ripple-${index}" cx="${target.cx}" cy="${target.cy}" r="1.4" fill="none" stroke="${theme.lotus}" stroke-width="1.15" opacity="0">
          <set attributeName="opacity" to="0.9" begin="spirit-step-${index}.end" />
          <animate attributeName="r" values="1.4;7.2;9.4" begin="spirit-step-${index}.end" dur="0.72s" fill="freeze" />
          <animate attributeName="opacity" values="0.9;0.35;0" begin="spirit-step-${index}.end" dur="0.72s" fill="freeze" />
        </circle>
        <g opacity="0">
          <set attributeName="opacity" to="0.9" begin="spirit-step-${index}.end" />
          <set attributeName="opacity" to="0" begin="spirit-step-${index}.end+0.62s" />
          <ellipse cx="${target.cx}" cy="${target.cy - 4.2}" rx="1.8" ry="3.5" fill="${theme.lotus}" />
          <ellipse cx="${target.cx + 4.2}" cy="${target.cy}" rx="3.5" ry="1.8" fill="${theme.lotus}" />
          <ellipse cx="${target.cx}" cy="${target.cy + 4.2}" rx="1.8" ry="3.5" fill="${theme.lotus}" />
          <ellipse cx="${target.cx - 4.2}" cy="${target.cy}" rx="3.5" ry="1.8" fill="${theme.lotus}" />
        </g>
      </g>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(profileName)} spirit-vein contribution landscape">
  <title>${escapeXml(profileName)} spirit-vein contribution landscape</title>
  <desc>Animated Chinese-fantasy spirit-vein landscape based on GitHub contribution data.</desc>
  <defs>
    <linearGradient id="paper-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.paper}" />
      <stop offset="100%" stop-color="${theme.paperShade}" />
    </linearGradient>
    <linearGradient id="river-gradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.river}" stop-opacity="0.16" />
      <stop offset="50%" stop-color="${theme.riverLight}" stop-opacity="0.78" />
      <stop offset="100%" stop-color="${theme.river}" stop-opacity="0.16" />
    </linearGradient>
    <linearGradient id="mist-gradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.mist}" stop-opacity="0" />
      <stop offset="50%" stop-color="${theme.mist}" stop-opacity="0.42" />
      <stop offset="100%" stop-color="${theme.mist}" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paper-gradient)" rx="10" />
  <rect id="cycleTimer" x="-10" y="-10" width="1" height="1" fill="none">
    <animate id="cycle" attributeName="x" from="-10" to="-9" begin="0s;cycle.end+1.2s" dur="${cycleDuration}s" fill="freeze" />
  </rect>
  <g id="ink-mountains" opacity="0.34">
    <path d="M0 ${mountainBase} C ${width * 0.11} ${farPeak}, ${width * 0.2} ${mountainBase - 23}, ${width * 0.32} ${farPeak + 7} C ${width * 0.48} ${mountainBase - 16}, ${width * 0.62} ${farPeak - 8}, ${width * 0.78} ${mountainBase - 22} C ${width * 0.88} ${farPeak + 12}, ${width * 0.95} ${mountainBase - 25}, ${width} ${farPeak + 4} L ${width} ${height} L 0 ${height} Z" fill="${theme.mountainFar}" />
    <path d="M0 ${mountainBase + 9} C ${width * 0.14} ${nearPeak + 20}, ${width * 0.25} ${nearPeak - 6}, ${width * 0.4} ${mountainBase + 2} C ${width * 0.54} ${nearPeak + 8}, ${width * 0.7} ${nearPeak - 13}, ${width * 0.86} ${mountainBase + 5} C ${width * 0.94} ${nearPeak - 5}, ${width * 0.98} ${nearPeak + 12}, ${width} ${nearPeak + 4} L ${width} ${height} L 0 ${height} Z" fill="${theme.mountainNear}" />
    <path d="M0 ${mountainBase + 17} C ${width * 0.18} ${mountainBase - 4}, ${width * 0.34} ${mountainBase + 9}, ${width * 0.52} ${mountainBase - 1} C ${width * 0.67} ${mountainBase + 13}, ${width * 0.84} ${mountainBase - 6}, ${width} ${mountainBase + 10} L ${width} ${height} L 0 ${height} Z" fill="${theme.mountainNear}" opacity="0.58" />
  </g>
  <g id="spirit-river">
    <path d="M0 ${riverY} C ${width * 0.22} ${riverY - 7}, ${width * 0.39} ${riverY + 8}, ${width * 0.58} ${riverY - 3} C ${width * 0.76} ${riverY - 11}, ${width * 0.9} ${riverY + 5}, ${width} ${riverY - 2}" fill="none" stroke="${theme.river}" stroke-width="3.2" stroke-linecap="round" opacity="0.68" />
    <path d="M0 ${riverY} C ${width * 0.22} ${riverY - 7}, ${width * 0.39} ${riverY + 8}, ${width * 0.58} ${riverY - 3} C ${width * 0.76} ${riverY - 11}, ${width * 0.9} ${riverY + 5}, ${width} ${riverY - 2}" fill="none" stroke="url(#river-gradient)" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="32 180">
      <animate attributeName="stroke-dashoffset" values="220;0" dur="8s" repeatCount="indefinite" />
    </path>
  </g>
  <g id="contribution-lamps">
    ${lamps.join('')}
  </g>
  <g id="spirit-light">
    ${spiritSteps}
  </g>
  <g id="drifting-mist" opacity="0.5">
    <path d="M${width * 0.04} ${gridTop - 13} C ${width * 0.22} ${gridTop - 26}, ${width * 0.36} ${gridTop - 2}, ${width * 0.56} ${gridTop - 14} C ${width * 0.72} ${gridTop - 25}, ${width * 0.86} ${gridTop - 6}, ${width * 0.98} ${gridTop - 16}" fill="none" stroke="url(#mist-gradient)" stroke-width="11" stroke-linecap="round">
      <animateTransform attributeName="transform" type="translate" values="-18 0;18 0;-18 0" dur="18s" repeatCount="indefinite" />
    </path>
  </g>
  <text x="${paddingX}" y="${height - 11}" fill="${theme.ink}" font-size="8" letter-spacing="2" opacity="0.78">灵 脉 · CONTRIBUTIONS</text>
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

  console.log(`Generating spirit-vein landscape for ${username}`);
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
