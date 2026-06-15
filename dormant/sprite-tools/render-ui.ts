import { mkdirSync, writeFileSync } from 'node:fs';
import {
  WINDOW_FLAVORS,
  drawBoxSlice,
  drawDpad,
  drawHandCursor,
  drawLocketPauseFrame,
  drawLocketState,
  drawOdometerStrip,
  drawPhoneIcon,
  drawRoundButton,
  drawStartPill,
  drawSunIcon,
  drawWindowSlice,
  LOCKET_MAX_EMBERS,
} from '../../src/spritegen/ui';
import { RAMP } from '../../src/palette';
import { EMOJI_GLYPH, EMOJI_GLYPH_NAMES, makeFontPixmap, makeGlyphPixmap } from '../../src/spritegen/font';
import { SCRIPT_CATALOG, scriptBannerRun, type ScriptFamily } from '../../src/spritegen/glyphforge';
import { pixmapToPng } from './png';

const UI_DIR = 'assets/art/ui';
const BANNER_DIR = `${UI_DIR}/banners`;
const FONT_DIR = `${UI_DIR}/font`;
const LOCKET_DIR = `${UI_DIR}/locket`;

const BANNER_SCRIPTS = [
  'accent',
  'barscript',
  'colonial',
  'cursive',
  'deco',
  'fraktur',
  'frost',
  'heraldic',
  'hush',
  'ramp',
  'runic',
  'seal',
  'slavonic',
  'talavera',
  'tiki',
] as const satisfies readonly ScriptFamily[];

function write(path: string, bytes: Uint8Array): void {
  writeFileSync(path, bytes);
  console.log(`wrote ${path}`);
}

function main(): void {
  mkdirSync(UI_DIR, { recursive: true });
  mkdirSync(BANNER_DIR, { recursive: true });
  mkdirSync(FONT_DIR, { recursive: true });
  mkdirSync(LOCKET_DIR, { recursive: true });

  WINDOW_FLAVORS.forEach((_, i) => write(`${UI_DIR}/${i === 0 ? 'win9' : `win9_${i}`}.png`, pixmapToPng(drawWindowSlice(i))));
  write(`${UI_DIR}/box9.png`, pixmapToPng(drawBoxSlice()));
  write(`${UI_DIR}/odo.png`, pixmapToPng(drawOdometerStrip()));
  write(`${UI_DIR}/dpad.png`, pixmapToPng(drawDpad()));
  write(`${UI_DIR}/btn_a.png`, pixmapToPng(drawRoundButton('A', RAMP.RED)));
  write(`${UI_DIR}/btn_b.png`, pixmapToPng(drawRoundButton('B', RAMP.BLUE)));
  write(`${UI_DIR}/btn_x.png`, pixmapToPng(drawRoundButton('X', RAMP.GRASS)));
  write(`${UI_DIR}/btn_y.png`, pixmapToPng(drawRoundButton('Y', RAMP.GOLD)));
  write(`${UI_DIR}/btn_start.png`, pixmapToPng(drawStartPill()));
  write(`${UI_DIR}/hand.png`, pixmapToPng(drawHandCursor()));
  write(`${UI_DIR}/phone_icon.png`, pixmapToPng(drawPhoneIcon()));
  write(`${UI_DIR}/sun_icon.png`, pixmapToPng(drawSunIcon()));

  write(`${FONT_DIR}/fontsheet.png`, pixmapToPng(makeFontPixmap()));
  for (const [emoji, glyph] of Object.entries(EMOJI_GLYPH)) {
    const name = EMOJI_GLYPH_NAMES[emoji] ?? `u${emoji.codePointAt(0)?.toString(16) ?? 'unknown'}`;
    write(`${FONT_DIR}/emoji_${name}.png`, pixmapToPng(makeGlyphPixmap(glyph)));
  }

  const catalog = new Set<ScriptFamily>(SCRIPT_CATALOG);
  for (const script of BANNER_SCRIPTS) {
    if (!catalog.has(script)) throw new Error(`missing glyph script '${script}'`);
    write(`${BANNER_DIR}/${script}.png`, pixmapToPng(scriptBannerRun(script)));
  }

  write(`${LOCKET_DIR}/pause_frame.png`, pixmapToPng(drawLocketPauseFrame()));
  for (let i = 0; i <= LOCKET_MAX_EMBERS; i++) {
    write(`${LOCKET_DIR}/locket_${i}.png`, pixmapToPng(drawLocketState(i)));
  }

  console.log(`exported ${WINDOW_FLAVORS.length + 11} UI chrome PNGs`);
  console.log(`exported ${Object.keys(EMOJI_GLYPH).length + 1} font PNGs`);
  console.log(`exported ${BANNER_SCRIPTS.length} banner PNGs`);
  console.log(`exported ${LOCKET_MAX_EMBERS + 2} locket PNGs`);
}

main();
