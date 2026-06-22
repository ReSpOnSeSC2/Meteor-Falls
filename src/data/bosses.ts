/**
 * Boss phase scripts — GAME_BIBLE §A6 gimmicks as DATA over the S14 phase
 * machine (src/battle/phases.ts, Bible Prompt 15). One entry per scripted
 * boss; Prompts 29–34 add theirs as rows here, never as engine code.
 *
 * BOSS 2 — IDOL OF THE GILDED GRIN (§A6 Ch.2, 980 HP): alternates between
 * SOLID GOLD (physical immune — use Vibe) and HOLLOW (Vibe immune — swing
 * bats), telegraphing every swap by GRINNING WIDER one turn before it.
 * Cadence: telegraph on boss turns 2, 6, 10…; swap on 3, 7, 11… The HOLLOW
 * reveal is Chapter 2's emotional center: MIA AWAKENS VIBE FREEZE α the
 * moment the gold turns out to be empty ("cold reads what gold hides",
 * ADR-035 — §A11.2, staged sincere) — and Freeze CRACKS the SOLID form's
 * immunity for a beat (crackedBy), so the swap the fight teaches goes both
 * ways: Vibe answers gold, bats answer hollow, and frost makes gold brittle.
 *
 * THE TICK IS NOT HERE — its latch shipped bespoke (S11) and stays law.
 *
 * Types are z.infer'd from src/schemas (ADR-017); `npm run validate` parses
 * every script and pins the Grin's manifest both directions.
 */
import type { BossScriptDef } from '../schemas';

export type { BossScriptDef } from '../schemas';

const B = (b: BossScriptDef): BossScriptDef => b;

export const BOSS_SCRIPTS: Record<string, BossScriptDef> = {
  gilded_grin: B({
    boss: 'gilded_grin',
    initialForm: 'solid',
    forms: [
      {
        id: 'solid',
        name: 'SOLID GOLD',
        physicalImmune: true,
        crackedBy: 'freeze',
        spriteSuffix: '',
        line: 'idol_form_solid',
      },
      {
        id: 'hollow',
        name: 'HOLLOW',
        vibeImmune: true,
        spriteSuffix: '_hollow',
        line: 'idol_form_hollow',
      },
    ],
    awakeningOnForm: { form: 'hollow', awakening: 'cold_reads' },
    phases: [
      {
        id: 'telegraph',
        trigger: { kind: 'turnCount', n: 2, every: 4 },
        once: false,
        actions: [{ kind: 'scriptLine', line: 'idol_grin_wider' }],
      },
      {
        id: 'swap',
        trigger: { kind: 'turnCount', n: 3, every: 4 },
        once: false,
        actions: [{ kind: 'setForm', form: 'cycle' }],
      },
      {
        // S16 (ADR-035 extended): the half-dead DESPERATION blow. The Idol
        // gathers every fleck of gold in the room into one unblockable-looking
        // sheet of light — and JAY throws up a wall that ANSWERS it. POWER
        // SHIELD Σ awakens (the_wall_that_answers; §A11.2-sincere, the second
        // Ch.2 awakening beside Mia's Freeze). Fires ONCE, late, as a moment.
        id: 'the_wall',
        trigger: { kind: 'hpBelow', frac: 0.45 },
        actions: [
          { kind: 'scriptLine', line: 'idol_gathering' },
          { kind: 'awaken', awakening: 'the_wall_that_answers' },
        ],
      },
    ],
  }),

  // BOSS 3 — §A6 Ch.3: HEADMASTER MAINFRAME (1,600 HP), promoted from the forge
  // 'summoner' draft (ADR-046) at the landing. It summons two PREFECT DRONES on the
  // first turn and a fresh pair the instant both are down, FOREVER (bothSummonsDead,
  // repeatable). Milo's SPY reveals the cooling-fan weak point and Vibe FREEZE DOUBLES
  // the hit — that rides the live enemy's data, not the script: weakness ['freeze'] +
  // `weakMul: 2` (enemies.ts) make a freeze hit literally ×2 (the generic §A7 weakness is
  // ×1.5). The 40%-HP OVERCLOCK is the machine's last bluster: flavor only, no new
  // mechanic — the canon gimmick is the summon loop, and the doubled-speed desperation
  // stays the Paper Dragon's identity (Ch.8), kept distinct. The Hush bleeding through
  // mainframe_open is never funny (§A11.3); the bureaucratic horror around it is.
  headmaster_mainframe: B({
    boss: 'headmaster_mainframe',
    phases: [
      {
        id: 'open',
        trigger: { kind: 'turnCount', n: 1 },
        actions: [
          { kind: 'scriptLine', line: 'mainframe_open' },
          { kind: 'summon', enemy: 'prefect_drone', n: 2 },
        ],
      },
      {
        id: 'refill',
        trigger: { kind: 'bothSummonsDead' },
        once: false,
        actions: [
          { kind: 'scriptLine', line: 'mainframe_refill' },
          { kind: 'summon', enemy: 'prefect_drone', n: 2 },
        ],
      },
      {
        id: 'overclock',
        trigger: { kind: 'hpBelow', frac: 0.4 },
        actions: [{ kind: 'scriptLine', line: 'mainframe_overclock' }],
      },
    ],
  }),

  // BOSS 4 — §A6 Ch.4: THE WHISPERWIG (1,800 HP), the `untargetableUntilNoise`
  // template made real. It BURROWS in the Sleeper's ear canal — untargetable —
  // until NOISE drags it out: Vibe Volt, a Firecracker String, or Milo's Bottle
  // Rockets (`groundedBy`; BattleScene.noiseOut honours the list). The surface is
  // PERMANENT (`surfacesTo`), and the first time it shows its face MIA AWAKENS VIBE
  // VOLT α — the thunder-snore in her teeth (awakeningOnForm → `the_thunder_snore`,
  // her Ch.4 emotional beat, §A11.2-sincere). Every 3rd turn it whispers party-wide
  // HUSHED pressure (no Vibe while it's in your ears). Weak to volt (the noise that
  // answers it). mind_immune on the EnemyDef keeps Mind Warp a tempo tool, not a win.
  the_whisperwig: B({
    boss: 'the_whisperwig',
    initialForm: 'burrowed',
    forms: [
      {
        id: 'burrowed',
        name: 'BURROWED',
        untargetable: true,
        groundedBy: ['volt', 'firecracker', 'bottle_rockets'],
        groundedTurns: 3,
        surfacesTo: 'surfaced',
        spriteSuffix: '',
        line: 'whisperwig_burrow',
      },
      {
        id: 'surfaced',
        name: 'SURFACED',
        spriteSuffix: '_exposed',
        line: 'whisperwig_surface',
      },
    ],
    awakeningOnForm: { form: 'surfaced', awakening: 'the_thunder_snore' },
    phases: [
      {
        id: 'open',
        trigger: { kind: 'turnCount', n: 1 },
        actions: [{ kind: 'scriptLine', line: 'whisperwig_open' }],
      },
      {
        // every 3rd turn the whispering swells into party-wide Hushed pressure
        id: 'pressure',
        trigger: { kind: 'turnCount', n: 3, every: 3 },
        once: false,
        actions: [
          { kind: 'scriptLine', line: 'whisperwig_whisper' },
          { kind: 'partyStatus', status: 'hushed', turns: 2 },
        ],
      },
    ],
  }),

  // §A6 / ADR-121 — THE HUSH SENTINEL, the first-night Mars war-construct. This is
  // the "cannot-win-alone / repel" set-piece expressed as DATA: super-Glint
  // (glintSupernova, BattleScene) carries the damage while the script runs to a
  // FIXED repel. Turn 1 it unfolds; turn 2 the old light answers the impossible odds
  // and JAY's VIBE SURGE α awakens mid-battle (moved off the overworld — a kid
  // survives a piece of Mars because the Ember woke, ADR-121 §1.3); every 3rd turn it
  // pulses party-wide Hushed pressure; on turn 5 Glint overloads it and it is
  // REPELLED — endBattleMercy ends the fight as a WIN WITHOUT A KILL (it powers down
  // and sinks into the crater, leaving the husk landmark). It is NOT a manifest boss,
  // so it never fights the money axis; the Sentinel RETURNS far later (Ch.10 callback
  // off the `sentinel_repelled` flag — keep this script + enemy in the roster).
  hush_sentinel: B({
    boss: 'hush_sentinel',
    phases: [
      {
        id: 'open',
        trigger: { kind: 'turnCount', n: 1 },
        actions: [{ kind: 'scriptLine', line: 'sentinel_open' }],
      },
      {
        id: 'surge',
        trigger: { kind: 'turnCount', n: 2 },
        actions: [
          { kind: 'scriptLine', line: 'sentinel_surge' },
          { kind: 'awaken', awakening: 'old_light' },
        ],
      },
      {
        id: 'pressure',
        trigger: { kind: 'turnCount', n: 3, every: 3 },
        once: false,
        actions: [
          { kind: 'scriptLine', line: 'sentinel_pressure' },
          { kind: 'partyStatus', status: 'hushed', turns: 2 },
        ],
      },
      {
        // THE REPEL — Glint, gone supernova, overloads it; it powers down and sinks.
        // endBattleMercy resolves victory without a kill (the Tick is still alive and
        // relocates; no Ember is earned here).
        id: 'repel',
        trigger: { kind: 'turnCount', n: 5 },
        actions: [
          { kind: 'scriptLine', line: 'sentinel_repel' },
          { kind: 'endBattleMercy' },
        ],
      },
    ],
  }),
};
