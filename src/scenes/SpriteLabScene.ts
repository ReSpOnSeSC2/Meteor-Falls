/**
 * SPRITE LAB — the sprite design engine, live (ADR-002).
 * Page 1: the cast walking. Page 2: enemy battle sprites. Page 3: the world
 * set. Page 4: REMIX — build a brand-new EarthBound-style character from
 * parameters and watch the engine redraw the full 16-frame sheet instantly.
 * Page 5 (S15g 3b): THE FORGE — browse forged grunts, cycle their seeded
 * candidate faces, and read the recorded partsSpec pick at all three wear tiers.
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { CAST, generateCharacterFrames, generateIdleFrames, IDLE_BREATH, IDLE_BLINK, diagWalkBase, DIAG_ORDER, type CharacterSpec, type HairStyle, type TopStyle, type Build } from '../spritegen/characters';
import { HEROES, type HeroId } from '../data/heroes';
import { framesToCanvas } from '../spritegen/pixmap';
import { standFrame, type Facing } from '../spritegen';
import { makeWindow, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import { composeEnemy, proposeCandidates, FACE_W, FACE_H } from '../spritegen/parts';
import { FORGED_ENEMIES } from '../levelkit/forge/registry';
import { FACE_PICKS } from '../data/drafts/faces';
import type { PartsSpec } from '../schemas';
import { s } from '../spritegen/scale';

const PAGES = ['THE CAST', 'COMPANIONS', 'THE OPPOSITION', 'THE WORLD', 'REMIX A KID', 'THE FORGE'] as const;

// ADR-096: the 8-way turn order — walking the compass clockwise so the lab's
// cast/remix sprites rotate through every facing, diagonals included.
const COMPASS8: readonly Facing[] = ['down', 'downright', 'right', 'upright', 'up', 'upleft', 'left', 'downleft'];

const HAIR_STYLES: HairStyle[] = ['short', 'bob', 'sidepart', 'topknot', 'gray', 'none'];
const TOP_STYLES: TopStyle[] = ['shirt', 'stripe', 'dress', 'gi', 'blazer', 'apron', 'pajama'];
const BUILDS: Build[] = ['kid', 'chub', 'adult'];
const COLOR_RAMPS = [RAMP.RED, RAMP.BLUE, RAMP.GOLD, RAMP.CYAN, RAMP.MAGENTA, RAMP.GRASS, RAMP.PURPLE, RAMP.EARTH, RAMP.PAPER, RAMP.INK];
const HAIR_RAMPS = [RAMP.INK, RAMP.BLOND, RAMP.EARTH, RAMP.RED, RAMP.PAPER];
const SKIN_RAMPS = [RAMP.SKIN, RAMP.SKIN_DEEP];
const HATS: Array<CharacterSpec['hat'] | undefined> = [
  undefined,
  { kind: 'cap', ramp: RAMP.RED },
  { kind: 'cap', ramp: RAMP.BLUE },
  { kind: 'cap', ramp: RAMP.FOREST },
  { kind: 'bow', ramp: RAMP.RED },
  { kind: 'bow', ramp: RAMP.GOLD },
];

export class SpriteLabScene extends Phaser.Scene {
  private page = 0;
  private content: Phaser.GameObjects.GameObject[] = [];
  private title!: Phaser.GameObjects.BitmapText;
  private remixSpec: CharacterSpec = { ...CAST.rex, hat: { kind: 'cap', ramp: RAMP.RED } };
  private remixSel = 0;
  private remixCounter = 0;
  private remixSprite: Phaser.GameObjects.Sprite | null = null;
  private remixTexts: Phaser.GameObjects.BitmapText[] = [];
  // ADR-101: the palette-swap strip — one generator, many recolors (live)
  private remixStrip: Phaser.GameObjects.GameObject[] = [];
  private remixDirTimer = 0;
  private remixDir = 0;
  private navAt = 0;
  // S7c walk-cycle audit: the cast page cycles all four facings together
  private castSprites: Phaser.GameObjects.Sprite[] = [];
  private castDirTimer = 0;
  private castDir = 0;
  // S15g 3b — THE FORGE page: browse forged grunts, cycle seeded candidate
  // faces, and read which partsSpec the human recorded (the pick).
  private forgeIdx = 0;
  private forgeCand = 0;
  private forgeCounter = 0;
  private forgeList: { id: string; role: string; chapter: number }[] = [];

  constructor() {
    super('spritelab');
  }

  create(): void {
    this.page = 0;
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, colorOf(px(RAMP.NIGHT, 1))).setOrigin(0);
    makeWindow(this, s(6), s(4), s(388), s(24));
    this.title = this.add
      .bitmapText(s(200), s(12), 'retro', '', s(6))
      .setOrigin(0.5, 0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.add
      .bitmapText(s(200), s(214), 'retro', '</> page   A action   B back to title', s(6))
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.NIGHT, 3)));
    this.showPage();
  }

  private clear(): void {
    this.content.forEach((o) => o.destroy());
    this.content = [];
    this.remixStrip.forEach((o) => o.destroy());
    this.remixStrip = [];
    this.remixSprite = null;
    this.remixTexts = [];
    this.castSprites = [];
    this.castDir = 0;
    this.castDirTimer = 0;
  }

  private showPage(): void {
    this.clear();
    this.title.setText(`SPRITE LAB — ${PAGES[this.page]}`);
    if (this.page === 0) this.pageCast();
    else if (this.page === 1) this.pageCompanions();
    else if (this.page === 2) this.pageEnemies();
    else if (this.page === 3) this.pageWorld();
    else if (this.page === 4) this.pageRemix();
    else this.pageForge();
  }

  /** S14b: the cast outgrew one screen (41 and counting) — the page
   *  SCROLLS by row (Up/Down), clamped, with a position read in the corner */
  private castScroll = 0;

  private pageCast(): void {
    const ids = Object.keys(CAST);
    const totalRows = Math.ceil(ids.length / 8);
    const maxScroll = Math.max(0, totalRows - 2);
    this.castScroll = Math.max(0, Math.min(this.castScroll, maxScroll));
    ids.forEach((id, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8) - this.castScroll;
      if (row < 0 || row > 2) return; // off the sheet this scroll
      const x = s(28 + col * 48);
      const y = s(92 + row * 62);
      const spr = this.add.sprite(x, y, id, 0).setOrigin(0.5, 1).setScale(1.8);
      spr.play(`${id}-walk-down`);
      // heroes label with their canon DISPLAY name (ADR-023: id 'faye' is
      // a frozen engine identifier; the girl is named Mia)
      const display = id in HEROES ? HEROES[id as HeroId].name : id;
      const label = this.add
        .bitmapText(x, y + s(2), 'retro', display.toUpperCase().slice(0, 7), s(6))
        .setOrigin(0.5, 0)
        .setTint(colorOf(px(RAMP.PAPER, 2)));
      this.castSprites.push(spr);
      this.content.push(spr, label);
    });
    const pos = this.add
      .bitmapText(s(388), s(36), 'retro', `${this.castScroll + 1}-${Math.min(this.castScroll + 3, totalRows)}/${totalRows}  ^v`, s(6))
      .setOrigin(1, 0)
      .setTint(colorOf(px(RAMP.GOLD, 2)));
    this.content.push(pos);
  }

  /** S7c: dog/glint/angels at 1x AND 3x — the EB-made-at-both-scales check */
  private pageCompanions(): void {
    // x/y arrive runtime-scaled from the call sites; only the bitmapText size
    // is a native literal to scale here.
    const label = (x: number, y: number, text: string): void => {
      this.content.push(
        this.add
          .bitmapText(x, y, 'retro', text, s(6))
          .setOrigin(0.5, 0)
          .setTint(colorOf(px(RAMP.PAPER, 2))),
      );
    };
    // `scale` is a setScale multiplier (texture already carries ×ART_SCALE) — kept as-is.
    const anim = (x: number, y: number, key: string, animKey: string, scale: number): void => {
      const spr = this.add.sprite(x, y, key, 0).setOrigin(0.5, 1).setScale(scale);
      spr.play(animKey);
      this.content.push(spr);
    };
    // Biscuit — eastbound + westbound trots, both scales
    anim(s(36), s(86), 'dog', 'dog-walk', 3);
    anim(s(78), s(86), 'dog', 'dog-walk-left', 3);
    anim(s(57), s(104), 'dog', 'dog-walk', 1);
    label(s(57), s(108), 'BISCUIT');
    // Glint — the heart should visibly beat at 1x
    anim(s(150), s(86), 'glint', 'glint-flit', 3);
    anim(s(150), s(102), 'glint', 'glint-flit', 1);
    label(s(150), s(108), 'GLINT');
    // the guest angel, both scales
    anim(s(222), s(86), 'angel', 'angel-float', 3);
    anim(s(222), s(100), 'angel', 'angel-float', 1);
    label(s(222), s(108), 'ANGEL');
    // §A4.7: the five heroes mourn as themselves (§A3 order; S15h adds Pippa)
    (['rex', 'faye', 'milo', 'pippa', 'dorin'] as const).forEach((id, i) => {
      const x = s(16 + i * 75);
      anim(x, s(188), `angel_${id}`, `angel_${id}-float`, 3);
      anim(x + s(30), s(188), `angel_${id}`, `angel_${id}-float`, 1);
      label(x + s(8), s(192), `ANGEL ${(id in HEROES ? HEROES[id as HeroId].name : id).toUpperCase()}`);
    });
  }

  private pageEnemies(): void {
    const list = [
      ['battle_cranky_mailbox', 'MAILBOX'],
      ['battle_runaway_lawnmower', 'LAWNMOWER'],
      ['battle_coily_cicada', 'CICADA'],
      ['battle_pigeon_gang', 'PIGEONS'],
      ['battle_hill_slug', 'HILL SLUG'],
      ['battle_blazer_smiler', 'SMILER'],
      ['battle_titanic_tick', 'TITANIC TICK'],
    ] as const;
    list.forEach(([key, name], i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = s(60 + col * 95);
      const y = s(78 + row * 78);
      // v3 battle sprites are EB-scale already (64-96px) — show them near 1:1
      const spr = this.add.image(x, y, key).setScale(key.includes('tick') ? 0.85 : 0.9);
      // y - 3 is a px-space bob amplitude → scale; the 1000+i*100 is a duration (ms) → unchanged.
      this.tweens.add({ targets: spr, y: y - s(3), duration: 1000 + i * 100, yoyo: true, repeat: -1 });
      const label = this.add
        .bitmapText(x, y + s(34), 'retro', name, s(6))
        .setOrigin(0.5, 0)
        .setTint(colorOf(px(RAMP.PAPER, 2)));
      this.content.push(spr, label);
    });
  }

  private pageWorld(): void {
    const items = [
      ['house_rex', 64, 92, 1],
      ['drugstore', 178, 92, 1],
      ['chapel', 286, 92, 1],
      ['house_chad', 360, 92, 0.9],
      ['tree', 30, 158, 1.2],
      ['pine', 58, 158, 1.2],
      ['tree_b', 86, 158, 1.2],
      ['lemonade', 130, 158, 1.1],
      ['picnic', 188, 158, 1.1],
      ['meteor_rock', 244, 158, 1.2],
      ['cola_fridge', 288, 158, 1.2],
      ['phone_pole', 352, 152, 0.6],
      ['trash_can', 22, 192, 1.2],
      ['parking_meter', 44, 192, 1.2],
      ['news_box', 68, 192, 1.2],
      ['hydrant', 92, 192, 1.2],
      ['dresser', 118, 192, 1.1],
      ['tv', 144, 192, 1.1],
      ['stove', 170, 192, 1.1],
      ['bookshelf', 198, 192, 1.1],
      ['floor_lamp', 222, 192, 1.1],
      ['bed', 246, 192, 1],
      ['poster_smile', 270, 192, 1.1],
      ['ember', 292, 192, 1.6],
    ] as const;
    // `sc` is the per-item setScale multiplier (texture already ×ART_SCALE) — kept;
    // only the x/y placement is native px → scaled. (Renamed from `s` to not shadow the import.)
    for (const [key, x, y, sc] of items) {
      this.content.push(this.add.image(s(x), s(y), key).setScale(sc));
    }
    const strip = this.add.image(s(330), s(200), 'tiles').setScale(0.55).setOrigin(0.5);
    this.content.push(strip);
  }

  private pageRemix(): void {
    this.regenRemix();
    const labels = this.remixParamLabels();
    labels.forEach((_, i) => {
      const t = this.add
        .bitmapText(s(170), s(44 + i * 16), 'retro', '', s(6))
        .setTint(colorOf(px(RAMP.PAPER, 2)));
      this.remixTexts.push(t);
      this.content.push(t);
    });
    const hint = this.add
      .bitmapText(s(170), s(44 + labels.length * 16 + 6), 'retro', 'up/down pick - A change - MENU random', s(6))
      .setTint(colorOf(px(RAMP.NIGHT, 3)));
    this.content.push(hint);
    this.refreshRemixTexts();
  }

  private remixParamLabels(): string[] {
    const s = this.remixSpec;
    const rampName = (r: number): string =>
      ['INK', 'PAPER', 'SKIN', 'DEEP', 'BLOND', 'RED', 'ORANGE', 'GOLD', 'GRASS', 'FOREST', 'CYAN', 'BLUE', 'PURPLE', 'MAGENTA', 'EARTH', 'NIGHT'][r] ?? '?';
    return [
      `skin    ${rampName(s.skin)}`,
      `hair    ${rampName(s.hair)}`,
      `style   ${s.hairStyle}`,
      `hat     ${s.hat ? `${s.hat.kind}-${rampName(s.hat.ramp)}` : 'none'}`,
      `top     ${s.top.style}-${rampName(s.top.ramp)}`,
      `pants   ${rampName(s.bottom.ramp)}`,
      `shoes   ${rampName(s.shoes)}`,
      `glasses ${s.glasses ? 'yes' : 'no'}`,
      `build   ${s.build ?? 'kid'}`,
    ];
  }

  private refreshRemixTexts(): void {
    const labels = this.remixParamLabels();
    this.remixTexts.forEach((t, i) => {
      t.setText(`${i === this.remixSel ? '▶ ' : '  '}${labels[i]}`);
      t.setTint(colorOf(i === this.remixSel ? px(RAMP.GOLD, 3) : px(RAMP.PAPER, 2)));
    });
  }

  private regenRemix(): void {
    this.remixCounter++;
    const key = `remix_${this.remixCounter}`;
    // ADR-101: build the sheet WITH the appended idle frames (44 breath, 45 blink)
    const frames = [...generateCharacterFrames(this.remixSpec), ...generateIdleFrames(this.remixSpec)];
    const { canvas, fw, fh } = framesToCanvas(frames, 4);
    const tex = this.textures.addCanvas(key, canvas);
    if (tex) frames.forEach((_, i) => tex.add(i, 0, (i % 4) * fw, Math.floor(i / 4) * fh, fw, fh));
    (['down', 'left', 'right', 'up'] as Facing[]).forEach((dir, d) => {
      this.anims.create({
        key: `${key}-walk-${dir}`,
        frames: [0, 1, 2, 3].map((f) => ({ key, frame: d * 4 + f })),
        frameRate: 8,
        repeat: -1,
      });
    });
    // ADR-096: the remix sheet now carries the four diagonal facings too
    DIAG_ORDER.forEach((dir) => {
      const base = diagWalkBase(dir);
      this.anims.create({
        key: `${key}-walk-${dir}`,
        frames: [base, base + 1, base, base + 2].map((frame) => ({ key, frame })),
        frameRate: 8,
        repeat: -1,
      });
    });
    // the down-facing idle: breath + blink, the ADR-101 standing life
    if (!this.anims.exists(`${key}-idle-down`)) {
      this.anims.create({
        key: `${key}-idle-down`,
        frames: [0, IDLE_BREATH, IDLE_BREATH, 0, 0, 0, IDLE_BLINK, 0, 0, 0].map((frame) => ({ key, frame })),
        frameRate: 4,
        repeat: -1,
      });
    }
    const old = this.remixSprite;
    // position scales; setScale(5) is a texture multiplier (texture already ×ART_SCALE) — kept.
    this.remixSprite = this.add.sprite(s(85), s(116), key, standFrame('down')).setScale(5);
    this.remixSprite.play(`${key}-idle-down`); // open on the breathing idle
    this.content.push(this.remixSprite);
    old?.destroy();
    this.buildRemixStrip();
  }

  /**
   * ADR-101 — the palette-swap demonstration: the SAME generated kid, recolored
   * by swapping its shirt ramp to four other ramps. One generator, many looks —
   * the cheap NPC/crowd variety primitive (pm.recolor), shown live.
   */
  private buildRemixStrip(): void {
    this.remixStrip.forEach((o) => o.destroy());
    this.remixStrip = [];
    const base = generateCharacterFrames(this.remixSpec)[standFrame('down')];
    const swaps = [RAMP.RED, RAMP.BLUE, RAMP.GRASS, RAMP.GOLD];
    this.remixStrip.push(
      this.add
        .bitmapText(s(86), s(178), 'retro', 'PALETTE-SWAP', s(6))
        .setOrigin(0.5, 0)
        .setTint(colorOf(px(RAMP.GOLD, 2))),
    );
    swaps.forEach((toRamp, i) => {
      const tkey = `remixrc_${this.remixCounter}_${i}`;
      if (this.textures.exists(tkey)) this.textures.remove(tkey);
      const pm = base.clone().recolor({ [this.remixSpec.top.ramp]: toRamp });
      this.textures.addCanvas(tkey, pm.toCanvas());
      // position scales; setScale(1.5) is a texture multiplier — kept.
      this.remixStrip.push(this.add.image(s(34 + i * 36), s(200), tkey).setOrigin(0.5, 0.5).setScale(1.5));
    });
  }

  private cycleRemixParam(): void {
    const s = this.remixSpec;
    const next = <T,>(arr: T[], cur: T): T => arr[(arr.indexOf(cur) + 1) % arr.length];
    switch (this.remixSel) {
      case 0:
        s.skin = next(SKIN_RAMPS, s.skin);
        break;
      case 1:
        s.hair = next(HAIR_RAMPS, s.hair);
        break;
      case 2:
        s.hairStyle = next(HAIR_STYLES, s.hairStyle);
        break;
      case 3: {
        const idx = HATS.findIndex((h) => JSON.stringify(h) === JSON.stringify(s.hat));
        s.hat = HATS[(idx + 1) % HATS.length];
        break;
      }
      case 4: {
        // cycle style; each full lap around the styles advances the color
        s.top = { ...s.top, style: next(TOP_STYLES, s.top.style) };
        if (s.top.style === TOP_STYLES[0]) s.top.ramp = next(COLOR_RAMPS, s.top.ramp);
        break;
      }
      case 5:
        s.bottom = { ramp: next(COLOR_RAMPS, s.bottom.ramp) };
        break;
      case 6:
        s.shoes = next(COLOR_RAMPS, s.shoes);
        break;
      case 7:
        s.glasses = !s.glasses;
        break;
      case 8:
        s.build = next(BUILDS, s.build ?? 'kid');
        break;
    }
    this.regenRemix();
    this.refreshRemixTexts();
  }

  private randomizeRemix(): void {
    const r = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    this.remixSpec = {
      skin: r(SKIN_RAMPS),
      hair: r(HAIR_RAMPS),
      hairStyle: r(HAIR_STYLES),
      hat: r(HATS as Array<CharacterSpec['hat']>),
      top: { ramp: r(COLOR_RAMPS), style: r(TOP_STYLES), accent: r(COLOR_RAMPS) },
      bottom: { ramp: r(COLOR_RAMPS) },
      shoes: r(COLOR_RAMPS),
      glasses: Math.random() < 0.25,
      build: r(BUILDS),
    };
    this.regenRemix();
    this.refreshRemixTexts();
  }

  /**
   * S15g 3b — THE FORGE: browse the forged grunts, cycle their seeded candidate
   * faces (A), and read which one the human RECORDED as the partsSpec. The
   * in-game half of the Sprite Lab contact sheet — the human picks a candidate
   * here (and on the parked `dormant/sprite-tools/forge-faces.ts`) and names it; the pick is then written
   * into FACE_PICKS. The selected candidate shows at all three wear tiers so the
   * drums read before the pick.
   */
  private pageForge(): void {
    if (this.forgeList.length === 0) {
      this.forgeList = Object.values(FORGED_ENEMIES)
        .map((e) => ({ id: e.id, role: e.role, chapter: e.chapter }))
        .sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));
    }
    const e = this.forgeList[this.forgeIdx % this.forgeList.length];
    const cands = proposeCandidates(e.id, e.role, e.chapter, 8);
    this.forgeCand = ((this.forgeCand % cands.length) + cands.length) % cands.length;
    // x/y arrive runtime-scaled from the call sites; only the bitmapText size scales here.
    const label = (x: number, y: number, text: string, ramp: number, shade: 0 | 1 | 2 | 3 = 3, origin = 0): void => {
      this.content.push(this.add.bitmapText(x, y, 'retro', text, s(6)).setOrigin(origin, 0).setTint(colorOf(px(ramp, shade))));
    };
    label(s(12), s(34), `${e.id}  (${e.role}, Ch.${e.chapter})`, RAMP.GOLD);
    label(s(388), s(34), `${(this.forgeIdx % this.forgeList.length) + 1}/${this.forgeList.length}  ^v`, RAMP.GOLD, 2, 1);
    label(s(12), s(48), 'candidates  —  A cycles the pick', RAMP.NIGHT, 3);
    cands.forEach((spec, i) => {
      const x = s(28 + i * 45);
      const y = s(74);
      this.forgeFace(spec, 0, x, y, 0.55);
      // the highlight frame matches the 0.55-scaled runtime texture: s(FACE_W)*0.55 (the
      // sprite's setScale multiplier is kept) plus s(6) of native padding.
      if (i === this.forgeCand) this.content.push(this.add.rectangle(x, y, s(FACE_W) * 0.55 + s(6), s(FACE_H) * 0.55 + s(6)).setStrokeStyle(1, colorOf(px(RAMP.GOLD, 3))));
      label(x, y + s(22), `${i}`, i === this.forgeCand ? RAMP.GOLD : RAMP.NIGHT, 3, 0.5);
    });
    const sel = cands[this.forgeCand];
    ['FULL', 'SCUFFED', 'BATTERED'].forEach((name, w) => {
      const x = s(90 + w * 110);
      this.forgeFace(sel, w as 0 | 1 | 2, x, s(150), 0.95);
      label(x, s(184), name, RAMP.CYAN, 3, 0.5);
    });
    label(s(12), s(198), `parts ${sel.silhouette}/${sel.material}/${sel.accessory}/${sel.wear}/${sel.region} seed ${sel.seed}`, RAMP.PAPER, 2);
    const picked = FACE_PICKS[e.id];
    const pIdx = picked
      ? cands.findIndex((c) => c.silhouette === picked.silhouette && c.material === picked.material && c.accessory === picked.accessory && c.wear === picked.wear)
      : -1;
    label(s(388), s(198), picked ? `RECORDED: cand ${pIdx >= 0 ? pIdx : '?'}` : 'unpicked', picked ? RAMP.GRASS : RAMP.RED, 2, 1);
  }

  /** compose a forged face live and place it as an image (dev-only textures).
   *  x/y arrive runtime-scaled; `scale` is a setScale multiplier (kept as-is). */
  private forgeFace(spec: PartsSpec, wear: 0 | 1 | 2, x: number, y: number, scale: number): void {
    const key = `forgelab_${this.forgeCounter++}`;
    this.textures.addCanvas(key, composeEnemy(spec, wear).toCanvas());
    this.content.push(this.add.image(x, y, key).setOrigin(0.5, 0.5).setScale(scale));
  }

  private navOk(): boolean {
    if (this.time.now > this.navAt) {
      this.navAt = this.time.now + 200;
      return true;
    }
    return false;
  }

  override update(_t: number, dtMs: number): void {
    const d = INPUT.dir();
    if (INPUT.justPressed('B')) {
      AUDIO.sfx('cancel');
      this.scene.start('title');
      return;
    }
    if (d.x !== 0 && this.navOk()) {
      this.page = (this.page + (d.x > 0 ? 1 : PAGES.length - 1)) % PAGES.length;
      AUDIO.sfx('cursor');
      this.showPage();
      return;
    }
    if (this.page === 0 && d.y !== 0 && this.navOk()) {
      // S14b: scroll the cast sheet by row
      this.castScroll += d.y > 0 ? 1 : -1;
      AUDIO.sfx('cursor');
      this.showPage();
      return;
    }
    if (this.page === 0 && this.castSprites.length > 0) {
      // the audit loop: every cast sprite walks down/left/right/up in step
      this.castDirTimer += dtMs;
      if (this.castDirTimer > 1400) {
        this.castDirTimer = 0;
        this.castDir = (this.castDir + 1) % COMPASS8.length;
        const dir = COMPASS8[this.castDir];
        this.castSprites.forEach((spr) => spr.play(`${spr.texture.key}-walk-${dir}`));
      }
    }
    if (this.page === 4) {
      if (d.y !== 0 && this.navOk()) {
        this.remixSel = (this.remixSel + (d.y > 0 ? 1 : 8)) % 9;
        AUDIO.sfx('cursor');
        this.refreshRemixTexts();
      }
      if (INPUT.justPressed('A')) {
        AUDIO.sfx('confirm');
        this.cycleRemixParam();
      }
      if (INPUT.justPressed('START')) {
        AUDIO.sfx('confirm');
        this.randomizeRemix();
      }
      // cycle the preview through all four directions
      this.remixDirTimer += dtMs;
      if (this.remixDirTimer > 1400 && this.remixSprite) {
        this.remixDirTimer = 0;
        this.remixDir = (this.remixDir + 1) % COMPASS8.length;
        const dir = COMPASS8[this.remixDir];
        const key = this.remixSprite.texture.key;
        // ADR-101: the 'down' slot shows the breathing/blinking idle, not a walk
        this.remixSprite.play(dir === 'down' ? `${key}-idle-down` : `${key}-walk-${dir}`);
      }
    }
    if (this.page === 5) {
      if (d.y !== 0 && this.navOk() && this.forgeList.length > 0) {
        this.forgeIdx = (this.forgeIdx + (d.y > 0 ? 1 : this.forgeList.length - 1)) % this.forgeList.length;
        this.forgeCand = 0;
        AUDIO.sfx('cursor');
        this.showPage();
      }
      if (INPUT.justPressed('A')) {
        this.forgeCand += 1;
        AUDIO.sfx('confirm');
        this.showPage();
      }
    }
  }
}
