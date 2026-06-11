/**
 * SPRITE LAB — the sprite design engine, live (ADR-002).
 * Page 1: the cast walking. Page 2: enemy battle sprites. Page 3: the world
 * set. Page 4: REMIX — build a brand-new EarthBound-style character from
 * parameters and watch the engine redraw the full 16-frame sheet instantly.
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { CAST, generateCharacterFrames, type CharacterSpec, type HairStyle, type TopStyle, type Build } from '../spritegen/characters';
import { HEROES, type HeroId } from '../data/heroes';
import { framesToCanvas } from '../spritegen/pixmap';
import { standFrame, type Facing } from '../spritegen';
import { makeWindow, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';

const PAGES = ['THE CAST', 'COMPANIONS', 'THE OPPOSITION', 'THE WORLD', 'REMIX A KID'] as const;

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
  private remixDirTimer = 0;
  private remixDir = 0;
  private navAt = 0;
  // S7c walk-cycle audit: the cast page cycles all four facings together
  private castSprites: Phaser.GameObjects.Sprite[] = [];
  private castDirTimer = 0;
  private castDir = 0;

  constructor() {
    super('spritelab');
  }

  create(): void {
    this.page = 0;
    this.add.rectangle(0, 0, 400, 225, colorOf(px(RAMP.NIGHT, 1))).setOrigin(0);
    makeWindow(this, 6, 4, 388, 24);
    this.title = this.add
      .bitmapText(200, 12, 'retro', '', 6)
      .setOrigin(0.5, 0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.add
      .bitmapText(200, 214, 'retro', '</> page   A action   B back to title', 6)
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.NIGHT, 3)));
    this.showPage();
  }

  private clear(): void {
    this.content.forEach((o) => o.destroy());
    this.content = [];
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
    else this.pageRemix();
  }

  private pageCast(): void {
    const ids = Object.keys(CAST);
    ids.forEach((id, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const x = 28 + col * 48;
      const y = 92 + row * 62;
      const spr = this.add.sprite(x, y, id, 0).setOrigin(0.5, 1).setScale(1.8);
      spr.play(`${id}-walk-down`);
      // heroes label with their canon DISPLAY name (ADR-023: id 'faye' is
      // a frozen engine identifier; the girl is named Mia)
      const display = id in HEROES ? HEROES[id as HeroId].name : id;
      const label = this.add
        .bitmapText(x, y + 2, 'retro', display.toUpperCase().slice(0, 7), 6)
        .setOrigin(0.5, 0)
        .setTint(colorOf(px(RAMP.PAPER, 2)));
      this.castSprites.push(spr);
      this.content.push(spr, label);
    });
  }

  /** S7c: dog/glint/angels at 1x AND 3x — the EB-made-at-both-scales check */
  private pageCompanions(): void {
    const label = (x: number, y: number, text: string): void => {
      this.content.push(
        this.add
          .bitmapText(x, y, 'retro', text, 6)
          .setOrigin(0.5, 0)
          .setTint(colorOf(px(RAMP.PAPER, 2))),
      );
    };
    const anim = (x: number, y: number, key: string, animKey: string, scale: number): void => {
      const spr = this.add.sprite(x, y, key, 0).setOrigin(0.5, 1).setScale(scale);
      spr.play(animKey);
      this.content.push(spr);
    };
    // Biscuit — eastbound + westbound trots, both scales
    anim(36, 86, 'dog', 'dog-walk', 3);
    anim(78, 86, 'dog', 'dog-walk-left', 3);
    anim(57, 104, 'dog', 'dog-walk', 1);
    label(57, 108, 'BISCUIT');
    // Glint — the heart should visibly beat at 1x
    anim(150, 86, 'glint', 'glint-flit', 3);
    anim(150, 102, 'glint', 'glint-flit', 1);
    label(150, 108, 'GLINT');
    // the guest angel, both scales
    anim(222, 86, 'angel', 'angel-float', 3);
    anim(222, 100, 'angel', 'angel-float', 1);
    label(222, 108, 'ANGEL');
    // §A4.7: the four heroes mourn as themselves
    (['rex', 'faye', 'milo', 'dorin'] as const).forEach((id, i) => {
      const x = 60 + i * 76;
      anim(x, 188, `angel_${id}`, `angel_${id}-float`, 3);
      anim(x + 30, 188, `angel_${id}`, `angel_${id}-float`, 1);
      label(x + 8, 192, `ANGEL ${(id in HEROES ? HEROES[id as HeroId].name : id).toUpperCase()}`);
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
      const x = 60 + col * 95;
      const y = 78 + row * 78;
      // v3 battle sprites are EB-scale already (64-96px) — show them near 1:1
      const spr = this.add.image(x, y, key).setScale(key.includes('tick') ? 0.85 : 0.9);
      this.tweens.add({ targets: spr, y: y - 3, duration: 1000 + i * 100, yoyo: true, repeat: -1 });
      const label = this.add
        .bitmapText(x, y + 34, 'retro', name, 6)
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
    for (const [key, x, y, s] of items) {
      this.content.push(this.add.image(x, y, key).setScale(s));
    }
    const strip = this.add.image(330, 200, 'tiles').setScale(0.55).setOrigin(0.5);
    this.content.push(strip);
  }

  private pageRemix(): void {
    this.regenRemix();
    const labels = this.remixParamLabels();
    labels.forEach((_, i) => {
      const t = this.add
        .bitmapText(170, 44 + i * 16, 'retro', '', 6)
        .setTint(colorOf(px(RAMP.PAPER, 2)));
      this.remixTexts.push(t);
      this.content.push(t);
    });
    const hint = this.add
      .bitmapText(170, 44 + labels.length * 16 + 6, 'retro', 'up/down pick Â· A change Â· MENU random', 6)
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
    const frames = generateCharacterFrames(this.remixSpec);
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
    const old = this.remixSprite;
    this.remixSprite = this.add.sprite(85, 120, key, standFrame('down')).setScale(5);
    this.remixSprite.play(`${key}-walk-down`);
    this.content.push(this.remixSprite);
    old?.destroy();
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
    if (this.page === 0 && this.castSprites.length > 0) {
      // the audit loop: every cast sprite walks down/left/right/up in step
      this.castDirTimer += dtMs;
      if (this.castDirTimer > 1400) {
        this.castDirTimer = 0;
        this.castDir = (this.castDir + 1) % 4;
        const dir = (['down', 'left', 'right', 'up'] as const)[this.castDir];
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
        this.remixDir = (this.remixDir + 1) % 4;
        const dir = (['down', 'left', 'right', 'up'] as const)[this.remixDir];
        const key = this.remixSprite.texture.key;
        this.remixSprite.play(`${key}-walk-${dir}`);
      }
    }
  }
}
