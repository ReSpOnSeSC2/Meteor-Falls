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
import { Dialogue, everyFrame, makeWindow, makeBox, vars, DEPTH_UI } from '../ui/windows';
import { colorOf, RAMP, px } from '../palette';
import { s } from '../spritegen/scale';
import { projectHole, projectPoint, type HoleProjection, type FitBox } from '../links/dioramas';

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

  // the hole flyover: the diorama is fit static and the ball arcs across it
  private course!: Phaser.GameObjects.Image;
  private ballSpr!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private flag!: Phaser.GameObjects.Image;
  private aimLine!: Phaser.GameObjects.Rectangle;
  private aimDot!: Phaser.GameObjects.Arc;
  private burst!: Phaser.GameObjects.Sprite;
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
  private behindGolfer!: Phaser.GameObjects.Image;
  private minimapFrame!: Phaser.GameObjects.Graphics;
  private minimapBall!: Phaser.GameObjects.Arc;
  /** corner-minimap projection (letterbox fit) — set per hole beside the cover */
  private projMini!: HoleProjection;

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
  private meterFill!: Phaser.GameObjects.Rectangle;
  private meterWin!: Phaser.GameObjects.Rectangle;
  private meterZero!: Phaser.GameObjects.Rectangle;
  /** S14b: the captured-power mark + the falling accuracy needle — the
   *  fill RISES and HOLDS; only the needle comes back down */
  private meterMark!: Phaser.GameObjects.Rectangle;
  private meterNeedle!: Phaser.GameObjects.Rectangle;
  /** meter rail geometry (runtime px), set in create(), read in render() */
  private meterX = 0;
  private meterBase = 0;
  private meterH = 0;
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
    // the golfer plays the shot ON the course; the ball sits at the front foot
    this.golfer = this.add.sprite(0, 0, this.golferKey, 0).setOrigin(0.5, 1).setScale(this.golferScale).setScrollFactor(0).setDepth(32);
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
    this.meterX = s(18);
    this.meterBase = H - s(16);
    this.meterH = s(100);
    this.hudClub = this.add.bitmapText(s(8), this.meterBase - this.meterH - s(4), 'retro', '', s(7)).setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH_UI + 2).setTint(gold);
    // a faint backing so the gauge reads over the grass
    this.add.rectangle(this.meterX, this.meterBase, s(13), this.meterH + s(6), ink, 0.5).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_UI).setStrokeStyle(s(1), colorOf(px(RAMP.GOLD, 2)), 0.5);
    // S14b: fill + window size by SCALE off a full-height quad — assigning
    // a Phaser Shape's .height does not rebuild its rendered geometry (the
    // root cause of the reported "fill going the wrong way": it never grew)
    this.meterWin = this.add.rectangle(this.meterX, this.meterBase, s(9), this.meterH, colorOf(px(RAMP.GRASS, 2))).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_UI + 2).setVisible(false);
    this.meterZero = this.add.rectangle(this.meterX, this.meterBase, s(11), s(1), colorOf(px(RAMP.GOLD, 3))).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_UI + 3).setVisible(false);
    this.meterFill = this.add.rectangle(this.meterX, this.meterBase, s(7), this.meterH, colorOf(px(RAMP.PAPER, 3))).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_UI + 2).setVisible(false);
    this.meterMark = this.add.rectangle(this.meterX, this.meterBase, s(11), s(1), colorOf(px(RAMP.GOLD, 3))).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH_UI + 3).setVisible(false);
    this.meterNeedle = this.add.rectangle(this.meterX, this.meterBase, s(11), s(2), colorOf(px(RAMP.CYAN, 3))).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH_UI + 3).setVisible(false);

    // ---- behind-the-player POV (press V to switch): an AUTHORED down-the-fairway
    // backdrop + the back-view golfer, with the diorama demoted to a corner
    // minimap. Same sim — only the view differs.
    this.behindBg = this.add.image(W / 2, H / 2, 'links_fairway').setScrollFactor(0).setDepth(-2).setVisible(false);
    {
      const src = this.textures.get('links_fairway').getSourceImage() as { width: number; height: number };
      this.behindBg.setScale(Math.max(W / src.width, H / src.height)); // cover the screen
    }
    // the back-view golfer (single authored pose), scaled to ~95 design px tall
    this.behindGolfer = this.add.image(0, 0, 'links_golfer_back').setOrigin(0.5, 1).setScrollFactor(0).setDepth(32).setVisible(false);
    {
      const gsrc = this.textures.get('links_golfer_back').getSourceImage() as { width: number; height: number };
      this.behindGolfer.setScale(s(95) / Math.max(1, gsrc.height));
    }
    this.minimapFrame = this.add.graphics().setScrollFactor(0).setDepth(-1).setVisible(false);
    this.minimapBall = this.add.circle(0, 0, s(3), paper).setStrokeStyle(s(1), ink, 0.85).setScrollFactor(0).setDepth(1).setVisible(false);
    this.vKey = this.input.keyboard?.addKey('V');
    this.add.bitmapText(W - s(6), H - s(6), 'retro', 'V: VIEW', s(5)).setOrigin(1, 1).setScrollFactor(0).setDepth(DEPTH_UI + 1).setTint(paper).setAlpha(0.55);

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
    if (this.vKey && Phaser.Input.Keyboard.JustDown(this.vKey)) this.toggleView();

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
    [this.golfer, this.ballSpr, this.shadow, this.aimLine, this.aimDot, this.meterFill, this.meterWin, this.meterZero, this.meterMark, this.meterNeedle].forEach((o) => o.setVisible(false));
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
    // ---- THE 3-TAP METER (S14b honest read; only the rail geometry moved) ----
    const inMeter = sim.phase === 'power' || sim.phase === 'acc';
    this.meterFill.setVisible(inMeter);
    this.meterWin.setVisible(inMeter);
    this.meterZero.setVisible(inMeter);
    this.meterMark.setVisible(sim.phase === 'acc');
    this.meterNeedle.setVisible(sim.phase === 'acc');
    if (inMeter) {
      const Hm = this.meterH; // meter travel (runtime px) — matches the quad heights
      const base = this.meterBase;
      // the fill: live needle height while charging; HOLDS at the captured
      // power through the accuracy phase (dimmed) — nothing ever drains
      const fillFrac = (sim.phase === 'power' ? Math.max(0, sim.meterT) : sim.power) / GOLF.POWER_CAP;
      this.meterFill.setScale(1, Math.max(0.02, fillFrac));
      this.meterFill.setFillStyle(colorOf(px(RAMP.PAPER, sim.phase === 'power' ? 3 : 1)));
      // the PURE band hugs the base: [0 .. accWindow], where the needle must
      // land (tap 3); it shrinks with club × lie, honestly
      const win = Math.min(1, sim.accWindow() / GOLF.POWER_CAP);
      this.meterWin.setPosition(this.meterX, base);
      this.meterWin.setScale(1, Math.max(0.03, win));
      this.meterZero.setPosition(this.meterX, base);
      if (sim.phase === 'acc') {
        this.meterMark.setPosition(this.meterX, base - (sim.power / GOLF.POWER_CAP) * Hm);
        this.meterNeedle.setPosition(this.meterX, base - (Math.max(0, sim.meterT) / GOLF.POWER_CAP) * Hm);
      }
    }
  }

  /* ================= the two views ================= */

  /** TOP view: ball/golfer/aim positioned on the screen-filling diorama. */
  private renderTopActors(): void {
    const sim = this.sim;
    const p = this.proj;
    const ground = projectPoint(p, sim.ball.x, sim.ball.y);
    const lift = sim.ball.z * p.scale;
    const live = sim.phase !== 'holed';
    this.ballSpr.setPosition(ground.x, ground.y - lift);
    this.ballSpr.setScale(this.ballScale * (1 + Math.min(0.8, sim.ball.z / s(90))));
    this.ballSpr.setVisible(live);
    this.shadow.setVisible(live);
    this.shadow.setPosition(ground.x, ground.y);
    this.shadow.setScale(Math.max(0.45, 1 - sim.ball.z / s(140)));
    this.shadow.setAlpha(Math.max(0.1, 0.42 - sim.ball.z / s(260)));
    // the golfer stands at the ball and FREEZES at the strike spot through the
    // flight (the ball flies on alone, the golfer holds the follow-through)
    if (sim.phase === 'aim' || sim.phase === 'power' || sim.phase === 'acc') {
      this.golferAnchor = { x: sim.ball.x, y: sim.ball.y };
    }
    const face = Math.cos(sim.aim) < 0 ? -1 : 1;
    const gpos = projectPoint(p, this.golferAnchor.x, this.golferAnchor.y);
    // stand the golfer to the LEFT of the ball (ball down-the-line at the foot)
    this.golfer.setPosition(gpos.x - s(22) * face, gpos.y + s(3));
    this.golfer.setTexture(this.golferKey, this.golferFrame());
    this.golfer.setFlipX(face < 0);
    this.golfer.setVisible(true);
    const show = sim.phase === 'aim';
    this.aimLine.setVisible(show);
    this.aimDot.setVisible(show);
    if (show) {
      const tip = projectPoint(p, sim.ball.x + Math.cos(sim.aim) * s(48), sim.ball.y + Math.sin(sim.aim) * s(48));
      const dx = tip.x - ground.x;
      const dy = tip.y - ground.y;
      this.aimLine.setPosition(ground.x, ground.y);
      this.aimLine.setDisplaySize(Math.max(s(8), Math.hypot(dx, dy)), s(3)); // scale-based
      this.aimLine.setRotation(Math.atan2(dy, dx));
      this.aimDot.setPosition(tip.x, tip.y);
    }
  }

  /** Project a sim-space ground point into the behind-the-player perspective. */
  private behindXY(simX: number, simY: number): { x: number; y: number; along: number; scale: number } {
    const W = this.scale.width;
    const H = this.scale.height;
    // tuned to the authored fairway photo: the ball starts at the tee (footY)
    // and travels up to the green/flag drawn ~45% down the backdrop
    const footY = H * 0.86;
    const greenY = H * 0.45;
    const cx = W / 2;
    const hole = this.holes[this.holeIdx];
    const tx = s(hole.tee.x);
    const ty = s(hole.tee.y);
    const hx = s(hole.pin.x) - tx;
    const hy = s(hole.pin.y) - ty;
    const len = Math.hypot(hx, hy) || 1;
    const ux = hx / len;
    const uy = hy / len;
    const dx = simX - tx;
    const dy = simY - ty;
    const along = Math.max(0, Math.min(1.04, (dx * ux + dy * uy) / len));
    const lateral = dx * -uy + dy * ux; // signed perpendicular (sim px)
    const persp = 1 - 0.62 * along;
    const x = cx + lateral * 0.55 * persp;
    const y = footY - (footY - greenY) * Math.pow(along, 0.62);
    const scale = 1.5 + (0.3 - 1.5) * along; // near (big) → far (small)
    return { x, y, along, scale };
  }

  /** BEHIND view: the ball arcs and shrinks into the distance, the golfer plays
   *  it in the foreground, the diorama rides in the corner minimap. */
  private renderBehindActors(): void {
    const sim = this.sim;
    const H = this.scale.height;
    const live = sim.phase !== 'holed';
    const g = this.behindXY(sim.ball.x, sim.ball.y);
    const zPx = sim.ball.z * 0.5 * (1 - 0.35 * g.along);
    this.ballSpr.setVisible(live);
    this.ballSpr.setPosition(g.x, g.y - zPx);
    this.ballSpr.setScale(this.ballScale * g.scale * (1 + Math.min(0.4, sim.ball.z / s(160))));
    this.shadow.setVisible(live);
    this.shadow.setPosition(g.x, g.y);
    this.shadow.setScale(Math.max(0.35, g.scale * 0.8));
    this.shadow.setAlpha(0.4);
    // the back-view golfer stands at the tee in the foreground, facing up the
    // fairway (the sheet golfer is top-view only). A single authored pose for now.
    this.golfer.setVisible(false);
    this.behindGolfer.setVisible(true);
    this.behindGolfer.setPosition(this.scale.width / 2 - s(18), H * 0.92);
    // aim reticle: where the shot is pointed, out on the fairway
    const show = sim.phase === 'aim';
    this.aimLine.setVisible(false);
    this.aimDot.setVisible(show);
    if (show) {
      const hole = this.holes[this.holeIdx];
      const len = Math.hypot(s(hole.pin.x) - s(hole.tee.x), s(hole.pin.y) - s(hole.tee.y));
      const a = this.behindXY(sim.ball.x + Math.cos(sim.aim) * len * 0.55, sim.ball.y + Math.sin(sim.aim) * len * 0.55);
      this.aimDot.setPosition(a.x, a.y);
    }
    // the corner-minimap dot
    const mb = projectPoint(this.projMini, sim.ball.x, sim.ball.y);
    this.minimapBall.setVisible(true);
    this.minimapBall.setPosition(mb.x, mb.y);
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
