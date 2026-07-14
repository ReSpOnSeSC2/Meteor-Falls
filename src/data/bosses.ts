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
import type { BossScriptDef, RiddleDef } from '../schemas';

export type { BossScriptDef } from '../schemas';

const B = (b: BossScriptDef): BossScriptDef => b;

/** §A6 Ch.6 — THE LAUGHING SPHINX ships a pool of 8 (a replay asks a different one;
 *  BattleScene picks one and the riddle phases consume the answer). */
const SPHINX_RIDDLES: RiddleDef[] = [
  { q: 'I have a face and two hands but no arms. What am I?', options: ['A clock', 'A liar', 'The desert'], correct: 0 },
  { q: 'What gets wetter the more it dries?', options: ['A river', 'A towel', 'A cloud'], correct: 1 },
  { q: 'The more you take, the more you leave behind. What are they?', options: ['Coins', 'Footsteps', 'Regrets'], correct: 1 },
  { q: 'What has many keys but opens no doors?', options: ['A piano', 'A jailer', 'A map'], correct: 0 },
  { q: 'I speak without a mouth and hear without ears. What am I?', options: ['A ghost', 'An echo', 'The wind'], correct: 1 },
  { q: 'What runs all around a yard yet never moves?', options: ['A dog', 'A fence', 'The sun'], correct: 1 },
  { q: 'What can you catch but never throw?', options: ['A cold', 'A ball', 'A nap'], correct: 0 },
  { q: 'What has a neck but no head?', options: ['A giraffe', 'A bottle', 'A road'], correct: 1 },
];

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

  // BOSS 3 — §A6 Ch.3: HEADMASTER MAINFRAME (750 HP), the live summoner
  // script promoted from ADR-046. It summons two PREFECT DRONES on the
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

  // §A6 Ch.5 — WHISKERZILLA (4,000 HP): an ordinary lost housecat; the duchy's
  // KAIJU, asleep on the crown jewel. A MERCY/SURVIVAL, not a kill (the
  // `scriptedSurvival` template, expanded inline). Turn 1 the FLAT BELL appears
  // (a summoned 150-HP second target) and its ringing grants Whiskerzilla evasion
  // (setEvasion on). Every 3rd turn the tail wiggles → POUNCE: the party is knocked
  // Flat → Paralyzed 1 turn (Defend braces it — the Halberd Column taught this).
  // BREAK the bell (bothSummonsDead) → the purr gives every move away (evasion off).
  // On turn 12 it gets BORED, yawns, and the Duchess KNIGHTS it: endBattleMercy ends
  // the fight as a WIN WITHOUT A KILL. No elemental weakness (the gimmick is the bell
  // + the Defend read); mind_immune rides the EnemyDef. Heartlight 5 — The Bell Choir.
  whiskerzilla: B({
    boss: 'whiskerzilla',
    phases: [
      {
        // turn 1 — the Flat Bell drops in, ringing; Whiskerzilla blurs (evasion on)
        id: 'ring',
        trigger: { kind: 'turnCount', n: 1 },
        actions: [
          { kind: 'scriptLine', line: 'whisker_bell_ring' },
          { kind: 'summon', enemy: 'flat_bell', n: 1 },
          { kind: 'setEvasion', on: true },
        ],
      },
      {
        // every 3rd turn — the tail-wiggle POUNCE knocks the party Flat (Paralyzed 1)
        id: 'pounce',
        trigger: { kind: 'turnCount', n: 3, every: 3 },
        once: false,
        actions: [
          { kind: 'scriptLine', line: 'whisker_pounce' },
          { kind: 'partyStatus', status: 'paralyzed', turns: 1 },
        ],
      },
      {
        // break the Flat Bell → the purr telegraphs every move (evasion off)
        id: 'broken',
        trigger: { kind: 'bothSummonsDead' },
        actions: [
          { kind: 'setEvasion', on: false },
          { kind: 'scriptLine', line: 'whisker_purr' },
        ],
      },
      {
        // turn 12 — it gets bored and wanders off, ennobled (a non-kill victory)
        id: 'bored',
        trigger: { kind: 'turnCount', n: 12 },
        actions: [
          { kind: 'scriptLine', line: 'whisker_bored' },
          { kind: 'endBattleMercy' },
        ],
      },
    ],
  }),

  // §A6 Ch.6 — THE LAUGHING SPHINX (9,000 HP): naps in its own carved chin and opens
  // on a RIDDLE (BattleScene reads `riddle`, asks one of the eight on the ask widget).
  // A RIGHT answer staggers it — it stuns ITSELF three turns (stunSelf), a free window
  // to burn it down. A WRONG answer is the safe rewind sandbox the Held Breath was for:
  // the whole party starts Crying three turns (partyStatus) — undoable with NO Trust
  // cost (ADR-126). No elemental weakness; mind_immune rides the EnemyDef. The `riddle`
  // template (forge/bosses.ts), expanded inline with real §A11 dialogue ids. Heartlight 6.
  laughing_sphinx: B({
    boss: 'laughing_sphinx',
    riddle: { intro: 'sphinx_riddle_intro', pool: SPHINX_RIDDLES },
    phases: [
      {
        // a RIGHT answer — the Sphinx is so delighted it stuns itself laughing (3 turns)
        id: 'right',
        trigger: { kind: 'riddleAnswered', ok: true },
        actions: [
          { kind: 'scriptLine', line: 'sphinx_right' },
          { kind: 'stunSelf', turns: 3 },
        ],
      },
      {
        // a WRONG answer — the laugh gets into the whole party (Crying 3 turns); this is
        // the rewind-safe teaching moment (undo it with the Held Breath, no Trust cost)
        id: 'wrong',
        trigger: { kind: 'riddleAnswered', ok: false },
        actions: [
          { kind: 'scriptLine', line: 'sphinx_wrong' },
          { kind: 'partyStatus', status: 'crying', turns: 3 },
        ],
      },
    ],
  }),

  // §A6 Ch.7 — THE COBRA RAJA (20,000 HP): coils on the stolen crown in the usurped
  // throne room. Every 3rd turn it meets the eye with a PARALYZING gaze that holds the
  // whole party (the `gaze` phase — block it with Shield Σ or Mia's Magnet), and once at
  // 40% HP it SHEDS its skin and HEALS +800 (the `shed` threshold — burn it down fast
  // through the gap). The `thresholdHeal` template (forge/bosses.ts), expanded inline
  // with real §A11 dialogue ids. No elemental weakness; mind_immune rides the EnemyDef.
  // Heartlight 7. Money > combat: 20,000 HP sits far under the Ch.7 Fortune target ($8M).
  cobra_raja: B({
    boss: 'cobra_raja',
    phases: [
      {
        // at 40% HP it sheds its skin in one shudder and heals back 800 (once)
        id: 'shed',
        trigger: { kind: 'hpBelow', frac: 0.4 },
        actions: [
          { kind: 'scriptLine', line: 'cobra_shed' },
          { kind: 'healSelf', amount: 800 },
        ],
      },
      {
        // every 3rd turn — the paralyzing gaze holds the whole party (Paralyzed 2 turns)
        id: 'gaze',
        trigger: { kind: 'turnCount', n: 3, every: 3 },
        once: false,
        actions: [
          { kind: 'scriptLine', line: 'cobra_gaze' },
          { kind: 'partyStatus', status: 'paralyzed', turns: 2 },
        ],
      },
    ],
  }),

  // §A6 Ch.8 — THE PAPER DRAGON (45,000 HP): the Mt. Shu monks fold paper guardians, but
  // the Hush got into the paper. It coils on the temple bell, immune to physical while
  // AIRBORNE — Vibe Volt or Milo's Bottle Rockets ground it for two turns (the window
  // physical lands, the same suspension the Grin's crack uses) — and burned under 30% HP
  // it casts Vibe Fire on ITSELF (it's paper) into a desperate BURNING form at doubled
  // speed. The `airborneGrounded` template (forge/bosses.ts), expanded inline with real
  // §A11 dialogue ids. No elemental weakness; mind_immune rides the EnemyDef. Heartlight 8.
  // Money > combat: 45,000 HP sits far under the Ch.8 Fortune target ($60M).
  paper_dragon: B({
    boss: 'paper_dragon',
    initialForm: 'airborne',
    forms: [
      {
        id: 'airborne',
        name: 'AIRBORNE',
        physicalImmune: true,
        groundedBy: ['volt', 'bottle_rockets'],
        groundedTurns: 2,
        spriteSuffix: '',
        line: 'dragon_air',
      },
      {
        id: 'burning',
        name: 'BURNING',
        spriteSuffix: '_burning',
        line: 'dragon_burning',
      },
    ],
    phases: [
      {
        // under 30% HP it sets ITSELF alight — the burning form at doubled speed (once)
        id: 'desperate',
        trigger: { kind: 'hpBelow', frac: 0.3 },
        actions: [
          { kind: 'setForm', form: 'burning' },
          { kind: 'scriptLine', line: 'dragon_burn' },
          { kind: 'setSpeedMul', mul: 2 },
        ],
      },
    ],
  }),

  // §A6 / ADR-126 — COUNT HOAXULA (the Romania landing): the valley's "vampire" is a
  // Hushed theme-park actor from Cleveland, broke and armed with stolen Vibe. THEATRICAL
  // phase — fake spells, real damage; on turn 2 he palms one of the party's equipped
  // items (returned on win). UNMASKED at 50% HP — the cape drops, the Cleveland accent
  // sobs through and the attacks become desperate. Mia's PRAY at "good" tier or better
  // ends the second phase in MERCY; BattleScene restores any stolen gear atomically.
  // The `mercyEnding` template (forge/bosses.ts), expanded inline with real §A11 dialogue
  // ids. Weak to FIRE (he is paper, wax, and greasepaint); mind_immune rides the EnemyDef.
  // Heartlight 9. Money > combat: 95,000 HP sits far under the Ch.9 Fortune target ($400M).
  count_hoaxula: B({
    boss: 'count_hoaxula',
    initialForm: 'theatrical',
    forms: [
      {
        id: 'theatrical',
        name: 'THEATRICAL',
        spriteSuffix: '',
        line: 'hoaxula_theatrical',
      },
      {
        id: 'unmasked',
        name: 'UNMASKED',
        spriteSuffix: '_unmasked',
        line: 'hoaxula_unmasked',
      },
    ],
    phases: [
      {
        // turn 2 — he palms one equipped item with a flourish (returned on any win)
        id: 'steal',
        trigger: { kind: 'turnCount', n: 2 },
        actions: [
          { kind: 'scriptLine', line: 'hoaxula_steal' },
          { kind: 'stealEquipped' },
        ],
      },
      {
        // ADR-134 — the reference boss TELEGRAPH (the reusable wind-up hook, adopted
        // as a data beat): every 3rd turn the Count throws his cape wide and COMMANDS
        // THE NIGHT — a wind-up you can READ. The bat-swarm blow lands his NEXT turn
        // (a heavy party-wide hit + a blinding swirl) and near-wipes a squishy party
        // UNLESS they answer THAT turn: BREAK him (fire is his weakness — chip his
        // composure to 0 and the charge COLLAPSES), freeze/sleep him, or WARD/SHIELD
        // the blow (mitigateIncoming still bites it). Jay's ward suite + the Break
        // system become necessary ON CUE — exactly the §4.5 telegraph intent.
        id: 'command_windup',
        trigger: { kind: 'turnCount', n: 3, every: 3 },
        once: false,
        actions: [{
          kind: 'windup',
          line: 'hoaxula_command',
          amount: 800,
          element: 'volt',
          status: 'crying',
          turns: 1,
        }],
      },
      {
        // under 50% HP — the cape comes off and the man from Cleveland is underneath
        id: 'unmask',
        trigger: { kind: 'hpBelow', frac: 0.5, inclusive: true, form: 'theatrical' },
        actions: [
          { kind: 'scriptLine', line: 'hoaxula_unmask' },
          { kind: 'setForm', form: 'unmasked' },
        ],
      },
      {
        // Mia's Pray at "good" or better — the quiet mercy that ends it (returns the gear)
        id: 'mercy',
        trigger: { kind: 'prayTierAtLeast', tier: 'good', form: 'unmasked' },
        // BattleScene's terminal mercy effect atomically freezes the outcome,
        // returns the exact stolen slot, then presents the ending copy.
        actions: [{ kind: 'endBattleMercy' }],
      },
    ],
  }),

  // §A6 / ADR-130 — THE FROST SENTINEL (Ch.10 Alaska miniboss, promoted from the
  // elementalGolem draft): a glacial war-construct guarding the Aurora ice road. Its
  // FROST SHELL is physical-immune — gadgets and bats clang off the ice — until Mia's
  // FIRE CRACKS it (crackedBy), after which everyone can land for a beat. Every 3rd turn
  // it slams a paralyzing cold across the party. 50,000 HP (MINIBOSS_HP); a gauntlet
  // GATE on the way to the launch, not the boss. The intro/win lines play in the scene.
  frost_sentinel: B({
    boss: 'frost_sentinel',
    initialForm: 'frost',
    forms: [
      { id: 'frost', name: 'FROST SHELL', spriteSuffix: '', physicalImmune: true, crackedBy: 'fire', healedBy: 'freeze' },
    ],
    phases: [
      {
        id: 'slam',
        trigger: { kind: 'turnCount', n: 3, every: 3 },
        once: false,
        actions: [{ kind: 'partyStatus', status: 'paralyzed', turns: 1 }],
      },
    ],
  }),

  // §A6 / ADR-130 — THE TIKI MAGMA GOLEM (Ch.10 Hawaii miniboss, promoted from the
  // elementalGolem draft): a carved volcanic-stone tiki with a magma heart barring the
  // Mauna Lani launch road. Mirror of the Sentinel: its MAGMA CORE is physical-immune
  // until Mia's FREEZE quenches the shell (crackedBy), and every 3rd turn it washes the
  // party in sunburn heat. 50,000 HP; the second gauntlet GATE.
  tiki_magma_golem: B({
    boss: 'tiki_magma_golem',
    initialForm: 'magma',
    forms: [
      { id: 'magma', name: 'MAGMA CORE', spriteSuffix: '', physicalImmune: true, crackedBy: 'freeze', healedBy: 'fire' },
    ],
    phases: [
      {
        id: 'slam',
        trigger: { kind: 'turnCount', n: 3, every: 3 },
        once: false,
        actions: [{ kind: 'partyStatus', status: 'sunburn', turns: 2 }],
      },
    ],
  }),

  // §A6 / ADR-126–130 — THE HUSH (Ch.10 finale, Mars / the Sea of Silence): the bespoke
  // 150,000-HP finale shell (like the Tick, not one of the ten templates), run as a
  // three-movement fight. Movement 1 "THE STATIC" — a normal damage race. Movement 2
  // "THE QUIET" (at 50% HP) — the Hush stops fighting back and goes UN-touchably quiet:
  // the QUIET form is physicalImmune, so swings and gadgets clang into the silence — but
  // WARMTH still reaches it (Vibe and PRAY are never immune; the IRON path's STOLEN LIGHT
  // routes as Vibe to chip it here, BattleScene). HP keeps falling to warmth, so there is
  // no soft-lock. Every third turn the grief rolls out across the party (hushed). At 12%
  // the Hush is REACHED, not killed (endBattleMercy — win without a kill); the SILENCE vs
  // FORGIVE resolution (THE CALLING / THE ANSWER), the name-confirm, the Homesong, and the
  // walk home are driven by OverworldScene.theHushBossScene + the composed ending. The
  // Hush is never reduced to nothing (a hp<=0 clamp rides it in BattleScene). Weakness []
  // (no element answers loneliness); mind_immune rides the EnemyDef. 150,000 « the $3B
  // Ch.10 Fortune target — money still owns the big numbers.
  the_hush: B({
    boss: 'the_hush',
    initialForm: 'static',
    forms: [
      { id: 'static', name: 'THE STATIC', spriteSuffix: '' },
      // the QUIET shares the base sprite (suffix '') — the un-touchable hush is a behavior
      // swap (physicalImmune), not a re-texture; warmth (Vibe/PRAY) still reaches it
      { id: 'quiet', name: 'THE QUIET', spriteSuffix: '', physicalImmune: true },
    ],
    phases: [
      {
        // Movement 1 opens — a wall of white noise and cold
        id: 'static_open',
        trigger: { kind: 'turnCount', n: 1 },
        actions: [{ kind: 'scriptLine', line: 'hush_static' }],
      },
      {
        // Movement 2 at 50% — it goes un-touchably QUIET (physical clangs; warmth reaches)
        id: 'quiet',
        trigger: { kind: 'hpBelow', frac: 0.5 },
        actions: [
          { kind: 'setForm', form: 'quiet' },
          { kind: 'scriptLine', line: 'hush_quiet' },
          { kind: 'partyStatus', status: 'hushed', turns: 2 },
        ],
      },
      {
        // the grief rolls out across the party, again and again, through the Quiet —
        // a TIDE that lands as real HP (partyDamage, ~25% of a finale hero's bar, healable)
        // AND flattens every voice (hushed). The "survive while you reach it" pressure of
        // the QUIET movement: the FORGIVE meter (BattleScene warmth) races this clock.
        id: 'grief',
        trigger: { kind: 'turnCount', n: 4, every: 3 },
        once: false,
        actions: [
          { kind: 'scriptLine', line: 'hush_grief' },
          { kind: 'partyDamage', amount: 120 },
          { kind: 'partyStatus', status: 'hushed', turns: 2 },
        ],
      },
      {
        // at 12% the Hush is REACHED — the fight ends without a kill; the scene takes over
        id: 'falls',
        trigger: { kind: 'hpBelow', frac: 0.12 },
        actions: [
          { kind: 'scriptLine', line: 'hush_falls' },
          { kind: 'endBattleMercy' },
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
