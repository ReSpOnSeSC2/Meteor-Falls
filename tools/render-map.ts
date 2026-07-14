/**
 * Top-down SCHEMATIC map renderer (design-review aid, NOT runtime art).
 *
 * Reads the real MapDef grids out of src/data and paints each map from a
 * tile-category colour legend, then overlays the gameplay annotations a
 * designer cares about: building footprints, doors, NPCs, phones, enemy
 * spawners and story triggers. Composites a labelled contact sheet to
 * output/<name>.png. This is a planning visual only — it does not touch the
 * authored-PNG art pipeline (CLAUDE.md) and never ships in the game.
 */
import { MAPS, CHAR_LEGEND } from '../src/data/maps';
import { makeImg, encodePng, type Img } from './imageio';
import { writeFileSync, mkdirSync } from 'node:fs';

const TILE = 16;

/* ---------------- 5x7 label font ---------------- */
const FONT: Record<string, string[]> = {
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01111'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  J:['00111','00010','00010','00010','00010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','11011','10001'],
  X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  Z:['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'],
  '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00110','01000','10000','11111'],
  '3':['11110','00001','00001','01110','00001','00001','11110'],
  '4':['00010','00110','01010','10010','11111','00010','00010'],
  '5':['11111','10000','11110','00001','00001','10001','01110'],
  '6':['00110','01000','10000','11110','10001','10001','01110'],
  '7':['11111','00001','00010','00100','01000','01000','01000'],
  '8':['01110','10001','10001','01110','10001','10001','01110'],
  '9':['01110','10001','10001','01111','00001','00010','01100'],
  ' ':['00000','00000','00000','00000','00000','00000','00000'],
  '-':['00000','00000','00000','11111','00000','00000','00000'],
  '.':['00000','00000','00000','00000','00000','01100','01100'],
  ',':['00000','00000','00000','00000','00000','00100','01000'],
  '&':['01100','10010','10010','01100','10011','10010','01101'],
  "'":['00100','00100','01000','00000','00000','00000','00000'],
  ':':['00000','01100','01100','00000','01100','01100','00000'],
  '/':['00001','00010','00010','00100','01000','01000','10000'],
  '(':['00010','00100','01000','01000','01000','00100','00010'],
  ')':['01000','00100','00010','00010','00010','00100','01000'],
};

type RGB = [number, number, number];
function px(img: Img, x: number, y: number, c: RGB, a = 1) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  if (a >= 1) { img.data[i] = c[0]; img.data[i+1] = c[1]; img.data[i+2] = c[2]; img.data[i+3] = 255; return; }
  img.data[i]   = Math.round(img.data[i]   * (1-a) + c[0]*a);
  img.data[i+1] = Math.round(img.data[i+1] * (1-a) + c[1]*a);
  img.data[i+2] = Math.round(img.data[i+2] * (1-a) + c[2]*a);
  img.data[i+3] = 255;
}
function fillRect(img: Img, x: number, y: number, w: number, h: number, c: RGB, a = 1) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(img, xx, yy, c, a);
}
function strokeRect(img: Img, x: number, y: number, w: number, h: number, c: RGB) {
  for (let xx = x; xx < x + w; xx++) { px(img, xx, y, c); px(img, xx, y + h - 1, c); }
  for (let yy = y; yy < y + h; yy++) { px(img, x, yy, c); px(img, x + w - 1, yy, c); }
}
function text(img: Img, s: string, x: number, y: number, c: RGB, sc = 1) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] ?? FONT[' '];
    for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++)
      if (g[r][col] === '1') fillRect(img, cx + col*sc, y + r*sc, sc, sc, c);
    cx += 6 * sc;
  }
}
function textW(s: string, sc = 1) { return s.length * 6 * sc; }

/* ---------------- tile -> colour ---------------- */
function tileColor(name: string): RGB {
  const n = name;
  if (n.startsWith('grass')) return [74, 122, 58];
  if (n.startsWith('flowers')) return [120, 150, 70];
  if (n === 'bush') return [40, 82, 42];
  if (n.startsWith('fence')) return [120, 96, 60];
  if (n.startsWith('scorch')) return n.includes('ember') ? [110, 40, 30] : [55, 45, 45];
  if (n.startsWith('sky')) return [150, 195, 230];
  if (n === 'brick') return [110, 70, 60];
  if (n.startsWith('sea')) return [56, 104, 168];
  if (n === 'dock') return [120, 92, 56];
  if (n === 'sand_a' || n === 'plaza') return [206, 190, 140];
  if (n.startsWith('jungle')) return n.includes('wall') ? [24, 60, 30] : [46, 92, 46];
  if (n.startsWith('pyramid')) return n.includes('wall') ? [150, 120, 78] : [196, 170, 118];
  if (n === 'fairway') return [96, 152, 70];
  if (n === 'sidewalk' || n.startsWith('sidewalk')) return [176, 176, 180];
  if (n === 'road' || n === 'road_dash' || n.startsWith('road')) return [70, 72, 78];
  if (n === 'crosswalk') return [210, 210, 210];
  if (n === 'parking') return [96, 98, 104];
  if (n.startsWith('storm')) return [60, 62, 66];
  if (n.startsWith('asphalt')) return [84, 86, 92];
  if (n === 'cage_mesh') return [140, 140, 146];
  if (n.startsWith('floor') || n === 'rug' || n.includes('office_floor') || n.includes('arcade_floor')) return [150, 120, 86];
  if (n.includes('wall')) return [80, 60, 46];
  if (n === 'cubicle' || n === 'cubicle_desk') return [120, 110, 92];
  if (n.startsWith('bus')) return [110, 112, 118];
  return [90, 110, 80];
}
function charColor(ch: string): RGB {
  if (ch === ':') return [184, 160, 106]; // path
  const name = CHAR_LEGEND[ch];
  if (!name) return [74, 122, 58];
  return tileColor(name);
}

/* ---------------- one map cell ---------------- */
const C_BUILD: RGB = [60, 48, 60];
const C_DOOR: RGB = [255, 214, 60];
const C_NPC: RGB = [240, 240, 250];
const C_PHONE: RGB = [80, 220, 220];
const C_SPAWN: RGB = [220, 70, 70];
const C_TRIG: RGB = [180, 90, 220];
const C_BG: RGB = [20, 22, 28];
const C_BAR: RGB = [38, 42, 52];
const C_TXT: RGB = [235, 235, 240];

function renderMap(mapId: string, scale: number): Img {
  const m = MAPS[mapId];
  const gw = m.grid[0].length, gh = m.grid.length;
  const img = makeImg(gw * scale, gh * scale);
  // ground
  for (let y = 0; y < gh; y++) {
    const row = m.grid[y];
    for (let x = 0; x < gw; x++) fillRect(img, x*scale, y*scale, scale, scale, charColor(row[x] ?? '.'));
  }
  // props (buildings = solid footprints; trees = green blobs)
  for (const p of m.props) {
    if (p.solid) {
      const fx = Math.round((p.x*TILE + p.solid.ox) / TILE * scale);
      const fy = Math.round((p.y*TILE + p.solid.oy) / TILE * scale);
      const fw = Math.max(scale, Math.round(p.solid.w / TILE * scale));
      const fh = Math.max(scale, Math.round(p.solid.h / TILE * scale));
      const isTree = /tree|pine|hedge|bush|rock|boulder/i.test(p.sprite);
      fillRect(img, fx, fy, fw, fh, isTree ? [34, 74, 38] : C_BUILD, isTree ? 0.85 : 1);
      if (!isTree) strokeRect(img, fx, fy, fw, fh, [150, 130, 150]);
    }
  }
  // spawners (enemy zones)
  for (const s of m.spawners) strokeRect(img, s.rect.x*scale, s.rect.y*scale, s.rect.w*scale, s.rect.h*scale, C_SPAWN);
  // triggers (story)
  for (const t of m.triggers) strokeRect(img, t.rect.x*scale, t.rect.y*scale, t.rect.w*scale, t.rect.h*scale, C_TRIG);
  // doors
  for (const d of m.doors) { fillRect(img, Math.round(d.x*scale), Math.round(d.y*scale), Math.max(scale, d.w*scale), Math.max(scale, d.h*scale), C_DOOR); }
  for (const p of m.props) if (p.door) {
    const dx = Math.round((p.x*TILE + p.door.ox)/TILE*scale), dy = Math.round((p.y*TILE + p.door.oy)/TILE*scale);
    fillRect(img, dx, dy, Math.max(scale, Math.round(p.door.w/TILE*scale)), Math.max(scale, Math.round(p.door.h/TILE*scale)), C_DOOR);
  }
  // phones
  for (const ph of m.phones) fillRect(img, Math.round(ph.x*scale), Math.round(ph.y*scale), Math.max(2, scale), Math.max(2, scale), C_PHONE);
  // npcs
  for (const npc of m.npcs) { const cx = Math.round(npc.x*scale), cy = Math.round(npc.y*scale); fillRect(img, cx, cy, Math.max(2, scale-1), Math.max(2, scale-1), C_NPC); }
  return img;
}

function blit(dst: Img, src: Img, ox: number, oy: number) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const di = ((oy+y)*dst.w + (ox+x))*4, si = (y*src.w + x)*4;
    if (ox+x<0||oy+y<0||ox+x>=dst.w||oy+y>=dst.h) continue;
    dst.data[di]=src.data[si]; dst.data[di+1]=src.data[si+1]; dst.data[di+2]=src.data[si+2]; dst.data[di+3]=255;
  }
}

/* ---------------- contact sheet ---------------- */
function contactSheet(title: string, ids: string[], cellW: number, cellMaxH: number): Img {
  const PAD = 24, BAR = 30, GAP = 18, COLS = 2;
  const cells = ids.map(id => {
    const m = MAPS[id];
    const gw = m.grid[0].length, gh = m.grid.length;
    const inner = cellW - 12;
    const sc = Math.max(2, Math.min(Math.floor(inner / gw), Math.floor(cellMaxH / gh)));
    const img = renderMap(id, sc);
    return { id, name: m.name, img };
  });
  const colW = cellW;
  const rowH: number[] = [];
  for (let r = 0; r*COLS < cells.length; r++) {
    let h = 0; for (let c = 0; c < COLS; c++) { const cell = cells[r*COLS+c]; if (cell) h = Math.max(h, BAR + cell.img.h + 8); }
    rowH.push(h);
  }
  const sheetW = PAD*2 + colW*COLS + GAP*(COLS-1);
  const headH = 64;
  const sheetH = PAD*2 + headH + rowH.reduce((a,b)=>a+b+GAP, 0) + 40;
  const sheet = makeImg(sheetW, sheetH);
  fillRect(sheet, 0, 0, sheetW, sheetH, C_BG);
  text(sheet, title, PAD, PAD, C_TXT, 3);
  // legend
  const ly = PAD + 30;
  const leg: [string, RGB][] = [['BUILDING', C_BUILD],['DOOR/EXIT', C_DOOR],['NPC', C_NPC],['PHONE(SAVE)', C_PHONE],['ENEMY ZONE', C_SPAWN],['STORY TRIGGER', C_TRIG]];
  let lx = PAD;
  for (const [lbl, col] of leg) { fillRect(sheet, lx, ly, 14, 14, col); strokeRect(sheet, lx, ly, 14, 14, [200,200,200]); text(sheet, lbl, lx+20, ly+3, C_TXT, 1); lx += 24 + textW(lbl,1) + 18; }
  // cells
  let y = PAD + headH;
  for (let r = 0; r*COLS < cells.length; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r*COLS+c]; if (!cell) continue;
      const x = PAD + c*(colW+GAP);
      fillRect(sheet, x, y, colW, BAR + cell.img.h + 8, [28,30,38]);
      fillRect(sheet, x, y, colW, BAR, C_BAR);
      const label = `${cell.name}  (${cell.id})`;
      const labelScale = textW(label, 2) <= colW - 16 ? 2 : 1;
      text(sheet, label, x+8, y + (labelScale === 2 ? 8 : 11), C_TXT, labelScale);
      const imgX = x + Math.floor((colW - cell.img.w)/2);
      blit(sheet, cell.img, Math.max(x+4, imgX), y + BAR + 4);
    }
    y += rowH[r] + GAP;
  }
  return sheet;
}

/* ---------------- CLI ---------------- */
const arg = process.argv[2] ?? 'ch1';
mkdirSync('output', { recursive: true });

const SETS: Record<string, { title: string; ids: string[]; cellW: number; cellH: number }> = {
  ch1: {
    title: 'METEOR FALLS - CHAPTER 1: THE NIGHT IT FELL (USA)',
    ids: ['otterbrook','oak_roots','oak_hollow','oak_heart','meadow_mile','meadow_woods','meadow_far','meadow_overpass','brickton','cage_park','dos_f1','dos_f2','dos_f3'],
    cellW: 560, cellH: 460,
  },
  hotel: {
    title: 'OTTERBROOKE HOTEL - LOBBY, GUEST FLOOR, AND ROOMS',
    ids: ['otter_hotel_lobby', 'otter_hotel_hall', 'otter_hotel_room_201', 'otter_hotel_room_202', 'otter_hotel_room_203'],
    cellW: 560, cellH: 420,
  },
  otter_interiors: {
    title: 'OTTERBROOKE - PUBLIC INTERIOR FRONT AND BACK ROOMS',
    ids: [
      'bank_int', 'bank_vault',
      'hardware_int', 'hardware_stockroom',
      'diner_int', 'diner_kitchen',
      'drugstore_int', 'drugstore_pharmacy',
      'arcade_int', 'arcade_service',
      'otter_clinic_int', 'otter_clinic_exam',
    ],
    cellW: 560, cellH: 380,
  },
  ch2: {
    title: 'METEOR FALLS - CHAPTER 2: THE MELTING GRIN (PUERTO SOL + LAS DUNAS)',
    // Route order is intentional: the sheet audits every playable handoff from
    // the Brickton pier through Puerto Sol and both desert legs before Valle.
    ids: [
      'brickton_docks', 'boat_interior', 'puerto_sol',
      'jungle_1', 'dunas_waystation', 'jungle_2', 'grotto',
      'valle_dorado', 'costa_estrella',
    ],
    cellW: 560, cellH: 460,
  },
  ch3: {
    title: 'METEOR FALLS - CHAPTER 3: A VERY FOGGY TERM (ENGLAND)',
    // Canonical route roster, including Lucille, Kettle rooms, every academy
    // floor, the dormitory branch, and the boiler works. Keeping the interiors
    // on this sheet prevents a polished exterior from hiding placeholder rooms.
    ids: [
      'biplane_interior', 'foggybottom', 'kettle_taproom', 'kettle_snug',
      'foggy_moor', 'wintermoor_grounds', 'the_old_stones',
      'wintermoor_f1', 'wintermoor_f2', 'wintermoor_f3',
      'wintermoor_dorm', 'wintermoor_boiler',
    ],
    cellW: 560, cellH: 460,
  },
  ch4: {
    title: 'METEOR FALLS - CHAPTER 4: THE FJORD THAT SLEEPS (NORWAY)',
    // Route order keeps the human-scale harbor, scale-reveal moor, giant town,
    // and all three body-as-landscape dungeon maps visible in one audit sheet.
    ids: [
      'kvisthavn', 'bootstep_moor', 'lilleby',
      'spine_hand', 'spine_shoulder', 'spine_ear',
      'kvisthavn_unit_0', 'kvisthavn_unit_1', 'kvisthavn_unit_2', 'kvisthavn_unit_3',
    ],
    cellW: 560, cellH: 460,
  },
  ch5: {
    title: 'METEOR FALLS - CHAPTER 5: THE GRAND DUCHY OF MINIMUS',
    ids: [
      'minimus_major', 'procession_way', 'the_hedgerow', 'ducal_crown',
      'minimus_major_unit_0', 'minimus_major_unit_1', 'minimus_major_unit_2',
      'minimus_major_unit_3', 'minimus_major_unit_4', 'minimus_major_unit_5',
    ],
    cellW: 560, cellH: 460,
  },
  ch6: {
    title: 'METEOR FALLS - CHAPTER 6: THE RUINS THAT LAUGH (ZANZIBEL)',
    // The four production exteriors plus every live generated unit. Historical
    // units 0..4 remain visible while the expanded city tenancy is audited too.
    ids: [
      'zanzibel', 'savanna_run', 'laughing_ruins', 'sphinx_chin',
      ...Array.from({ length: 14 }, (_, index) => `zanzibel_unit_${index}`),
    ],
    cellW: 560, cellH: 460,
  },
  ch7: {
    title: "METEOR FALLS - CHAPTER 7: THE COBRA'S PALACE (INDIA)",
    // Keep the city tenancy portion data-driven: production promotion can add
    // supported lots without making this review sheet silently omit interiors.
    // Numeric sorting preserves the historical unit_0..3 review order.
    ids: [
      'chandrapore', 'monsoon_road', 'night_train', 'palace_throne',
      ...Object.keys(MAPS)
        .filter((id) => /^chandrapore_unit_\d+$/.test(id))
        .sort((a, b) => Number(a.slice(a.lastIndexOf('_') + 1)) - Number(b.slice(b.lastIndexOf('_') + 1))),
    ],
    cellW: 560, cellH: 460,
  },
  ch8: {
    title: 'METEOR FALLS - CHAPTER 8: THE PAPER DRAGON (CHINA)',
    // The four production maps lead the sheet. Lotus tenancy is discovered from
    // the assembled registry so appended unit_4+ interiors can never disappear
    // from design review; numeric sorting preserves the historical 0..3 prefix.
    ids: [
      'lotus_harbor', 'bamboo_road', 'spore_forest', 'mt_shu_temple',
      'citysvc_lotus_harbor_hotel_room',
      ...Object.keys(MAPS)
        .filter((id) => /^lotus_harbor_unit_\d+$/.test(id))
        .sort((a, b) => Number(a.slice(a.lastIndexOf('_') + 1)) - Number(b.slice(b.lastIndexOf('_') + 1))),
    ],
    cellW: 560, cellH: 460,
  },
  formal_cities: {
    title: 'FORMAL CITIES - PRODUCTION FACADE SCALE QA',
    ids: ['brickton', 'puerto_sol', 'valle_dorado', 'minimus_major', 'zanzibel', 'chandrapore', 'lotus_harbor'],
    cellW: 560, cellH: 460,
  },
  elev: {
    title: 'WORLD OVERHAUL - ELEVATION ENGINE SPIKE (P2)',
    ids: ['elev_spike'],
    cellW: 560, cellH: 460,
  },
};

const set = SETS[arg];
if (!set) { console.error('unknown set', arg); process.exit(1); }
const img = contactSheet(set.title, set.ids.filter(id => MAPS[id]), set.cellW, set.cellH);
const out = `output/maps_${arg}.png`;
writeFileSync(out, encodePng(img));
console.log('wrote', out, img.w + 'x' + img.h);
