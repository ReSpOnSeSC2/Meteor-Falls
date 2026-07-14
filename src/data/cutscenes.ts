/**
 * CUTSCENE REGISTRY — the data half of the authored-panel cutscene system.
 *
 * A "cutscene" is an ordered list of full-screen painted panels (one PNG per
 * beat, authored at `assets/art/cutscenes/<chapter>/<art>_01.png`, or
 * `<art>_4x.png` when a runtime-resolution panel supersedes an older placeholder).
 * The panels are STILLS; motion is code — Ken Burns drift, cross-fades, timed
 * captions, and per-beat sfx/flash/shake — applied by the player in
 * `src/engine/cutscene.ts`.
 *
 * This file is PURE DATA (no Phaser, no asset imports) so content-validate and
 * unit tests can read it. The engine cross-references each beat's `art` against
 * the PNGs actually on disk and skips any that aren't authored yet — so adding a
 * cutscene to a future chapter is: drop the PNG in, add/fill a beat here.
 *
 * To AUTHOR a beat's narration, fill `captions` (each string is one timed line,
 * `{token}` vars are substituted). Empty/omitted captions play as a silent
 * Ken Burns hold — already valid, ready for text.
 */
import { ENDING_CARDS } from './endings';

/** Ken Burns drift for one beat. Scales are multipliers on the screen-cover
 *  scale; pans are NATIVE px (the engine applies `s()` so they read the same at
 *  every resolution). All optional — omit for a gentle default push-in. */
export interface KenBurns {
  /** start zoom (× screen-cover). Default 1.06. */
  fromScale?: number;
  /** end zoom (× screen-cover). Default 1.13. */
  toScale?: number;
  /** horizontal drift over the beat, native px. Default 0. */
  panX?: number;
  /** vertical drift over the beat, native px. Default 0. */
  panY?: number;
  /** motion duration ms. Default: derived from the captions' read time. */
  ms?: number;
  /** tween ease. Default 'sine.inOut'. */
  ease?: string;
}

/** One panel + its motion and cues. */
export interface CutsceneBeat {
  /** file stem under `assets/art/cutscenes/<chapter>/` (no `_01.png`/`_4x.png`). */
  art: string;
  /** timed narration lines shown over the panel (vars substituted). */
  captions?: string[];
  /** Ken Burns drift for this beat. */
  motion?: KenBurns;
  /** one-shot sfx on the beat's entrance (e.g. 'meteor_crash'). */
  sfx?: string;
  /** music cue to start on entrance (crossfades). */
  music?: string;
  /** silence the current track on entrance (e.g. the held breath after impact). */
  stopMusic?: boolean;
  /** camera shake on entrance: [durationMs, intensity]. */
  shake?: [number, number];
  /** white flash on entrance, ms (impact pop). */
  flash?: number;
  /** extra ms to linger after the captions finish. */
  hold?: number;
  /**
   * ANIMATED panel: the number of frames. Files are `<art>_01.png … <art>_NN.png`
   * (the still convention extended; a `_4x.png` can supersede frame 1). Played as
   * a loop under the same Ken Burns/caption motion. Omit (or 1) for a single still.
   */
  frames?: number;
  /** playback rate (frames/sec) when `frames` > 1. Default 6. */
  fps?: number;
  /** cross-dissolve between frames instead of a hard cut (good for imagegen
   *  keyframes that aren't pixel-coherent). Default false (hard flipbook cut). */
  dissolve?: boolean;
}

/** An ordered, replayable cutscene. */
export interface Cutscene {
  /** unique id used to play it: `playCutscene(scene, id)`. */
  id: string;
  /** chapter folder under `assets/art/cutscenes/`. */
  chapter: string;
  beats: CutsceneBeat[];
}

/** Compact scaffold helper: bare panels, captions/cues to be authored later. */
const panels = (...arts: string[]): CutsceneBeat[] => arts.map((art) => ({ art }));

/** Preferred on-disk filenames for a beat frame, in lookup order. */
export function cutscenePanelFilenames(art: string, n = 1): readonly string[] {
  if (n <= 1) return [`${art}_4x.png`, `${art}_01.png`];
  return [`${art}_${String(n).padStart(2, '0')}.png`];
}

/* ============================ CHAPTER 1 (Otterbrook) ============================ */
/* The opening is fully authored (it supersedes the ADR-041 hand-vector cinema).
 * The remaining ch1 beats carry their panels and cues; their captions are
 * scaffolded for authoring. */

const CH1: Cutscene[] = [
  {
    id: 'ch1_opening',
    chapter: 'ch1',
    beats: [
      {
        art: 'meteor_2am',
        music: 'starfall',
        sfx: 'meteor_far',
        motion: { fromScale: 1.04, toScale: 1.17, panY: -6, ease: 'quad.in' },
        captions: [
          'Otterbrooke, Ohio. Summer, 1995.',
          '2:11 AM — everyone asleep but the crickets, one porch light, and a dog with opinions about the sky.',
          'One of the stars is getting bigger. Stars are not supposed to do that.',
        ],
      },
      {
        art: 'hickory_hill',
        sfx: 'meteor_crash',
        stopMusic: true,
        flash: 240,
        shake: [1500, 0.02],
        motion: { fromScale: 1.0, toScale: 1.12, ease: 'quad.out' },
        captions: [
          'It comes down behind Hickory Hill, and the whole town feels it land.',
          'For one bright second the night has extra stars — then they scatter, all but one.',
        ],
        hold: 400,
      },
      {
        art: 'otterbrook_at_night',
        sfx: 'light_on',
        motion: { fromScale: 1.1, toScale: 1.04, panX: 16, ease: 'sine.inOut' },
        captions: [
          'One by one, the porch lights of Otterbrook come on. The dog was right.',
          'Six blocks east, one upstairs window is about to join them.',
        ],
      },
    ],
  },
  // Remaining ch1 beats — panels + cues ready; fill `captions` to author.
  {
    id: 'ch1_glint',
    chapter: 'ch1',
    beats: [
      { art: 'glints_prophecy', sfx: 'ember' },
      { art: 'titanic_tick_reveal', sfx: 'rumble', shake: [600, 0.01] },
    ],
  },
  { id: 'ch1_zapper', chapter: 'ch1', beats: [{ art: 'bug_zapper' }] },
  { id: 'ch1_mom', chapter: 'ch1', beats: [{ art: 'moms_payphone_call', sfx: 'phone' }] },
  { id: 'ch1_heartlight', chapter: 'ch1', beats: [{ art: 'first_heartlight', sfx: 'ember' }] },
];

/* ===================== CHAPTERS 2–10 — scaffolded, ready to author =====================
 * Each is one cutscene per chapter, beats in narrative order (the doc's §7 list,
 * matched to the PNGs on disk). They already play as silent Ken Burns sequences;
 * fill each beat's `captions`/`sfx`/`motion` to bring them up to ch1's finish.
 * Split a chapter into multiple ids (like ch1) whenever beats fire at different
 * story moments. */

const CH2: Cutscene[] = [
  {
    id: 'ch2_journey',
    chapter: 'ch2',
    beats: panels(
      'banana_boat_to_puerto_sol',
      'puerto_sol_arrival',
      'llama_jungle_paths',
      'valle_dorado_wishers',
      'rotating_step_pyramid',
      'pyramid_apex_heartlight',
      'gilded_grin_reveal',
    ),
  },
];

const CH3_BEATS = {
  flight: {
    art: 'lucille_to_wintermoor',
    sfx: 'engine_start',
    motion: { fromScale: 1.03, toScale: 1.15, panX: -14, panY: 4, ms: 10500, ease: 'sine.inOut' },
    captions: [
      'Lucille noses east into weather that has forgotten how to end.',
      'Below the wing: slate roofs, a black river, and moorland vanishing shelf by shelf into fog.',
      'Bert calls it a landing. The map calls it the whole of Foggybottom-on-Tyne.',
    ],
    hold: 350,
  },
  milo: {
    art: 'milo_greenhouse_crash',
    sfx: 'meteor_crash',
    flash: 120,
    shake: [700, 0.012] as [number, number],
    motion: { fromScale: 1.02, toScale: 1.14, panX: 10, panY: -5, ms: 9200, ease: 'quad.out' },
    captions: [
      'The porter raises one finger. Somewhere beyond him, an engine answers with several bad ideas.',
      'Glass, ivy, and a homemade rocket arrive at Wintermoor in the same instant.',
      'The boy who climbs out introduces himself as Milo. He is already trying to repair the crater.',
    ],
  },
  borrow: {
    art: 'porter_first_borrow',
    sfx: 'fx_mindwarp',
    motion: { fromScale: 1.12, toScale: 1.04, panX: -9, ms: 9000, ease: 'sine.inOut' },
    captions: [
      "Jay reaches for the porter's anger and finds a door behind it.",
      'For one impossible moment, another pair of shoes remembers how to move.',
      'The gate opens. The feeling does not leave with the porter.',
    ],
  },
  stones: {
    art: 'old_stones_resonance',
    sfx: 'ember',
    flash: 180,
    motion: { fromScale: 1.08, toScale: 1.17, panY: -10, ms: 9800, ease: 'sine.inOut' },
    captions: [
      'The Old Stones stand in a landscape much larger than their ring.',
      'Every wall, spring, and fallen marker points toward the same buried note.',
      'The third Heartlight is close. Something mechanical is pressing down on its song.',
    ],
  },
  fog: {
    art: 'wintermoor_machine_fog',
    sfx: 'rumble',
    motion: { fromScale: 1.04, toScale: 1.16, panX: 12, panY: 5, ms: 9000, ease: 'quad.in' },
    captions: [
      'The fog is not weather. Pipes under Wintermoor have been teaching the valley to hold its breath.',
      'Each pulse begins beneath the school and rolls downhill toward the Tyne.',
    ],
  },
  mainframe: {
    art: 'headmaster_mainframe',
    music: 'boss',
    sfx: 'alert',
    shake: [500, 0.01] as [number, number],
    motion: { fromScale: 1.03, toScale: 1.13, panY: 8, ms: 8200, ease: 'quad.in' },
    captions: [
      'The Headmaster is all timetable, brass, and borrowed thunder.',
      'Behind him, the Mainframe counts every breath in the valley and calls the total discipline.',
    ],
  },
  heartlight: {
    art: 'heartlight_3_machine_fog_lifts',
    music: 'heartlight',
    sfx: 'ember',
    flash: 260,
    motion: { fromScale: 1.14, toScale: 1.02, panY: -8, ms: 10500, ease: 'sine.inOut' },
    captions: [
      'The Mainframe stops. The valley exhales.',
      'Fog loosens from the terraces, the school windows find the dawn, and the Tyne turns silver.',
      'In the quiet under the Old Stones, the third Heartlight answers.',
    ],
    hold: 600,
  },
} satisfies Record<string, CutsceneBeat>;

const CH3: Cutscene[] = [
  // The full reel remains available to the cutscene gallery and asset audit.
  // Story code plays the single-beat ids below at their actual moments so the
  // flight cannot spoil Milo, the Mainframe, or the Heartlight.
  { id: 'ch3_journey', chapter: 'ch3', beats: Object.values(CH3_BEATS) },
  { id: 'ch3_flight', chapter: 'ch3', beats: [CH3_BEATS.flight] },
  { id: 'ch3_milo_join', chapter: 'ch3', beats: [CH3_BEATS.milo] },
  { id: 'ch3_first_borrow', chapter: 'ch3', beats: [CH3_BEATS.borrow] },
  { id: 'ch3_stones', chapter: 'ch3', beats: [CH3_BEATS.stones] },
  { id: 'ch3_fog_reveal', chapter: 'ch3', beats: [CH3_BEATS.fog] },
  { id: 'ch3_mainframe', chapter: 'ch3', beats: [CH3_BEATS.mainframe] },
  { id: 'ch3_heartlight', chapter: 'ch3', beats: [CH3_BEATS.heartlight] },
];

const CH4_BEATS = {
  fjord: panels('fjord_establishing')[0],
  flight: panels('lucille_north_sea_hop')[0],
  arrival: panels('kvisthavn_under_cliffs')[0],
  moor: panels('bootstep_moor_growth')[0],
  lilleby: panels('lilleby_giants_kneel')[0],
  spine: panels('sleeper_spine_crossing')[0],
  boss: panels('whisperwig_reveal')[0],
  heartlight: panels('heartlight_4_deep_hum')[0],
} satisfies Record<string, CutsceneBeat>;

const CH4: Cutscene[] = [
  // Gallery reel remains complete; runtime uses the contextual ids below.
  { id: 'ch4_journey', chapter: 'ch4', beats: Object.values(CH4_BEATS) },
  { id: 'ch4_flight', chapter: 'ch4', beats: [CH4_BEATS.fjord, CH4_BEATS.flight] },
  { id: 'ch4_arrival', chapter: 'ch4', beats: [CH4_BEATS.arrival] },
  { id: 'ch4_moor', chapter: 'ch4', beats: [CH4_BEATS.moor] },
  { id: 'ch4_lilleby', chapter: 'ch4', beats: [CH4_BEATS.lilleby] },
  { id: 'ch4_spine', chapter: 'ch4', beats: [CH4_BEATS.spine] },
  { id: 'ch4_whisperwig', chapter: 'ch4', beats: [CH4_BEATS.boss] },
  { id: 'ch4_heartlight', chapter: 'ch4', beats: [CH4_BEATS.heartlight] },
];

const CH5_BEATS = {
  establishing: panels('tabletop_duchy_establishing')[0],
  flight: panels('grand_duchy_travel_in')[0],
  capital: panels('minimus_major_tabletop_capital')[0],
  briefing: panels('pippa_matchbox_briefing')[0],
  lens: panels('big_little_lens_build')[0],
  join: panels('pippa_joins_party')[0],
  knighted: panels('whiskerzilla_knighted')[0],
  heartlight: panels('heartlight_5_bell_choir')[0],
} satisfies Record<string, CutsceneBeat>;

const CH5: Cutscene[] = [
  // Gallery reel remains complete; runtime uses the contextual ids below so
  // flying into Minimus cannot spoil the Lens, Whiskerzilla, or Heartlight.
  { id: 'ch5_journey', chapter: 'ch5', beats: Object.values(CH5_BEATS) },
  { id: 'ch5_flight', chapter: 'ch5', beats: [CH5_BEATS.establishing, CH5_BEATS.flight] },
  { id: 'ch5_arrival', chapter: 'ch5', beats: [CH5_BEATS.capital, CH5_BEATS.briefing] },
  { id: 'ch5_lens', chapter: 'ch5', beats: [CH5_BEATS.lens] },
  { id: 'ch5_join', chapter: 'ch5', beats: [CH5_BEATS.join] },
  { id: 'ch5_knighted', chapter: 'ch5', beats: [CH5_BEATS.knighted] },
  { id: 'ch5_heartlight', chapter: 'ch5', beats: [CH5_BEATS.heartlight] },
];

const CH6_BEATS = {
  caravan: panels('caravan_to_zanzibel')[0],
  dusk: panels('savanna_caravan_at_dusk')[0],
  market: panels('zanzibel_market')[0],
  courier: panels('courier_teaches_teleport_alpha')[0],
  ruins: panels('laughing_ruins')[0],
  sphinx: panels('laughing_sphinx_riddle')[0],
  heartlight: panels('sphinx_chin_resonance')[0],
} satisfies Record<string, CutsceneBeat>;

const CH6: Cutscene[] = [
  // Gallery reel remains complete; runtime uses the contextual ids below so
  // the flight cannot spoil the courier, dungeon, Sphinx, or Heartlight panels.
  { id: 'ch6_journey', chapter: 'ch6', beats: Object.values(CH6_BEATS) },
  { id: 'ch6_flight', chapter: 'ch6', beats: [CH6_BEATS.caravan, CH6_BEATS.dusk] },
  { id: 'ch6_arrival', chapter: 'ch6', beats: [CH6_BEATS.market] },
  { id: 'ch6_courier', chapter: 'ch6', beats: [CH6_BEATS.courier] },
  { id: 'ch6_ruins', chapter: 'ch6', beats: [CH6_BEATS.ruins] },
  { id: 'ch6_sphinx', chapter: 'ch6', beats: [CH6_BEATS.sphinx] },
  { id: 'ch6_heartlight', chapter: 'ch6', beats: [CH6_BEATS.heartlight] },
  // S21 (ADR-126): THE HELD BREATH unlocks — the Star Locket records the breath
  // around the song. The reverse Ken Burns (a gentle pull-BACK + soft flash) reads
  // as the world inhaling, the moment drawn back. Played from OverworldScene.heldBreathBeat.
  {
    id: 'ch6_held_breath',
    chapter: 'ch6',
    beats: [
      {
        art: 'held_breath_awaken',
        sfx: 'ember',
        flash: 220,
        motion: { fromScale: 1.15, toScale: 1.04, panY: 5, ms: 9000, ease: 'sine.inOut' },
        hold: 500,
        captions: [
          'The laughter in the ruins comes around again — the same laugh, the same place, like a record finding the same scratch.',
          "And then it isn't the laugh that repeats. It's the MOMENT.",
          '{rex} closes a hand around the Star Locket. It is recording — not the song this time. The breath around it.',
          'He breathes in. The world breathes in with him. And, for a second, it lets him hold it.',
          '{faye} is not smiling. "You can put it back, can\'t you. You can make it different."',
          '"You\'re not changing what happened. You\'re changing what they CHOSE. Be careful which one of those you think it is."',
        ],
      },
    ],
  },
];

const CH7_BEATS = {
  train: panels('night_train_to_chandrapore')[0],
  bazaar: panels('chandrapore_bazaars')[0],
  heist: panels('locket_train_heist')[0],
  palace: panels('royal_vivarium_palace')[0],
  raja: panels('cobra_raja_reveal')[0],
  heartlight: panels('palace_throne_resonance')[0],
  cinema: panels('cinema_about_the_party')[0],
} satisfies Record<string, CutsceneBeat>;

const CH7: Cutscene[] = [
  // Gallery order is canonical. Runtime must use only the contextual entries
  // below so arrival cannot reveal the heist, Raja, Heartlight, or cinema beat.
  { id: 'ch7_journey', chapter: 'ch7', beats: Object.values(CH7_BEATS) },
  { id: 'ch7_train_in', chapter: 'ch7', beats: [CH7_BEATS.train] },
  { id: 'ch7_bazaar', chapter: 'ch7', beats: [CH7_BEATS.bazaar] },
  { id: 'ch7_heist', chapter: 'ch7', beats: [CH7_BEATS.heist] },
  { id: 'ch7_palace', chapter: 'ch7', beats: [CH7_BEATS.palace] },
  { id: 'ch7_raja', chapter: 'ch7', beats: [CH7_BEATS.raja] },
  { id: 'ch7_heartlight', chapter: 'ch7', beats: [CH7_BEATS.heartlight] },
  { id: 'ch7_cinema', chapter: 'ch7', beats: [CH7_BEATS.cinema] },
];

const CH8_BEATS = {
  riverboat: panels('riverboat_to_lotus_harbor')[0],
  arrival: panels('lotus_harbor_arrival')[0],
  spore: panels('spore_forest_scramble')[0],
  yak: panels('yak_express_to_mt_shu')[0],
  falseFolds: panels('paper_guardians_false_folds')[0],
  dragon: panels('paper_dragon_reveal')[0],
  dragonDeparted: panels('paper_dragon_reveal_departed')[0],
  heartlight: panels('temple_bell_resonance')[0],
  heartlightDeparted: panels('temple_bell_resonance_departed')[0],
} satisfies Record<string, CutsceneBeat>;

export type Ch8PartyCutsceneMoment = 'dragon' | 'heartlight';
export type Ch8PartyCutsceneId =
  | 'ch8_dragon'
  | 'ch8_dragon_departed'
  | 'ch8_heartlight'
  | 'ch8_heartlight_departed';

/** Keep post-Trust stills honest for both the Pippa-present and departed paths. */
export function ch8PartyCutsceneId(
  moment: Ch8PartyCutsceneMoment,
  pippaPresent: boolean,
): Ch8PartyCutsceneId {
  return `ch8_${moment}${pippaPresent ? '' : '_departed'}` as Ch8PartyCutsceneId;
}

const CH8: Cutscene[] = [
  // Gallery order is canonical. Runtime uses only the contextual one-panel
  // entries below, so chapter entry cannot reveal the forest, Dragon, or bell.
  {
    id: 'ch8_journey',
    chapter: 'ch8',
    beats: [
      CH8_BEATS.riverboat,
      CH8_BEATS.arrival,
      CH8_BEATS.spore,
      CH8_BEATS.yak,
      CH8_BEATS.falseFolds,
      CH8_BEATS.dragon,
      CH8_BEATS.heartlight,
    ],
  },
  { id: 'ch8_riverboat', chapter: 'ch8', beats: [CH8_BEATS.riverboat] },
  { id: 'ch8_arrival', chapter: 'ch8', beats: [CH8_BEATS.arrival] },
  { id: 'ch8_spore', chapter: 'ch8', beats: [CH8_BEATS.spore] },
  { id: 'ch8_yak', chapter: 'ch8', beats: [CH8_BEATS.yak] },
  { id: 'ch8_false_folds', chapter: 'ch8', beats: [CH8_BEATS.falseFolds] },
  { id: 'ch8_dragon', chapter: 'ch8', beats: [CH8_BEATS.dragon] },
  { id: 'ch8_dragon_departed', chapter: 'ch8', beats: [CH8_BEATS.dragonDeparted] },
  { id: 'ch8_heartlight', chapter: 'ch8', beats: [CH8_BEATS.heartlight] },
  { id: 'ch8_heartlight_departed', chapter: 'ch8', beats: [CH8_BEATS.heartlightDeparted] },
];

const CH9_LEGACY_BEATS = {
  train: panels('orient_less_express_to_valea')[0],
  arrival: panels('valea_stelelor_arrival')[0],
  buni: panels('buni_feast_basket')[0],
  castle: panels('castle_hoaxula')[0],
  unmasked: panels('count_hoaxula_unmasked')[0],
  heartlight: panels('monastery_bell_tower_resonance')[0],
  trial: panels('trial_of_the_mute_mountain')[0],
} satisfies Record<string, CutsceneBeat>;

export type Ch9PartyCutsceneMoment =
  | 'train'
  | 'arrival'
  | 'buni'
  | 'castle'
  | 'unmasked'
  | 'heartlight'
  | 'choice';

export type Ch9PartyCutsceneId = `ch9_${Ch9PartyCutsceneMoment}_${'pippa' | 'departed'}`;

/** Chapter 9 occurs after Dorin joins and after Pippa may leave. Every ensemble
 * still is selected from serialized party truth, never from a profile label. */
export function ch9PartyCutsceneId(
  moment: Ch9PartyCutsceneMoment,
  pippaPresent: boolean,
): Ch9PartyCutsceneId {
  return `ch9_${moment}_${pippaPresent ? 'pippa' : 'departed'}`;
}

function ch9PartyBeat(moment: Ch9PartyCutsceneMoment, pippaPresent: boolean): CutsceneBeat {
  const artStem: Record<Ch9PartyCutsceneMoment, string> = {
    train: 'orient_less_express_to_valea',
    arrival: 'valea_stelelor_arrival',
    buni: 'buni_feast_basket',
    castle: 'castle_hoaxula',
    unmasked: 'count_hoaxula_unmasked',
    heartlight: 'monastery_bell_tower_resonance',
    choice: 'choice_ch9_iron_or_open',
  };
  return panels(`${artStem[moment]}_${pippaPresent ? 'pippa' : 'departed'}`)[0];
}

const CH9: Cutscene[] = [
  {
    id: 'ch9_journey',
    chapter: 'ch9',
    // Retained as a gallery/source record. Runtime uses only the one-panel
    // contextual entries below so arrival cannot spoiler the whole chapter.
    beats: Object.values(CH9_LEGACY_BEATS),
  },
  ...(['train', 'arrival', 'buni', 'castle', 'unmasked', 'heartlight', 'choice'] as const)
    .flatMap((moment): Cutscene[] => [true, false].map((pippaPresent) => ({
      id: ch9PartyCutsceneId(moment, pippaPresent),
      chapter: 'ch9',
      beats: [ch9PartyBeat(moment, pippaPresent)],
    }))),
  { id: 'ch9_trial', chapter: 'ch9', beats: [CH9_LEGACY_BEATS.trial] },
];

const CH10: Cutscene[] = [
  {
    // the §A5 next-leg montage — Bert's hop north + the snowcat run onto the ice to
    // AURORA STATION (the panels no-op cleanly until their PNGs land)
    id: 'ch10_journey',
    chapter: 'ch10',
    beats: panels('snowcat_run_to_aurora_station', 'aurora_station_decodes_mars'),
  },
  {
    id: 'ch10_finale',
    chapter: 'ch10',
    beats: panels(
      'sea_of_silence_arrival',
      'tiki_magma_golem',
      'mauna_lani_parts_run',
      'snowcat_run_to_aurora_station',
      'frost_sentinel',
      'aurora_station_decodes_mars',
      'the_calling_worldwide_phones',
      'phone_dad_phone_mom',
      'the_long_shot_launch',
      'hush_undone',
      'homesong_full',
      'mia_prays',
      'player_name_confirm',
      'extended_credits',
    ),
  },
];

// S21 (ADR-127): the three Axes' choice-intro panels — silent establishing shots
// (OverworldScene.runChoice plays `${band}_choice` before the dilemma dialogue).
// ch10's panel is authored last, so its cutscene no-ops cleanly until the PNG lands.
const CH_CHOICES: Cutscene[] = [
  { id: 'ch6_choice', chapter: 'ch6', beats: [{ art: 'choice_ch6_the_string', motion: { fromScale: 1.08, toScale: 1.16, panY: -4, ms: 5200 }, hold: 300 }] },
  { id: 'ch9_choice', chapter: 'ch9', beats: [{ art: 'choice_ch9_iron_or_open', motion: { fromScale: 1.08, toScale: 1.16, panY: -4, ms: 5200 }, hold: 300 }] },
  { id: 'ch10_choice', chapter: 'ch10', beats: [{ art: 'choice_ch10_what_the_song_is_for', motion: { fromScale: 1.06, toScale: 1.14, ms: 6000 }, hold: 400 }] },
];

// S21 (ADR-128): one cutscene per composed-ending CARD — the panel is a gentle
// still under its caption (OverworldScene.playEnding plays `${card.dialogue}` then
// says it). Built from ENDING_CARDS so the set stays in lockstep; each no-ops until
// its `assets/art/cutscenes/ch10/<epi_id>_4x.png` lands.
const CH_EPILOGUE: Cutscene[] = Object.values(ENDING_CARDS).map((c) => ({
  id: c.dialogue,
  chapter: 'ch10',
  beats: [{ art: c.dialogue, motion: { fromScale: 1.05, toScale: 1.12, ms: 5200 }, hold: 250 }],
}));

const ALL: Cutscene[] = [
  ...CH1, ...CH2, ...CH3, ...CH4, ...CH5,
  ...CH6, ...CH7, ...CH8, ...CH9, ...CH10,
  ...CH_CHOICES, ...CH_EPILOGUE,
];

/** Every cutscene, keyed by id. Play one with `playCutscene(scene, id)`. */
export const CUTSCENES: Record<string, Cutscene> = Object.fromEntries(
  ALL.map((cs) => [cs.id, cs]),
);
