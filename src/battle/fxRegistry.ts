/**
 * THE FX REGISTRY — S11. Every named battle effect timeline, keyed.
 *
 * AbilityDef.fx (schema-required, ADR-017) resolves HERE. The registry is a
 * canon manifest in the ADR-017 sense: `npm run validate` (and the vitest
 * mirror in fxRegistry.test.ts) fails BOTH directions — an ability whose fx
 * key is unregistered, and a kind-'ability' key no ability references. Items
 * resolve through itemFxKey() the same way; kind-'system' keys are the
 * engine's own vocabulary (enemy impacts, deaths, the Tick's tether, the six
 * pray events, and the Prompt-15 phase-machine hooks) and are exempt from
 * the reverse check — they are invoked by code, not data.
 *
 * Phaser-free on purpose: tools/content-validate.ts imports this file.
 * The builders that turn a spec into moving pixels live in battle/fx.ts.
 */
import { RAMP } from '../palette';

export type FxKind = 'ability' | 'item' | 'system';

/** the visual family battle/fx.ts switches on to build the timeline */
export type FxFamily =
  | 'surge' // Vibe Surge: starburst rings, escalating per tier
  | 'flame_wave' // Vibe Fire: rolling flame wave across the enemy row
  | 'lattice' // Vibe Freeze: crystal lattice grows, then shatters
  | 'bolt' // Vibe Volt: zigzag bolts from the sky
  | 'sparkle_rain' // Lifeup / Healing α: green sparkle rain
  | 'barrier' // Shield / Mirror / Ward / Resolve: hex barrier snap
  | 'reflect_field' // S16 Power Shield: a standing mirror-wall that answers
  | 'spiral' // Hypno / Mind Warp: rotating spiral
  | 'screen_flash' // Flash: field-wide white-out (below the UI — odometer law)
  | 'rocket' // Bottle Rockets: arcing projectile + payload burst; tier = volley
  | 'scan' // Spy: scanline sweep + revealed-stats stamp
  | 'throw_arc' // Salt Shaker: thrown arc (visibly severs the Tick's latch, §A6)
  | 'munch' // food: sparkle at the bust mid-munch
  | 'fizz' // Star Cola: rising fizz
  | 'porchlight' // Glint's Spark: porch-light warmth pooling upward
  | 'comet' // Vibe Comet: falling star streaks
  | 'starsong' // Mia's Starsong: warm gold notes rising into bursting stars
  | 'siphon' // Magnet: PP trickle drawn back to the caster
  | 'wire_cross' // Brainjam: crossed-wire zigzag over the target's head
  | 'revive' // Healing γ: the §A4.7 return
  | 'pray' // dispatches to one of the six pray events by the rolled tier
  | 'pray_event' // one authored pray tier (the six distinct events, §A11.4)
  | 'run_up' // Teleport's overworld run-up; battle never plays it
  | 'overnight' // Milo's Repair — resolves while everyone sleeps
  | 'impact' // per-element impact burst (the enemy-side vocabulary)
  | 'smash' // SMAAASH!! comic burst + shake
  | 'dissolve' // enemy death dissolve (ADR-020: battle sprites float)
  | 'tether' // the Titanic Tick's latch, drawn enemy → card
  | 'sever' // the tether snapping (salt / Vibe Fire)
  | 'summon' // phase-machine hook: the Manager's summons (Prompt 15)
  | 'phase_swap' // phase-machine hook: boss form swaps (Prompt 15)
  | 'guard' // guard brace snap on the card
  | 'heal_glow'; // card heal/revive glow

export interface FxSpec {
  kind: FxKind;
  family: FxFamily;
  /** escalation: surge/flame ring-and-wave scale, rocket volley size… */
  tier?: number;
  /** master-palette ramp driving the family's colors */
  ramp?: number;
  /** synth preset fired at the timeline's hit beat (engine/audio.ts) */
  sfx?: string;
}

const S = (s: FxSpec): FxSpec => s;

export const FX_REGISTRY: Record<string, FxSpec> = {
  /* ---- abilities (reverse-checked: every key referenced by data) ---- */
  surge_a: S({ kind: 'ability', family: 'surge', tier: 1, ramp: RAMP.MAGENTA, sfx: 'fx_surge' }),
  surge_b: S({ kind: 'ability', family: 'surge', tier: 2, ramp: RAMP.MAGENTA, sfx: 'fx_surge' }),
  surge_g: S({ kind: 'ability', family: 'surge', tier: 3, ramp: RAMP.MAGENTA, sfx: 'fx_surge' }),
  surge_o: S({ kind: 'ability', family: 'surge', tier: 4, ramp: RAMP.MAGENTA, sfx: 'fx_surge' }),
  // S16: the fifth rung — the screen-filling chrysanthemum finale (tier 5)
  surge_x: S({ kind: 'ability', family: 'surge', tier: 5, ramp: RAMP.MAGENTA, sfx: 'fx_surge_x' }),
  fire_a: S({ kind: 'ability', family: 'flame_wave', tier: 1, ramp: RAMP.ORANGE, sfx: 'fx_fire' }),
  fire_b: S({ kind: 'ability', family: 'flame_wave', tier: 2, ramp: RAMP.ORANGE, sfx: 'fx_fire' }),
  fire_g: S({ kind: 'ability', family: 'flame_wave', tier: 3, ramp: RAMP.ORANGE, sfx: 'fx_fire' }),
  fire_o: S({ kind: 'ability', family: 'flame_wave', tier: 4, ramp: RAMP.ORANGE, sfx: 'fx_fire' }),
  // Mia's Σ tiers (S-Mia): the fifth rung is a genuine FINALE, not tier 4 scaled
  // up — flame_wave/lattice/bolt all branch tier:5 in fx.ts (the S16 surge pattern).
  fire_x: S({ kind: 'ability', family: 'flame_wave', tier: 5, ramp: RAMP.ORANGE, sfx: 'fx_fire' }),
  freeze_a: S({ kind: 'ability', family: 'lattice', tier: 1, ramp: RAMP.CYAN, sfx: 'fx_freeze' }),
  freeze_b: S({ kind: 'ability', family: 'lattice', tier: 2, ramp: RAMP.CYAN, sfx: 'fx_freeze' }),
  freeze_g: S({ kind: 'ability', family: 'lattice', tier: 3, ramp: RAMP.CYAN, sfx: 'fx_freeze' }),
  freeze_o: S({ kind: 'ability', family: 'lattice', tier: 4, ramp: RAMP.CYAN, sfx: 'fx_freeze' }),
  freeze_x: S({ kind: 'ability', family: 'lattice', tier: 5, ramp: RAMP.CYAN, sfx: 'fx_freeze' }),
  volt_a: S({ kind: 'ability', family: 'bolt', tier: 1, ramp: RAMP.GOLD, sfx: 'fx_volt' }),
  volt_b: S({ kind: 'ability', family: 'bolt', tier: 2, ramp: RAMP.GOLD, sfx: 'fx_volt' }),
  volt_g: S({ kind: 'ability', family: 'bolt', tier: 3, ramp: RAMP.GOLD, sfx: 'fx_volt' }),
  volt_o: S({ kind: 'ability', family: 'bolt', tier: 4, ramp: RAMP.GOLD, sfx: 'fx_volt' }),
  volt_x: S({ kind: 'ability', family: 'bolt', tier: 5, ramp: RAMP.GOLD, sfx: 'fx_volt' }),
  // STARSONG — a NEW family: warm gold notes rising into bursting stars (the
  // anti-Hush light). Tier 5 is the finale (see the 'starsong' case in fx.ts).
  starsong_a: S({ kind: 'ability', family: 'starsong', tier: 1, ramp: RAMP.GOLD, sfx: 'fx_starsong' }),
  starsong_b: S({ kind: 'ability', family: 'starsong', tier: 2, ramp: RAMP.GOLD, sfx: 'fx_starsong' }),
  starsong_g: S({ kind: 'ability', family: 'starsong', tier: 3, ramp: RAMP.GOLD, sfx: 'fx_starsong' }),
  starsong_o: S({ kind: 'ability', family: 'starsong', tier: 4, ramp: RAMP.GOLD, sfx: 'fx_starsong' }),
  starsong_x: S({ kind: 'ability', family: 'starsong', tier: 5, ramp: RAMP.GOLD, sfx: 'fx_starsong' }),
  lifeup: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.GRASS, sfx: 'fx_lifeup' }),
  hypno: S({ kind: 'ability', family: 'spiral', ramp: RAMP.PURPLE, sfx: 'fx_hypno' }),
  shield_snap: S({ kind: 'ability', family: 'barrier', ramp: RAMP.CYAN, sfx: 'fx_shield' }),
  mirror_snap: S({ kind: 'ability', family: 'barrier', ramp: RAMP.PAPER, sfx: 'fx_shield' }),
  // S16 — Jay's expanded kit. Mind Warp reuses the Hypno spiral (aim pose);
  // Ward + Resolve reuse the barrier snap (cast); Power Shield gets its own
  // reflect_field mirror-wall (the dramatic party-wide awakening look).
  mindwarp: S({ kind: 'ability', family: 'spiral', ramp: RAMP.PURPLE, sfx: 'fx_mindwarp' }),
  ward_snap: S({ kind: 'ability', family: 'barrier', ramp: RAMP.GRASS, sfx: 'fx_ward' }),
  reflect_snap: S({ kind: 'ability', family: 'reflect_field', ramp: RAMP.GOLD, sfx: 'fx_reflect' }),
  brace_snap: S({ kind: 'ability', family: 'barrier', ramp: RAMP.RED, sfx: 'fx_brace' }),
  flash: S({ kind: 'ability', family: 'screen_flash', ramp: RAMP.GOLD, sfx: 'fx_flash' }),
  magnet: S({ kind: 'ability', family: 'siphon', ramp: RAMP.MAGENTA, sfx: 'fx_magnet' }),
  pray: S({ kind: 'ability', family: 'pray', ramp: RAMP.GOLD }),
  spy_scan: S({ kind: 'ability', family: 'scan', ramp: RAMP.CYAN, sfx: 'fx_spy' }),
  repair_overnight: S({ kind: 'ability', family: 'overnight', ramp: RAMP.EARTH }),
  rocket: S({ kind: 'ability', family: 'rocket', tier: 1, ramp: RAMP.RED, sfx: 'fx_rocket' }),
  rocket_big: S({ kind: 'ability', family: 'rocket', tier: 2, ramp: RAMP.RED, sfx: 'fx_rocket' }),
  rocket_multi: S({ kind: 'ability', family: 'rocket', tier: 4, ramp: RAMP.RED, sfx: 'fx_rocket' }),
  // Milo "DOUBLED" — six new 0-PP gadgets, every face REUSING an existing family
  // (scan/bolt/lattice/barrier/sparkle_rain/rocket), so STAGE_ANIM and battle/
  // fx.ts need no new rows; only ramp/tier/sfx differ. siege_rocket is the third
  // rocket tier (the boss-buster payload — see the tier:3 branch in fx.ts).
  scope: S({ kind: 'ability', family: 'scan', ramp: RAMP.GOLD, sfx: 'fx_spy' }),
  static_bomb: S({ kind: 'ability', family: 'bolt', tier: 2, ramp: RAMP.GOLD, sfx: 'fx_volt' }),
  cryo_grenade: S({ kind: 'ability', family: 'lattice', tier: 2, ramp: RAMP.CYAN, sfx: 'fx_freeze' }),
  forcefield_gizmo: S({ kind: 'ability', family: 'barrier', ramp: RAMP.CYAN, sfx: 'fx_shield' }),
  med_spray: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.GRASS, sfx: 'fx_cure' }),
  siege_rocket: S({ kind: 'ability', family: 'rocket', tier: 3, ramp: RAMP.RED, sfx: 'fx_rocket' }),
  comet_a: S({ kind: 'ability', family: 'comet', tier: 1, ramp: RAMP.PAPER, sfx: 'fx_comet' }),
  // Dorin's full Comet ladder — β/γ escalate the same falling-star builder (the
  // S16 surge work proves the tier pattern); Ω stays the awakened capstone.
  comet_b: S({ kind: 'ability', family: 'comet', tier: 2, ramp: RAMP.PAPER, sfx: 'fx_comet' }),
  comet_g: S({ kind: 'ability', family: 'comet', tier: 3, ramp: RAMP.PAPER, sfx: 'fx_comet' }),
  // Ω is the awakened capstone — the biggest fall of the ladder (a1/b2/g3/o4)
  comet_o: S({ kind: 'ability', family: 'comet', tier: 4, ramp: RAMP.PAPER, sfx: 'fx_comet' }),
  brainjam: S({ kind: 'ability', family: 'wire_cross', ramp: RAMP.PURPLE, sfx: 'fx_brainjam' }),
  // Dorin's party Mirror + the two martial stances reuse the barrier snap — the
  // tint names the stance (mirror = paper still-water, braced = earth/red,
  // flowing = cyan). No new art, no new STAGE_ANIM rows.
  mirror_o: S({ kind: 'ability', family: 'barrier', ramp: RAMP.PAPER, sfx: 'fx_shield' }),
  stone_stance: S({ kind: 'ability', family: 'barrier', ramp: RAMP.EARTH, sfx: 'fx_guard' }),
  flowing_step: S({ kind: 'ability', family: 'barrier', ramp: RAMP.CYAN, sfx: 'fx_guard' }),
  healing_cure: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.GRASS, sfx: 'fx_cure' }),
  healing_revive: S({ kind: 'ability', family: 'revive', ramp: RAMP.GOLD, sfx: 'fx_revive' }),
  run_up: S({ kind: 'ability', family: 'run_up', ramp: RAMP.ORANGE }),

  /* ---- Pippa's tactical kit (S15h) — every face REUSES an existing family
     (scan/sparkle_rain/barrier), so STAGE_ANIM and battle/fx.ts need no new
     rows; only the ramp + the reused sfx preset differ ---- */
  pinpoint_mark: S({ kind: 'ability', family: 'scan', ramp: RAMP.GOLD, sfx: 'fx_spy' }),
  royal_rally: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.RED, sfx: 'fx_lifeup' }),
  pocket_patch: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.GRASS, sfx: 'fx_cure' }),
  scale_step: S({ kind: 'ability', family: 'barrier', ramp: RAMP.CYAN, sfx: 'fx_shield' }),
  big_little_focus: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.PURPLE, sfx: 'fx_lifeup' }),
  bellwether: S({ kind: 'ability', family: 'barrier', ramp: RAMP.GOLD, sfx: 'fx_shield' }),
  // S15h+ ("The Page's Full Brief") — Pippa's six new faces. All reuse the same
  // three families (scan/sparkle_rain/barrier), so STAGE_ANIM/fx.ts stay frozen;
  // only the ramp + reused sfx preset differ.
  volley_mark: S({ kind: 'ability', family: 'scan', ramp: RAMP.GOLD, sfx: 'fx_spy' }),
  standing_ovation: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.RED, sfx: 'fx_lifeup' }),
  field_dressing: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.GRASS, sfx: 'fx_cure' }),
  diplomatic_immunity: S({ kind: 'ability', family: 'barrier', ramp: RAMP.CYAN, sfx: 'fx_shield' }),
  stern_decree: S({ kind: 'ability', family: 'scan', ramp: RAMP.PURPLE, sfx: 'fx_spy' }),
  the_minutes: S({ kind: 'ability', family: 'sparkle_rain', ramp: RAMP.PURPLE, sfx: 'fx_lifeup' }),

  /* ---- items (reachable through itemFxKey for every battle-usable item) ---- */
  item_food: S({ kind: 'item', family: 'munch', ramp: RAMP.GOLD, sfx: 'fx_munch' }),
  item_cola: S({ kind: 'item', family: 'fizz', ramp: RAMP.CYAN, sfx: 'fx_fizz' }),
  item_salt: S({ kind: 'item', family: 'throw_arc', ramp: RAMP.PAPER, sfx: 'fx_salt' }),
  item_spark: S({ kind: 'item', family: 'porchlight', ramp: RAMP.GOLD, sfx: 'ember' }),
  // S14: the §A8 status cures (Hanky, Aloe Leaf) + the CAMERA FLASH —
  // the Flash family already knew how to blind a room (§A10 #6)
  item_cure: S({ kind: 'item', family: 'sparkle_rain', ramp: RAMP.GRASS, sfx: 'fx_cure' }),
  item_flash: S({ kind: 'item', family: 'screen_flash', ramp: RAMP.GOLD, sfx: 'fx_flash' }),

  /* ---- system vocabulary (engine-invoked; exempt from the reverse check) ---- */
  pray_miraculous: S({ kind: 'system', family: 'pray_event', tier: 6, ramp: RAMP.GOLD, sfx: 'pray_mir' }),
  pray_wonderful: S({ kind: 'system', family: 'pray_event', tier: 5, ramp: RAMP.GOLD, sfx: 'pray_won' }),
  pray_good: S({ kind: 'system', family: 'pray_event', tier: 4, ramp: RAMP.GOLD, sfx: 'pray_good' }),
  pray_nothing: S({ kind: 'system', family: 'pray_event', tier: 3, ramp: RAMP.GOLD, sfx: 'pray_none' }),
  pray_strange: S({ kind: 'system', family: 'pray_event', tier: 2, ramp: RAMP.PURPLE, sfx: 'pray_str' }),
  pray_backfire: S({ kind: 'system', family: 'pray_event', tier: 1, ramp: RAMP.GOLD, sfx: 'pray_back' }),
  impact_physical: S({ kind: 'system', family: 'impact', ramp: RAMP.PAPER, sfx: 'hit' }),
  impact_fire: S({ kind: 'system', family: 'impact', ramp: RAMP.ORANGE, sfx: 'hit' }),
  impact_freeze: S({ kind: 'system', family: 'impact', ramp: RAMP.CYAN, sfx: 'hit' }),
  impact_volt: S({ kind: 'system', family: 'impact', ramp: RAMP.GOLD, sfx: 'hit' }),
  impact_holy: S({ kind: 'system', family: 'impact', ramp: RAMP.GOLD, sfx: 'hit' }),
  smash_burst: S({ kind: 'system', family: 'smash', ramp: RAMP.GOLD, sfx: 'smash' }),
  enemy_dissolve: S({ kind: 'system', family: 'dissolve', ramp: RAMP.PAPER, sfx: 'fx_dissolve' }),
  latch_tether: S({ kind: 'system', family: 'tether', ramp: RAMP.MAGENTA, sfx: 'fx_latch' }),
  tether_sever: S({ kind: 'system', family: 'sever', ramp: RAMP.MAGENTA, sfx: 'fx_sever' }),
  summon_flash: S({ kind: 'system', family: 'summon', ramp: RAMP.BLUE, sfx: 'fx_summon' }),
  phase_swap: S({ kind: 'system', family: 'phase_swap', ramp: RAMP.MAGENTA, sfx: 'fx_phase' }),
  guard_brace: S({ kind: 'system', family: 'guard', ramp: RAMP.CYAN, sfx: 'fx_guard' }),
  heal_glow: S({ kind: 'system', family: 'heal_glow', ramp: RAMP.GRASS, sfx: 'heal' }),
};

/**
 * Battle-usable items resolve to an fx key: explicit id first, then the
 * kind default. The validator walks every `usableInBattle` item through this
 * and fails on null or on an unregistered/non-'item' result.
 */
export const ITEM_FX: Record<string, string> = {
  salt_shaker: 'item_salt',
  glints_spark: 'item_spark',
  camera_flash: 'item_flash',
  // M18 (ADR-063): the Bug Zapper is a thrown battle item — it rides the
  // salt-burst stage (a hurled object that lands hard, §A8 "heavy vs insects")
  bug_zapper: 'item_salt',
  // M19 (ADR-064) — THE OLD-WORLD CATALOG: the thrown battle goods. Milo's
  // repaired gizmos (Ch.3), the Whisperwig's NOISE (Ch.4), and Minimus's wind-up
  // ordnance (Ch.5) all ride the hurled-object salt-burst stage; the spark-coil
  // and the festive cannon flash the room (item_flash).
  spark_coil: 'item_flash',
  cog_grenade: 'item_salt',
  clockwork_sparrow: 'item_salt',
  firecracker_string: 'item_salt',
  snowball_special: 'item_salt',
  tin_soldier: 'item_salt',
  confetti_cannon: 'item_flash',
  // M20 (ADR-065) — THE FAR-WORLD CATALOG: the far-world thrown goods. The
  // hurled bombs/crackers/folded-tiger ride the salt-burst stage; the dust pot
  // and the festive Holi cloud blind the room (item_flash, the §A10 #6 family).
  thornbush_bomb: 'item_salt',
  dust_pot: 'item_flash',
  diwali_cracker: 'item_salt',
  holi_powder: 'item_flash',
  red_firecracker: 'item_salt',
  paper_tiger: 'item_salt',
};

export const ITEM_KIND_FX: Record<string, string | undefined> = {
  food: 'item_food',
  pp: 'item_cola',
  cure: 'item_cure',
};

export function itemFxKey(id: string, kind: string): string | null {
  return ITEM_FX[id] ?? ITEM_KIND_FX[kind] ?? null;
}

/**
 * THE STAGE MAP (S11b) — every FX family resolves a stage anim, right beside
 * the registry it describes. When a hero acts, their battler steps from the
 * card onto the stage and performs this pose while the family's timeline
 * plays: cast families raise arms under the Vibe glow, spiral/scan families
 * aim, throw_arc lobs, pray kneels hands-together (§A11.4 — played
 * straight). 'oncard' families resolve on the bust (food/cola consume at the
 * card; guard braces there); 'none' families are system/enemy-side or
 * out-of-battle vocabulary and never send anyone up. Bash is not a family —
 * BattleScene choreographs the weapon-class swing directly.
 *
 * The validator (and stage mirror in fxRegistry.test.ts) proves BOTH
 * directions: every family the registry uses resolves here, and every row
 * here is a family some registry entry actually uses.
 */
export type StagePose = 'cast' | 'aim' | 'throw' | 'pray' | 'oncard' | 'none';

export const STAGE_ANIM: Record<FxFamily, StagePose> = {
  surge: 'cast',
  reflect_field: 'cast', // S16 Power Shield: Jay throws up the wall, hands raised
  flame_wave: 'cast',
  lattice: 'cast',
  bolt: 'cast',
  sparkle_rain: 'cast',
  barrier: 'cast',
  spiral: 'aim', // Hypno points the spiral at somebody (user direction)
  screen_flash: 'cast',
  rocket: 'throw', // Bottle Rockets keep the throw-arc
  scan: 'aim',
  throw_arc: 'throw',
  munch: 'oncard',
  fizz: 'oncard',
  porchlight: 'oncard', // the Spark is held up at the card, not paraded
  comet: 'cast',
  starsong: 'cast', // Mia raises the song, hands up under the gold glow
  siphon: 'aim', // "{user} held out her palm!"
  wire_cross: 'cast',
  revive: 'pray', // Healing γ speaks an old word, kneeling
  pray: 'pray',
  pray_event: 'none', // the six events answer the kneel — system-invoked
  run_up: 'none',
  overnight: 'none',
  impact: 'none',
  smash: 'none',
  dissolve: 'none',
  tether: 'none',
  sever: 'none',
  summon: 'none',
  phase_swap: 'none',
  guard: 'oncard',
  heal_glow: 'none',
};

/** the stage pose an fx key resolves to (null when the key is unregistered) */
export function stagePoseOf(fxKey: string): StagePose | null {
  const spec = FX_REGISTRY[fxKey];
  return spec ? STAGE_ANIM[spec.family] : null;
}

/** every element resolves to a system impact key (the enemy-side vocabulary) */
export function impactKeyOf(element: string): string {
  switch (element) {
    case 'fire':
      return 'impact_fire';
    case 'freeze':
      return 'impact_freeze';
    case 'volt':
      return 'impact_volt';
    case 'holy':
      return 'impact_holy';
    default:
      return 'impact_physical';
  }
}
