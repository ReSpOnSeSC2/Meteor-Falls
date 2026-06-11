/**
 * HoopsScene — THE CAGE's match scene (S12). The S10 cabinet law governs:
 * its own scene over a paused OverworldScene (the ShopScene launch pattern,
 * emits 'mf-hoops-closed'), the EXISTING input layer (UIScene's overlay
 * drives it untouched — §B1), everyFrame/update polling only (ADR-024),
 * DETERMINISTIC under the bot (src/hoops/sim.ts: fixed 8.333ms quanta, one
 * seeded rng, outcomes rolled at release — same seed + same inputs = same
 * final score; vitest proves it headlessly, the ADR-008 bot proves the
 * wiring). The scene is a RENDERER over HoopsSim — it owns zero game truth.
 *
 * CONTROLS (two buttons, honest): d-pad moves. OFFENSE — B tap passes into
 * the held d-pad cone (lead the cutter), B hold turbos, A hold gathers into
 * the SHOT METER (release in the GREEN — window scales with shooter stat,
 * distance, contest), A at turbo speed near the rim is the contextual dunk
 * (layup for low-dnk athletes; contested dunks get STUFFED), double-tap a
 * direction to crossover (seeded ankle-break vs the defender's commitment).
 * DEFENSE — you hold the defender nearest the ball (auto-switch on drives
 * and passes), A is the timed block leap, B tap the steal swipe (whiff =
 * beaten), B hold the turbo slide. START pauses (resume / walk off — B is a
 * GAME button here, so the Android back press costs a swipe, never an exit;
 * ADR-026's mapping stands, the pause path is START).
 *
 * FORMATS: 5v5 full court — four 5-minute quarters on a running clock, a
 * 24s shot clock PERMIT counts out loud, quarter breaks + the halftime
 * chalkboard, 2-minute overtimes until somebody wins. 3v3 halfcourt pickup
 * — first to 21, win by 2, check-up after scores. Street rules both ways:
 * 1s and 2s, CALL YOUR OWN FOULS (nobody ever has), the fence is live.
 *
 * SAVE (v5): a Classic match checkpoints AT QUARTER BREAKS — score, clock,
 * quarter onto GS.data.hoops.match, then an auto-write to the active slot
 * (process death costs at most the quarter in progress). The bracket
 * advances on the tally screen (seeded sim results, ADR-034).
 *
 * QA recipe (ADR-008 — verified S12 end-to-end; the exact eval scripts are
 * logged in docs/QA.md): pad muted (S11 lore) AND **game.loop.sleep() for
 * the WHOLE session** — a visible preview tab fires real rAF frames that
 * interleave with pump()'s virtual clock; worse, once real time runs ahead,
 * pump's vt lags scene.time.now and every navTick-style cursor cooldown
 * locks out (arrows go dead while edges still land). Sleep first, wake last.
 * Walk the Brickton gate (door zone at tile 50,26) into the_cage, stand at
 * PERMIT (x≈376, y≈126 facing up). Talk pages are typed: pump(380) types a
 * page out fully, then ONE KeyZ advances it — never mash into an ask (KeyX
 * there cancels; a stray KeyZ picks row 0). Ask rows: 0 = 3v3 pickup,
 * 1 = the Classic (register / play round / resume Qn), 2 = never mind —
 * ArrowDown then KeyZ for row 1 (the hand at y≈110+14·row confirms aim).
 *   3v3 leg (seed = pickupSeed(played); fresh save → 7, casserole_dads):
 *   board KeyZ, then chunk the tape [hold ArrowLeft 60 · pump 12 · hold
 *   KeyZ 35 · pump 140 · hold ArrowRight 30 · pump 12] until sim.over —
 *   verified twice from one snapshot: 2-7 / 8-15 / 12-21 final, byte-equal
 *   trails (same seed + same inputs = same final score, scene-level).
 *   5v5 leg: ask row 1 registers (classicSeed(0,0)=1995 → round 0 vs the
 *   wet_socks), board KeyZ tips Q1; the drive tape runs the quarter to the
 *   horn (verified 30-23) → the break panel writes hoops.match {Q2, score,
 *   seed} AND auto-saves the active slot — location.reload() there, then
 *   Continue → Notebook 1 → PERMIT row 1 reads "Pick up the Classic game
 *   (Q2)" and resumes at 30-23 with a fresh Q2 clock (verified live).
 * Tally: KeyZ advances the EXP/level pages (the Prompt-18 flow) and the
 * scene closes itself back to the paused overworld. One-frame taps at
 * pump(n, 8.33): gather opens ON the tap frame, START pauses, A resumes —
 * zero drops (ADR-024 regime, verified).
 */
import Phaser from 'phaser';
import { GS, expForLevel } from '../engine/state';
import { statsAtLevel, maxHpAtLevel, maxPpAtLevel, HEROES } from '../data/heroes';
import { ABILITIES } from '../data/abilities';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { COURT } from '../hoops/court';
import { HoopsSim, makeRng, type Rng, type SimEvent, type TickInput, type Athlete } from '../hoops/sim';
import { SPORT_FRAME } from '../spritegen/athletes';
import {
  TEAMS,
  HOOPS_TEXT,
  HOOPS_REWARDS,
  buildRoster,
  teamAthletes,
  advanceBracket,
  rollDrops,
} from '../data/hoops';
import { ITEMS } from '../data/items';
import { ensureAthleteArt } from '../spritegen';
import { Dialogue, everyFrame, makeWindow, vars, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import type { HoopsCheckpoint } from '../schemas';

export interface HoopsLaunch {
  format: '5v5' | '3v3';
  seed: number;
  /** opponent team id (pickup derives one from the seed; classic passes it) */
  opponent: string;
  /** classic context: bracket round (0..4). Absent = pickup. */
  round?: number;
  /** resume a checkpointed quarter (v5) */
  resume?: HoopsCheckpoint;
}

type Stage = 'board' | 'tip' | 'play' | 'break' | 'tally';

const PAD = 34; // must equal athletes.ts COURT_PAD (court texture margin)

export class HoopsScene extends Phaser.Scene {
  private cfg!: HoopsLaunch;
  private sim!: HoopsSim;
  private stage: Stage = 'board';
  private dlg!: Dialogue;
  private asking = false;

  private sprites: Phaser.GameObjects.Sprite[] = [];
  private shadows: Phaser.GameObjects.Image[] = [];
  private ballSpr!: Phaser.GameObjects.Image;
  private ballShadow!: Phaser.GameObjects.Image;
  private hoopL!: Phaser.GameObjects.Sprite;
  private hoopR!: Phaser.GameObjects.Sprite;
  private netT = 9999;
  private cursor!: Phaser.GameObjects.Rectangle;

  // HUD
  private hudScore!: Phaser.GameObjects.BitmapText;
  private hudClock!: Phaser.GameObjects.BitmapText;
  private hudShot!: Phaser.GameObjects.BitmapText;
  private ticker!: Phaser.GameObjects.BitmapText;
  private tickerUntil = 0;
  private banner!: Phaser.GameObjects.BitmapText;
  private bannerUntil = 0;
  private meterBack!: Phaser.GameObjects.Rectangle;
  private meterFill!: Phaser.GameObjects.Rectangle;
  private meterGreen!: Phaser.GameObjects.Rectangle;
  private panelObjs: Phaser.GameObjects.GameObject[] = [];
  private popups: Phaser.GameObjects.BitmapText[] = [];

  // input bookkeeping (A-release edge is scene-derived)
  private prevA = false;
  private prevB = false;
  // announcer picks ride their OWN seeded stream (cabinet law: same seed,
  // same calls — and the sim's rng never moves for a line of commentary)
  private voice: Rng = makeRng(1);
  private elapsed = 0;

  constructor() {
    super('hoops');
  }

  create(data: HoopsLaunch): void {
    this.cfg = data;
    this.dlg = new Dialogue(this);
    this.asking = false;
    this.stage = 'board';
    this.elapsed = 0;
    this.voice = makeRng((data.seed ^ 0xbeef) >>> 0);
    this.popups = [];
    this.panelObjs = [];

    // rosters — the party's stars + the walk-on bench, and the opponent five
    const size = data.format === '5v5' ? 5 : 3;
    const { defs: usDefs } = buildRoster(GS.data.party, (f) => GS.flag(f) === true, size);
    const themDefs = teamAthletes(data.opponent).slice(0, size);
    ensureAthleteArt(this, [...usDefs, ...themDefs].map((d) => d.key));

    this.sim = new HoopsSim({
      format: data.format,
      seed: data.seed,
      us: usDefs,
      them: themDefs,
      scoreUs: data.resume?.scoreUs,
      scoreThem: data.resume?.scoreThem,
      quarter: data.resume?.quarter,
      clockMs: data.resume?.clockMs,
    });

    // ---- the world ----
    const court = this.add.image(0, 0, 'cage_court').setOrigin(0, 0).setDepth(0);
    this.hoopL = this.add.sprite(PAD + COURT.RIM_L_X - 20, PAD + COURT.RIM_Y, 'hoop_side', 0).setOrigin(0, 0.5).setDepth(50);
    this.hoopR = this.add
      .sprite(PAD + COURT.RIM_R_X + 20, PAD + COURT.RIM_Y, 'hoop_side', 0)
      .setOrigin(0, 0.5)
      .setFlipX(true)
      .setDepth(50);
    this.hoopR.x -= 30; // flipped sprite re-anchors: rim reaches back inboard
    this.ballShadow = this.add.image(0, 0, 'athlete_shadow').setDepth(4).setAlpha(0.5).setScale(0.5, 0.6);
    this.ballSpr = this.add.image(0, 0, 'hoop_ball').setDepth(40);
    this.cursor = this.add.rectangle(0, 0, 6, 3, colorOf(px(RAMP.GOLD, 3))).setDepth(60);
    this.sprites = [];
    this.shadows = [];
    this.sim.athletes.forEach((a) => {
      this.shadows.push(this.add.image(0, 0, 'athlete_shadow').setDepth(4).setAlpha(0.55));
      const s = this.add.sprite(0, 0, a.def.key, 0).setOrigin(0.5, 1).setDepth(10);
      this.sprites.push(s);
    });

    this.cameras.main.setBounds(0, 0, court.width, court.height);

    // ---- HUD ----
    const gold = colorOf(px(RAMP.GOLD, 3));
    const paper = colorOf(px(RAMP.PAPER, 3));
    this.hudScore = this.add.bitmapText(200, 4, 'retro', '', 8).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_UI).setTint(gold);
    this.hudClock = this.add.bitmapText(4, 4, 'retro', '', 6).setScrollFactor(0).setDepth(DEPTH_UI).setTint(paper);
    this.hudShot = this.add.bitmapText(396, 4, 'retro', '', 6).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_UI).setTint(colorOf(px(RAMP.CYAN, 2)));
    this.ticker = this.add
      .bitmapText(200, 16, 'retro', '', 6)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI)
      .setCenterAlign()
      .setMaxWidth(380)
      .setTint(colorOf(px(RAMP.MAGENTA, 2)));
    this.banner = this.add
      .bitmapText(200, 96, 'retro', '', 12)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI)
      .setCenterAlign()
      .setMaxWidth(360)
      .setTint(gold);
    // the shot meter (HUD bottom center) — green window drawn where it IS
    this.meterBack = this.add.rectangle(200, 206, 124, 10, colorOf(px(RAMP.INK, 0))).setScrollFactor(0).setDepth(DEPTH_UI).setVisible(false);
    this.meterGreen = this.add.rectangle(200, 206, 10, 10, colorOf(px(RAMP.GRASS, 2))).setScrollFactor(0).setDepth(DEPTH_UI).setVisible(false);
    this.meterFill = this.add.rectangle(140, 206, 2, 6, colorOf(px(RAMP.PAPER, 3))).setScrollFactor(0).setDepth(DEPTH_UI + 1).setVisible(false);

    AUDIO.playMusic('cage');
    this.showPreGame();
  }

  /* ================= pre-game / panels ================= */

  private clearPanel(): void {
    this.panelObjs.forEach((o) => o.destroy());
    this.panelObjs = [];
  }

  private panelText(x: number, y: number, text: string, size: number, tint: number, origin = 0.5): Phaser.GameObjects.BitmapText {
    const t = this.add
      .bitmapText(x, y, 'retro', text, size)
      .setOrigin(origin, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 2)
      .setCenterAlign()
      .setMaxWidth(330)
      .setTint(tint);
    this.panelObjs.push(t);
    return t;
  }

  private panelWindow(x: number, y: number, w: number, h: number): void {
    this.panelObjs.push(makeWindow(this, x, y, w, h));
  }

  /** the chalk board (classic) or the pickup tip card */
  private showPreGame(): void {
    this.stage = 'board';
    this.clearPanel();
    const gold = colorOf(px(RAMP.GOLD, 3));
    const paper = colorOf(px(RAMP.PAPER, 2));
    const team = TEAMS[this.cfg.opponent];
    this.panelWindow(28, 30, 344, 158);
    if (this.cfg.round !== undefined) {
      this.panelText(200, 38, HOOPS_TEXT.boardTitle, 6, gold);
      this.panelText(200, 52, HOOPS_TEXT.boardRound[this.cfg.round], 8, paper);
      this.panelText(200, 70, `${HOOPS_TEXT.boardYou}  vs  ${team.name.toUpperCase()}`, 8, gold);
      this.panelText(200, 90, HOOPS_TEXT.boardTaunt.replace('{taunt}', team.taunt), 6, paper);
      if (this.cfg.resume) {
        this.panelText(
          200,
          118,
          `Q${this.cfg.resume.quarter} WAITS ON THE CHALK — ${this.cfg.resume.scoreUs}-${this.cfg.resume.scoreThem}.`,
          6,
          colorOf(px(RAMP.CYAN, 2)),
        );
      }
      this.panelText(200, 140, HOOPS_TEXT.tip5v5, 6, paper);
    } else {
      this.panelText(200, 44, HOOPS_TEXT.title, 12, gold);
      this.panelText(200, 66, `PICKUP vs ${team.name.toUpperCase()}`, 8, paper);
      this.panelText(200, 88, `"${team.taunt}"`, 6, paper);
      this.panelText(200, 130, HOOPS_TEXT.tip3v3, 6, paper);
    }
    const five = this.sim.athletes
      .filter((a) => a.team === 0)
      .map((a) => a.def.name)
      .join(' · ');
    this.panelText(200, 158, five, 6, colorOf(px(RAMP.CYAN, 2)));
    this.panelText(200, 174, 'A: BALL UP    B: WALK AWAY', 6, paper);
  }

  /* ================= update ================= */

  override update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 50);
    this.elapsed += dt;
    if (this.asking) return;

    if (this.stage === 'board') {
      if (INPUT.justPressed('A')) {
        this.clearPanel();
        this.stage = 'tip';
        this.showBanner(this.cfg.resume ? `Q${this.cfg.resume.quarter}.` : HOOPS_TEXT.check, 900);
        AUDIO.sfx('confirm');
      } else if (INPUT.justPressed('B')) {
        this.close();
      }
      this.renderWorld();
      return;
    }

    if (this.stage === 'tip') {
      // one beat of stillness, then live ball
      if (this.elapsed > 0 && this.banner.text !== '' && this.elapsed >= this.bannerUntil) this.banner.setText('');
      this.stage = 'play';
      return;
    }

    if (this.stage === 'break') {
      if (INPUT.justPressed('A')) {
        this.clearPanel();
        const q = this.sim.quarter + 1;
        this.sim.startQuarter(q);
        this.stage = 'play';
        this.showBanner(q > 4 ? HOOPS_TEXT.otBanner : `Q${q}.`, 1000);
        AUDIO.sfx('confirm');
      }
      this.renderWorld();
      return;
    }

    if (this.stage === 'tally') return; // the tally flow drives itself

    // ---- live play ----
    if (INPUT.justPressed('START')) {
      void this.pauseAsk();
      return;
    }
    const d = INPUT.dir();
    const a = INPUT.held('A');
    const b = INPUT.held('B');
    const input: TickInput = {
      dx: Math.sign(d.x) as -1 | 0 | 1,
      dy: Math.sign(d.y) as -1 | 0 | 1,
      aHeld: a,
      aPressed: INPUT.justPressed('A'),
      aReleased: this.prevA && !a,
      bHeld: b,
      bPressed: INPUT.justPressed('B'),
      bReleased: this.prevB && !b,
    };
    this.prevA = a;
    this.prevB = b;
    this.sim.advance(dt, input);
    this.drainEvents();
    this.renderWorld();
    this.renderHud(dt);
  }

  /* ================= events → presentation ================= */

  private say(text: string, ms = 2400): void {
    this.ticker.setText(text);
    this.tickerUntil = this.elapsed + ms;
  }

  private pickVoice(pool: readonly string[]): string {
    return pool[Math.floor(this.voice() * pool.length)];
  }

  private showBanner(text: string, ms: number): void {
    this.banner.setText(text);
    this.bannerUntil = this.elapsed + ms;
  }

  private popup(x: number, y: number, text: string, ramp: number): void {
    const t = this.add
      .bitmapText(PAD + x, PAD + y - 28, 'retro', text, 8)
      .setOrigin(0.5, 1)
      .setDepth(70)
      .setTint(colorOf(px(ramp, 3)));
    this.popups.push(t);
    this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  private drainEvents(): void {
    for (const e of this.sim.events) this.onEvent(e);
    this.sim.events.length = 0;
  }

  private onEvent(e: SimEvent): void {
    switch (e.kind) {
      case 'sfx':
        AUDIO.sfx(e.name);
        if (e.name === 'swish' || e.name === 'dunk') this.netT = 0;
        if (e.name === 'rim') this.netT = 120;
        break;
      case 'score': {
        this.popup(e.x, e.y, `+${e.pts}`, e.team === 0 ? RAMP.GOLD : RAMP.MAGENTA);
        const pool = e.green ? HOOPS_TEXT.permitGreen : HOOPS_TEXT.permitScore;
        this.say(this.pickVoice(pool));
        break;
      }
      case 'check':
        this.showBanner(this.sim.format === '3v3' ? HOOPS_TEXT.check : HOOPS_TEXT.take, 800);
        break;
      case 'count':
        this.say(HOOPS_TEXT.permitCount.replace('{n}', String(e.n)), 950);
        break;
      case 'violation':
        this.showBanner(HOOPS_TEXT.violation, 1400);
        break;
      case 'ankles': {
        const v = this.sim.athletes[e.victim];
        this.popup(v.x, v.y, HOOPS_TEXT.ankles, RAMP.GOLD);
        this.say(this.pickVoice(HOOPS_TEXT.permitAnkles), 3000);
        this.cameras.main.shake(90, 0.0035);
        break;
      }
      case 'stuffed': {
        const s = this.sim.athletes[e.by];
        this.popup(s.x, s.y, HOOPS_TEXT.stuffed, RAMP.MAGENTA);
        this.say(this.pickVoice(HOOPS_TEXT.permitStuff));
        break;
      }
      case 'block': {
        const s = this.sim.athletes[e.by];
        this.popup(s.x, s.y, HOOPS_TEXT.rejected, RAMP.CYAN);
        this.say(this.pickVoice(HOOPS_TEXT.permitBlock));
        break;
      }
      case 'steal':
      case 'pick':
        this.say(this.pickVoice(HOOPS_TEXT.permitSteal));
        break;
      case 'callsForIt': {
        const w = this.sim.athletes[e.who];
        this.popup(w.x, w.y, 'BALL!', RAMP.CYAN);
        break;
      }
      case 'banner':
        this.showBanner(e.text, e.ms);
        break;
      case 'permit':
        this.say(`PERMIT: ${e.text}`);
        break;
      case 'quarterEnd':
        void this.quarterBreak(e.quarter);
        break;
      case 'gameEnd':
        void this.tally(e.us, e.them);
        break;
    }
  }

  /* ================= quarter breaks (the v5 checkpoint) ================= */

  private async quarterBreak(q: number): Promise<void> {
    this.stage = 'break';
    AUDIO.sfx('buzzer');
    // CHECKPOINT: score, clock, quarter ride the v5 field — process death
    // from here costs at most the quarter in progress (S12 law)
    if (this.cfg.round !== undefined) {
      GS.data.hoops.match = {
        opponent: this.cfg.opponent,
        round: this.cfg.round,
        seed: this.cfg.seed,
        quarter: q + 1,
        scoreUs: this.sim.scoreUs,
        scoreThem: this.sim.scoreThem,
        clockMs: q + 1 > 4 ? 120_000 : 300_000,
      };
      if (GS.activeSlot !== null) GS.saveTo(GS.activeSlot);
    }
    this.clearPanel();
    const gold = colorOf(px(RAMP.GOLD, 3));
    const paper = colorOf(px(RAMP.PAPER, 2));
    const half = q === 2;
    this.panelWindow(46, 56, 308, half ? 110 : 84);
    this.panelText(200, 66, HOOPS_TEXT.quarterEnd.replace('{n}', String(q)), 8, gold);
    this.panelText(200, 84, `US ${this.sim.scoreUs} — ${this.sim.scoreThem} THEM`, 8, paper);
    if (half) this.panelText(200, 104, HOOPS_TEXT.halftime, 6, paper);
    if (q >= 4 && this.sim.scoreUs === this.sim.scoreThem) {
      this.panelText(200, half ? 134 : 104, HOOPS_TEXT.otBanner, 6, colorOf(px(RAMP.MAGENTA, 2)));
    }
    this.panelText(200, half ? 148 : 122, 'A: NEXT QUARTER', 6, paper);
  }

  /* ================= pause / walk off ================= */

  private async pauseAsk(): Promise<void> {
    this.asking = true;
    this.showBanner(HOOPS_TEXT.paused, 600);
    const pick = await this.dlg.ask([HOOPS_TEXT.resume, HOOPS_TEXT.walkOff], { cancelIndex: 0 });
    this.asking = false;
    this.banner.setText('');
    if (pick !== 1) return;
    // a walk-off forfeits: the Classic bracket tears up; pickup just ends.
    // No rewards either way — the eject rule (the score keeps its secrets).
    if (this.cfg.round !== undefined) {
      GS.data.hoops.bracket = null;
      GS.data.hoops.match = null;
      GS.data.hoops.played += 1;
      if (GS.activeSlot !== null) GS.saveTo(GS.activeSlot);
    }
    this.close();
  }

  /* ================= the tally (Prompt-18 flow) ================= */

  private async tally(us: number, them: number): Promise<void> {
    this.stage = 'tally';
    const won = us > them;
    const classic = this.cfg.round !== undefined;
    const h = GS.data.hoops;
    h.match = null;
    h.played += 1;

    // rewards — data-tuned (HOOPS_REWARDS), seeded drops off the match rng
    const dropRng = makeRng((this.cfg.seed ^ 0x5151) >>> 0);
    let exp: number;
    let drops: string[];
    let titleNow = false;
    let repeatCash = 0;
    if (classic) {
      const round = this.cfg.round ?? 0;
      const base = HOOPS_REWARDS.classic.roundWinExp[round];
      exp = won ? base : Math.floor(base * HOOPS_REWARDS.classic.lossFrac);
      drops = rollDrops(won ? HOOPS_REWARDS.drops.classicWin : HOOPS_REWARDS.drops.classicLoss, dropRng);
      const advanced = h.bracket ? advanceBracket(h.bracket, won) : null;
      if (!won) {
        h.bracket = null; // single elimination means exactly that
      } else if (round >= 4) {
        h.bracket = null;
        h.titles += 1;
        titleNow = true;
        drops.push(...rollDrops(HOOPS_REWARDS.drops.titleBonus, dropRng));
        if (h.titles > 1) {
          repeatCash = HOOPS_REWARDS.classic.repeatTitleCash;
          GS.data.cashOnHand += repeatCash;
        }
      } else {
        h.bracket = advanced;
      }
    } else {
      exp = won ? HOOPS_REWARDS.pickup.winExp : HOOPS_REWARDS.pickup.lossExp;
      drops = rollDrops(won ? HOOPS_REWARDS.drops.pickupWin : HOOPS_REWARDS.drops.pickupLoss, dropRng);
    }

    // the panel
    this.clearPanel();
    const gold = colorOf(px(RAMP.GOLD, 3));
    const paper = colorOf(px(RAMP.PAPER, 2));
    this.panelWindow(28, 26, 344, 170);
    this.panelText(200, 34, won ? HOOPS_TEXT.tallyWin : HOOPS_TEXT.tallyLoss, 8, gold);
    this.panelText(200, 50, `US ${us} — ${them} THEM`, 8, paper);
    AUDIO.jingle(won ? 'victory' : 'cage', won ? 1600 : 1, 'cage');

    // EXP through the Prompt-18 flow: every party hero who suited up gains,
    // level-ups announce here, post-game (stat tables + unlock lines)
    const lines: string[] = [];
    for (const hero of GS.data.party) {
      hero.exp += exp;
      lines.push(HOOPS_TEXT.tallyExp.replace('{name}', hero.name).replace('{exp}', String(exp)));
      while (hero.exp >= expForLevel(hero.level + 1)) {
        hero.level += 1;
        const prevHp = hero.maxHp;
        const prevPp = hero.maxPp;
        hero.stats = statsAtLevel(hero.id, hero.level);
        hero.maxHp = maxHpAtLevel(hero.id, hero.level);
        hero.maxPp = maxPpAtLevel(hero.id, hero.level);
        hero.hp = Math.min(hero.maxHp, hero.hp + (hero.maxHp - prevHp));
        hero.pp = Math.min(hero.maxPp, hero.pp + (hero.maxPp - prevPp));
        lines.push(HOOPS_TEXT.tallyLevel.replace('{name}', hero.name).replace('{n}', String(hero.level)));
        for (const u of HEROES[hero.id].unlocks.filter((x) => x.level === hero.level)) {
          const ab = ABILITIES[u.ability];
          if (ab) lines.push(`${hero.name} realized ${ab.name}!`);
        }
        AUDIO.jingle('levelup', 1200, 'cage');
      }
    }
    for (const id of drops) {
      // goods land in whoever has room (hands-full = the bench eats it)
      const fit = GS.data.party.find((p) => p.bag.length < 14);
      if (fit && GS.addItem(id, fit.id)) {
        lines.push(HOOPS_TEXT.tallyDrop.replace('{item}', ITEMS[id].name));
      }
    }
    if (titleNow) lines.push(vars(HOOPS_TEXT.tallyTitle));
    if (repeatCash > 0) lines.push(HOOPS_TEXT.tallyRepeat.replace('{cash}', String(repeatCash)));

    // checkpoint cleared + bracket advanced — write the notebook
    if (GS.activeSlot !== null) GS.saveTo(GS.activeSlot);

    // page the lines four at a time, A-driven (everyFrame, ADR-024)
    let row = 0;
    const texts: Phaser.GameObjects.BitmapText[] = [];
    const showPage = (): void => {
      texts.forEach((t) => t.destroy());
      texts.length = 0;
      const page = lines.slice(row, row + 5);
      page.forEach((l, i) => {
        texts.push(this.panelText(200, 72 + i * 14, l, 6, i === 0 && row === 0 ? gold : paper));
      });
      texts.push(this.panelText(200, 168, row + 5 < lines.length ? 'A: MORE' : 'A: WALK IT OFF', 6, colorOf(px(RAMP.CYAN, 2))));
    };
    showPage();
    await new Promise<void>((resolve) => {
      const off = everyFrame(this, () => {
        if (!INPUT.justPressed('A')) return;
        AUDIO.sfx('confirm');
        row += 5;
        if (row < lines.length) {
          showPage();
          return;
        }
        off();
        resolve();
      });
    });
    this.close();
  }

  /* ================= render ================= */

  private frameOf(a: Athlete, hasBall: boolean, defending: boolean): number {
    const F = SPORT_FRAME;
    const phase = Math.floor(this.sim.t / 150) % 2;
    const slow = Math.floor(this.sim.t / 420) % 2;
    switch (a.state) {
      case 'gather':
        return F.gather;
      case 'rise':
        return a.stateT < 130 ? F.rise : F.release;
      case 'layup':
        return a.stateT < 220 ? F.layupA : F.layupB;
      case 'dunk': {
        const pair = a.dunkStyle === 0 ? [F.dunkAa, F.dunkAb] : a.dunkStyle === 1 ? [F.dunkBa, F.dunkBb] : [F.dunkCa, F.dunkCb];
        return a.stateT < 300 ? pair[0] : pair[1];
      }
      case 'block':
        return a.vz > 40 ? F.blockA : F.blockB;
      case 'steal':
        return F.steal;
      case 'fall':
        return F.fall;
      case 'celebrate':
        return slow === 0 ? F.cheerA : F.cheerB;
      default:
        if (hasBall) return a.moving ? (phase === 0 ? F.runA : F.runB) : slow === 0 ? F.idleA : F.idleB;
        if (defending && a.moving && !a.turbo) return phase === 0 ? F.slideA : F.slideB;
        if (a.moving) return phase === 0 ? F.offA : F.offB;
        return defending ? F.slideA : F.offA;
    }
  }

  private renderWorld(): void {
    const holderIdx = this.sim.ball.kind === 'held' ? this.sim.ball.by : -1;
    this.sim.athletes.forEach((a, i) => {
      const s = this.sprites[i];
      const defending = this.sim.posTeam !== a.team;
      s.setTexture(a.def.key, this.frameOf(a, holderIdx === i, defending));
      s.setFlipX(a.face < 0);
      s.setPosition(PAD + a.x, PAD + a.y + 6 - a.z);
      s.setDepth(10 + a.y * 0.05);
      const sh = this.shadows[i];
      sh.setPosition(PAD + a.x, PAD + a.y + 5);
      sh.setAlpha(a.z > 0 ? 0.35 : 0.55);
    });
    // the ball (held: a deterministic dribble bob off the sim clock)
    const bp = this.sim.ballPos();
    let bz = bp.z;
    if (this.sim.ball.kind === 'held') {
      const h = this.sim.athletes[this.sim.ball.by];
      bz = h.moving || h.state === 'play' ? 4 + Math.abs(Math.sin(this.sim.t * 0.012)) * 14 + h.z : bp.z;
    }
    this.ballSpr.setPosition(PAD + bp.x, PAD + bp.y - bz);
    this.ballSpr.setDepth(10 + bp.y * 0.05 + (bz > 40 ? 30 : 1));
    this.ballShadow.setPosition(PAD + bp.x, PAD + bp.y + 4);
    this.ballShadow.setAlpha(Math.max(0.2, 0.5 - bz * 0.004));
    // net ripple
    this.netT += 16.7;
    const netFrame = this.netT < 90 ? 1 : this.netT < 220 ? 2 : 0;
    this.hoopL.setFrame(netFrame);
    this.hoopR.setFrame(netFrame);
    // the controlled-athlete pip
    const c = this.sim.athletes[this.sim.controlled];
    this.cursor.setPosition(PAD + c.x, PAD + c.y - 38 - c.z);
    this.cursor.setVisible(this.stage === 'play' && c.team === 0);
    // camera follows the ball, 2K-style
    const cam = this.cameras.main;
    cam.scrollX += (PAD + bp.x - 200 - cam.scrollX) * 0.08;
    cam.scrollY += (PAD + bp.y - 112 - cam.scrollY) * 0.08;
  }

  private renderHud(dt: number): void {
    this.hudScore.setText(`US ${this.sim.scoreUs} - ${this.sim.scoreThem} THEM`);
    if (this.sim.format === '5v5') {
      const ms = Math.max(0, this.sim.clockMs);
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      const q = this.sim.quarter;
      this.hudClock.setText(`${q > 4 ? `OT${q - 4}` : `Q${q}`}  ${m}:${String(s).padStart(2, '0')}`);
      this.hudShot.setText(this.sim.phase === 'live' ? `:${Math.max(0, Math.ceil(this.sim.shotMs / 1000))}` : '');
    } else {
      this.hudClock.setText(`TO ${21}`);
      this.hudShot.setText('');
    }
    if (this.ticker.text !== '' && this.elapsed > this.tickerUntil) this.ticker.setText('');
    if (this.banner.text !== '' && this.elapsed > this.bannerUntil) this.banner.setText('');
    void dt;
    // the meter
    const frac = this.sim.meterFrac;
    const win = this.sim.meterWindow;
    const show = frac >= 0 && win !== null;
    this.meterBack.setVisible(show);
    this.meterGreen.setVisible(show);
    this.meterFill.setVisible(show);
    if (show && win) {
      const x0 = 138;
      const w = 124;
      this.meterGreen.setPosition(x0 + (win.lo + (win.hi - win.lo) / 2) * w, 206);
      this.meterGreen.width = Math.max(3, (win.hi - win.lo) * w);
      this.meterFill.setPosition(x0 + Math.min(1, frac) * w, 206);
    }
  }

  /* ================= exit ================= */

  private close(): void {
    AUDIO.sfx('cancel');
    this.game.events.emit('mf-hoops-closed');
    this.scene.stop();
  }
}
