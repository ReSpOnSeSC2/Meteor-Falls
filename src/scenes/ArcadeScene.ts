/**
 * ArcadeScene — ARCADE LEGEND, the playable STARPORT II cabinet
 * (GAME_BIBLE §A10 #4 + Prompt 36's shmup hook, landed S10).
 *
 * A ~60-second score-attack shmup on the existing input layer: move with the
 * d-pad/stick/arrows, HOLD A to fire, B asks to eject (the Android back
 * button taps B — ADR-026). Touch needs nothing new: the UIScene overlay's
 * landscape-thumb d-pad + A/B drive it as-is (§B4). All input is polled
 * per-frame in update() / everyFrame (ADR-024 — no Clock timers anywhere).
 *
 * THE CABINET IS DETERMINISTIC: waves come from data/arcade.ts's scripted
 * spawn table, the sim advances on accumulated dt, and nothing rolls dice —
 * same inputs, same score, every run (1995 cabinets played fair; so does the
 * ADR-008 bot). Launched over a paused OverworldScene (the ShopScene
 * pattern); emits 'mf-arcade-closed'. Beating the table's top row sets
 * q_arcade/q_arcade_beat — quest #4 then completes at Sal's counter. The
 * score table itself is GS.data.arcadeScores (save v4), so the cabinet is
 * endlessly replayable from any save; the quest just completes once.
 *
 * QA recipe (ADR-008; deterministic — verified S10 end-to-end, incl. the
 * one-frame-tap legs at pump(n, 8.33)): in STARPORT II, stand ~(118,55)
 * facing up at the LEGEND sign (tile 7,1) and MASH KeyZ with pump(45)
 * between presses — KeyZ advances the cab pages AND confirms "Step up"
 * (the safe-pick rule). Attract: KeyZ starts; READY runs 900ms of sim.
 * Two calibrated runs against MGR's 3000:
 *   CAMPER (hold KeyZ at the spawn lane y=120, never move) → 2337. Loses.
 *   SWEEPER → 3817 with a life to spare: hold KeyZ down the whole run and
 *   alternate holdKey ArrowUp/ArrowDown 78-frame legs until sim ~29s, park
 *   y≈120 through ~33.5s (RELEASE KeyZ there if you want the corn dog —
 *   held fire shoots it for +5 and a scolding; eating it is +300), resume
 *   78-frame sweeps to ~47.5s, then 40-frame midline sweeps shred the
 *   {coolthing} letters (+~600 + 1000 COOL BONUS).
 * TIME UP → NEW HIGH SCORE → the shared letter grid (cap 3, prefilled from
 * {playername}'s letters; KeyZ types at the cursor, Enter = OK) → the
 * table with the dethrone banner; q_arcade/q_arcade_beat are set the
 * moment the run ends. B walks away; Sal's counter (stand (43,123), face
 * up, KeyZ-mash) pays the Champion Jacket through the bag flow.
 * Mid-run eject: KeyX → ArrowDown → KeyZ (pump ≥15 between) discards the
 * score and returns to attract.
 */
import Phaser from 'phaser';
import { GS } from '../engine/state';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { ARCADE, ARCADE_TEXT, SCORE_ROWS, buildSpawns, type SpawnEvent, type FoeKind } from '../data/arcade';
import { Dialogue, makeBox, everyFrame, vars } from '../ui/windows';
import { LetterGrid } from '../ui/lettergrid';
import { gridCharset } from '../data/newgame';
import { colorOf, RAMP, px } from '../palette';

// the CRT's inner glass, in screen px (the bezel owns everything outside)
const CRT_X = 14;
const CRT_Y = 26;
const CRT_W = 372;
const CRT_H = 184;
const CRT_R = CRT_X + CRT_W;
const CRT_B = CRT_Y + CRT_H;
/** spawn lanes 0..4 → y centers */
const laneY = (lane: number): number => 56 + lane * 32;

type CabState = 'attract' | 'ready' | 'play' | 'tally' | 'initials' | 'table';

interface Foe {
  spr: Phaser.GameObjects.Image;
  kind: FoeKind;
  hp: number;
  baseY: number;
  /** sim-time at spawn — motion patterns run on age, never wall clock */
  t0: number;
  phase: number;
  dead: boolean;
}

interface BossLetter {
  txt: Phaser.GameObjects.BitmapText;
  idx: number;
  dead: boolean;
}

export class ArcadeScene extends Phaser.Scene {
  private state: CabState = 'attract';
  private dlg!: Dialogue;
  private asking = false;

  // sim
  private simT = 0;
  private spawns: SpawnEvent[] = [];
  private nextSpawn = 0;
  private foes: Foe[] = [];
  private bolts: Phaser.GameObjects.Image[] = [];
  private letters: BossLetter[] = [];
  private bossSpawned = false;
  private bossCleared = false;
  private score = 0;
  private lives = 0;
  private fireCd = 0;
  private invulnUntil = 0;
  private topBefore = 0;

  // ship
  private ship!: Phaser.GameObjects.Image;

  // chrome
  private hudScore!: Phaser.GameObjects.BitmapText;
  private hudTime!: Phaser.GameObjects.BitmapText;
  private hudShips: Phaser.GameObjects.Image[] = [];
  private banner!: Phaser.GameObjects.BitmapText;
  private bannerUntil = 0;
  private screenObjs: Phaser.GameObjects.GameObject[] = [];
  private attractT = 0;
  private rosterLine: Phaser.GameObjects.BitmapText | null = null;
  private grid: LetterGrid | null = null;

  constructor() {
    super('arcade');
  }

  create(): void {
    this.dlg = new Dialogue(this);
    this.asking = false;
    this.state = 'attract';
    this.foes = [];
    this.bolts = [];
    this.letters = [];
    this.hudShips = [];
    this.screenObjs = [];
    AUDIO.playMusic('arcade');

    // ---- the cabinet around the glass ----
    this.add.rectangle(0, 0, 400, 225, colorOf(px(RAMP.PURPLE, 1))).setOrigin(0, 0).setDepth(0);
    this.add.rectangle(2, 2, 396, 221, colorOf(px(RAMP.PURPLE, 0))).setOrigin(0, 0).setDepth(0);
    // marquee
    this.add.rectangle(6, 4, 388, 16, colorOf(px(RAMP.GOLD, 2))).setOrigin(0, 0).setDepth(1);
    this.add
      .bitmapText(200, 8, 'retro', ARCADE_TEXT.marquee, 6)
      .setOrigin(0.5, 0)
      .setDepth(2)
      .setTint(colorOf(px(RAMP.INK, 0)));
    // the glass
    this.add.rectangle(CRT_X, CRT_Y, CRT_W, CRT_H, colorOf(px(RAMP.NIGHT, 0))).setOrigin(0, 0).setDepth(1);
    // phosphor starfield — fixed, deliberate, part of the cabinet
    const stars = [
      [60, 70, 3], [130, 150, 2], [210, 60, 3], [300, 120, 2], [350, 180, 3],
      [90, 180, 2], [250, 170, 3], [170, 100, 2], [330, 50, 2], [40, 130, 3],
    ] as const;
    for (const [sx, sy, sh] of stars) {
      this.add.rectangle(sx, sy, 1, 1, colorOf(px(RAMP.NIGHT, sh))).setOrigin(0, 0).setDepth(2);
    }
    // scanlines over everything on the glass
    this.add
      .tileSprite(CRT_X, CRT_Y, CRT_W, CRT_H, 'arc_scanline')
      .setOrigin(0, 0)
      .setDepth(40)
      .setAlpha(0.14);

    // HUD (inside the glass)
    this.hudScore = this.add.bitmapText(CRT_X + 6, CRT_Y + 4, 'retro', '', 6).setDepth(30).setTint(colorOf(px(RAMP.GOLD, 3)));
    this.hudTime = this.add
      .bitmapText(CRT_R - 6, CRT_Y + 4, 'retro', '', 6)
      .setOrigin(1, 0)
      .setDepth(30)
      .setTint(colorOf(px(RAMP.CYAN, 2)));
    this.banner = this.add
      .bitmapText(200, 70, 'retro', '', 6)
      .setOrigin(0.5, 0)
      .setDepth(31)
      .setCenterAlign()
      .setMaxWidth(CRT_W - 30)
      .setTint(colorOf(px(RAMP.GOLD, 3)));

    this.ship = this.add.image(40, laneY(2), 'arc_ship').setDepth(10).setVisible(false);

    this.showAttract();
  }

  /* ================= attract / table chrome ================= */

  private clearScreen(): void {
    this.grid?.destroy();
    this.grid = null;
    this.screenObjs.forEach((o) => o.destroy());
    this.screenObjs = [];
    this.rosterLine = null;
  }

  private showAttract(): void {
    this.clearScreen();
    this.state = 'attract';
    this.attractT = 0;
    const add = (o: Phaser.GameObjects.GameObject): void => {
      this.screenObjs.push(o);
    };
    add(
      this.add
        .bitmapText(200, 38, 'retro', ARCADE_TEXT.marquee, 12)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.GOLD, 3))),
    );
    add(
      this.add
        .bitmapText(200, 58, 'retro', vars(ARCADE_TEXT.attractTag), 6)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.MAGENTA, 2))),
    );
    this.drawTable(78, add);
    this.rosterLine = this.add
      .bitmapText(200, 172, 'retro', ARCADE_TEXT.rosterMoth, 6)
      .setOrigin(0.5, 0)
      .setDepth(20)
      .setTint(colorOf(px(RAMP.CYAN, 2)));
    add(this.rosterLine);
    add(
      this.add
        .bitmapText(200, 186, 'retro', ARCADE_TEXT.freeplay, 6)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.NIGHT, 3))),
    );
    add(
      this.add
        .bitmapText(200, 198, 'retro', ARCADE_TEXT.insert, 6)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.PAPER, 3))),
    );
  }

  /** the five rows, MGR and all — straight off the save (v4) */
  private drawTable(y0: number, add: (o: Phaser.GameObjects.GameObject) => void, blinkRank?: number): void {
    add(
      this.add
        .bitmapText(200, y0, 'retro', ARCADE_TEXT.tableTitle, 6)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.PAPER, 3))),
    );
    for (let i = 0; i < SCORE_ROWS; i++) {
      const row = GS.data.arcadeScores[i];
      const label = row
        ? `${i + 1}. ${row.initials.padEnd(3, ' ')}  ${String(row.score).padStart(6, '0')}`
        : `${i + 1}. ${ARCADE_TEXT.emptyRow}  ------`;
      const t = this.add
        .bitmapText(200, y0 + 14 + i * 13, 'retro', label, 6)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(row ? (i === 0 ? RAMP.GOLD : RAMP.PAPER) : RAMP.NIGHT, i === 0 ? 3 : 2)));
      if (blinkRank === i) {
        this.tweens.add({ targets: t, alpha: { from: 1, to: 0.25 }, duration: 320, yoyo: true, repeat: -1 });
      }
      add(t);
    }
  }

  /* ================= the run ================= */

  private startRun(): void {
    this.clearScreen();
    this.state = 'ready';
    this.simT = 0;
    this.attractT = 0;
    this.spawns = buildSpawns();
    this.nextSpawn = 0;
    this.score = 0;
    this.lives = ARCADE.ship.lives;
    this.fireCd = 0;
    this.invulnUntil = 0;
    this.bossSpawned = false;
    this.bossCleared = false;
    this.topBefore = GS.arcadeTopScore();
    this.foes.forEach((f) => f.spr.destroy());
    this.foes = [];
    this.bolts.forEach((b) => b.destroy());
    this.bolts = [];
    this.letters.forEach((l) => l.txt.destroy());
    this.letters = [];
    // sitting down at the machine is entering the quest (§A10 #4 arms either
    // here or at Sal's ask — no order dependency, zero missables)
    if (!GS.flag('q_arcade')) GS.setFlag('q_arcade');
    this.ship.setPosition(40, laneY(2)).setVisible(true).setAlpha(1);
    this.refreshHud();
    this.showBanner(vars(ARCADE_TEXT.ready), 900);
    AUDIO.sfx('confirm');
  }

  private refreshHud(): void {
    this.hudScore.setText(`SCORE ${String(this.score).padStart(6, '0')}`);
    const left = Math.max(0, Math.ceil((ARCADE.runMs - this.simT) / 1000));
    this.hudTime.setText(this.state === 'play' || this.state === 'ready' ? `TIME ${left}` : '');
    while (this.hudShips.length < Math.max(0, this.lives - 1)) {
      const i = this.hudShips.length;
      this.hudShips.push(this.add.image(CRT_X + 14 + i * 20, CRT_B - 10, 'arc_ship').setDepth(30).setAlpha(0.85));
    }
    while (this.hudShips.length > Math.max(0, this.lives - 1)) {
      this.hudShips.pop()?.destroy();
    }
  }

  private showBanner(text: string, ms: number): void {
    this.banner.setText(text);
    this.bannerUntil = this.simT + ms;
  }

  /* ================= update ================= */

  override update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 50);
    if (this.asking) return;

    if (this.state === 'attract' || this.state === 'table') {
      this.attractT += dt;
      if (this.rosterLine && this.state === 'attract') {
        const roster = [ARCADE_TEXT.rosterMoth, ARCADE_TEXT.rosterRock, ARCADE_TEXT.rosterSaucer];
        this.rosterLine.setText(roster[Math.floor(this.attractT / 2400) % roster.length]);
      }
      if (INPUT.justPressed('A')) {
        if (this.state === 'table') this.showAttract();
        else this.startRun();
      } else if (INPUT.justPressed('B')) {
        this.exitCabinet();
      }
      return;
    }

    if (this.state === 'ready') {
      this.simT += dt;
      if (this.simT >= 900) {
        this.state = 'play';
        this.simT = 0;
        this.banner.setText('');
      }
      return;
    }

    if (this.state !== 'play') return;

    // ---- the deterministic sim ----
    if (INPUT.justPressed('B')) {
      void this.ejectAsk();
      return;
    }
    this.simT += dt;
    if (this.banner.text !== '' && this.simT > this.bannerUntil) this.banner.setText('');

    this.moveShip(dt);
    this.fire(dt);
    this.spawnDue();
    this.moveFoes(dt);
    this.moveBolts(dt);
    this.moveLetters(dt);
    this.collide();
    this.refreshHud();

    if (this.simT >= ARCADE.bossBannerT && !this.bossSpawned && this.simT < ARCADE.bossT) {
      if (this.banner.text === '') this.showBanner(vars(ARCADE_TEXT.bossBanner), ARCADE.bossT - this.simT);
    }
    if (this.simT >= ARCADE.bossT && !this.bossSpawned) this.spawnBoss();

    if (this.simT >= ARCADE.runMs) void this.endRun(ARCADE_TEXT.timeUp);
  }

  private moveShip(dt: number): void {
    const d = INPUT.dir();
    const sp = (ARCADE.ship.speed * dt) / 1000;
    this.ship.x = Phaser.Math.Clamp(this.ship.x + d.x * sp, CRT_X + 12, CRT_X + CRT_W * 0.55);
    this.ship.y = Phaser.Math.Clamp(this.ship.y + d.y * sp, CRT_Y + 22, CRT_B - 12);
    // invulnerability blinks on the sim clock (deterministic, dt-scaled)
    this.ship.setAlpha(this.simT < this.invulnUntil ? (Math.floor(this.simT / 90) % 2 === 0 ? 0.35 : 0.9) : 1);
  }

  private fire(dt: number): void {
    this.fireCd -= dt;
    if (!INPUT.held('A') || this.fireCd > 0) return;
    this.fireCd = ARCADE.ship.fireCdMs;
    this.bolts.push(this.add.image(this.ship.x + 10, this.ship.y, 'arc_bolt').setDepth(9));
    AUDIO.sfx('text');
  }

  private spawnDue(): void {
    while (this.nextSpawn < this.spawns.length && this.spawns[this.nextSpawn].t <= this.simT) {
      const s = this.spawns[this.nextSpawn++];
      const spr = this.add.image(CRT_R + 12, laneY(s.lane), `arc_${s.kind}`).setDepth(8);
      this.foes.push({
        spr,
        kind: s.kind,
        hp: ARCADE.foes[s.kind].hp,
        baseY: laneY(s.lane),
        t0: this.simT,
        phase: (s.lane * 7 + this.nextSpawn) % 6,
        dead: false,
      });
    }
  }

  private moveFoes(dt: number): void {
    for (const f of this.foes) {
      if (f.dead) continue;
      const age = this.simT - f.t0;
      f.spr.x += (ARCADE.foes[f.kind].vx * dt) / 1000;
      if (f.kind === 'moth') {
        f.spr.y = f.baseY + Math.sin(age / 260 + f.phase) * 14;
      } else if (f.kind === 'saucer') {
        // zigzag: flips heading every 700ms of its own age
        const leg = Math.floor(age / 700);
        const dir = (leg + f.phase) % 2 === 0 ? 1 : -1;
        f.spr.y = Phaser.Math.Clamp(f.spr.y + (dir * 46 * dt) / 1000, CRT_Y + 20, CRT_B - 12);
      } else if (f.kind === 'corndog') {
        f.spr.y = f.baseY + Math.sin(age / 320) * 6;
      }
      if (f.spr.x < CRT_X - 16) {
        f.dead = true;
        f.spr.destroy();
      }
    }
    this.foes = this.foes.filter((f) => !f.dead);
  }

  private moveBolts(dt: number): void {
    for (const b of this.bolts) {
      b.x += (ARCADE.ship.bulletSpeed * dt) / 1000;
    }
    this.bolts = this.bolts.filter((b) => {
      if (b.x > CRT_R + 6) {
        b.destroy();
        return false;
      }
      return b.active;
    });
  }

  /** THE {coolthing}: the words themselves fly in, letter by letter */
  private spawnBoss(): void {
    this.bossSpawned = true;
    this.banner.setText('');
    const word = vars('{coolthing}').toUpperCase();
    const chars = [...word].filter((c) => c !== ' ');
    chars.forEach((ch, idx) => {
      const txt = this.add
        .bitmapText(CRT_R + 14 + idx * 18, 120, 'retro', ch, 12)
        .setOrigin(0.5, 0.5)
        .setDepth(8)
        .setTint(colorOf(px(RAMP.MAGENTA, 3)));
      this.letters.push({ txt, idx, dead: false });
    });
  }

  /** formation spacing — long coolthings tighten so the tail stays on-glass */
  private letterGap(): number {
    return Math.min(18, Math.floor(210 / Math.max(1, this.letters.length)));
  }

  private moveLetters(dt: number): void {
    const gap = this.letterGap();
    for (const l of this.letters) {
      if (l.dead) continue;
      // the snake: drift in, then weave on the midline
      if (l.txt.x > CRT_X + 140 + l.idx * gap) l.txt.x -= (38 * dt) / 1000;
      l.txt.y = 120 + Math.sin(this.simT / 290 + l.idx * 0.7) * 38;
    }
  }

  private letterPts(): number {
    const n = Math.max(1, this.letters.length);
    return Math.ceil(ARCADE.pts.letterPool / n);
  }

  /* ================= collisions ================= */

  private collide(): void {
    const shipBox = new Phaser.Geom.Rectangle(this.ship.x - 6, this.ship.y - 3, 13, 7);
    const boxOf = (img: Phaser.GameObjects.Image | Phaser.GameObjects.BitmapText, w: number, h: number): Phaser.Geom.Rectangle =>
      new Phaser.Geom.Rectangle(img.x - w / 2, img.y - h / 2, w, h);
    const foeSize: Record<FoeKind, [number, number]> = {
      moth: [10, 8],
      rock: [12, 10],
      saucer: [13, 8],
      corndog: [14, 6],
    };

    // bolts vs foes + letters
    for (const b of this.bolts) {
      if (!b.active) continue;
      const bBox = new Phaser.Geom.Rectangle(b.x - 2, b.y - 1, 5, 3);
      for (const f of this.foes) {
        if (f.dead) continue;
        const [fw, fh] = foeSize[f.kind];
        if (!Phaser.Geom.Rectangle.Overlaps(bBox, boxOf(f.spr, fw, fh))) continue;
        b.destroy();
        if (f.kind === 'corndog') {
          // you SHOT it. the cabinet remembers this.
          f.dead = true;
          this.popFoe(f.spr.x, f.spr.y, ARCADE.foes.corndog.pts);
          f.spr.destroy();
          this.showBanner(ARCADE_TEXT.shootDog, 1500);
          AUDIO.sfx('cancel');
        } else {
          f.hp -= 1;
          if (f.hp <= 0) {
            f.dead = true;
            this.popFoe(f.spr.x, f.spr.y, ARCADE.foes[f.kind].pts);
            f.spr.destroy();
            AUDIO.sfx('hit');
          } else {
            f.spr.setTintFill(0xffffff);
            this.time.delayedCall(60, () => f.spr.clearTint()); // cosmetic only
            AUDIO.sfx('cursor');
          }
        }
        break;
      }
      if (!b.active) continue;
      for (const l of this.letters) {
        if (l.dead || l.txt.x > CRT_R) continue;
        if (!Phaser.Geom.Rectangle.Overlaps(bBox, boxOf(l.txt, 10, 12))) continue;
        b.destroy();
        l.dead = true;
        this.popFoe(l.txt.x, l.txt.y, this.letterPts());
        l.txt.destroy();
        AUDIO.sfx('ember');
        if (this.letters.every((x) => x.dead) && !this.bossCleared) {
          this.bossCleared = true;
          this.score += ARCADE.pts.coolBonus;
          this.showBanner(ARCADE_TEXT.coolBonus, 1800);
          AUDIO.sfx('smash');
        }
        break;
      }
    }
    this.foes = this.foes.filter((f) => !f.dead);
    this.bolts = this.bolts.filter((b) => b.active);

    // ship vs world (skip while blinking)
    if (this.simT < this.invulnUntil) return;
    for (const f of this.foes) {
      const [fw, fh] = foeSize[f.kind];
      if (!Phaser.Geom.Rectangle.Overlaps(shipBox, boxOf(f.spr, fw, fh))) continue;
      if (f.kind === 'corndog') {
        f.dead = true;
        f.spr.destroy();
        this.score += ARCADE.pts.corndogEat;
        this.popFoe(this.ship.x, this.ship.y - 10, ARCADE.pts.corndogEat);
        this.showBanner(ARCADE_TEXT.eatDog, 1500);
        AUDIO.sfx('heal');
        continue;
      }
      this.shipHit();
      return;
    }
    for (const l of this.letters) {
      if (l.dead) continue;
      if (Phaser.Geom.Rectangle.Overlaps(shipBox, boxOf(l.txt, 10, 12))) {
        this.shipHit();
        return;
      }
    }
    this.foes = this.foes.filter((f) => !f.dead);
  }

  private popFoe(x: number, y: number, pts: number): void {
    this.score += pts;
    const burst = this.add.sprite(x, y, 'spark', 0).setDepth(12);
    this.time.delayedCall(80, () => burst.setFrame(1)); // cosmetic only
    this.time.delayedCall(180, () => burst.destroy());
    const t = this.add
      .bitmapText(x, y - 6, 'retro', `+${pts}`, 6)
      .setOrigin(0.5, 1)
      .setDepth(13)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 420, onComplete: () => t.destroy() });
  }

  private shipHit(): void {
    this.lives -= 1;
    AUDIO.sfx('thud');
    this.cameras.main.shake(120, 0.004);
    this.refreshHud();
    if (this.lives <= 0) {
      this.ship.setVisible(false);
      void this.endRun(ARCADE_TEXT.shipsOut);
      return;
    }
    this.invulnUntil = this.simT + ARCADE.ship.invulnMs;
    this.ship.setPosition(40, laneY(2));
  }

  /* ================= eject / tally / initials ================= */

  private async ejectAsk(): Promise<void> {
    this.asking = true;
    const pick = await this.dlg.ask(['Keep flying', 'EJECT'], { cancelIndex: 0 });
    this.asking = false;
    if (pick !== 1) return;
    this.showBanner(ARCADE_TEXT.eject, 1200);
    this.foes.forEach((f) => f.spr.destroy());
    this.foes = [];
    this.bolts.forEach((b) => b.destroy());
    this.bolts = [];
    this.letters.forEach((l) => l.txt.destroy());
    this.letters = [];
    this.ship.setVisible(false);
    this.hudTime.setText('');
    this.showAttract(); // the score keeps its secrets — nothing submits
  }

  private async endRun(reason: string): Promise<void> {
    this.state = 'tally';
    this.hudTime.setText('');
    this.foes.forEach((f) => f.spr.destroy());
    this.foes = [];
    this.bolts.forEach((b) => b.destroy());
    this.bolts = [];
    this.letters.forEach((l) => l.txt.destroy());
    this.letters = [];
    this.ship.setVisible(false);
    this.banner.setText('');

    // quest #4: beating the table's top row (MGR until somebody isn't) —
    // recorded BEFORE initials so the flags never depend on the table write
    const beatTop = this.score > this.topBefore;
    if (beatTop && GS.flag('q_arcade_beat') !== true) {
      GS.setFlag('q_arcade');
      GS.setFlag('q_arcade_beat');
    }

    this.clearScreen();
    const add = (o: Phaser.GameObjects.GameObject): void => {
      this.screenObjs.push(o);
    };
    add(
      this.add
        .bitmapText(200, 70, 'retro', reason, 8)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.PAPER, 3))),
    );
    add(
      this.add
        .bitmapText(200, 92, 'retro', `SCORE ${String(this.score).padStart(6, '0')}`, 12)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.GOLD, 3))),
    );
    AUDIO.sfx(beatTop ? 'smash' : 'confirm');

    const rank = GS.arcadeRankOf(this.score);
    if (rank === null) {
      // no row for this one — straight back to the legends
      await this.waitMs(1400);
      this.showTable(undefined, beatTop);
      return;
    }
    await this.waitMs(1100);
    this.enterInitials(rank, beatTop);
  }

  /** scene-frame wait (pump-friendly — everyFrame per ADR-024) */
  private waitMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      let left = ms;
      const off = everyFrame(this, (dtMs) => {
        left -= Math.min(dtMs, 50);
        if (left <= 0) {
          off();
          resolve();
        }
      });
    });
  }

  private enterInitials(rank: number, beatTop: boolean): void {
    this.state = 'initials';
    this.clearScreen(); // the grid needs the glass — tally text clears
    const add = (o: Phaser.GameObjects.GameObject): void => {
      this.screenObjs.push(o);
    };
    add(
      this.add
        .bitmapText(200, 30, 'retro', ARCADE_TEXT.newHigh, 8)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.MAGENTA, 3))),
    );
    add(
      this.add
        .bitmapText(118, 48, 'retro', ARCADE_TEXT.initialsPrompt, 6)
        .setOrigin(0, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.PAPER, 2))),
    );
    const valueText = this.add
      .bitmapText(266, 44, 'retro', '', 8)
      .setOrigin(0, 0)
      .setDepth(21)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    add(valueText);

    // prefilled from {playername}'s first letters (grid-typeable only)
    const charset = gridCharset();
    const prefill = [...GS.data.playerName.toUpperCase()]
      .filter((c) => c !== ' ' && charset.has(c))
      .slice(0, 3)
      .join('');
    const render = (v: string): void => {
      valueText.setText([...v.padEnd(3, '_')].join(' '));
    };
    render(prefill);

    // the shared ADR-013 grid, initials trim: BACK/OK only, cap 3 — the
    // letter cells sit where they always sit, so thumbs already know it
    this.grid = new LetterGrid(this, {
      cap: 3,
      value: prefill,
      buttons: ['back', 'ok'],
      makeBox,
      onChange: render,
      onOk: (v) => {
        const rowAt = GS.submitArcadeScore(v, this.score);
        AUDIO.sfx('smash');
        this.showTable(rowAt ?? rank, beatTop);
      },
    });
  }

  private showTable(blinkRank: number | undefined, beatTop: boolean): void {
    this.clearScreen();
    this.state = 'table';
    const add = (o: Phaser.GameObjects.GameObject): void => {
      this.screenObjs.push(o);
    };
    this.drawTable(64, add, blinkRank);
    if (beatTop) {
      add(
        this.add
          .bitmapText(200, 150, 'retro', ARCADE_TEXT.dethroned, 6)
          .setOrigin(0.5, 0)
          .setDepth(20)
          .setTint(colorOf(px(RAMP.MAGENTA, 3))),
      );
      add(
        this.add
          .bitmapText(200, 164, 'retro', ARCADE_TEXT.tellSal, 6)
          .setOrigin(0.5, 0)
          .setDepth(20)
          .setTint(colorOf(px(RAMP.PAPER, 2))),
      );
    }
    add(
      this.add
        .bitmapText(200, 192, 'retro', ARCADE_TEXT.insert, 6)
        .setOrigin(0.5, 0)
        .setDepth(20)
        .setTint(colorOf(px(RAMP.PAPER, 3))),
    );
    AUDIO.sfx('confirm');
  }

  private exitCabinet(): void {
    AUDIO.sfx('cancel');
    AUDIO.stopMusic();
    this.game.events.emit('mf-arcade-closed');
    this.scene.stop();
  }
}
