/**
 * PSI GATES (S18 Movement 28, ADR-069) — the §A4.11 "powers as keys" registry:
 * overworld obstacles that REACT to a field-cast PSI key. PSI Fire burns vine
 * walls / lights furnaces / melts ice; PSI Freeze bridges waterfalls/geysers/
 * lakes into crossable ice; PSI Flash reveals hidden ways. Each chapter dungeon
 * seeds ≥1 gate (the validator pins it), with the ability LEARNED first and the
 * gate paying it off — a gate is never the sole teacher, and is non-missable +
 * retry-safe.
 *
 * Like AREA_SKINS (M25), the unlanded chapters' gates are a forward-looking SPEC
 * the dungeon sessions wear when their maps land — no maps required yet. The
 * casting RULES live in `src/engine/psi.ts`; the obstacle art + the TriggerDef
 * wiring land with each dungeon.
 */

/** the three overworld PSI keys (the field "verbs") */
export type PsiKey = 'fire' | 'freeze' | 'flash';

/** what an obstacle IS, and which key answers it */
export type PsiGateKind =
  | 'vine_wall'   // PSI Fire burns it away
  | 'ice_block'   // PSI Fire melts it
  | 'furnace'     // PSI Fire lights it (powers a lift / opens a door)
  | 'cold_pipe'   // PSI Freeze freezes a coolant pipe solid to cross
  | 'waterfall'   // PSI Freeze makes a crossable ice bridge
  | 'geyser'      // PSI Freeze caps it to a step
  | 'hidden_path' // PSI Flash reveals the way
  | 'dark_room';  // PSI Flash lights the room

export interface PsiGateDef {
  id: string;
  /** the chapter band the gate belongs to ('ch3'…'ch10') */
  band: string;
  /** the dungeon/site it seeds (matches a levelkit site id where one exists) */
  site: string;
  kind: PsiGateKind;
  /** the PSI key that clears it (derived-consistent with kind, pinned) */
  key: PsiKey;
  /** the §A11-clear sign that teaches without explaining the joke */
  sign: string;
}

/** kind → the only key that answers it (the validator pins gate.key to this) */
export const GATE_KEY: Record<PsiGateKind, PsiKey> = {
  vine_wall: 'fire',
  ice_block: 'fire',
  furnace: 'fire',
  cold_pipe: 'freeze',
  waterfall: 'freeze',
  geyser: 'freeze',
  hidden_path: 'flash',
  dark_room: 'flash',
};

const G = (g: PsiGateDef): PsiGateDef => g;

/**
 * One seeded gate per chapter dungeon (Ch.3–10), chapter-appropriate. The
 * ability is taught earlier in the same chapter (awakening/level); the gate pays
 * it off. Non-missable + retry-safe by construction (a PSI cast has no cooldown
 * and no fail state — you simply can't pass until you cast).
 */
export const PSI_GATES: Record<string, PsiGateDef> = Object.fromEntries(
  [
    // Ch.3 England — Wintermoor's machine-fog: freeze the academy's coolant pipe
    // solid and walk across it (the prompt's Ch.3 PSI gate).
    G({ id: 'wintermoor_coolant', band: 'ch3', site: 'wintermoor_academy', kind: 'cold_pipe', key: 'freeze', sign: 'COOLANT LINE — DO NOT TOUCH. (It is very, very cold already.)' }),
    // Ch.4 Norway — the Sleeper's Spine: a meltwater fall across the giant's
    // shoulder; freeze it to a bridge.
    G({ id: 'spine_meltfall', band: 'ch4', site: 'sleepers_spine', kind: 'waterfall', key: 'freeze', sign: 'The water comes off the shoulder cold enough to bite. Almost solid. Almost.' }),
    // Ch.5 Minimus — the Hedgerow: a tiny thorn wall, knee-high to you, a forest
    // to them; burn it away.
    G({ id: 'hedgerow_thorns', band: 'ch5', site: 'the_hedgerow', kind: 'vine_wall', key: 'fire', sign: 'ROYAL HEDGE — please do not step over. (You could, easily. Please don\'t.)' }),
    // Ch.6 Africa — the Laughing Ruins: a false wall the dust hides; Flash shows
    // the real doorway.
    G({ id: 'ruins_falsewall', band: 'ch6', site: 'laughing_ruins', kind: 'hidden_path', key: 'flash', sign: 'The laughter comes from the wall that isn\'t there. Look harder.' }),
    // Ch.7 India — the night train / palace approach: a dark baggage car; light it.
    G({ id: 'train_darkcar', band: 'ch7', site: 'night_train', kind: 'dark_room', key: 'flash', sign: 'BAGGAGE CAR — lamp\'s out. Mind the trunks.' }),
    // Ch.8 China — the Spore Forest: a hot-spring geyser blocking the path; cap it.
    G({ id: 'spore_geyser', band: 'ch8', site: 'spore_forest', kind: 'geyser', key: 'freeze', sign: 'The spring breathes on a count. Cross on its out-breath — or just stop it breathing.' }),
    // Ch.9 Romania — Castle Hoaxula: a stage-prop brazier that opens the wing when lit.
    G({ id: 'castle_brazier', band: 'ch9', site: 'castle_hoaxula', kind: 'furnace', key: 'fire', sign: 'PROP BRAZIER (real flame sold separately). The wing door is wired to it.' }),
    // Ch.10 Mars — the Sea of Silence: a vine of frozen dark across the last hall;
    // burn it to keep moving as the music thins.
    G({ id: 'mars_darkvine', band: 'ch10', site: 'sea_of_silence', kind: 'vine_wall', key: 'fire', sign: 'Something grew here in the cold and the quiet. It does not want you to pass.' }),
  ].map((g) => [g.id, g]),
);

/** the bands that MUST carry ≥1 PSI gate (every chapter that has a dungeon) */
export const PSI_DUNGEON_BANDS: readonly string[] = ['ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10'];
