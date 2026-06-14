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
import { ITEMS, consumesOnUse, spiceFoodHeal } from '../data/items';
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
import { itemFxKey, stagePoseOf, impactKeyOf, FX_REGISTRY } from '../battle/fxRegistry';
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
  gadgetDamage,
  applyWeakness,
  applyElement,
  applyFocus,
  burnTick,
  BURN_TURNS,
  frozenLands,
  lifedrainDamage,
  lifedrainHeal,
  LUCKY_LUCK,
  gutsSurvive,
  runChance,
  expShare,
  heroOffense,
  heroDefense,
  heroSpeed,
  heroGuts,
  heroLuck,
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
  mitigateIncoming,
  puppetResist,
  puppetTurns,
  mindImmune,
  STEELED_GUTS,
  BRACED_DEFENSE,
  FLOWING_SPEED,
  bracedCounter,
  flowingDodge,
  MARKED_TURNS,
  guaranteedHit,
  RALLY_SPEED,
  RALLY_LUCK,
  RALLY_TURNS,
  OVATION_TURNS,
  FOCUS_TURNS,
  EVASION_TURNS,
  evasionDodges,
  RATTLED_TURNS,
  rattledDamage,
  rattledSkips,
  moraleTierUp,
  moraleHeal,
  resistIncoming,
  rollDrops,
} from '../battle/formulas';
import { Dialogue, makeWindow, makeBox, everyFrame, DEPTH_UI, vars, textSpeedMul } from '../ui/windows';
import { glyphify } from '../ui/text';
import { FlairLine, hasFlair } from '../ui/flairline';
import { FLAIR_BY_ELEMENT, FLAIR_BY_RESULT, type FlairResult } from '../spritegen/flair';
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
  /** S16 MIND WARP: turns this foe is PUPPETED — it acts on the party's side,
   *  swinging its own moves at its own allies (the build prompt §B). */
  puppet: number;
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
  /** S-Mia: Fire's DoT (turns of `burn`), Freeze's skip-lock (`frozen`, 1 turn),
   *  Hush Hex's ×1.3 incoming amplifier (`exposed`), and Milo/Pippa's focus tag
   *  (`marked`, ×1.25) — `exposed` and `marked` stack multiplicatively. */
  burn: number;
  frozen: number;
  exposed: number;
  marked: number;
  /** S-Mia: Volt γ+ disruption on the enemy side — a paralyzed foe rolls to skip
   *  its turn (the hero-side paralyzed mirror), boss-capped via mindImmune. */
  paralyzed: number;
  /** Pippa STERN DECREE: 'rattled' — the no-magic Offense-down. The foe's hits
   *  deal ×0.8 and it has a small chance to be too cowed to act. */
  rattled: number;
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
  /** S16 LAYERED WARDS (the build prompt §C). ward = halves incoming ELEMENTAL;
   *  reflect = halves ALL + bounces ~1/3 back; steeled (Resolve) = +Guts. */
  ward: number;
  reflect: number;
  steeled: number;
  /** Dorin's MARTIAL STANCES (§4). braced (Stone Brow Stance) = +Defense AND a
   *  ~40% physical counter; flowing (Flowing Step) = +Speed AND a ~35% dodge. */
  braced: number;
  flowing: number;
  /** S-Mia LUCKY STAR — temp +Luck (crit/SMAAASH + dodge), read the steeled way */
  lucky: number;
  /** Pippa's tactical buffs (§A3, S15h+). rally = +Speed/+Luck (Royal Rally /
   *  Standing Ovation); focus = the next physical hit can't miss (Big-Little
   *  Focus / The Minutes); evasion = a high dodge each hit + a decoy that eats
   *  the FIRST one; guarded = the next single-target hit is negated (Diplomatic
   *  Immunity, until consumed). */
  rally: number;
  focus: number;
  evasion: number;
  decoy: number;
  guarded: number;
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
  ward: 0,
  reflect: 0,
  steeled: 0,
  braced: 0,
  flowing: 0,
  lucky: 0,
  rally: 0,
  focus: 0,
  evasion: 0,
  decoy: 0,
  guarded: 0,
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
  /** S18 M23 (ADR-093): the mixed-run flair renderer bound to `textObj` — engaged
   *  only on the (sparse) lines battle auto-appends a `{g:NAME}` to. */
  private flairLine!: FlairLine;
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
  /** Pippa BELLWETHER — a party-wide 'morale' charge (until consumed): the next
   *  PRAY carries one tier better and the next party heal is amplified. */
  private morale = false;

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
    this.morale = false;
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
      // S16 (ADR-035 extended): a scripted beat can stage an awakening — the
      // Grin's half-dead blow awakens Jay's POWER SHIELD Σ (the_wall_that_answers)
      awaken: (id) => this.battleAwakening(id),
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
        puppet: 0,
        burn: 0,
        frozen: 0,
        exposed: 0,
        marked: 0,
        paralyzed: 0,
        rattled: 0,
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
    // ADR-107: anchor each foe's FACE just below the message window (the box is
    // makeWindow(6,6,268,56) → bottom y62) so the intro never covers it. Only
    // TALL sprites get pushed down, and never past the party HP cards (y168);
    // a sprite too big to clear both keeps its face-priority bias (rare bosses).
    const TEXTBOX_BOTTOM = 62;
    const ENEMY_TOP = TEXTBOX_BOTTOM + 2; // a breath of clearance under the box
    const ENEMY_FLOOR = 166; //              the party HP cards begin at y168
    ids.forEach((id, i) => {
      const def = ENEMIES[id];
      const x = (this.scale.width / (ids.length + 1)) * (i + 1);
      const spr = this.add.image(x, 0, def.sprite).setOrigin(0.5, 0.5);
      // bosses still bias a touch lower (their crown is the read — S7 the Tick),
      // then everyone is pushed down JUST enough for the sprite top to clear the
      // message box, capped so the body never rides over the party cards.
      const half = spr.height / 2;
      const y = Math.round(Math.min(ENEMY_FLOOR - half, Math.max(def.boss ? 97 : 92, ENEMY_TOP + half)));
      spr.setY(y);
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
        puppet: 0,
        burn: 0,
        frozen: 0,
        exposed: 0,
        marked: 0,
        paralyzed: 0,
        rattled: 0,
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
    this.flairLine = new FlairLine(this, this.textObj, { maxWidthPx: 248, depth: DEPTH_UI + 1 });
  }

  /** S18 M23: append a flair glyph to a battle caption, by the move's ELEMENT or
   *  RESULT (§A11.5) — never hand-typed per enemy, and kept sparse (most lines
   *  pass `undefined` and stay plain). The line is fully readable WITHOUT the
   *  glyph (§A11.9): the flair only punctuates what the words already say. */
  private flair(line: string, token: string | undefined): string {
    return token ? `${line} {g:${token}}` : line;
  }

  private resultFlair(line: string, result: FlairResult): string {
    return this.flair(line, FLAIR_BY_RESULT[result]);
  }

  /* ---------------- text + fx helpers ---------------- */

  private print(raw: string): Promise<void> {
    // S-Mia: render emoji flair through the glyph map (§5 caveat) — battle
    // lines reach the BitmapText here, not through vars()
    const text = glyphify(raw);
    // S18 M23: clear any flair sprites the previous line spawned, then branch —
    // a `{g:NAME}` line lays out as a mixed run; every plain line is unchanged.
    this.flairLine.clear();
    if (hasFlair(text)) return this.printFlair(text);
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

  /** the mixed-run twin of print(): identical pace + linger, but the counter
   *  advances VISUAL UNITS (a glyph = one unit) so the caption timing is unchanged
   *  and each glyph reveals as one timed beat alongside the letters. */
  private printFlair(text: string): Promise<void> {
    const fl = this.flairLine;
    return new Promise((resolve) => {
      fl.set(text);
      const total = fl.units;
      let i = 0;
      let acc = 0;
      let lingerMs = 420;
      const off = everyFrame(this, (dt) => {
        const fast = INPUT.held('A') || INPUT.held('B');
        acc += (fast ? 4 : 1.8 * textSpeedMul()) * (dt / 16);
        while (acc >= 1 && i < total) {
          acc -= 1;
          i++;
        }
        fl.reveal(i);
        if (i % 4 === 0 && i < total) AUDIO.sfx('text');
        if (i >= total) {
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
    // Pippa's command row: her kit is kind 'physical' (competence, not the old
    // light) — "Tactics" replaces the Vibe she never had (§A3, the Milo shape)
    const hasTactics = all.some((id) => ABILITIES[id]?.kind === 'physical');
    if (hasPray && this.cfg.prayTutorial && !this.prayHintShown) {
      this.prayHintShown = true;
      await this.print(this.fill(BATTLE_TEXT.pray_hint, name));
    }
    for (;;) {
      const options = ['Bash'];
      if (hasVibe) options.push('Vibe');
      if (hasGadgets) options.push('Gadgets');
      if (hasTactics) options.push('Tactics');
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
      if (options[pick] === 'Tactics') {
        const ok = await this.heroTactics(h);
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
        if (Math.random() < runChance(this.heroSpeedS(h), maxSpd)) {
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
    // PIPPA: a MARKED foe can't be missed, and a FOCUSED hero can't whiff its
    // next physical swing (Big-Little Focus / The Minutes). The guarantee skips
    // the crying-miss gate; focus is consumed by the swing it makes good.
    const guaranteed = guaranteedHit({ marked: target.marked > 0, focus: h.status.focus > 0 });
    if (h.status.focus > 0) h.status.focus = 0;
    // Crying: can't aim (§A4.8) — the swing never makes it off the card (unless
    // the shot was marked / the hero focused, in which case it lands true)
    if (!guaranteed && h.status.crying > 0 && cryingMisses(Math.random)) {
      h.bust.poseFor('lunge', 520);
      await this.print(this.fill(BATTLE_TEXT.bash, name));
      await this.print(this.fill(BATTLE_TEXT.crying_miss, name));
      return;
    }
    const cls = weaponClassOf(h.hero.equip.weapon ?? null);
    // S-Mia: LUCKY STAR's +Luck raises the SMAAASH/crit roll (heroLuckS seam)
    const smashed = Math.random() < smashChance(this.heroGutsS(h), this.heroLuckS(h));
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
    // S18 M23: the crit gets its burst (§A11.5) — the line still reads SMAAASH!!
    // without it, so the glyph only punctuates (§A11.9).
    const line = this.resultFlair(
      hits > 1
        ? `${this.fill(BATTLE_TEXT.bash, name)} ${BATTLE_TEXT.smaaash} x${hits} — ${total} damage!`
        : `${this.fill(BATTLE_TEXT.bash, name)} ${BATTLE_TEXT.smaaash} ${total} damage!`,
      'smash',
    );
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

  /** §A4.5: every battle stat read multiplies through the picnic seam.
   *  S16: RESOLVE's 'steeled' adds a temporary Guts bump on top (raises crit
   *  and the 1-HP mortal-blow survive) — read here, never baked into boosts. */
  private heroGutsS(h: HeroUnit): number {
    const steeled = h.status.steeled > 0 ? STEELED_GUTS : 0;
    return Math.round((heroGuts(h.hero) + steeled) * this.sunny);
  }

  /** the same temp-boost seam for Dorin's stances: Stone Brow Stance ('braced')
   *  reads here as +Defense — the incoming-damage calc bounces off this, never a
   *  baked-in boost (it ticks off in statusPhase like 'steeled'). */
  private heroDefenseS(h: HeroUnit): number {
    const braced = h.status.braced > 0 ? BRACED_DEFENSE : 0;
    return Math.round((heroDefense(h.hero) + braced) * this.sunny);
  }

  /** Flowing Step ('flowing') reads here as +Speed — run chance + turn tempo
   *  pick it up the steeled way (and it feeds the dodge gate in enemyAct).
   *  Pippa's RALLY adds +Speed on top (quick and lucky), the same temp-boost way. */
  private heroSpeedS(h: HeroUnit): number {
    const flowing = h.status.flowing > 0 ? FLOWING_SPEED : 0;
    const rally = h.status.rally > 0 ? RALLY_SPEED : 0;
    return Math.round((heroSpeed(h.hero) + flowing + rally) * this.sunny);
  }

  private heroVibeS(h: HeroUnit): number {
    return Math.round(h.hero.stats.vibe * this.sunny);
  }

  /** S-Mia LUCKY STAR ('lucky') reads here as +Luck — the steeled temp-boost
   *  pattern (never baked into `boosts`; ticks off in statusPhase). Feeds the
   *  SMAAASH/crit roll and the dodge gate while it holds. */
  private heroLuckS(h: HeroUnit): number {
    const lucky = h.status.lucky > 0 ? LUCKY_LUCK : 0;
    // Pippa's RALLY adds +Luck on top (quick and lucky) — the same temp-boost way
    const rally = h.status.rally > 0 ? RALLY_LUCK : 0;
    return Math.round((heroLuck(h.hero) + lucky + rally) * this.sunny);
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
      // teleport (α/β) is an overworld run-up, not a battle cast
      return a && a.kind === 'vibe' && !a.id.startsWith('teleport_');
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

  /** Pippa's command (§A3, S15h+: NO Vibe, NO PP — her kit is competence, not
   *  the old light). Mirrors heroGadgets, filtered to kind 'physical': marks,
   *  rally, field medicine, the diplomatic reads. */
  private async heroTactics(h: HeroUnit): Promise<boolean> {
    const ids = availableAbilities(h.hero.id, h.hero.level, (f) => GS.flag(f) === true).filter(
      (id) => ABILITIES[id]?.kind === 'physical',
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
    if (ab.id === 'healing_o') {
      // Healing Omega — the clutch party pickup: mass revive + 60% HP + a full
      // cleanse, hitting EVERY ally (down or standing). No fallen-ally pick;
      // it always lands, and his high Speed lands it FIRST (the build prompt §3).
      allyTargets = this.heroes;
    } else if (ab.status === 'revive') {
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
    // S18 M23: a hero's elemental cast / heal punctuates its flavor with the
    // move's glyph (fire/freeze/volt/holy, or a heal's sparkle) — driven by the
    // ability's element/heal, never per-enemy (§A11.5). Buffs/status casts have
    // element 'none' and no heal, so they stay plain.
    const castFlair = ab.heal ? FLAIR_BY_RESULT.heal : FLAIR_BY_ELEMENT[ab.element];
    await this.print(this.flair(this.fill(ab.text, name), castFlair));
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
      // Pippa BELLWETHER: a held 'morale' charge amplifies the next party heal
      // (×1.5), consumed once however many allies it touches.
      const carried = this.morale;
      for (const t of allyTargets) {
        let amount = vibeHeal(ab.power, this.heroVibeS(h), Math.random);
        if (carried) amount = moraleHeal(amount);
        this.healHero(t, amount);
        AUDIO.sfx('heal');
        await this.print(`${t.hero.name} recovered about ${amount} HP!`);
        // Pippa's patches CLEAR status too — Pocket Patch / Field Dressing carry
        // 'cure', so the no-magic kids cover upkeep AND cleanse (0 PP).
        if (ab.status === 'cure') {
          t.status.sunburn = 0;
          t.status.crying = 0;
          t.status.asleep = 0;
          t.status.paralyzed = 0;
          t.status.hushed = 0;
        }
      }
      if (carried) {
        this.morale = false;
        await this.print(this.fill(BATTLE_TEXT.morale_heal, name));
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
      // S16 — the LAYERED WARD system. ward halves elemental (4 turns); reflect
      // halves all + bounces (3 turns, shorter because it's strong); steeled is
      // Resolve's +Guts buff (4 turns). BULWARK: shield + ward held at once is
      // called out so the player learns the stack pays off (the §C synergy).
      case 'ward': {
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          t.status.ward = 4;
          await this.print(this.fill(BATTLE_TEXT.ward_on, t.hero.name));
          if (t.status.shield > 0) await this.print(this.fill(BATTLE_TEXT.bulwark, t.hero.name));
        }
        return true;
      }
      case 'reflect': {
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          t.status.reflect = 3;
          await this.print(this.fill(BATTLE_TEXT.reflect_on, t.hero.name));
        }
        return true;
      }
      case 'steeled': {
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          t.status.steeled = 4;
          await this.print(this.fill(BATTLE_TEXT.steeled_on, t.hero.name));
        }
        return true;
      }
      // Dorin's MARTIAL STANCES (§4) — self-buffs that make his turn a choice.
      // Set to 4 (the steeled cadence): the cast turn + ~3 active enemy turns.
      case 'braced': {
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          t.status.braced = 4;
          await this.print(this.fill(BATTLE_TEXT.braced_on, t.hero.name));
        }
        return true;
      }
      case 'flowing': {
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          t.status.flowing = 4;
          await this.print(this.fill(BATTLE_TEXT.flowing_on, t.hero.name));
        }
        return true;
      }
      // S16 MIND WARP — turn ONE foe against its own allies. Bosses are
      // mind_immune; elites roll a level-scaled resist. Ω (the awakened
      // 'the_borrowed_voice') grips stronger foes and holds 2–3 turns.
      case 'puppet': {
        await this.fx.play(ab.fx, { caster: ctx.caster, targets: foeTargets.map((e) => this.foeTarget(e)) });
        const omega = ab.id === 'mindwarp_o';
        for (const e of foeTargets) {
          if (!e.alive) continue;
          if (mindImmune(e.def)) {
            AUDIO.sfx('cancel');
            await this.print(this.fill(BATTLE_TEXT.puppet_immune, name, e));
            continue;
          }
          // Ω only has to beat HALF the elite's resist (it grips stronger minds)
          const resist = puppetResist(e.def.level, h.hero.level) * (omega ? 0.5 : 1);
          if (Math.random() < resist) {
            await this.print(this.fill(BATTLE_TEXT.puppet_resist, name, e));
            continue;
          }
          e.puppet = puppetTurns(omega, Math.random);
          e.spr.setTint(colorOf(px(RAMP.PURPLE, 3)));
          await this.print(this.fill(BATTLE_TEXT.puppet_on, name, e));
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
        // Healing Omega — mass revive + 60% HP + full cleanse across the whole
        // party (the down rise; the standing top up to ≥60%, never reduced).
        if (ab.id === 'healing_o') {
          for (const t of allyTargets) {
            const to60 = Math.max(1, Math.floor(t.hero.maxHp * 0.6));
            if (t.hero.down || t.odoHp.dead) {
              t.hero.down = false;
              t.box.clearTint();
              t.bust.revive();
              t.odoHp.set(to60);
            } else {
              t.odoHp.set(Math.max(t.odoHp.value, to60));
            }
            // the cleanse half of the pickup — every bad status cleared
            t.status.sunburn = 0;
            t.status.crying = 0;
            t.status.asleep = 0;
            t.status.paralyzed = 0;
            t.status.hushed = 0;
          }
          AUDIO.sfx('heal');
          await this.print(this.fill(BATTLE_TEXT.revive_all, name));
          return true;
        }
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
        // S-Mia DREAMLULL is MASS sleep — a lower land rate than single Hypno (the
        // trade for hitting the whole room). Single-target sleepers always land.
        const land = ab.id === 'dreamlull' ? 0.55 : 1;
        for (const e of foeTargets) {
          if (Math.random() >= land) {
            await this.print(this.fill('{e} fought off the lullaby!', name, e));
            continue;
          }
          e.asleep = 2 + (Math.random() < 0.5 ? 1 : 0);
          await this.print(this.fill('{e} drifted off mid-thought!', name, e));
        }
        return true;
      }
      case 'crying': {
        await this.fx.play(ab.fx, ctx);
        // S16: Flash Ω is a brighter, stickier blind — higher land rate + a
        // turn longer than Flash α (the build prompt §3 extras)
        const omega = ab.id === 'flash_o';
        const land = omega ? 0.9 : 0.7;
        for (const e of foeTargets) {
          if (Math.random() < land) {
            e.crying = omega ? 4 : 3;
            await this.print(this.fill('{e} burst into tears!', name, e));
          } else {
            await this.print(this.fill('{e} blinked it away!', name, e));
          }
        }
        return true;
      }
      case 'hushed': {
        await this.fx.play(ab.fx, ctx);
        // Brainjam Gamma is the LONGER single-target lock (the anti-caster tool,
        // §3) — it bridges the single→AoE jump by holding the wires shut a turn
        // longer than α/Ω.
        const turns = ab.id === 'brainjam_g' ? 5 : 3;
        for (const e of foeTargets) {
          e.hushed = turns;
          await this.print(this.fill('{e} forgot every word it knew!', name, e));
        }
        return true;
      }
      case 'pp_drain': {
        // S-Mia: Magnet α/β/γ — pull enemy magic into Mia's bar. γ is AoE (the
        // whole room), so sum the sips across every standing foe.
        await this.fx.play(ab.fx, { caster: ctx.caster, targets: foeTargets.map((e) => this.foeTarget(e)) });
        let total = 0;
        for (const e of foeTargets) {
          if (!e.alive) continue;
          total += magnetSiphon(Math.random);
        }
        if (total > 0) h.odoPp.heal(total);
        await this.print(this.fill(BATTLE_TEXT.magnet_sip, name, foeTargets[0], String(total)));
        return true;
      }
      case 'lifedrain': {
        // S-Mia: Magnet Ω/Σ — she takes the SPARK and the WARMTH. PP sip + an HP
        // bite (Σ AoE bites a little less per target); Mia heals half of all of it.
        // A drain turn is not a nuke turn — the trade that makes her self-sufficient.
        await this.fx.play(ab.fx, { caster: ctx.caster, targets: foeTargets.map((e) => this.foeTarget(e)) });
        const aoe = ab.target === 'enemies';
        let ppGain = 0;
        let hpDrained = 0;
        for (const e of foeTargets) {
          if (!e.alive) continue;
          ppGain += magnetSiphon(Math.random);
          const before = e.hp;
          await this.damageEnemy(e, lifedrainDamage(aoe, this.heroVibeS(h), Math.random), false, undefined, 'vibe');
          hpDrained += Math.max(0, before - e.hp);
        }
        if (ppGain > 0) h.odoPp.heal(ppGain);
        const back = lifedrainHeal(ppGain + hpDrained);
        this.healHero(h, back);
        AUDIO.sfx('heal');
        await this.print(this.fill(BATTLE_TEXT.lifedrain, name, undefined, String(back)));
        return true;
      }
      // S-Mia LUCKY STAR — a party crit/dodge buff (the steeled temp-boost shape;
      // heroLuckS reads it, statusPhase ticks it off). A non-nuke turn worth taking.
      case 'lucky': {
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          t.status.lucky = 4;
          await this.print(this.fill(BATTLE_TEXT.lucky_on, name, undefined, t.hero.name));
        }
        return true;
      }
      // S-Mia HUSH HEX — `exposed`: ×1.3 on everything the foe takes for 4 turns,
      // the party's universal focus-this-target enabler (stacks with `marked`).
      case 'exposed': {
        await this.fx.play(ab.fx, { caster: ctx.caster, targets: foeTargets.map((e) => this.foeTarget(e)) });
        for (const e of foeTargets) {
          if (!e.alive) continue;
          e.exposed = 4;
          await this.print(this.fill(BATTLE_TEXT.exposed_on, name, e));
        }
        return true;
      }
      // ---- PIPPA's tactical kit (§A3, S15h+: NO Vibe, NO PP — competence, not
      // the old light). The mark makes the big kids reliable AND sets up party
      // AoE turns; rally/focus lift the team; evasion/guarded are defensive reads;
      // rattled is the no-magic debuff; morale feeds Mia's faith. Her turn ENABLES
      // a bigger party turn — the central support loop.
      case 'marked': {
        // Pinpoint (one shot) / Volley (the whole row): a marked foe can't be
        // missed by the party AND takes ×1.25 (applyFocus reads e.marked at
        // damageEnemy). The focus-fire enabler for everyone's burst.
        await this.fx.play(ab.fx, { caster: ctx.caster, targets: foeTargets.map((e) => this.foeTarget(e)) });
        for (const e of foeTargets) {
          if (!e.alive) continue;
          // Milo's SCOPE is Spy++: it REVEALS the foe's stats (the spy report)
          // AND marks it — a force-multiplier that pairs the read with the tag.
          if (ab.id === 'scope') {
            await this.print(this.fill(BATTLE_TEXT.spy_report, name, e, String(e.hp)));
            await this.print(
              e.def.weakness.length > 0
                ? this.fill(BATTLE_TEXT.spy_weak, name, e, e.def.weakness.join(', '))
                : this.fill(BATTLE_TEXT.spy_no_weak, name, e),
            );
          }
          e.marked = MARKED_TURNS;
          await this.print(this.fill(BATTLE_TEXT.marked_on, name, e));
        }
        return true;
      }
      case 'rally': {
        // Royal Rally (3 turns) / Standing Ovation (5 — her pre-boss button):
        // +Speed and +Luck party-wide (read at heroSpeedS/heroLuckS the steeled
        // way; her Luck flavor made mechanically real).
        await this.fx.play(ab.fx, ctx);
        const turns = ab.id === 'standing_ovation' ? OVATION_TURNS : RALLY_TURNS;
        for (const t of allyTargets) {
          t.status.rally = turns;
          await this.print(this.fill(BATTLE_TEXT.rally_on, name, undefined, t.hero.name));
        }
        return true;
      }
      case 'focus': {
        // Big-Little Focus / The Minutes: the next physical hit can't miss. The
        // Minutes ALSO cleanses a party debuff first — her signature comeback tool.
        await this.fx.play(ab.fx, ctx);
        const cleanse = ab.id === 'the_minutes';
        for (const t of allyTargets) {
          if (cleanse) {
            t.status.sunburn = 0;
            t.status.crying = 0;
            t.status.asleep = 0;
            t.status.paralyzed = 0;
            t.status.hushed = 0;
          }
          t.status.focus = FOCUS_TURNS;
          await this.print(this.fill(cleanse ? BATTLE_TEXT.minutes_on : BATTLE_TEXT.focus_on, name, undefined, t.hero.name));
        }
        return true;
      }
      case 'evasion': {
        // Scale Step — the thimble-scale gimmick: a decoy eats the FIRST incoming
        // hit outright, then a high dodge each hit (routes through live Speed/Luck).
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          t.status.evasion = EVASION_TURNS;
          t.status.decoy = 1;
          await this.print(this.fill(BATTLE_TEXT.evasion_on, name, undefined, t.hero.name));
        }
        return true;
      }
      case 'guarded': {
        // Diplomatic Immunity — she steps in front: the next single-target hit on
        // the chosen ally is negated (one charge, until consumed). Protect the
        // squishy caster on a telegraphed turn — a defensive read, not a reflex.
        await this.fx.play(ab.fx, ctx);
        for (const t of allyTargets) {
          t.status.guarded = 1;
          await this.print(this.fill(BATTLE_TEXT.guarded_on, name, undefined, t.hero.name));
        }
        return true;
      }
      case 'rattled': {
        // Stern Decree — the furious diplomat: enemy Offense down (its hits ×0.8)
        // plus a small chance to be too cowed to act. Control without magic.
        await this.fx.play(ab.fx, { caster: ctx.caster, targets: foeTargets.map((e) => this.foeTarget(e)) });
        for (const e of foeTargets) {
          if (!e.alive) continue;
          e.rattled = RATTLED_TURNS;
          await this.print(this.fill(BATTLE_TEXT.rattled_on, name, e));
        }
        return true;
      }
      case 'morale': {
        // Bellwether — rings the party up: the next PRAY carries one tier better
        // and the next party heal is amplified (consumed at those seams). Feeds
        // Mia's faith mechanic — cross-character synergy is Pippa's identity.
        await this.fx.play(ab.fx, ctx);
        this.morale = true;
        await this.print(this.fill(BATTLE_TEXT.morale_on, name));
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
    const tier = FX_REGISTRY[ab.fx]?.tier ?? 1;
    for (const t of foeTargets) {
      if (!t.alive) continue;
      // S-Mia: the full OUTGOING weak/resist multiplier (the hero→enemy seam,
      // distinct from Jay's incoming mitigateIncoming). `holy` (Starsong) PIERCES
      // a slice of resistance — the Embers' light is the Hush's bane.
      const holy = ab.element === 'holy';
      const weak = ab.element !== 'none' && ab.element !== 'physical' && t.def.weakness.includes(ab.element as 'fire' | 'freeze' | 'volt' | 'holy');
      const resist = ab.element !== 'none' && ab.element !== 'physical' && (t.def.resists?.includes(ab.element as 'fire' | 'freeze' | 'volt' | 'holy') ?? false);
      // gadgets are machines: flat power, no Vibe scaling, defense pierced
      const raw =
        ab.kind === 'gadget'
          ? gadgetDamage(ab.power, Math.random)
          : vibeDamage(ab.power, this.heroVibeS(h), Math.random);
      const dmg = ab.kind === 'gadget' ? applyWeakness(raw, weak) : applyElement(raw, { weak, resist, holy, weakMul: t.def.weakMul });
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
      // S-Mia: the on-hit enemy statuses ride the damage (the switch above let
      // these fall through). burn = Fire's DoT (γ+); frozen = Freeze's skip-lock,
      // boss-capped via mindImmune; paralyzed = Volt's disruption, boss-capped too.
      if (t.alive) await this.applyOnHitStatus(h, t, ab, tier);
    }
    return true;
    } finally {
      // however the cast resolved, the caster walks back to their card
      if (onStage) await this.stageReturn(h);
    }
  }

  /** S-Mia: the on-hit enemy statuses a DAMAGE spell rides (the switch let these
   *  fall through to the damage path). burn = Fire's DoT (γ+); frozen = Freeze's
   *  1-turn skip-lock; paralyzed = Volt's disruption. `frozen` and `paralyzed`
   *  honor the boss control-cap (mindImmune) EXACTLY like Jay's puppet — control
   *  is devastating on packs, capped on bosses, never an "I win" on a boss. */
  private async applyOnHitStatus(h: HeroUnit, e: EnemyUnit, ab: AbilityDef, tier: number): Promise<void> {
    if (ab.status === 'burn') {
      e.burn = BURN_TURNS;
      await this.print(this.fill(BATTLE_TEXT.burn_on, h.hero.name, e));
    } else if (ab.status === 'frozen') {
      if (mindImmune(e.def)) {
        await this.print(this.fill(BATTLE_TEXT.control_capped, h.hero.name, e));
      } else if (frozenLands(tier, Math.random)) {
        e.frozen = 1;
        await this.print(this.fill(BATTLE_TEXT.frozen_on, h.hero.name, e));
      } else {
        await this.print(this.fill(BATTLE_TEXT.frozen_shrug, h.hero.name, e));
      }
    } else if (ab.status === 'paralyzed') {
      if (mindImmune(e.def)) {
        await this.print(this.fill(BATTLE_TEXT.control_capped, h.hero.name, e));
      } else {
        e.paralyzed = 3;
        await this.print(this.fill(BATTLE_TEXT.enemy_paralyzed_on, h.hero.name, e));
      }
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
    let tier = this.prayPin ?? rollPray(h.hero.level, this.heroGutsS(h), Math.random);
    this.prayPin = null;
    // PIPPA BELLWETHER: a held 'morale' charge carries the prayer one tier better
    // (consumed) — the no-magic page feeding Mia's faith (cross-character synergy).
    if (this.morale) {
      this.morale = false;
      const up = moraleTierUp(tier);
      if (up !== tier) {
        tier = up;
        await this.print(BATTLE_TEXT.morale_pray);
      }
    }
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
      // §A10 #15 (S18 M24): the Spice Box makes cooked food heal half again
      const heal = spiceFoodHeal(item.heal, GS.hasKeyItem('spice_box'));
      GS.removeItem(itemId, h.hero.id);
      h.bust.poseFor('rummage', 360);
      await this.print(`${name} wolfed down the ${item.name}!`);
      h.bust.poseFor('munch', 700);
      if (fxKey) await this.fx.play(fxKey, { caster: this.cardTarget(h) });
      this.healHero(h, heal);
      AUDIO.sfx('heal');
      await this.print(`About ${heal} HP came back.`);
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
    // §A4.12 THE REVIVAL LINE (S17/ADR-061): any cure that lists 'down' brings
    // an angel back — it goes to whoever needs it most, healing by the item's
    // own `heal` (Glint's Spark's 9999 = full; later tiers revive weaker). The
    // spark's exact fx + lines are preserved when it's the spark itself.
    if (item.kind === 'cure' && item.cures?.includes('down')) {
      const isSpark = item.id === 'glints_spark';
      // S18 M24 (ADR-094): a reusable revive (Milo's Defibrillator, §A4.12) is
      // not spent — it brings the next angel back too
      if (consumesOnUse(item)) GS.removeItem(itemId, h.hero.id);
      h.bust.poseFor('castA', 700);
      const downed = this.heroes.find((x) => x.hero.down || x.odoHp.dead);
      const at = downed ? this.cardTarget(downed) : this.cardTarget(h);
      if (fxKey) await this.fx.play(fxKey, { caster: this.cardTarget(h), targets: [at] });
      const amount = item.heal ?? 1;
      if (downed) {
        downed.hero.down = false;
        downed.odoHp.set(Math.min(downed.hero.maxHp, amount));
        downed.box.clearTint();
        downed.bust.revive();
        await this.print(
          isSpark
            ? this.fill(BATTLE_TEXT.spark_revive, name, undefined, downed.hero.name)
            : `${downed.hero.name} got back up — ${amount >= downed.hero.maxHp ? 'good as new!' : 'wobbly, but standing!'}`,
        );
      } else {
        this.healHero(h, amount);
        await this.print(isSpark ? 'The spark flares — warm as a porch light in late summer. Full recovery!' : `${name} feels the warmth spread. ${amount} HP back!`);
      }
      return true;
    }
    // S14 (§A10 #6): a status battle item — the CAMERA FLASH blinds the
    // whole room into Crying; `reusable` survives the click (it's a flash,
    // not film)
    if (item.kind === 'battle' && item.status) {
      if (consumesOnUse(item)) GS.removeItem(itemId, h.hero.id); // the Camera Flash is a flash, not film
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
      // S18 M24 (ADR-094): the reusable Scroll of Calm (§A10 #17) is never spent
      if (consumesOnUse(item)) GS.removeItem(itemId, h.hero.id);
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
      if (consumesOnUse(item)) GS.removeItem(itemId, h.hero.id); // S18 M24: a reusable thrown gizmo survives
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
    // S-Mia: the focus-fire amplifier — `exposed` (Hush Hex, ×1.3) stacks
    // multiplicatively with `marked` (Milo/Pippa, ×1.25). EVERY incoming hit
    // reads it (bash, vibe, pray, the burn tick) — the OUTGOING mirror of Jay's
    // ward, applied here PARALLEL to mitigateIncoming, never inside it.
    dmg = applyFocus(dmg, { exposed: e.exposed > 0, marked: e.marked > 0 });
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
      // S18 M23: a non-boss KO gets a quiet star (§A11.5). BOSSES stay clean —
      // their final lines are sincere beats (§A11.2), never punctuated.
      await this.print(this.flair(e.def.deathLine, e.def.boss ? undefined : FLAIR_BY_RESULT.ko));
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
      // S16 MIND WARP: a PUPPETED foe acts on the PARTY's side this round —
      // it turns its own moves on its own allies (the borrowed voice). The
      // grip overrides its sleep; it ticks down in the end-of-round loop.
      if (e.puppet > 0) {
        await this.puppetAct(e);
        if (this.ended) return;
        continue;
      }
      // S-Mia FREEZE: a frozen foe loses its next turn outright (1-turn lockdown,
      // consumed here). Freeze's control identity — devastating, boss-capped.
      if (e.frozen > 0) {
        e.frozen = 0;
        await this.print(this.fill(BATTLE_TEXT.frozen_skip, '', e));
        continue;
      }
      // S-Mia VOLT: a paralyzed foe rolls to skip (the hero-side paralyzed mirror)
      if (e.paralyzed > 0 && paralyzedSkips(Math.random)) {
        await this.print(this.fill(BATTLE_TEXT.enemy_paralyzed_skip, '', e));
        continue;
      }
      // PIPPA STERN DECREE: a rattled foe may be too cowed to act (small chance)
      if (e.rattled > 0 && rattledSkips(Math.random)) {
        await this.print(this.fill(BATTLE_TEXT.rattled_skip, '', e));
        continue;
      }
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
          // S16: an attack declares its CLASS (default physical). The element
          // drives BOTH the impact face and which of Jay's wards answers it.
          const element = move.element ?? 'physical';
          // PIPPA DIPLOMATIC IMMUNITY: a 'guarded' ally is stepped in front of —
          // the next single-target hit is negated outright (one charge, consumed).
          if (target.status.guarded > 0) {
            target.status.guarded = 0;
            await this.print(this.fill(BATTLE_TEXT.guarded_negate, '', e, target.hero.name));
            break;
          }
          // PIPPA SCALE STEP: the decoy eats the FIRST incoming hit outright...
          if (target.status.decoy > 0) {
            target.status.decoy = 0;
            await this.print(this.fill(BATTLE_TEXT.decoy_miss, '', e, target.hero.name));
            break;
          }
          // ...then a high thimble-scale dodge each hit while evasion holds
          // (routes through live Speed/Luck — she is absurdly lucky).
          if (target.status.evasion > 0 && evasionDodges(this.heroSpeedS(target), this.heroLuckS(target), Math.random)) {
            await this.print(this.fill(BATTLE_TEXT.evasion_dodge, '', e, target.hero.name));
            break;
          }
          // Flowing Step: the shared pre-damage MISS gate — a flowing monk slips
          // the hit entirely (routes through live Speed/Luck). Read off the
          // hero's status BEFORE any damage.
          if (target.status.flowing > 0 && flowingDodge(this.heroSpeedS(target), this.heroLuckS(target), Math.random)) {
            await this.print(this.fill(BATTLE_TEXT.flowing_dodge, '', e, target.hero.name));
            break;
          }
          // the move answers ON the card: impact burst + shake + flinch
          void this.fx.play(impactKeyOf(element), { targets: [this.cardTarget(target)] });
          this.cameras.main.shake(120, 0.006);
          // S10: defense reads through the 'body' slot (the Champion Jacket);
          // S14: and through the §A4.5 SUNNY SIDE seam; Stone Brow Stance's
          // 'braced' +Defense rides this read too (the temp-boost pattern).
          let dmg = physicalDamage(e.def.offense * (move.mult ?? 1), this.heroDefenseS(target), Math.random);
          // PIPPA STERN DECREE: a rattled foe's Offense is down — its hit lands ×0.8
          if (e.rattled > 0) dmg = rattledDamage(dmg);
          if (target.defending) dmg = Math.max(1, Math.floor(dmg / 2));
          // S18 M24 (ADR-094): THE §A8 PENDANT SEAM — a worn fire/freeze/volt/holy
          // resist pendant (heroResist) shaves its pct off a MATCHING elemental
          // hit, BEFORE Jay's active ward answers (the two seams stack, gear
          // first). The §A8 "pendants (elemental resists)" finally bite a landed
          // elemental enemy move (the Coily Cicada's August glare); a physical
          // hit is untouched. Distinct from mitigateIncoming below.
          dmg = resistIncoming(dmg, element, target.hero);
          // S16 LAYERED WARDS (§A3 amended) — Shield halves physical, Ward halves
          // elemental, Reflect & Mirror halve everything AND throw some back, with
          // the Bulwark + brace-and-answer synergies. One math seam (formulas.ts).
          const s = target.status;
          const mit = mitigateIncoming(dmg, element, {
            shield: s.shield > 0,
            ward: s.ward > 0,
            reflect: s.reflect > 0,
            mirror: s.mirror > 0,
            steeled: s.steeled > 0,
          });
          const taken = mit.taken;
          let reflected = mit.reflected;
          // Stone Brow Stance: a braced monk answers a PHYSICAL hit with ~40%
          // fist damage at the SAME `reflected` seam — patience made offense.
          const countered = s.braced > 0 && element === 'physical';
          if (countered) reflected += bracedCounter(dmg);
          this.applyHeroDamage(target, taken);
          await this.print(`${target.hero.name} took ${taken}!`);
          if (reflected > 0) {
            const tint = s.reflect > 0 ? RAMP.GOLD : countered ? RAMP.RED : RAMP.CYAN;
            this.fx.popup(e.spr.x, e.spr.y - e.spr.height / 2 - 2, `${reflected}`, tint);
            e.hp = Math.max(1, e.hp - reflected); // a reflection never lands the last hit
            // the WALL THAT ANSWERS (reflect) vs the monk's counter vs Dorin's mirror
            const line = s.reflect > 0
              ? BATTLE_TEXT.reflect_back
              : countered
                ? BATTLE_TEXT.braced_counter
                : '{e} caught its own reflection! It lost {t} HP!';
            await this.print(this.fill(line, '', e, String(reflected)));
          }
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
          if (move.status === 'hushed') {
            // §A7 Ch.3 — the Possessed Textbook's pop quiz (and the Invigilator's
            // "no talking") steal a hero's voice: Vibe goes quiet. The engine
            // already ticks + draws a hushed hero (HERO_STATUS_POOL / STATUS_LANDED).
            target.status.hushed = 3;
            await this.print(`${target.hero.name} ${STATUS_LANDED.hushed}`);
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
        case 'mend': {
          // §A7 Ch.3 (ADR-099) — the Tea Poltergeist tops up the OTHER side's cups:
          // hospitality, misfiled. It heals every STANDING ally enemy a little (never
          // itself); alone, there is no one to pour for, so it does nothing.
          const allies = this.enemies.filter((a) => a.alive && a !== e);
          if (allies.length > 0) {
            const amt = 18 + Math.floor(Math.random() * 10);
            for (const a of allies) {
              a.hp = Math.min(a.def.hp, a.hp + amt);
              this.fx.popup(a.spr.x, a.spr.y - a.spr.height / 2 - 2, `+${amt}`, RAMP.GRASS);
            }
            AUDIO.sfx('heal');
          }
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

  /**
   * S16 MIND WARP — a puppeted foe acts FOR the party: it turns one of its own
   * damage moves on another living enemy (its ally). No ally left = it flails
   * at empty air. A borrowed blow that KILLS flows a little of the old light
   * back to Jay (the §B tempo payoff — control that earns the player a turn).
   */
  private async puppetAct(e: EnemyUnit): Promise<void> {
    const others = this.enemies.filter((o) => o.alive && o !== e);
    this.tweens.add({ targets: e.spr, y: e.spr.y + 5, duration: 90, yoyo: true });
    if (others.length === 0) {
      await this.print(this.fill(BATTLE_TEXT.puppet_nobody, '', e));
      return;
    }
    const victim = others[Math.floor(Math.random() * others.length)];
    await this.print(this.fill(BATTLE_TEXT.puppet_act, '', e));
    // it swings with its own offense (a damage move's mult, if it has one) —
    // the borrowed voice hits its kin with their own teeth
    const dmgMove = e.def.moves.find((m) => m.kind === 'attack' || m.kind === 'strong');
    const dmg = physicalDamage(e.def.offense * (dmgMove?.mult ?? 1), victim.def.defense, Math.random);
    void this.fx.play('impact_physical', { targets: [this.foeTarget(victim)] });
    const wasAlive = victim.alive;
    await this.damageEnemy(victim, dmg, false, undefined, 'physical');
    if (wasAlive && !victim.alive) {
      const jay = this.heroes.find((h) => h.hero.id === 'rex' && !h.hero.down && !h.odoHp.dead);
      if (jay) {
        jay.odoPp.heal(6);
        await this.print(this.fill(BATTLE_TEXT.puppet_refund, jay.hero.name));
      }
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
      // S16: Resolve's 'steeled' is exactly the "don't die" button — name it
      void this.print(this.fill(h.status.steeled > 0 ? BATTLE_TEXT.steeled_survive : '{user} hung on with sheer GUTS!', h.hero.name));
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
      // S16 layered wards + the Guts buff tick down and announce their fade
      if (s.ward > 0 && --s.ward === 0) await this.print(this.fill(BATTLE_TEXT.ward_off, h.hero.name));
      if (s.reflect > 0 && --s.reflect === 0) await this.print(this.fill(BATTLE_TEXT.reflect_off, h.hero.name));
      if (s.steeled > 0 && --s.steeled === 0) await this.print(this.fill(BATTLE_TEXT.steeled_off, h.hero.name));
      // Dorin's stances tick down and announce their fade beside the wards
      if (s.braced > 0 && --s.braced === 0) await this.print(this.fill(BATTLE_TEXT.braced_off, h.hero.name));
      if (s.flowing > 0 && --s.flowing === 0) await this.print(this.fill(BATTLE_TEXT.flowing_off, h.hero.name));
      // S-Mia LUCKY STAR fades the steeled way (read at heroLuckS, ticked here)
      if (s.lucky > 0 && --s.lucky === 0) await this.print(this.fill(BATTLE_TEXT.lucky_off, h.hero.name));
      // PIPPA's tactical buffs tick down beside the rest. rally (+Speed/+Luck)
      // and focus (guaranteed next swing) announce their fade; evasion clears its
      // leftover decoy on the way out. 'guarded' is until-consumed — it never
      // ticks (it holds until a hit lands on it or the battle ends).
      if (s.rally > 0 && --s.rally === 0) await this.print(this.fill(BATTLE_TEXT.rally_off, h.hero.name));
      if (s.focus > 0 && --s.focus === 0) await this.print(this.fill(BATTLE_TEXT.focus_off, h.hero.name));
      if (s.evasion > 0 && --s.evasion === 0) {
        s.decoy = 0;
        await this.print(this.fill(BATTLE_TEXT.evasion_off, h.hero.name));
      }
      if (s.productive > 0 && --s.productive === 0) {
        await this.print(`${h.hero.name} remembered it's summer. Offense is back!`);
      }
    }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.crying > 0) e.crying--;
      if (e.hushed > 0) e.hushed--;
      if (e.shield > 0) e.shield--;
      if (e.paralyzed > 0 && --e.paralyzed === 0) await this.print(this.fill(BATTLE_TEXT.enemy_paralyzed_off, '', e));
      // S-Mia BURN: Fire's DoT chips at end of round (~6% max HP, min 4) — and
      // the chip rides `exposed` (the chip-and-amplify combo) through damageEnemy.
      if (e.burn > 0) {
        e.burn--;
        await this.damageEnemy(e, burnTick(e.def.hp), false, this.fill(BATTLE_TEXT.burn_tick, '', e), 'vibe');
        if (e.burn === 0 && e.alive) await this.print(this.fill(BATTLE_TEXT.burn_off, '', e));
      }
      // S-Mia HUSH HEX: the ×1.3 amplifier fades
      if (e.exposed > 0 && --e.exposed === 0) await this.print(this.fill(BATTLE_TEXT.exposed_off, '', e));
      // PIPPA: the mark fades (the party's free-hit window closes), and Stern
      // Decree's Offense-down lifts — the room straightens its tie.
      if (e.marked > 0 && --e.marked === 0) await this.print(this.fill(BATTLE_TEXT.marked_off, '', e));
      if (e.rattled > 0 && --e.rattled === 0) await this.print(this.fill(BATTLE_TEXT.rattled_off, '', e));
      // S16 MIND WARP wears off — the borrowed voice slips free, tint clears
      if (e.puppet > 0 && --e.puppet === 0) {
        e.spr.clearTint();
        await this.print(this.fill(BATTLE_TEXT.puppet_off, '', e));
      }
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
        // S17 (ADR-061): re-add any permanent HP/PP tonic boost so the recompute
        // doesn't wipe it (combat-stat boosts live in `boosts`, added by the seams)
        h.hero.maxHp = maxHpAtLevel(h.hero.id, lvl) + (h.hero.boosts?.hp ?? 0);
        h.hero.maxPp = maxPpAtLevel(h.hero.id, lvl) + (h.hero.boosts?.pp ?? 0);
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
    // §A7 LOOT (S18 M24, ADR-094): each defeated enemy rolls its identity drops
    // into the bag, EarthBound-style — one warm line per item that lands, the
    // bag's full-hands handling when there's nowhere to put it.
    for (const e of this.enemies) {
      for (const id of rollDrops(e.def.drops, Math.random)) {
        const drop = ITEMS[id];
        if (!drop) continue;
        const got = this.awardDrop(id);
        AUDIO.sfx(got ? 'confirm' : 'cancel');
        await this.print(this.fill(got ? BATTLE_TEXT.enemy_drop : BATTLE_TEXT.enemy_drop_full, '', e, drop.name));
      }
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

  /** §A7 LOOT (S18 M24, ADR-094): place one dropped item — a key item into the
   *  shared key bag, anything else into the first party member with a free slot.
   *  Returns false (EB full-hands) when there's nowhere to put it. */
  private awardDrop(id: string): boolean {
    const item = ITEMS[id];
    if (!item) return false;
    if (item.kind === 'key') {
      if (!GS.data.keyItems.includes(id)) GS.data.keyItems.push(id);
      return true;
    }
    for (const h of GS.data.party) {
      if (GS.addItem(id, h.id)) return true;
    }
    return false;
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
        ward: h.status.ward > 0,
        reflect: h.status.reflect > 0,
        steeled: h.status.steeled > 0,
        braced: h.status.braced > 0,
        flowing: h.status.flowing > 0,
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
