/**
 * BattleScene — first-person EB layout (GAME_BIBLE Prompt 12/13/14):
 * enemy sprites on an animated psychedelic background, PARTY CARDS along the
 * bottom — each hero's box carries a living 32×32 BATTLE BUST (S11) that
 * breathes, lunges, casts with a Vibe glow, prays, fiddles, munches, guards,
 * flinches, sweats through mortal rolls, slumps into its §A4.7 angel, and
 * cheers — plus the ROLLING ODOMETER HP/PP drums (Prompt 13, the soul),
 * speed-ordered rounds, data-driven enemy AI, the Titanic Tick's visible
 * latch tether severed by salt or Vibe Fire, the full §A4.8 status set
 * rendered ON the cards, every ability resolving a named FX timeline from
 * battle/fxRegistry.ts, victory EXP/level-ups, defeat, and run-away.
 *
 * HARD LAWS (S11): the cards never cover or delay the odometer — every fx
 * layer sits below DEPTH_UI and the drums tick in update() regardless of
 * choreography; and ALL choreography fast-forwards under held A/B at the
 * text typewriter's exact ×4 (ADR-010) — one skip state, applied to dt.
 *
 * S15c (ADR-043): victory's "jumped to level N!" and "realized X!" lines
 * ride printWait() — each WAITS for a fresh A/B press (held keys are
 * ignored until released, the inverted ADR-024 latch). BOT IMPACT: any
 * recipe that levels up must key('KeyZ') once per level line or the
 * victory flow stalls at the gold ▼; blind pumping no longer drains it.
 *
 * ── QA RECIPE — the S11 gauntlet (ADR-008 driver, pump(n, 8.33) one-frame
 * taps; release all keys between chunks, settle fades before pressing).
 * Ran 2026-06-11, logged in docs/QA.md. Driver lore this scene earned:
 * a physical pad feeding INPUT trumps any script — mute it for scripted runs
 * (save navigator.getGamepads, swap in () => [], restore after); launch
 * battles directly over a paused overworld (the startBattle shape):
 *   ow.scene.pause(); ow.scene.launch('battle', { enemyIds: ['titanic_tick'],
 *     advantage: 'none', guestChad: false, glintAssist: false, boss: true });
 *   game.events.once('mf-battle-end', o => ow.scene.resume());
 * and when a leg needs ONE hero's menu deterministically, field a solo party
 * — menu ambiguity is the flakiest part of any battle script.
 * 1. Fresh save → overworld. Bench via console:
 *      mfGS.data.party = [mfMakeHero('rex', 9, mfGS.data.heroNames.rex)];
 *      mfGS.data.party[0].bag = ['cracked_bat','corn_dog','star_cola','salt_shaker','glints_spark'];
 *      mfGS.data.party[0].equip = { weapon: 'cracked_bat' };
 *      ['faye','milo','dorin'].forEach(id => mfGS.data.party.push(mfMakeHero(id, 9, mfGS.data.heroNames[id])));
 *    (L9 keeps Ch.1 enemies standing; an L20 bench one-shots the whole roster.)
 * 2. `mfBattle.qa()` exposes { heroes, enemies, fx, forcePray } — set statuses
 *    directly to exercise every tick (heroes[i].status.crying = 3, .asleep,
 *    .paralyzed, .hushed, .sunburn; enemies[i].asleep = 2 …), keep a boss
 *    standing with enemies[0].hp = 4000, and sample any registry timeline
 *    visually via qa().fx.play(key, { targets: [{x, y}] }).
 * 3. Every ability class: Bash (+ SMAAASH via guts), Vibe damage/heal/status,
 *    Gadgets (solo-Milo: Down→Gadgets→Spy / →Bottle Rocket), Pray
 *    (qa().forcePray(tier) pins the roll), Goods (food/cola/salt/spark),
 *    Defend, Run.
 * 4. Latch leg: bench three (hero.down = true, odoHp.set(0)) so the Tick
 *    latches the leader — tether visible — then Goods → Salt Shaker severs it.
 * 5. Mortal-roll save-by-victory: odoHp.damage(999) on an ally at the menu,
 *    nervous loop runs while the drum races, win before it lands — the drum
 *    freezes mid-roll (§A4.1; verified frozen at 41 HP, down = false).
 * 6. Full wipe: qa().heroes.forEach(h=>h.odoHp.damage(999)) → every card
 *    slumps → fades → per-hero angel floats over it → defeat flow.
 * 7. Held KeyZ through victory text + any timeline: everything compresses ×4
 *    with zero dropped beats (events fire in order — fx.test.ts proves it).
 *
 * ── S11b extension (THE BATTLE STAGE — ran 2026-06-11, shots .shots/s11b_*):
 * 8. Bench with the full §A8 stage kit equipped (Jay cracked_bat, Mia
 *    hand_me_down_pan, Milo pellet_popper, Dorin cedar_beads) — Bash with
 *    each: the battler steps up (card empties — BustView away), back-swings
 *    looking up at the bird, swings, returns. Rifles aim → crack → recoil.
 *    Re-equip mid-battle via hero.equip + qa().refreshLook(i).
 * 9. One ability of every family ON STAGE: cast (Comet/Surge — arms raised
 *    under the glow), aim (Spy/Hypno/Magnet), throw (rockets, Goods→salt),
 *    pray (the kneel holds through the answered event); food/cola stay
 *    on-card. STAGE_ANIM beside FX_REGISTRY is the map.
 * 10. The combo: pin Math.random low for the smash, guts 320 for cap 8,
 *    then KeyZ + pump(64) and 7 one-frame KeyZ taps at pump(1) gaps —
 *    "x8 — N damage!" in ONE line, ring timer drains under the target.
 *    Slow taps must expire the window honestly (x4 observed at pump(6)).
 * 11. Wear: qa() drums to 49%/20% — busts swap scuffed/battered sheets
 *    (DISPLAYED value keys the tier), <33% idles become the WINDED heave;
 *    enemies swap on hp (qa().enemies[i].hp) — the Tick DEFLATES at w2.
 * 12. Shield → the picker: candidate lifts under the gold pulse, others
 *    dim, "> name" tag rides the hand, B backs out; confirm → six panels
 *    fly in from the corners + lock; the cyan hex PIP holds on the card.
 * 13. After any defends/shields: qa().fx.rings/bolts must drain to 0 —
 *    the timeline drain folds in event-born inners (the S11b fix).
 */
import Phaser from 'phaser';
import { ENEMIES, introLine, type EnemyDef, type EnemyMove } from '../data/enemies';
import { ABILITIES, rollPray, PRAY_TEXT, type AbilityDef, type PrayTier } from '../data/abilities';
import { ITEMS } from '../data/items';
import { BATTLE_TEXT, DIALOGUE } from '../data/dialogue';
import { BOSS_SCRIPTS } from '../data/bosses';
import { AWAKENINGS } from '../data/awakenings';
import { GS, expForLevel, type HeroState } from '../engine/state';
import { statsAtLevel, maxHpAtLevel, maxPpAtLevel, unlockedAbilities, availableAbilities, HEROES } from '../data/heroes';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Odometer } from '../battle/odometer';
import { BattleFx, type FxTarget } from '../battle/fx';
import { BustView } from '../battle/bust';
import { StageView } from '../battle/stage';
import { itemFxKey, stagePoseOf } from '../battle/fxRegistry';
import { PhaseRunner, pickRiddle, type DamageClass } from '../battle/phases';
import { battlerSheetKey, bustSheetKey, type BattlerLook, type WearTier } from '../spritegen/battlers';
import { ensureBattleArt } from '../spritegen';
import { wearSpriteKey } from '../spritegen/enemies';
import { weaponClassOf, swingSfxOf } from '../spritegen/weapons';
import { itemIconKey } from '../spritegen/icons';
import {
  physicalDamage,
  smashChance,
  smashDamage,
  vibeDamage,
  vibeHeal,
  applyWeakness,
  gutsSurvive,
  runChance,
  expShare,
  heroOffense,
  heroDefense,
  heroSpeed,
  heroGuts,
  contractHomesick,
  homesickSkips,
  cryingMisses,
  paralyzedSkips,
  asleepWakes,
  magnetSiphon,
  wearTier,
  comboCap,
  comboTotal,
  COMBO_WINDOW_MS,
  sunnyMul,
} from '../battle/formulas';
import { Dialogue, makeWindow, makeBox, everyFrame, DEPTH_UI, vars, textSpeedMul } from '../ui/windows';
import { colorOf, rgbOf, RAMP, px } from '../palette';
import { ODO_CELL_W, ODO_CELL_H } from '../spritegen/ui';

interface BattleConfig {
  enemyIds: string[];
  advantage: 'player' | 'enemy' | 'none';
  guestChad: boolean;
  glintAssist: boolean;
  boss: boolean;
  /** S2: the Manager fight teaches Mia's first Pray with a one-time hint */
  prayTutorial?: boolean;
}

interface EnemyUnit {
  def: EnemyDef;
  letter: string;
  hp: number;
  spr: Phaser.GameObjects.Image;
  alive: boolean;
  /** §A4.8 on the enemy side (S11): hypno / flash / brainjam land here */
  asleep: number;
  crying: number;
  hushed: number;
  /** S11b wear tier currently displayed — swap-on-change, never redraw */
  wear: WearTier;
  /** S14 §A7 Ch.2 mechanics: the Gilded Beetle's gold form (physical-immune
   *  turns), the Step-Mask's cast Shield (halves physical), and the
   *  Pickpocket Parrot's pending-cash hoard (recovered on its defeat) */
  gilded: number;
  shield: number;
  stolenCash: number;
  /** S14 phase machine: this unit was summoned mid-battle (bothSummonsDead) */
  summoned: boolean;
}

/** §A4.8 hero-side conditions — turns remaining (0 = clear) */
interface HeroStatus {
  sunburn: number;
  /** the Smilers' §A7 "productive" debuff (offense down) */
  productive: number;
  crying: number;
  asleep: number;
  paralyzed: number;
  hushed: number;
  shield: number;
  mirror: number;
}

const NO_HERO_STATUS = (): HeroStatus => ({
  sunburn: 0,
  productive: 0,
  crying: 0,
  asleep: 0,
  paralyzed: 0,
  hushed: 0,
  shield: 0,
  mirror: 0,
});

interface HeroUnit {
  hero: HeroState;
  odoHp: Odometer;
  odoPp: Odometer;
  box: Phaser.GameObjects.NineSlice;
  bust: BustView;
  defending: boolean;
  status: HeroStatus;
  latched: boolean;
  /** S11b: what this hero is wearing — battler + bust sheets key off it */
  look: BattlerLook;
  /** wear tier currently on the card (keyed on the DISPLAYED drum value) */
  wear: WearTier;
}

class OdoDisplay {
  private strips: Phaser.GameObjects.Image[] = [];
  private slotY: number;
  constructor(scene: Phaser.Scene, x: number, y: number, places: number) {
    this.slotY = y;
    const g = scene.add.graphics().setScrollFactor(0);
    for (let i = 0; i < places; i++) {
      g.fillStyle(0xffffff).fillRect(x + i * (ODO_CELL_W + 1), y, ODO_CELL_W, ODO_CELL_H);
    }
    g.setVisible(false);
    const mask = g.createGeometryMask();
    for (let i = 0; i < places; i++) {
      const img = scene.add
        .image(x + i * (ODO_CELL_W + 1), y, 'odo')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 2);
      img.setMask(mask);
      this.strips.push(img);
    }
  }
  setValue(v: number): void {
    const places = this.strips.length;
    for (let i = 0; i < places; i++) {
      const p = Math.pow(10, places - 1 - i);
      let pos: number;
      if (p === 1) {
        pos = v % 10;
      } else {
        // mechanical carry: this wheel turns ONLY while every lower wheel
        // rolls through …9→0 — i.e. across the final unit before p, never
        // smeared from x90 (94 at rest parked the hundreds strip mid-cell)
        const lower = v % p;
        pos = (Math.floor(v / p) % 10) + Math.max(0, lower - (p - 1));
      }
      this.strips[i].y = this.slotY - pos * ODO_CELL_H;
    }
  }
  setTint(color: number): void {
    this.strips.forEach((s) => s.setTint(color));
  }
  clearTint(): void {
    this.strips.forEach((s) => s.clearTint());
  }
  destroy(): void {
    this.strips.forEach((s) => s.destroy());
    this.strips = [];
  }
}

const PLASMA_FRAG = `
precision mediump float;
uniform float time;
uniform vec2 resolution;
uniform vec3 colA;
uniform vec3 colB;
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float t = time * 0.55;
  float v = sin(uv.x*7.0 + t) + sin(uv.y*5.0 - t*1.3)
          + sin((uv.x+uv.y)*6.0 + t*0.7) + sin(length(uv-0.5)*14.0 - t*1.1);
  v = v*0.25 + 0.5;
  float band = floor(v*7.0)/7.0;
  vec3 col = mix(colA, colB, band);
  gl_FragColor = vec4(col, 1.0);
}`;

/** display labels for the §A4.8 hero conditions Strange pray can roll */
const HERO_STATUS_POOL = ['sunburn', 'crying', 'asleep', 'paralyzed', 'hushed'] as const;
type HeroStatusName = (typeof HERO_STATUS_POOL)[number];
const STATUS_LANDED: Record<HeroStatusName, string> = {
  sunburn: 'feels weirdly sun-kissed. At night. (SUNBURN)',
  crying: 'welled up out of nowhere! (CRYING)',
  asleep: 'dozed right off! (ASLEEP)',
  paralyzed: 'went stiff as a flagpole! (PARALYZED)',
  hushed: 'opened their mouth and nothing came out. (HUSHED)',
};

export class BattleScene extends Phaser.Scene {
  private cfg!: BattleConfig;
  private enemies: EnemyUnit[] = [];
  private heroes: HeroUnit[] = [];
  private chad: {
    hp: Odometer;
    box: Phaser.GameObjects.NineSlice | null;
    texts: Phaser.GameObjects.BitmapText[];
    fled: boolean;
  } | null = null;
  private dlg!: Dialogue;
  private fx!: BattleFx;
  private stage!: StageView;
  private textObj!: Phaser.GameObjects.BitmapText;
  private odoDisplays: Array<{ d: OdoDisplay; o: Odometer }> = [];
  private chadOdo: OdoDisplay | null = null;
  private ended = false;
  private won = false;
  private tickAcc = 0;
  private prayHintShown = false;
  /** dev harness: pins the next Pray roll (qa().forcePray) */
  private prayPin: PrayTier | null = null;
  /** S14: the declarative boss phase machine (null = unscripted fight) */
  private phase: PhaseRunner | null = null;
  /** §A4.5 SUNNY SIDE — sampled once at create; the counter burns at finish */
  private sunny = 1;
  private letterAt = 0;

  constructor() {
    super('battle');
  }

  init(data: BattleConfig): void {
    this.cfg = data;
    this.enemies = [];
    this.heroes = [];
    this.odoDisplays = [];
    this.chad = null;
    this.chadOdo = null;
    this.ended = false;
    this.won = false;
    this.prayHintShown = false;
    this.prayPin = null;
    this.phase = null;
    this.sunny = 1;
    this.letterAt = 0;
  }

  create(): void {
    this.dlg = new Dialogue(this);
    this.fx = new BattleFx(this);
    this.stage = new StageView(this);
    // §A4.5: the picnic buff reads once per battle; the counter burns at finish
    this.sunny = sunnyMul((f) => GS.flag(f));
    this.buildBackground();
    this.buildEnemies();
    this.buildPhaseMachine();
    this.buildParty();
    this.buildTextWindow();
    if (this.sunny > 1) this.buildSunIcon();
    AUDIO.playMusic(this.cfg.boss ? 'boss' : 'battle');
    this.cameras.main.fadeIn(250, 0, 0, 0);
    // ADR-008 harness handle — the S11 gauntlet pokes statuses through this
    if (import.meta.env.DEV) {
      (window as unknown as { mfBattle?: BattleScene }).mfBattle = this;
    }
    void this.run();
  }

  /** S14: a scripted boss gets its PhaseRunner — effects bound to this scene */
  private buildPhaseMachine(): void {
    const bossUnit = this.enemies.find((e) => BOSS_SCRIPTS[e.def.id]);
    if (!bossUnit) return;
    const script = BOSS_SCRIPTS[bossUnit.def.id];
    this.phase = new PhaseRunner(script, {
      scriptLine: async (id) => {
        for (const page of DIALOGUE[id] ?? []) await this.print(vars(page));
      },
      setForm: async (form) => {
        await this.fx.play('phase_swap', { targets: [this.foeTarget(bossUnit)] });
        bossUnit.spr.setTexture(wearSpriteKey(this.phase?.spriteFor(bossUnit.def.sprite) ?? bossUnit.def.sprite, bossUnit.wear));
        if (form.line) {
          for (const page of DIALOGUE[form.line] ?? []) await this.print(vars(page));
        }
        // ADR-035: a form's first appearance can BE the chapter's awakening
        const due = this.phase?.awakeningDue();
        if (due) await this.battleAwakening(due);
      },
      summon: (enemyId, n) => this.summonUnits(bossUnit, enemyId, n),
      healSelf: async (amount) => {
        bossUnit.hp = Math.min(bossUnit.def.hp, bossUnit.hp + amount);
        this.fx.popup(bossUnit.spr.x, bossUnit.spr.y - bossUnit.spr.height / 2 - 2, `+${amount}`, RAMP.GRASS);
        AUDIO.sfx('heal');
        await this.print(`${amount} HP came BACK. That's the wrong direction!`);
      },
      stealEquipped: async () => {
        const marks = this.aliveHeroes().filter((h) => Object.keys(h.hero.equip).length > 0);
        if (marks.length === 0) return;
        const mark = marks[Math.floor(Math.random() * marks.length)];
        const slots = Object.keys(mark.hero.equip) as Array<keyof typeof mark.hero.equip>;
        const slot = slots[Math.floor(Math.random() * slots.length)];
        const itemId = mark.hero.equip[slot];
        if (!itemId) return;
        GS.unequip(mark.hero.id, slot);
        GS.removeItem(itemId, mark.hero.id);
        this.phase?.stolen.push({ heroId: mark.hero.id, itemId });
        await this.print(`${mark.hero.name}'s ${ITEMS[itemId]?.name ?? itemId} was STOLEN!!`);
      },
      returnStolen: () => this.returnStolenGear(),
      endBattleMercy: async () => {
        if (this.ended) return;
        await this.print(BATTLE_TEXT.mercy_end);
        await this.victory();
      },
      partyStatus: async (status, turns) => {
        for (const h of this.aliveHeroes()) h.status[status] = turns;
        await this.print(BATTLE_TEXT.party_status_crying);
      },
    });
    // the initial form's texture (the Grin opens SOLID GOLD)
    bossUnit.spr.setTexture(wearSpriteKey(this.phase.spriteFor(bossUnit.def.sprite), 0));
  }

  /** Hoaxula's hostages come home (and victory() calls this too) */
  private async returnStolenGear(): Promise<void> {
    if (!this.phase) return;
    for (const s of this.phase.stolen) {
      const heroId = s.heroId as HeroState['id'];
      const ok = GS.addItem(s.itemId, heroId) || GS.addItem(s.itemId);
      if (ok) await this.print(`The ${ITEMS[s.itemId]?.name ?? s.itemId} came back!`);
    }
    this.phase.stolen = [];
  }

  /** S14: phase-machine summons — new units flash in beside the boss */
  private async summonUnits(boss: EnemyUnit, enemyId: string, n: number): Promise<void> {
    const def = ENEMIES[enemyId];
    if (!def) return;
    await this.fx.play('summon_flash', { targets: [this.foeTarget(boss)] });
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < n; i++) {
      const side = this.enemies.filter((e) => e.summoned).length % 2 === 0 ? -1 : 1;
      const x = boss.spr.x + side * (62 + 14 * Math.floor(i / 2));
      const y = def.boss ? 97 : 92;
      const spr = this.add.image(x, y, def.sprite).setOrigin(0.5, 0.5);
      this.tweens.add({ targets: spr, y: y - 3, duration: 1100 + i * 130, yoyo: true, repeat: -1, ease: 'sine.inout' });
      this.enemies.push({
        def,
        letter: letters[this.letterAt++ % letters.length],
        hp: def.hp,
        spr,
        alive: true,
        asleep: 0,
        crying: 0,
        hushed: 0,
        wear: 0,
        gilded: 0,
        shield: 0,
        stolenCash: 0,
        summoned: true,
      });
    }
    await this.print(`${def.article} ${def.name}${n > 1 ? ` and ${n - 1} more` : ''} answered the call!`);
  }

  /**
   * S14/ADR-035 — a MID-BATTLE awakening (Ch.2's emotional center: Mia's
   * Freeze at the HOLLOW reveal). Same shape as OverworldScene.awakeningBeat:
   * flash, the §A11 pages, the flag, the jingle — staged sincere, §A11.2.
   */
  private async battleAwakening(id: string): Promise<void> {
    const a = AWAKENINGS[id];
    if (!a || GS.flag(a.flag) === true) return;
    const owner = this.heroes.find((h) => h.hero.id === a.hero);
    if (!owner) return; // the moment keeps until the hero is here to have it
    this.cameras.main.flash(420, 248, 232, 160);
    AUDIO.sfx('pray');
    if (!owner.hero.down) owner.bust.poseFor('castA', 1200);
    for (const page of DIALOGUE[a.dialogue] ?? []) await this.print(vars(page));
    GS.setFlag(a.flag);
    AUDIO.jingle('levelup', 1400, null);
    await this.print(vars(a.toast));
  }

  /** §A4.5: the sun icon by the party strip while SUNNY SIDE holds */
  private buildSunIcon(): void {
    const n = Number(GS.flag('sunny_side')) || 0;
    const x = 14;
    const y = 152;
    this.add.image(x, y, 'sun_icon').setScrollFactor(0).setDepth(DEPTH_UI + 1);
    this.add
      .bitmapText(x + 8, y - 4, 'retro', `x${n}`, 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
  }

  /** dev-only QA seam (the scene-header recipe drives the gauntlet with it) */
  qa(): {
    heroes: HeroUnit[];
    enemies: EnemyUnit[];
    fx: BattleFx;
    stage: StageView;
    forcePray: (tier: PrayTier) => void;
    refreshLook: (i: number) => void;
  } {
    return {
      heroes: this.heroes,
      enemies: this.enemies,
      fx: this.fx,
      stage: this.stage,
      forcePray: (tier) => (this.prayPin = tier),
      // S11b gauntlet: re-equip via hero.equip, then refresh the sheets
      refreshLook: (i) => {
        const h = this.heroes[i];
        h.look = { weapon: h.hero.equip.weapon ?? null, body: h.hero.equip.body ?? null };
        ensureBattleArt(this, h.hero.id, h.look);
        h.bust.setSheet(bustSheetKey(h.hero.id, h.look.body, h.wear));
      },
    };
  }

  /** the acting hero's battler sheet for their current look + wear tier */
  private battlerSheet(h: HeroUnit): string {
    return battlerSheetKey(h.hero.id, h.look, h.wear);
  }

  /** S11b: below 33% displayed HP the idle heaves (wear tier 2) */
  private isWinded(h: HeroUnit): boolean {
    return h.wear === 2;
  }

  /** send a hero up onto the stage (bust goes 'away' while they're out).
   *  `standoff` keeps casters at casting distance — only the Bash and the
   *  thrown-item lob walk to arm's reach (S12b: a point-blank cast read as
   *  a melee hit; the magic travels, the caster doesn't). */
  private async stageEnter(h: HeroUnit, aimX: number, standoff = 12): Promise<void> {
    h.bust.setAway(true);
    const card = h.bust.point();
    await this.stage.enter(this.battlerSheet(h), { x: card.x, y: card.y + 14 }, aimX, this.isWinded(h), standoff);
  }

  /** walk back to the card and hand the pose back to the bust */
  private async stageReturn(h: HeroUnit): Promise<void> {
    await this.stage.exit();
    h.bust.setAway(false);
  }

  private buildBackground(): void {
    const first = ENEMIES[this.cfg.enemyIds[0]];
    const [ra, rb] = first.bg;
    if (this.game.renderer.type === Phaser.WEBGL) {
      const [ar, ag, ab] = rgbOf(px(ra, 1));
      const [br, bg, bb] = rgbOf(px(rb, 0));
      const base = new Phaser.Display.BaseShader('mf-plasma', PLASMA_FRAG, undefined, {
        colA: { type: '3f', value: { x: ar, y: ag, z: ab } },
        colB: { type: '3f', value: { x: br, y: bg, z: bb } },
      });
      this.add.shader(base, this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height);
    } else {
      const r = this.add
        .rectangle(0, 0, this.scale.width, this.scale.height, colorOf(px(ra, 1)))
        .setOrigin(0);
      // pure cosmetic pulse — the one place a tween is still allowed (ADR-024)
      this.tweens.add({ targets: r, alpha: { from: 1, to: 0.7 }, duration: 1400, yoyo: true, repeat: -1 });
    }
  }

  private buildEnemies(): void {
    const ids = this.cfg.enemyIds;
    // S14: Banana Bunch United attacks 5×22 (§A7 Ch.2) — the letter row
    // grows to seat the whole union
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const dupes = new Map<string, number>();
    ids.forEach((id) => dupes.set(id, (dupes.get(id) ?? 0) + 1));
    ids.forEach((id, i) => {
      const def = ENEMIES[id];
      const x = (this.scale.width / (ids.length + 1)) * (i + 1);
      // bosses sit lower so their crown clears the text window (S7: the
      // Tick's lit dome top is the read — don't hide it behind the intro)
      const y = def.boss ? 97 : 92;
      const spr = this.add.image(x, y, def.sprite).setOrigin(0.5, 0.5);
      // idle float — cosmetic only; battle sprites float, never stand (ADR-020)
      this.tweens.add({
        targets: spr,
        y: y - 3,
        duration: 1100 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inout',
      });
      const letter = (dupes.get(id) ?? 0) > 1 ? letters[this.letterAt++ % letters.length] : '';
      this.enemies.push({
        def,
        letter,
        hp: def.hp,
        spr,
        alive: true,
        asleep: 0,
        crying: 0,
        hushed: 0,
        wear: 0,
        gilded: 0,
        shield: 0,
        stolenCash: 0,
        summoned: false,
      });
    });
  }

  private buildParty(): void {
    const party = GS.aliveParty();
    const slots = party.length + (this.cfg.guestChad ? 1 : 0);
    // four cards must clear a 400px screen; busts keep their pane either way
    const boxW = slots >= 4 ? 92 : 96;
    const totalW = slots * (boxW + 6) - 6;
    let bx = (this.scale.width - totalW) / 2;
    const ink0 = colorOf(px(RAMP.INK, 0));
    const ink1 = colorOf(px(RAMP.INK, 1));
    for (const hero of party) {
      const box = makeBox(this, bx, 168, boxW, 50);
      // the MOTHER read: name centered under the bust, HP/PP rows below
      const name = this.add
        .bitmapText(bx + boxW / 2, 173, 'retro', hero.name, 6)
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(ink0);
      const hpLabel = this.add
        .bitmapText(bx + 10, 185, 'retro', 'HP', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(ink1);
      const ppLabel = this.add
        .bitmapText(bx + 10, 200, 'retro', 'PP', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(ink1);
      const odoHp = new Odometer(hero.hp, hero.maxHp);
      const odoPp = new Odometer(hero.pp, hero.maxPp);
      // drums sit beside their labels — and NEVER move or hide (the law)
      const dHp = new OdoDisplay(this, bx + 46, 184, 3);
      const dPp = new OdoDisplay(this, bx + 46, 199, 2);
      dHp.setValue(hero.hp);
      dPp.setValue(hero.pp);
      this.odoDisplays.push({ d: dHp, o: odoHp }, { d: dPp, o: odoPp });
      // S11b: the hero's LOOK — equipped weapon + body gear — drives which
      // battler/bust sheets this battle uses; the factory caches by key
      const look: BattlerLook = { weapon: hero.equip.weapon ?? null, body: hero.equip.body ?? null };
      ensureBattleArt(this, hero.id, look);
      const wear = wearTier(hero.hp, hero.maxHp);
      const bust = new BustView(
        this,
        hero.id,
        bx,
        168,
        boxW,
        [box, name, hpLabel, ppLabel],
        bustSheetKey(hero.id, look.body, wear),
      );
      this.heroes.push({
        hero,
        odoHp,
        odoPp,
        box,
        bust,
        defending: false,
        status: NO_HERO_STATUS(),
        latched: false,
        look,
        wear,
      });
      bx += boxW + 6;
    }
    if (this.cfg.guestChad) {
      const box = makeBox(this, bx, 168, boxW, 50);
      const t1 = this.add
        .bitmapText(bx + 8, 173, 'retro', 'Chad', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(ink0);
      const t2 = this.add
        .bitmapText(bx + 8, 186, 'retro', 'HP', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(ink1);
      const hp = new Odometer(35, 35);
      this.chadOdo = new OdoDisplay(this, bx + 28, 185, 3);
      this.chadOdo.setValue(35);
      this.chad = { hp, box, texts: [t1, t2], fled: false };
    }
  }

  private buildTextWindow(): void {
    makeWindow(this, 6, 6, 268, 56);
    this.textObj = this.add
      .bitmapText(16, 14, 'retro', '', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(248);
  }

  /* ---------------- text + fx helpers ---------------- */

  private print(raw: string): Promise<void> {
    const text = raw;
    return new Promise((resolve) => {
      this.textObj.setText('');
      let i = 0;
      let acc = 0;
      let lingerMs = 420; // the finished line stays up; holding A/B burns it 4x
      // per-frame + dt-scaled (ADR-024): same pace on every display
      const off = everyFrame(this, (dt) => {
        const fast = INPUT.held('A') || INPUT.held('B');
        acc += (fast ? 4 : 1.8 * textSpeedMul()) * (dt / 16);
        while (acc >= 1 && i < text.length) {
          acc -= 1;
          i++;
        }
        this.textObj.setText(text.slice(0, i));
        if (i % 4 === 0 && i < text.length) AUDIO.sfx('text');
        if (i >= text.length) {
          lingerMs -= dt * (fast ? 4 : 1);
          if (lingerMs <= 0) {
            off();
            resolve();
          }
        }
      });
    });
  }

  /**
   * S15c: print, then HOLD the line until a fresh A/B press. Level-ups are
   * acknowledged one by one (user law) — a held fast-forward must not blow
   * through them, so the wait arms only after both buttons are seen up
   * (the ADR-024 latched-press class, inverted).
   */
  private async printWait(raw: string): Promise<void> {
    await this.print(raw);
    await new Promise<void>((resolve) => {
      const tip = this.add
        .bitmapText(258, 48, 'retro', '▼', 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.GOLD, 2)));
      const blink = this.time.addEvent({
        delay: 320,
        loop: true,
        callback: () => tip.setVisible(!tip.visible),
      });
      let armed = !INPUT.held('A') && !INPUT.held('B');
      const off = everyFrame(this, () => {
        if (!armed) {
          if (!INPUT.held('A') && !INPUT.held('B')) armed = true;
          return;
        }
        if (INPUT.justPressed('A') || INPUT.justPressed('B')) {
          AUDIO.sfx('confirm');
          off();
          blink.remove();
          tip.destroy();
          resolve();
        }
      });
    });
  }

  private fill(template: string, user: string, e?: EnemyUnit, t?: string): string {
    return template
      .replaceAll('{user}', user)
      .replaceAll('{e}', e ? `${e.def.article} ${e.def.name} ${e.letter}`.trimEnd() : '')
      .replaceAll('{t}', t ?? '');
  }

  private foeTarget(e: EnemyUnit): FxTarget {
    return { x: e.spr.x, y: e.spr.y, spr: e.spr };
  }

  private cardTarget(h: HeroUnit): FxTarget {
    return h.bust.point();
  }

  /** every heal glows on the card and resolves from the displayed value */
  private healHero(h: HeroUnit, amount: number): void {
    h.odoHp.heal(amount);
    void this.fx.play('heal_glow', { targets: [this.cardTarget(h)] });
  }

  /* ---------------- main flow ---------------- */

  private async run(): Promise<void> {
    await this.print(introLine(this.cfg.enemyIds));
    if (this.cfg.advantage === 'player') await this.print('You caught it off guard! You move first!');
    if (this.cfg.advantage === 'enemy') await this.print('It snuck up on you!');

    // S14 (Prompt 15): a scripted boss may OPEN ON A RIDDLE — the N-way
    // choice on the existing ask widget, pool-driven; consequences are
    // phase actions (§A6 Ch.4 — built now, the Sphinx consumes it later)
    const riddle = this.phase?.def.riddle;
    if (riddle && this.phase) {
      for (const page of DIALOGUE[riddle.intro] ?? []) await this.print(vars(page));
      const r = pickRiddle(riddle.pool, Math.floor(Math.random() * riddle.pool.length));
      await this.print(r.q);
      const pick = await this.dlg.ask(r.options);
      await this.phase.onRiddleAnswered(pick === r.correct);
      if (this.ended) return;
    }

    if (this.cfg.advantage === 'enemy') await this.enemyPhase();

    while (!this.ended) {
      // ----- player commands
      for (const h of this.heroes) {
        if (this.ended) break;
        if (h.odoHp.dead || h.hero.down) continue;
        h.defending = false;
        const acted = await this.heroTurn(h);
        if (!acted) break; // ran away
      }
      if (this.ended) return;
      // ----- chad "helps"
      await this.chadPhase();
      if (this.ended) return;
      // ----- enemies
      await this.enemyPhase();
      if (this.ended) return;
      // ----- glint assist
      if (this.cfg.glintAssist) await this.glintPhase();
      if (this.ended) return;
      // ----- end-of-round status ticks
      await this.statusPhase();
      if (this.ended) return;
    }
  }

  /** pre-command condition gate, then the command menu */
  private async heroTurn(h: HeroUnit): Promise<boolean> {
    const name = h.hero.name;
    // §A4.4 (S4): a Homesick Jay may spend the turn daydreaming
    if (h.hero.id === 'rex' && GS.flag('rex_homesick') === true && homesickSkips(Math.random)) {
      AUDIO.sfx('cancel');
      await this.print(vars(this.fill(BATTLE_TEXT.homesick_skip, name)));
      return true;
    }
    // §A4.8 (S11): sleep holds the turn unless they stir; a hit always wakes
    if (h.status.asleep > 0) {
      if (asleepWakes(Math.random)) {
        h.status.asleep = 0;
        await this.print(this.fill(BATTLE_TEXT.wake_up, name));
      } else {
        h.status.asleep--;
        await this.print(this.fill(BATTLE_TEXT.asleep_skip, name));
        return true;
      }
    }
    if (h.status.paralyzed > 0 && paralyzedSkips(Math.random)) {
      AUDIO.sfx('cancel');
      await this.print(this.fill(BATTLE_TEXT.paralyzed_skip, name));
      return true;
    }
    return this.heroCommand(h);
  }

  private async heroCommand(h: HeroUnit): Promise<boolean> {
    const name = h.hero.name;
    const all = unlockedAbilities(h.hero.id, h.hero.level);
    // Prompt 12: the command row is per-hero — Pray surfaces for whoever has
    // it, Milo's gadget kit replaces the Vibe he never had (§A3)
    const hasPray = all.includes('pray');
    const hasVibe = HEROES[h.hero.id].unlocks.some((u) => ABILITIES[u.ability]?.kind === 'vibe');
    const hasGadgets = all.some((id) => ABILITIES[id]?.kind === 'gadget' && id !== 'repair');
    if (hasPray && this.cfg.prayTutorial && !this.prayHintShown) {
      this.prayHintShown = true;
      await this.print(this.fill(BATTLE_TEXT.pray_hint, name));
    }
    for (;;) {
      const options = ['Bash'];
      if (hasVibe) options.push('Vibe');
      if (hasGadgets) options.push('Gadgets');
      if (hasPray) options.push('Pray');
      options.push('Goods', 'Defend');
      if (!this.cfg.boss) options.push('Run');
      const pick = await this.dlg.ask(options);
      if (options[pick] === 'Pray') {
        await this.prayAction(h);
        return true;
      }
      if (options[pick] === 'Bash') {
        const target = await this.pickEnemy();
        if (!target) continue;
        await this.heroBash(h, target);
        return true;
      }
      if (options[pick] === 'Vibe') {
        const ok = await this.heroVibe(h);
        if (ok) return true;
        continue;
      }
      if (options[pick] === 'Gadgets') {
        const ok = await this.heroGadgets(h);
        if (ok) return true;
        continue;
      }
      if (options[pick] === 'Goods') {
        const ok = await this.heroGoods(h);
        if (ok) return true;
        continue;
      }
      if (options[pick] === 'Defend') {
        h.defending = true;
        await this.fx.play('guard_brace', { targets: [this.cardTarget(h)] });
        await this.print(this.fill(BATTLE_TEXT.guard, name));
        return true;
      }
      if (options[pick] === 'Run') {
        const maxSpd = Math.max(...this.enemies.filter((e) => e.alive).map((e) => e.def.speed));
        if (Math.random() < runChance(Math.round(heroSpeed(h.hero) * this.sunny), maxSpd)) {
          await this.print(BATTLE_TEXT.run_ok);
          this.finish('ran');
          return false;
        }
        await this.print(BATTLE_TEXT.run_fail);
        return true;
      }
    }
  }

  private pickEnemy(): Promise<EnemyUnit | null> {
    const alive = this.enemies.filter((e) => e.alive);
    if (alive.length === 1) return Promise.resolve(alive[0]);
    return new Promise((resolve) => {
      let sel = 0;
      const hand = this.add
        .image(alive[0].spr.x, alive[0].spr.y - alive[0].spr.height / 2 - 8, 'hand')
        .setDepth(DEPTH_UI + 3)
        .setAngle(90);
      const zones = alive.map((e, i) => {
        e.spr.setInteractive();
        const onTap = (): void => {
          sel = i;
          done(e);
        };
        e.spr.on('pointerdown', onTap);
        return { e, onTap };
      });
      const off = everyFrame(this, () => {
        const d = INPUT.dir();
        if (d.x !== 0 && this.navOk()) {
          sel = (sel + (d.x > 0 ? 1 : alive.length - 1)) % alive.length;
          AUDIO.sfx('cursor');
        }
        hand.setPosition(alive[sel].spr.x, alive[sel].spr.y - alive[sel].spr.height / 2 - 8);
        if (INPUT.justPressed('A')) done(alive[sel]);
        if (INPUT.justPressed('B')) done(null);
      });
      const done = (e: EnemyUnit | null): void => {
        AUDIO.sfx(e ? 'confirm' : 'cancel');
        off();
        hand.destroy();
        zones.forEach((z) => z.e.spr.off('pointerdown', z.onTap));
        resolve(e);
      };
    });
  }

  /**
   * Ally targeting over the party cards — S11b: the picker is unmistakable.
   * The candidate card LIFTS 2px under a gold frame pulse with its bust
   * brightened, every other card dims, and a "> {name}" tag rides the hand.
   * B backs out; everyFrame polling + tap zones intact (ADR-024).
   */
  private pickAlly(pool: HeroUnit[]): Promise<HeroUnit | null> {
    if (pool.length === 0) return Promise.resolve(null);
    if (pool.length === 1) return Promise.resolve(pool[0]);
    return new Promise((resolve) => {
      let sel = 0;
      let pulseT = 0;
      const gold3 = colorOf(px(RAMP.GOLD, 3));
      const gold2 = colorOf(px(RAMP.GOLD, 2));
      const dimTint = colorOf(px(RAMP.NIGHT, 3));
      const at = (i: number): { x: number; y: number } => {
        const p = pool[i].bust.point();
        return { x: p.x + 12, y: p.y - 28 };
      };
      const hand = this.add.image(at(0).x, at(0).y, 'hand').setDepth(DEPTH_UI + 3).setAngle(90).setScrollFactor(0);
      const tag = this.add
        .bitmapText(0, 0, 'retro', '', 6)
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 3)
        .setTint(gold3);
      const zones = pool.map((h, i) => {
        const p = h.bust.point();
        const z = this.add
          .zone(p.x - 18, p.y - 24, 96, 50)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 3)
          .setInteractive();
        z.on('pointerdown', () => {
          sel = i;
          done(pool[i]);
        });
        return z;
      });
      const off = everyFrame(this, (dt) => {
        pulseT += dt;
        const d = INPUT.dir();
        if (d.x !== 0 && this.navOk()) {
          sel = (sel + (d.x > 0 ? 1 : pool.length - 1)) % pool.length;
          AUDIO.sfx('cursor');
        }
        // the spotlight: candidate lifts + glows, everyone else steps back
        for (const x of this.heroes) {
          const isSel = x === pool[sel];
          x.bust.lift(isSel);
          x.bust.dim(!isSel);
          if (isSel) x.box.setTint(pulseT % 460 < 230 ? gold3 : gold2);
          else if (x.hero.down) x.box.setTint(0x888890);
          else x.box.setTint(dimTint);
        }
        hand.setPosition(at(sel).x, at(sel).y);
        tag.setText(`> ${pool[sel].hero.name}`).setPosition(at(sel).x + 8, at(sel).y);
        if (INPUT.justPressed('A')) done(pool[sel]);
        if (INPUT.justPressed('B')) done(null);
      });
      const done = (h: HeroUnit | null): void => {
        AUDIO.sfx(h ? 'confirm' : 'cancel');
        off();
        hand.destroy();
        tag.destroy();
        zones.forEach((z) => z.destroy());
        // cards settle back down; the fallen keep their gray
        for (const x of this.heroes) {
          x.bust.lift(false);
          x.bust.dim(false);
          if (x.hero.down) x.box.setTint(0x888890);
          else x.box.clearTint();
        }
        resolve(h);
      };
    });
  }

  private navAt = 0;
  private navOk(): boolean {
    if (this.time.now > this.navAt) {
      this.navAt = this.time.now + 190;
      return true;
    }
    return false;
  }

  /* ---------------- Bash — the caster takes the stage (S11b) ---------------- */

  private async heroBash(h: HeroUnit, target: EnemyUnit): Promise<void> {
    const name = h.hero.name;
    // Crying: can't aim (§A4.8) — the swing never makes it off the card
    if (h.status.crying > 0 && cryingMisses(Math.random)) {
      h.bust.poseFor('lunge', 520);
      await this.print(this.fill(BATTLE_TEXT.bash, name));
      await this.print(this.fill(BATTLE_TEXT.crying_miss, name));
      return;
    }
    const cls = weaponClassOf(h.hero.equip.weapon ?? null);
    const smashed = Math.random() < smashChance(this.heroGutsS(h));
    // announce while walking (the combo assembles its own one-liner instead)
    const announce = smashed ? null : this.print(this.fill(BATTLE_TEXT.bash, name));
    await this.stageEnter(h, target.spr.x);
    // the wind-up: rifles shoulder and sight; everyone else swings back,
    // looking UP at the bird (the MOTHER framing)
    await this.stage.strike(cls === 'rifle' ? 'aim' : 'backswing', cls === 'rifle' ? 500 : 440);
    const strikeDone = this.stage.strike(cls === 'rifle' ? 'recoil' : 'swing', 280, swingSfxOf(cls));
    if (!smashed) {
      const dmg = physicalDamage(this.heroOffense(h), target.def.defense, Math.random);
      await Promise.all([strikeDone, this.fx.play('impact_physical', { targets: [this.foeTarget(target)] })]);
      await announce;
      await this.damageEnemy(target, dmg);
      await this.stageReturn(h);
      return;
    }
    // SMAAAASH — the huge green banner slams in, and the Mother-3 combo
    // window opens: edge-triggered A presses land follow-up swings
    const smash = smashDamage(this.heroOffense(h), target.def.defense, Math.random);
    void this.fx.play('smash_burst', { targets: [this.foeTarget(target)] });
    void this.fx.smashBanner(BATTLE_TEXT.smaaash);
    await strikeDone;
    const hits = await this.comboWindow(h, target, cls);
    const total = comboTotal(smash, hits);
    const line =
      hits > 1
        ? `${this.fill(BATTLE_TEXT.bash, name)} ${BATTLE_TEXT.smaaash} x${hits} — ${total} damage!`
        : `${this.fill(BATTLE_TEXT.bash, name)} ${BATTLE_TEXT.smaaash} ${total} damage!`;
    await this.damageEnemy(target, total, false, line);
    await this.stageReturn(h);
  }

  /**
   * The Mother-3 mash (S11b): ~1.1s after the smash lands, every EDGE-
   * triggered A press re-swings the battler for 25% of the smash — held A
   * still means fast-forward (ADR-010 untouched; the window itself
   * compresses with the same skip state). Deterministic: presses in, hits
   * out, no dice (ADR-029). Capped at 3 + Guts/40 total hits, max 8.
   * Resolves with the TOTAL hit count (the opening smash is hit 1).
   */
  private comboWindow(h: HeroUnit, target: EnemyUnit, cls: ReturnType<typeof weaponClassOf>): Promise<number> {
    const cap = comboCap(this.heroGutsS(h));
    if (cap <= 1) return Promise.resolve(1);
    return new Promise((resolve) => {
      let hits = 1;
      let left = COMBO_WINDOW_MS;
      // the ring timer drains under the target, at fx depth
      const ring = this.fx.comboRing(
        target.spr.x,
        target.spr.y + target.spr.height / 2 + 5,
        () => left / COMBO_WINDOW_MS,
      );
      const off = everyFrame(this, (dt) => {
        const fast = INPUT.held('A') || INPUT.held('B');
        left -= Math.min(dt, 50) * (fast ? 4 : 1);
        ring.tick();
        if (INPUT.justPressed('A') && hits < cap) {
          hits++;
          AUDIO.sfx(`combo_${hits}`); // the rising pitch ladder
          void this.stage.strike(cls === 'rifle' ? 'recoil' : 'swing', 150);
          this.fx.burst(target.spr.x, target.spr.y, RAMP.GRASS, 7, 55, 320);
          this.fx.popup(target.spr.x, target.spr.y - target.spr.height / 2 - 10, `${hits} HITS!`, RAMP.GRASS);
        }
        if (left <= 0 || hits >= cap) {
          ring.done();
          off();
          resolve(hits);
        }
      });
    });
  }

  /** S3: each hero swings THEIR equipped weapon (was: first weapon in the
   *  shared bag, applied to everyone). S14: ×SUNNY SIDE (§A4.5). */
  private heroOffense(h: HeroUnit): number {
    const base = Math.round(heroOffense(h.hero) * this.sunny);
    // feeling PRODUCTIVE: your heart isn't in the swing (§A7 Smiler debuff)
    return h.status.productive > 0 ? Math.max(1, Math.floor(base * 0.75)) : base;
  }

  /** §A4.5: every battle stat read multiplies through the picnic seam */
  private heroGutsS(h: HeroUnit): number {
    return Math.round(heroGuts(h.hero) * this.sunny);
  }

  private heroVibeS(h: HeroUnit): number {
    return Math.round(h.hero.stats.vibe * this.sunny);
  }

  /* ---------------- Vibe ---------------- */

  private async heroVibe(h: HeroUnit): Promise<boolean> {
    const name = h.hero.name;
    // HUSHED: silenced — no Vibe (§A4.8)
    if (h.status.hushed > 0) {
      AUDIO.sfx('cancel');
      await this.print(this.fill(BATTLE_TEXT.hushed_no_vibe, name));
      return false;
    }
    // S12b (ADR-035): availability = level unlocks ∪ story AWAKENINGS —
    // before the crater, Jay searches and the old light isn't his yet
    const ids = availableAbilities(h.hero.id, h.hero.level, (f) => GS.flag(f) === true).filter((id) => {
      const a = ABILITIES[id];
      // pray lives on the command row, not in the Vibe list (Prompt 12);
      // teleport is an overworld run-up, not a battle cast
      return a && a.kind === 'vibe' && a.id !== 'teleport_a';
    });
    if (ids.length === 0) {
      await this.print(`${name} searched for the old light... not yet.`);
      return false;
    }
    const labels = ids.map((id) => `${ABILITIES[id].name}  ${ABILITIES[id].pp}pp`);
    const pick = await this.dlg.ask([...labels, 'Back'], { cancelIndex: labels.length });
    if (pick >= labels.length) return false;
    const ab = ABILITIES[ids[pick]];
    if (h.odoPp.target < ab.pp) {
      await this.print('Not enough PP!');
      return false;
    }
    const done = await this.castAbility(h, ab);
    return done;
  }

  /** Milo's command (§A3: Spy, Bottle Rockets — Repair works overnight) */
  private async heroGadgets(h: HeroUnit): Promise<boolean> {
    const ids = availableAbilities(h.hero.id, h.hero.level, (f) => GS.flag(f) === true).filter(
      (id) => ABILITIES[id]?.kind === 'gadget' && id !== 'repair',
    );
    if (ids.length === 0) return false;
    const labels = ids.map((id) => ABILITIES[id].name);
    const pick = await this.dlg.ask([...labels, 'Back'], { cancelIndex: labels.length });
    if (pick >= labels.length) return false;
    return this.castAbility(h, ABILITIES[ids[pick]]);
  }

  /**
   * One choreography path for every ability: resolve targets (cancel = no
   * cost), pay PP, strike the caster pose, play the registry timeline (skip-
   * aware), then resolve mechanics with prints. Every command is visibly
   * performed by the caster's card and answered on its targets.
   */
  private async castAbility(h: HeroUnit, ab: AbilityDef): Promise<boolean> {
    const name = h.hero.name;
    const standing = this.aliveHeroes();

    // ---- resolve targets first (B backs out costless)
    let foeTargets: EnemyUnit[] = [];
    let allyTargets: HeroUnit[] = [];
    if (ab.status === 'revive') {
      const fallen = this.heroes.filter((x) => x.hero.down || x.odoHp.dead);
      if (fallen.length === 0) {
        await this.print(BATTLE_TEXT.no_fallen);
        return false;
      }
      const t = await this.pickAlly(fallen);
      if (!t) return false;
      allyTargets = [t];
    } else if (ab.target === 'enemy') {
      const t = await this.pickEnemy();
      if (!t) return false;
      foeTargets = [t];
    } else if (ab.target === 'enemies') {
      foeTargets = this.enemies.filter((e) => e.alive);
    } else if (ab.target === 'ally') {
      const t = await this.pickAlly(standing);
      if (!t) return false;
      allyTargets = [t];
    } else if (ab.target === 'allies') {
      allyTargets = standing;
    } else {
      allyTargets = [h];
    }

    // ---- pay, take the stage, announce (S11b: presentation keys off fx —
    // STAGE_ANIM maps the ability's family to its choreography)
    if (ab.pp > 0) h.odoPp.damage(ab.pp);
    const pose = stagePoseOf(ab.fx);
    const onStage = pose === 'cast' || pose === 'aim' || pose === 'throw' || pose === 'pray';
    if (onStage) {
      const aimX = foeTargets.length > 0 ? foeTargets[0].spr.x : this.scale.width / 2;
      // casts/aims/prayers keep CASTING DISTANCE (a point-blank psychic
      // reads as a bash — the S12b user catch); throws lob from range too
      await this.stageEnter(h, aimX, 72);
      if (pose === 'throw') await this.stage.strike('throwA', 300);
      else this.stage.hold(pose);
    } else {
      h.bust.poseFor(ab.kind === 'gadget' ? 'gadget' : 'castA', 700);
    }
    await this.print(this.fill(ab.text, name));
    if (onStage && pose === 'throw') void this.stage.strike('throwB', 380);
    if (!onStage && ab.kind !== 'gadget') h.bust.poseFor('castB', 900);

    const ctx = {
      // fx originate from wherever the caster actually stands (the rockets
      // launch off the stage actor's hands, not the card)
      caster: onStage ? this.stage.point() : this.cardTarget(h),
      targets: foeTargets.length > 0 ? foeTargets.map((e) => this.foeTarget(e)) : allyTargets.map((a) => this.cardTarget(a)),
    };
    try {

    // ---- heals
    if (ab.heal) {
      await this.fx.play(ab.fx, ctx);
      for (const t of allyTargets) {
        const amount = vibeHeal(ab.power, this.heroVibeS(h), Math.random);
        this.healHero(t, amount);
        AUDIO.sfx('heal');
        await this.print(`${t.hero.name} recovered about ${amount} HP!`);
      }
      return true;
    }

    // ---- status families
    switch (ab.status) {
      case 'shield':
      case 'mirror': {
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          if (ab.status === 'shield') t.status.shield = 4;
          else t.status.mirror = 3;
          await this.print(`${t.hero.name} got wrapped in shimmer!`);
        }
        return true;
      }
      case 'cure': {
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          const had =
            t.status.sunburn + t.status.crying + t.status.asleep + t.status.paralyzed + t.status.hushed > 0;
          t.status.sunburn = 0;
          t.status.crying = 0;
          t.status.asleep = 0;
          t.status.paralyzed = 0;
          t.status.hushed = 0;
          await this.print(this.fill(had ? BATTLE_TEXT.cure_clean : BATTLE_TEXT.cure_nothing, name, undefined, t.hero.name));
        }
        return true;
      }
      case 'revive': {
        await this.fx.play(ab.fx, ctx);
        const t = allyTargets[0];
        t.hero.down = false;
        t.odoHp.set(Math.max(1, Math.floor(t.hero.maxHp / 2)));
        t.box.clearTint();
        t.bust.revive();
        AUDIO.sfx('heal');
        await this.print(this.fill(BATTLE_TEXT.revive_word, name, undefined, t.hero.name));
        return true;
      }
      case 'asleep': {
        await this.fx.play(ab.fx, ctx);
        for (const e of foeTargets) {
          e.asleep = 2 + (Math.random() < 0.5 ? 1 : 0);
          await this.print(this.fill('{e} drifted off mid-thought!', name, e));
        }
        return true;
      }
      case 'crying': {
        await this.fx.play(ab.fx, ctx);
        for (const e of foeTargets) {
          if (Math.random() < 0.7) {
            e.crying = 3;
            await this.print(this.fill('{e} burst into tears!', name, e));
          } else {
            await this.print(this.fill('{e} blinked it away!', name, e));
          }
        }
        return true;
      }
      case 'hushed': {
        await this.fx.play(ab.fx, ctx);
        for (const e of foeTargets) {
          e.hushed = 3;
          await this.print(this.fill('{e} forgot every word it knew!', name, e));
        }
        return true;
      }
      case 'pp_drain': {
        await this.fx.play(ab.fx, { caster: ctx.caster, targets: foeTargets.map((e) => this.foeTarget(e)) });
        const sip = magnetSiphon(Math.random);
        h.odoPp.heal(sip);
        await this.print(this.fill(BATTLE_TEXT.magnet_sip, name, foeTargets[0], String(sip)));
        return true;
      }
    }

    // ---- Spy: the revealed-stats stamp (§A3 — HP + weakness)
    if (ab.id === 'spy') {
      const e = foeTargets[0];
      await this.fx.play(ab.fx, ctx);
      await this.print(this.fill(BATTLE_TEXT.spy_report, name, e, String(e.hp)));
      if (e.def.weakness.length > 0) {
        await this.print(this.fill(BATTLE_TEXT.spy_weak, name, e, e.def.weakness.join(', ')));
      } else {
        await this.print(this.fill(BATTLE_TEXT.spy_no_weak, name, e));
      }
      return true;
    }

    // ---- damage (vibe lines + bottle rockets)
    await this.fx.play(ab.fx, ctx);
    for (const t of foeTargets) {
      if (!t.alive) continue;
      const weak =
        (ab.element === 'fire' && t.def.weakness.includes('fire')) ||
        (ab.element === 'freeze' && t.def.weakness.includes('freeze')) ||
        (ab.element === 'volt' && t.def.weakness.includes('volt'));
      // gadgets are machines: flat power, no Vibe scaling, defense pierced
      const raw =
        ab.kind === 'gadget'
          ? Math.max(1, Math.round(ab.power * (0.9 + Math.random() * 0.2)))
          : vibeDamage(ab.power, this.heroVibeS(h), Math.random);
      const dmg = applyWeakness(raw, weak);
      // Vibe Fire burns the Tick's latch away (§A6 Boss 1) — and so does
      // the OLD LIGHT (S12b/ADR-035, §A6 amended): the crater awakening is
      // the diegetic tutorial for the fight that follows it
      if ((ab.element === 'fire' || ab.id.startsWith('vibe_surge')) && t.def.boss) this.breakLatch();
      // S14: the element may CRACK a scripted form — Vibe Freeze finds the
      // seams in SOLID GOLD, and bats land while it's brittle (§A6 Ch.2;
      // the fight teaches it the turn Mia awakens it)
      if (t.def.boss && this.phase && ab.element !== 'none' && this.phase.crackBy(ab.element)) {
        await this.print(BATTLE_TEXT.gold_crack);
      }
      await this.damageEnemy(t, dmg, weak, undefined, ab.kind === 'gadget' ? 'physical' : 'vibe');
    }
    return true;
    } finally {
      // however the cast resolved, the caster walks back to their card
      if (onStage) await this.stageReturn(h);
    }
  }

  /* ---------------- Pray (§A3 — six distinct events) ---------------- */

  private async prayAction(h: HeroUnit): Promise<void> {
    // S11b: she kneels ON the stage, hands together — §A11.4, played straight
    await this.stageEnter(h, this.scale.width / 2);
    this.stage.hold('pray');
    const at = (): FxTarget => this.stage.point();
    await this.fx.play('pray', { caster: at() });
    await this.print(this.fill(ABILITIES.pray.text, h.hero.name));
    const tier = this.prayPin ?? rollPray(h.hero.level, this.heroGutsS(h), Math.random);
    this.prayPin = null;
    await this.print(this.fill(PRAY_TEXT[tier], h.hero.name));
    const aliveE = this.enemies.filter((e) => e.alive);
    // grace reaches the standing; revival stays with hospitals & rare items (§A4.7)
    const standing = this.aliveHeroes();
    switch (tier) {
      case 'miraculous': {
        await this.fx.play('pray_miraculous', { caster: at(), targets: aliveE.map((e) => this.foeTarget(e)) });
        standing.forEach((x) => {
          x.odoHp.heal(x.hero.maxHp);
          x.odoPp.heal(x.hero.maxPp);
          void this.fx.play('heal_glow', { targets: [this.cardTarget(x)] });
        });
        for (const e of aliveE) await this.damageEnemy(e, 120 + Math.floor(Math.random() * 40), false, undefined, 'pray');
        break;
      }
      case 'wonderful': {
        const hurt = standing.some((x) => x.odoHp.value < x.hero.maxHp * 0.5);
        if (hurt) {
          await this.fx.play('pray_wonderful', { caster: at(), targets: standing.map((x) => this.cardTarget(x)) });
          standing.forEach((x) => this.healHero(x, Math.floor(x.hero.maxHp * 0.6)));
          AUDIO.sfx('heal');
        } else {
          await this.fx.play('pray_wonderful', { caster: at(), targets: aliveE.map((e) => this.foeTarget(e)) });
          for (const e of aliveE) await this.damageEnemy(e, 60 + Math.floor(Math.random() * 30), false, undefined, 'pray');
        }
        break;
      }
      case 'good': {
        await this.fx.play('pray_good', { caster: at(), targets: standing.map((x) => this.cardTarget(x)) });
        standing.forEach((x) => this.healHero(x, 30));
        AUDIO.sfx('heal');
        break;
      }
      case 'nothing':
        // §A11.4: hopeful even on Nothing — one mote still tries
        await this.fx.play('pray_nothing', { caster: at() });
        break;
      case 'strange': {
        // a random status effect on a random combatant — INCLUDING allies
        const side = Math.random() < 0.5 && aliveE.length > 0 ? 'enemy' : 'hero';
        if (side === 'enemy') {
          const e = aliveE[Math.floor(Math.random() * aliveE.length)];
          await this.fx.play('pray_strange', { caster: at(), targets: [this.foeTarget(e)] });
          const roll = ['asleep', 'crying', 'hushed'][Math.floor(Math.random() * 3)] as 'asleep' | 'crying' | 'hushed';
          e[roll] = 3;
          await this.print(this.fill(`{e} caught something STRANGE out of the light!`, h.hero.name, e));
        } else {
          const v = standing[Math.floor(Math.random() * standing.length)];
          await this.fx.play('pray_strange', { caster: at(), targets: [this.cardTarget(v)] });
          const roll = HERO_STATUS_POOL[Math.floor(Math.random() * HERO_STATUS_POOL.length)];
          v.status[roll] = roll === 'sunburn' ? 4 : 3;
          await this.print(`${v.hero.name} ${STATUS_LANDED[roll]}`);
        }
        break;
      }
      case 'backfire': {
        // §A3: party takes small damage OR one ally dozes off — the soft
        // flare picks its own victim
        await this.fx.play('pray_backfire', { caster: at(), targets: standing.map((x) => this.cardTarget(x)) });
        if (Math.random() < 0.5) {
          standing.forEach((x) => x.odoHp.damage(6));
          await this.print('Everyone saw spots for a second!');
        } else {
          const v = standing[Math.floor(Math.random() * standing.length)];
          v.status.asleep = 2;
          await this.print(`${v.hero.name} ${STATUS_LANDED.asleep}`);
        }
        break;
      }
    }
    // S14: a scripted boss HEARS the prayer — Hoaxula's mercy listens for
    // 'good' or better (the game's quietest victory, §A6 Ch.7)
    if (this.phase && !this.ended) await this.phase.onPrayTier(tier);
    // she rises and walks back to her card, whatever answered
    await this.stageReturn(h);
  }

  /* ---------------- Goods ---------------- */

  private async heroGoods(h: HeroUnit): Promise<boolean> {
    // S3: Goods is the acting hero's OWN 14-slot bag (Prompt 19)
    const usable = h.hero.bag.filter((id) => ITEMS[id]?.usableInBattle);
    if (usable.length === 0) {
      await this.print(`${h.hero.name}'s bag offers nothing but moral support.`);
      return false;
    }
    const names = usable.map((id) => ITEMS[id].name);
    const pick = await this.dlg.ask([...names, 'Back'], {
      cancelIndex: names.length,
      icons: [...usable.map((id) => itemIconKey(id)), undefined],
    });
    if (pick >= names.length) return false;
    const itemId = usable[pick];
    const item = ITEMS[itemId];
    const name = h.hero.name;
    const fxKey = itemFxKey(item.id, item.kind);
    if (item.kind === 'food' && item.heal) {
      GS.removeItem(itemId, h.hero.id);
      h.bust.poseFor('rummage', 360);
      await this.print(`${name} wolfed down the ${item.name}!`);
      h.bust.poseFor('munch', 700);
      if (fxKey) await this.fx.play(fxKey, { caster: this.cardTarget(h) });
      this.healHero(h, item.heal);
      AUDIO.sfx('heal');
      await this.print(`About ${item.heal} HP came back.`);
      return true;
    }
    // S4: the Star Cola line — PP rolls back up on the drum (§A8 "PP" items)
    if (item.ppHeal) {
      GS.removeItem(itemId, h.hero.id);
      h.bust.poseFor('rummage', 360);
      await this.print(`${name} chugged the ${item.name}!`);
      h.bust.poseFor('munch', 700);
      if (fxKey) await this.fx.play(fxKey, { caster: this.cardTarget(h) });
      h.odoPp.heal(item.ppHeal);
      AUDIO.sfx('heal');
      await this.print(`About ${item.ppHeal} PP fizzed back.`);
      return true;
    }
    if (item.id === 'glints_spark') {
      GS.removeItem(itemId, h.hero.id);
      h.bust.poseFor('castA', 700);
      // §A8: revive, rare — it goes to whoever needs it most
      const downed = this.heroes.find((x) => x.hero.down || x.odoHp.dead);
      const at = downed ? this.cardTarget(downed) : this.cardTarget(h);
      if (fxKey) await this.fx.play(fxKey, { caster: this.cardTarget(h), targets: [at] });
      if (downed) {
        downed.hero.down = false;
        downed.odoHp.set(downed.hero.maxHp);
        downed.box.clearTint();
        downed.bust.revive();
        await this.print(this.fill(BATTLE_TEXT.spark_revive, name, undefined, downed.hero.name));
      } else {
        this.healHero(h, h.hero.maxHp);
        await this.print('The spark flares — warm as a porch light in late summer. Full recovery!');
      }
      return true;
    }
    // S14 (§A10 #6): a status battle item — the CAMERA FLASH blinds the
    // whole room into Crying; `reusable` survives the click (it's a flash,
    // not film)
    if (item.kind === 'battle' && item.status) {
      if (!item.reusable) GS.removeItem(itemId, h.hero.id);
      h.bust.poseFor('lunge', 600);
      await this.print(`${name} raised the ${item.name} — say nothing!`);
      const room = this.enemies.filter((x) => x.alive);
      if (fxKey) {
        await this.fx.play(fxKey, { caster: this.cardTarget(h), targets: room.map((x) => this.foeTarget(x)) });
      }
      for (const t of room) {
        if (item.status === 'crying') {
          if (Math.random() < 0.7) {
            t.crying = 3;
            await this.print(this.fill('{e} burst into tears!', name, t));
          } else {
            await this.print(this.fill('{e} blinked it away!', name, t));
          }
        } else if (item.status === 'asleep') {
          t.asleep = 2;
          await this.print(this.fill('{e} drifted off mid-thought!', name, t));
        }
      }
      return true;
    }
    // S14 (§A8 cures): the Hanky dries Crying, the Aloe Leaf cools Sunburn —
    // battle-usable status cures aimed by the ally picker
    if (item.kind === 'cure' && item.cures && !item.cures.includes('down')) {
      const t = await this.pickAlly(this.aliveHeroes());
      if (!t) return false;
      GS.removeItem(itemId, h.hero.id);
      h.bust.poseFor('rummage', 360);
      if (fxKey) await this.fx.play(fxKey, { caster: this.cardTarget(h), targets: [this.cardTarget(t)] });
      let had = false;
      for (const c of item.cures) {
        if (c === 'sunburn' && t.status.sunburn > 0) {
          t.status.sunburn = 0;
          had = true;
        }
        if (c === 'crying' && t.status.crying > 0) {
          t.status.crying = 0;
          had = true;
        }
        if (c === 'paralyzed' && t.status.paralyzed > 0) {
          t.status.paralyzed = 0;
          had = true;
        }
        if (c === 'asleep' && t.status.asleep > 0) {
          t.status.asleep = 0;
          had = true;
        }
      }
      AUDIO.sfx('heal');
      await this.print(this.fill(had ? BATTLE_TEXT.cure_clean : BATTLE_TEXT.cure_nothing, name, undefined, t.hero.name));
      return true;
    }
    if (item.kind === 'battle' && item.power) {
      const target = await this.pickEnemy();
      if (!target) return false;
      GS.removeItem(itemId, h.hero.id);
      // S11b: battle items with a throw_arc family LOB from the stage —
      // from throwing range (S12b), the arc is the show
      const onStage = fxKey !== null && stagePoseOf(fxKey) === 'throw';
      if (onStage) {
        await this.stageEnter(h, target.spr.x, 72);
        await this.stage.strike('throwA', 300);
      } else {
        h.bust.poseFor('lunge', 600);
      }
      await this.print(`${name} threw the ${item.name}!`);
      if (onStage) void this.stage.strike('throwB', 380);
      const weak = target.def.weakness.includes('salt');
      // the thrown arc lands — and visibly snaps the Tick's latch (§A6)
      if (fxKey) {
        await this.fx.play(fxKey, {
          caster: onStage ? this.stage.point() : this.cardTarget(h),
          targets: [this.foeTarget(target)],
        });
      }
      if (item.breaksLatch && target.def.boss) {
        this.breakLatch();
        await this.print(BATTLE_TEXT.salt_break);
      }
      await this.damageEnemy(target, applyWeakness(item.power, weak), weak);
      if (onStage) await this.stageReturn(h);
      return true;
    }
    await this.print(item.text);
    return false;
  }

  private breakLatch(): void {
    this.heroes.forEach((h) => (h.latched = false));
    if (this.fx.tethered) this.fx.severTether();
  }

  /* ---------------- damage resolution ---------------- */

  /**
   * S14: every hit declares its CLASS — 'physical' (bats, thrown goods,
   * rockets), 'vibe' (the old light), or 'pray' (faith; always lands).
   * Scripted boss forms zero the class they're immune to (the Gilded
   * Grin's whole fight), and the Ch.2 street mechanics ride the same gate:
   * the Beetle's gold form shrugs physical, the Step-Mask's Shield halves it.
   */
  private async damageEnemy(e: EnemyUnit, dmg: number, weak = false, line?: string, cls: DamageClass = 'physical'): Promise<void> {
    // boss form immunities (the phase machine owns the math)
    if (e.def.boss && this.phase && this.phase.damageMul(cls) === 0) {
      AUDIO.sfx('cancel');
      await this.print(cls === 'physical' ? BATTLE_TEXT.gold_clang : BATTLE_TEXT.hollow_slide);
      return;
    }
    if (cls === 'physical' && e.gilded > 0) {
      AUDIO.sfx('cancel');
      await this.print(this.fill(BATTLE_TEXT.beetle_clang, '', e));
      return;
    }
    if (cls === 'physical' && e.shield > 0) dmg = Math.max(1, Math.floor(dmg / 2));
    e.hp = Math.max(0, e.hp - dmg);
    // floating damage popup (the S10 popFoe idiom) + the printed line —
    // a SMAAAASH combo hands in its one assembled EB line instead (S11b)
    this.fx.popup(e.spr.x, e.spr.y - e.spr.height / 2 - 2, `${dmg}`, weak ? RAMP.GOLD : RAMP.PAPER);
    await this.print(line ?? `${dmg} damage${weak ? ' — a sore spot!!' : '!'}`);
    if (e.asleep > 0 && e.hp > 0) {
      e.asleep = 0;
      await this.print(this.fill(BATTLE_TEXT.enemy_woke, '', e));
    }
    if (e.hp <= 0) {
      e.alive = false;
      // the Tick dies still latched? the tether goes with it
      if (e.def.boss && this.fx.tethered) this.breakLatch();
      await this.fx.play('enemy_dissolve', { targets: [this.foeTarget(e)] });
      await this.print(e.def.deathLine);
      // §A7 Ch.2: the Parrot drops everything it took (pending-cash theft)
      if (e.stolenCash > 0) {
        GS.data.cashOnHand += e.stolenCash;
        this.fx.popup(e.spr.x, e.spr.y - 24, `+$${e.stolenCash}`, RAMP.GOLD);
        AUDIO.sfx('confirm');
        await this.print(this.fill(BATTLE_TEXT.parrot_drop, '', e, `$${e.stolenCash}`));
        e.stolenCash = 0;
      }
      if (this.enemies.every((x) => !x.alive)) {
        await this.victory();
      } else if (e.summoned && this.phase && this.enemies.filter((x) => x.summoned).every((x) => !x.alive)) {
        // the phase machine hears every summons-wipe (the Mainframe refill)
        await this.phase.onAllSummonsDead();
      }
    } else {
      if (e.def.boss && this.phase) await this.phase.onHpFrac(e.hp / e.def.hp);
      if (e.def.boss && e.hp < 120 && this.chad && !this.chad.fled) {
        await this.chadFlees();
      }
    }
  }

  private async chadFlees(): Promise<void> {
    if (!this.chad) return;
    this.chad.fled = true;
    for (const line of DIALOGUE.chad_flee) await this.print(line);
    this.chad.box?.destroy();
    this.chad.texts.forEach((t) => t.destroy());
    this.chadOdo?.destroy();
    this.chadOdo = null;
    GS.data.guest = null;
    GS.setFlag('chad_gone');
  }

  private async chadPhase(): Promise<void> {
    if (!this.chad || this.chad.fled || this.chad.hp.dead) return;
    const target = this.enemies.find((e) => e.alive);
    if (!target) return;
    if (Math.random() < 0.55) {
      await this.print(BATTLE_TEXT.chad_poke);
      await this.fx.play('impact_physical', { targets: [this.foeTarget(target)] });
      await this.damageEnemy(target, 2 + Math.floor(Math.random() * 4));
    } else {
      await this.print(BATTLE_TEXT.chad_hide);
    }
  }

  private async glintPhase(): Promise<void> {
    const target = this.enemies.find((e) => e.alive);
    if (!target) return;
    // Glint's assist is his Spark's warmth aimed like a flashlight (§A8)
    await this.print(BATTLE_TEXT.glint_assist);
    await this.fx.play('item_spark', { targets: [this.foeTarget(target)] });
    await this.damageEnemy(target, 15 + Math.floor(Math.random() * 8));
  }

  private aliveHeroes(): HeroUnit[] {
    return this.heroes.filter((h) => !h.odoHp.dead && !h.hero.down);
  }

  /* ---------------- enemy phase ---------------- */

  private async enemyPhase(): Promise<void> {
    for (const e of this.enemies.slice()) {
      if (!e.alive || this.ended) continue;
      // §A4.8 on the enemy side: sleepers snooze through the round
      if (e.asleep > 0) {
        if (asleepWakes(Math.random)) {
          e.asleep = 0;
          await this.print(this.fill(BATTLE_TEXT.enemy_woke, '', e));
        } else {
          e.asleep--;
          await this.print(this.fill(BATTLE_TEXT.enemy_asleep, '', e));
          continue;
        }
      }
      // S14: a scripted boss consults its phase machine before acting —
      // turnCount phases fire here (telegraphs, swaps, summons, heals),
      // a stunned boss loses the turn, doubled speed acts twice
      let acts = 1;
      if (e.def.boss && this.phase) {
        const verdict = await this.phase.onBossTurnStart();
        if (this.ended) return;
        if (verdict === 'skip') {
          await this.print(this.fill(BATTLE_TEXT.boss_stunned, '', e));
          continue;
        }
        if (this.phase.speedMul >= 2) acts = 2;
      }
      for (let act = 0; act < acts && !this.ended && e.alive; act++) {
        await this.enemyAct(e);
      }
      if (this.ended) return;
    }
  }

  private async enemyAct(e: EnemyUnit): Promise<void> {
    {
      const move = this.pickMove(e);
      const targets = this.aliveHeroes();
      if (targets.length === 0) return;
      const latchedHero = this.heroes.find((h) => h.latched && !h.odoHp.dead);
      const target =
        move.kind === 'drain' && latchedHero ? latchedHero : targets[Math.floor(Math.random() * targets.length)];
      // enemy lunge — cosmetic
      this.tweens.add({ targets: e.spr, y: e.spr.y + 5, duration: 90, yoyo: true });
      await this.print(this.fill(move.text, '', e, target.hero.name));
      switch (move.kind) {
        case 'attack':
        case 'strong': {
          // Crying enemies can't aim either (§A4.8 — Flash α earns its PP)
          if (e.crying > 0 && cryingMisses(Math.random)) {
            await this.print(this.fill(BATTLE_TEXT.enemy_crying_miss, '', e));
            break;
          }
          // the move answers ON the card: impact burst + shake + flinch
          void this.fx.play('impact_physical', { targets: [this.cardTarget(target)] });
          this.cameras.main.shake(120, 0.006);
          // S10: defense reads through the 'body' slot (the Champion Jacket);
          // S14: and through the §A4.5 SUNNY SIDE seam
          let dmg = physicalDamage(e.def.offense * (move.mult ?? 1), Math.round(heroDefense(target.hero) * this.sunny), Math.random);
          if (target.defending) dmg = Math.max(1, Math.floor(dmg / 2));
          // Shield halves; Mirror halves AND throws some of it back (§A3)
          if (target.status.mirror > 0) {
            const back = Math.max(1, Math.floor(dmg / 4));
            dmg = Math.max(1, Math.floor(dmg / 2));
            this.applyHeroDamage(target, dmg);
            await this.print(`${target.hero.name} took ${dmg}!`);
            this.fx.popup(e.spr.x, e.spr.y - e.spr.height / 2 - 2, `${back}`, RAMP.CYAN);
            e.hp = Math.max(1, e.hp - back); // a reflection never lands the last hit
            await this.print(this.fill('{e} caught its own reflection! It lost {t} HP!', '', e, String(back)));
            break;
          }
          if (target.status.shield > 0) dmg = Math.max(1, Math.floor(dmg / 2));
          this.applyHeroDamage(target, dmg);
          await this.print(`${target.hero.name} took ${dmg}!`);
          break;
        }
        case 'latch': {
          target.latched = true;
          // the drain made visible: a throbbing tether, enemy → card (§A6)
          this.fx.attachTether(
            () => ({ x: e.spr.x, y: e.spr.y + 12 }),
            () => target.bust.point(),
          );
          await this.fx.play('latch_tether', { targets: [this.cardTarget(target)] });
          break;
        }
        case 'drain': {
          if (!latchedHero) {
            await this.print('...but found nothing to hold onto!');
            break;
          }
          const dmg = 10 + Math.floor(Math.random() * 6);
          this.applyHeroDamage(latchedHero, dmg);
          const sup = Math.floor(dmg / 2);
          e.hp = Math.min(e.def.hp, e.hp + sup);
          this.fx.popup(e.spr.x, e.spr.y - e.spr.height / 2 - 2, `+${sup}`, RAMP.GRASS);
          AUDIO.sfx('fx_latch');
          await this.print(BATTLE_TEXT.latch_drain);
          await this.print(`${latchedHero.hero.name} lost ${dmg} HP!`);
          break;
        }
        case 'status': {
          if (move.status === 'sunburn') target.status.sunburn = 4;
          if (move.status === 'crying') target.status.crying = 3;
          if (move.status === 'asleep') target.status.asleep = 2;
          if (move.status === 'paralyzed') target.status.paralyzed = 3; // §A7 Ch.2: the Jitterbug
          if (move.status === 'productive') {
            target.status.productive = 3;
            await this.print(`${target.hero.name} feels horribly PRODUCTIVE! Offense fell!`);
          }
          AUDIO.sfx('cancel');
          break;
        }
        case 'steal': {
          // S3: it rifles the TARGET's bag (bags are per-hero now)
          const foodIdx = target.hero.bag.findIndex((i) => ITEMS[i]?.kind === 'food');
          if (foodIdx >= 0) target.hero.bag.splice(foodIdx, 1);
          break;
        }
        case 'stealcash': {
          // §A7 Ch.2 — the Pickpocket Parrot's PENDING-CASH THEFT (S14):
          // the money leaves your pocket NOW and rides the bird; beating
          // it drops the hoard back (damageEnemy's death branch pays out).
          // Run away and the bird keeps every cent.
          const take = Math.min(GS.data.cashOnHand, 12 + Math.floor(Math.random() * 18));
          if (take <= 0) {
            await this.print(this.fill(BATTLE_TEXT.parrot_lint, '', e));
            break;
          }
          GS.data.cashOnHand -= take;
          e.stolenCash += take;
          AUDIO.sfx('cancel');
          this.fx.popup(e.spr.x, e.spr.y - e.spr.height / 2 - 2, `-$${take}`, RAMP.GOLD);
          await this.print(this.fill(BATTLE_TEXT.parrot_take, '', e, `$${take}`));
          break;
        }
        case 'gild': {
          // §A7 Ch.2 — the Gilded Beetle's GOLD FORM: physical-immune turns
          // (the boss lesson, taught small first)
          e.gilded = 3;
          e.spr.setTint(colorOf(px(RAMP.GOLD, 3)));
          AUDIO.sfx('fx_shield');
          break;
        }
        case 'shield': {
          // §A7 Ch.2 — the Step-Mask casts Shield on itself (halves physical)
          e.shield = 4;
          await this.fx.play('shield_snap', { targets: [this.foeTarget(e)] });
          break;
        }
        case 'taunt':
          break;
      }
      // chad can get clipped too
      if (this.chad && !this.chad.fled && move.kind === 'attack' && Math.random() < 0.25) {
        this.chad.hp.damage(4);
        await this.print('Chad caught a stray! He took it personally!');
      }
      await this.settleDeaths();
      if (this.ended) return;
    }
  }

  private pickMove(e: EnemyUnit): EnemyMove {
    const latchedAlready = this.heroes.some((h) => h.latched);
    let moves = e.def.moves.filter((m) => !(m.kind === 'latch' && latchedAlready));
    // HUSHED enemies lose their special vocabulary — plain swings only
    if (e.hushed > 0) {
      const plain = moves.filter((m) => m.kind === 'attack' || m.kind === 'taunt');
      if (plain.length > 0) moves = plain;
    }
    const total = moves.reduce((a, m) => a + m.weight, 0);
    let r = Math.random() * total;
    for (const m of moves) {
      r -= m.weight;
      if (r <= 0) return m;
    }
    return moves[0];
  }

  private applyHeroDamage(h: HeroUnit, dmg: number): void {
    // the hurt read: card shakes, bust recoils one frame
    h.bust.hit();
    AUDIO.sfx('hit');
    // a hit always wakes a sleeper (§A4.8)
    if (h.status.asleep > 0) {
      h.status.asleep = 0;
      void this.print(this.fill(BATTLE_TEXT.wake_up, h.hero.name));
    }
    const wouldDie = h.odoHp.target - dmg <= 0;
    if (wouldDie && gutsSurvive(this.heroGutsS(h), Math.random)) {
      h.odoHp.target = 1;
      h.odoHp.displayed = Math.max(1, h.odoHp.displayed - dmg * 0.5);
      void this.print(`${h.hero.name} hung on with sheer GUTS!`);
      return;
    }
    h.odoHp.damage(dmg);
  }

  /* ---------------- end-of-round ticks ---------------- */

  private async statusPhase(): Promise<void> {
    for (const h of this.heroes) {
      if (h.odoHp.dead || h.hero.down) continue;
      const s = h.status;
      if (s.sunburn > 0) {
        s.sunburn--;
        h.odoHp.damage(3);
        await this.print(`${h.hero.name} sizzles a little. (Sunburn)`);
      }
      if (s.crying > 0 && --s.crying === 0) await this.print(this.fill(BATTLE_TEXT.crying_dry, h.hero.name));
      if (s.paralyzed > 0 && --s.paralyzed === 0) await this.print(this.fill(BATTLE_TEXT.paralyzed_off, h.hero.name));
      if (s.hushed > 0 && --s.hushed === 0) await this.print(this.fill(BATTLE_TEXT.hushed_off, h.hero.name));
      if (s.shield > 0 && --s.shield === 0) await this.print(this.fill(BATTLE_TEXT.shield_off, h.hero.name));
      if (s.mirror > 0 && --s.mirror === 0) await this.print(this.fill(BATTLE_TEXT.shield_off, h.hero.name));
      if (s.productive > 0 && --s.productive === 0) {
        await this.print(`${h.hero.name} remembered it's summer. Offense is back!`);
      }
    }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.crying > 0) e.crying--;
      if (e.hushed > 0) e.hushed--;
      if (e.shield > 0) e.shield--;
      // §A7 Ch.2: the Beetle's gold form wears off — the tint goes with it
      if (e.gilded > 0 && --e.gilded === 0) {
        e.spr.clearTint();
        await this.print(this.fill(BATTLE_TEXT.beetle_dull, '', e));
      }
    }
    await this.settleDeaths();
  }

  /** wait a beat so mortal meters resolve or get rescued */
  private settleDeaths(): Promise<void> {
    return new Promise((resolve) => {
      const check = (): void => {
        if (this.ended) {
          resolve();
          return;
        }
        for (const h of this.heroes) {
          if (h.odoHp.dead && !h.hero.down) {
            h.hero.down = true;
            h.box.setTint(0x888890);
            // the card slumps, fades, and the hero's own angel floats up
            // beside it (§A4.7) — BustView walks the states from the flag
            void this.print(`${h.hero.name} is down!!`).then(() => {
              if (this.aliveHeroes().length === 0) {
                void this.defeat();
              }
            });
          }
        }
        resolve();
      };
      this.time.delayedCall(60, check);
    });
  }

  /* ---------------- outcomes ---------------- */

  private async victory(): Promise<void> {
    if (this.ended) return;
    this.ended = true;
    this.won = true; // every standing bust breaks into the cheer loop
    // §A4.1: victory freezes every drum where it stands
    this.heroes.forEach((h) => {
      h.odoHp.freeze();
      h.odoPp.freeze();
      h.latched = false;
    });
    if (this.fx.tethered) this.fx.severTether();
    AUDIO.sfx('fx_cheer');
    AUDIO.jingle('victory', 2200, null);
    await this.print(BATTLE_TEXT.win);
    // S14: a thieving boss hands everything back on its way down (Hoaxula)
    if (this.phase && this.phase.stolen.length > 0) await this.returnStolenGear();
    const totalExp = this.enemies.reduce((a, e) => a + e.def.exp, 0);
    const totalCash = this.enemies.reduce((a, e) => a + e.def.cash, 0);
    const alive = this.aliveHeroes();
    const share = expShare(totalExp, alive.length);
    for (const h of alive) {
      h.hero.exp += share;
      await this.print(`${h.hero.name} gained ${share} EXP.`);
      while (h.hero.exp >= expForLevel(h.hero.level + 1)) {
        h.hero.level += 1;
        const lvl = h.hero.level;
        const prevMaxHp = h.hero.maxHp;
        const prevMaxPp = h.hero.maxPp;
        h.hero.stats = statsAtLevel(h.hero.id, lvl);
        h.hero.maxHp = maxHpAtLevel(h.hero.id, lvl);
        h.hero.maxPp = maxPpAtLevel(h.hero.id, lvl);
        h.odoHp.setMax(h.hero.maxHp);
        h.odoPp.setMax(h.hero.maxPp);
        h.odoHp.heal(h.hero.maxHp - prevMaxHp);
        h.odoPp.heal(h.hero.maxPp - prevMaxPp);
        AUDIO.jingle('levelup', 1400, null);
        // S15c: every level-up (and every realization) waits for its own
        // press — three level-ups are three pieces of news, not a blur
        await this.printWait(`${h.hero.name} jumped to level ${lvl}!`);
        const newAbilities = HEROES[h.hero.id].unlocks.filter((u) => u.level === lvl);
        for (const u of newAbilities) {
          const ab = ABILITIES[u.ability];
          if (ab) await this.printWait(`${h.hero.name} realized ${ab.name}!`);
        }
      }
    }
    if (totalCash > 0) {
      GS.data.pendingDeposit += totalCash;
      await this.print(`(Dad will deposit $${totalCash}. Call him sometime.)`);
    }
    // §A4.4 (S4): the quiet after a win is when Homesick strikes — it rides
    // the save (a flag) until Mom's call cures it
    const rex = this.heroes.find((x) => x.hero.id === 'rex');
    if (rex && !rex.odoHp.dead && !rex.hero.down && GS.flag('rex_homesick') !== true && contractHomesick(Math.random)) {
      GS.setFlag('rex_homesick');
      await this.print(vars(this.fill(BATTLE_TEXT.homesick_got, rex.hero.name)));
    }
    this.syncHeroMeters();
    this.finish('victory');
  }

  private async defeat(): Promise<void> {
    if (this.ended) return;
    // §A4.5 (S14): an ARMED FEAST answers a wipe exactly once — the whole
    // party gets back up at half HP and the battle keeps going. State flips
    // synchronously so the live death-watch can't re-enter mid-revive.
    if (GS.flag('feast_armed') === true) {
      GS.setFlag('feast_armed', false);
      for (const h of this.heroes) {
        h.hero.down = false;
        h.odoHp.set(Math.max(1, Math.floor(h.hero.maxHp / 2)));
        h.box.clearTint();
        h.bust.revive();
      }
      AUDIO.sfx('heal');
      await this.fx.play('heal_glow', { targets: this.heroes.map((h) => this.cardTarget(h)) });
      await this.print(BATTLE_TEXT.feast_revive);
      return;
    }
    this.ended = true;
    AUDIO.stopMusic();
    if (this.fx.tethered) this.fx.severTether();
    await this.print(`${GS.data.party[0].name}... it all goes quiet for a second...`);
    this.syncHeroMeters();
    this.finish('defeat');
  }

  private syncHeroMeters(): void {
    this.heroes.forEach((h) => {
      h.hero.hp = Math.max(0, h.odoHp.value);
      h.hero.pp = Math.max(0, h.odoPp.value);
    });
  }

  private finish(outcome: 'victory' | 'defeat' | 'ran'): void {
    this.ended = true;
    this.syncHeroMeters();
    // §A4.5: SUNNY SIDE covers BATTLES, however they end — burn one
    const sunnyLeft = Number(GS.flag('sunny_side')) || 0;
    if (sunnyLeft > 0) GS.setFlag('sunny_side', sunnyLeft - 1);
    this.time.delayedCall(450, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.stop();
        this.game.events.emit('mf-battle-end', outcome);
      });
    });
  }

  /* ---------------- per-frame ---------------- */

  override update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 50) / 1000;
    const fast = INPUT.held('A') || INPUT.held('B');
    // the one skip state (ADR-010): text, fx timelines, stage walks, and
    // bust choreography all compress ×4 together — the drums tick on REAL
    // time, always
    this.fx.update(Math.min(dtMs, 50), fast);
    const dtFx = Math.min(dtMs, 50) * (fast ? 4 : 1);
    this.stage.update(dtFx);
    for (const h of this.heroes) {
      // S11b wear: keyed on the DISPLAYED drum value, never the target —
      // a mortal roll degrades AS the meter falls
      const tier = wearTier(Math.max(0, h.odoHp.displayed), h.hero.maxHp);
      if (tier !== h.wear) {
        h.wear = tier;
        h.bust.setSheet(bustSheetKey(h.hero.id, h.look.body, tier));
      }
      h.bust.update(dtFx, {
        mortal: h.odoHp.mortal,
        down: h.hero.down || h.odoHp.dead,
        defending: h.defending,
        victory: this.won,
        winded: tier === 2,
        shield: h.status.shield > 0,
        mirror: h.status.mirror > 0,
        statuses: {
          sunburn: h.status.sunburn > 0,
          crying: h.status.crying > 0,
          asleep: h.status.asleep > 0,
          paralyzed: h.status.paralyzed > 0,
          hushed: h.status.hushed > 0,
          homesick: h.hero.id === 'rex' && GS.flag('rex_homesick') === true,
        },
      });
    }
    // enemy wear reads plain hp (no drums on their side) — swap on change.
    // S14: a scripted boss's CURRENT FORM owns the base key (phase machine)
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const tier = wearTier(e.hp, e.def.hp);
      if (tier !== e.wear) {
        e.wear = tier;
        const base = e.def.boss && this.phase ? this.phase.spriteFor(e.def.sprite) : e.def.sprite;
        e.spr.setTexture(wearSpriteKey(base, tier));
      }
    }
    let anyRoll = false;
    let anyMortal = false;
    for (const { d, o } of this.odoDisplays) {
      const ticks = o.tick(dt);
      if (ticks > 0) anyRoll = true;
      if (o.mortal) {
        anyMortal = true;
        d.setTint(colorOf(px(RAMP.RED, 2)));
      } else {
        d.clearTint();
      }
      d.setValue(Math.max(0, o.displayed));
    }
    if (this.chad && this.chadOdo) {
      this.chad.hp.tick(dt);
      this.chadOdo.setValue(Math.max(0, this.chad.hp.displayed));
    }
    this.tickAcc -= dt;
    if (anyRoll && this.tickAcc <= 0) {
      AUDIO.sfx(anyMortal ? 'odo_danger' : 'odo');
      this.tickAcc = anyMortal ? 0.07 : 0.1;
    }
    // live death watch: a mortal drum hitting zero mid-menu still counts.
    // never write state after the battle has resolved (victory freezes drums)
    if (!this.ended) {
      for (const h of this.heroes) {
        if (h.odoHp.dead && !h.hero.down) {
          h.hero.down = true;
          h.box.setTint(0x888890);
          if (this.aliveHeroes().length === 0) void this.defeat();
        }
      }
    }
  }
}
