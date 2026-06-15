import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { C, RAMP, px } from '../src/palette';
import { Pixmap, mulberry32 } from '../src/spritegen/pixmap';
import { drawLogo, scalePixmap } from '../src/spritegen/ui';
import { drawTextInto } from '../src/spritegen/font';
import { pixmapToPng } from './png';

const W = 400;
const H = 225;

type Visual =
  | 'meteor'
  | 'town'
  | 'hill'
  | 'prophecy'
  | 'boss'
  | 'heartlight'
  | 'zapper'
  | 'phone'
  | 'boat'
  | 'port'
  | 'village'
  | 'pyramid'
  | 'greenhouse'
  | 'academy'
  | 'stones'
  | 'machine'
  | 'plane'
  | 'fjord'
  | 'giants'
  | 'sleeper'
  | 'ear'
  | 'minimus'
  | 'duchess'
  | 'cat'
  | 'savanna'
  | 'market'
  | 'ruins'
  | 'sphinx'
  | 'train'
  | 'city'
  | 'palace'
  | 'cobra'
  | 'riverboat'
  | 'forest'
  | 'temple'
  | 'dragon'
  | 'village9'
  | 'castle'
  | 'monastery'
  | 'hoaxula'
  | 'snow'
  | 'station'
  | 'volcano'
  | 'rocket'
  | 'mars'
  | 'calling'
  | 'pray'
  | 'confirm'
  | 'homesong'
  | 'hush'
  | 'credits';

interface Beat {
  chapter: string;
  beat: string;
  visual: Visual;
}

const CUTSCENE_BEATS: Beat[] = [
  { chapter: 'ch1', beat: 'meteor_2am', visual: 'meteor' },
  { chapter: 'ch1', beat: 'otterbrook_at_night', visual: 'town' },
  { chapter: 'ch1', beat: 'hickory_hill', visual: 'hill' },
  { chapter: 'ch1', beat: 'glints_prophecy', visual: 'prophecy' },
  { chapter: 'ch1', beat: 'titanic_tick_reveal', visual: 'boss' },
  { chapter: 'ch1', beat: 'first_heartlight', visual: 'heartlight' },
  { chapter: 'ch1', beat: 'bug_zapper', visual: 'zapper' },
  { chapter: 'ch1', beat: 'moms_payphone_call', visual: 'phone' },

  { chapter: 'ch2', beat: 'banana_boat_to_puerto_sol', visual: 'boat' },
  { chapter: 'ch2', beat: 'puerto_sol_arrival', visual: 'port' },
  { chapter: 'ch2', beat: 'valle_dorado_wishers', visual: 'village' },
  { chapter: 'ch2', beat: 'llama_jungle_paths', visual: 'forest' },
  { chapter: 'ch2', beat: 'rotating_step_pyramid', visual: 'pyramid' },
  { chapter: 'ch2', beat: 'gilded_grin_reveal', visual: 'boss' },
  { chapter: 'ch2', beat: 'pyramid_apex_heartlight', visual: 'heartlight' },

  { chapter: 'ch3', beat: 'lucille_to_wintermoor', visual: 'plane' },
  { chapter: 'ch3', beat: 'milo_greenhouse_crash', visual: 'greenhouse' },
  { chapter: 'ch3', beat: 'wintermoor_machine_fog', visual: 'academy' },
  { chapter: 'ch3', beat: 'porter_first_borrow', visual: 'prophecy' },
  { chapter: 'ch3', beat: 'old_stones_resonance', visual: 'stones' },
  { chapter: 'ch3', beat: 'headmaster_mainframe', visual: 'machine' },
  { chapter: 'ch3', beat: 'heartlight_3_machine_fog_lifts', visual: 'heartlight' },

  { chapter: 'ch4', beat: 'lucille_north_sea_hop', visual: 'plane' },
  { chapter: 'ch4', beat: 'kvisthavn_under_cliffs', visual: 'fjord' },
  { chapter: 'ch4', beat: 'bootstep_moor_growth', visual: 'giants' },
  { chapter: 'ch4', beat: 'lilleby_giants_kneel', visual: 'giants' },
  { chapter: 'ch4', beat: 'sleeper_spine_crossing', visual: 'sleeper' },
  { chapter: 'ch4', beat: 'whisperwig_reveal', visual: 'ear' },
  { chapter: 'ch4', beat: 'heartlight_4_deep_hum', visual: 'heartlight' },

  { chapter: 'ch5', beat: 'grand_duchy_travel_in', visual: 'minimus' },
  { chapter: 'ch5', beat: 'minimus_major_tabletop_capital', visual: 'minimus' },
  { chapter: 'ch5', beat: 'pippa_matchbox_briefing', visual: 'duchess' },
  { chapter: 'ch5', beat: 'big_little_lens_build', visual: 'prophecy' },
  { chapter: 'ch5', beat: 'whiskerzilla_knighted', visual: 'cat' },
  { chapter: 'ch5', beat: 'pippa_joins_party', visual: 'duchess' },
  { chapter: 'ch5', beat: 'heartlight_5_bell_choir', visual: 'heartlight' },

  { chapter: 'ch6', beat: 'caravan_to_zanzibel', visual: 'savanna' },
  { chapter: 'ch6', beat: 'zanzibel_market', visual: 'market' },
  { chapter: 'ch6', beat: 'savanna_caravan_at_dusk', visual: 'savanna' },
  { chapter: 'ch6', beat: 'laughing_ruins', visual: 'ruins' },
  { chapter: 'ch6', beat: 'courier_teaches_teleport_alpha', visual: 'prophecy' },
  { chapter: 'ch6', beat: 'laughing_sphinx_riddle', visual: 'sphinx' },
  { chapter: 'ch6', beat: 'sphinx_chin_resonance', visual: 'heartlight' },

  { chapter: 'ch7', beat: 'night_train_to_chandrapore', visual: 'train' },
  { chapter: 'ch7', beat: 'chandrapore_bazaars', visual: 'city' },
  { chapter: 'ch7', beat: 'cinema_about_the_party', visual: 'city' },
  { chapter: 'ch7', beat: 'locket_train_heist', visual: 'train' },
  { chapter: 'ch7', beat: 'royal_vivarium_palace', visual: 'palace' },
  { chapter: 'ch7', beat: 'cobra_raja_reveal', visual: 'cobra' },
  { chapter: 'ch7', beat: 'palace_throne_resonance', visual: 'heartlight' },

  { chapter: 'ch8', beat: 'riverboat_to_lotus_harbor', visual: 'riverboat' },
  { chapter: 'ch8', beat: 'lotus_harbor_arrival', visual: 'port' },
  { chapter: 'ch8', beat: 'spore_forest_scramble', visual: 'forest' },
  { chapter: 'ch8', beat: 'yak_express_to_mt_shu', visual: 'giants' },
  { chapter: 'ch8', beat: 'paper_guardians_false_folds', visual: 'temple' },
  { chapter: 'ch8', beat: 'paper_dragon_reveal', visual: 'dragon' },
  { chapter: 'ch8', beat: 'temple_bell_resonance', visual: 'heartlight' },

  { chapter: 'ch9', beat: 'orient_less_express_to_valea', visual: 'train' },
  { chapter: 'ch9', beat: 'valea_stelelor_arrival', visual: 'village9' },
  { chapter: 'ch9', beat: 'buni_feast_basket', visual: 'village9' },
  { chapter: 'ch9', beat: 'castle_hoaxula', visual: 'castle' },
  { chapter: 'ch9', beat: 'trial_of_the_mute_mountain', visual: 'monastery' },
  { chapter: 'ch9', beat: 'count_hoaxula_unmasked', visual: 'hoaxula' },
  { chapter: 'ch9', beat: 'monastery_bell_tower_resonance', visual: 'heartlight' },

  { chapter: 'ch10', beat: 'snowcat_run_to_aurora_station', visual: 'snow' },
  { chapter: 'ch10', beat: 'aurora_station_decodes_mars', visual: 'station' },
  { chapter: 'ch10', beat: 'frost_sentinel', visual: 'boss' },
  { chapter: 'ch10', beat: 'mauna_lani_parts_run', visual: 'volcano' },
  { chapter: 'ch10', beat: 'tiki_magma_golem', visual: 'boss' },
  { chapter: 'ch10', beat: 'phone_dad_phone_mom', visual: 'phone' },
  { chapter: 'ch10', beat: 'the_long_shot_launch', visual: 'rocket' },
  { chapter: 'ch10', beat: 'sea_of_silence_arrival', visual: 'mars' },
  { chapter: 'ch10', beat: 'the_calling_worldwide_phones', visual: 'calling' },
  { chapter: 'ch10', beat: 'mia_prays', visual: 'pray' },
  { chapter: 'ch10', beat: 'player_name_confirm', visual: 'confirm' },
  { chapter: 'ch10', beat: 'homesong_full', visual: 'homesong' },
  { chapter: 'ch10', beat: 'hush_undone', visual: 'hush' },
  { chapter: 'ch10', beat: 'extended_credits', visual: 'credits' },
];

function save(rel: string, pm: Pixmap): void {
  const out = join(process.cwd(), rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, pixmapToPng(pm));
  console.log(rel);
}

function sky(pm: Pixmap, top: number, mid: number, low: number): void {
  pm.rect(0, 0, pm.w, pm.h, top);
  pm.rect(0, Math.floor(pm.h * 0.42), pm.w, Math.ceil(pm.h * 0.34), mid);
  pm.rect(0, Math.floor(pm.h * 0.72), pm.w, Math.ceil(pm.h * 0.28), low);
}

function stars(pm: Pixmap, seed: number, count = 70): void {
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rng() * pm.w);
    const y = Math.floor(rng() * pm.h * 0.58);
    pm.set(x, y, rng() > 0.82 ? C.white : px(RAMP.NIGHT, 3));
  }
}

function hills(pm: Pixmap, ramp: number, yBase = 160): void {
  for (let x = 0; x < pm.w; x++) {
    const y = Math.floor(yBase - Math.sin((x / pm.w) * Math.PI * 2.2) * 18 - Math.sin((x / pm.w) * Math.PI * 4.8) * 7);
    pm.vline(x, y, pm.h - y, px(ramp, 0));
  }
}

function water(pm: Pixmap, y: number): void {
  pm.rect(0, y, pm.w, pm.h - y, px(RAMP.CYAN, 0));
  for (let yy = y + 8; yy < pm.h; yy += 12) {
    for (let x = (yy / 4) % 18; x < pm.w; x += 36) pm.hline(Math.floor(x), yy, 20, px(RAMP.CYAN, 2));
  }
}

function path(pm: Pixmap, cx: number, y0: number, y1: number): void {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    const hw = Math.floor(8 + t * 55);
    pm.hline(cx - hw, y, hw * 2, px(RAMP.EARTH, 1));
  }
}

function town(pm: Pixmap, y = 150, seed = 1): void {
  const rng = mulberry32(seed);
  let x = 7;
  while (x < pm.w - 10) {
    const bw = 18 + Math.floor(rng() * 28);
    const bh = 16 + Math.floor(rng() * 34);
    const ramp = [RAMP.BLUE, RAMP.RED, RAMP.EARTH, RAMP.PAPER, RAMP.CYAN][Math.floor(rng() * 5)];
    pm.litRect(x, y - bh, bw, bh, ramp);
    pm.hline(x - 2, y - bh, bw + 4, px(RAMP.NIGHT, 0));
    if (rng() > 0.35) pm.rect(x + 4, y - bh + 7, 4, 5, px(RAMP.GOLD, 2));
    if (rng() > 0.55) pm.rect(x + bw - 8, y - bh + 8, 4, 5, px(RAMP.GOLD, 2));
    x += bw + 6;
  }
}

function heroParty(pm: Pixmap, x: number, y: number, scale = 1): void {
  const colors = [RAMP.RED, RAMP.BLUE, RAMP.PURPLE, RAMP.GOLD, RAMP.FOREST];
  colors.forEach((ramp, i) => {
    const px0 = x + i * 13 * scale;
    pm.sphere(px0, y - 13 * scale, 4 * scale, i === 4 ? RAMP.SKIN_DEEP : RAMP.SKIN);
    pm.litRect(px0 - 4 * scale, y - 9 * scale, 8 * scale, 12 * scale, ramp);
    pm.rect(px0 - 3 * scale, y + 3 * scale, 3 * scale, 7 * scale, px(RAMP.NIGHT, 2));
    pm.rect(px0 + 1 * scale, y + 3 * scale, 3 * scale, 7 * scale, px(RAMP.NIGHT, 2));
  });
}

function heartlight(pm: Pixmap, x: number, y: number, r = 22): void {
  pm.ellipse(x, y, r + 16, r + 5, px(RAMP.CYAN, 1));
  pm.ellipse(x, y, r, r, px(RAMP.GOLD, 2));
  pm.ellipse(x - 4, y - 4, Math.max(4, r / 3), Math.max(4, r / 3), C.white);
  for (let a = 0; a < 16; a++) {
    const th = (a / 16) * Math.PI * 2;
    pm.line(x, y, Math.round(x + Math.cos(th) * (r + 28)), Math.round(y + Math.sin(th) * (r + 18)), px(RAMP.GOLD, 3));
  }
}

function meteor(pm: Pixmap, x: number, y: number): void {
  for (let t = 0; t < 95; t++) {
    const tx = x - t * 2;
    const ty = y - t;
    const c = t < 18 ? px(RAMP.GOLD, 3) : t < 45 ? px(RAMP.ORANGE, 2) : px(RAMP.RED, 1);
    pm.rect(tx, ty, 3, 2, c);
  }
  pm.litEllipse(x, y, 8, 6, RAMP.GOLD).outline(C.outline);
}

function panelBase(seed: number, chapterRamp: number): Pixmap {
  const pm = new Pixmap(W, H);
  sky(pm, px(RAMP.NIGHT, 0), px(RAMP.NIGHT, 1), px(chapterRamp, 0));
  stars(pm, seed, 50);
  hills(pm, chapterRamp, 158);
  pm.rect(0, 185, W, 40, px(RAMP.EARTH, 0));
  return pm;
}

function bossShape(pm: Pixmap, visual: Visual): void {
  if (visual === 'cobra') {
    pm.litEllipse(226, 94, 46, 34, RAMP.FOREST).outline(C.outline);
    pm.litEllipse(248, 74, 24, 20, RAMP.GRASS).outline(C.outline);
    pm.ellipse(258, 68, 4, 2, px(RAMP.RED, 3));
    return;
  }
  if (visual === 'dragon') {
    for (let i = 0; i < 6; i++) pm.litEllipse(142 + i * 28, 90 + Math.sin(i) * 16, 22, 15, RAMP.PAPER).outline(C.outline);
    pm.litEllipse(306, 82, 30, 22, RAMP.RED).outline(C.outline);
    return;
  }
  if (visual === 'sphinx') {
    pm.litRect(136, 112, 138, 48, RAMP.GOLD).outline(C.outline);
    pm.litEllipse(205, 88, 36, 30, RAMP.GOLD).outline(C.outline);
    pm.rect(176, 70, 58, 8, px(RAMP.NIGHT, 1));
    return;
  }
  pm.litEllipse(214, 106, 55, 35, RAMP.ORANGE).outline(C.outline);
  pm.litEllipse(186, 100, 18, 15, RAMP.RED).outline(C.outline);
  pm.litEllipse(244, 100, 18, 15, RAMP.RED).outline(C.outline);
}

function vehicle(pm: Pixmap, visual: Visual): void {
  if (visual === 'boat' || visual === 'riverboat') {
    water(pm, 142);
    const ramp = visual === 'boat' ? RAMP.GOLD : RAMP.PAPER;
    pm.litEllipse(206, 148, visual === 'boat' ? 84 : 112, 24, ramp).outline(C.outline);
    if (visual === 'riverboat') {
      pm.litRect(156, 96, 100, 45, RAMP.PAPER).outline(C.outline);
      pm.rect(176, 78, 12, 28, px(RAMP.RED, 1));
      pm.rect(220, 78, 12, 28, px(RAMP.RED, 1));
    }
    return;
  }
  if (visual === 'train') {
    pm.rect(0, 166, W, 10, px(RAMP.INK, 1));
    pm.litRect(76, 108, 250, 55, RAMP.NIGHT).outline(C.outline);
    for (let x = 96; x < 300; x += 36) pm.rect(x, 119, 18, 14, px(RAMP.GOLD, 2));
    pm.sphere(108, 169, 8, RAMP.INK);
    pm.sphere(286, 169, 8, RAMP.INK);
    return;
  }
  if (visual === 'plane') {
    pm.litRect(150, 82, 124, 18, RAMP.RED).outline(C.outline);
    pm.litEllipse(214, 86, 85, 8, RAMP.PAPER).outline(C.outline);
    pm.litRect(192, 62, 52, 10, RAMP.RED).outline(C.outline);
    pm.line(148, 91, 116, 116, px(RAMP.PAPER, 2));
    return;
  }
  if (visual === 'rocket') {
    pm.litEllipse(202, 92, 18, 64, RAMP.PAPER).outline(C.outline);
    pm.litRect(188, 130, 30, 28, RAMP.RED).outline(C.outline);
    pm.ellipse(202, 174, 34, 22, px(RAMP.ORANGE, 2));
    pm.ellipse(202, 181, 20, 36, px(RAMP.GOLD, 3));
  }
}

function structure(pm: Pixmap, visual: Visual): void {
  switch (visual) {
    case 'pyramid':
      for (let row = 0; row < 6; row++) pm.litRect(110 + row * 14, 154 - row * 18, 180 - row * 28, 18, RAMP.GOLD);
      pm.outline(C.outline);
      break;
    case 'academy':
      pm.litRect(80, 75, 240, 92, RAMP.PAPER).outline(C.outline);
      pm.litRect(178, 40, 44, 130, RAMP.NIGHT).outline(C.outline);
      for (let x = 104; x < 296; x += 34) pm.rect(x, 98, 14, 18, px(RAMP.CYAN, 1));
      break;
    case 'greenhouse':
      pm.litRect(112, 96, 176, 66, RAMP.CYAN).outline(C.outline);
      for (let x = 122; x < 276; x += 22) pm.vline(x, 98, 60, px(RAMP.PAPER, 3));
      pm.line(112, 96, 200, 54, C.white);
      pm.line(288, 96, 200, 54, C.white);
      break;
    case 'castle':
      pm.litRect(100, 82, 200, 90, RAMP.PURPLE).outline(C.outline);
      pm.litRect(82, 58, 44, 114, RAMP.NIGHT).outline(C.outline);
      pm.litRect(274, 58, 44, 114, RAMP.NIGHT).outline(C.outline);
      break;
    case 'monastery':
      pm.litRect(118, 106, 164, 62, RAMP.PAPER).outline(C.outline);
      pm.litRect(190, 62, 28, 94, RAMP.EARTH).outline(C.outline);
      pm.sphere(204, 55, 12, RAMP.GOLD);
      break;
    case 'temple':
      pm.litRect(104, 118, 196, 46, RAMP.RED).outline(C.outline);
      pm.litRect(84, 96, 236, 20, RAMP.GOLD).outline(C.outline);
      pm.litRect(120, 78, 164, 18, RAMP.RED).outline(C.outline);
      break;
    case 'palace':
      pm.litRect(76, 92, 248, 78, RAMP.GOLD).outline(C.outline);
      pm.litEllipse(200, 82, 38, 30, RAMP.PAPER).outline(C.outline);
      break;
    case 'station':
      pm.litRect(80, 105, 240, 58, RAMP.CYAN).outline(C.outline);
      pm.ellipse(200, 72, 94, 18, px(RAMP.CYAN, 2));
      break;
    default:
      town(pm, 158, 42);
  }
}

function drawPanel(beat: Beat, idx: number): Pixmap {
  const rampByChapter: Record<string, number> = {
    ch1: RAMP.FOREST,
    ch2: RAMP.GOLD,
    ch3: RAMP.CYAN,
    ch4: RAMP.BLUE,
    ch5: RAMP.PAPER,
    ch6: RAMP.ORANGE,
    ch7: RAMP.RED,
    ch8: RAMP.GRASS,
    ch9: RAMP.PURPLE,
    ch10: RAMP.NIGHT,
  };
  const pm = panelBase(1000 + idx * 17, rampByChapter[beat.chapter] ?? RAMP.FOREST);
  const v = beat.visual;
  if (v === 'meteor') meteor(pm, 292, 72);
  else if (v === 'town' || v === 'port' || v === 'market' || v === 'city' || v === 'village' || v === 'village9') {
    if (v === 'port') water(pm, 156);
    town(pm, 148, idx + 5);
  } else if (v === 'hill') {
    path(pm, 205, 98, 225);
    meteor(pm, 300, 62);
    pm.ellipse(278, 153, 32, 12, px(RAMP.ORANGE, 1));
  } else if (v === 'heartlight' || v === 'homesong') {
    heartlight(pm, 200, 96, v === 'homesong' ? 34 : 24);
    heroParty(pm, 160, 166);
  } else if (v === 'boss' || v === 'cobra' || v === 'dragon' || v === 'sphinx') {
    bossShape(pm, v);
    heroParty(pm, 108, 174);
  } else if (v === 'boat' || v === 'riverboat' || v === 'train' || v === 'plane' || v === 'rocket') {
    vehicle(pm, v);
    heroParty(pm, 84, 176);
  } else if (v === 'pyramid' || v === 'academy' || v === 'greenhouse' || v === 'castle' || v === 'monastery' || v === 'temple' || v === 'palace' || v === 'station') {
    structure(pm, v);
    heroParty(pm, 146, 178);
  } else if (v === 'prophecy' || v === 'pray' || v === 'confirm') {
    pm.ellipse(200, 104, 94, 44, px(RAMP.CYAN, 1));
    heartlight(pm, 200, 94, 16);
    heroParty(pm, 158, 170);
  } else if (v === 'zapper') {
    town(pm, 158, 11);
    pm.litRect(196, 70, 12, 90, RAMP.INK).outline(C.outline);
    pm.ellipse(202, 68, 28, 14, px(RAMP.CYAN, 2));
    pm.line(184, 70, 220, 52, px(RAMP.GOLD, 3));
  } else if (v === 'phone' || v === 'calling') {
    town(pm, 158, 18);
    const phones = v === 'calling' ? [95, 155, 215, 275, 335] : [204];
    for (const x of phones) {
      pm.litRect(x - 7, 104, 14, 48, RAMP.RED).outline(C.outline);
      pm.ellipse(x, 96, 20, 8, px(RAMP.GOLD, 2));
    }
  } else if (v === 'forest' || v === 'savanna' || v === 'fjord' || v === 'giants' || v === 'sleeper' || v === 'ear' || v === 'minimus' || v === 'duchess' || v === 'cat' || v === 'ruins' || v === 'volcano' || v === 'snow' || v === 'mars' || v === 'hush' || v === 'hoaxula' || v === 'credits') {
    drawSetPiece(pm, v, idx);
  }
  pm.frame(0, 0, W, H, px(RAMP.INK, 0));
  return pm;
}

function drawSetPiece(pm: Pixmap, visual: Visual, seed: number): void {
  if (visual === 'snow') {
    sky(pm, px(RAMP.NIGHT, 1), px(RAMP.BLUE, 0), px(RAMP.CYAN, 0));
    hills(pm, RAMP.CYAN, 150);
    pm.rect(0, 168, W, 57, px(RAMP.PAPER, 2));
    pm.litRect(116, 146, 110, 24, RAMP.RED).outline(C.outline);
    pm.sphere(102, 172, 8, RAMP.INK);
    pm.sphere(226, 172, 8, RAMP.INK);
  } else if (visual === 'mars' || visual === 'hush') {
    sky(pm, px(RAMP.INK, 0), px(RAMP.NIGHT, 0), px(RAMP.PURPLE, 0));
    pm.rect(0, 158, W, 67, px(RAMP.RED, 0));
    for (let x = 0; x < W; x += 32) pm.ellipse(x, 174 + (x % 3) * 8, 20, 5, px(RAMP.ORANGE, 0));
    if (visual === 'hush') pm.litEllipse(200, 88, 70, 46, RAMP.INK).outline(C.outline);
    else heroParty(pm, 160, 172);
  } else if (visual === 'credits') {
    sky(pm, px(RAMP.NIGHT, 0), px(RAMP.NIGHT, 1), px(RAMP.CYAN, 0));
    heartlight(pm, 200, 80, 28);
    drawTextInto(pm, 'METEOR FALLS', 154, 156, px(RAMP.GOLD, 3));
    drawTextInto(pm, 'THE END', 178, 174, C.white);
  } else if (visual === 'cat') {
    pm.litEllipse(212, 120, 76, 46, RAMP.EARTH).outline(C.outline);
    pm.litEllipse(260, 90, 36, 32, RAMP.EARTH).outline(C.outline);
    pm.line(290, 112, 342, 78, px(RAMP.EARTH, 2));
    heroParty(pm, 104, 178);
  } else if (visual === 'volcano') {
    sky(pm, px(RAMP.NIGHT, 0), px(RAMP.RED, 0), px(RAMP.ORANGE, 0));
    pm.litEllipse(205, 158, 132, 70, RAMP.INK).outline(C.outline);
    pm.ellipse(205, 104, 40, 12, px(RAMP.ORANGE, 2));
    pm.line(205, 104, 178, 166, px(RAMP.ORANGE, 3));
    pm.line(205, 104, 232, 166, px(RAMP.ORANGE, 2));
  } else {
    const rng = mulberry32(seed * 31);
    for (let x = 18; x < W; x += 34) {
      const h = 35 + Math.floor(rng() * 45);
      pm.litRect(x, 160 - h, 12, h, visual === 'forest' ? RAMP.FOREST : RAMP.EARTH).outline(C.outline);
      pm.litEllipse(x + 6, 154 - h, 24, 18, visual === 'forest' ? RAMP.GRASS : RAMP.GOLD).outline(C.outline);
    }
    if (visual === 'ruins') structure(pm, 'pyramid');
    if (visual === 'duchess' || visual === 'minimus') {
      pm.litRect(96, 118, 210, 42, RAMP.PAPER).outline(C.outline);
      pm.litRect(182, 76, 36, 72, RAMP.GOLD).outline(C.outline);
    }
    heroParty(pm, 150, 180);
  }
}

function drawFraming(kind: string): Pixmap {
  const pm = new Pixmap(W, H);
  sky(pm, px(RAMP.NIGHT, 0), px(RAMP.NIGHT, 1), px(RAMP.NIGHT, 2));
  stars(pm, kind.length * 19, 80);
  hills(pm, kind === 'links' ? RAMP.GRASS : RAMP.FOREST, 164);
  pm.rect(0, 186, W, 39, px(RAMP.EARTH, 0));
  if (kind === 'title' || kind === 'boot') {
    town(pm, 164, 1995);
    meteor(pm, 292, 72);
  } else if (kind === 'name') {
    pm.litRect(60, 116, 280, 70, RAMP.EARTH).outline(C.outline);
    heroParty(pm, 156, 154, 2);
  } else if (kind === 'saves') {
    pm.litRect(62, 46, 276, 36, RAMP.PAPER).outline(C.outline);
    pm.litRect(62, 96, 276, 36, RAMP.PAPER).outline(C.outline);
    pm.litRect(62, 146, 276, 36, RAMP.PAPER).outline(C.outline);
  } else if (kind === 'links') {
    sky(pm, px(RAMP.CYAN, 0), px(RAMP.CYAN, 1), px(RAMP.GRASS, 1));
    water(pm, 136);
    pm.rect(0, 158, W, 67, px(RAMP.GRASS, 1));
    for (let i = 0; i < 9; i++) pm.ellipse(30 + i * 42, 176 + (i % 3) * 10, 24, 12, px(RAMP.GRASS, 3));
  } else if (kind === 'gameover') {
    pm.fill(px(RAMP.INK, 0));
    pm.ellipse(200, 112, 130, 50, px(RAMP.NIGHT, 1));
    pm.litRect(150, 125, 100, 24, RAMP.PAPER).outline(C.outline);
    pm.ellipse(200, 90, 26, 34, px(RAMP.CYAN, 2));
  }
  pm.frame(0, 0, W, H, C.outline);
  return pm;
}

function drawIcon(size: number): Pixmap {
  const pm = new Pixmap(size, size);
  sky(pm, px(RAMP.NIGHT, 0), px(RAMP.NIGHT, 1), px(RAMP.NIGHT, 2));
  stars(pm, 512, Math.max(22, Math.floor(size / 7)));
  hills(pm, RAMP.FOREST, Math.floor(size * 0.76));
  meteor(pm, Math.floor(size * 0.63), Math.floor(size * 0.34));
  pm.ellipse(Math.floor(size * 0.72), Math.floor(size * 0.82), Math.floor(size * 0.12), Math.floor(size * 0.04), px(RAMP.ORANGE, 2));
  return pm;
}

function drawSplash(): Pixmap {
  const pm = new Pixmap(1080, 1920);
  sky(pm, px(RAMP.NIGHT, 0), px(RAMP.NIGHT, 1), px(RAMP.NIGHT, 2));
  stars(pm, 1080, 420);
  const title = scalePixmap(drawFraming('title'), 2);
  const logo = scalePixmap(drawLogo(), 3);
  pm.blit(title, Math.floor((pm.w - title.w) / 2), 560);
  pm.blit(logo, Math.floor((pm.w - logo.w) / 2), 410);
  return pm;
}

function drawTitleLogo(): Pixmap {
  const pm = new Pixmap(300, 120);
  const logo = scalePixmap(drawLogo(), 2);
  pm.blit(logo, Math.floor((pm.w - logo.w) / 2), Math.floor((pm.h - logo.h) / 2));
  return pm;
}

function renderAll(): void {
  save('assets/art/screens/boot_splash.png', drawFraming('boot'));
  save('assets/art/screens/title_bg.png', drawFraming('title'));
  save('assets/art/screens/title_logo.png', drawTitleLogo());
  save('assets/art/screens/name_entry_bg.png', drawFraming('name'));
  save('assets/art/screens/save_slots_bg.png', drawFraming('saves'));
  save('assets/art/screens/links_bg.png', drawFraming('links'));
  save('assets/art/icons/app_icon.png', drawIcon(512));
  save('assets/art/screens/splash_art.png', drawSplash());
  save('assets/art/screens/game_over.png', drawFraming('gameover'));

  CUTSCENE_BEATS.forEach((beat, i) => {
    save(`assets/art/cutscenes/${beat.chapter}/${beat.beat}_01.png`, drawPanel(beat, i));
  });
  console.log(`pkg01: ${CUTSCENE_BEATS.length} cutscene panels`);
  console.log(`pkg01: ${9 + CUTSCENE_BEATS.length} total assets`);
}

renderAll();
