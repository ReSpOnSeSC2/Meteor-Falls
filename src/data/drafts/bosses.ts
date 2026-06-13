/**
 * FORGED BOSS DRAFTS (S15g Movement Three, ADR-046) — every UNSHIPPED §A6 boss
 * (Ch.3–9) plus both Ch.10 minibosses, instantiated from the ten templates
 * (src/levelkit/forge/bosses.ts) at their canon HP/threshold numbers. DRAFTS
 * ARE NOT CONTENT (Prime Law 1): these live under src/data/drafts/**, parse as
 * BossScriptDef, but are EXCLUDED from BOSS_SCRIPTS, the §A6 manifest, and the
 * §B4 sweep — they cannot masquerade as the shipped Grin. Promotion is a human
 * act: a chapter session moves its boss into src/data/bosses.ts and the tone
 * editor rewrites every `*_draft` dialogue id into a real §A11 line.
 *
 * Ch.1 Tick + Ch.2 Grin are SHIPPED (bespoke / data/bosses.ts) and absent here.
 * Ch.10's finale (THE HUSH) is bespoke like the Tick — not one of the ten
 * templates — and lands with the finale, not the forge.
 *
 * The draft dialogue ids (`*_draft`) and the boss/minion enemy ids they drive
 * (headmaster_mainframe, prefect_drone, flat_bell, …) are UNSHIPPED — they
 * resolve to canon only at promotion. Determinism is trivial: static data, no
 * Date.now()/Math.random() (Prime Law 2).
 */
import type { BossScriptDef, RiddleDef } from '../../schemas';
import {
  airborneGrounded,
  elementalGolem,
  mercyEnding,
  riddle,
  scriptedSurvival,
  summoner,
  thresholdHeal,
  untargetableUntilNoise,
} from '../../levelkit/forge/bosses';

/** the §A6 Ch.6 Sphinx ships a pool of 8 (a replay asks a different one) —
 *  DRAFT riddles, rewritten by the tone editor at promotion. */
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

export const DRAFT_BOSS_SCRIPTS: Record<string, BossScriptDef> = {
  /* Ch.3 — HEADMASTER MAINFRAME (1,600 HP): refills its Prefect Drones forever */
  headmaster_mainframe: summoner('headmaster_mainframe', {
    minion: 'prefect_drone',
    n: 2,
    openLine: 'mainframe_open_draft',
  }),

  /* Ch.4 — THE WHISPERWIG (1,900 HP): burrowed/untargetable until noise; hush */
  the_whisperwig: untargetableUntilNoise('the_whisperwig', {
    burrowed: { id: 'burrowed', name: 'BURROWED', spriteSuffix: '', line: 'whisperwig_burrow_draft' },
    exposed: { id: 'exposed', name: 'FORCED OUT', spriteSuffix: '_exposed', line: 'whisperwig_out_draft' },
    noise: ['volt', 'firecracker'],
    awakening: 'thunder_snore', // Mia's Vibe Volt α (draft awakening id)
    hush: { every: 3, turns: 2 },
  }),

  /* Ch.5 — WHISKERZILLA (2,150 HP): the Flat Bell grants evasion; it gets bored */
  whiskerzilla: scriptedSurvival('whiskerzilla', {
    bell: { enemy: 'flat_bell', n: 1, ringLine: 'whisker_bell_draft', brokenLine: 'whisker_purr_draft' },
    pounce: { every: 3, line: 'whisker_pounce_draft' },
    boredAt: 12,
    boredLine: 'whisker_bored_draft',
  }),

  /* Ch.6 — THE LAUGHING SPHINX (2,300 HP): a riddle; right stuns, wrong cries */
  laughing_sphinx: riddle('laughing_sphinx', {
    intro: 'sphinx_intro_draft',
    pool: SPHINX_RIDDLES,
    stunTurns: 3,
    wrong: { status: 'crying', turns: 3 },
  }),

  /* Ch.7 — COBRA RAJA (3,200 HP): sheds skin once at 40% (+800), gaze every 3 */
  cobra_raja: thresholdHeal('cobra_raja', {
    frac: 0.4,
    healAmount: 800,
    healLine: 'raja_shed_draft',
    gaze: { every: 3, status: 'paralyzed', turns: 2 },
  }),

  /* Ch.8 — THE PAPER DRAGON (4,100 HP): airborne physical-immune; self-immolates */
  paper_dragon: airborneGrounded('paper_dragon', {
    airborne: { id: 'airborne', name: 'AIRBORNE', spriteSuffix: '', line: 'dragon_air_draft' },
    noise: ['volt', 'bottle_rockets'],
    groundedTurns: 2,
    desperateAt: 0.3,
    desperateLine: 'dragon_burn_draft',
    speedMul: 2,
    burning: { id: 'burning', name: 'BURNING', spriteSuffix: '_burning', line: 'dragon_burning_draft' },
  }),

  /* Ch.9 — COUNT HOAXULA (5,300 HP): steals gear, unmasks at 50%, Pray = mercy */
  count_hoaxula: mercyEnding('count_hoaxula', {
    theatrical: { id: 'theatrical', name: 'THEATRICAL', spriteSuffix: '', line: 'hoaxula_theatrical_draft' },
    unmasked: { id: 'unmasked', name: 'UNMASKED', spriteSuffix: '_unmasked', line: 'hoaxula_unmasked_draft' },
    unmaskAt: 0.5,
    unmaskLine: 'hoaxula_unmask_draft',
    stealAt: 2,
    stealLine: 'hoaxula_steal_draft',
    prayTier: 'good',
  }),

  /* Ch.10 minibosses — the WRONG element heals the golem (crackedBy is the key) */
  frost_sentinel: elementalGolem('frost_sentinel', {
    form: { id: 'frost', name: 'FROST SHELL', spriteSuffix: '' },
    weakTo: 'fire', // fire melts it
    healedBy: 'freeze', // frost feeds it
    slam: { every: 3, line: 'frost_slam_draft' },
  }),

  tiki_magma_golem: elementalGolem('tiki_magma_golem', {
    form: { id: 'magma', name: 'MAGMA CORE', spriteSuffix: '' },
    weakTo: 'freeze', // cold quenches it
    healedBy: 'fire', // fire stokes it
    slam: { every: 3, line: 'tiki_slam_draft' },
  }),
};

/** the unshipped bosses the forge instantiates, pinned (the COUNT is law — ten
 *  Embers/Heartlights/bosses; Ch.1 Tick + Ch.2 Grin shipped, Ch.10 Hush is the
 *  bespoke finale, leaving these seven + the two minibosses). */
export const DRAFT_BOSS_IDS = [
  'headmaster_mainframe',
  'the_whisperwig',
  'whiskerzilla',
  'laughing_sphinx',
  'cobra_raja',
  'paper_dragon',
  'count_hoaxula',
  'frost_sentinel',
  'tiki_magma_golem',
] as const;
