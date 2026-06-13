/**
 * Zod schemas — runtime mirrors of every content interface (GAME_BIBLE §B1,
 * Prompt 8 / S5). The src/data modules infer their compile-time types FROM
 * these schemas (z.infer), so static types and runtime validation cannot
 * drift: adding a field here changes the data modules' types, and a data
 * entry the schema rejects fails `npm run validate` (the first leg of
 * `npm test`). The game itself never parses — data modules import these
 * types with `import type`, so zod stays out of the shipped bundle.
 *
 * Cross-references BETWEEN collections (door targets, dialogue ids, enemy
 * ids, stock ids…) live in tools/content-validate.ts, not here — a schema
 * sees one entity at a time.
 */
import { z } from 'zod';

/* ---------------- shared ---------------- */

// S15h (ADR-048): the cast expands to FIVE — Pippa Quill, the Minimus royal
// page (§A3, joins Ch.5). Engine ids stay frozen (rex/faye like ADR-031/023);
// 'pippa' is her own id from the start.
export const HeroIdSchema = z.enum(['rex', 'faye', 'milo', 'dorin', 'pippa']);
export type HeroId = z.infer<typeof HeroIdSchema>;

/** the six EB-DNA stats (§A3) */
export const StatsSchema = z.strictObject({
  offense: z.number().min(0),
  defense: z.number().min(0),
  speed: z.number().min(0),
  guts: z.number().min(0),
  vibe: z.number().min(0),
  luck: z.number().min(0),
});
export type Stats = z.infer<typeof StatsSchema>;

export const FacingSchema = z.enum(['down', 'left', 'right', 'up']);
export type Facing = z.infer<typeof FacingSchema>;

/* ---------------- heroes (§A3) ---------------- */

/** HP/PP growth: base + lin·(L−1) + quad·(L−1)² */
export const GrowthCurveSchema = z.strictObject({
  base: z.number().min(0),
  lin: z.number().min(0),
  quad: z.number().min(0),
});

export const HeroDefSchema = z.strictObject({
  id: HeroIdSchema,
  name: z.string().min(1),
  epithet: z.string().min(1),
  weapon: z.string().min(1),
  base: StatsSchema,
  /** linear growth per level for each stat */
  growth: StatsSchema,
  hp: GrowthCurveSchema,
  pp: GrowthCurveSchema,
  unlocks: z.array(
    z.strictObject({ level: z.number().int().min(1), ability: z.string().min(1) }),
  ),
});
export type HeroDef = z.infer<typeof HeroDefSchema>;

/** exhaustive by construction: a missing hero key fails the parse */
export const HeroesSchema = z.record(HeroIdSchema, HeroDefSchema);

/* ---------------- abilities + PRAY (§A3) ---------------- */

export const AbilityKindSchema = z.enum(['vibe', 'gadget', 'pray', 'physical']);
export type AbilityKind = z.infer<typeof AbilityKindSchema>;

export const TargetModeSchema = z.enum(['enemy', 'enemies', 'ally', 'allies', 'self']);
export type TargetMode = z.infer<typeof TargetModeSchema>;

export const ElementSchema = z.enum(['fire', 'freeze', 'volt', 'holy', 'physical', 'none']);
export type Element = z.infer<typeof ElementSchema>;

export const AbilityDefSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: AbilityKindSchema,
  pp: z.number().min(0),
  /** damage or heal base power (scaled by Vibe stat in formulas) */
  power: z.number().min(0),
  heal: z.boolean().optional(),
  target: TargetModeSchema,
  element: ElementSchema,
  status: z.string().min(1).optional(),
  text: z.string().min(1),
  /** S11: REQUIRED battle-effect key into battle/fxRegistry.ts — every
   *  ability gets a face. The validator checks the registry both directions. */
  fx: z.string().min(1),
});
export type AbilityDef = z.infer<typeof AbilityDefSchema>;

export const AbilitiesSchema = z.record(z.string().min(1), AbilityDefSchema);

/** §A3's canon variance table — six tiers, weighted (validator pins the
 *  exact 10/20/30/25/10/5 and the sum of 100) */
export const PrayTierSchema = z.enum([
  'miraculous',
  'wonderful',
  'good',
  'nothing',
  'strange',
  'backfire',
]);
export type PrayTier = z.infer<typeof PrayTierSchema>;

export const PrayWeightsSchema = z.strictObject({
  miraculous: z.number().int().min(0),
  wonderful: z.number().int().min(0),
  good: z.number().int().min(0),
  nothing: z.number().int().min(0),
  strange: z.number().int().min(0),
  backfire: z.number().int().min(0),
});
export type PrayWeights = z.infer<typeof PrayWeightsSchema>;

/* ---------------- enemies (§A7 + §A6 bosses) ---------------- */

/** S14 adds the §A7 Ch.2 vocabulary: 'stealcash' (Pickpocket Parrot — the
 *  pending-cash theft, recovered on victory), 'gild' (Gilded Beetle's gold
 *  form: physical-immune turns), and 'shield' (Step-Mask casts Shield). */
export const MoveKindSchema = z.enum(['attack', 'strong', 'status', 'latch', 'drain', 'steal', 'taunt', 'stealcash', 'gild', 'shield']);
export type MoveKind = z.infer<typeof MoveKindSchema>;

export const EnemyMoveSchema = z.strictObject({
  name: z.string().min(1),
  kind: MoveKindSchema,
  /** multiplier on enemy offense for damage moves */
  mult: z.number().positive().optional(),
  /** S16: the damage CLASS of an attack/strong move. Omitted = 'physical' (the
   *  EB default, and what every shipped enemy is). An elemental value lets a
   *  foe deal fire/freeze/volt/holy — which Jay's WARD halves and his SHIELD
   *  does NOT, so the layered-ward system has something to answer (the build
   *  prompt §C "fire boss"). 'none' = unblockable-by-ward typeless damage. */
  element: ElementSchema.optional(),
  status: z.enum(['sunburn', 'crying', 'asleep', 'productive', 'paralyzed']).optional(),
  text: z.string().min(1),
  weight: z.number().positive(),
});
export type EnemyMove = z.infer<typeof EnemyMoveSchema>;

export const EnemyDefSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  article: z.string(), // "The" for the intro line
  hp: z.number().int().positive(),
  offense: z.number().min(0),
  defense: z.number().min(0),
  speed: z.number().min(0),
  level: z.number().int().min(1), // for instant-win checks
  exp: z.number().int().min(0),
  cash: z.number().int().min(0),
  weakness: z.array(z.enum(['fire', 'freeze', 'volt', 'insect', 'salt'])),
  /** §A7: every enemy has 2–4 moves… */
  moves: z.array(EnemyMoveSchema).min(2).max(4),
  /** …and one flavor death line */
  deathLine: z.string().min(1),
  sprite: z.string().min(1),
  mini: z.string().min(1),
  /** humanoid enemies roam as full character sheets (4-dir walk) instead of a mini */
  walker: z.string().min(1).optional(),
  /** psychedelic battle-bg palette ramps [a, b] */
  bg: z.tuple([z.number(), z.number()]),
  boss: z.boolean().optional(),
  /** S16: Jay's MIND WARP ('puppet') cannot grip this foe — bosses are
   *  mind_immune by design so control stays a crowd/tempo tool, never an
   *  "I win" on a boss (§A3 amended; the build prompt §4). Elites instead
   *  ROLL a level-scaled resist; only the truly immune carry this flag. */
  mind_immune: z.boolean().optional(),
});
export type EnemyDef = z.infer<typeof EnemyDefSchema>;

export const EnemiesSchema = z.record(z.string().min(1), EnemyDefSchema);

/* ---------------- items (§A8, ADR-015/016) ---------------- */

/** equipment slots per Prompt 19 (weapon/body/arms/other) */
export const EquipSlotSchema = z.enum(['weapon', 'body', 'arms', 'other']);
export type EquipSlot = z.infer<typeof EquipSlotSchema>;

/** S9 adds: 'charm' (the 'other' equip slot — Lucky Collar) and 'valuable'
 *  (sell-fodder and quest goods — Fresh Stamps, the lemonade supplies).
 *  S10 adds: 'armor' (the 'body' slot — the Champion Jacket is §A8's first).
 *  S12 adds: 'arms' (the 'arms' slot — THE STARTING FOUR, the Classic's
 *  first-title prize, carry speed/guts the way armor carries defense).
 *  S14 adds: 'basket' (§A4.5 — Picnic Baskets, table-only use). */
export const ItemKindSchema = z.enum(['weapon', 'food', 'pp', 'cure', 'battle', 'key', 'charm', 'valuable', 'armor', 'arms', 'basket']);
export type ItemKind = z.infer<typeof ItemKindSchema>;

export const ItemDefSchema = z
  .strictObject({
    id: z.string().min(1),
    name: z.string().min(1),
    kind: ItemKindSchema,
    heal: z.number().positive().optional(),
    /** PP restored on use (§A8 "PP" items — the Star Cola line, S4) */
    ppHeal: z.number().positive().optional(),
    offense: z.number().positive().optional(),
    /** armor ('body' slot) defense bonus — §A10 Champion Jacket, S10 */
    defense: z.number().positive().optional(),
    /** charm ('other' slot) luck bonus — §A10 Lucky Collar, S9 */
    luck: z.number().positive().optional(),
    /** arms-slot stat bonuses — THE STARTING FOUR (S12): each piece carries
     *  exactly one of these; battle + STATUS read through heroSpeed/heroGuts */
    speed: z.number().positive().optional(),
    guts: z.number().positive().optional(),
    /** §A8 weapon lines are personal — only this hero can equip it */
    wielder: HeroIdSchema.optional(),
    /** battle item damage */
    power: z.number().positive().optional(),
    /** breaks the Tick's latch (§A6 Boss 1 gimmick) */
    breaksLatch: z.boolean().optional(),
    /** S14: a battle item that lands a status on every enemy instead of
     *  damage — the CAMERA FLASH (§A10 #6) blinds the room into Crying */
    status: z.enum(['crying', 'asleep', 'paralyzed']).optional(),
    /** S14: survives use (the CAMERA FLASH is a flash, not film) */
    reusable: z.boolean().optional(),
    cures: z.array(z.string().min(1)).optional(),
    usableInBattle: z.boolean(),
    price: z.number().int().min(0),
    text: z.string().min(1),
  })
  .superRefine((item, ctx) => {
    // S4 pairing (ADR-016): kind 'pp' ⇔ ppHeal — the Star Cola line extends
    // by adding items, never by half-tagging one side of the pair
    if (item.kind === 'pp' && item.ppHeal === undefined) {
      ctx.addIssue({ code: 'custom', message: `'${item.id}' is kind 'pp' but has no ppHeal` });
    }
    if (item.kind !== 'pp' && item.ppHeal !== undefined) {
      ctx.addIssue({ code: 'custom', message: `'${item.id}' has ppHeal but kind '${item.kind}' — PP items are kind 'pp'` });
    }
    // §A8: every weapon line is personal, and equipping reads its offense
    if (item.kind === 'weapon' && item.wielder === undefined) {
      ctx.addIssue({ code: 'custom', message: `weapon '${item.id}' needs a wielder tag (§A8 lines are personal)` });
    }
    if (item.kind === 'weapon' && item.offense === undefined) {
      ctx.addIssue({ code: 'custom', message: `weapon '${item.id}' needs an offense value` });
    }
    // S9 pairing: kind 'charm' ⇔ luck — same rule shape as 'pp' ⇔ ppHeal
    if (item.kind === 'charm' && item.luck === undefined) {
      ctx.addIssue({ code: 'custom', message: `'${item.id}' is kind 'charm' but has no luck bonus` });
    }
    if (item.kind !== 'charm' && item.luck !== undefined) {
      ctx.addIssue({ code: 'custom', message: `'${item.id}' has luck but kind '${item.kind}' — luck rides charms` });
    }
    // S10 pairing: kind 'armor' ⇔ defense — body gear must actually defend
    if (item.kind === 'armor' && item.defense === undefined) {
      ctx.addIssue({ code: 'custom', message: `'${item.id}' is kind 'armor' but has no defense bonus` });
    }
    if (item.kind !== 'armor' && item.defense !== undefined) {
      ctx.addIssue({ code: 'custom', message: `'${item.id}' has defense but kind '${item.kind}' — defense rides armor` });
    }
    // S12 pairing: kind 'arms' ⇔ exactly one of speed/guts — the same rule
    // shape as 'pp' ⇔ ppHeal, applied to THE STARTING FOUR's slot
    const armsStats = [item.speed, item.guts].filter((v) => v !== undefined).length;
    if (item.kind === 'arms' && armsStats !== 1) {
      ctx.addIssue({ code: 'custom', message: `'${item.id}' is kind 'arms' but carries ${armsStats} of speed/guts — exactly one` });
    }
    if (item.kind !== 'arms' && armsStats > 0) {
      ctx.addIssue({ code: 'custom', message: `'${item.id}' has speed/guts but kind '${item.kind}' — those ride 'arms' gear` });
    }
  });
export type ItemDef = z.infer<typeof ItemDefSchema>;

export const ItemsSchema = z.record(z.string().min(1), ItemDefSchema);

/* ---------------- shops (Prompt 20, ADR-016) ---------------- */

export const ShopDefSchema = z.strictObject({
  id: z.string().min(1),
  /** window title for the buy/sell lists */
  name: z.string().min(1),
  /** npc id of the keeper standing at the counter */
  keeperNpc: z.string().min(1),
  /** §A8 catalog ids on the shelf */
  stock: z.array(z.string().min(1)).min(1),
  /** dialogue id: the keeper's hello (their obsession lives here) */
  greet: z.string().min(1),
  /** dialogue id: the keeper's goodbye */
  farewell: z.string().min(1),
});
export type ShopDef = z.infer<typeof ShopDefSchema>;

export const ShopsSchema = z.record(z.string().min(1), ShopDefSchema);

/* ---------------- maps (ADR-004 grids; S1/S2/S4 fields) ---------------- */

/** collision box in px relative to a prop image */
export const SolidRectSchema = z.strictObject({
  ox: z.number(),
  oy: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});

export const PropDefSchema = z.strictObject({
  sprite: z.string().min(1),
  /** tile coords of the prop's top-left (fractional allowed — jitter, ADR-012) */
  x: z.number(),
  y: z.number(),
  solid: SolidRectSchema.optional(),
  /** door rectangle in px (relative to prop) that transitions maps */
  door: z
    .strictObject({
      ox: z.number(),
      oy: z.number(),
      w: z.number().positive(),
      h: z.number().positive(),
      to: z.string().min(1),
      tx: z.number(),
      ty: z.number(),
    })
    .optional(),
  /** only built when this flag is truthy (e.g. the holding-room cot) */
  ifFlag: z.string().min(1).optional(),
  /** hidden once this flag is truthy (S9: a sniffed paw-print clue retires) */
  unlessFlag: z.string().min(1).optional(),
});
export type PropDef = z.infer<typeof PropDefSchema>;

export const NpcDefSchema = z.strictObject({
  id: z.string().min(1),
  sprite: z.string().min(1),
  x: z.number(),
  y: z.number(),
  facing: FacingSchema,
  dialogue: z.string().min(1),
  /** S15c: spoken INSTEAD of `dialogue` once the map is in daylight (the
   *  story-night clock or MapDef.night decides) — the town talks about the
   *  night differently after it survives it. Optional; validator-swept. */
  dialogueDay: z.string().min(1).optional(),
  wander: z.boolean().optional(),
  /** special rendering: dog uses its own anim set */
  dog: z.boolean().optional(),
  /** flag gates: only present when ifFlag is truthy / unlessFlag is falsy */
  ifFlag: z.string().min(1).optional(),
  unlessFlag: z.string().min(1).optional(),
  /** S4: talking to this NPC opens the shop with this SHOPS id */
  shop: z.string().min(1).optional(),
});
export type NpcDef = z.infer<typeof NpcDefSchema>;

export const SignDefSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
  dialogue: z.string().min(1),
  /** S9: flag gates, the NpcDef pattern — quest clues exist only mid-trail */
  ifFlag: z.string().min(1).optional(),
  unlessFlag: z.string().min(1).optional(),
});
export type SignDef = z.infer<typeof SignDefSchema>;

/** visible marker: mat (default in interiors — legal alone only for
 *  bottom-edge exits since S11b), stairs, elevator doors (ADR-011), a real
 *  swinging DOOR mounted in the wall band (S11b — REQUIRED for interior
 *  facing-'up' zones; the validator enforces the law), or none (map edges) */
export const DoorIndicatorSchema = z.enum(['mat', 'stairs', 'elevator', 'door', 'none']);

export const DoorZoneSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  to: z.string().min(1),
  tx: z.number(),
  ty: z.number(),
  facing: FacingSchema,
  indicator: DoorIndicatorSchema.optional(),
});
export type DoorZone = z.infer<typeof DoorZoneSchema>;

export const TileRectSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});

export const SpawnerDefSchema = z.strictObject({
  enemies: z.array(z.string().min(1)).min(1), // group rolled per spawn
  count: z.number().int().positive(),
  rect: TileRectSchema, // tiles
  /** spawn only when this flag is truthy */
  ifFlag: z.string().min(1).optional(),
  /** stop spawning once this flag is truthy (S9: the mail-route Lawnmower
   *  guards Mr. Sodd's slot only until that letter lands) */
  unlessFlag: z.string().min(1).optional(),
});
export type SpawnerDef = z.infer<typeof SpawnerDefSchema>;

export const TriggerDefSchema = z.strictObject({
  id: z.string().min(1),
  rect: TileRectSchema, // tiles
  once: z.boolean(),
});
export type TriggerDef = z.infer<typeof TriggerDefSchema>;

/**
 * Sight-line patrol (Department of Smiles; Prompt 29's prefects reuse this):
 * walks the route in a loop (2 waypoints = ping-pong), facing its direction
 * of travel. Spotting the player = alert + chase; contact = battle, not fail.
 */
export const PatrolDefSchema = z.strictObject({
  id: z.string().min(1),
  enemy: z.string().min(1),
  /** tile waypoints (fractional allowed for fine corridor placement) */
  route: z.array(z.tuple([z.number(), z.number()])).min(1),
  /** sight-line length in tiles (default 5) */
  sight: z.number().positive().optional(),
  /**
   * S2 PRODUCTIVITY LOCK: a patrolBattle victory sets this flag, and the
   * patrol stays down across map re-entry once it's set (its quota counted).
   * Floor 3's three Smilers each carry one; all three open the holding room.
   */
  countFlag: z.string().min(1).optional(),
});
export type PatrolDef = z.infer<typeof PatrolDefSchema>;

export const SettlementSchema = z.enum(['city', 'town', 'village']);

export const PointSchema = z.strictObject({ x: z.number(), y: z.number() });

export const MapDefSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  music: z.string().min(1).nullable(),
  night: z.boolean().optional(),
  interior: z.boolean().optional(),
  /** settlements get ADR-012 organic looseness; 'city' additionally must pass
   *  the Brickton rules (multi-street grid + connector + multiple block
   *  faces) — maps.test.ts sweeps every map tagged 'city' */
  settlement: SettlementSchema.optional(),
  grid: z.array(z.string().min(1)).min(1),
  props: z.array(PropDefSchema),
  npcs: z.array(NpcDefSchema),
  signs: z.array(SignDefSchema),
  phones: z.array(PointSchema),
  /** S4: ATM interaction points (withdraw/deposit, Prompt 20) */
  atms: z.array(PointSchema).optional(),
  doors: z.array(DoorZoneSchema),
  spawners: z.array(SpawnerDefSchema),
  triggers: z.array(TriggerDefSchema),
  patrols: z.array(PatrolDefSchema).optional(),
});
export type MapDef = z.infer<typeof MapDefSchema>;

export const MapsSchema = z.record(z.string().min(1), MapDefSchema);

/* ---------------- dialogue (Prompt 6) ---------------- */

/** one script: ordered pages; @-prefix marks speech (renders as •, ADR-010) */
export const DialogueScriptSchema = z.array(z.string().min(1)).min(1);
export type DialogueScript = z.infer<typeof DialogueScriptSchema>;

export const DialogueSetSchema = z.record(z.string().min(1), DialogueScriptSchema);

/* ---------------- quests (§A10 — schema lands ahead of S9's data) -------- */

export const QuestObjectiveSchema = z.strictObject({
  id: z.string().min(1),
  /** journal line, in voice (§A11 — "Find Biscuit. He smells like pond.") */
  text: z.string().min(1),
  /** flag set when this step completes */
  flag: z.string().min(1),
});
export type QuestObjective = z.infer<typeof QuestObjectiveSchema>;

/** §A10: every completed quest adds a CALLER to the finale (§A6 Ch.8) */
export const CallerSchema = z.strictObject({
  name: z.string().min(1),
  /** one-line phone quote, §A11 tone */
  quote: z.string().min(1),
  /** scripted finale effect of this caller's Vibe */
  effect: z.strictObject({
    kind: z.enum(['damage', 'heal']),
    power: z.number().positive(),
  }),
});
export type Caller = z.infer<typeof CallerSchema>;

export const QuestDefSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  chapter: z.number().int().min(1).max(8),
  /** npc id of the quest giver */
  giver: z.string().min(1).optional(),
  /** flag set when the giver's ask lands — 'active' derives from it (S9) */
  startFlag: z.string().min(1),
  objectives: z.array(QuestObjectiveSchema).min(1),
  /** item id granted on completion */
  rewardItem: z.string().min(1).optional(),
  /** flag set when the whole quest completes (the CALLER ledger keys off it) */
  doneFlag: z.string().min(1),
  caller: CallerSchema,
});
export type QuestDef = z.infer<typeof QuestDefSchema>;

export const QuestsSchema = z.record(z.string().min(1), QuestDefSchema);

/**
 * One earned caller on the save — the LEDGER entry (S9, the first real new
 * save field since v2; §A6 Ch.8 iterates these for the finale's phone-ring
 * vignettes). The §A10 record is FROZEN at completion time: the finale
 * replays what the player actually earned, in the order they earned it,
 * even if quest data shifts in a later patch.
 */
export const CallerRecordSchema = z.strictObject({
  /** the completed quest's id */
  quest: z.string().min(1),
  ...CallerSchema.shape,
});
export type CallerRecord = z.infer<typeof CallerRecordSchema>;

/**
 * One row of the ARCADE LEGEND high-score table — the save v4 field (S10,
 * §A10 #4). The table is seeded with the Manager's lonely "MGR" row (the
 * locked_arcade2 attract-mode gag, canon since S2 gave MGR a face); beating
 * the top row once completes quest #4, and the cabinet stays endlessly
 * replayable from any save (§A10: "replayable").
 */
export const ArcadeScoreSchema = z.strictObject({
  /** three letters, classic cabinet rules (the grid can type what it types) */
  initials: z.string().min(1).max(3),
  score: z.number().int().min(0),
});
export type ArcadeScore = z.infer<typeof ArcadeScoreSchema>;

/* ---------------- THE CAGE (S12 — Brickton streetball) ---------------- */

/** the on-court read of one athlete, 0–99 per axis (data-tuned):
 *  spd = wheels · sht = release/range · dnk = rim power · dfn = swipes+walls */
export const AthleteRatingSchema = z.strictObject({
  spd: z.number().min(0).max(99),
  sht: z.number().min(0).max(99),
  dnk: z.number().min(0).max(99),
  dfn: z.number().min(0).max(99),
});
export type AthleteRating = z.infer<typeof AthleteRatingSchema>;

/** honest archetypes — opponent AI plays these straight, never the score
 *  (NO rubber-banding, S12 law) */
export const HoopsArchetypeSchema = z.enum(['rusher', 'sniper', 'post', 'hawk', 'balanced']);
export type HoopsArchetype = z.infer<typeof HoopsArchetypeSchema>;

/**
 * One of the 31 Classic entrants (§A11 local color — the Pigeon Counters,
 * the Quota Crushers, Permit's nephews…). `tier` 1–5 seeds the bracket and
 * derives the five athletes' ratings via teamRatings(); `jersey` is the
 * palette ramp their sport sheets dress in.
 */
export const TeamDefSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  /** one line of chalk-talk, §A11 voice — shown at the board before tip */
  taunt: z.string().min(1),
  archetype: HoopsArchetypeSchema,
  /** 1 = round-one fodder … 5 = title-game material */
  tier: z.number().int().min(1).max(5),
  /** jersey palette ramp index */
  jersey: z.number().int().min(0).max(15),
});
export type TeamDef = z.infer<typeof TeamDefSchema>;

/**
 * A named WALK-ON who fills the party's five (Chad guests pre-Milo). The
 * sprite id must be a CAST member — walk-ons are established §A11 locals,
 * never invented heroes (they fill the FIVE, never the PARTY).
 */
export const WalkOnDefSchema = z.strictObject({
  id: z.string().min(1),
  /** display name on the card + PERMIT's call */
  name: z.string().min(1),
  /** CAST sprite id their sport sheet derives from (validator-checked) */
  sprite: z.string().min(1),
  /** the tiny §A11 stat line (scouting report, one sentence) */
  line: z.string().min(1),
  rating: AthleteRatingSchema,
  archetype: HoopsArchetypeSchema,
  /** bench availability gates (Chad: unlessFlag 'milo_joined') */
  ifFlag: z.string().min(1).optional(),
  unlessFlag: z.string().min(1).optional(),
});
export type WalkOnDef = z.infer<typeof WalkOnDefSchema>;

/**
 * THE BRICKTON CLASSIC bracket — save v5 data (S12). 32 slots: 'party' plus
 * 31 TEAMS ids, in bracket order (slot 2k plays slot 2k+1). `round` is the
 * next round the player plays (0..4); `results` holds each completed round's
 * winners in slot order, so the chalk board redraws from history alone.
 */
export const HoopsBracketSchema = z.strictObject({
  seed: z.number().int(),
  round: z.number().int().min(0).max(4),
  field: z.array(z.string().min(1)).length(32),
  results: z.array(z.array(z.string().min(1))),
});
export type HoopsBracket = z.infer<typeof HoopsBracketSchema>;

/**
 * A live Classic match, checkpointed AT QUARTER BREAKS (S12): score, clock,
 * quarter ride the save so process death costs at most the quarter in
 * progress. `quarter` is the next one to play (1-based; ≥5 = overtime).
 */
export const HoopsCheckpointSchema = z.strictObject({
  opponent: z.string().min(1),
  round: z.number().int().min(0).max(4),
  seed: z.number().int(),
  quarter: z.number().int().min(1),
  scoreUs: z.number().int().min(0),
  scoreThem: z.number().int().min(0),
  /** ms on the game clock when the checkpointed quarter starts */
  clockMs: z.number().int().min(0),
});
export type HoopsCheckpoint = z.infer<typeof HoopsCheckpointSchema>;

/**
 * A story-triggered Vibe grant (S12b/ADR-035): heroes no longer start with
 * Vibe — abilities AWAKEN at scene-staged moments and ride the save as
 * flags. Availability = level unlocks ∪ awakened flags.
 */
export const AwakeningDefSchema = z.strictObject({
  id: z.string().min(1),
  hero: HeroIdSchema,
  ability: z.string().min(1),
  flag: z.string().min(1),
  /** DIALOGUE id of the awakening pages (§A11, validator-swept) */
  dialogue: z.string().min(1),
  /** toast line under the jingle — {tokens} resolve through vars() */
  toast: z.string().min(1),
});
export type AwakeningDef = z.infer<typeof AwakeningDefSchema>;

/** the whole v5 field — tournament state IS save data (S12) */
export const HoopsStateSchema = z.strictObject({
  bracket: HoopsBracketSchema.nullable(),
  match: HoopsCheckpointSchema.nullable(),
  /** Classic titles won (first pays THE STARTING FOUR; repeats pay cash) */
  titles: z.number().int().min(0),
  /** STARTING FOUR ids already handed over — the hands-full raincheck
   *  ledger (PERMIT keeps the rest warm; zero missables) */
  handed: z.array(z.string().min(1)),
  /** total matches finished — seeds each pickup run's rng deterministically */
  played: z.number().int().min(0),
});
export type HoopsState = z.infer<typeof HoopsStateSchema>;

/* ================= COSTA ESTRELLA LINKS (S13) ================= */

/** a px point inside a hole's grid space */
export const LinksVecSchema = z.strictObject({ x: z.number(), y: z.number() });
export type LinksVec = z.infer<typeof LinksVecSchema>;

/**
 * One authored hole (S13): RLE terrain rows (T tee · F fairway · R rough ·
 * S sand · W water/surf · G green · C cliff), §A11 name + plaque (the
 * validator counts nine and sweeps the strings), and the green's HONEST
 * break — the slope arrows draw exactly what the putt physics apply.
 */
export const LinksHoleSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  par: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  plaque: z.string().min(1),
  rle: z.array(z.string().regex(/^(\d+\*)?[TFRSWGC\d]+$/)).min(6),
  tee: LinksVecSchema,
  pin: LinksVecSchema,
  slope: LinksVecSchema,
});
export type HoleDef = z.infer<typeof LinksHoleSchema>;

/** a club in the bag (B cycles it): carry/roll in yards, loft eats wind */
export const ClubDefSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  carry: z.number().positive(),
  roll: z.number().min(0),
  loft: z.number().min(0).max(1),
  /** the third tap's perfect half-window (smaller = harder) */
  accWindow: z.number().positive(),
});
export type ClubDef = z.infer<typeof ClubDefSchema>;

/**
 * One of the 31 Invitational golfers (§A11 names; honest curves — match
 * results roll off acc/agg and NEVER read the player's score, the no-
 * rubber-banding law extended to the links).
 */
export const GolferDefSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  /** one line of clubhouse §A11 (the bracket board shows it) */
  line: z.string().min(1),
  /** 0..1: how often the hole goes their way */
  acc: z.number().min(0).max(1),
  /** 0..1: variance — aggressive golfers make eagles AND doubles */
  agg: z.number().min(0).max(1),
  /** 1 = round-one fodder … 5 = final material */
  tier: z.number().int().min(1).max(5),
});
export type GolferDef = z.infer<typeof GolferDefSchema>;

/* ============ THE BOSS PHASE MACHINE (S14 — Bible Prompt 15) ============ */

/**
 * Declarative boss-gimmick triggers (§A6). The interpreter in
 * src/battle/phases.ts is Phaser-free and proven headlessly, so Prompts
 * 29–34 land their bosses as DATA — never new engine code.
 *  - hpBelow fires once when the boss's hp fraction first drops below frac
 *    (Cobra Raja's skin-shed at 40%).
 *  - turnCount fires at the boss's nth turn; `every` repeats it on a cycle
 *    (the Gilded Grin telegraphs at 2, 6, 10… and swaps at 3, 7, 11…).
 *  - bothSummonsDead fires whenever every summoned unit is down and at
 *    least one summon has been made (the Mainframe's refill).
 *  - riddleAnswered fires when the opening riddle resolves that way
 *    (the Sphinx, §A6 Ch.4).
 *  - prayTierAtLeast fires when a Pray resolves at this tier or better
 *    (Hoaxula's mercy end — the game's quietest victory).
 */
export const PhaseTriggerSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('hpBelow'), frac: z.number().gt(0).lt(1) }),
  z.strictObject({
    kind: z.literal('turnCount'),
    n: z.number().int().min(1),
    every: z.number().int().min(1).optional(),
  }),
  z.strictObject({ kind: z.literal('bothSummonsDead') }),
  z.strictObject({ kind: z.literal('riddleAnswered'), ok: z.boolean() }),
  z.strictObject({ kind: z.literal('prayTierAtLeast'), tier: PrayTierSchema }),
]);
export type PhaseTrigger = z.infer<typeof PhaseTriggerSchema>;

/**
 * Phase actions — the Prompt-15 vocabulary plus the two the §A6 riddle
 * consequences demand (stunSelf: "skip its first 3 turns"; partyStatus:
 * "wrong = party starts Crying"). setForm 'cycle' advances to the next
 * form in the boss's forms list, wrapping — alternation as one phase def.
 */
export const PhaseActionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('setForm'), form: z.string().min(1) }),
  z.strictObject({ kind: z.literal('summon'), enemy: z.string().min(1), n: z.number().int().min(1).max(4) }),
  z.strictObject({ kind: z.literal('healSelf'), amount: z.number().int().positive() }),
  z.strictObject({ kind: z.literal('scriptLine'), line: z.string().min(1) }),
  z.strictObject({ kind: z.literal('stealEquipped') }),
  z.strictObject({ kind: z.literal('returnStolen') }),
  z.strictObject({ kind: z.literal('setSpeedMul'), mul: z.number().positive() }),
  z.strictObject({ kind: z.literal('endBattleMercy') }),
  z.strictObject({ kind: z.literal('stunSelf'), turns: z.number().int().min(1) }),
  /** S15g M3c: Whiskerzilla's Flat Bell rings → the boss is evasive until the
   *  bell breaks; the scene reads `evasion` the way it reads `speedMul`. */
  z.strictObject({ kind: z.literal('setEvasion'), on: z.boolean() }),
  /** S15g M3c: the latch archetype (the §A6 Ch.1 Titanic Tick's shape, made a
   *  TEMPLATE — the shipped Tick stays bespoke engine law). The boss clamps a
   *  hero and drains `amount` HP each turn; the scene reads `latchAmount` and
   *  applies it, releasing on the cure hit (`releaseLatch`). */
  z.strictObject({ kind: z.literal('latch'), amount: z.number().int().positive() }),
  z.strictObject({
    kind: z.literal('partyStatus'),
    status: z.enum(['crying', 'asleep', 'paralyzed', 'sunburn', 'hushed']),
    turns: z.number().int().min(1),
  }),
]);
export type PhaseAction = z.infer<typeof PhaseActionSchema>;

/** the NOISE sources that ground an airborne/burrowed form (S15g M3c, ADR-046):
 *  Vibe Volt and the two fireworks the §A6 Ch.4/Ch.8 fights teach. A form lists
 *  the ones that reach it in `groundedBy`; `noiseOut` honours the list. */
export const NoiseSourceSchema = z.enum(['volt', 'firecracker', 'bottle_rockets']);
export type NoiseSource = z.infer<typeof NoiseSourceSchema>;

/** one boss form (the Gilded Grin's SOLID GOLD / HOLLOW, the Paper Dragon's
 *  airborne/grounded). Immunities zero the matching damage class; crackedBy
 *  names the element that suspends them for a beat (Vibe Freeze makes the
 *  gold BRITTLE — the §A6 Ch.2 edge case the fight teaches).
 *
 *  S15g M3c (ADR-046) adds the FORGE template fields, all optional so the
 *  shipped Grin parses byte-identical: `untargetable` (the Whisperwig burrows
 *  off-target until noise), `groundedBy`/`groundedTurns` (the noise that
 *  suspends airborne physical-immunity or surfaces a burrow, §A6 Ch.4/Ch.8),
 *  `surfacesTo` (the form a burrow swaps INTO when noise lands — the awakening
 *  beat), and `healedBy` (the elemental golem the WRONG element heals, §A6
 *  Ch.10 minibosses). */
export const BossFormDefSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  physicalImmune: z.boolean().optional(),
  vibeImmune: z.boolean().optional(),
  crackedBy: ElementSchema.optional(),
  /** texture suffix on EnemyDef.sprite for this form ('' = the base art) */
  spriteSuffix: z.string(),
  /** DIALOGUE id printed when the boss takes this form */
  line: z.string().min(1).optional(),
  /** the boss cannot be targeted in this form until NOISE forces it out */
  untargetable: z.boolean().optional(),
  /** noise sources that ground this form (suspend immunity / surface a burrow) */
  groundedBy: z.array(NoiseSourceSchema).min(1).optional(),
  /** how many boss turns a grounding lasts (default 2 — the Paper Dragon beat) */
  groundedTurns: z.number().int().min(1).optional(),
  /** the form this one SURFACES into when noise lands (the Whisperwig's reveal) */
  surfacesTo: z.string().min(1).optional(),
  /** the WRONG element — it HEALS this form instead of harming it (golems) */
  healedBy: ElementSchema.optional(),
});
export type BossFormDef = z.infer<typeof BossFormDefSchema>;

export const BossPhaseDefSchema = z.strictObject({
  id: z.string().min(1),
  trigger: PhaseTriggerSchema,
  actions: z.array(PhaseActionSchema).min(1),
  /** default true — a phase fires once. turnCount with `every` repeats. */
  once: z.boolean().optional(),
});
export type BossPhaseDef = z.infer<typeof BossPhaseDefSchema>;

/** one riddle of the §A6 Ch.4 pool (built now, the Sphinx consumes later) */
export const RiddleDefSchema = z.strictObject({
  q: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
  correct: z.number().int().min(0),
});
export type RiddleDef = z.infer<typeof RiddleDefSchema>;

export const BossScriptDefSchema = z
  .strictObject({
    /** the §A7/§A6 enemy this machine drives */
    boss: z.string().min(1),
    initialForm: z.string().min(1).optional(),
    forms: z.array(BossFormDefSchema).optional(),
    /** the battle opens on this riddle (N-way ask; §A6 Ch.4) */
    riddle: z
      .strictObject({
        /** DIALOGUE id of the asking pages */
        intro: z.string().min(1),
        pool: z.array(RiddleDefSchema).min(1),
      })
      .optional(),
    /** S14/ADR-035: a mid-battle AWAKENING staged the first time the boss
     *  takes this form (Mia's Freeze at the HOLLOW reveal — Ch.2's center) */
    awakeningOnForm: z
      .strictObject({ form: z.string().min(1), awakening: z.string().min(1) })
      .optional(),
    phases: z.array(BossPhaseDefSchema),
  })
  .superRefine((s, ctx) => {
    if (s.initialForm && !s.forms?.some((f) => f.id === s.initialForm)) {
      ctx.addIssue({ code: 'custom', message: `initialForm '${s.initialForm}' is not in forms` });
    }
    if (s.awakeningOnForm && !s.forms?.some((f) => f.id === s.awakeningOnForm?.form)) {
      ctx.addIssue({ code: 'custom', message: `awakeningOnForm aims at unknown form '${s.awakeningOnForm.form}'` });
    }
    for (const f of s.forms ?? []) {
      if (f.surfacesTo && !s.forms?.some((g) => g.id === f.surfacesTo)) {
        ctx.addIssue({ code: 'custom', message: `form '${f.id}' surfacesTo unknown form '${f.surfacesTo}'` });
      }
    }
    for (const r of s.riddle?.pool ?? []) {
      if (r.correct >= r.options.length) {
        ctx.addIssue({ code: 'custom', message: `riddle "${r.q.slice(0, 24)}…" marks correct=${r.correct} with ${r.options.length} options` });
      }
    }
    for (const p of s.phases) {
      for (const a of p.actions) {
        if (a.kind === 'setForm' && a.form !== 'cycle' && !s.forms?.some((f) => f.id === a.form)) {
          ctx.addIssue({ code: 'custom', message: `phase '${p.id}' setForm aims at unknown form '${a.form}'` });
        }
      }
      if (p.trigger.kind === 'turnCount' && p.trigger.every !== undefined && p.once === true) {
        ctx.addIssue({ code: 'custom', message: `phase '${p.id}' repeats (every) but is marked once` });
      }
    }
  });
export type BossScriptDef = z.infer<typeof BossScriptDefSchema>;

/* ============ THE LEVELKIT — recipes + drafts (S15g, ADR-044) ============ */

/**
 * Generator inputs (recipe + seed → identical bytes, Prime Law 2). These are
 * DEV-TIME shapes: the levelkit (src/levelkit/**) imports the z.infer'd types
 * with `import type`, so zod stays out of the game bundle exactly like every
 * content interface (ADR-017). The generated output is plain MapDef — the
 * scene runtime never knows a map was generated.
 */

/** §A7 chapter band a map's spawners draw from (Movement Two enforces bands) */
export const EncounterBandSchema = z.enum([
  'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10',
]);
export type EncounterBand = z.infer<typeof EncounterBandSchema>;

/** style PACKS are data: each names a region's prop palette + ground read
 *  (bazaar-port ≠ fog-stone ≠ painted-gates). The generators dress from the
 *  pack; the structure (ADR-012 grammar) is style-independent. */
export const SettlementStyleSchema = z.enum([
  'americana',    // Ch.1 — Otterbrook/Brickton
  'bazaar-port',  // Ch.6 — Zanzibel (the recipe example)
  'fog-stone',    // Ch.3 — Foggybottom
  'painted-gates',// Ch.8 — Lotus Harbor
  'spire-canton', // Ch.5 — Minimus Major
]);
export type SettlementStyle = z.infer<typeof SettlementStyleSchema>;

export const InteriorTemplateSchema = z.enum([
  'home', 'shop', 'hospital', 'chapel', 'deli', 'civic', 'hotel',
]);
export type InteriorTemplate = z.infer<typeof InteriorTemplateSchema>;

export const RouteStyleSchema = z.enum(['treeline', 'fenced', 'coast', 'ridge']);
export type RouteStyle = z.infer<typeof RouteStyleSchema>;

export const WildStyleSchema = z.enum(['forest', 'moor']);
export type WildStyle = z.infer<typeof WildStyleSchema>;

/** one §A5 leg per recipe — the masked-reel travel scenes */
export const TravelLegSchema = z.enum(['bus', 'boat', 'train', 'riverboat', 'snowcat', 'biplane']);
export type TravelLeg = z.infer<typeof TravelLegSchema>;

const SizeSchema = z.tuple([z.number().int().min(8), z.number().int().min(8)]);

/** fields every settlement recipe shares */
const settlementBase = {
  id: z.string().min(1),
  seed: z.number().int(),
  size: SizeSchema,
  style: SettlementStyleSchema,
  /** named lots the session hand-builds — story-important parts are polished
   *  by a human (the user's law); the generator only RESERVES them */
  landmarks: z.array(z.string().min(1)).optional(),
  /** facade roles that must open a door: 'shop','hospital','chapel','story_gate'… */
  requiredDoors: z.array(z.string().min(1)).optional(),
  /** how many role-tagged NPC slots to scatter (drafts only) */
  npcSlots: z.number().int().min(0).optional(),
  /** §A4.5 picnic tables (placed before the dangerous edge) */
  picnicCount: z.number().int().min(0).optional(),
  encounterBand: EncounterBandSchema.optional(),
} as const;

export const CityRecipeSchema = z.strictObject({
  kind: z.literal('city'),
  ...settlementBase,
  /** ≥1 district names: 'harbor','market','clinic','chapel','docks'… */
  districts: z.array(z.string().min(1)).min(1),
});
export type CityRecipe = z.infer<typeof CityRecipeSchema>;

export const TownRecipeSchema = z.strictObject({
  kind: z.literal('town'),
  ...settlementBase,
  /** bending lanes the organic network grows from (1–4) */
  lanes: z.number().int().min(1).max(4).optional(),
});
export type TownRecipe = z.infer<typeof TownRecipeSchema>;

export const VillageRecipeSchema = z.strictObject({
  kind: z.literal('village'),
  ...settlementBase,
});
export type VillageRecipe = z.infer<typeof VillageRecipeSchema>;

export const InteriorRecipeSchema = z.strictObject({
  kind: z.literal('interior'),
  id: z.string().min(1),
  seed: z.number().int(),
  template: InteriorTemplateSchema,
  size: SizeSchema.optional(),
  /** the map this interior's exit returns to (a door target) */
  exitTo: z.string().min(1).optional(),
});
export type InteriorRecipe = z.infer<typeof InteriorRecipeSchema>;

export const RouteRecipeSchema = z.strictObject({
  kind: z.literal('route'),
  id: z.string().min(1),
  seed: z.number().int(),
  size: SizeSchema,
  style: RouteStyleSchema,
  /** routes outrank towns for §B4 density — spawners ride this band */
  encounterBand: EncounterBandSchema.optional(),
  signSlots: z.number().int().min(0).optional(),
  /** map ids the two ends connect (left/right doors) */
  ends: z.tuple([z.string().min(1), z.string().min(1)]).optional(),
});
export type RouteRecipe = z.infer<typeof RouteRecipeSchema>;

export const WildRecipeSchema = z.strictObject({
  kind: z.literal('wild'),
  id: z.string().min(1),
  seed: z.number().int(),
  size: SizeSchema,
  style: WildStyleSchema,
  encounterBand: EncounterBandSchema.optional(),
  ends: z.tuple([z.string().min(1), z.string().min(1)]).optional(),
});
export type WildRecipe = z.infer<typeof WildRecipeSchema>;

export const TravelRecipeSchema = z.strictObject({
  kind: z.literal('travel'),
  id: z.string().min(1),
  seed: z.number().int(),
  leg: TravelLegSchema,
  /** rows of seats either side of the aisle */
  seatRows: z.number().int().min(1).optional(),
  exitTo: z.string().min(1).optional(),
});
export type TravelRecipe = z.infer<typeof TravelRecipeSchema>;

/**
 * THE DUNGEON SITES (S15g Movement Two, ADR-045). One grammar per SITE — never
 * a generic maze — keyed by NAME so the post-S14c chapter renumber can never
 * strand a grammar (a recipe names its site; the chapter is incidental). The
 * dispatcher in src/levelkit/dungeons routes each to its bespoke builder.
 */
export const DungeonSiteSchema = z.enum([
  'wintermoor_academy', // Ch.3 England — classroom wings, patrol dorms, stacks
  'sleepers_spine',     // Ch.4 Norway — the terrain-giant, hand→shoulder→ear
  'the_hedgerow',       // Ch.5 Minimus — escort lanes + false exits that rejoin
  'laughing_ruins',     // Ch.6 Africa — echo zones, riddle chambers, false loops
  'night_train',        // Ch.7 India — car-by-car linear, the ≤30-min law
  'spore_forest',       // Ch.8 China — Mushroomize zones + cure-safe returns
  'castle_hoaxula',     // Ch.9 Romania — fake-scare loops, the backstage reveal
  'sea_of_silence',     // Ch.10 Mars — subtractive, the falling-emptiness curve
]);
export type DungeonSite = z.infer<typeof DungeonSiteSchema>;

export const DungeonRecipeSchema = z.strictObject({
  kind: z.literal('dungeon'),
  id: z.string().min(1),
  seed: z.number().int(),
  site: DungeonSiteSchema,
  /** overall map size; each grammar clamps to its own structural floor */
  size: SizeSchema.optional(),
  /** dungeons rise toward the boss — the band the deepest spawners ride */
  encounterBand: EncounterBandSchema.optional(),
  /** car/room count where the grammar honors it (night_train: the §A6
   *  ≤30-minute Locket-loss pacing law bounds the sequence length) */
  rooms: z.number().int().min(2).max(12).optional(),
});
export type DungeonRecipe = z.infer<typeof DungeonRecipeSchema>;

export const RecipeSchema = z.discriminatedUnion('kind', [
  CityRecipeSchema,
  TownRecipeSchema,
  VillageRecipeSchema,
  InteriorRecipeSchema,
  RouteRecipeSchema,
  WildRecipeSchema,
  TravelRecipeSchema,
  DungeonRecipeSchema,
]);
export type Recipe = z.infer<typeof RecipeSchema>;

/**
 * A DRAFT npc slot: position + ROLE, dialogue optional. Legal ONLY in
 * src/data/drafts/** and the LEVELKIT LAB. The canon NpcDef (strict) has no
 * `role` key, so a role-tagged slot can never masquerade as shipped content —
 * the validator/levelkit test proves MapDefSchema REFUSES it. Promotion is a
 * human act: the tone editor writes the real dialogue and drops the role.
 */
export const DraftNpcSchema = z.strictObject({
  id: z.string().min(1),
  sprite: z.string().min(1),
  x: z.number(),
  y: z.number(),
  facing: FacingSchema,
  dialogue: z.string().min(1).optional(),
  dialogueDay: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  wander: z.boolean().optional(),
  dog: z.boolean().optional(),
  ifFlag: z.string().min(1).optional(),
  unlessFlag: z.string().min(1).optional(),
  shop: z.string().min(1).optional(),
});
export type DraftNpc = z.infer<typeof DraftNpcSchema>;

/**
 * DraftMapDef = the canon MapDef shape with role-tagged NPC slots allowed.
 * Built from MapDefSchema.shape so it tracks the canon schema automatically
 * (the canon MapDefSchema itself stays UNTOUCHED — Prime Law 1). A draft
 * still SCHEMA-PARSES (drafts are valid shapes, never junk); it simply lives
 * outside the MAPS registry and the §B4 sweep, like maps/dev/playground.
 */
export const DraftMapDefSchema = z.strictObject({
  ...MapDefSchema.shape,
  npcs: z.array(DraftNpcSchema),
});
export type DraftMapDef = z.infer<typeof DraftMapDefSchema>;

/* ====== THE ENEMY FORGE — drafts (S15g Movement Three, ADR-046) ====== */

/**
 * The human-picked sprite recipe (Movement 3b): a tuple of hand-drawn part ids
 * + the seed that composed them, so the chosen look reproduces byte-for-byte
 * forever. ADR-020 BY CONSTRUCTION — every part is a drawn pixmap, never
 * synthesized. Optional on a draft until the Sprite Lab pick is recorded.
 */
export const PartsSpecSchema = z.strictObject({
  silhouette: z.string().min(1),
  material: z.string().min(1),
  accessory: z.string().min(1).optional(),
  wear: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  seed: z.number().int(),
});
export type PartsSpec = z.infer<typeof PartsSpecSchema>;

/**
 * A FORGED enemy draft = the canon EnemyDef shape (built from its `.shape` so
 * it tracks the schema) PLUS the forge's bookkeeping: the ROLE it was drafted
 * from, the CHAPTER band, and (once the Sprite Lab pick lands) the partsSpec.
 * The canon `EnemiesSchema` is strict and has no slot for `role`/`chapter`/
 * `partsSpec`, so a forged draft can NEVER masquerade as a shipped §A7 row —
 * promotion is a human act (the DraftMapDef pattern, applied to enemies).
 */
export const DraftEnemyDefSchema = z.strictObject({
  ...EnemyDefSchema.shape,
  /** the forge role this enemy was drafted from (grunt/bruiser/caster/…) */
  role: z.string().min(1),
  /** the §A6/§A9 chapter band its stats were forged against */
  chapter: z.number().int().min(1).max(10),
  /** 3b: the composed sprite recipe the human picked (added at sprite time) */
  partsSpec: PartsSpecSchema.optional(),
});
export type DraftEnemyDef = z.infer<typeof DraftEnemyDefSchema>;

/* ====== THE CHAPTER SCAFFOLD — manifests (S15g Movement Four, ADR-047) ====== */

/**
 * The S14c discipline as a TYPE. A chapter is either:
 *  - 'shipped' — its content is LIVE in MAPS/ENEMIES/QUESTS/BOSS_SCRIPTS, and
 *    the validator asserts the manifest AGAINST that live content (Ch.1–2); or
 *  - 'unlanded' — only the forge DRAFTS exist (a forged roster + a draft boss
 *    script), and the validator asserts THOSE instead (Ch.3–10).
 * The day a chapter lands, its session flips this flag and the validator's live
 * assertions switch on — "asserted as each lands" (the S14c rule, ADR-046).
 */
export const ChapterStatusSchema = z.enum(['shipped', 'unlanded']);
export type ChapterStatus = z.infer<typeof ChapterStatusSchema>;

/** the ten forge boss TEMPLATES (src/levelkit/forge/bosses.ts) plus 'bespoke'
 *  (the shipped Tick's engine latch + the Ch.10 Hush finale — neither is one of
 *  the ten). A manifest names the template its boss instantiates from. */
export const BossTemplateSchema = z.enum([
  'bespoke',
  'formSwap', 'latchDrain', 'summoner', 'thresholdHeal', 'riddle',
  'mercyEnding', 'airborneGrounded', 'scriptedSurvival', 'untargetableUntilNoise', 'elementalGolem',
]);
export type BossTemplate = z.infer<typeof BossTemplateSchema>;

/** one §A6 boss row: the §A7 enemy id its script drives, the canon HP (the
 *  §A6 ladder), and the forge template (or 'bespoke'). */
export const ChapterBossSchema = z.strictObject({
  id: z.string().min(1),
  /** dev/manifest name — §A11.6 keeps chapter/boss names out of player UI */
  name: z.string().min(1),
  hp: z.number().int().positive(),
  template: BossTemplateSchema,
});
export type ChapterBoss = z.infer<typeof ChapterBossSchema>;

/** one §A5 settlement of a chapter: the map id, its kind, and (for an unlanded
 *  chapter) the forge STYLE PACK the scaffold dresses its settlement draft from. */
export const ChapterSettlementSchema = z.strictObject({
  id: z.string().min(1),
  kind: SettlementSchema,
  style: SettlementStyleSchema.optional(),
});
export type ChapterSettlement = z.infer<typeof ChapterSettlementSchema>;

/**
 * The per-chapter source of truth the validator reads (§A6/§A5/§A7/§A10): the
 * chapter's maps, dungeon site, settlements, roster band, boss, quests, the
 * Heartlight/Ember number, and the target level. A SHIPPED manifest is asserted
 * against live content; an UNLANDED one is asserted against the forge drafts.
 * tools/chapter-scaffold.ts reads it to emit a chapter's complete draft tree.
 */
export const ChapterManifestSchema = z
  .strictObject({
    chapter: z.number().int().min(1).max(10),
    /** internal codename (§A11.6: never player-facing) */
    title: z.string().min(1),
    region: z.string().min(1),
    status: ChapterStatusSchema,
    /** §A6 target end level (Ch.10 uses the low end of its 52–55 window) */
    targetLevel: z.number().int().min(1),
    /** the Ember/Heartlight number — canon: ten Embers, one per chapter (§A2) */
    ember: z.number().int().min(1).max(10),
    /** the Homesong stem name, where §A6 names it (Ch.4 "The Deep Hum"…) */
    heartlight: z.string().min(1).optional(),
    /** §A7 roster band the chapter's spawners draw from ('ch1'…'ch10') */
    band: EncounterBandSchema,
    /** §A5 travel-in leg (Ch.1 walks — omitted) */
    travel: TravelLegSchema.optional(),
    /** the Resonance-Site dungeon */
    dungeon: z.strictObject({
      /** the dungeon / resonance-site name (dev voice) */
      name: z.string().min(1),
      /** the forge grammar (Ch.3–10); a shipped bespoke dungeon omits it */
      site: DungeonSiteSchema.optional(),
      /** shipped dungeon map ids (a shipped chapter asserts them live) */
      maps: z.array(z.string().min(1)).optional(),
    }),
    boss: ChapterBossSchema,
    /** Ch.10's miniboss gauntlet (Frost Sentinel, Tiki Magma Golem) */
    minibosses: z.array(ChapterBossSchema).optional(),
    /** §A5 settlements (id + kind + draft style), at least one */
    settlements: z.array(ChapterSettlementSchema).min(1),
    /** the chapter's primary overworld map ids (shipped → asserted live) */
    maps: z.array(z.string().min(1)),
    /** the §A10 quest ids (shipped → asserted live, both directions) */
    quests: z.array(z.string().min(1)),
  })
  .superRefine((m, ctx) => {
    // canon (§A2): ten Embers, one per chapter — the number IS the chapter
    if (m.ember !== m.chapter) {
      ctx.addIssue({ code: 'custom', message: `chapter ${m.chapter} carries Ember #${m.ember} — the Ember number is the chapter (§A2)` });
    }
    // the roster band is the chapter's own band by construction
    if (m.band !== `ch${m.chapter}`) {
      ctx.addIssue({ code: 'custom', message: `chapter ${m.chapter} rides band '${m.band}' — must be 'ch${m.chapter}'` });
    }
    // a shipped chapter's content is LIVE — it must name the maps it ships
    if (m.status === 'shipped' && m.maps.length === 0) {
      ctx.addIssue({ code: 'custom', message: `shipped chapter ${m.chapter} lists no maps (a shipped chapter is asserted against live MAPS)` });
    }
  });
export type ChapterManifest = z.infer<typeof ChapterManifestSchema>;

export const ChapterManifestsSchema = z.record(z.string().min(1), ChapterManifestSchema);
