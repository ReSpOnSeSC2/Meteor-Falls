/**
 * HoopsScene — THE CAGE's match scene (S12, overhauled S12c). The S10 cabinet
 * law governs: its own scene over a paused OverworldScene (the ShopScene
 * launch pattern, emits 'mf-hoops-open'/'mf-hoops-closed' — UIScene shows the
 * X/Y touch buttons between those), the EXISTING input layer driving through
 * the REBINDABLE semantic table (ADR-024/S12c), everyFrame/update polling
 * only, DETERMINISTIC under the bot (src/hoops/sim.ts: fixed 8.333ms quanta,
 * one seeded rng, outcomes rolled at release — same seed + same inputs = same
 * final score). The scene is a RENDERER over HoopsSim — it owns zero truth.
 *
 * CONTROLS (S12c — four buttons, full control): d-pad moves. OFFENSE —
 * A holds the OVER-HEAD METER (fills toward the top, GREEN at the END —
 * release inside; overfill auto-misses; near the rim at speed A starts the
 * DUNK and a second A-release runs the dunk meter), B taps the pass into the
 * held d-pad cone (style picks itself: chest / bounce-under-hands / behind-
 * the-back), X sprints, Y is the DRIBBLE MOVE modifier (alone=spin,
 * +lateral=behind-the-back, +toward-defender=between-the-legs; every move's
 * startup is a steal window), double-tap a direction = quick crossover.
 * DEFENSE — A is the TIMED block leap (peak must bracket the release —
 * BLOCK_TIMING), B taps the steal swipe (vulnerability windows steal high —
 * STEAL_TIMING; whiff = beaten), X sprints the slide. START pauses (resume /
 * CAMERA toggle / walk off). GOALTENDING: touch it coming down and it counts.
 *
 * CAMERA: SIDE (the S12 read) or BEHIND — pseudo-3D perspective court with
 * depth-scaled sprites (behindMap), toggled in pause, persisted device-local
 * ('meteor-falls-cage-cam', the Sound-preference pattern).
 *
 * TUTORIAL (cfg.tutorial — PERMIT'S SCHOOL, first cage visit, skippable,
 * flag cage_tutored): a drill-mode sim (visitors stand down / obey scripts)
 * walks move+sprint → the meter → the dunk → the package → passes → the
 * timed block → the window steal → THE GOALTEND WARNING. Each lesson
 * advances on the DEED (sim events), not the word.
 *
 * QA recipe (ADR-008 — S12c, edges per ADR-038): pad muted AND
 * game.loop.sleep() END TO END (S12 lore). Bot legs are logged in
 * docs/QA.md. Key facts for tapes: keyboard defaults A=KeyZ B=KeyX X=KeyC
 * Y=KeyV (rebindable; bots run defaults); the meter releases on KEYUP of A
 * (latch-backed INPUT.justReleased — one-frame and SUB-QUANTUM taps both
 * land; verified 10/10 at pump(n, 4.1)); hold and watch sim.meterOf for
 * the live window. THE FINISH (ADR-038): moving inside 165px of the rim +
 * A starts a layup (dnk<40) or dunk — KEEP HOLDING and release A inside
 * the finish meter's band (cyan = layup, gold = dunk); makes read IN!/
 * FROM DEEP! and misses NO GOOD./AIR. at the iron. Tutorial tape: board
 * KeyZ → lesson deeds in order (hold ArrowRight+KeyC 80 · hold KeyZ,
 * release in the green · walk rimward + hold KeyZ, release in the finish
 * band · KeyV / ArrowDown+KeyV / ArrowRight-at-defender+KeyV · KeyX taps
 * ×2 · timed KeyZ leap on the dummy's release · KeyX tap inside his move
 * startup) — 'mf-hoops-closed' fires with cage_tutored set.
 */
import Phaser from 'phaser';
import { GS, expForLevel } from '../engine/state';
import { statsAtLevel, maxHpAtLevel, maxPpAtLevel, HEROES } from '../data/heroes';
import { ABILITIES } from '../data/abilities';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { COURT } from '../hoops/court';
import {
  HoopsSim,
  makeRng,
  BLOCK_TIMING,
  type Rng,
  type SimEvent,
  type TickInput,
  type Athlete,
  type MoveKind,
} from '../hoops/sim';
import { SPORT_FRAME, BEHIND, behindMap } from '../spritegen/athletes';
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
  /** S12c: PERMIT'S SCHOOL — drill sim + the lesson driver */
  tutorial?: boolean;
}

type Stage = 'board' | 'tip' | 'play' | 'break' | 'tally';
type CamMode = 'side' | 'behind';

const PAD = 34; // must equal athletes.ts COURT_PAD (court texture margin)
const CAM_KEY = 'meteor-falls-cage-cam';

/** the tutorial's lessons, in teaching order (advance on the deed) */
const TUT_STEPS = [
  HOOPS_TEXT.tutMove,
  HOOPS_TEXT.tutMeter,
  HOOPS_TEXT.tutDunk,
  HOOPS_TEXT.tutPackage,
  HOOPS_TEXT.tutPass,
  HOOPS_TEXT.tutBlock,
  HOOPS_TEXT.tutSteal,
  HOOPS_TEXT.tutGoaltend,
] as const;

export class HoopsScene extends Phaser.Scene {
  private cfg!: HoopsLaunch;
  private sim!: HoopsSim;
  private stage: Stage = 'board';
  private dlg!: Dialogue;
  private asking = false;
  private camMode: CamMode = 'side';

  private courtSide!: Phaser.GameObjects.Image;
  private courtBehind!: Phaser.GameObjects.Image;
  private sprites: Phaser.GameObjects.Sprite[] = [];
  private shadows: Phaser.GameObjects.Image[] = [];
  private ballSpr!: Phaser.GameObjects.Image;
  private ballShadow!: Phaser.GameObjects.Image;
  private hoopL!: Phaser.GameObjects.Sprite;
  private hoopR!: Phaser.GameObjects.Sprite;
  private boardBehind!: Phaser.GameObjects.Image;
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
  // S12c: the over-head meter (world-space, follows the athlete; fills UP,
  // green band seated at the TOP — release inside it)
  private meterBack!: Phaser.GameObjects.Rectangle;
  private meterFill!: Phaser.GameObjects.Rectangle;
  private meterGreen!: Phaser.GameObjects.Rectangle;
  private panelObjs: Phaser.GameObjects.GameObject[] = [];
  private popups: Phaser.GameObjects.BitmapText[] = [];

  // announcer picks ride their OWN seeded stream (cabinet law: same seed,
  // same calls — and the sim's rng never moves for a line of commentary)
  private voice: Rng = makeRng(1);
  // the make read: the scoreboard flashes gold for a beat after a bucket
  private scoreFlashUntil = 0;
  private elapsed = 0;

  // the tutorial driver
  private tutStep = -1;
  private tutSprintMs = 0;
  private tutMoves = new Set<MoveKind>();
  private tutPasses = 0;
  private tutPassPending = false;
  private tutDunkSeen = false;
  private tutWaitUntil = 0;

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
    this.tutStep = -1;
    this.tutSprintMs = 0;
    this.tutMoves = new Set();
    this.tutPasses = 0;
    this.tutPassPending = false;
    this.tutDunkSeen = false;
    try {
      this.camMode = localStorage.getItem(CAM_KEY) === 'behind' ? 'behind' : 'side';
    } catch {
      this.camMode = 'side';
    }
    // UIScene grows the X/Y touch buttons between open and closed (S12c)
    this.game.events.emit('mf-hoops-open');

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
      drill: data.tutorial === true,
    });

    // ---- the world ----
    this.courtSide = this.add.image(0, 0, 'cage_court').setOrigin(0, 0).setDepth(0);
    this.courtBehind = this.add.image(0, 0, 'cage_court_behind').setOrigin(0, 0).setDepth(0).setScrollFactor(0).setVisible(false);
    this.hoopL = this.add.sprite(PAD + COURT.RIM_L_X - 20, PAD + COURT.RIM_Y, 'hoop_side', 0).setOrigin(0, 0.5).setDepth(50);
    this.hoopR = this.add
      .sprite(PAD + COURT.RIM_R_X + 20, PAD + COURT.RIM_Y, 'hoop_side', 0)
      .setOrigin(0, 0.5)
      .setFlipX(true)
      .setDepth(50);
    this.hoopR.x -= 30; // flipped sprite re-anchors: rim reaches back inboard
    this.boardBehind = this.add.image(BEHIND.CX, BEHIND.HORIZON + 4, 'backboard').setOrigin(0.5, 1).setDepth(6).setScrollFactor(0).setVisible(false);
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

    this.cameras.main.setBounds(0, 0, this.courtSide.width, this.courtSide.height);

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
    // the over-head meter: a vertical drum that fills toward the green top
    this.meterBack = this.add.rectangle(0, 0, 7, 30, colorOf(px(RAMP.INK, 0))).setOrigin(0.5, 1).setDepth(72).setVisible(false);
    this.meterGreen = this.add.rectangle(0, 0, 7, 4, colorOf(px(RAMP.GRASS, 2))).setOrigin(0.5, 0).setDepth(73).setVisible(false);
    this.meterFill = this.add.rectangle(0, 0, 3, 2, colorOf(px(RAMP.PAPER, 3))).setOrigin(0.5, 1).setDepth(74).setVisible(false);

    AUDIO.playMusic('cage');
    if (data.tutorial) this.showTutorialBoard();
    else this.showPreGame();
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

  /** PERMIT'S SCHOOL — the tutorial's board (B skips, sets the flag) */
  private showTutorialBoard(): void {
    this.stage = 'board';
    this.clearPanel();
    const gold = colorOf(px(RAMP.GOLD, 3));
    const paper = colorOf(px(RAMP.PAPER, 2));
    this.panelWindow(28, 40, 344, 130);
    this.panelText(200, 50, HOOPS_TEXT.tutTitle, 8, gold);
    this.panelText(200, 72, 'EIGHT LESSONS. THE DEED ADVANCES EACH ONE.', 6, paper);
    this.panelText(200, 90, 'A: SHOOT   B: PASS/STEAL   X: SPRINT   Y: SAUCE', 6, colorOf(px(RAMP.CYAN, 2)));
    this.panelText(200, 120, 'A: CLASS IS IN', 6, paper);
    this.panelText(200, 136, HOOPS_TEXT.tutSkip, 6, paper);
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
        if (this.cfg.tutorial) {
          this.tutStep = 0;
          this.tutPrompt();
        } else {
          this.showBanner(this.cfg.resume ? `Q${this.cfg.resume.quarter}.` : HOOPS_TEXT.check, 900);
        }
        AUDIO.sfx('confirm');
      } else if (INPUT.justPressed('B')) {
        if (this.cfg.tutorial) GS.setFlag('cage_tutored'); // skipped = taught
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
    let ix = Math.sign(d.x) as -1 | 0 | 1;
    let iy = Math.sign(d.y) as -1 | 0 | 1;
    if (this.camMode === 'behind') {
      // camera-relative steering: screen-up drives AT the attacked end and
      // lateral rides the SAME latSign basis project() uses — the sim only
      // ever sees court-space axes, so tapes and AI reads are untouched
      const rim = this.viewRim();
      const s = rim.x < COURT.W / 2 ? -1 : 1;
      const cx = (-iy * s) as -1 | 0 | 1;
      const cy = (ix * s) as -1 | 0 | 1;
      ix = cx;
      iy = cy;
    }
    const input: TickInput = {
      dx: ix,
      dy: iy,
      aHeld: INPUT.held('A'),
      aPressed: INPUT.justPressed('A'),
      // the latch-backed release edge (ADR-038) — a thumb-lift lands on the
      // exact frame it happens, even lifted-and-re-pressed inside one frame
      aReleased: INPUT.justReleased('A'),
      bPressed: INPUT.justPressed('B'),
      xHeld: INPUT.held('X'),
      yPressed: INPUT.justPressed('Y'),
    };
    this.sim.advance(dt, input);
    this.drainEvents();
    if (this.cfg.tutorial) this.tutorialCheck(dt, input);
    this.renderWorld();
    this.renderHud();
  }

  /* ================= the tutorial driver (PERMIT'S SCHOOL) ================= */

  private tutPrompt(): void {
    if (this.tutStep < 0 || this.tutStep >= TUT_STEPS.length) return;
    this.say(`PERMIT: ${TUT_STEPS[this.tutStep]}`, 60_000);
    AUDIO.sfx('cursor');
  }

  private tutAdvance(): void {
    this.tutStep += 1;
    AUDIO.sfx('confirm');
    if (this.tutStep === 5) {
      // the defense leg: hand the dummies the ball, arm the shooting script
      this.sim.drillGiveBall(1);
      this.sim.drillScript = 'shoot';
    }
    if (this.tutStep === 6) this.sim.drillScript = 'moves';
    if (this.tutStep === 7) {
      // THE GOALTEND WARNING is a held beat, not a deed
      this.sim.drillScript = 'stand';
      this.showBanner(HOOPS_TEXT.goaltend, 1600);
      this.tutWaitUntil = this.elapsed + 4200;
    }
    if (this.tutStep >= TUT_STEPS.length) {
      GS.setFlag('cage_tutored');
      this.say(`PERMIT: ${HOOPS_TEXT.tutDone}`, 2400);
      this.showBanner(HOOPS_TEXT.tutDone, 1600);
      this.time.delayedCall(1700, () => this.close());
      return;
    }
    this.tutPrompt();
  }

  /** lesson predicates — each advances on the deed (events drained already
   *  stamp the tut* trackers in onEvent) */
  private tutorialCheck(dt: number, input: TickInput): void {
    const userIdx = this.sim.controlled;
    const user = this.sim.athletes[userIdx];
    switch (this.tutStep) {
      case 0: // move + sprint
        if (input.xHeld && user.moving) this.tutSprintMs += dt;
        if (this.tutSprintMs >= 600) this.tutAdvance();
        break;
      case 1: // the green release — advanced in onEvent on the green sfx
        break;
      case 2: // the rim finish — dunkers run the dunk meter, others lay it in
        if (user.state === 'dunk' || user.state === 'layup') this.tutDunkSeen = true;
        break;
      case 3: // the package: all three moves seen
        if (this.tutMoves.size >= 3) this.tutAdvance();
        break;
      case 4: {
        // two completed passes: watch the flight then the catch (control has
        // already moved to the receiver, so read the passer's TEAM)
        if (this.sim.ball.kind === 'pass' && this.sim.athletes[this.sim.ball.from].team === 0) this.tutPassPending = true;
        if (this.tutPasses >= 2) this.tutAdvance();
        break;
      }
      case 7: // the warning beat holds, then school's out
        if (this.elapsed >= this.tutWaitUntil) this.tutAdvance();
        break;
      default:
        break;
    }
    // the offense lessons need the rock: when a made bucket checks it to the
    // dummies (street rule), PERMIT racks it back for us
    if (this.tutStep >= 0 && this.tutStep <= 4 && this.sim.holder()?.team === 1 && this.sim.drillScript === 'stand') {
      this.sim.drillGiveBall(0);
    }
  }

  /** tutorial event hooks (called from onEvent during lessons) */
  private tutorialEvent(e: SimEvent): void {
    const team0 = (i: number): boolean => this.sim.athletes[i]?.team === 0;
    switch (this.tutStep) {
      case 1:
        if (e.kind === 'sfx' && e.name === 'green') this.tutAdvance();
        break;
      case 2:
        // any finished METER attempt teaches the lesson — make, flub,
        // stuffed, or a timed-but-rimmed-out miss (ADR-038)
        if (this.tutDunkSeen && ((e.kind === 'score' && e.team === 0) || e.kind === 'flub' || e.kind === 'stuffed' || e.kind === 'miss')) this.tutAdvance();
        break;
      case 3:
        if (e.kind === 'move' && team0(e.who)) this.tutMoves.add(e.move);
        break;
      case 4:
        if (e.kind === 'sfx' && e.name === 'catch' && this.tutPassPending) {
          this.tutPasses += 1;
          this.tutPassPending = false;
          this.popupAt(this.sim.athletes[this.sim.controlled], `${this.tutPasses}/2`, RAMP.CYAN);
        }
        break;
      case 5:
        if (e.kind === 'block' && team0(e.by)) this.tutAdvance();
        break;
      case 6:
        if (e.kind === 'steal' && team0(e.by)) this.tutAdvance();
        break;
      default:
        break;
    }
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

  private popup(wx: number, wy: number, text: string, ramp: number): void {
    const p = this.project(wx, wy, 0);
    const t = this.add
      .bitmapText(p.x, p.y - 28 * p.scale, 'retro', text, 8)
      .setOrigin(0.5, 1)
      .setDepth(70)
      .setTint(colorOf(px(ramp, 3)));
    if (this.camMode === 'behind') t.setScrollFactor(0);
    this.popups.push(t);
    this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  private popupAt(a: Athlete, text: string, ramp: number): void {
    this.popup(a.x, a.y, text, ramp);
  }

  private drainEvents(): void {
    for (const e of this.sim.events) this.onEvent(e);
    this.sim.events.length = 0;
  }

  private onEvent(e: SimEvent): void {
    if (this.cfg.tutorial) this.tutorialEvent(e);
    switch (e.kind) {
      case 'sfx':
        AUDIO.sfx(e.name);
        if (e.name === 'swish' || e.name === 'dunk') this.netT = 0;
        if (e.name === 'rim') this.netT = 120;
        break;
      case 'score': {
        // the make READS (ADR-038): IN! at the iron, deep ones say so, and
        // the scoreboard flashes — no more squinting at the chain
        const tag = e.pts === 2 ? `${HOOPS_TEXT.deepMake} +2` : `${HOOPS_TEXT.inMake} +1`;
        this.popup(e.x, e.y, tag, e.team === 0 ? RAMP.GOLD : RAMP.MAGENTA);
        this.scoreFlashUntil = this.elapsed + 700;
        const pool = e.green ? HOOPS_TEXT.permitGreen : HOOPS_TEXT.permitScore;
        if (!this.cfg.tutorial) this.say(this.pickVoice(pool));
        break;
      }
      case 'miss': {
        this.popup(e.x, e.y, e.air ? HOOPS_TEXT.airPopup : HOOPS_TEXT.noGood, RAMP.CYAN);
        break;
      }
      case 'check':
        if (!this.cfg.tutorial) this.showBanner(this.sim.format === '3v3' ? HOOPS_TEXT.check : HOOPS_TEXT.take, 800);
        break;
      case 'count':
        this.say(HOOPS_TEXT.permitCount.replace('{n}', String(e.n)), 950);
        break;
      case 'violation':
        this.showBanner(HOOPS_TEXT.violation, 1400);
        break;
      case 'ankles': {
        const v = this.sim.athletes[e.victim];
        if (e.tier === 'fall') {
          this.popupAt(v, HOOPS_TEXT.ankles, RAMP.GOLD);
          if (!this.cfg.tutorial) this.say(this.pickVoice(HOOPS_TEXT.permitAnkles), 3000);
          this.cameras.main.shake(90, 0.0035);
        } else if (e.tier === 'trip') {
          this.popupAt(v, HOOPS_TEXT.stumbled, RAMP.GOLD);
          if (!this.cfg.tutorial) this.say(this.pickVoice(HOOPS_TEXT.permitTrip), 2400);
        } else {
          this.popupAt(v, HOOPS_TEXT.shook, RAMP.CYAN);
          if (!this.cfg.tutorial) this.say(this.pickVoice(HOOPS_TEXT.permitStun), 2000);
        }
        break;
      }
      case 'timed': {
        // the HUD read for a window-hit attempt — either outcome (S12c)
        const s = this.sim.athletes[e.by];
        this.popupAt(s, HOOPS_TEXT.timed, RAMP.GRASS);
        break;
      }
      case 'goaltend': {
        const s = this.sim.athletes[e.by];
        this.popupAt(s, HOOPS_TEXT.goaltend, RAMP.MAGENTA);
        this.showBanner(HOOPS_TEXT.goaltend, 1200);
        this.say(this.pickVoice(HOOPS_TEXT.permitGoaltend), 3200);
        break;
      }
      case 'flub': {
        const s = this.sim.athletes[e.by];
        this.popupAt(s, HOOPS_TEXT.flubPopup, RAMP.MAGENTA);
        if (!this.cfg.tutorial) this.say(this.pickVoice(HOOPS_TEXT.permitFlub));
        break;
      }
      case 'heave': {
        const s = this.sim.athletes[e.by];
        this.popupAt(s, HOOPS_TEXT.heavePopup, RAMP.CYAN);
        this.say(this.pickVoice(HOOPS_TEXT.permitHeave), 2600);
        break;
      }
      case 'move':
        break; // the frames carry it; sfx already fired
      case 'stuffed': {
        const s = this.sim.athletes[e.by];
        this.popupAt(s, HOOPS_TEXT.stuffed, RAMP.MAGENTA);
        if (!this.cfg.tutorial) this.say(this.pickVoice(HOOPS_TEXT.permitStuff));
        break;
      }
      case 'block': {
        const s = this.sim.athletes[e.by];
        this.popupAt(s, HOOPS_TEXT.rejected, RAMP.CYAN);
        if (!this.cfg.tutorial) this.say(this.pickVoice(HOOPS_TEXT.permitBlock));
        break;
      }
      case 'steal':
      case 'pick':
        if (!this.cfg.tutorial) this.say(this.pickVoice(HOOPS_TEXT.permitSteal));
        break;
      case 'callsForIt': {
        const w = this.sim.athletes[e.who];
        this.popupAt(w, 'BALL!', RAMP.CYAN);
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

  /* ================= pause / camera / walk off ================= */

  private async pauseAsk(): Promise<void> {
    this.asking = true;
    this.showBanner(HOOPS_TEXT.paused, 600);
    const camRow = `CAMERA: ${this.camMode === 'side' ? 'SIDE' : 'BEHIND'}`;
    const pick = await this.dlg.ask([HOOPS_TEXT.resume, camRow, HOOPS_TEXT.walkOff], { cancelIndex: 0 });
    this.asking = false;
    this.banner.setText('');
    if (pick === 1) {
      // the S12c camera toggle — persisted device-local (the Sound pattern)
      this.camMode = this.camMode === 'side' ? 'behind' : 'side';
      try {
        localStorage.setItem(CAM_KEY, this.camMode);
      } catch {
        /* storage denied — the toggle lives for the session */
      }
      AUDIO.sfx('confirm');
      return;
    }
    if (pick !== 2) return;
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

  private frameOf(a: Athlete, i: number, hasBall: boolean, defending: boolean): number {
    const F = SPORT_FRAME;
    const phase = Math.floor(this.sim.t / 150) % 2;
    const slow = Math.floor(this.sim.t / 420) % 2;
    // the pass animation rides the FLIGHT, not a state (the ball already left)
    if (this.sim.ball.kind === 'pass' && this.sim.ball.from === i && this.sim.ball.t < 230) {
      const style = this.sim.ball.style;
      return style === 'bounce' ? F.passBounce : style === 'btb' ? F.passBtb : F.passChest;
    }
    switch (a.state) {
      case 'gather':
        return F.gather;
      case 'rise':
        // release → the FOLLOW-THROUGH holds (livelier S12c read)
        return a.stateT < 130 ? F.rise : a.stateT < 280 ? F.release : F.follow;
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
      case 'spin':
        return a.stateT < 215 ? F.spinA : F.spinB;
      case 'btb':
        return a.stateT < 215 ? F.btbA : F.btbB;
      case 'btl':
        return a.stateT < 215 ? F.btlA : F.btlB;
      case 'stun':
        return phase === 0 ? F.stunA : F.stunB;
      case 'trip':
        return F.trip;
      case 'fall':
        return F.fall;
      case 'celebrate':
        return slow === 0 ? F.cheerA : F.cheerB;
      default:
        // landing recovery: knees soft for a beat after a leap comes down
        if (a.leapCd > BLOCK_TIMING.LAND_CD_MS - 140) return F.land;
        if (hasBall) return a.moving ? (phase === 0 ? F.runA : F.runB) : slow === 0 ? F.idleA : F.idleB;
        if (defending && a.moving && !a.turbo) return phase === 0 ? F.slideA : F.slideB;
        if (a.moving) return phase === 0 ? F.offA : F.offB;
        return defending ? F.slideA : F.offA;
    }
  }

  /** the rim the BEHIND camera faces: the end under attack */
  private viewRim(): { x: number; y: number } {
    return this.sim.rimOf(this.sim.posTeam);
  }

  /** world → screen for the active camera. SIDE: court space (the camera
   *  scrolls). BEHIND: behindMap projection (screen-fixed). */
  private project(wx: number, wy: number, z: number): { x: number; y: number; scale: number } {
    if (this.camMode === 'side') {
      return { x: PAD + wx, y: PAD + wy - z, scale: 1 };
    }
    const rim = this.viewRim();
    const latSign = rim.x < COURT.W / 2 ? -1 : 1;
    const m = behindMap(Math.abs(wx - rim.x), (wy - COURT.RIM_Y) * latSign);
    return { x: m.x, y: m.y - z * m.scale * 0.85, scale: m.scale };
  }

  private renderWorld(): void {
    const behind = this.camMode === 'behind';
    this.courtSide.setVisible(!behind);
    this.courtBehind.setVisible(behind);
    this.hoopL.setVisible(!behind);
    this.hoopR.setVisible(!behind);
    this.boardBehind.setVisible(behind);
    if (behind) {
      const rim = this.viewRim();
      this.courtBehind.setFlipX(rim.x > COURT.W / 2);
      this.cameras.main.setScroll(0, 0);
    }
    const holderIdx = this.sim.ball.kind === 'held' ? this.sim.ball.by : -1;
    this.sim.athletes.forEach((a, i) => {
      const s = this.sprites[i];
      const defending = this.sim.posTeam !== a.team;
      s.setTexture(a.def.key, this.frameOf(a, i, holderIdx === i, defending));
      s.setFlipX(a.face < 0);
      const p = this.project(a.x, a.y + 6, a.z);
      s.setPosition(p.x, p.y);
      s.setScale(p.scale);
      s.setDepth(behind ? 10 + p.y * 0.2 : 10 + a.y * 0.05);
      s.setScrollFactor(behind ? 0 : 1);
      const sh = this.shadows[i];
      const ps = this.project(a.x, a.y + 5, 0);
      sh.setPosition(ps.x, ps.y);
      sh.setScale(ps.scale);
      sh.setScrollFactor(behind ? 0 : 1);
      sh.setAlpha(a.z > 0 ? 0.35 : 0.55);
    });
    // the ball (held: a deterministic dribble bob off the sim clock)
    const bp = this.sim.ballPos();
    let bz = bp.z;
    if (this.sim.ball.kind === 'held') {
      const h = this.sim.athletes[this.sim.ball.by];
      bz = h.moving || h.state === 'play' ? 4 + Math.abs(Math.sin(this.sim.t * 0.012)) * 14 + h.z : bp.z;
    }
    const pb = this.project(bp.x, bp.y, bz);
    this.ballSpr.setPosition(pb.x, pb.y);
    this.ballSpr.setScale(pb.scale);
    this.ballSpr.setScrollFactor(behind ? 0 : 1);
    this.ballSpr.setDepth(behind ? 10 + pb.y * 0.2 + 5 : 10 + bp.y * 0.05 + (bz > 40 ? 30 : 1));
    const pbs = this.project(bp.x, bp.y + 4, 0);
    this.ballShadow.setPosition(pbs.x, pbs.y);
    this.ballShadow.setScale(0.5 * pbs.scale, 0.6 * pbs.scale);
    this.ballShadow.setScrollFactor(behind ? 0 : 1);
    this.ballShadow.setAlpha(Math.max(0.2, 0.5 - bz * 0.004));
    // net ripple
    this.netT += 16.7;
    const netFrame = this.netT < 90 ? 1 : this.netT < 220 ? 2 : 0;
    this.hoopL.setFrame(netFrame);
    this.hoopR.setFrame(netFrame);
    // the controlled-athlete pip
    const c = this.sim.athletes[this.sim.controlled];
    const pc = this.project(c.x, c.y, c.z + 38);
    this.cursor.setPosition(pc.x, pc.y);
    this.cursor.setScrollFactor(behind ? 0 : 1);
    this.cursor.setVisible(this.stage === 'play' && c.team === 0);
    // THE OVER-HEAD METER (S12c): world-space, follows the gatherer/dunker
    this.renderMeter(behind);
    // camera follows the ball, 2K-style (SIDE only — BEHIND is a fixed seat)
    if (!behind) {
      const cam = this.cameras.main;
      cam.scrollX += (PAD + bp.x - 200 - cam.scrollX) * 0.08;
      cam.scrollY += (PAD + bp.y - 112 - cam.scrollY) * 0.08;
    }
  }

  /** the hold-release meter over the shooter's head: fills UPWARD, the green
   *  band seated at the TOP (it shrinks live as range/defenders close) */
  private renderMeter(behind: boolean): void {
    let read: ReturnType<HoopsSim['meterOf']> = null;
    let who: Athlete | null = null;
    for (let i = 0; i < this.sim.athletes.length; i++) {
      const m = this.sim.meterOf(i);
      if (m) {
        read = m;
        who = this.sim.athletes[i];
        break;
      }
    }
    const show = read !== null && who !== null && this.stage === 'play';
    this.meterBack.setVisible(show);
    this.meterGreen.setVisible(show);
    this.meterFill.setVisible(show);
    if (!show || !read || !who) return;
    const H = 30;
    const p = this.project(who.x, who.y, who.z + 44);
    const sf = behind ? 0 : 1;
    this.meterBack.setPosition(p.x, p.y + H / 2).setScrollFactor(sf);
    // the green window: [lo, 1] of the drum, drawn from the top down — and
    // when range has CLOSED it (lo ≥ 1), no green is drawn: there is none
    const winH = (1 - read.lo) * H;
    this.meterGreen.setVisible(winH >= 1);
    this.meterGreen.setPosition(p.x, p.y - H / 2).setScrollFactor(sf);
    this.meterGreen.height = Math.max(1, winH);
    this.meterGreen.setFillStyle(colorOf(px(read.kind === 'dunk' ? RAMP.GOLD : read.kind === 'layup' ? RAMP.CYAN : RAMP.GRASS, 2)));
    // the fill rises from the bottom; past the top it reads as overfill (red)
    const frac = Math.min(1.12, read.frac);
    const fillH = Math.max(1, Math.min(1, frac) * (H - 2));
    this.meterFill.setPosition(p.x, p.y + H / 2 - 1).setScrollFactor(sf);
    this.meterFill.height = fillH;
    this.meterFill.width = 3;
    this.meterFill.setFillStyle(colorOf(px(frac > 1 ? RAMP.RED : RAMP.PAPER, 3)));
  }

  private renderHud(): void {
    this.hudScore.setText(this.cfg.tutorial ? HOOPS_TEXT.tutTitle : `US ${this.sim.scoreUs} - ${this.sim.scoreThem} THEM`);
    // the bucket flash: the board pulses paper-bright for a beat on a make
    this.hudScore.setTint(colorOf(px(this.elapsed < this.scoreFlashUntil ? RAMP.PAPER : RAMP.GOLD, 3)));
    if (this.cfg.tutorial) {
      this.hudClock.setText(this.tutStep >= 0 && this.tutStep < TUT_STEPS.length ? `LESSON ${this.tutStep + 1}/${TUT_STEPS.length}` : '');
      this.hudShot.setText('');
    } else if (this.sim.format === '5v5') {
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
  }

  /* ================= exit ================= */

  private close(): void {
    AUDIO.sfx('cancel');
    this.game.events.emit('mf-hoops-closed');
    this.scene.stop();
  }
}
