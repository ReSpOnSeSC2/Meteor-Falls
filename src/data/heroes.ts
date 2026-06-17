/**
 * The Five Heroes — GAME_BIBLE §A3. All five are fully defined (visible in
 * Sprite Lab); Mia, Milo, Pippa and Dorin join in their canon chapters
 * (Pippa is S15h/ADR-048's 4→5 expansion — the roster + sprites land now, Ch.5
 * wires her into the party).
 * Types are z.infer'd from src/schemas (S5) so the compile-time shape and the
 * runtime validation cannot drift; `import type` keeps zod out of the bundle.
 */
import { awakenedAbilities } from './awakenings';
import type { HeroDef, HeroId, Stats } from '../schemas';

export type { HeroDef, HeroId } from '../schemas';

export const HEROES: Record<HeroId, HeroDef> = {
  rex: {
    // canonically JAY since S11 (ADR-031, the ADR-023 playbook): display
    // name only — the id 'rex', flags, dialogue keys, and texture keys are
    // frozen identifiers. 'Rex' survives as his first don't-care alternate.
    id: 'rex',
    name: 'Jay',
    epithet: 'a quiet kid from Otterbrook',
    weapon: 'bats',
    // S22 (ADR-111) — THE SLOW BURN: Jay's base Offense drops 6→2 so a level-1
    // bat swing lands for just 1–2 (physicalDamage = max(1, off*2 − def)). The
    // 2.1 growth slope is untouched, so the curve simply STARTS lower and ramps
    // the same — the EarthBound opener where a Cranky Mailbox is a real scrap.
    base: { offense: 2, defense: 4, speed: 5, guts: 8, vibe: 6, luck: 5 },
    growth: { offense: 2.1, defense: 1.7, speed: 1.4, guts: 1.2, vibe: 1.8, luck: 0.8 },
    hp: { base: 30, lin: 6.5, quad: 0.08 },
    pp: { base: 10, lin: 2.4, quad: 0.03 },
    // S12b (ADR-035): Vibe Surge α and Lifeup α are AWAKENINGS now — the
    // crater prophecy and the porch (src/data/awakenings.ts), not level
    // rows. The level cadence below is SPACED so each unlock lands as an
    // event (§A3 amended per Appendix rule 6).
    // S16 ("The Old Light, Doubled"): Jay's kit roughly doubles. ~80% of the
    // new abilities are EARNED here by leveling; the 3 most iconic beats
    // (Surge Σ, party Reflect, true Mind Warp) AWAKEN as story moments (see
    // src/data/awakenings.ts) and must NOT appear in this list (one-path rule).
    // The cadence stays SPACED so each unlock lands as an event (§A3).
    unlocks: [
      { level: 10, ability: 'hypno_a' },
      { level: 14, ability: 'shield_a' },
      { level: 16, ability: 'ward_a' }, // S16: the elemental layer opens early
      { level: 18, ability: 'vibe_surge_b' },
      // S18 M27 (ADR-068): mindwarp_a RE-STAGED off this L21 row to the Ch.3 PUPPET
      // AWAKENING (the_first_borrow) — one power, battle (Mind Warp) + field (Puppet),
      // engine id frozen, only the TIMING moved. One-path rule keeps it out of here.
      { level: 22, ability: 'lifeup_b' },
      { level: 24, ability: 'flash_a' },
      { level: 26, ability: 'teleport_a' },
      { level: 28, ability: 'powershield_a' }, // S16: single-target reflect
      { level: 29, ability: 'hypno_o' }, // S16: mass sleep
      { level: 31, ability: 'vibe_surge_g' },
      { level: 33, ability: 'shield_s' },
      { level: 33, ability: 'resolve_a' }, // S16: the Guts self-buff
      { level: 36, ability: 'ward_s' }, // S16: party-wide elemental ward
      { level: 38, ability: 'lifeup_g' },
      { level: 40, ability: 'flash_o' }, // S16: stronger blind
      { level: 34, ability: 'teleport_b' }, // S16: the escape upgrade
      { level: 46, ability: 'lifeup_o' }, // S16: the big party heal
      { level: 47, ability: 'vibe_surge_o' },
    ],
  },
  faye: {
    id: 'faye',
    name: 'Mia',
    epithet: 'the girl who prays',
    weapon: 'frying pans',
    base: { offense: 4, defense: 4, speed: 6, guts: 6, vibe: 8, luck: 7 },
    growth: { offense: 1.6, defense: 1.5, speed: 1.7, guts: 1.0, vibe: 2.2, luck: 1.1 },
    hp: { base: 26, lin: 5.6, quad: 0.07 },
    pp: { base: 14, lin: 3.2, quad: 0.04 },
    // S12b (ADR-035): PRAY stays innate at L1 — her faith is who she is
    // (§A3 canon centerpiece, validator-pinned). Vibe Fire α is the
    // first-listen AWAKENING (the holding-room Locket beat); the elemental
    // cadence below is spaced so each line opens as an event.
    // S14: VIBE FREEZE α left the L12 row — it AWAKENS at the Gilded
    // Grin's HOLLOW reveal (cold_reads, Ch.2's emotional center; §A3
    // amended). Magnet L15 → Fire β L17 restate unchanged.
    // "Ability Expansion" — Mia grows to ~30 spells. MOST are EARNED by leveling
    // (she's a grind-and-learn virtuoso); the 3 iconic beats AWAKEN as story
    // moments (Starsong α, Fire Σ, Magnet Σ — see src/data/awakenings.ts + the
    // content-validate canon manifest) and must NOT appear here (one-path rule).
    // `first_listen`→fire α and `cold_reads`→freeze α stay awakenings too.
    unlocks: [
      { level: 1, ability: 'pray' },
      { level: 15, ability: 'magnet_a' },
      { level: 17, ability: 'vibe_fire_b' },
      { level: 20, ability: 'vibe_volt_a' },
      { level: 22, ability: 'magnet_b' }, // PP-steal grows: harder pull
      { level: 24, ability: 'vibe_freeze_b' },
      { level: 25, ability: 'dreamlull' }, // mass sleep (utility)
      { level: 26, ability: 'vibe_volt_b' },
      { level: 27, ability: 'heartmend_a' }, // a reliable heal beside PRAY's RNG
      { level: 29, ability: 'vibe_fire_g' },
      { level: 30, ability: 'starsong_b' }, // the holy line widens (α awakens)
      { level: 31, ability: 'magnet_g' }, // drain the whole room
      { level: 32, ability: 'vibe_freeze_g' },
      { level: 34, ability: 'lucky_star' }, // party crit/dodge up (utility)
      { level: 36, ability: 'hush_hex' }, // the focus-fire enabler (utility)
      { level: 38, ability: 'starsong_g' },
      { level: 40, ability: 'vibe_volt_g' },
      { level: 42, ability: 'magnet_o' }, // lifedrain — HP + PP
      { level: 44, ability: 'vibe_fire_o' },
      { level: 46, ability: 'vibe_freeze_o' },
      { level: 47, ability: 'vibe_volt_o' },
      { level: 48, ability: 'starsong_o' },
      { level: 52, ability: 'vibe_freeze_x' }, // the Σ capstones cluster at the cap
      { level: 52, ability: 'vibe_volt_x' },
      { level: 52, ability: 'starsong_x' },
    ],
  },
  milo: {
    id: 'milo',
    name: 'Milo',
    epithet: 'gadget genius, tea snob',
    weapon: 'air rifles',
    base: { offense: 5, defense: 5, speed: 7, guts: 5, vibe: 0, luck: 6 },
    growth: { offense: 1.9, defense: 1.8, speed: 1.9, guts: 0.9, vibe: 0, luck: 1.0 },
    hp: { base: 28, lin: 6.0, quad: 0.07 },
    pp: { base: 0, lin: 0, quad: 0 },
    // "Gadget Genius, Doubled": Milo's kit roughly doubles (5 → 11). He has NO
    // Vibe → NO awakenings — every gadget is a LEVEL row (pure grind/competence:
    // he earns his gear by building it). The cadence sits in his active range
    // (he joins Ch.3 ~L8): Scope opens the force-multiplier game early, the
    // elemental grenades + deployable shield fill out the toolbox mid-game, and
    // the boss-buster Siege Rocket caps the line.
    unlocks: [
      { level: 1, ability: 'spy' },
      { level: 1, ability: 'repair' },
      { level: 1, ability: 'bottle_rocket' },
      { level: 8, ability: 'scope' }, // Spy++: reveal stats AND mark (×1.25, can't-miss)
      { level: 14, ability: 'big_bottle_rocket' },
      { level: 16, ability: 'forcefield_gizmo' }, // deployable party shield
      { level: 18, ability: 'static_bomb' }, // EMP: volt AoE + paralyze
      { level: 20, ability: 'med_spray' }, // 0-PP heal + status cleanse
      { level: 22, ability: 'cryo_grenade' }, // freeze damage + skip-lock
      { level: 28, ability: 'multi_bottle_rocket' },
      { level: 34, ability: 'siege_rocket' }, // the boss-buster — 360 fixed, no resource
    ],
  },
  dorin: {
    id: 'dorin',
    name: 'Dorin',
    epithet: 'of Stone Brow Monastery',
    weapon: 'prayer beads',
    base: { offense: 7, defense: 6, speed: 8, guts: 7, vibe: 7, luck: 4 },
    growth: { offense: 2.2, defense: 1.9, speed: 2.0, guts: 1.1, vibe: 2.0, luck: 0.7 },
    hp: { base: 34, lin: 7.0, quad: 0.09 },
    pp: { base: 12, lin: 2.8, quad: 0.035 },
    // "The Monk's Full Path" — Dorin joins late (Ch.9) nearly complete, so his
    // unlocks cluster high (L1 on join through ~L51). Vibe Comet Ω is NOT here:
    // it AWAKENS at the Trial of the Mute Mountain (one-path rule, ADR-035) —
    // see src/data/awakenings.ts + the content-validate canon manifest.
    unlocks: [
      { level: 1, ability: 'vibe_comet_a' },
      { level: 1, ability: 'vibe_comet_b' }, // joins ready — the master, not the student
      { level: 1, ability: 'mirror' },
      { level: 1, ability: 'healing_a' },
      { level: 1, ability: 'healing_b' }, // an actual HP heal so he can main-heal on join
      { level: 1, ability: 'stone_stance' }, // a stance from the first turn
      { level: 40, ability: 'brainjam_a' },
      { level: 44, ability: 'healing_g' },
      { level: 45, ability: 'flowing_step' },
      { level: 46, ability: 'brainjam_g' },
      { level: 48, ability: 'vibe_comet_g' },
      { level: 49, ability: 'mirror_o' },
      { level: 50, ability: 'brainjam_o' },
      { level: 51, ability: 'healing_o' }, // the revive backbone — his defining endgame support
    ],
  },
  // Pippa Quill — the Minimus royal page (§A3, S15h/ADR-048). NO Vibe and NO
  // PP, like Milo: her kit is competence, not the old light — accuracy, morale,
  // and a field medic's sewing kit. Tiny, quick, and absurdly lucky; her
  // signature is reading small targets the taller kids whiff at. Joins Ch.5.
  pippa: {
    id: 'pippa',
    name: 'Pippa',
    epithet: 'the royal page of Minimus',
    weapon: 'stamp slings',
    base: { offense: 3, defense: 4, speed: 6, guts: 4, vibe: 0, luck: 9 },
    growth: { offense: 1.4, defense: 1.5, speed: 1.8, guts: 0.9, vibe: 0, luck: 1.4 },
    hp: { base: 24, lin: 5.0, quad: 0.06 },
    pp: { base: 0, lin: 0, quad: 0 },
    // §A3: four abilities arrive WHEN SHE JOINS (Ch.5) — the on-join support
    // kit — and Big-Little Focus is the Ch.5 build with Milo (a built ability,
    // not an awakening).
    // S15h+ ("The Page's Full Brief"): her kit roughly DOUBLES (6 → 12). She has
    // NO Vibe → NO awakenings; every new move is a level unlock (she earns her
    // brief through service), spanning ~L20 (the focus-fire enablers) to ~L40.
    // Scale Step (L30) and Bellwether (L44) keep their canon rows.
    unlocks: [
      { level: 1, ability: 'pinpoint_mark' },
      { level: 1, ability: 'royal_rally' },
      { level: 1, ability: 'pocket_patch' },
      { level: 1, ability: 'big_little_focus' },
      { level: 20, ability: 'volley_mark' }, // mark the WHOLE row — the party AoE enabler
      { level: 22, ability: 'diplomatic_immunity' }, // step in front of the telegraphed hit
      { level: 26, ability: 'field_dressing' }, // party heal + cleanse, 0-PP upkeep
      { level: 30, ability: 'scale_step' },
      { level: 31, ability: 'stern_decree' }, // the no-magic Offense-down debuff
      { level: 34, ability: 'standing_ovation' }, // Royal Rally++ — her pre-boss button
      { level: 40, ability: 'the_minutes' }, // cleanse + focus — her comeback tool
      { level: 44, ability: 'bellwether' },
    ],
  },
};

export function statsAtLevel(id: HeroId, level: number): Stats {
  const d = HEROES[id];
  const l = level - 1;
  const stat = (b: number, g: number): number => Math.round(b + g * l);
  return {
    offense: stat(d.base.offense, d.growth.offense),
    defense: stat(d.base.defense, d.growth.defense),
    speed: stat(d.base.speed, d.growth.speed),
    guts: stat(d.base.guts, d.growth.guts),
    vibe: stat(d.base.vibe, d.growth.vibe),
    luck: stat(d.base.luck, d.growth.luck),
  };
}

export function maxHpAtLevel(id: HeroId, level: number): number {
  const c = HEROES[id].hp;
  const l = level - 1;
  return Math.round(c.base + c.lin * l + c.quad * l * l);
}

export function maxPpAtLevel(id: HeroId, level: number): number {
  const c = HEROES[id].pp;
  const l = level - 1;
  return Math.round(c.base + c.lin * l + c.quad * l * l);
}

/** abilities available at a given level */
export function unlockedAbilities(id: HeroId, level: number): string[] {
  return HEROES[id].unlocks.filter((u) => u.level <= level).map((u) => u.ability);
}

/**
 * S12b (ADR-035): what a hero can actually USE — level unlocks ∪ story
 * AWAKENINGS (flag-granted; src/data/awakenings.ts). Battle and the menu
 * read THIS; level-up announcements still read unlocks alone.
 */
export function availableAbilities(id: HeroId, level: number, flagOf: (flag: string) => boolean): string[] {
  const awakened = awakenedAbilities(id, flagOf);
  return [...awakened, ...unlockedAbilities(id, level).filter((a) => !awakened.includes(a))];
}
