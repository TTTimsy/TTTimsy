# Icon-Only Sentinel Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all visible status-card prose with maintenance numbers and state icons.

**Architecture:** `renderStatusSvg` continues to own the generated card. It will render progress and expected commits numerically, using a gold shield for normal state and vermilion warning triangle for restored drift; the static asset is regenerated from that function.

**Tech Stack:** Node.js CommonJS and Node strict assertions.

---

### Task 1: Render and verify icon-only status

**Files:**
- Modify: `scripts/daily-animation-sentinel.cjs`
- Modify: `tests/verify_daily_animation_sentinel.cjs`
- Modify: `assets/animation-sentinel-status.svg`

- [ ] **Step 1: Write the failing assertions**

```js
assert.doesNotMatch(renderStatusSvg(normal), /[\u4e00-\u9fff]/);
assert.match(renderStatusSvg(normal), /data-state="normal"/);
assert.match(renderStatusSvg(warning), /data-state="alert"/);
assert.match(renderStatusSvg(normal), /16/);
```

- [ ] **Step 2: Verify the test fails**

Run: `node tests/verify_daily_animation_sentinel.cjs`

Expected: failure because the current SVG contains Chinese status prose.

- [ ] **Step 3: Implement the minimal SVG replacement**

```js
const icon = warning
  ? '<path d="M34 34L52 66H16Z" fill="#d94841"/><text x="34" y="58" text-anchor="middle" fill="#1d1411" font-size="20">!</text>'
  : '<path d="M34 18L52 26V43C52 55 44 65 34 70C24 65 16 55 16 43V26Z" fill="#d8a657"/>';
```

Render only this icon, `${state.completed} / ${state.planned}`, `${state.planned + 1}`, and the existing progress circles; retain the English `aria-label`.

- [ ] **Step 4: Regenerate the static card and verify**

Run: `node scripts/daily-animation-sentinel.cjs --now 2026-08-10T16:00:00.000Z --random 0.7`

Run: `npm test; git diff --check`

Expected: both suites pass and `assets/animation-sentinel-status.svg` contains no Chinese characters.

- [ ] **Step 5: Commit**

```bash
git add scripts/daily-animation-sentinel.cjs tests/verify_daily_animation_sentinel.cjs assets/animation-sentinel-status.svg
git commit -m "feat: use icon-only sentinel card"
```
