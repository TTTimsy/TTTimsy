#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');
const { buildContributionMosaic, escapeXml, loadPixelArt } = require('./calling-of-saint-matthew-pixels.cjs');

const levelNumber = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

function resolveUsername() {
  return (process.env.CONTRIBUTION_USERNAME && process.env.CONTRIBUTION_USERNAME.trim())
    || (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.split('/')[0]);
}

function resolveGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_AUTH_TOKEN;
}

function requestContributionWeeks(login, token) {
  return new Promise((resolve, reject) => {
    const query = 'query($username: String!) { user(login: $username) { contributionsCollection { contributionCalendar { weeks { contributionDays { contributionCount contributionLevel date weekday } } } } } }';
    const body = JSON.stringify({ query, variables: { username: login } });
    const request = https.request({ hostname: 'api.github.com', path: '/graphql', method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v4+json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'tttimsy-calling-of-saint-matthew' } }, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        try {
          if (response.statusCode !== 200) throw new Error(`GitHub API returned HTTP ${response.statusCode}`);
          const parsed = JSON.parse(responseBody);
          if (parsed.errors) throw new Error(`GraphQL error: ${JSON.stringify(parsed.errors)}`);
          const weeks = parsed?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
          if (!Array.isArray(weeks) || weeks.length !== 53) throw new Error('GitHub API response did not contain a 53-week contribution calendar.');
          resolve(weeks);
        } catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function normalizeWeeks(weeks) {
  return weeks.map((week, weekIndex) => {
    const byWeekday = new Map((week.contributionDays || []).map((day) => [day.weekday, day]));
    return Array.from({ length: 7 }, (_, weekday) => {
      const day = byWeekday.get(weekday);
      return day
        ? { count: day.contributionCount, date: day.date, level: levelNumber[day.contributionLevel] || 0, weekday }
        : { count: 0, date: `padding-${weekIndex}-${weekday}`, level: 0, weekday };
    });
  });
}

function buildAnimatedSvg({ data, themeName, profileName = 'GitHub user' }) {
  if (!['light', 'dark'].includes(themeName)) throw new Error(`Unknown theme: ${themeName}`);
  const mosaic = buildContributionMosaic({ data, pixelArt: loadPixelArt(path.join(__dirname, '..', 'picture.png')) });
  const label = `${profileName} Calling of Saint Matthew contribution mosaic`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="100%" viewBox="0 0 159 21" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(label)}" shape-rendering="crispEdges"><title>${escapeXml(label)}</title><desc>Animated pixel rendition of The Calling of Saint Matthew. Contribution activity controls the initial brightness.</desc>${mosaic}</svg>\n`;
}

async function main() {
  const username = resolveUsername();
  const token = resolveGitHubToken();
  if (!token) throw new Error('GITHUB_TOKEN, GH_TOKEN, or GITHUB_AUTH_TOKEN is required.');
  if (!username) throw new Error('Unable to resolve username. Set CONTRIBUTION_USERNAME or GITHUB_REPOSITORY.');
  const data = normalizeWeeks(await requestContributionWeeks(username, token));
  for (const [filename, themeName] of [[`${username}-contribution-animation.svg`, 'light'], [`${username}-contribution-animation-dark.svg`, 'dark']]) {
    fs.writeFileSync(filename, buildAnimatedSvg({ data, themeName, profileName: username }), 'utf8');
    console.log(`Wrote ${filename}`);
  }
}

if (require.main === module) main().catch((error) => { console.error(error.stack || error); process.exit(1); });

module.exports = { buildAnimatedSvg, normalizeWeeks };
