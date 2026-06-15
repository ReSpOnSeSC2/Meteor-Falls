/**
 * LinksScene — COSTA ESTRELLA LINKS (S13). The S10/S12 minigame law: its own
 * scene over a paused OverworldScene (launched by the CADDY, emits
 * 'mf-links-closed'), the EXISTING input layer through the rebindable table
 * (ADR-024/036), everyFrame/update polling only, and a DETERMINISTIC
 * Phaser-free sim underneath (src/links/sim.ts — same seed + same tape =
 * same card; vitest proves it headlessly, hole by hole).
 *
 * THE TABLE VIEW: ¾ overhead course (per-hole texture: terrain + slope
 * arrows + cup, painted by spritegen/golfers.ts — the ground IS the rules),
 * the ball-cam riding every flight (draw/fade visible, splash/sand bursts
 * per ADR-020). THE SWING PANE: a fixed close-up window where the LARGE
 * golfer sheet (cut from the S12 sport-sheet contract, the player's own
 * hero) addresses, coils with the power tick, strikes, follows through,
 * fist-pumps, and slumps the universal sad putter slump. Meters live in the
 * pane: power bounces (let it die = cancel), accuracy falls into the
 * shrinking perfect window (push/pull curve the flight); putt and chip run
 * the power tap alone.
 *
 * FORMATS: STROKE PLAY — eighteen holes, EXP forever by the card (strokeExp) +
 * one seeded clubhouse drop. MATCH PLAY (the Invitational) — three holes
 * vs a GOLFERS entrant whose card rolls honestly off acc/agg; all square
 * after three = sudden death. The bracket lives on NUMBER FLAGS
 * (links_seed/links_round/links_titles/links_played — ADR-015's prefer-
 * flags clause); the scene saves the active notebook after every match.
 *
 * BOT RECIPE (ADR-008 — the same line the vitest driver pins): loop sleeps
 * end to end; from the caddy ask row 0 → hole card KeyZ → per stroke:
 * KeyZ (start meter) · poll sim.meterT, KeyZ at want (putt: √(2·f·d)/V,
 * chip: d/(32y), full: ≥0.99) · KeyZ when meterT ≤ accWindow·0.4 — hole 1
 * closes tee-to-cup REPRODUCIBLY (sim.test.ts plays the identical line
 * headlessly, twice, byte-equal logs). Score card: KeyZ advances.
 */
import Phaser from 'phaser';
import { GS, expForLevel } from '../engine/state';
import { statsAtLevel, maxHpAtLevel, maxPpAtLevel, HEROES } from '../data/heroes';
import { ABILITIES } from '../data/abilities';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GolfSim, GOLF, windOf, windPutts, type GolfInput, type GolfEvent } from '../links/sim';
import { CLUBS, HOLES, COURSE_PAR, yards, dist, type HoleDef } from '../links/course';
import {
  GOLFERS,
  LINKS_TEXT,
  LINKS_REWARDS,
  LINKS_FLAGS,
  golferHoleScore,
  linksNextOpponent,
  matchHoles,
  strokeExp,
  strokeSeed,
  linksSeed,
} from '../data/links';
import { GOLF_FRAME } from '../spritegen/golfers';
import { ensureLinksArt } from '../spritegen';
import { ITEMS } from '../data/items';
import { makeRng, type Rng } from '../hoops/sim';
import { Dialogue, everyFrame, makeWindow, vars, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import { s } from '../spritegen/scale';

export interface LinksLaunch {
  kind: 'stroke' | 'match';
  /** match: the bracket round (0..4) — flags carry seed + round */
  round?: number;
}

type Stage = 'card' | 'play' | 'score' | 'tally';

export class LinksScene extends Phaser.Scene {
  private cfg!: LinksLaunch;
  private dlg!: Dialogue;
  private asking = false;
  private stage: Stage = 'card';

  private sim!: GolfSim;
  private holeIdx = 0;
  private holes: HoleDef[] = [];
  private roundRng!: Rng;
  private wind!: { x: number; y: number; mph: number };
  private voice!: Rng;
  private strokesByHole: number[] = [];
  /** match play: holes won */
  private upUs = 0;
  private upThem = 0;
  private opponentId = '';
  private sunsetSaid = false;

  private course!: Phaser.GameObjects.Image;
  private ballSpr!: Phaser.GameObjects.Image;
  private flag!: Phaser.GameObjects.Image;
  private golfer!: Phaser.GameObjects.Sprite;
  private aimLine!: Phaser.GameObjects.Rectangle;
  private burst!: Phaser.GameObjects.Sprite;

  // HUD + the swing pane
  private hudTop!: Phaser.GameObjects.BitmapText;
  private hudWind!: Phaser.GameObjects.BitmapText;
  private hudClub!: Phaser.GameObjects.BitmapText;
  private ticker!: Phaser.GameObjects.BitmapText;
  private tickerUntil = 0;
  private banner!: Phaser.GameObjects.BitmapText;
  private bannerUntil = 0;
  private meterFill!: Phaser.GameObjects.Rectangle;
  private meterWin!: Phaser.GameObjects.Rectangle;
  private meterZero!: Phaser.GameObjects.Rectangle;
  /** S14b: the captured-power mark + the falling accuracy needle — the
   *  fill RISES and HOLDS; only the needle comes back down */
  private meterMark!: Phaser.GameObjects.Rectangle;
  private meterNeedle!: Phaser.GameObjects.Rectangle;
  private panelObjs: Phaser.GameObjects.GameObject[] = [];
  private elapsed = 0;
  private golferKey = '';

  constructor() {
    super('links');
  }

  create(data: LinksLaunch): void {
    this.cfg = data;
    this.dlg = new Dialogue(this);
    this.asking = false;
    this.elapsed = 0;
    this.holeIdx = 0;
    this.strokesByHole = [];
    this.upUs = 0;
    this.upThem = 0;
    this.sunsetSaid = false;

    const titles = Number(GS.flag(LINKS_FLAGS.titles)) || 0;
    const played = Number(GS.flag(LINKS_FLAGS.played)) || 0;
    if (data.kind === 'match') {
      const seed = Number(GS.flag(LINKS_FLAGS.seed)) || linksSeed(titles, played);
      const round = data.round ?? 0;
      this.roundRng = makeRng((seed ^ ((round + 1) * 0x517)) >>> 0);
      this.holes = matchHoles(round);
      this.opponentId = linksNextOpponent(seed, round);
      this.voice = makeRng((seed ^ 0xcadd) >>> 0);
    } else {
      const seed = strokeSeed(played);
      this.roundRng = makeRng(seed);
      this.holes = [...HOLES];
      this.voice = makeRng((seed ^ 0xcadd) >>> 0);
    }
    this.wind = windOf(this.roundRng);

    // textures: eighteen grounds + ball + flag + bursts + the hero's golf sheet
    const hero = GS.data.party[0];
    this.golferKey = ensureLinksArt(this, hero.id);

    // ---- the world (per-hole texture swaps in startHole) ----
    // night backdrop: the course is narrower than the screen — the paused
    // world must never show through the gutters
    this.add.image(0, 0, 'links_bg').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height).setScrollFactor(0).setDepth(-3);
    this.course = this.add.image(0, 0, `links_${this.holes[0].id}`).setOrigin(0, 0).setDepth(0);
    this.flag = this.add.image(0, 0, 'links_flag').setOrigin(0.5, 1).setDepth(20);
    this.ballSpr = this.add.image(0, 0, 'links_ball').setDepth(30);
    this.aimLine = this.add.rectangle(0, 0, s(2), s(2), colorOf(px(RAMP.PAPER, 3))).setDepth(25).setAlpha(0.8);
    this.burst = this.add.sprite(0, 0, 'links_splash', 0).setDepth(35).setVisible(false);
    this.golfer = this.add.sprite(0, 0, this.golferKey, 0).setOrigin(0.5, 1).setDepth(28);

    // ---- HUD ---- (screen-space px on the ×ART_SCALE framebuffer → s())
    const paper = colorOf(px(RAMP.PAPER, 3));
    const gold = colorOf(px(RAMP.GOLD, 3));
    this.hudTop = this.add.bitmapText(s(200), s(4), 'retro', '', s(6)).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_UI).setTint(gold);
    this.hudWind = this.add.bitmapText(s(396), s(14), 'retro', '', s(6)).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_UI).setTint(colorOf(px(RAMP.CYAN, 2)));
    this.hudClub = this.add.bitmapText(s(4), s(14), 'retro', '', s(6)).setScrollFactor(0).setDepth(DEPTH_UI).setTint(paper);
    this.ticker = this.add
      .bitmapText(s(200), s(24), 'retro', '', s(6))
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI)
      .setCenterAlign()
      .setMaxWidth(s(380))
      .setTint(colorOf(px(RAMP.MAGENTA, 2)));
    this.banner = this.add
      .bitmapText(s(200), s(92), 'retro', '', s(12))
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI)
      .setCenterAlign()
      .setTint(gold);
    // THE SWING PANE: the big golfer + the meters, fixed bottom-left
    this.panelObjs = [];
    makeWindow(this, s(4), s(138), s(78), s(84));
    // the golfer TEXTURE is already ×ART_SCALE; setScale(1.6) is a fixed
    // multiplier on top, so it stays — only the pane's position scales
    const pane = this.add.sprite(s(36), s(216), this.golferKey, 0).setOrigin(0.5, 1).setScale(1.6).setScrollFactor(0).setDepth(DEPTH_UI + 2);
    this.golferPane = pane;
    this.add.rectangle(s(70), s(214), s(7), s(68), colorOf(px(RAMP.INK, 0))).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_UI + 2);
    // S14b: fill + window size by SCALE off a full-height quad — assigning
    // a Phaser Shape's .height does not rebuild its rendered geometry (the
    // root cause of the reported "fill going the wrong way": it never grew)
    this.meterWin = this.add.rectangle(s(70), s(214), s(7), s(68), colorOf(px(RAMP.GRASS, 2))).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_UI + 3).setVisible(false);
    this.meterZero = this.add.rectangle(s(70), s(214), s(9), s(1), colorOf(px(RAMP.GOLD, 3))).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_UI + 4).setVisible(false);
    this.meterFill = this.add.rectangle(s(70), s(214), s(5), s(68), colorOf(px(RAMP.PAPER, 3))).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_UI + 3).setVisible(false);
    this.meterMark = this.add.rectangle(s(70), s(214), s(9), s(1), colorOf(px(RAMP.GOLD, 3))).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH_UI + 4).setVisible(false);
    this.meterNeedle = this.add.rectangle(s(70), s(214), s(9), s(2), colorOf(px(RAMP.CYAN, 3))).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH_UI + 4).setVisible(false);

    AUDIO.playMusic('cage');
    this.game.events.emit('mf-links-open');
    this.startHole(0);
  }

  private golferPane!: Phaser.GameObjects.Sprite;

  /* ================= hole flow ================= */

  private startHole(i: number): void {
    this.holeIdx = i;
    const hole = this.holes[i];
    this.sim = new GolfSim(hole, this.roundRng, this.wind);
    this.course.setTexture(`links_${hole.id}`);
    // bounds auto-read the seam-upscaled (×ART_SCALE) hole texture
    this.cameras.main.setBounds(0, 0, this.course.width, this.course.height);
    // pin is native px; the flag rides the runtime world, so scale it + offset
    this.flag.setPosition(s(hole.pin.x) + s(2), s(hole.pin.y) + s(1));
    this.showHoleCard(hole);
    // the caddy reads the tee (hole 9 at golden hour gets the straight line)
    if (hole.id === 'h9' && !this.sunsetSaid) {
      this.sunsetSaid = true;
      this.say(LINKS_TEXT.caddySunset, 5200);
    } else {
      this.caddyTeeLine(hole);
    }
  }

  private caddyTeeLine(hole: HoleDef): void {
    // yards() divides by YD (runtime px/yd); feed it the runtime tee→pin span
    const yds = yards(dist(s(hole.tee.x), s(hole.tee.y), s(hole.pin.x), s(hole.pin.y)));
    const line = LINKS_TEXT.caddyTee[Math.floor(this.voice() * LINKS_TEXT.caddyTee.length)]
      .replace('{yds}', String(yds))
      .replace('{putts}', String(Math.round(yds / 8)))
      .replace('{club}', CLUBS[this.sim.clubIdx].name);
    this.say(line, 4200);
  }

  private showHoleCard(hole: HoleDef): void {
    this.stage = 'card';
    this.clearPanel();
    const gold = colorOf(px(RAMP.GOLD, 3));
    const paper = colorOf(px(RAMP.PAPER, 2));
    this.panelWindow(s(28), s(36), s(344), s(142));
    this.panelText(s(200), s(46), LINKS_TEXT.title, s(8), gold);
    this.panelText(s(200), s(62), hole.plaque, s(6), paper);
    if (this.cfg.kind === 'match') {
      const g = GOLFERS[this.opponentId];
      this.panelText(s(200), s(96), `${LINKS_TEXT.boardYou}  vs  ${g.name.toUpperCase()}`, s(8), gold);
      this.panelText(s(200), s(112), LINKS_TEXT.boardLine.replace('{n}', g.line), s(6), paper);
      this.panelText(s(200), s(142), `HOLES: YOU ${this.upUs} — ${this.upThem} THEM`, s(6), colorOf(px(RAMP.CYAN, 2)));
    } else {
      const sofar = this.scoreVsPar();
      this.panelText(s(200), s(104), `THE CARD SO FAR: ${sofar > 0 ? '+' : ''}${sofar}`, s(6), colorOf(px(RAMP.CYAN, 2)));
    }
    this.panelText(s(200), s(162), 'A: PLAY    B: WALK OFF', s(6), paper);
  }

  private scoreVsPar(): number {
    return this.strokesByHole.reduce((s, st, i) => s + st - this.holes[i].par, 0);
  }

  /* ================= update ================= */

  override update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 50);
    this.elapsed += dt;
    if (this.asking) return;

    if (this.stage === 'card') {
      if (INPUT.justPressed('A')) {
        this.clearPanel();
        this.stage = 'play';
        AUDIO.sfx('confirm');
      } else if (INPUT.justPressed('B')) {
        void this.walkOffAsk();
      }
      this.render();
      return;
    }
    if (this.stage !== 'play') return;

    if (INPUT.justPressed('START')) {
      void this.pauseAsk();
      return;
    }
    const d = INPUT.dir();
    const input: GolfInput = {
      dx: Math.sign(d.x) as -1 | 0 | 1,
      dy: Math.sign(d.y) as -1 | 0 | 1,
      aPressed: INPUT.justPressed('A'),
      bPressed: INPUT.justPressed('B'),
    };
    this.sim.advance(dt, input);
    for (const e of this.sim.events) this.onEvent(e);
    this.sim.events.length = 0;
    this.render();
  }

  private onEvent(e: GolfEvent): void {
    switch (e.kind) {
      case 'sfx':
        AUDIO.sfx(e.name);
        break;
      case 'stroke': {
        this.showBanner(LINKS_TEXT.strokeLine.replace('{n}', String(e.n)), 700);
        // the strike read (ADR-038): PURE!/DRAW./FADE. pops at the ball —
        // the same one-frame verdict the cage gives a green release
        if (e.mode === 'full') {
          const tag = e.quality === 'pure' ? LINKS_TEXT.pure : e.quality === 'pull' ? LINKS_TEXT.pull : LINKS_TEXT.push;
          this.strikePopup(tag, e.quality === 'pure' ? RAMP.GRASS : RAMP.CYAN);
        }
        break;
      }
      case 'splash':
        this.burstAt('links_splash');
        this.say(LINKS_TEXT.splash, 2600);
        break;
      case 'land':
        if (e.terrain === 'S') {
          this.burstAt('links_sand');
          this.say(LINKS_TEXT.sand, 2200);
        }
        if (e.terrain === 'G') this.say(LINKS_TEXT.caddyGreen[Math.floor(this.voice() * LINKS_TEXT.caddyGreen.length)], 3000);
        break;
      case 'cliff':
        this.say(LINKS_TEXT.cliff, 2200);
        break;
      case 'holed':
        void this.holeDone(e.strokes, e.par);
        break;
    }
  }

  private burstAt(key: string): void {
    // ball is runtime px; the small upward lift is a runtime offset
    this.burst.setTexture(key, 0).setPosition(this.sim.ball.x, this.sim.ball.y - s(4)).setVisible(true);
    this.time.delayedCall(110, () => this.burst.setFrame(1));
    this.time.delayedCall(320, () => this.burst.setVisible(false));
  }

  /** a one-shot verdict popup over the ball (world-space, drifts up) */
  private strikePopup(text: string, ramp: number): void {
    const t = this.add
      .bitmapText(this.sim.ball.x, this.sim.ball.y - s(18), 'retro', text, s(8))
      .setOrigin(0.5, 1)
      .setDepth(60)
      .setTint(colorOf(px(ramp, 3)));
    this.tweens.add({ targets: t, y: t.y - s(14), alpha: 0, duration: 750, onComplete: () => t.destroy() });
  }

  /* ================= hole done / match arithmetic ================= */

  private scoreName(strokes: number, par: number): string {
    const d = strokes - par;
    if (d <= -3) return LINKS_TEXT.scoreNames[0];
    if (d === -2) return LINKS_TEXT.scoreNames[1];
    if (d === -1) return LINKS_TEXT.scoreNames[2];
    if (d === 0) return LINKS_TEXT.scoreNames[3];
    if (d === 1) return LINKS_TEXT.scoreNames[4];
    if (d === 2) return LINKS_TEXT.scoreNames[5];
    return LINKS_TEXT.scoreNames[6];
  }

  private async holeDone(strokes: number, par: number): Promise<void> {
    this.stage = 'score';
    this.strokesByHole.push(strokes);
    const name = this.scoreName(strokes, par);
    this.showBanner(`${LINKS_TEXT.holedBanner} ${name}.`, 1400);
    AUDIO.jingle(strokes <= par ? 'victory' : 'cage', strokes <= par ? 900 : 1, 'cage');
    await this.wait(900);

    if (this.cfg.kind === 'match') {
      const g = GOLFERS[this.opponentId];
      const theirs = golferHoleScore(g, this.holes[this.holeIdx], this.roundRng);
      if (strokes < theirs) {
        this.upUs += 1;
        this.say(LINKS_TEXT.matchWinHole, 2200);
      } else if (theirs < strokes) {
        this.upThem += 1;
        this.say(LINKS_TEXT.matchLoseHole.replace('{name}', g.name.toUpperCase()), 2200);
      } else {
        this.say(LINKS_TEXT.matchHalved, 2200);
      }
      await this.wait(700);
      const played = this.holeIdx + 1;
      const left = this.holes.length - played;
      if (played >= 3 && this.upUs !== this.upThem && (played >= this.holes.length || Math.abs(this.upUs - this.upThem) > left)) {
        await this.matchOver(this.upUs > this.upThem);
        return;
      }
      if (played >= this.holes.length) {
        if (this.upUs === this.upThem) {
          // SUDDEN DEATH: march on around the eighteen
          this.showBanner(LINKS_TEXT.suddenDeath, 1600);
          const nextHole = HOLES[(HOLES.indexOf(this.holes[this.holes.length - 1]) + 1) % HOLES.length];
          this.holes.push(nextHole);
        } else {
          await this.matchOver(this.upUs > this.upThem);
          return;
        }
      }
      this.startHole(this.holeIdx + 1);
      return;
    }
    // stroke play: eighteen and in
    if (this.holeIdx + 1 >= this.holes.length) {
      await this.strokeTally();
      return;
    }
    this.startHole(this.holeIdx + 1);
  }

  /* ================= rewards ================= */

  private async strokeTally(): Promise<void> {
    this.stage = 'tally';
    const score = this.scoreVsPar();
    const exp = strokeExp(score);
    GS.setFlag(LINKS_FLAGS.played, (Number(GS.flag(LINKS_FLAGS.played)) || 0) + 1);
    const lines: string[] = [];
    lines.push(LINKS_TEXT.tallyRound.replace('{score}', `${score > 0 ? '+' : ''}${score} (${COURSE_PAR + score} ON PAR ${COURSE_PAR})`).replace('{exp}', String(exp)));
    this.payExp(exp, lines);
    // one seeded clubhouse drop (forever — §A9-tuned)
    const t = LINKS_REWARDS.drops.table;
    const r = this.roundRng();
    const id = r < 0.3 ? t[0] : r < 0.55 ? t[1] : r < 0.8 ? t[2] : t[3];
    const fit = GS.data.party.find((p) => p.bag.length < 14);
    if (fit && GS.addItem(id, fit.id)) lines.push(LINKS_TEXT.tallyDrop.replace('{item}', ITEMS[id].name));
    if (GS.activeSlot !== null) GS.saveTo(GS.activeSlot);
    await this.tallyPanel('THE CARD IS SIGNED.', lines);
    this.close();
  }

  private async matchOver(won: boolean): Promise<void> {
    this.stage = 'tally';
    const round = this.cfg.round ?? 0;
    const titles = Number(GS.flag(LINKS_FLAGS.titles)) || 0;
    GS.setFlag(LINKS_FLAGS.played, (Number(GS.flag(LINKS_FLAGS.played)) || 0) + 1);
    const lines: string[] = [];
    let title = false;
    let cash = 0;
    if (won) {
      const exp = LINKS_REWARDS.invitational.roundWinExp[round];
      if (round >= 4) {
        // CHAMPION: the bracket retires; the caddy holds THE SUNDAY SET
        GS.setFlag(LINKS_FLAGS.round, 0);
        GS.setFlag(LINKS_FLAGS.seed, 0);
        GS.setFlag('links_bracket_live', false);
        GS.setFlag(LINKS_FLAGS.titles, titles + 1);
        title = true;
        if (titles + 1 > 1) {
          cash = LINKS_REWARDS.invitational.repeatTitleCash;
          GS.data.cashOnHand += cash;
        }
      } else {
        GS.setFlag(LINKS_FLAGS.round, round + 1);
      }
      lines.push(LINKS_TEXT.matchWin);
      this.payExp(exp, lines);
    } else {
      const exp = Math.floor(LINKS_REWARDS.invitational.roundWinExp[round] * LINKS_REWARDS.invitational.lossFrac);
      GS.setFlag(LINKS_FLAGS.round, 0);
      GS.setFlag(LINKS_FLAGS.seed, 0);
      GS.setFlag('links_bracket_live', false);
      lines.push(LINKS_TEXT.matchLoss);
      this.payExp(exp, lines);
    }
    if (title) lines.push(vars(LINKS_TEXT.tallyTitle));
    if (cash > 0) lines.push(LINKS_TEXT.tallyRepeat.replace('{cash}', String(cash)));
    if (GS.activeSlot !== null) GS.saveTo(GS.activeSlot);
    await this.tallyPanel(won ? LINKS_TEXT.matchWin : LINKS_TEXT.matchLoss, lines);
    this.close();
  }

  /** EXP through the Prompt-18 flow (the cage's tally, on grass) */
  private payExp(exp: number, lines: string[]): void {
    for (const hero of GS.data.party) {
      hero.exp += exp;
      lines.push(LINKS_TEXT.tallyExp.replace('{name}', hero.name).replace('{exp}', String(exp)));
      while (hero.exp >= expForLevel(hero.level + 1)) {
        hero.level += 1;
        const prevHp = hero.maxHp;
        const prevPp = hero.maxPp;
        hero.stats = statsAtLevel(hero.id, hero.level);
        // S17 (ADR-061): permanent HP/PP tonic boosts survive the recompute
        hero.maxHp = maxHpAtLevel(hero.id, hero.level) + (hero.boosts?.hp ?? 0);
        hero.maxPp = maxPpAtLevel(hero.id, hero.level) + (hero.boosts?.pp ?? 0);
        hero.hp = Math.min(hero.maxHp, hero.hp + (hero.maxHp - prevHp));
        hero.pp = Math.min(hero.maxPp, hero.pp + (hero.maxPp - prevPp));
        lines.push(LINKS_TEXT.tallyLevel.replace('{name}', hero.name).replace('{n}', String(hero.level)));
        for (const u of HEROES[hero.id].unlocks.filter((x) => x.level === hero.level)) {
          const ab = ABILITIES[u.ability];
          if (ab) lines.push(`${hero.name} realized ${ab.name}!`);
        }
        AUDIO.jingle('levelup', 1200, 'cage');
      }
    }
  }

  private async tallyPanel(title: string, lines: string[]): Promise<void> {
    this.clearPanel();
    const gold = colorOf(px(RAMP.GOLD, 3));
    const paper = colorOf(px(RAMP.PAPER, 2));
    this.panelWindow(s(28), s(26), s(344), s(170));
    this.panelText(s(200), s(34), title, s(8), gold);
    let row = 0;
    const texts: Phaser.GameObjects.BitmapText[] = [];
    const showPage = (): void => {
      texts.forEach((t) => t.destroy());
      texts.length = 0;
      const page = lines.slice(row, row + 6);
      page.forEach((l, i) => texts.push(this.panelText(s(200), s(56) + i * s(14), l, s(6), paper)));
      texts.push(this.panelText(s(200), s(168), row + 6 < lines.length ? 'A: MORE' : 'A: THE CLUBHOUSE', s(6), colorOf(px(RAMP.CYAN, 2))));
    };
    showPage();
    await new Promise<void>((resolve) => {
      const off = everyFrame(this, () => {
        if (!INPUT.justPressed('A')) return;
        AUDIO.sfx('confirm');
        row += 6;
        if (row < lines.length) {
          showPage();
          return;
        }
        off();
        resolve();
      });
    });
  }

  /* ================= pause / walk off ================= */

  private async pauseAsk(): Promise<void> {
    this.asking = true;
    this.showBanner(LINKS_TEXT.paused, 600);
    const pick = await this.dlg.ask([LINKS_TEXT.resume, LINKS_TEXT.walkOff], { cancelIndex: 0 });
    this.asking = false;
    this.banner.setText('');
    if (pick === 1) this.forfeit();
  }

  private async walkOffAsk(): Promise<void> {
    this.asking = true;
    const pick = await this.dlg.ask([LINKS_TEXT.resume, LINKS_TEXT.walkOff], { cancelIndex: 0 });
    this.asking = false;
    if (pick === 1) this.forfeit();
  }

  /** the eject rule: nothing pays; a match forfeit tears the bracket up */
  private forfeit(): void {
    if (this.cfg.kind === 'match') {
      GS.setFlag(LINKS_FLAGS.round, 0);
      GS.setFlag(LINKS_FLAGS.seed, 0);
      GS.setFlag('links_bracket_live', false);
      GS.setFlag(LINKS_FLAGS.played, (Number(GS.flag(LINKS_FLAGS.played)) || 0) + 1);
      if (GS.activeSlot !== null) GS.saveTo(GS.activeSlot);
    }
    this.close();
  }

  /* ================= render ================= */

  private say(text: string, ms = 2400): void {
    this.ticker.setText(text);
    this.tickerUntil = this.elapsed + ms;
  }

  private showBanner(text: string, ms: number): void {
    this.banner.setText(text);
    this.bannerUntil = this.elapsed + ms;
  }

  private golferFrame(): number {
    const F = GOLF_FRAME;
    const sim = this.sim; // not `s`: `s` is the scale helper
    const putt = sim.mode === 'putt' && (sim.phase === 'power' || sim.phase === 'roll');
    switch (sim.phase) {
      case 'aim':
        return sim.swingMode() === 'putt' ? F.puttAddress : F.address;
      case 'power':
        if (putt) return F.puttAddress;
        return sim.meterT < 0.55 ? F.backA : F.backB;
      case 'acc':
        return F.backB;
      case 'flight':
        return sim.ball.z > s(6) ? F.followA : F.followB; // z is runtime px
      case 'roll':
        return putt ? F.puttStrike : F.followB;
      case 'holed': {
        const strokes = sim.strokes;
        return strokes <= sim.hole.par ? F.fistpump : Math.floor(this.elapsed / 420) % 2 === 0 ? F.slumpA : F.slumpB;
      }
      default:
        return F.address;
    }
  }

  private render(): void {
    // NOTE: `s` is the scale helper (imported); the sim is `sim` here so the
    // two never collide. Ball/aim positions out of the sim are already runtime
    // px; only the literal offsets/denominators added in the scene wear s().
    const sim = this.sim;
    this.ballSpr.setPosition(sim.ball.x, sim.ball.y - sim.ball.z);
    this.ballSpr.setScale(1 + Math.min(0.8, sim.ball.z / s(90))); // z is runtime px → scale the denominator to keep the pop ratio
    // the golfer stands at the ball (face the aim), both world + pane
    const frame = this.golferFrame();
    this.golfer.setPosition(sim.ball.x - s(8), sim.ball.y + s(2));
    this.golfer.setTexture(this.golferKey, frame);
    this.golfer.setFlipX(Math.cos(sim.aim) < 0);
    this.golfer.setVisible(sim.phase === 'aim' || sim.phase === 'power' || sim.phase === 'acc');
    this.golferPane.setTexture(this.golferKey, frame);
    // the aim tick: a short line off the ball toward the line
    const show = sim.phase === 'aim';
    this.aimLine.setVisible(show);
    if (show) {
      const ax = sim.ball.x + Math.cos(sim.aim) * s(22);
      const ay = sim.ball.y + Math.sin(sim.aim) * s(22);
      this.aimLine.setPosition(ax, ay);
    }
    // ball-cam (follow targets are screen-centre offsets in runtime px; the
    // 0.1 lerp is unitless)
    const cam = this.cameras.main;
    cam.scrollX += (sim.ball.x - s(200) - cam.scrollX) * 0.1;
    cam.scrollY += (sim.ball.y - s(120) - cam.scrollY) * 0.1;
    // HUD
    const hole = this.holes[this.holeIdx];
    const holeNo = this.cfg.kind === 'stroke' ? this.holeIdx + 1 : HOLES.indexOf(hole) + 1;
    this.hudTop.setText(
      `${LINKS_TEXT.holeCard.replace('{n}', String(holeNo)).replace('{par}', String(hole.par))}   ${LINKS_TEXT.strokeLine.replace('{n}', String(sim.strokes + (sim.phase === 'holed' ? 0 : 1)))}   ${LINKS_TEXT.yardsOut.replace('{yds}', String(sim.ydsToPin()))}`,
    );
    const dirName = Math.abs(this.wind.x) > Math.abs(this.wind.y) ? (this.wind.x > 0 ? 'WEST' : 'EAST') : this.wind.y > 0 ? 'NORTH' : 'SOUTH';
    this.hudWind.setText(
      this.wind.mph === 0 ? LINKS_TEXT.windCalm : LINKS_TEXT.windLine.replace('{putts}', String(windPutts(this.wind.mph))).replace('{name}', dirName),
    );
    this.hudClub.setText(sim.swingMode() === 'putt' ? 'PUTTER' : sim.swingMode() === 'chip' ? 'CHIP' : CLUBS[sim.clubIdx].name);
    if (this.ticker.text !== '' && this.elapsed > this.tickerUntil) this.ticker.setText('');
    if (this.banner.text !== '' && this.elapsed > this.bannerUntil) this.banner.setText('');
    // THE 3-TAP METER, the honest read (S14b — "the fill was going the
    // wrong way"): the power fill RISES bottom→top and HOLDS at the captured
    // power (gold mark); during the accuracy phase only the cyan NEEDLE
    // comes back down toward the PURE band at the base. Nothing drains.
    const inMeter = sim.phase === 'power' || sim.phase === 'acc';
    this.meterFill.setVisible(inMeter);
    this.meterWin.setVisible(inMeter);
    this.meterZero.setVisible(inMeter);
    this.meterMark.setVisible(sim.phase === 'acc');
    this.meterNeedle.setVisible(sim.phase === 'acc');
    if (inMeter) {
      const H = s(68); // meter travel (runtime px) — matches the quad heights
      const base = s(214);
      // the fill: live needle height while charging; HOLDS at the captured
      // power through the accuracy phase (dimmed) — nothing ever drains
      const fillFrac = (sim.phase === 'power' ? Math.max(0, sim.meterT) : sim.power) / GOLF.POWER_CAP;
      this.meterFill.setScale(1, Math.max(0.02, fillFrac));
      this.meterFill.setFillStyle(colorOf(px(RAMP.PAPER, sim.phase === 'power' ? 3 : 1)));
      // the PURE band hugs the base: [0 .. accWindow], where the needle
      // must land (tap 3); it shrinks with club × lie, honestly
      const win = Math.min(1, sim.accWindow() / GOLF.POWER_CAP);
      this.meterWin.setPosition(s(70), base);
      this.meterWin.setScale(1, Math.max(0.03, win));
      this.meterZero.setPosition(s(70), base);
      if (sim.phase === 'acc') {
        this.meterMark.setPosition(s(70), base - (sim.power / GOLF.POWER_CAP) * H);
        this.meterNeedle.setPosition(s(70), base - (Math.max(0, sim.meterT) / GOLF.POWER_CAP) * H);
      }
    }
  }

  /* ================= panels / plumbing ================= */

  private clearPanel(): void {
    this.panelObjs.forEach((o) => o.destroy());
    this.panelObjs = [];
  }

  /** x/y/size are runtime px (callers pass s()-scaled values); the maxWidth
   *  literal scales inside (the cross-function px contract) */
  private panelText(x: number, y: number, text: string, size: number, tint: number): Phaser.GameObjects.BitmapText {
    const t = this.add
      .bitmapText(x, y, 'retro', text, size)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 2)
      .setCenterAlign()
      .setMaxWidth(s(330))
      .setTint(tint);
    this.panelObjs.push(t);
    return t;
  }

  private panelWindow(x: number, y: number, w: number, h: number): void {
    this.panelObjs.push(makeWindow(this, x, y, w, h));
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  private close(): void {
    AUDIO.sfx('cancel');
    this.game.events.emit('mf-links-closed');
    this.scene.stop();
  }
}
