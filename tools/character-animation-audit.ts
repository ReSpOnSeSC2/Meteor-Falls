import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { AUTHORED_NPC_CHARACTER_IDS } from '../src/spritegen/authored';
import { decodePng, type Img } from './imageio';

const FRAME_W = 96;
const FRAME_H = 128;
const COLS = 4;
const TOTAL_FRAMES = 46;
const SHEET_W = FRAME_W * COLS;
const SHEET_H = FRAME_H * Math.ceil(TOTAL_FRAMES / COLS);
const SAMPLE_W = 24;
const SAMPLE_H = 32;

function argValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function argValues(name: string): string[] {
  const values: string[] = [];
  const prefix = `--${name}=`;
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === `--${name}` && process.argv[i + 1]) {
      values.push(process.argv[i + 1]);
      i++;
    } else if (arg.startsWith(prefix)) {
      values.push(arg.slice(prefix.length));
    }
  }
  return values;
}

const markdownOut = argValue('out', 'docs/asset-lists/character_animation_audit.md');
const htmlOut = argValue('html', 'docs/asset-lists/character_animation_audit.html');
const pathOverrides = new Map<string, string>();
for (const override of argValues('override')) {
  const [id, ...pathParts] = override.split('=');
  const path = pathParts.join('=');
  if (id && path) pathOverrides.set(id, path);
}

type Severity = 'error' | 'warn' | 'review';

interface Issue {
  severity: Severity;
  scope: string;
  message: string;
}

interface CharacterRow {
  id: string;
  art: string;
  role: 'hero' | 'npc' | 'unregistered';
  path: string;
  src: string;
  issues: Issue[];
}

interface FrameMetric {
  frame: number;
  alpha: number;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
  cx: number;
  cy: number;
  sample: Float32Array;
}

interface LoopDef {
  key: string;
  label: string;
  facing: FacingKey;
  frames: number[];
}

type FacingKey = 'down' | 'left' | 'right' | 'up' | 'downright' | 'downleft' | 'upright' | 'upleft';

const HEROES = [
  { id: 'rex', art: 'jay' },
  { id: 'faye', art: 'mia' },
  { id: 'milo', art: 'milo' },
  { id: 'pippa', art: 'pippa' },
  { id: 'dorin', art: 'dorin' },
] as const;

const LOOPS: readonly LoopDef[] = [
  { key: 'walk_down', label: 'walk down', facing: 'down', frames: [0, 1, 2, 3] },
  { key: 'walk_left', label: 'walk left', facing: 'left', frames: [4, 5, 6, 7] },
  { key: 'walk_right', label: 'walk right', facing: 'right', frames: [8, 9, 10, 11] },
  { key: 'walk_up', label: 'walk up', facing: 'up', frames: [12, 13, 14, 15] },
  { key: 'run_down', label: 'run down', facing: 'down', frames: [16, 17] },
  { key: 'run_left', label: 'run left', facing: 'left', frames: [18, 19] },
  { key: 'run_right', label: 'run right', facing: 'right', frames: [20, 21] },
  { key: 'run_up', label: 'run up', facing: 'up', frames: [22, 23] },
  { key: 'walk_downright', label: 'walk down-right', facing: 'downright', frames: [24, 25, 26] },
  { key: 'walk_downleft', label: 'walk down-left', facing: 'downleft', frames: [27, 28, 29] },
  { key: 'walk_upright', label: 'walk up-right', facing: 'upright', frames: [30, 31, 32] },
  { key: 'walk_upleft', label: 'walk up-left', facing: 'upleft', frames: [33, 34, 35] },
  { key: 'run_downright', label: 'run down-right', facing: 'downright', frames: [36, 37] },
  { key: 'run_downleft', label: 'run down-left', facing: 'downleft', frames: [38, 39] },
  { key: 'run_upright', label: 'run up-right', facing: 'upright', frames: [40, 41] },
  { key: 'run_upleft', label: 'run up-left', facing: 'upleft', frames: [42, 43] },
  { key: 'idle', label: 'idle down', facing: 'down', frames: [0, 44, 44, 0, 45, 0] },
] as const;

const STAND_FRAMES: Record<FacingKey, number> = {
  down: 0,
  left: 4,
  right: 8,
  up: 12,
  downright: 24,
  downleft: 27,
  upright: 30,
  upleft: 33,
};

const CHECKED_FRAME_LABELS: Record<number, string> = Object.fromEntries(
  LOOPS.flatMap((loop) => loop.frames.map((frame) => [frame, loop.label] as const)),
);

function pageSrc(path: string, art: string): string {
  const normalized = path.replace(/\\/g, '/');
  const marker = '/assets/';
  const index = normalized.lastIndexOf(marker);
  if (index >= 0) return `../..${normalized.slice(index)}`;
  if (normalized.startsWith('assets/')) return `../../${normalized}`;
  return `../../assets/art/characters/${art}_anim_46_4x.png`;
}

function rowPath(id: string, art: string): string {
  return resolve(process.cwd(), pathOverrides.get(id) ?? pathOverrides.get(art) ?? `assets/art/characters/${art}_anim_46_4x.png`);
}

function diskCharacterArts(): string[] {
  const dir = resolve(process.cwd(), 'assets/art/characters');
  return readdirSync(dir)
    .filter((name) => name.endsWith('_anim_46_4x.png'))
    .map((name) => name.replace(/_anim_46_4x\.png$/, ''))
    .sort();
}

function analyzeFrame(img: Img, frame: number): FrameMetric {
  const ox = (frame % COLS) * FRAME_W;
  const oy = Math.floor(frame / COLS) * FRAME_H;
  let alpha = 0;
  let sx = 0;
  let sy = 0;
  let x0 = FRAME_W;
  let y0 = FRAME_H;
  let x1 = -1;
  let y1 = -1;

  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const a = img.data[((oy + y) * img.w + (ox + x)) * 4 + 3];
      if (a < 24) continue;
      alpha++;
      sx += x;
      sy += y;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }

  const sample = new Float32Array(SAMPLE_W * SAMPLE_H);
  for (let gy = 0; gy < SAMPLE_H; gy++) {
    for (let gx = 0; gx < SAMPLE_W; gx++) {
      let sum = 0;
      let count = 0;
      const px0 = Math.floor((gx * FRAME_W) / SAMPLE_W);
      const px1 = Math.floor(((gx + 1) * FRAME_W) / SAMPLE_W);
      const py0 = Math.floor((gy * FRAME_H) / SAMPLE_H);
      const py1 = Math.floor(((gy + 1) * FRAME_H) / SAMPLE_H);
      for (let y = py0; y < py1; y++) {
        for (let x = px0; x < px1; x++) {
          sum += img.data[((oy + y) * img.w + (ox + x)) * 4 + 3] / 255;
          count++;
        }
      }
      sample[gy * SAMPLE_W + gx] = count > 0 ? sum / count : 0;
    }
  }

  return {
    frame,
    alpha,
    bbox: alpha > 0 ? { x0, y0, x1, y1 } : null,
    cx: alpha > 0 ? sx / alpha : FRAME_W / 2,
    cy: alpha > 0 ? sy / alpha : FRAME_H / 2,
    sample,
  };
}

function distance(a: FrameMetric, b: FrameMetric, mirrorB = false): number {
  let total = 0;
  for (let y = 0; y < SAMPLE_H; y++) {
    for (let x = 0; x < SAMPLE_W; x++) {
      const bx = mirrorB ? SAMPLE_W - 1 - x : x;
      total += Math.abs(a.sample[y * SAMPLE_W + x] - b.sample[y * SAMPLE_W + bx]);
    }
  }
  return total / (SAMPLE_W * SAMPLE_H);
}

function nearestFacing(metric: FrameMetric, stands: Record<FacingKey, FrameMetric>): { facing: FacingKey; dist: number } {
  let best: { facing: FacingKey; dist: number } | null = null;
  for (const facing of Object.keys(stands) as FacingKey[]) {
    const dist = distance(metric, stands[facing]);
    if (!best || dist < best.dist) best = { facing, dist };
  }
  if (!best) throw new Error('no stand frames');
  return best;
}

function pushIssue(issues: Issue[], severity: Severity, scope: string, message: string): void {
  issues.push({ severity, scope, message });
}

function inspectCharacter(row: CharacterRow): void {
  if (!existsSync(row.path)) {
    pushIssue(row.issues, 'error', 'file', `missing ${row.path}`);
    return;
  }

  const img = decodePng(readFileSync(row.path));
  if (img.w !== SHEET_W || img.h !== SHEET_H) {
    pushIssue(row.issues, 'error', 'sheet', `expected ${SHEET_W}x${SHEET_H}, found ${img.w}x${img.h}`);
    return;
  }

  const metrics = Array.from({ length: TOTAL_FRAMES }, (_, frame) => analyzeFrame(img, frame));
  const minAlpha = row.art === 'glint' ? 40 : 1500;
  for (const metric of metrics) {
    if (metric.alpha <= minAlpha) {
      pushIssue(row.issues, 'error', `frame ${metric.frame}`, `too little visible art (${metric.alpha} alpha pixels)`);
    }
  }

  const stands = Object.fromEntries(
    Object.entries(STAND_FRAMES).map(([facing, frame]) => [facing, metrics[frame]]),
  ) as Record<FacingKey, FrameMetric>;

  for (const loop of LOOPS.filter((loop) => loop.key !== 'idle')) {
    for (const frame of loop.frames) {
      const metric = metrics[frame];
      const nearest = nearestFacing(metric, stands);
      const expectedDist = distance(metric, stands[loop.facing]);
      if (nearest.facing !== loop.facing && nearest.dist + 0.035 < expectedDist) {
        pushIssue(
          row.issues,
          'review',
          `frame ${frame}`,
          `${CHECKED_FRAME_LABELS[frame]} looks closer to ${nearest.facing} than ${loop.facing}`,
        );
      }
    }
  }

  for (const loop of LOOPS.filter((loop) => loop.key !== 'idle')) {
    const frameMetrics = loop.frames.map((frame) => metrics[frame]);
    const stand = stands[loop.facing];
    const maxStandDist = Math.max(...frameMetrics.map((metric) => distance(metric, stand)));
    if (maxStandDist > 0.34) {
      pushIssue(row.issues, 'warn', loop.label, `frames drift too far from ${loop.facing} stand pose (${maxStandDist.toFixed(3)})`);
    }

    if (loop.frames.length === 2) {
      const stepDist = distance(frameMetrics[0], frameMetrics[1]);
      if (stepDist < 0.010) pushIssue(row.issues, 'warn', loop.label, `run pair is nearly frozen (${stepDist.toFixed(3)})`);
      if (stepDist > 0.26) pushIssue(row.issues, 'warn', loop.label, `run pair changes too abruptly (${stepDist.toFixed(3)})`);
    }

    if (loop.frames.length === 3) {
      const stepDist = distance(frameMetrics[1], frameMetrics[2]);
      if (stepDist < 0.010) pushIssue(row.issues, 'warn', loop.label, `diagonal step pair is nearly frozen (${stepDist.toFixed(3)})`);
      if (stepDist > 0.28) pushIssue(row.issues, 'warn', loop.label, `diagonal step pair changes too abruptly (${stepDist.toFixed(3)})`);
    }

    if (loop.frames.length === 4) {
      const neutralDist = distance(frameMetrics[0], frameMetrics[2]);
      const stepDist = distance(frameMetrics[1], frameMetrics[3]);
      if (neutralDist > 0.07) pushIssue(row.issues, 'warn', loop.label, `stand frames 0/2 are not stable (${neutralDist.toFixed(3)})`);
      if (stepDist < 0.010) pushIssue(row.issues, 'warn', loop.label, `step frames 1/3 are nearly frozen (${stepDist.toFixed(3)})`);
      if (stepDist > 0.28) pushIssue(row.issues, 'warn', loop.label, `step frames 1/3 change too abruptly (${stepDist.toFixed(3)})`);
    }
  }

  const mirrorPairs: Array<[FacingKey, FacingKey, string]> = [
    ['left', 'right', 'left/right'],
    ['downleft', 'downright', 'down diagonals'],
    ['upleft', 'upright', 'up diagonals'],
  ];
  for (const [a, b, label] of mirrorPairs) {
    const mirrorDist = distance(stands[a], stands[b], true);
    if (mirrorDist > 0.18) {
      pushIssue(row.issues, 'review', label, `standing pair is not mirror-compatible (${mirrorDist.toFixed(3)})`);
    }
  }
}

function writeMarkdown(rows: CharacterRow[]): void {
  const outPath = resolve(process.cwd(), markdownOut);
  const htmlLink = relative(dirname(outPath), resolve(process.cwd(), htmlOut)).replaceAll('\\', '/');
  const issueRows = rows.filter((row) => row.issues.length > 0);
  const lines: string[] = [
    '# Character Animation Audit',
    '',
    'This checks the authored 46-frame character sheets against the runtime frame contract.',
    '',
    '- Frame size: 96x128',
    '- Sheet size: 384x1536',
    '- Frame count: 46',
    `- Registered characters: ${rows.filter((row) => row.role !== 'unregistered').length}`,
    `- Unregistered character sheets on disk: ${rows.filter((row) => row.role === 'unregistered').length}`,
    `- Path overrides: ${pathOverrides.size}`,
    `- Characters with issues: ${issueRows.length}`,
    `- Errors: ${rows.reduce((n, row) => n + row.issues.filter((issue) => issue.severity === 'error').length, 0)}`,
    `- Warnings: ${rows.reduce((n, row) => n + row.issues.filter((issue) => issue.severity === 'warn').length, 0)}`,
    `- Review hints: ${rows.reduce((n, row) => n + row.issues.filter((issue) => issue.severity === 'review').length, 0)}`,
    '',
    `Interactive playback page: [${htmlLink}](${htmlLink})`,
    '',
    '## Correction Workflow',
    '',
    'Generated character art is corrected one frame at a time. If a frame image fails visual review, do not salvage, trace, mirror, repaint, or derive from that failed image. Generate a new single 96x128 PNG, then import it back into one slot.',
    '',
    '- Export one frame: `npm run anim:frame -- --char <id> --frame <N> --out assets/art/review/fixes/<id>_frame_<N>.png`',
    '- Check one generated frame: `npm run anim:frame:check -- --image assets/art/review/fixes/<id>_frame_<N>.png`',
    '- Import one corrected frame: `npm run anim:fix -- --char <id> --image assets/art/review/fixes/<id>_frame_<N>.png --op importImage:<N>`',
    '- Preview first: `anim:fix` is a dry run unless `--apply` is passed.',
    '- Verify a candidate sheet: `npm run anim:audit -- --override <id>=assets/art/review/<candidate>.png`',
    '',
    'Use `npm run anim:fix -- --char <id> ...` for frame moves and one-frame imports. Frame moves are only for correct images placed in the wrong slot; failed images are regenerated.',
    '',
    'Common operations:',
    '',
    '- `--op copy:FROM:TO` copies one frame into another slot.',
    '- `--op mirror:FROM:TO` horizontally mirrors one frame into another slot.',
    '- `--image <path> --op importImage:TO` imports one 96x128 PNG into one frame slot.',
    '- `--op swap:A:B` swaps two frame cells.',
    '- `--op swapRange:A-B:C-D` swaps equal-length frame ranges.',
    '- `--op reverse:A-B` reverses a frame range.',
    '- `--op rotate:A-B:N` rotates a frame range by N cells.',
    '',
    'Common presets:',
    '',
    '- `--preset swap-left-right` swaps all left/right walk and run blocks.',
    '- `--preset swap-up-down` swaps all up/down walk and run blocks.',
    '- `--preset normalize-cardinal-stands` copies cardinal stand frames into their matching neutral slots.',
    '- `--preset mirror-right-from-left` builds right-facing cardinal frames from mirrored left-facing frames.',
    '- `--preset mirror-left-from-right` builds left-facing cardinal frames from mirrored right-facing frames.',
    '',
    '## Frame Contract',
    '',
    '| frames | meaning |',
    '|---|---|',
    '| 0-3 | walk down |',
    '| 4-7 | walk left |',
    '| 8-11 | walk right |',
    '| 12-15 | walk up |',
    '| 16-17 | run down |',
    '| 18-19 | run left |',
    '| 20-21 | run right |',
    '| 22-23 | run up |',
    '| 24-26 | walk down-right |',
    '| 27-29 | walk down-left |',
    '| 30-32 | walk up-right |',
    '| 33-35 | walk up-left |',
    '| 36-37 | run down-right |',
    '| 38-39 | run down-left |',
    '| 40-41 | run up-right |',
    '| 42-43 | run up-left |',
    '| 44 | idle breath |',
    '| 45 | idle blink |',
    '',
    '## Issue Summary',
    '',
  ];

  if (issueRows.length === 0) {
    lines.push('- none');
  } else {
    for (const row of issueRows) {
      lines.push(`### ${row.id} (${row.art})`);
      for (const issue of row.issues) {
        lines.push(`- ${issue.severity.toUpperCase()} ${issue.scope}: ${issue.message}`);
      }
      lines.push('');
    }
  }

  lines.push('## All Registered Sheets', '', '| id | art | role | issue count |', '|---|---|---|---|');
  for (const row of rows) {
    lines.push(`| ${row.id} | ${row.art} | ${row.role} | ${row.issues.length} |`);
  }

  writeFileSync(outPath, `${lines.join('\n')}\n`);
  console.log(outPath);
}

function writeHtml(rows: CharacterRow[]): void {
  const outPath = resolve(process.cwd(), htmlOut);
  const rowsForPage = rows.map((row) => ({
    id: row.id,
    art: row.art,
    role: row.role,
    src: row.src,
    issues: row.issues,
  }));
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Character Animation Audit</title>
<style>
:root {
  color-scheme: dark;
  font-family: Arial, sans-serif;
  background: #111318;
  color: #f2f4f8;
}
body {
  margin: 0;
  padding: 18px;
}
header {
  position: sticky;
  top: 0;
  z-index: 4;
  background: #111318;
  border-bottom: 1px solid #333945;
  padding: 0 0 12px;
}
h1 {
  font-size: 20px;
  margin: 0 0 10px;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
input, select, button {
  background: #1b2029;
  color: #f2f4f8;
  border: 1px solid #3a4352;
  border-radius: 4px;
  padding: 6px 8px;
}
button {
  cursor: pointer;
}
.summary {
  margin: 10px 0 0;
  color: #b8c2d0;
  font-size: 13px;
}
.character {
  border-top: 1px solid #333945;
  padding: 14px 0 18px;
}
.character h2 {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 17px;
  margin: 0 0 10px;
}
.tag {
  color: #111318;
  background: #d7e3f4;
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 11px;
}
.tag.warn {
  background: #ffd166;
}
.tag.review {
  background: #8ecae6;
}
.tag.error {
  background: #ff6b6b;
}
.issue-list {
  margin: 0 0 12px;
  padding-left: 18px;
  color: #ffd9a3;
  font-size: 13px;
}
.loops {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 10px;
}
.loop {
  background: #171b23;
  border: 1px solid #303846;
  border-radius: 6px;
  padding: 8px;
}
.loop b {
  display: block;
  font-size: 12px;
  color: #c9d3df;
  margin-bottom: 6px;
}
.anim {
  width: calc(96px * var(--scale));
  height: calc(128px * var(--scale));
  image-rendering: pixelated;
  background-repeat: no-repeat;
  background-size: calc(384px * var(--scale)) calc(1536px * var(--scale));
  background-color: #232933;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
}
.frames {
  margin-top: 5px;
  color: #8996a8;
  font-size: 11px;
}
.hidden {
  display: none;
}
</style>
</head>
<body>
<header>
  <h1>Character Animation Audit</h1>
  <div class="controls">
    <input id="search" placeholder="filter character">
    <select id="scale">
      <option value="1">1x</option>
      <option value="1.5">1.5x</option>
      <option value="2">2x</option>
    </select>
    <select id="speed">
      <option value="180">slow</option>
      <option value="120" selected>normal</option>
      <option value="80">fast</option>
    </select>
    <button id="toggleIssues">show issues only</button>
  </div>
  <p class="summary" id="summary"></p>
</header>
<main id="app"></main>
<script>
const FRAME_W = ${FRAME_W};
const FRAME_H = ${FRAME_H};
const COLS = ${COLS};
const LOOPS = ${JSON.stringify(LOOPS)};
const ROWS = ${JSON.stringify(rowsForPage)};
let frameTick = 0;
let issuesOnly = false;
const app = document.getElementById('app');
const search = document.getElementById('search');
const scale = document.getElementById('scale');
const speed = document.getElementById('speed');
const summary = document.getElementById('summary');
const toggleIssues = document.getElementById('toggleIssues');

function framePos(frame, s) {
  const x = (frame % COLS) * FRAME_W * s;
  const y = Math.floor(frame / COLS) * FRAME_H * s;
  return '-' + x + 'px -' + y + 'px';
}

function render() {
  const q = search.value.trim().toLowerCase();
  const s = Number(scale.value);
  app.style.setProperty('--scale', s);
  app.textContent = '';
  let visible = 0;
  const totalIssues = ROWS.reduce((n, row) => n + row.issues.length, 0);
  for (const row of ROWS) {
    if (q && !row.id.toLowerCase().includes(q) && !row.art.toLowerCase().includes(q)) continue;
    if (issuesOnly && row.issues.length === 0) continue;
    visible++;
    const section = document.createElement('section');
    section.className = 'character';
    const h2 = document.createElement('h2');
    h2.innerHTML = '<span>' + escapeHtml(row.id) + '</span><span class="tag">' + escapeHtml(row.role) + '</span><span class="tag ' + issueTag(row.issues) + '">' + row.issues.length + ' issues</span>';
    section.appendChild(h2);
    if (row.issues.length) {
      const ul = document.createElement('ul');
      ul.className = 'issue-list';
      for (const issue of row.issues) {
        const li = document.createElement('li');
        li.textContent = issue.severity.toUpperCase() + ' ' + issue.scope + ': ' + issue.message;
        ul.appendChild(li);
      }
      section.appendChild(ul);
    }
    const loops = document.createElement('div');
    loops.className = 'loops';
    for (const loop of LOOPS) {
      const card = document.createElement('div');
      card.className = 'loop';
      const title = document.createElement('b');
      title.textContent = loop.label;
      const anim = document.createElement('div');
      anim.className = 'anim';
      anim.dataset.frames = loop.frames.join(',');
      anim.style.backgroundImage = 'url("' + row.src + '")';
      const frames = document.createElement('div');
      frames.className = 'frames';
      frames.textContent = loop.frames.join(', ');
      card.appendChild(title);
      card.appendChild(anim);
      card.appendChild(frames);
      loops.appendChild(card);
    }
    section.appendChild(loops);
    app.appendChild(section);
  }
  summary.textContent = visible + ' visible / ' + ROWS.length + ' sheets, ' + totalIssues + ' total issues';
  advanceFrames();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function issueTag(issues) {
  if (issues.some((issue) => issue.severity === 'error')) return 'error';
  if (issues.some((issue) => issue.severity === 'warn')) return 'warn';
  if (issues.some((issue) => issue.severity === 'review')) return 'review';
  return '';
}

function advanceFrames() {
  const s = Number(scale.value);
  document.querySelectorAll('.anim').forEach((el) => {
    const frames = el.dataset.frames.split(',').map(Number);
    const frame = frames[frameTick % frames.length];
    el.style.backgroundSize = (384 * s) + 'px ' + (1536 * s) + 'px';
    el.style.backgroundPosition = framePos(frame, s);
  });
}

let timer = null;
function restartTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    frameTick++;
    advanceFrames();
  }, Number(speed.value));
}

search.addEventListener('input', render);
scale.addEventListener('change', render);
speed.addEventListener('change', restartTimer);
toggleIssues.addEventListener('click', () => {
  issuesOnly = !issuesOnly;
  toggleIssues.textContent = issuesOnly ? 'show all' : 'show issues only';
  render();
});
render();
restartTimer();
</script>
</body>
</html>`;

  writeFileSync(outPath, html);
  console.log(outPath);
}

function collectRows(): CharacterRow[] {
  const registered = new Map<string, CharacterRow>();
  for (const hero of HEROES) {
    registered.set(hero.art, {
      id: hero.id,
      art: hero.art,
      role: 'hero',
      path: rowPath(hero.id, hero.art),
      src: pageSrc(rowPath(hero.id, hero.art), hero.art),
      issues: [],
    });
  }
  for (const id of AUTHORED_NPC_CHARACTER_IDS) {
    registered.set(id, {
      id,
      art: id,
      role: 'npc',
      path: rowPath(id, id),
      src: pageSrc(rowPath(id, id), id),
      issues: [],
    });
  }

  const rows = [...registered.values()];
  for (const art of diskCharacterArts()) {
    if (registered.has(art)) continue;
    rows.push({
      id: art,
      art,
      role: 'unregistered',
      path: rowPath(art, art),
      src: pageSrc(rowPath(art, art), art),
      issues: [{ severity: 'warn', scope: 'registration', message: 'sheet exists on disk but is not in the authored character roster' }],
    });
  }
  return rows.sort((a, b) => `${a.role}:${a.id}`.localeCompare(`${b.role}:${b.id}`));
}

function main(): void {
  mkdirSync(resolve(process.cwd(), 'docs/asset-lists'), { recursive: true });
  const rows = collectRows();
  for (const row of rows) inspectCharacter(row);
  writeMarkdown(rows);
  writeHtml(rows);

  const errorCount = rows.reduce((n, row) => n + row.issues.filter((issue) => issue.severity === 'error').length, 0);
  const warnCount = rows.reduce((n, row) => n + row.issues.filter((issue) => issue.severity === 'warn').length, 0);
  const reviewCount = rows.reduce((n, row) => n + row.issues.filter((issue) => issue.severity === 'review').length, 0);
  const issueRows = rows.filter((row) => row.issues.length > 0).length;
  console.log(`character animation: ${rows.length - issueRows}/${rows.length} clean, ${errorCount} errors, ${warnCount} warnings, ${reviewCount} review hints`);
  if (process.argv.includes('--strict') && (errorCount > 0 || warnCount > 0)) process.exit(1);
}

main();
