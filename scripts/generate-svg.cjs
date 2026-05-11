#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const explicitUsername = process.env.CONTRIBUTION_USERNAME && process.env.CONTRIBUTION_USERNAME.trim();
const repoOwner = process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.split('/')[0];
const username = explicitUsername || repoOwner;
const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_AUTH_TOKEN;

if (!githubToken) {
  console.error('GITHUB_TOKEN, GH_TOKEN, or GITHUB_AUTH_TOKEN is required.');
  process.exit(1);
}

if (!username) {
  console.error('Unable to resolve username. Set CONTRIBUTION_USERNAME or GITHUB_REPOSITORY.');
  process.exit(1);
}

function requestContributionWeeks(login) {
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
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v4+json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'tttimsy-contribution-animation',
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

const levelNumber = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const themes = {
  light: {
    empty: '#fff8dc',
    levels: ['#fff8dc', '#fff1a8', '#f7d774', '#e6b84f', '#d4a72c'],
    shooter: '#d4a72c',
    bullet: '#ffd966',
    explosion: '#f2b84b',
    sparkle: '#fff1a8',
    text: '#8a6419',
  },
  dark: {
    empty: '#161b22',
    levels: ['#161b22', '#5f4b18', '#9d7a24', '#d4a72c', '#ffd966'],
    shooter: '#ffd966',
    bullet: '#fff1a8',
    explosion: '#f7d774',
    sparkle: '#ffe898',
    text: '#ffe898',
  },
};

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

function buildAnimatedSvg({ data, themeName }) {
  const theme = themes[themeName];
  const cell = 15;
  const radius = 5.2;
  const gap = 2;
  const gridWidth = data.length * cell;
  const gridHeight = 7 * cell;
  const shooterX = gridWidth / 2;
  const shooterY = gridHeight + 34;
  const viewHeight = shooterY + 18;
  const targets = [];
  const circles = [];

  data.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      const cx = weekIndex * cell + cell / 2;
      const cy = dayIndex * cell + cell / 2;
      const fill = theme.levels[day.level] || theme.empty;
      const target = day.count > 0 && targets.length < 230;
      const targetIndex = target ? targets.length : -1;

      if (target) {
        targets.push({ cx, cy, date: day.date, count: day.count, level: day.level });
      }

      const anim = target
        ? `
        <animate attributeName="r" values="${radius};${(radius * 1.5).toFixed(2)};${radius}" begin="shot-${targetIndex}.end" dur="0.28s" fill="freeze" />
        <animate attributeName="fill" values="${fill};${theme.sparkle};${theme.empty}" begin="shot-${targetIndex}.end" dur="0.32s" fill="freeze" />
        <animate attributeName="opacity" values="1;0.35;1" begin="cycle.begin;shot-${targetIndex}.end+0.34s" dur="0.25s" fill="freeze" />`
        : '';

      circles.push(`
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" opacity="0.96">
        <title>${escapeXml(`${day.date}: ${day.count} contributions`)}</title>${anim}
      </circle>`);
    });
  });

  const shotDuration = 0.52;
  const gapDuration = 0.16;
  const totalDuration = Math.max(4, targets.length * (shotDuration + gapDuration) + 1.2).toFixed(2);

  const bullets = targets
    .map((target, index) => {
      const begin = (index * (shotDuration + gapDuration)).toFixed(2);
      return `
      <circle cx="${shooterX}" cy="${shooterY}" r="3.4" fill="${theme.bullet}" opacity="0">
        <set attributeName="opacity" to="1" begin="cycle.begin+${begin}s" />
        <animate id="shot-${index}" attributeName="cx" from="${shooterX}" to="${target.cx}" begin="cycle.begin+${begin}s" dur="${shotDuration}s" fill="freeze" />
        <animate attributeName="cy" from="${shooterY}" to="${target.cy}" begin="cycle.begin+${begin}s" dur="${shotDuration}s" fill="freeze" />
        <set attributeName="opacity" to="0" begin="shot-${index}.end" />
      </circle>`;
    })
    .join('');

  const pops = targets
    .map((target, index) => {
      const particles = Array.from({ length: 6 }, (_, particleIndex) => {
        const angle = (Math.PI * 2 * particleIndex) / 6;
        const x = (target.cx + Math.cos(angle) * (radius * 2.3)).toFixed(2);
        const y = (target.cy + Math.sin(angle) * (radius * 2.3)).toFixed(2);
        return `
      <circle cx="${target.cx}" cy="${target.cy}" r="1.5" fill="${theme.sparkle}" opacity="0">
        <set attributeName="opacity" to="1" begin="shot-${index}.end" />
        <animate attributeName="cx" from="${target.cx}" to="${x}" begin="shot-${index}.end" dur="0.38s" fill="freeze" />
        <animate attributeName="cy" from="${target.cy}" to="${y}" begin="shot-${index}.end" dur="0.38s" fill="freeze" />
        <animate attributeName="opacity" from="1" to="0" begin="shot-${index}.end" dur="0.38s" fill="freeze" />
      </circle>`;
      }).join('');

      return `
      <circle cx="${target.cx}" cy="${target.cy}" r="${radius}" fill="none" stroke="${theme.explosion}" stroke-width="1.8" opacity="0">
        <set attributeName="opacity" to="1" begin="shot-${index}.end" />
        <animate attributeName="r" from="${radius}" to="${(radius * 2.1).toFixed(2)}" begin="shot-${index}.end" dur="0.38s" fill="freeze" />
        <animate attributeName="opacity" from="0.95" to="0" begin="shot-${index}.end" dur="0.38s" fill="freeze" />
      </circle>${particles}`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100%" viewBox="0 0 ${gridWidth} ${viewHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(username)} animated GitHub contribution graph">
  <title>${escapeXml(username)} contribution animation</title>
  <desc>Animated light-yellow contribution graph generated from public GitHub contribution data.</desc>
  <style>
    .label { font: 600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: ${theme.text}; }
  </style>
  <rect id="cycleTimer" x="-10" y="-10" width="1" height="1" fill="none">
    <animate id="cycle" attributeName="x" from="-10" to="-9" begin="0s;cycle.end+1s" dur="${totalDuration}s" fill="freeze" />
  </rect>
  <g transform="translate(${gap}, ${gap})">
    ${circles.join('')}
    <g opacity="0.94">
      <rect x="${shooterX - 18}" y="${shooterY - 8}" width="36" height="10" rx="5" fill="${theme.shooter}" />
      <polygon points="${shooterX - 7},${shooterY - 8} ${shooterX + 7},${shooterY - 8} ${shooterX},${shooterY - 23}" fill="${theme.shooter}" />
      <text class="label" x="${shooterX}" y="${shooterY + 17}" text-anchor="middle">TTTimsy</text>
    </g>
    ${bullets}
    ${pops}
  </g>
</svg>
`;
}

async function main() {
  console.log(`Generating contribution animation for ${username}`);
  const weeks = await requestContributionWeeks(username);
  const data = normalizeWeeks(weeks);

  const lightSvg = buildAnimatedSvg({ data, themeName: 'light' });
  const darkSvg = buildAnimatedSvg({ data, themeName: 'dark' });

  const outputs = [
    [`${username}-contribution-animation.svg`, lightSvg],
    [`${username}-contribution-animation-dark.svg`, darkSvg],
    ['contribution-animation.svg', lightSvg],
    ['contribution-animation-dark.svg', darkSvg],
    ['github-contribution-animation.svg', lightSvg],
    ['github-contribution-animation-dark.svg', darkSvg],
  ];

  outputs.forEach(([filename, content]) => {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`Wrote ${filename}`);
  });
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});