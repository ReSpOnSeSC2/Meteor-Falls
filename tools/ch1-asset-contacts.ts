/**
 * Build labeled, native-detail review contacts for the Chapter 1 asset contract.
 *
 * Run:
 *   npx tsx tools/ch1-asset-contacts.ts
 *
 * To include story-phase evidence, provide REAL runtime screenshots (the tool
 * intentionally does not fake live state by tinting a still):
 *   --phase-night=path.png --phase-hush=path.png --phase-restored=path.png
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Img } from './imageio';
import { decodePng, encodePng, makeImg } from './imageio';

const ROOT = process.cwd();
const OUT = resolve(ROOT, 'output/ch1_asset_contacts');
const FONT = decodePng(readFileSync(resolve(ROOT, 'assets/art/ui/font/fontsheet.png')));
const CELL_W = 6;
const CELL_H = 9;
const FONT_COLS = 16;

const COLORS = {
  background: [14, 17, 24, 255] as const,
  panel: [28, 34, 45, 255] as const,
  panelAlt: [36, 43, 55, 255] as const,
  rule: [80, 95, 116, 255] as const,
};

const SEED = [
  ['cranky_mailbox', 'cranky_mailbox'],
  ['runaway_lawnmower', 'runaway_lawnmower'],
  ['coily_cicada', 'coily_cicada'],
  ['blazer_smiler', 'blazer_smiler'],
  ['pigeon_gang', 'pigeon_gang'],
  ['hill_slug_deluxe', 'hill_slug'],
  ['borden', 'constable_borden'],
] as const;

const EXPANDED = [
  'sprinkler_sentry',
  'recycling_raccoon',
  'skeeter_swarm',
  'unionized_gnome',
  'mandatory_memo',
  'motivational_poster',
  'quota_clock',
  'expired_meter',
  'showroom_mannequin',
  'good_investment',
  'rogue_icecream_truck',
  'tick_nymph',
  'the_suit',
] as const;

const BOSSES = [
  ['titanic_tick', 'titanic_tick'],
  ['hush_sentinel', 'hush_sentinel'],
] as const;

const MINI_KEYS: Readonly<Record<string, string>> = {
  cranky_mailbox: 'mini_cranky_mailbox',
  runaway_lawnmower: 'mini_runaway_lawnmower',
  coily_cicada: 'mini_coily_cicada',
  blazer_smiler: 'mini_blazer_smiler',
  pigeon_gang: 'mini_pigeon_gang',
  hill_slug_deluxe: 'mini_hill_slug',
  borden: 'mini_borden',
  sprinkler_sentry: 'mini_sprinkler_sentry',
  recycling_raccoon: 'mini_recycling_raccoon',
  skeeter_swarm: 'mini_skeeter_swarm',
  unionized_gnome: 'mini_unionized_gnome',
  mandatory_memo: 'mini_mandatory_memo',
  motivational_poster: 'mini_motivational_poster',
  quota_clock: 'mini_quota_clock',
  expired_meter: 'mini_expired_meter',
  showroom_mannequin: 'mini_showroom_mannequin',
  good_investment: 'mini_good_investment',
  rogue_icecream_truck: 'mini_rogue_icecream_truck',
  tick_nymph: 'mini_tick_nymph',
  the_suit: 'mini_the_suit',
  titanic_tick: 'mini_titanic_tick',
  hush_sentinel: 'mini_hush_sentinel',
};

const PANELS = [
  'bug_zapper',
  'first_heartlight',
  'glints_prophecy',
  'hickory_hill',
  'meteor_2am',
  'moms_payphone_call',
  'otterbrook_at_night',
  'titanic_tick_reveal',
] as const;

interface WrittenContact {
  file: string;
  w: number;
  h: number;
  sha256: string;
}

const written: WrittenContact[] = [];

function load(path: string): Img {
  return decodePng(readFileSync(resolve(ROOT, path)));
}

function fileEvidence(path: string): { file: string; w: number; h: number; sha256: string } {
  const bytes = readFileSync(resolve(ROOT, path));
  const decoded = decodePng(bytes);
  return {
    file: path.replaceAll('\\', '/'),
    w: decoded.w,
    h: decoded.h,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

function canvas(w: number, h: number): Img {
  const output = makeImg(w, h);
  fillRect(output, 0, 0, w, h, COLORS.background);
  return output;
}

function fillRect(target: Img, x: number, y: number, w: number, h: number, color: readonly [number, number, number, number]): void {
  const minX = Math.max(0, x);
  const minY = Math.max(0, y);
  const maxX = Math.min(target.w, x + w);
  const maxY = Math.min(target.h, y + h);
  for (let py = minY; py < maxY; py++) {
    for (let px = minX; px < maxX; px++) {
      const i = (py * target.w + px) * 4;
      target.data[i] = color[0];
      target.data[i + 1] = color[1];
      target.data[i + 2] = color[2];
      target.data[i + 3] = color[3];
    }
  }
}

function checker(target: Img, x: number, y: number, w: number, h: number, cell = 8): void {
  const light = [63, 70, 82, 255] as const;
  const dark = [43, 49, 60, 255] as const;
  for (let py = 0; py < h; py += cell) {
    for (let px = 0; px < w; px += cell) {
      fillRect(target, x + px, y + py, Math.min(cell, w - px), Math.min(cell, h - py), ((px / cell + py / cell) & 1) === 0 ? light : dark);
    }
  }
}

function blend(target: Img, di: number, r: number, g: number, b: number, a: number): void {
  if (a === 0) return;
  if (a === 255) {
    target.data[di] = r;
    target.data[di + 1] = g;
    target.data[di + 2] = b;
    target.data[di + 3] = 255;
    return;
  }
  const sourceAlpha = a / 255;
  const destAlpha = target.data[di + 3] / 255;
  const outAlpha = sourceAlpha + destAlpha * (1 - sourceAlpha);
  if (outAlpha <= 0) return;
  target.data[di] = Math.round((r * sourceAlpha + target.data[di] * destAlpha * (1 - sourceAlpha)) / outAlpha);
  target.data[di + 1] = Math.round((g * sourceAlpha + target.data[di + 1] * destAlpha * (1 - sourceAlpha)) / outAlpha);
  target.data[di + 2] = Math.round((b * sourceAlpha + target.data[di + 2] * destAlpha * (1 - sourceAlpha)) / outAlpha);
  target.data[di + 3] = Math.round(outAlpha * 255);
}

function blit(target: Img, source: Img, x: number, y: number): void {
  for (let sy = 0; sy < source.h; sy++) {
    const dy = y + sy;
    if (dy < 0 || dy >= target.h) continue;
    for (let sx = 0; sx < source.w; sx++) {
      const dx = x + sx;
      if (dx < 0 || dx >= target.w) continue;
      const si = (sy * source.w + sx) * 4;
      const di = (dy * target.w + dx) * 4;
      blend(target, di, source.data[si], source.data[si + 1], source.data[si + 2], source.data[si + 3]);
    }
  }
}

function nearestScale(source: Img, scale: number): Img {
  const output = makeImg(source.w * scale, source.h * scale);
  for (let y = 0; y < output.h; y++) {
    for (let x = 0; x < output.w; x++) {
      const si = (Math.floor(y / scale) * source.w + Math.floor(x / scale)) * 4;
      const di = (y * output.w + x) * 4;
      output.data.set(source.data.subarray(si, si + 4), di);
    }
  }
  return output;
}

function drawText(target: Img, value: string, x: number, y: number, scale = 2): void {
  let cursorX = x;
  let cursorY = y;
  for (const raw of value) {
    if (raw === '\n') {
      cursorX = x;
      cursorY += CELL_H * scale + scale;
      continue;
    }
    const code = raw.charCodeAt(0);
    const glyph = code >= 32 && code <= 126 ? code - 32 : 31;
    const gx = (glyph % FONT_COLS) * CELL_W;
    const gy = Math.floor(glyph / FONT_COLS) * CELL_H;
    for (let py = 0; py < CELL_H; py++) {
      for (let px = 0; px < CELL_W; px++) {
        const si = ((gy + py) * FONT.w + gx + px) * 4;
        const alpha = FONT.data[si + 3];
        if (alpha === 0) continue;
        for (let yy = 0; yy < scale; yy++) {
          for (let xx = 0; xx < scale; xx++) {
            const dx = cursorX + px * scale + xx;
            const dy = cursorY + py * scale + yy;
            if (dx < 0 || dx >= target.w || dy < 0 || dy >= target.h) continue;
            blend(target, (dy * target.w + dx) * 4, FONT.data[si], FONT.data[si + 1], FONT.data[si + 2], alpha);
          }
        }
      }
    }
    cursorX += CELL_W * scale;
  }
}

function title(target: Img, value: string): void {
  fillRect(target, 0, 0, target.w, 42, COLORS.panelAlt);
  drawText(target, value, 16, 9, 2);
  fillRect(target, 0, 41, target.w, 1, COLORS.rule);
}

function writeContact(name: string, output: Img): void {
  const bytes = encodePng(output);
  writeFileSync(resolve(OUT, name), bytes);
  written.push({
    file: name,
    w: output.w,
    h: output.h,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
  console.log(`wrote ${name} (${output.w}x${output.h})`);
}

function battleContact(name: string, label: string, roster: readonly (readonly [string, string])[]): void {
  const trios = roster.map(([id, sprite]) => ({
    id,
    sprite,
    frames: ['', '_w1', '_w2'].map((suffix) => load(`assets/art/enemies/battle_${sprite}${suffix}.png`)),
  }));
  const rowH = Math.max(190, ...trios.flatMap(({ frames }) => frames.map((frame) => frame.h + 58)));
  const output = canvas(1280, 52 + rowH * trios.length);
  title(output, label);
  for (const [row, trio] of trios.entries()) {
    const y = 48 + row * rowH;
    fillRect(output, 10, y, output.w - 20, rowH - 8, row % 2 === 0 ? COLORS.panel : COLORS.panelAlt);
    drawText(output, trio.id, 22, y + 15, 2);
    drawText(output, `battle_${trio.sprite}`, 22, y + 40, 1);
    for (let stage = 0; stage < 3; stage++) {
      const frame = trio.frames[stage];
      const boxX = 270 + stage * 330;
      const labelText = stage === 0 ? 'BASE' : `WEAR ${stage}`;
      drawText(output, `${labelText} ${frame.w}x${frame.h}`, boxX, y + 12, 1);
      checker(output, boxX, y + 32, 310, rowH - 50);
      blit(output, frame, boxX + Math.floor((310 - frame.w) / 2), y + 36);
    }
  }
  writeContact(name, output);
}

function fieldContact(name: string, label: string, roster: readonly (readonly [string, string])[]): void {
  const rowH = 188;
  const output = canvas(1200, 52 + rowH * roster.length);
  title(output, label);
  for (const [row, [id]] of roster.entries()) {
    const y = 48 + row * rowH;
    fillRect(output, 10, y, output.w - 20, rowH - 8, row % 2 === 0 ? COLORS.panel : COLORS.panelAlt);
    drawText(output, id, 22, y + 15, 2);
    const miniKey = MINI_KEYS[id];
    const miniPath = miniKey ? `assets/art/enemies/${miniKey}.png` : '';
    if (miniPath && existsSync(resolve(ROOT, miniPath))) {
      const mini = load(miniPath);
      drawText(output, `${miniKey} ${mini.w}x${mini.h}`, 22, y + 45, 1);
      checker(output, 220, y + 18, 140, 140);
      blit(output, mini, 290 - Math.floor(mini.w / 2), y + 88 - Math.floor(mini.h / 2));
    } else {
      drawText(output, `${miniKey ?? 'NO MINI'} (PROCEDURAL AT BOOT)`, 22, y + 45, 1);
    }

    const sheetPath = `assets/art/enemies/overworld/${id}_8dir.png`;
    if (existsSync(resolve(ROOT, sheetPath))) {
      const sheet = load(sheetPath);
      drawText(output, `${id}_8dir.png  8 x 96x128`, 390, y + 10, 1);
      checker(output, 390, y + 30, 768, 128);
      blit(output, sheet, 390, y + 30);
      for (let frame = 1; frame < 8; frame++) fillRect(output, 390 + frame * 96, y + 30, 1, 128, COLORS.rule);
    } else if (miniPath && existsSync(resolve(ROOT, miniPath))) {
      const mini = load(miniPath);
      const preview = nearestScale(mini, 2);
      drawText(output, 'NO 8-DIR SHEET - SAME-IDENTITY MINI FALLBACK', 390, y + 10, 1);
      checker(output, 390, y + 30, preview.w, preview.h);
      blit(output, preview, 390, y + 30);
    }
  }
  writeContact(name, output);
}

function propsContact(): void {
  const bench = load('assets/art/world/props/prop_waiting_bench.png');
  const ward = load('assets/art/world/props/prop_wardbed.png');
  const output = canvas(1320, 890);
  title(output, 'CH1 PROPS - NATIVE ASSET + NEAREST INSPECTION');
  const entries = [
    { id: 'prop_waiting_bench', image: bench, y: 64, previewScale: 4 },
    { id: 'prop_wardbed', image: ward, y: 230, previewScale: 2 },
  ] as const;
  for (const entry of entries) {
    const preview = nearestScale(entry.image, entry.previewScale);
    drawText(output, entry.id, 22, entry.y, 2);
    drawText(output, `NATIVE ${entry.image.w}x${entry.image.h}`, 22, entry.y + 28, 1);
    checker(output, 250, entry.y, entry.image.w, entry.image.h);
    blit(output, entry.image, 250, entry.y);
    drawText(output, `${entry.previewScale}X NEAREST - INSPECTION ONLY`, 600, entry.y, 1);
    checker(output, 600, entry.y + 20, preview.w, preview.h);
    blit(output, preview, 600, entry.y + 20);
  }
  writeContact('01_props_native.png', output);
}

function npcContact(): void {
  const ids = ['npc_borden', 'npc_realtor', 'npc_waitress'] as const;
  const sheets = ids.map((id) => ({ id, image: load(`assets/art/characters/${id}_anim_46_4x.png`) }));
  const output = canvas(1210, 1630);
  title(output, 'CH1 NPC SHEETS - NATIVE 384x1536 - 46 FRAMES OF 96x128');
  for (const [index, sheet] of sheets.entries()) {
    const x = 10 + index * 400;
    drawText(output, `${sheet.id}  ${sheet.image.w}x${sheet.image.h}`, x, 48, 1);
    checker(output, x, 72, sheet.image.w, sheet.image.h);
    blit(output, sheet.image, x, 72);
  }
  writeContact('10_npc_sheets_native.png', output);
}

function panelNativeContact(name: string, ids: readonly string[]): void {
  const output = canvas(1640, 42 + ids.length * 950);
  title(output, 'CH1 PANELS - NATIVE 1600x900');
  for (const [index, id] of ids.entries()) {
    const panel = load(`assets/art/cutscenes/ch1/${id}_4x.png`);
    const y = 48 + index * 950;
    drawText(output, `${id}_4x.png  ${panel.w}x${panel.h}`, 20, y, 2);
    blit(output, panel, 20, y + 30);
  }
  writeContact(name, output);
}

function sampleBilinear(source: Img, x: number, y: number, output: Uint8Array, offset: number): void {
  const x0 = Math.max(0, Math.min(source.w - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(source.h - 1, Math.floor(y)));
  const x1 = Math.min(source.w - 1, x0 + 1);
  const y1 = Math.min(source.h - 1, y0 + 1);
  const fx = Math.max(0, Math.min(1, x - x0));
  const fy = Math.max(0, Math.min(1, y - y0));
  const weights = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];
  const points = [y0 * source.w + x0, y0 * source.w + x1, y1 * source.w + x0, y1 * source.w + x1];
  for (let channel = 0; channel < 4; channel++) {
    let value = 0;
    for (let index = 0; index < 4; index++) value += source.data[points[index] * 4 + channel] * weights[index];
    output[offset + channel] = Math.round(value);
  }
}

function viewportCover(source: Img, w: number, h: number, zoom = 1.025): Img {
  const output = makeImg(w, h);
  const scale = Math.max(w / source.w, h / source.h) * zoom;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sourceX = (x + 0.5 - w / 2) / scale + source.w / 2 - 0.5;
      const sourceY = (y + 0.5 - h / 2) / scale + source.h / 2 - 0.5;
      sampleBilinear(source, sourceX, sourceY, output.data, (y * w + x) * 4);
    }
  }
  return output;
}

function panelCropContact(index: number, id: string): void {
  const panel = load(`assets/art/cutscenes/ch1/${id}_4x.png`);
  const desktop = viewportCover(panel, 1280, 720);
  const portrait = viewportCover(panel, 390, 844);
  const landscape = viewportCover(panel, 844, 390);
  const output = canvas(1320, 1740);
  title(output, `${id} - RUNTIME COVER CROPS AT 1.025X`);
  drawText(output, 'DESKTOP 1280x720', 20, 50, 1);
  blit(output, desktop, 20, 70);
  drawText(output, 'PHONE PORTRAIT 390x844', 20, 810, 1);
  blit(output, portrait, 20, 830);
  drawText(output, 'PHONE LANDSCAPE 844x390', 450, 810, 1);
  blit(output, landscape, 450, 830);
  writeContact(`${String(index).padStart(2, '0')}_panel_crops_${id}.png`, output);
}

function phaseArg(name: string): string | undefined {
  const prefix = `--phase-${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function phaseContact(): 'accepted-real-runtime-captures' | 'pending-real-runtime-captures' {
  const requested = [
    ['METEOR NIGHT', phaseArg('night')],
    ['HUSH MORNING', phaseArg('hush')],
    ['RESTORED DAY', phaseArg('restored')],
  ] as const;
  const supplied = requested.filter(([, path]) => path !== undefined);
  if (supplied.length === 0) return 'pending-real-runtime-captures';
  if (supplied.length !== requested.length) {
    throw new Error('phase contact requires all three real screenshots: night, hush, and restored');
  }
  const captures = requested.map(([label, path]) => ({ label, image: decodePng(readFileSync(resolve(ROOT, path!))) }));
  const width = Math.max(...captures.map(({ image }) => image.w)) + 40;
  const height = 42 + captures.reduce((sum, { image }) => sum + image.h + 45, 0);
  const output = canvas(width, height);
  title(output, 'CH1 LIVE STORY PHASES - REAL RUNTIME CAPTURES');
  let y = 52;
  for (const capture of captures) {
    drawText(output, `${capture.label}  ${capture.image.w}x${capture.image.h}`, 20, y, 2);
    y += 24;
    blit(output, capture.image, 20, y);
    y += capture.image.h + 21;
  }
  writeContact('23_phase_story_states_native.png', output);
  return 'accepted-real-runtime-captures';
}

function uiScopeContact(): void {
  const output = canvas(1200, 330);
  title(output, 'UI ITEM / QUEST RASTER CHANGE SCOPE');
  drawText(output, 'NO UI ITEM OR QUEST RASTER ASSETS CHANGED IN THIS PASS.', 30, 75, 2);
  drawText(output, 'CHANGED RASTER SCOPE:', 30, 125, 2);
  drawText(
    output,
    '- 2 TARGETED WORLD PROPS\n- 14 SAME-IDENTITY ENEMY MINI DERIVATIVES\n- 3 AUTHORED NPC WALK SHEETS\n- 3 CONTEXTUAL STORY PANELS',
    55,
    155,
    2,
  );
  writeContact('24_ui_item_quest_scope.png', output);
}

mkdirSync(OUT, { recursive: true });
propsContact();
battleContact('02_battles_seed_native.png', 'CH1 SEED ROSTER - BASE / WEAR 1 / WEAR 2', SEED);
battleContact('03_battles_expanded_a_native.png', 'CH1 EXPANDED ROSTER A - BASE / WEAR 1 / WEAR 2', EXPANDED.slice(0, 7).map((id) => [id, id] as const));
battleContact('04_battles_expanded_b_native.png', 'CH1 EXPANDED ROSTER B - BASE / WEAR 1 / WEAR 2', EXPANDED.slice(7).map((id) => [id, id] as const));
battleContact('05_battles_boss_native.png', 'CH1 BOSS ROSTER - BASE / WEAR 1 / WEAR 2', BOSSES);
fieldContact('06_fields_seed_native.png', 'CH1 SEED FIELD IDENTITY - MINI + NATIVE 8-DIR', SEED);
fieldContact('07_fields_expanded_a_native.png', 'CH1 EXPANDED FIELD IDENTITY A - MINI + NATIVE 8-DIR', EXPANDED.slice(0, 7).map((id) => [id, id] as const));
fieldContact('08_fields_expanded_b_native.png', 'CH1 EXPANDED FIELD IDENTITY B - MINI + NATIVE 8-DIR', EXPANDED.slice(7).map((id) => [id, id] as const));
fieldContact('09_fields_boss_native.png', 'CH1 BOSS FIELD IDENTITY - SAME-IDENTITY MINI', BOSSES);
npcContact();
for (let page = 0; page < 4; page++) panelNativeContact(`${11 + page}_panels_native_${String.fromCharCode(97 + page)}.png`, PANELS.slice(page * 2, page * 2 + 2));
for (const [index, id] of PANELS.entries()) panelCropContact(15 + index, id);
const phaseStatus = phaseContact();
uiScopeContact();

const phaseSources = [
  ['meteor-night', phaseArg('night')],
  ['hush-morning', phaseArg('hush')],
  ['restored-day', phaseArg('restored')],
].flatMap(([phase, path]) => path ? [{ phase, ...fileEvidence(path) }] : []);
const npcWalkProvenanceFile = 'assets/art/masters/generated/ch1-expanded/npc-walk-atlas-provenance.json';
const npcWalkProvenanceBytes = readFileSync(resolve(ROOT, npcWalkProvenanceFile));
const npcWalkProvenance = JSON.parse(npcWalkProvenanceBytes.toString('utf8')) as {
  rebuildCommand: string;
  npcs: Array<{
    id: string;
    atlasSource: string;
    runtime: string;
    acceptedMaster: string;
    review: string;
  }>;
};

const manifest = {
  schema: 2,
  generatedBy: 'tools/ch1-asset-contacts.ts',
  nativeDetailPolicy: 'Battle, field, NPC, prop, and panel sources are never downscaled on native contacts. Viewport pages are separately labeled runtime cover resamples.',
  roster: {
    seed: SEED.map(([id]) => id),
    expanded: [...EXPANDED],
    bosses: BOSSES.map(([id]) => id),
  },
  phaseStoryStates: {
    status: phaseStatus,
    required: ['meteor-night', 'hush-morning', 'restored-day'],
    sources: phaseSources,
    note: phaseStatus === 'pending-real-runtime-captures'
      ? 'Supply all three --phase-* screenshot arguments. Synthetic tint evidence is intentionally rejected.'
      : 'Contact 23 contains real runtime captures supplied to the generator.',
  },
  npcWalkCycles: {
    provenance: {
      file: npcWalkProvenanceFile,
      sha256: createHash('sha256').update(npcWalkProvenanceBytes).digest('hex'),
    },
    rebuildCommand: npcWalkProvenance.rebuildCommand,
    evidence: npcWalkProvenance.npcs.map((entry) => ({
      id: entry.id,
      atlasSource: fileEvidence(entry.atlasSource),
      runtime: fileEvidence(entry.runtime),
      acceptedMaster: fileEvidence(entry.acceptedMaster),
      review: fileEvidence(entry.review),
    })),
  },
  canon: {
    titanicTick: 'The Titanic Tick encounter is in the active Hickory Hill cave. Panel contacts use filenames only and make no outdoor-location claim.',
  },
  uiItemQuestRasterScope: 'No UI item or quest raster assets changed in this pass.',
  contacts: written,
};
writeFileSync(resolve(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const readme = `# Chapter 1 asset contacts\n\n`
  + `Generated by \`npx tsx tools/ch1-asset-contacts.ts\`. Native contacts preserve source pixels 1:1; only the separately labeled viewport pages resample panels to the exact review viewport.\n\n`
  + `Coverage: repaired props; complete seed, expanded, and boss battle/wear roster; same-identity minis and all available 8-direction sheets; the three Chapter 1 NPC sheets; every Chapter 1 panel at native size and at desktop/phone cover crops; and the explicitly empty UI item/quest raster change scope.\n\n`
  + `Story-phase state: **${phaseStatus}**. The generator accepts only real runtime screenshots via \`--phase-night\`, \`--phase-hush\`, and \`--phase-restored\`; it will not manufacture evidence by tinting a still.\n\n`
  + `Canon note: the Titanic Tick encounter is in the active Hickory Hill cave. These contacts do not label its reveal as Heart Oak, Pond Park, or any other outdoor location.\n`;
writeFileSync(resolve(OUT, 'README.md'), readme);
console.log(`wrote manifest.json and README.md (phase status: ${phaseStatus})`);
