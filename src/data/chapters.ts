/**
 * THE CHAPTER MANIFESTS (S15g Movement Four, ADR-047) — the per-chapter source
 * of truth the validator reads and tools/chapter-scaffold.ts emits a draft tree
 * from. One row per §A6 chapter: its maps, dungeon site, settlements, roster
 * band, boss, quests, Heartlight/Ember number, and target level.
 *
 * THE S14c RULE (ADR-046): a 'shipped' manifest is asserted AGAINST LIVE content
 * (MAPS/ENEMIES/QUESTS/BOSS_SCRIPTS); an 'unlanded' one is
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
 * All ten chapters, keyed by chapter number as a string ('1'…'10'). Every
 * manifest is now shipped and validator-backed; the forge drafts remain historical
 * promotion inputs only. Boss HP is the §A6 ladder; the bespoke Tick
 * (Ch.1) and the Hush finale (Ch.10) carry template 'bespoke' (not one of the
 * ten forge templates). Heartlight stem names are recorded where §A6 names them.
 */
export const CHAPTER_MANIFESTS: Record<string, ChapterManifest> = {
  /* ============================ SHIPPED MANIFESTS ============================ */

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
    boss: { id: 'titanic_tick', name: 'The Titanic Tick', hp: 200, template: 'bespoke' },
    settlements: [
      { id: 'otterbrook', kind: 'town' },
      { id: 'brickton', kind: 'city' },
    ],
    // ADR-056 — THE LONG WALK: the four foot legs bridging Otterbrook → Brickton
    maps: ['otterbrook', 'downtown_otterbrook', 'bus_depot_int', 'brickton', 'bus_interior', 'meadow_mile', 'meadow_woods', 'meadow_far', 'meadow_overpass'],
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
      // 2026-07-08: promoted village → CITY (stage 4 = the big golden city; the
      // Fourside rebuild — towers, boulevards, the Golden Minute clock plaza)
      { id: 'valle_dorado', kind: 'city' },
    ],
    maps: ['brickton_docks', 'puerto_sol', 'jungle_1', 'jungle_2', 'valle_dorado'],
    quests: ['llama_drama', 'museum_gold', 'the_quiet_crate'],
  },

  // ADR-099 — THE FLIP: Ch.3 lands (the §A6 Old-World track's first shipped chapter).
  // status → 'shipped'; the route owns 5 manifest overworld maps, 5 dungeon maps,
  // and 2 hand-authored Kettle interiors; all 5 quests fill in; the boss is live at
  // 750 HP with a BOSS_SCRIPTS entry — the validator's live Ch.3 assertions switch
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
    // The manifest's 5 overworld maps: arrival cabin, damp town, moor lane,
    // academy grounds, and Old Stones. Two Kettle interiors remain amenity-owned.
    maps: ['biplane_interior', 'foggybottom', 'foggy_moor', 'wintermoor_grounds', 'the_old_stones'],
    quests: ['overdue', 'groundskeepers_cuppa', 'return_to_sender', 'penny_fog', 'the_last_over'],
  },

  // THE NORWAY LANDING — Ch.4 flips to 'shipped'. The dungeon site becomes live
  // dungeon.maps (the Sleeper's Spine: hand → shoulder → ear); the 3 overworld maps
  // + all 4 §A10 quests fill in; the boss is now a live boss-flagged §A7 enemy at
  // 1,800 HP with a BOSS_SCRIPTS entry (the_whisperwig draft retired in the same
  // commit). The validator's live Ch.4 assertions switch on; the draft 'site'/
  // settlement 'style' drop away (the S14c flip, the ADR-099 England precedent).
  4: {
    chapter: 4,
    title: 'The Fjord That Sleeps',
    region: 'Norway',
    status: 'shipped',
    targetLevel: 22,
    ember: 4,
    heartlight: 'The Deep Hum',
    band: 'ch4',
    travel: 'biplane', // Lucille's North Sea hop (she barely makes it)
    dungeon: {
      name: "The Sleeper's Spine → the Sleeper's Ear",
      // the giant's body as architecture: the hand (entry), the shoulder (the
      // §A4.11 meltfall PSI gate), and the ear (the §A6 Resonance Site + boss)
      maps: ['spine_hand', 'spine_shoulder', 'spine_ear'],
    },
    boss: { id: 'the_whisperwig', name: 'The Whisperwig', hp: 1800, template: 'untargetableUntilNoise' },
    settlements: [
      { id: 'kvisthavn', kind: 'village' },
      { id: 'lilleby', kind: 'village' },
    ],
    // the 3 overworld maps from buildChapter4Maps(): the fjord hamlet, the 10× moor,
    // and the giants' town (the dungeon maps live under dungeon.maps above)
    maps: ['kvisthavn', 'bootstep_moor', 'lilleby'],
    quests: ['sigrids_spectacles', 'unsent_letter', 'the_silenced_bell', 'the_giants_picnic', 'footprint_pointed_home'],
  },

  /* =========================== UNLANDED (Ch.5–10) =========================== */

  // THE MINIMUS LANDING — Ch.5 flips to 'shipped'. The dungeon site becomes live
  // dungeon.maps (the Hedgerow → the Ducal Crown); the 2 overworld maps + all 5 §A10
  // quests fill in; the boss is now a live boss-flagged §A7 enemy at 4,000 HP with a
  // BOSS_SCRIPTS entry (the whiskerzilla draft + the drafts/ch5 tree retired in the
  // same commit). The validator's live Ch.5 assertions switch on; the draft 'site'/
  // settlement 'style' drop away (the S14c flip, the ADR-099 / Norway precedent).
  5: {
    chapter: 5,
    title: 'The Grand Duchy of Minimus',
    region: 'Minimus',
    status: 'shipped',
    targetLevel: 26,
    ember: 5,
    heartlight: 'The Bell Choir',
    band: 'ch5',
    travel: 'biplane', // Lucille lands in the duchy. All of it.
    dungeon: {
      name: 'The Hedgerow → the Ducal Crown',
      // the hedge maze (a forest at their scale) → the crown jewel + §A6 Resonance Site
      maps: ['the_hedgerow', 'ducal_crown'],
    },
    boss: { id: 'whiskerzilla', name: 'Whiskerzilla', hp: 4000, template: 'scriptedSurvival' },
    settlements: [{ id: 'minimus_major', kind: 'city' }],
    // the 2 overworld maps from buildChapter5Maps(): the tabletop capital + the
    // sanctioned colossi road (the dungeon maps live under dungeon.maps above)
    maps: ['minimus_major', 'procession_way'],
    quests: ['royal_census', 'civic_repairs', 'lost_and_found', 'the_silent_belfry', 'say_cheese_minister'],
  },

  6: {
    chapter: 6,
    title: 'The Ruins That Laugh',
    region: 'Africa',
    status: 'shipped',
    targetLevel: 30,
    ember: 6,
    heartlight: 'The Laughing Chord', // §A6 Heartlight 6 — the Homesong's laughing stem
    band: 'ch6',
    travel: 'biplane', // Lucille again (she has no business making it)
    dungeon: {
      name: 'The Laughing Ruins → the Sphinx\'s chin',
      // the dead carved city (the BRANCH's home — Held Breath + Choice 1) → the
      // Sphinx's chin (the §A6 boss + Resonance Site)
      maps: ['laughing_ruins', 'sphinx_chin'],
    },
    boss: { id: 'laughing_sphinx', name: 'The Laughing Sphinx', hp: 9000, template: 'riddle' },
    settlements: [{ id: 'zanzibel', kind: 'city' }],
    // the 2 overworld maps from buildChapter6Maps(): the bazaar port + the caravan
    // track (the dungeon maps live under dungeon.maps above)
    maps: ['zanzibel', 'savanna_run'],
    quests: ['stones_that_speak', 'watering_hole_convoy'],
  },

  7: {
    chapter: 7,
    title: "The Cobra's Palace",
    region: 'India',
    status: 'shipped',
    targetLevel: 35,
    ember: 7,
    heartlight: 'The Coiled Raga',
    band: 'ch7',
    travel: 'train', // the overloaded night train
    dungeon: {
      name: 'The Night Train → palace throne',
      maps: ['night_train', 'palace_throne'],
    },
    boss: { id: 'cobra_raja', name: 'Cobra Raja', hp: 20000, template: 'thresholdHeal' },
    settlements: [{ id: 'chandrapore', kind: 'city' }],
    // the 2 overworld maps from buildChapter7Maps(): the bazaar city + the monsoon road
    // (the dungeon maps live under dungeon.maps above)
    maps: ['chandrapore', 'monsoon_road'],
    quests: [
      'seven_spices',
      'monkey_who_stole_tuesday',
      'the_last_showing',
      'third_class_rules',
      'the_river_remembers',
    ],
  },

  8: {
    chapter: 8,
    title: 'The Paper Dragon',
    region: 'China',
    status: 'shipped',
    targetLevel: 40,
    ember: 8,
    heartlight: 'The Folded Hymn',
    band: 'ch8',
    travel: 'riverboat', // riverboat + the Yak Express
    dungeon: {
      name: 'The Spore Forest → Mt. Shu temple bell',
      maps: ['spore_forest', 'mt_shu_temple'],
    },
    boss: { id: 'paper_dragon', name: 'The Paper Dragon', hp: 45000, template: 'airborneGrounded' },
    settlements: [{ id: 'lotus_harbor', kind: 'city', style: 'painted-gates' }],
    // the 2 overworld maps from buildChapter8Maps(): the harbor city + the bamboo road
    // (the dungeon maps live under dungeon.maps above)
    maps: ['lotus_harbor', 'bamboo_road'],
    quests: ['brushes_of_mt_shu'],
  },

  // THE ROMANIA LANDING — Ch.9 flips to 'shipped'. The dungeon site becomes live
  // dungeon.maps (Castle Hoaxula → the Stone Brow monastery bell tower); the 2 overworld
  // maps (Valea Stelelor + the Old Road) + the bunis_table quest fill in; Count Hoaxula is
  // now a live boss-flagged §A7 enemy at canon 95,000 HP (mercyEnding). The COMPASSION axis
  // (CHOICE 2) turns past the throne. The §A7 HP table + §A10 quest pin land the same commit.
  9: {
    chapter: 9,
    title: 'The Count of Valea Stelelor',
    region: 'Romania',
    status: 'shipped',
    targetLevel: 46,
    ember: 9,
    band: 'ch9',
    travel: 'train', // the Orient Less-Express (third-class)
    dungeon: { name: 'Castle Hoaxula → monastery bell tower', maps: ['castle_hoaxula', 'stone_brow_monastery'] },
    boss: { id: 'count_hoaxula', name: 'Count Hoaxula', hp: 95000, template: 'mercyEnding' },
    settlements: [{ id: 'valea_stelelor', kind: 'village', style: 'painted-gates' }],
    // the 2 overworld maps from buildChapter9Maps(): the painted village + the Old Road
    // (the dungeon maps live under dungeon.maps above)
    maps: ['valea_stelelor', 'old_road'],
    quests: ['bunis_table'],
  },

  10: {
    chapter: 10,
    title: 'The Long Shot',
    region: 'Alaska → Hawaii → Mars',
    status: 'shipped',
    targetLevel: 52, // the §A6 52–55+ window's floor
    ember: 10,
    band: 'ch10',
    travel: 'snowcat', // snow-cat, then Pemberton's rocket The Long Shot
    dungeon: { name: 'The Sea of Silence (Mars)', maps: ['sea_of_silence'] },
    // the finale shell is bespoke (not one of the ten templates) — like the Tick
    boss: { id: 'the_hush', name: 'The Hush', hp: 150000, template: 'bespoke' },
    minibosses: [
      { id: 'frost_sentinel', name: 'Frost Sentinel', hp: 50000, template: 'elementalGolem' },
      { id: 'tiki_magma_golem', name: 'Tiki Magma Golem', hp: 50000, template: 'elementalGolem' },
    ],
    settlements: [
      { id: 'aurora_station', kind: 'village', style: 'fog-stone' },
      { id: 'mauna_lani', kind: 'village', style: 'fog-stone' },
    ],
    // the 4 overworld maps from buildChapter10Maps(): the two settlements + the two
    // gauntlet fields (the Sea of Silence dungeon lives under dungeon.maps above)
    maps: ['aurora_station', 'aurora_ice_field', 'mauna_lani', 'lani_magma_flats'],
    quests: ['lights_of_aurora', 'the_last_wave'],
  },
};

/** the ten chapter ids, in order ('1'…'10') — the validator + scaffold iterate it */
export const CHAPTER_IDS: readonly string[] = Object.keys(CHAPTER_MANIFESTS);

/** look a manifest up by chapter number (the scaffold tool's entry point) */
export function chapterManifest(n: number): ChapterManifest | undefined {
  return CHAPTER_MANIFESTS[String(n)];
}
