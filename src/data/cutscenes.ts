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
          'Otterbrook, Ohio. Summer, 1995.',
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

const CH3: Cutscene[] = [
  {
    id: 'ch3_journey',
    chapter: 'ch3',
    beats: panels(
      'lucille_to_wintermoor',
      'milo_greenhouse_crash',
      'porter_first_borrow',
      'old_stones_resonance',
      'wintermoor_machine_fog',
      'headmaster_mainframe',
      'heartlight_3_machine_fog_lifts',
    ),
  },
];

const CH4: Cutscene[] = [
  {
    id: 'ch4_journey',
    chapter: 'ch4',
    beats: panels(
      'fjord_establishing',
      'lucille_north_sea_hop',
      'kvisthavn_under_cliffs',
      'sleeper_spine_crossing',
      'bootstep_moor_growth',
      'whisperwig_reveal',
      'lilleby_giants_kneel',
      'heartlight_4_deep_hum',
    ),
  },
];

const CH5: Cutscene[] = [
  {
    id: 'ch5_journey',
    chapter: 'ch5',
    beats: panels(
      'tabletop_duchy_establishing',
      'grand_duchy_travel_in',
      'minimus_major_tabletop_capital',
      'big_little_lens_build',
      'pippa_matchbox_briefing',
      'pippa_joins_party',
      'whiskerzilla_knighted',
      'heartlight_5_bell_choir',
    ),
  },
];

const CH6: Cutscene[] = [
  {
    id: 'ch6_journey',
    chapter: 'ch6',
    beats: panels(
      'caravan_to_zanzibel',
      'savanna_caravan_at_dusk',
      'zanzibel_market',
      'courier_teaches_teleport_alpha',
      'laughing_ruins',
      'laughing_sphinx_riddle',
      'sphinx_chin_resonance',
    ),
  },
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

const CH7: Cutscene[] = [
  {
    id: 'ch7_journey',
    chapter: 'ch7',
    beats: panels(
      'night_train_to_chandrapore',
      'chandrapore_bazaars',
      'locket_train_heist',
      'royal_vivarium_palace',
      'cobra_raja_reveal',
      'palace_throne_resonance',
      'cinema_about_the_party',
    ),
  },
];

const CH8: Cutscene[] = [
  {
    id: 'ch8_journey',
    chapter: 'ch8',
    beats: panels(
      'riverboat_to_lotus_harbor',
      'lotus_harbor_arrival',
      'spore_forest_scramble',
      'yak_express_to_mt_shu',
      'paper_guardians_false_folds',
      'paper_dragon_reveal',
      'temple_bell_resonance',
    ),
  },
];

const CH9: Cutscene[] = [
  {
    id: 'ch9_journey',
    chapter: 'ch9',
    beats: panels(
      'orient_less_express_to_valea',
      'valea_stelelor_arrival',
      'buni_feast_basket',
      'castle_hoaxula',
      'count_hoaxula_unmasked',
      'monastery_bell_tower_resonance',
      'trial_of_the_mute_mountain',
    ),
  },
];

const CH10: Cutscene[] = [
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
