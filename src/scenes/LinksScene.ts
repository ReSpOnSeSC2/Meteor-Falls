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
import { GolfSim, GOLF, SIM_DT, windOf, windPutts, type GolfInput, type GolfEvent } from '../links/sim';
import { CLUBS, LIES, YD, HOLES, COURSE_PAR, yards, dist, type HoleDef } from '../links/course';
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
import { ensureLinksArt } from '../spritegen';
import { ensureGolfBehindArt, freeGolfBehindArt } from '../spritegen/authored';
import { ITEMS } from '../data/items';
import { makeRng, type Rng } from '../hoops/sim';
import { Dialogue, everyFrame, makeWindow, makeBox, vars, glyphify, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import { s, ART_SCALE } from '../spritegen/scale';
import { projectHole, projectPoint, type HoleProjection, type FitBox } from '../links/dioramas';

export interface LinksLaunch {
  kind: 'stroke' | 'match';
  /** match: the bracket round (0..4) — flags carry seed + round */
  round?: number;
}

type Stage = 'card' | 'play' | 'score' | 'tally';
/** side-on golfer poses: the swing cycle (address → top → impact → finish) plus
 *  the hole-out reactions (pump A/B fist-pump win, slump A/B dejected loss) */
type BehindPose = 'address' | 'top' | 'impact' | 'finish' | 'putt' | 'pumpA' | 'pumpB' | 'slumpA' | 'slumpB';

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

  // the hole flyover: the diorama is fit static and the ball arcs across it
  private course!: Phaser.GameObjects.Image;
  private ballSpr!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private flag!: Phaser.GameObjects.Image;
  private aimLine!: Phaser.GameObjects.Rectangle;
  private aimDot!: Phaser.GameObjects.Arc;
  /** the predicted perfect-hit trajectory arc + flowing dots + landing reticle
   *  (full/chip shots); the putt keeps the simple aimLine/aimDot */
  private aimArc!: Phaser.GameObjects.Graphics;
  private burst!: Phaser.GameObjects.Sprite;
  /** a fading shot-tracer streak drawn BEHIND the in-flight ball (both views) so
   *  its full rise-and-fall to the ground reads on the static backdrop */
  private tracer!: Phaser.GameObjects.Graphics;
  private flightTrail: { x: number; y: number; r: number }[] = [];
  /** the golfer stands ON the course at the ball and plays the shot in-world */
  private golfer!: Phaser.GameObjects.Sprite;
  /** sim-space stance position; FROZEN through the flight so the golfer holds
   *  the follow-through at the strike spot while the ball flies on */
  private golferAnchor = { x: 0, y: 0 };
  /** the sim→illustration similarity transform for the current hole */
  private proj!: HoleProjection;
  /** golf-ball texture is authored ~50px; this reads it small on the course */
  private readonly ballScale = 0.5;
  /** on-screen scale of the golfer (texture frame is 128×160 runtime px) */
  private readonly golferScale = 0.92;
  /** TOP = immersive overhead course; BEHIND = over-the-shoulder POV (toggle V) */
  private viewMode: 'top' | 'behind' = 'top';
  private vKey?: Phaser.Input.Keyboard.Key;
  /** behind-POV: the authored down-the-fairway backdrop, the back-view golfer,
   *  and the diorama demoted to a corner minimap */
  private behindBg!: Phaser.GameObjects.Image;
  /** the backdrop texture key currently shown — so updateBehindBackdrop only
   *  re-textures on an actual shot-context change */
  private behindBgKey = '';
  /** the hole whose big behind-view backdrops are currently resident — freed as
   *  the next hole's set is fetched (the 1600×900 POV art is loaded use-time) */
  private prevBehindHoleId = '';
  private behindGolfer!: Phaser.GameObjects.Image;
  private minimapFrame!: Phaser.GameObjects.Graphics;
  private minimapBall!: Phaser.GameObjects.Arc;
  /** corner-minimap projection (letterbox fit) — set per hole beside the cover */
  private projMini!: HoleProjection;
  /** the side-on AUTHORED swing cycle, keyed off sim.phase — shared by BOTH
   *  views (behind = large, top = small on the aerial course). Each entry carries
   *  a `scale` (corrects body height — poses with the club raised crop taller, so
   *  height-normalizing shrinks the body; scale lifts it back) and `fx` (a
   *  FRACTION of displayWidth to nudge sideways, keeping the feet planted when the
   *  club throws the cropped figure off-centre, e.g. impact reaches far right). A
   *  fraction (not fixed px) so it re-centres correctly at either view's size.
   *  `dx` is a fixed DESIGN-px stance nudge (behind view) — the putt shifts right
   *  so the centred putter head lines up with the ball at its address anchor. */
  private readonly BEHIND_POSES: Record<BehindPose, { key: string; scale: number; fx: number; dx: number }> = {
    address: { key: 'links_golfer_back', scale: 1.0, fx: 0, dx: 0 },
    top: { key: 'links_golfer_back_top', scale: 1.27, fx: 0, dx: 0 },
    impact: { key: 'links_golfer_back_impact', scale: 1.07, fx: 0.15, dx: 0 },
    finish: { key: 'links_golfer_back_finish', scale: 1.16, fx: 0, dx: 0 },
    putt: { key: 'links_golfer_back_putt', scale: 1.0, fx: 0, dx: 22 },
    // hole-out reactions (two frames each, alternated for a small idle loop).
    // pumpB raises a fist overhead so its crop is taller → biggest scale-up.
    pumpA: { key: 'links_golfer_back_pump_a', scale: 1.07, fx: 0, dx: 0 },
    pumpB: { key: 'links_golfer_back_pump_b', scale: 1.23, fx: 0, dx: 0 },
    slumpA: { key: 'links_golfer_back_slump_a', scale: 1.0, fx: 0, dx: 0 },
    slumpB: { key: 'links_golfer_back_slump_b', scale: 1.03, fx: 0, dx: 0 },
  };
  /** top-view golfer base height (design px) — small figure on the aerial course */
  private readonly topGolferH = s(38);
  /** address-pose display size (runtime px), captured once — the ball's address
   *  anchor reads off THESE, not the live sprite, so it stays put at the tee
   *  while the golfer winds the club up and over through the backswing */
  private behindAddrW = 0;
  private behindAddrH = 0;
  /** elapsed-ms stamp of the last full/chip strike — drives the brief impact flash */
  private lastStrikeAt = -1e9;
  /** the ball's lie at the START of the current shot. The behind view reframes
   *  every stroke around THIS point (player at the ball, green ahead) instead of
   *  the tee, so approach/putt shots aren't drawn way up the fairway away from
   *  the golfer. Frozen while the ball rests (aim/power/acc); the ball then flies
   *  from it toward the pin. */
  private behindShotOrigin = { x: 0, y: 0 };
  /** after a shot comes to rest, hold the camera on the landing for a beat so the
   *  ball is SEEN to land/settle (and a putt seen reaching the cup) before the
   *  view reframes around the next shot. Skippable with A. */
  private settleHoldUntil = 0;
  /** the post-shot ground-truth flash (behind view): stamp + whether this landing
   *  is near the green (the surprising case) so we briefly show the true lie */
  private settleStartedAt = 0;
  private settleFlashOn = false;
  /** the ¾-aerial ground-truth overlay + the ball's true-lie dot for that flash */
  private settleFlash!: Phaser.GameObjects.Image;
  private settleFlashDot!: Phaser.GameObjects.Arc;

  // HUD + the swing pane
  private hudTop!: Phaser.GameObjects.BitmapText;
  private hudStroke!: Phaser.GameObjects.BitmapText;
  private hudYds!: Phaser.GameObjects.BitmapText;
  private hudWind!: Phaser.GameObjects.BitmapText;
  private hudClub!: Phaser.GameObjects.BitmapText;
  private windGfx!: Phaser.GameObjects.Graphics;
  private windCx = 0;
  private windCy = 0;
  private ticker!: Phaser.GameObjects.BitmapText;
  private tickerUntil = 0;
  private banner!: Phaser.GameObjects.BitmapText;
  private bannerUntil = 0;
  /** the 2-tap swing meter — a clean horizontal broadcast bar. The chassis
   *  (plate + groove + ticks) is drawn ONCE; the live fill / power band /
   *  accuracy window / needle are redrawn each frame into meterDyn. */
  private meterChassis!: Phaser.GameObjects.Graphics;
  private meterDyn!: Phaser.GameObjects.Graphics;
  /** the phase word ('POWER' / 'ACCURACY') riding above the bar's right end */
  private meterPhase!: Phaser.GameObjects.BitmapText;
  /** meter rail geometry (runtime px), set in create(), read in render() */
  private meterCx = 0;
  private meterCy = 0;
  private meterW = 0;
  private meterTH = 0;
  /** power→accuracy lock-flash timing + phase-edge tracking (responsive feedback) */
  private meterFlashAt = -1e9;
  private meterPrevPhase = '';
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

    const W = this.scale.width;
    const H = this.scale.height;
    const paper = colorOf(px(RAMP.PAPER, 3));
    const gold = colorOf(px(RAMP.GOLD, 3));
    const cyan = colorOf(px(RAMP.CYAN, 2));
    const ink = colorOf(px(RAMP.INK, 0));

    // ---- backdrop: a sky→sea gradient BEHIND the hole. The course now COVERS
    // the whole screen (immersive on-course view), so this shows only through the
    // illustration's transparent corners — reading as the surrounding sea.
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-4);
    sky.fillGradientStyle(colorOf(px(RAMP.CYAN, 2)), colorOf(px(RAMP.CYAN, 2)), colorOf(px(RAMP.BLUE, 0)), colorOf(px(RAMP.BLUE, 0)), 1);
    sky.fillRect(0, 0, W, H);

    // ---- the hole: screen-filling, the green IS the playfield (cover set per hole) ----
    const box = this.dioBox();
    this.course = this.add.image(box.x + box.w / 2, box.y + box.h / 2, `links_${this.holes[0].id}`).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(0);
    this.shadow = this.add.ellipse(0, 0, s(8), s(3), ink, 0.42).setScrollFactor(0).setDepth(18).setVisible(false);
    this.flag = this.add.image(0, 0, 'links_flag').setOrigin(0.5, 1).setScrollFactor(0).setDepth(20).setVisible(false);
    // the aimer: a gold sight line off the ball + a reticle at the target end
    this.aimLine = this.add.rectangle(0, 0, s(2), s(3), gold).setOrigin(0, 0.5).setScrollFactor(0).setDepth(22).setAlpha(0.9).setVisible(false);
    this.aimDot = this.add.circle(0, 0, s(3.5), gold, 0).setStrokeStyle(s(1.5), gold, 0.95).setScrollFactor(0).setDepth(22).setVisible(false);
    this.aimArc = this.add.graphics().setScrollFactor(0).setDepth(23).setVisible(false);
    // the golfer plays the shot ON the course; the ball sits at the front foot
    this.golfer = this.add.sprite(0, 0, this.golferKey, 0).setOrigin(0.5, 1).setScale(this.golferScale).setScrollFactor(0).setDepth(32);
    this.tracer = this.add.graphics().setScrollFactor(0).setDepth(33).setVisible(false);
    this.ballSpr = this.add.image(0, 0, 'links_ball').setScrollFactor(0).setDepth(34).setScale(this.ballScale);
    this.burst = this.add.sprite(0, 0, 'links_splash', 0).setScrollFactor(0).setDepth(36).setVisible(false);

    // ---- top HUD ribbon: HOLE·PAR (left) · STROKE (centre) · yards (right) ----
    this.add.rectangle(0, 0, W, s(20), ink, 0.6).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI);
    this.add.rectangle(0, s(20), W, s(1), gold, 0.45).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI);
    this.hudTop = this.add.bitmapText(s(8), s(6), 'retro', '', s(7)).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI + 1).setTint(gold);
    this.hudStroke = this.add.bitmapText(s(200), s(6), 'retro', '', s(7)).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_UI + 1).setTint(paper);
    this.hudYds = this.add.bitmapText(W - s(8), s(6), 'retro', '', s(7)).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_UI + 1).setTint(cyan);

    // ---- wind widget (top-right, just under the ribbon) ----
    makeBox(this, W - s(80), s(26), s(76), s(34));
    this.add.bitmapText(W - s(74), s(31), 'retro', 'WIND', s(6)).setScrollFactor(0).setDepth(DEPTH_UI + 1).setTint(paper);
    this.windCx = W - s(20);
    this.windCy = s(35);
    this.windGfx = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_UI + 2);
    this.hudWind = this.add.bitmapText(W - s(74), s(45), 'retro', '', s(6)).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI + 1).setTint(cyan);

    // ---- center banner (PURE!/birdie pops) ----
    this.banner = this.add.bitmapText(s(200), s(70), 'retro', '', s(14)).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH_UI + 1).setCenterAlign().setTint(gold);

    // ---- caddy ticker: a bottom strip right of the swing pane. Origin (0,1)
    // pins its BOTTOM near the screen edge so a wrapped two-line caddy quip
    // grows UP instead of clipping off the bottom.
    this.ticker = this.add
      .bitmapText(s(98), H - s(7), 'retro', '', s(6))
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(W - s(108))
      .setTint(colorOf(px(RAMP.MAGENTA, 2)));

    // ---- the 3-tap meter: a slim gauge in the bottom-left corner. No window —
    // the golfer is out on the course now, not boxed in a pane. The club name
    // rides just above it. ----
    this.panelObjs = [];
    // a horizontal broadcast bar, bottom-centre. The fill sweeps RIGHT for POWER
    // (gold sweet-spot band at the far right), then a needle falls back LEFT
    // through a CENTERED green ACCURACY window. Authored in design px × s().
    this.meterW = s(176);
    this.meterTH = s(9);
    this.meterCx = W / 2;
    this.meterCy = H - s(20);
    const mHalf = this.meterW / 2;
    const plateW = this.meterW + s(20);
    const plateH = this.meterTH + s(18);
    // chassis (drawn ONCE): drop-shadow + plate + gold keyline + groove + ticks
    this.meterChassis = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_UI).setVisible(false);
    const mc = this.meterChassis;
    mc.fillStyle(colorOf(px(RAMP.INK, 0)), 0.45);
    mc.fillRoundedRect(this.meterCx - plateW / 2 + s(1), this.meterCy - plateH / 2 + s(2), plateW, plateH, s(5));
    mc.fillStyle(colorOf(px(RAMP.INK, 1)), 0.85);
    mc.fillRoundedRect(this.meterCx - plateW / 2, this.meterCy - plateH / 2, plateW, plateH, s(5));
    mc.lineStyle(s(1), colorOf(px(RAMP.GOLD, 1)), 0.55);
    mc.strokeRoundedRect(this.meterCx - plateW / 2, this.meterCy - plateH / 2, plateW, plateH, s(5));
    mc.fillStyle(colorOf(px(RAMP.INK, 0)), 0.92);
    mc.fillRoundedRect(this.meterCx - mHalf, this.meterCy - this.meterTH / 2, this.meterW, this.meterTH, s(3));
    mc.fillStyle(colorOf(px(RAMP.PAPER, 1)), 0.18);
    for (const f of [0, 0.25, 0.5, 0.75, 1]) mc.fillRect(this.meterCx - mHalf + f * this.meterW - s(0.5), this.meterCy - this.meterTH / 2 - s(2), s(1), this.meterTH + s(4));
    // the live layer (fill / power band / accuracy window / lock-mark / needle / flash)
    this.meterDyn = this.add.graphics().setScrollFactor(0).setDepth(DEPTH_UI + 1).setVisible(false);
    // club name (left) + phase word (right) ride just above the bar
    this.hudClub = this.add.bitmapText(this.meterCx - mHalf, this.meterCy - plateH / 2 - s(3), 'retro', '', s(7)).setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH_UI + 2).setTint(gold);
    this.meterPhase = this.add.bitmapText(this.meterCx + mHalf, this.meterCy - plateH / 2 - s(3), 'retro', '', s(6)).setOrigin(1, 1).setScrollFactor(0).setDepth(DEPTH_UI + 2).setTint(paper).setVisible(false);

    // ---- behind-the-player POV (press V to switch): an AUTHORED down-the-fairway
    // backdrop + the back-view golfer, with the diorama demoted to a corner
    // minimap. Same sim — only the view differs.
    this.behindBg = this.add.image(W / 2, H / 2, 'links_fairway').setScrollFactor(0).setDepth(-2).setVisible(false);
    {
      const src = this.textures.get('links_fairway').getSourceImage() as { width: number; height: number };
      this.behindBg.setScale(Math.max(W / src.width, H / src.height)); // cover the screen
    }
    // the back-view golfer (single authored pose), scaled to ~95 design px tall.
    // Depth 36 > ball(34): the club addresses the ball IN FRONT of it (priority).
    this.behindGolfer = this.add.image(0, 0, 'links_golfer_back').setOrigin(0.5, 1).setScrollFactor(0).setDepth(36).setVisible(false);
    {
      const gsrc = this.textures.get('links_golfer_back').getSourceImage() as { width: number; height: number };
      this.behindAddrH = s(95);
      this.behindAddrW = gsrc.width * (this.behindAddrH / Math.max(1, gsrc.height));
      this.behindGolfer.setScale(this.behindAddrH / Math.max(1, gsrc.height));
    }
    this.minimapFrame = this.add.graphics().setScrollFactor(0).setDepth(-1).setVisible(false);
    this.minimapBall = this.add.circle(0, 0, s(3), paper).setStrokeStyle(s(1), ink, 0.85).setScrollFactor(0).setDepth(1).setVisible(false);
    // the post-shot ground-truth flash: a full-screen copy of the ¾-aerial with
    // the ball at its TRUE lie, faded up briefly during the settle-hold so a
    // near-green landing reads honestly (no "looked on the green, ended off")
    this.settleFlash = this.add.image(W / 2, H / 2, 'links_fairway').setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH_UI - 1).setVisible(false);
    this.settleFlashDot = this.add.circle(0, 0, s(4), colorOf(px(RAMP.PAPER, 3))).setStrokeStyle(s(1), colorOf(px(RAMP.INK, 0)), 0.9).setScrollFactor(0).setDepth(DEPTH_UI).setVisible(false);
    this.vKey = this.input.keyboard?.addKey('V');
    this.add.bitmapText(W - s(6), H - s(6), 'retro', 'V / Y: VIEW', s(5)).setOrigin(1, 1).setScrollFactor(0).setDepth(DEPTH_UI + 1).setTint(paper).setAlpha(0.55);

    AUDIO.playMusic('cage');
    this.game.events.emit('mf-links-open');
    this.startHole(0);
  }

  /** The screen rect the hole COVERS — the whole screen (the HUD overlays it). */
  private dioBox(): FitBox {
    return { x: 0, y: 0, w: this.scale.width, h: this.scale.height };
  }

  /* ================= hole flow ================= */

  private startHole(i: number): void {
    this.holeIdx = i;
    const hole = this.holes[i];
    this.sim = new GolfSim(hole, this.roundRng, this.wind);
    this.behindShotOrigin = { x: s(hole.tee.x), y: s(hole.tee.y) }; // tee shot starts here
    // Fetch THIS hole's behind-view backdrops (big 1600×900 POV paintings) use-
    // time and free the last hole's. Park behindBg on the always-resident fairway
    // until they arrive — never leave it pointing at a texture we just freed.
    this.behindBg.setTexture('links_fairway');
    this.behindBgKey = 'links_fairway';
    ensureGolfBehindArt(this, hole.id, this.prevBehindHoleId);
    this.prevBehindHoleId = hole.id;
    this.settleHoldUntil = 0;
    this.settleStartedAt = 0;
    this.settleFlashOn = false;
    // The hole art is an AUTHORED ¾-aerial illustration at its own native size
    // (≈240×180), unrelated to the sim's tile grid. Fit it static into the play
    // box and solve the sim→illustration similarity transform from the per-hole
    // tee/cup anchors; render() then maps the ball/aim onto the picture. (No
    // ball-cam, no camera bounds — the whole hole is on screen at once.)
    const key = `links_${hole.id}`;
    this.course.setTexture(key);
    this.course.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    const src = this.textures.get(key).getSourceImage() as { width: number; height: number };
    this.proj = projectHole(hole, src.width, src.height, this.dioBox());
    // the corner minimap (behind view): the same art, letterbox-fit small
    const mmBox: FitBox = { x: s(8), y: s(26), w: s(66), h: s(48) };
    this.projMini = projectHole(hole, src.width, src.height, mmBox, false);
    this.minimapFrame.clear();
    this.minimapFrame.fillStyle(colorOf(px(RAMP.INK, 0)), 0.5);
    this.minimapFrame.fillRect(this.projMini.dx - s(4), this.projMini.dy - s(4), this.projMini.dw + s(8), this.projMini.dh + s(8));
    this.minimapFrame.lineStyle(s(2), colorOf(px(RAMP.GOLD, 3)), 0.85);
    this.minimapFrame.strokeRect(this.projMini.dx - s(4), this.projMini.dy - s(4), this.projMini.dw + s(8), this.projMini.dh + s(8));
    // the diorama draws its own flag at the cup; keep the sprite pin parked
    // there (hidden) in case we want a crisp marker later
    const cup = projectPoint(this.proj, s(hole.pin.x), s(hole.pin.y));
    this.flag.setPosition(cup.x, cup.y);
    this.applyViewMode();
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

    // V toggles top-down ⇄ behind-the-player at any time (card or play)
    if ((this.vKey && Phaser.Input.Keyboard.JustDown(this.vKey)) || INPUT.justPressed('Y')) this.toggleView();

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
    const aTap = INPUT.justPressed('A');
    // post-shot HOLD: keep the camera on the landing for a beat so the ball is
    // SEEN to land/settle (and a putt seen reaching the cup) before the view
    // reframes around the next shot. An eager A skips the wait.
    if (this.inSettleHold()) {
      if (aTap) {
        this.settleHoldUntil = 0;
        this.settleStartedAt = 0;
      }
      this.render();
      return;
    }
    const input: GolfInput = {
      dx: Math.sign(d.x) as -1 | 0 | 1,
      dy: Math.sign(d.y) as -1 | 0 | 1,
      aPressed: aTap,
      bPressed: INPUT.justPressed('B'),
    };
    const before = this.sim.phase;
    this.sim.advance(dt, input);
    for (const e of this.sim.events) this.onEvent(e);
    this.sim.events.length = 0;
    // a shot just came to rest (flight/roll → aim, and not holed) → hold the view
    if ((before === 'roll' || before === 'flight') && this.sim.phase === 'aim' && !this.sim.over) {
      // flash the ¾-aerial ground truth only when an APPROACH (full/chip) settles
      // near the green — the "looked on the green, ended off" case. A putt that
      // settles into another putt doesn't flash (you're already reading the green).
      const settledNear = this.sim.swingMode() !== 'full';
      const wasApproach = this.sim.mode !== 'putt';
      this.settleFlashOn = settledNear && wasApproach;
      this.settleStartedAt = this.elapsed;
      this.settleHoldUntil = this.elapsed + (this.settleFlashOn ? 1100 : 750);
    }
    this.render();
  }

  /** true while the post-shot landing hold is active (see settleHoldUntil) */
  private inSettleHold(): boolean {
    return this.elapsed < this.settleHoldUntil;
  }

  private onEvent(e: GolfEvent): void {
    switch (e.kind) {
      case 'sfx':
        AUDIO.sfx(e.name);
        break;
      case 'stroke': {
        this.lastStrikeAt = this.elapsed; // behind-view: brief impact pose at the strike
        // a QUICK flash only — the stroke count lives in the HUD, and a long
        // centre banner sat over the whole ball flight (apex + descent), so the
        // shot read as "cut off"; clear it before the ball reaches its apex.
        this.showBanner(LINKS_TEXT.strokeLine.replace('{n}', String(e.n)), 320);
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
    // map the ball onto the illustration; the splash/sand sheets are authored
    // large, so read them small over the ball
    const at = projectPoint(this.proj, this.sim.ball.x, this.sim.ball.y);
    this.burst.setTexture(key, 0).setPosition(at.x, at.y - s(4)).setScale(0.5).setVisible(true);
    this.time.delayedCall(110, () => this.burst.setFrame(1));
    this.time.delayedCall(320, () => this.burst.setVisible(false));
  }

  /** a one-shot verdict popup over the ball (mapped to the illustration, drifts up) */
  private strikePopup(text: string, ramp: number): void {
    const at = projectPoint(this.proj, this.sim.ball.x, this.sim.ball.y);
    const t = this.add
      .bitmapText(at.x, at.y - s(18), 'retro', text, s(8))
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
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
    // the round is over — clear the course actors so they don't peek past the
    // full-screen scorecard
    [this.golfer, this.ballSpr, this.shadow, this.tracer, this.aimLine, this.aimDot, this.aimArc, this.meterChassis, this.meterDyn, this.meterPhase].forEach((o) => o.setVisible(false));
    this.flightTrail.length = 0;
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

  /** Pick the side-on swing pose for the current phase (both views use it).
   *  Address holds through aim; the club winds up to the top across the power
   *  tap; impact flashes for a beat at the strike, then the finish holds through
   *  the flight/roll. */
  private swingPose(): BehindPose {
    const sim = this.sim;
    const putt = sim.swingMode() === 'putt';
    // hold the finish through the post-shot landing beat (the sim is already back
    // at 'aim', but the golfer should be watching the ball, not re-addressing)
    if (this.inSettleHold()) return putt ? 'putt' : 'finish';
    switch (sim.phase) {
      case 'aim':
        return putt ? 'putt' : 'address';
      case 'power':
        return putt ? 'putt' : sim.meterT < 0.5 ? 'address' : 'top';
      case 'acc':
        return putt ? 'putt' : 'top';
      case 'flight':
        return this.elapsed - this.lastStrikeAt < 130 ? 'impact' : 'finish';
      case 'roll':
        return putt ? 'putt' : 'finish';
      case 'holed':
        // win (≤ par) → fist-pump, else dejected slump; two frames alternate for
        // a small idle loop (pump quicker than the slow slump), mirroring the old
        // procedural fistpump / slumpA·slumpB behaviour
        if (sim.strokes <= sim.hole.par) return Math.floor(this.elapsed / 260) % 2 === 0 ? 'pumpA' : 'pumpB';
        return Math.floor(this.elapsed / 420) % 2 === 0 ? 'slumpA' : 'slumpB';
      default:
        return 'address';
    }
  }

  private render(): void {
    // `s` is the scale helper; the sim is `sim`. The sim runs in its own
    // runtime-px tile space; projectPoint() maps that onto the displayed
    // illustration. Ball height (z) lifts the sprite by z×(the map scale).
    const sim = this.sim;
    // the actors (ball/golfer/aim) render per VIEW; the HUD below is shared
    if (this.viewMode === 'behind') this.renderBehindActors();
    else this.renderTopActors();
    // ---- HUD ribbon: HOLE·PAR (left) · STROKE (centre) · yards (right) ----
    const hole = this.holes[this.holeIdx];
    const holeNo = this.cfg.kind === 'stroke' ? this.holeIdx + 1 : HOLES.indexOf(hole) + 1;
    this.hudTop.setText(LINKS_TEXT.holeCard.replace('{n}', String(holeNo)).replace('{par}', String(hole.par)));
    this.hudStroke.setText(LINKS_TEXT.strokeLine.replace('{n}', String(sim.strokes + (sim.phase === 'holed' ? 0 : 1))));
    this.hudYds.setText(LINKS_TEXT.yardsOut.replace('{yds}', String(sim.ydsToPin())));
    // ---- wind widget: a cyan arrow blowing with the wind + the "N putts" read ----
    this.windGfx.clear();
    if (this.wind.mph === 0) {
      this.hudWind.setText('CALM');
    } else {
      // compact readout — the arrow blows WITH the wind, so the cardinal
      // direction reads at a glance without spelling it out in the small box
      const putts = windPutts(this.wind.mph);
      this.hudWind.setText(`${putts} ${putts === 1 ? 'PUTT' : 'PUTTS'}`);
      const ang = Math.atan2(this.wind.y, this.wind.x);
      const L = s(9);
      const ux = Math.cos(ang);
      const uy = Math.sin(ang);
      const nx = -uy;
      const ny = ux;
      const cx = this.windCx;
      const cy = this.windCy;
      this.windGfx.fillStyle(colorOf(px(RAMP.CYAN, 3)), 1);
      this.windGfx.fillTriangle(
        cx + ux * L,
        cy + uy * L,
        cx - ux * L * 0.5 + nx * L * 0.55,
        cy - uy * L * 0.5 + ny * L * 0.55,
        cx - ux * L * 0.5 - nx * L * 0.55,
        cy - uy * L * 0.5 - ny * L * 0.55,
      );
    }
    this.hudClub.setText(sim.swingMode() === 'putt' ? 'PUTTER' : sim.swingMode() === 'chip' ? 'CHIP' : CLUBS[sim.clubIdx].name);
    if (this.ticker.text !== '' && this.elapsed > this.tickerUntil) this.ticker.setText('');
    if (this.banner.text !== '' && this.elapsed > this.bannerUntil) this.banner.setText('');
    // ---- THE 2-TAP METER: POWER sweeps right, then ACCURACY falls back through
    // a centered green window. Live read, redrawn each frame into meterDyn. ----
    const inMeter = sim.phase === 'power' || sim.phase === 'acc';
    if (this.meterPrevPhase === 'power' && sim.phase === 'acc') this.meterFlashAt = this.elapsed;
    this.meterPrevPhase = sim.phase;
    this.meterChassis.setVisible(inMeter);
    this.meterDyn.setVisible(inMeter);
    this.meterPhase.setVisible(inMeter);
    this.ticker.setVisible(!inMeter); // the swing meter owns the bottom strip; caddy chatter yields
    if (inMeter) {
      const acc = sim.phase === 'acc';
      const cx = this.meterCx;
      const cy = this.meterCy;
      const mw = this.meterW;
      const left = cx - mw / 2;
      const th = this.meterTH;
      const cap = GOLF.POWER_CAP;
      const rf = (f: number): number => left + Math.max(0, Math.min(1, f)) * mw; // rail-fraction → x (clamped to the track)
      const md = this.meterDyn;
      md.clear();
      this.meterPhase.setText(acc ? 'ACCURACY' : 'POWER').setTint(colorOf(px(acc ? RAMP.GRASS : RAMP.GOLD, 3)));
      // POWER sweet-spot band [1/cap .. 1] at the far right; dims in the acc phase
      md.fillStyle(colorOf(px(RAMP.GOLD, 2)), acc ? 0.16 : 0.42);
      md.fillRect(rf(1 / cap), cy - th / 2, rf(1) - rf(1 / cap), th);
      md.fillStyle(colorOf(px(RAMP.GOLD, 3)), acc ? 0.4 : 0.9);
      md.fillRect(rf(1) - s(1), cy - th / 2 - s(2), s(1), th + s(4)); // MAX hairline at f=1
      // the FILL: live to the needle (power) / frozen at captured power (acc, dimmed)
      const fillF = (acc ? sim.power : Math.max(0, sim.meterT)) / cap;
      md.fillStyle(colorOf(px(RAMP.GRASS, 2)), acc ? 0.4 : 1);
      md.fillRect(left, cy - th / 2, rf(fillF) - left, th);
      if (!acc) {
        md.fillStyle(colorOf(px(RAMP.PAPER, 3)), 0.25); // a top shine on the live fill
        md.fillRect(left, cy - th / 2, rf(fillF) - left, s(2));
        const hx = rf(fillF); // the bright rising head
        md.fillStyle(colorOf(px(RAMP.PAPER, 3)), 1);
        md.fillRect(hx - s(1.5), cy - th / 2 - s(3), s(3), th + s(6));
      } else {
        // the CENTERED accuracy window (live half-width = accWindow, club × lie)
        const cF = GOLF.ACC_CENTER / cap;
        const hwF = sim.accWindow() / cap;
        md.fillStyle(colorOf(px(RAMP.GRASS, 2)), 0.4);
        md.fillRect(rf(cF - hwF), cy - th / 2 - s(2), rf(cF + hwF) - rf(cF - hwF), th + s(4));
        md.fillStyle(colorOf(px(RAMP.GRASS, 3)), 0.6);
        md.fillRect(rf(cF - hwF), cy - s(2), rf(cF + hwF) - rf(cF - hwF), s(4)); // bright core
        md.fillStyle(colorOf(px(RAMP.GRASS, 3)), 0.95);
        md.fillRect(rf(cF) - s(0.5), cy - th / 2 - s(3), s(1), th + s(6)); // the perfect line
        // the LOCKED power marker (where tap 1 landed)
        const lx = rf(sim.power / cap);
        md.fillStyle(colorOf(px(RAMP.GOLD, 3)), 0.95);
        md.fillRect(lx - s(1), cy - th / 2 - s(3), s(2), th + s(6));
        // the falling needle — glows GREEN in the window, cyan outside; pulses in green
        const inWin = Math.abs(sim.meterT - GOLF.ACC_CENTER) <= sim.accWindow();
        const ramp = inWin ? RAMP.GRASS : RAMP.CYAN;
        const nh = th * 1.6 * (inWin ? 1 + 0.18 * Math.sin(this.elapsed / 70) : 1);
        const nx = rf(Math.max(GOLF.ACC_FLOOR, sim.meterT) / cap);
        md.fillStyle(colorOf(px(ramp, 3)), 0.3);
        md.fillRect(nx - s(2), cy - nh / 2, s(4), nh); // glow
        md.fillStyle(colorOf(px(ramp, 3)), 1);
        md.fillRect(nx - s(0.75), cy - nh / 2, s(1.5), nh); // needle
      }
      // the LOCK FLASH on power→acc (a white sweep, ~180ms)
      const since = this.elapsed - this.meterFlashAt;
      if (since >= 0 && since < 180) {
        md.fillStyle(0xffffff, 0.55 * (1 - since / 180));
        md.fillRect(left, cy - th / 2 - s(2), mw, th + s(4));
      }
    }
  }

  /* ================= the two views ================= */

  /** TOP view: ball/golfer/aim positioned on the screen-filling diorama. */
  private renderTopActors(): void {
    const sim = this.sim;
    const p = this.proj;
    const ground = projectPoint(p, sim.ball.x, sim.ball.y);
    const lift = sim.ball.z * p.scale * 1.35; // a poppier arc off the aerial diorama
    const live = sim.phase !== 'holed';
    const ballY = ground.y - lift;
    this.ballSpr.setPosition(ground.x, ballY);
    this.ballSpr.setScale(this.ballScale * (1 + Math.min(0.9, sim.ball.z / s(80))));
    this.ballSpr.setVisible(live);
    this.shadow.setVisible(live);
    this.shadow.setPosition(ground.x, ground.y);
    this.shadow.setScale(Math.max(0.45, 1 - sim.ball.z / s(140)));
    this.shadow.setAlpha(Math.max(0.1, 0.42 - sim.ball.z / s(260)));
    this.updateFlightTrail(sim.phase === 'flight' && live, ground.x, ballY, this.ballSpr.displayWidth * 0.5);
    // the golfer stands at the ball and FREEZES at the strike spot through the
    // flight (the ball flies on alone, the golfer holds the follow-through)
    if ((sim.phase === 'aim' || sim.phase === 'power' || sim.phase === 'acc') && !this.inSettleHold()) {
      this.golferAnchor = { x: sim.ball.x, y: sim.ball.y };
    }
    const face = Math.cos(sim.aim) < 0 ? -1 : 1;
    const gpos = projectPoint(p, this.golferAnchor.x, this.golferAnchor.y);
    // the golfer plays the shot in the authored side-on poses (same set the
    // behind view uses), sized small for the aerial course and facing down-the-
    // line. The body stays a constant size as the club swings up (pose.scale);
    // fx re-centres the crop (mirrored with facing).
    const pose = this.BEHIND_POSES[this.swingPose()];
    const gtex = this.textures.get(pose.key).getSourceImage() as { width: number; height: number };
    this.golfer.setTexture(pose.key);
    this.golfer.setScale((this.topGolferH * pose.scale) / Math.max(1, gtex.height));
    this.golfer.setFlipX(face < 0);
    const recenter = pose.fx * this.golfer.displayWidth * face;
    this.golfer.setPosition(gpos.x - s(16) * face + recenter, gpos.y + s(3));
    this.golfer.setVisible(true);
    const show = sim.phase === 'aim' && this.stage === 'play' && !this.inSettleHold();
    const fp = show ? this.predictFlight() : null;
    this.aimArc.setVisible(show);
    this.aimLine.setVisible(false);
    this.aimDot.setVisible(false);
    if (fp) {
      // full/chip: the predicted perfect-hit arc, projected onto the diorama (z lifts by the map scale)
      this.drawAimArc(fp.map((q) => { const sp = projectPoint(p, q.x, q.y); return { x: sp.x, y: sp.y - q.z * p.scale * 1.35 }; }));
    } else if (show) {
      // putt: a straight aim ARROW toward where it's pointed (reach ~ to the cup)
      const hole = this.holes[this.holeIdx];
      const reach = Math.min(Math.hypot(s(hole.pin.x) - sim.ball.x, s(hole.pin.y) - sim.ball.y), s(160));
      const tip = projectPoint(p, sim.ball.x + Math.cos(sim.aim) * reach, sim.ball.y + Math.sin(sim.aim) * reach);
      this.drawAimArrow(ground, tip);
    }
  }

  /** The perfect-hit (full power, pure) flight path for the CURRENT club/lie/aim:
   *  sampled sim-space points with height, mirroring sim.launch()+flight (wind
   *  included). RENDER-ONLY — the deterministic sim is never touched. Returns
   *  null for putts (a ground roll, not an arc). */
  private predictFlight(): { x: number; y: number; z: number }[] | null {
    const sim = this.sim;
    const mode = sim.swingMode();
    if (mode === 'putt') return null;
    const club = CLUBS[sim.clubIdx];
    const carryYd = mode === 'chip' ? GOLF.CHIP_CARRY_YD : club.carry;
    const carryPx = Math.max(s(8), carryYd * YD * LIES[sim.lie()].carry); // power = 1
    const dirX = Math.cos(sim.aim);
    const dirY = Math.sin(sim.aim); // acc = 0 → launches straight down the aim
    const flightT1 = mode === 'chip' ? GOLF.CHIP_MS : GOLF.FLIGHT_BASE_MS + (carryPx / ART_SCALE) * GOLF.FLIGHT_PER_PX;
    const v = carryPx / (flightT1 / 1000);
    let vx = dirX * v;
    let vy = dirY * v;
    const loft = mode === 'chip' ? 0.9 : club.loft;
    const apex = s(22) + carryPx * loft * 0.16;
    const wf = mode === 'full' ? 0.6 + club.loft : 0.35;
    const dt = SIM_DT / 1000;
    const pts: { x: number; y: number; z: number }[] = [];
    let bx = sim.ball.x;
    let by = sim.ball.y;
    for (let ft = 0, i = 0; ft < flightT1; ft += SIM_DT, i++) {
      if (i % 3 === 0) pts.push({ x: bx, y: by, z: Math.sin((ft / flightT1) * Math.PI) * apex });
      vx += sim.wind.x * wf * dt; // curve/after are 0 for a pure, hands-off shot
      vy += sim.wind.y * wf * dt;
      bx += vx * dt;
      by += vy * dt;
    }
    pts.push({ x: bx, y: by, z: 0 }); // the landing spot (perfect-hit carry end)
    return pts;
  }

  /** Draw the trajectory arc + flowing dots + a pulsing landing reticle through a
   *  set of already-projected SCREEN points (the per-view projection is applied
   *  by the caller). The dots march toward the target for a live, readable aim. */
  private drawAimArc(pts: { x: number; y: number }[]): void {
    const g = this.aimArc;
    g.clear();
    if (pts.length < 2) return;
    const gold = colorOf(px(RAMP.GOLD, 3));
    // 1) the trajectory line — a dark casing under a bold gold core so the tall
    //    up-and-over shape reads against sky or grass
    g.lineStyle(s(3), colorOf(px(RAMP.INK, 2)), 0.35);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.strokePath();
    g.lineStyle(s(1.8), gold, 0.85);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.strokePath();
    // 2) flowing dots — parametrize by cumulative length so they march evenly
    const cum: number[] = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      cum.push(total);
    }
    const at = (frac: number): { x: number; y: number } => {
      const d = frac * total;
      let i = 1;
      while (i < cum.length && cum[i] < d) i++;
      if (i >= cum.length) return pts[pts.length - 1];
      const t = (d - cum[i - 1]) / Math.max(1e-3, cum[i] - cum[i - 1]);
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t };
    };
    const phase = (this.elapsed / 750) % 1; // a dot reaches the target every 750ms
    g.fillStyle(gold, 0.95);
    for (let j = 0; j < 5; j++) {
      const f = (j / 5 + phase) % 1;
      const p = at(f);
      g.fillCircle(p.x, p.y, s(1.3) + s(0.9) * Math.sin(f * Math.PI)); // swells mid-flight
    }
    // 3) the landing reticle — a pulsing target ring at the predicted carry end
    const land = pts[pts.length - 1];
    const pulse = 1 + 0.16 * Math.sin(this.elapsed / 240);
    g.lineStyle(s(1.6), gold, 0.95);
    g.strokeCircle(land.x, land.y, s(4) * pulse);
    g.lineStyle(s(1), gold, 0.55);
    g.strokeCircle(land.x, land.y, s(7) * pulse);
  }

  /** Draw a straight aim ARROW (shaft + arrowhead) from `from` to `to` on the
   *  aimArc graphics — the putt aimer (a roll has no arc). */
  private drawAimArrow(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const g = this.aimArc;
    g.clear();
    const gold = colorOf(px(RAMP.GOLD, 3));
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    const head = s(8);
    const aw = s(4.5);
    // the shaft (stop short so the head caps it cleanly)
    g.lineStyle(s(2.4), gold, 0.92);
    g.beginPath();
    g.moveTo(from.x, from.y);
    g.lineTo(to.x - Math.cos(ang) * head * 0.6, to.y - Math.sin(ang) * head * 0.6);
    g.strokePath();
    // the solid arrowhead at the tip
    g.fillStyle(gold, 0.95);
    g.beginPath();
    g.moveTo(to.x, to.y);
    g.lineTo(to.x - Math.cos(ang) * head + Math.cos(ang + Math.PI / 2) * aw, to.y - Math.sin(ang) * head + Math.sin(ang + Math.PI / 2) * aw);
    g.lineTo(to.x - Math.cos(ang) * head + Math.cos(ang - Math.PI / 2) * aw, to.y - Math.sin(ang) * head + Math.sin(ang - Math.PI / 2) * aw);
    g.closePath();
    g.fillPath();
  }

  /** Project a sim-space ground point into the behind-the-player perspective. */
  private behindXY(simX: number, simY: number, settled = false): { x: number; y: number; along: number; scale: number } {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const greenY = H * 0.45; // the green/flag sits ~45% down the backdrop
    // the address anchor = the golfer's CLUB HEAD (so the ball sits just over the
    // top of the club at address). Derived from the FIXED address-pose footprint
    // (base position + captured display size), NOT the live sprite — so the ball
    // holds at the tee while the club winds up and over through the backswing.
    const footX = this.scale.width / 2 - s(21) + 0.44 * this.behindAddrW; // right, onto the club head
    const footY = H * 0.88 - 0.08 * this.behindAddrH; // down, snug to the club head
    const hole = this.holes[this.holeIdx];
    // project from the CURRENT shot's lie toward the pin, not the tee → every
    // stroke frames as "behind the player at the ball, green ahead"
    const ox = this.behindShotOrigin.x;
    const oy = this.behindShotOrigin.y;
    const hx = s(hole.pin.x) - ox;
    const hy = s(hole.pin.y) - oy;
    const len = Math.hypot(hx, hy) || 1;
    const ux = hx / len;
    const uy = hy / len;
    const dx = simX - ox;
    const dy = simY - oy;
    const along = Math.max(0, Math.min(1.04, (dx * ux + dy * uy) / len));
    const lateral = dx * -uy + dy * ux; // signed perpendicular (sim px)
    const persp = 1 - 0.62 * along;
    // a SETTLED ball reads honestly: never let it claim the painted-flag back row
    // (along ≤ 0.93), and let a lateral miss sit clearly BESIDE the flag, not on it
    const ay = settled ? Math.min(along, 0.93) : along;
    const lateralGain = settled ? 0.8 : 0.55;
    // x starts at the club head (footX) and converges to the green centre (cx)
    const x = footX + (cx - footX) * along + lateral * lateralGain * persp;
    const y = footY - (footY - greenY) * Math.pow(ay, 0.62);
    const scale = 1.5 + (0.3 - 1.5) * along; // near (big) → far (small)
    return { x, y, along, scale };
  }

  /** BEHIND view: the ball arcs and shrinks into the distance, the golfer plays
   *  it in the foreground, the diorama rides in the corner minimap. */
  private renderBehindActors(): void {
    const sim = this.sim;
    const H = this.scale.height;
    const live = sim.phase !== 'holed';
    this.updateBehindBackdrop(); // swap backdrop by current lie/distance (tee/approach/bunker/putt)
    // freeze the shot origin at the lie while the ball rests, so behindXY reframes
    // this stroke around the player (the ball then flies away from it to the green)
    if ((sim.phase === 'aim' || sim.phase === 'power' || sim.phase === 'acc') && !this.inSettleHold()) {
      this.behindShotOrigin = { x: sim.ball.x, y: sim.ball.y };
    }
    // 1) the side-on golfer plays the shot in the foreground — the swing pose is
    //    chosen off sim.phase (address → top → impact → finish). Positioned FIRST
    //    so behindXY can anchor the ball (which reads the FIXED address pose, not
    //    this live sprite). Each pose is height-normalized then scale-corrected so
    //    the body stays the same size as the club swings up out of frame; dx keeps
    //    the feet planted when the club throws the crop off-centre.
    this.golfer.setVisible(false);
    this.behindGolfer.setVisible(true);
    const pose = this.BEHIND_POSES[this.swingPose()];
    const ptex = this.textures.get(pose.key).getSourceImage() as { width: number; height: number };
    this.behindGolfer.setTexture(pose.key);
    this.behindGolfer.setScale((this.behindAddrH / Math.max(1, ptex.height)) * pose.scale);
    this.behindGolfer.setPosition(this.scale.width / 2 - s(21) + pose.fx * this.behindGolfer.displayWidth + s(pose.dx), H * 0.88);
    // 2) ball + shadow — a real golf ball reads SMALL at the player's feet;
    //    behindXY anchors address just over the top of the club head.
    const atRest = sim.phase === 'aim' || sim.phase === 'holed';
    const g = this.behindXY(sim.ball.x, sim.ball.y, atRest);
    // The shot LOFTS hard (z×1.6) so the ball climbs into the sky and is seen
    // falling all the way back down to its shadow on the ground — the old z×0.5
    // skim barely lifted off the turf, so the descent never read.
    const hFrac = Math.min(1, sim.ball.z / s(150)); // 0 grounded → 1 high overhead
    const zPx = sim.ball.z * 1.6 * (1 - 0.15 * g.along);
    const ballY = Math.max(s(6), g.y - zPx); // a max drive still stays in frame
    this.ballSpr.setVisible(live);
    this.ballSpr.setPosition(g.x, ballY);
    // in FLIGHT the ball reads as a clear, trackable dot (a realistic speck is
    // unreadable mid-air); it grows with height so the apex pops, but it sits
    // small at rest by the feet.
    const airborne = sim.phase === 'flight';
    this.ballSpr.setScale((airborne ? Math.max(0.34, 0.34 * g.scale) : Math.max(0.11, 0.22 * g.scale)) * (1 + 0.5 * hFrac));
    // the shadow holds the GROUND track and shrinks + fades as the ball climbs,
    // swelling back as it drops — the gap between ball and shadow IS the arc, so
    // the height (and the landing) read even on the flat backdrop.
    this.shadow.setVisible(live);
    this.shadow.setPosition(g.x, g.y);
    this.shadow.setScale(Math.max(0.2, g.scale * 0.6 * (1 - 0.5 * hFrac)));
    this.shadow.setAlpha(0.34 * (1 - 0.55 * hFrac));
    // a fading tracer streak so the eye follows the whole rise-and-fall
    this.updateFlightTrail(sim.phase === 'flight' && live, g.x, ballY, this.ballSpr.displayWidth * 0.5);
    // aim reticle: where the shot is pointed, out on the fairway
    const show = sim.phase === 'aim' && this.stage === 'play' && !this.inSettleHold();
    const fp = show ? this.predictFlight() : null;
    this.aimArc.setVisible(show);
    this.aimLine.setVisible(false);
    this.aimDot.setVisible(false);
    if (fp) {
      // full/chip: the perfect-hit arc in the over-the-shoulder perspective (z lifts as the ball climbs)
      this.drawAimArc(fp.map((q) => { const b = this.behindXY(q.x, q.y); return { x: b.x, y: Math.max(s(6), b.y - q.z * 1.6 * (1 - 0.15 * b.along)) }; }));
    } else if (show) {
      // putt: a straight aim ARROW from the ball toward the cup direction
      const hole = this.holes[this.holeIdx];
      const reach = Math.min(Math.hypot(s(hole.pin.x) - sim.ball.x, s(hole.pin.y) - sim.ball.y), s(160));
      const tip = this.behindXY(sim.ball.x + Math.cos(sim.aim) * reach, sim.ball.y + Math.sin(sim.aim) * reach);
      this.drawAimArrow({ x: g.x, y: g.y }, { x: tip.x, y: tip.y });
    }
    // the corner-minimap dot
    const mb = projectPoint(this.projMini, sim.ball.x, sim.ball.y);
    this.minimapBall.setVisible(true);
    this.minimapBall.setPosition(mb.x, mb.y);
    this.updateSettleFlash();
  }

  /** During the post-shot settle-hold (behind view, near-green landings), fade
   *  the authored ¾-aerial up full-screen with the ball at its TRUE lie — the
   *  perspective-stable ground truth — so the next-shot reframe is confirmation,
   *  not a surprise. Self-contained: dedicated overlay/dot, hidden when idle. */
  private updateSettleFlash(): void {
    const on = this.viewMode === 'behind' && this.inSettleHold() && this.settleFlashOn && this.settleStartedAt > 0;
    if (!on) {
      this.settleFlash.setVisible(false);
      this.settleFlashDot.setVisible(false);
      return;
    }
    const hole = this.holes[this.holeIdx];
    const t = this.elapsed - this.settleStartedAt;
    const IN = 250;
    const HOLD = 350;
    const a = t < IN ? t / IN : t < IN + HOLD ? 1 : Math.max(0, 1 - (t - IN - HOLD) / IN); // 0 → 1 → 0
    this.settleFlash
      .setTexture(`links_${hole.id}`)
      .setScale(this.proj.fit)
      .setPosition(this.proj.dx + this.proj.dw / 2, this.proj.dy + this.proj.dh / 2)
      .setAlpha(a)
      .setVisible(true);
    const tb = projectPoint(this.proj, this.sim.ball.x, this.sim.ball.y);
    this.settleFlashDot.setPosition(tb.x, tb.y).setAlpha(Math.min(1, a + 0.2)).setVisible(true);
  }

  /** Pick the behind-view backdrop for the CURRENT shot context: per hole AND
   *  per shot type — putt (on the green), bunker (in sand), approach (close in),
   *  else tee/long. Falls back hole-tee → legacy hole-behind → generic fairway.
   *  Only re-textures when the chosen key actually changes (cheap per frame). */
  private updateBehindBackdrop(): void {
    if (this.inSettleHold()) return; // hold the landing view; don't swap to the next shot yet
    const hole = this.holes[this.holeIdx];
    const sim = this.sim;
    const type = sim.swingMode() === 'putt' ? 'putt' : sim.lie() === 'S' ? 'bunker' : sim.ydsToPin() <= 40 ? 'approach' : 'tee';
    const key =
      [`links_${hole.id}_${type}`, `links_${hole.id}_tee`, `links_${hole.id}_behind`, 'links_fairway'].find((k) => this.textures.exists(k)) || 'links_fairway';
    if (key === this.behindBgKey) return;
    this.behindBgKey = key;
    const W = this.scale.width;
    const H = this.scale.height;
    this.behindBg.setTexture(key).setPosition(W / 2, H / 2);
    const src = this.textures.get(key).getSourceImage() as { width: number; height: number };
    this.behindBg.setScale(Math.max(W / src.width, H / src.height));
  }

  /** A short fading streak of the ball's recent screen positions, drawn behind
   *  the in-flight ball (both views) so its full rise-and-fall to the ground
   *  reads on the static backdrop. Cleared the instant the ball isn't airborne. */
  private updateFlightTrail(active: boolean, x: number, y: number, baseR: number): void {
    if (!active) {
      if (this.flightTrail.length) {
        this.flightTrail.length = 0;
        this.tracer.clear().setVisible(false);
      }
      return;
    }
    this.flightTrail.push({ x, y, r: baseR });
    if (this.flightTrail.length > 16) this.flightTrail.shift();
    const n = this.flightTrail.length;
    const gfx = this.tracer.clear().setVisible(true);
    // two passes: a dark casing so the streak reads on bright sky/clouds, then a
    // bright white core — a broadcast-style shot tracer that swells toward the ball
    for (let i = 1; i < n; i++) {
      const t = i / n; // 0 oldest (thin/faint) → 1 newest (bold, at the ball)
      const a = this.flightTrail[i - 1];
      const b = this.flightTrail[i];
      gfx.lineStyle(Math.max(s(1.4), b.r * (0.6 + 1.0 * t)), 0x0a1626, 0.10 + 0.22 * t);
      gfx.lineBetween(a.x, a.y, b.x, b.y);
    }
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const a = this.flightTrail[i - 1];
      const b = this.flightTrail[i];
      gfx.lineStyle(Math.max(s(0.8), b.r * (0.3 + 0.6 * t)), 0xffffff, 0.16 + 0.6 * t);
      gfx.lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  /** Lay the scene out for the current view: the diorama is either the
   *  screen-filling course (TOP) or the corner minimap (BEHIND). */
  private applyViewMode(): void {
    const behind = this.viewMode === 'behind';
    const proj = behind ? this.projMini : this.proj;
    this.course.setScale(proj.fit);
    this.course.setPosition(proj.dx + proj.dw / 2, proj.dy + proj.dh / 2);
    this.behindBg.setVisible(behind);
    this.behindGolfer.setVisible(behind);
    this.minimapFrame.setVisible(behind);
    this.minimapBall.setVisible(behind);
    this.golfer.setVisible(!behind);
    this.flag.setVisible(false); // both views use art-drawn pins (diorama / fairway photo)
  }

  private toggleView(): void {
    this.viewMode = this.viewMode === 'top' ? 'behind' : 'top';
    this.applyViewMode();
    this.showBanner(this.viewMode === 'behind' ? 'BEHIND VIEW' : 'TOP-DOWN VIEW', 900);
    AUDIO.sfx('confirm');
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
      .bitmapText(x, y, 'retro', glyphify(text), size)
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
    // release this round's resident behind-view backdrops (big 1600×900 art)
    if (this.prevBehindHoleId) freeGolfBehindArt(this, this.prevBehindHoleId);
    AUDIO.sfx('cancel');
    this.game.events.emit('mf-links-closed');
    this.scene.stop();
  }
}
