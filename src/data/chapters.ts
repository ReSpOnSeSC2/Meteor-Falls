/**
 * THE CHAPTER MANIFESTS (S15g Movement Four, ADR-047) — the per-chapter source
 * of truth the validator reads and tools/chapter-scaffold.ts emits a draft tree
 * from. One row per §A6 chapter: its maps, dungeon site, settlements, roster
 * band, boss, quests, Heartlight/Ember number, and target level.
 *
 * THE S14c RULE (ADR-046): a 'shipped' manifest is asserted AGAINST LIVE content
 * (MAPS/ENEMIES/QUESTS/BOSS_SCRIPTS — Ch.1–2 below); an 'unlanded' one is
 * asserted against the forge DRAFTS (the forged roster + the draft boss script —
 * Ch.3–10). When a chapter lands, its session flips `status` to 'shipped' and
 * fills in the LIVE maps/quests; the validator's live assertions switch on in
 * the same commit. No row is ever ad-hoc — extending content means extending the
 * matching manifest (the ADR-017 drift-log rule, applied to whole chapters).
 *
 * Internal codenames and region names live here freely: §A11.6 only bars chapter
 * titles from PLAYER-FACING UI — a dev manifest is exactly where they belong.
 */
import type { ChapterManifest } from '../schemas';

/**
 * All ten chapters, keyed by chapter number as a string ('1'…'10'). Ch.1–3 are
 * SHIPPED (the live manifests, England landed S18/ADR-099); Ch.4–10 are UNLANDED (the forge has the
 * 60% — a banded roster + a draft boss firing its gimmick — the session spends
 * itself on the SOUL at promotion). Boss HP is the §A6 ladder; the bespoke Tick
 * (Ch.1) and the Hush finale (Ch.10) carry template 'bespoke' (not one of the
 * ten forge templates). Heartlight stem names are recorded where §A6 names them.
 */
export const CHAPTER_MANIFESTS: Record<string, ChapterManifest> = {
  /* ============================ SHIPPED (Ch.1–3) ============================ */

  1: {
    chapter: 1,
    title: 'The Night It Fell',
    region: 'USA',
    status: 'shipped',
    targetLevel: 8,
    ember: 1,
    band: 'ch1',
    // Ch.1 walks (on foot / city bus) — no §A5 travel leg
    dungeon: {
      name: 'The Department of Smiles',
      maps: ['dos_f1', 'dos_f2', 'dos_f3'],
    },
    boss: { id: 'titanic_tick', name: 'The Titanic Tick', hp: 60, template: 'bespoke' },
    settlements: [
      { id: 'otterbrook', kind: 'town' },
      { id: 'brickton', kind: 'city' },
    ],
    // ADR-056 — THE LONG WALK: the four foot legs bridging Otterbrook → Brickton
    maps: ['otterbrook', 'downtown_otterbrook', 'bus_depot_int', 'hill_road', 'hickory_trail', 'whisperwood_rise', 'hickory_hill', 'brickton', 'bus_interior', 'meadow_mile', 'meadow_woods', 'meadow_far', 'meadow_overpass'],
    quests: ['biscuit_come_home', 'mail_must_move', 'lemonade_empire', 'arcade_legend', 'walkers_register'],
  },

  2: {
    chapter: 2,
    title: 'The Gilded Grin',
    region: 'South America',
    status: 'shipped',
    targetLevel: 13,
    ember: 2,
    band: 'ch2',
    travel: 'boat', // the banana cargo ship (§A5)
    dungeon: {
      name: 'The Step-Pyramid',
      maps: ['pyramid_ante', 'pyramid_1', 'pyramid_2', 'pyramid_3', 'pyramid_4', 'pyramid_apex'],
    },
    boss: { id: 'gilded_grin', name: 'Idol of the Gilded Grin', hp: 300, template: 'formSwap' },
    settlements: [
      { id: 'puerto_sol', kind: 'city' },
      { id: 'valle_dorado', kind: 'village' },
    ],
    maps: ['brickton_docks', 'puerto_sol', 'jungle_1', 'jungle_2', 'valle_dorado'],
    quests: ['llama_drama', 'museum_gold', 'the_quiet_crate'],
  },

  // ADR-099 — THE FLIP: Ch.3 lands (the §A6 Old-World track's first shipped chapter).
  // status → 'shipped'; the dungeon site becomes live dungeon.maps; the 5 overworld
  // maps + all 5 quests fill in; the boss is now a live boss-flagged §A7 enemy at
  // 1,600 HP with a BOSS_SCRIPTS entry — the validator's live Ch.3 assertions switch
  // on in the same commit (the draft 'site'/settlement 'style' drop away).
  3: {
    chapter: 3,
    title: 'A Very Foggy Term',
    region: 'England',
    status: 'shipped',
    targetLevel: 18,
    ember: 3,
    band: 'ch3',
    travel: 'biplane', // Uncle Bert's "Lucille"
    dungeon: {
      name: 'Wintermoor Academy → The Old Stones',
      // the 3-floor school + the dorm stealth wing + the boiler PSI-gate room; the
      // §A6 boss room opens off floor 3's sealed office (the mainframe_boss trigger)
      maps: ['wintermoor_f1', 'wintermoor_f2', 'wintermoor_f3', 'wintermoor_dorm', 'wintermoor_boiler'],
    },
    boss: { id: 'headmaster_mainframe', name: 'Headmaster Mainframe', hp: 750, template: 'summoner' },
    settlements: [{ id: 'foggybottom', kind: 'town' }],
    // the 5 overworld maps from buildChapter3Maps(): the arrival cabin, the damp town,
    // the moor lane, the academy grounds, and the Old Stones (the §A6 Resonance Site)
    maps: ['biplane_interior', 'foggybottom', 'foggy_moor', 'wintermoor_grounds', 'the_old_stones'],
    quests: ['overdue', 'groundskeepers_cuppa', 'return_to_sender', 'penny_fog', 'the_last_over'],
  },

  /* =========================== UNLANDED (Ch.4–10) =========================== */

  4: {
    chapter: 4,
    title: 'The Fjord That Sleeps',
    region: 'Norway',
    status: 'unlanded',
    targetLevel: 22,
    ember: 4,
    heartlight: 'The Deep Hum',
    band: 'ch4',
    travel: 'biplane', // Lucille's North Sea hop (she barely makes it)
    dungeon: { name: "The Sleeper's Spine → the Sleeper's Ear", site: 'sleepers_spine' },
    boss: { id: 'the_whisperwig', name: 'The Whisperwig', hp: 1900, template: 'untargetableUntilNoise' },
    settlements: [
      { id: 'kvisthavn', kind: 'village', style: 'spire-canton' },
      { id: 'lilleby', kind: 'village', style: 'spire-canton' },
    ],
    maps: [],
    quests: ['sigrids_spectacles', 'unsent_letter'],
  },

  5: {
    chapter: 5,
    title: 'The Grand Duchy of Minimus',
    region: 'Minimus',
    status: 'unlanded',
    targetLevel: 26,
    ember: 5,
    heartlight: 'The Bell Choir',
    band: 'ch5',
    travel: 'biplane', // Lucille lands in the duchy. All of it.
    dungeon: { name: 'The Hedgerow → the Ducal Crown', site: 'the_hedgerow' },
    boss: { id: 'whiskerzilla', name: 'Whiskerzilla', hp: 2150, template: 'scriptedSurvival' },
    settlements: [{ id: 'minimus_major', kind: 'city', style: 'spire-canton' }],
    maps: [],
    quests: ['royal_census', 'civic_repairs'],
  },

  6: {
    chapter: 6,
    title: 'The Ruins That Laugh',
    region: 'Africa',
    status: 'unlanded',
    targetLevel: 30,
    ember: 6,
    band: 'ch6',
    travel: 'biplane', // Lucille again (she has no business making it)
    dungeon: { name: 'The Laughing Ruins → the Sphinx’s chin', site: 'laughing_ruins' },
    boss: { id: 'laughing_sphinx', name: 'The Laughing Sphinx', hp: 2300, template: 'riddle' },
    settlements: [{ id: 'zanzibel', kind: 'city', style: 'bazaar-port' }],
    maps: [],
    quests: ['stones_that_speak', 'watering_hole_convoy'],
  },

  7: {
    chapter: 7,
    title: "The Cobra's Palace",
    region: 'India',
    status: 'unlanded',
    targetLevel: 35,
    ember: 7,
    band: 'ch7',
    travel: 'train', // the overloaded night train
    dungeon: { name: 'The Night Train → palace throne', site: 'night_train' },
    boss: { id: 'cobra_raja', name: 'Cobra Raja', hp: 3200, template: 'thresholdHeal' },
    settlements: [{ id: 'chandrapore', kind: 'city', style: 'bazaar-port' }],
    maps: [],
    quests: ['seven_spices', 'monkey_who_stole_tuesday'],
  },

  8: {
    chapter: 8,
    title: 'The Paper Dragon',
    region: 'China',
    status: 'unlanded',
    targetLevel: 40,
    ember: 8,
    band: 'ch8',
    travel: 'riverboat', // riverboat + the Yak Express
    dungeon: { name: 'The Spore Forest → temple bell', site: 'spore_forest' },
    boss: { id: 'paper_dragon', name: 'The Paper Dragon', hp: 4100, template: 'airborneGrounded' },
    settlements: [{ id: 'lotus_harbor', kind: 'city', style: 'painted-gates' }],
    maps: [],
    quests: ['brushes_of_mt_shu'],
  },

  9: {
    chapter: 9,
    title: 'The Count of Valea Stelelor',
    region: 'Romania',
    status: 'unlanded',
    targetLevel: 46,
    ember: 9,
    band: 'ch9',
    travel: 'train', // the Orient Less-Express (third-class)
    dungeon: { name: 'Castle Hoaxula → monastery bell tower', site: 'castle_hoaxula' },
    boss: { id: 'count_hoaxula', name: 'Count Hoaxula', hp: 5300, template: 'mercyEnding' },
    settlements: [{ id: 'valea_stelelor', kind: 'village', style: 'painted-gates' }],
    maps: [],
    quests: ['bunis_table'],
  },

  10: {
    chapter: 10,
    title: 'The Long Shot',
    region: 'Alaska → Hawaii → Mars',
    status: 'unlanded',
    targetLevel: 52, // the §A6 52–55+ window's floor
    ember: 10,
    band: 'ch10',
    travel: 'snowcat', // snow-cat, then Pemberton's rocket The Long Shot
    dungeon: { name: 'The Sea of Silence (Mars)', site: 'sea_of_silence' },
    // the finale shell is bespoke (not one of the ten templates) — like the Tick
    boss: { id: 'the_hush', name: 'The Hush', hp: 6000, template: 'bespoke' },
    minibosses: [
      { id: 'frost_sentinel', name: 'Frost Sentinel', hp: 2800, template: 'elementalGolem' },
      { id: 'tiki_magma_golem', name: 'Tiki Magma Golem', hp: 3000, template: 'elementalGolem' },
    ],
    settlements: [
      { id: 'aurora_station', kind: 'village', style: 'fog-stone' },
      { id: 'mauna_lani', kind: 'village', style: 'fog-stone' },
    ],
    maps: [],
    quests: ['lights_of_aurora', 'the_last_wave'],
  },
};

/** the ten chapter ids, in order ('1'…'10') — the validator + scaffold iterate it */
export const CHAPTER_IDS: readonly string[] = Object.keys(CHAPTER_MANIFESTS);

/** look a manifest up by chapter number (the scaffold tool's entry point) */
export function chapterManifest(n: number): ChapterManifest | undefined {
  return CHAPTER_MANIFESTS[String(n)];
}
