/**
 * THE COMPOSED ENDING — nine endings from modular cards (S21, ADR-128;
 * GAME_BIBLE §A6 as amended). Rather than nine bespoke finales, the epilogue is
 * a SEQUENCE OF CARDS the flag-state selects and assembles — the same principle
 * the game already uses for the caller ledger and Mr. Click's photo album.
 *
 * Nine SLOTS, one card each, played after the canon walk-home / House Key beat:
 *   tone   — the emotional weather           (by axis_finale)
 *   hush   — the dark's fate                  (by finale × compassion)
 *   world  — the world the kids saved         (by trust × compassion)
 *   jay    — where Jay is now                 (by trust)
 *   mia    — where Mia is now                 (by finale)
 *   milo   — where Milo is now                (by compassion)
 *   pippa  — where Pippa is now               (by whether she left)
 *   dorin  — where Dorin is now               (by whether he left)
 *   home   — the homecoming tag               (golden vs standard)
 *
 * Every slot has a FALLBACK card, so a player who made no choices still gets a
 * complete, non-empty ending. The 3 binary axes cross to ≥8 distinct sequences;
 * the golden "Long Shot" (src/engine/ending.ts) adds the ninth. The composer is
 * pure + exhaustively unit-tested (src/engine/ending.test.ts).
 */
import type { EndingSlot, EpilogueCard } from '../schemas';

/** the order the epilogue plays its slots */
export const SLOT_ORDER: readonly EndingSlot[] = [
  'tone',
  'hush',
  'world',
  'jay',
  'mia',
  'milo',
  'pippa',
  'dorin',
  'home',
];

const C = (c: EpilogueCard): EpilogueCard => c;

export const ENDING_CARDS: Record<string, EpilogueCard> = Object.fromEntries(
  [
    // ── TONE FRAME (by axis_finale) ──────────────────────────────────────────
    C({ id: 'tone_clean', slot: 'tone', order: 1, requires: { axis_finale_silence: true }, dialogue: 'epi_tone_clean' }),
    C({ id: 'tone_open_window', slot: 'tone', order: 1, requires: { axis_finale_forgive: true }, dialogue: 'epi_tone_open_window' }),
    C({ id: 'tone_default', slot: 'tone', order: 9, dialogue: 'epi_tone_default', fallback: true }),

    // ── THE HUSH'S FATE (by finale × compassion) ─────────────────────────────
    C({ id: 'hush_sealed', slot: 'hush', order: 1, requires: { axis_finale_silence: true, axis_compassion_openhand: true }, dialogue: 'epi_hush_sealed' }),
    C({ id: 'hush_spent', slot: 'hush', order: 1, requires: { axis_finale_silence: true, axis_compassion_iron: true }, dialogue: 'epi_hush_spent' }),
    C({ id: 'hush_befriended', slot: 'hush', order: 1, requires: { axis_finale_forgive: true, axis_compassion_openhand: true }, dialogue: 'epi_hush_befriended' }),
    C({ id: 'hush_owed', slot: 'hush', order: 1, requires: { axis_finale_forgive: true, axis_compassion_iron: true }, dialogue: 'epi_hush_owed' }),
    C({ id: 'hush_default', slot: 'hush', order: 9, dialogue: 'epi_hush_default', fallback: true }),

    // ── WORLD-STATE (by trust × compassion) ──────────────────────────────────
    C({ id: 'world_chosen', slot: 'world', order: 1, requires: { axis_trust_free: true, axis_compassion_openhand: true }, dialogue: 'epi_world_chosen' }),
    C({ id: 'world_warm_guarded', slot: 'world', order: 1, requires: { axis_trust_free: true, axis_compassion_iron: true }, dialogue: 'epi_world_warm_guarded' }),
    C({ id: 'world_grateful_uneasy', slot: 'world', order: 1, requires: { axis_trust_strings: true, axis_compassion_openhand: true }, dialogue: 'epi_world_grateful_uneasy' }),
    C({ id: 'world_quiet_kept', slot: 'world', order: 1, requires: { axis_trust_strings: true, axis_compassion_iron: true }, dialogue: 'epi_world_quiet_kept' }),
    C({ id: 'world_default', slot: 'world', order: 9, dialogue: 'epi_world_default', fallback: true }),

    // ── JAY (by axis_trust) ──────────────────────────────────────────────────
    C({ id: 'jay_free', slot: 'jay', order: 1, requires: { axis_trust_free: true }, dialogue: 'epi_jay_free' }),
    C({ id: 'jay_holding', slot: 'jay', order: 1, requires: { axis_trust_strings: true }, dialogue: 'epi_jay_holding' }),
    C({ id: 'jay_default', slot: 'jay', order: 9, dialogue: 'epi_jay_default', fallback: true }),

    // ── MIA (by axis_finale) ─────────────────────────────────────────────────
    C({ id: 'mia_silence', slot: 'mia', order: 1, requires: { axis_finale_silence: true }, dialogue: 'epi_mia_silence' }),
    C({ id: 'mia_forgive', slot: 'mia', order: 1, requires: { axis_finale_forgive: true }, dialogue: 'epi_mia_forgive' }),
    C({ id: 'mia_default', slot: 'mia', order: 9, dialogue: 'epi_mia_default', fallback: true }),

    // ── MILO (by axis_compassion) ────────────────────────────────────────────
    C({ id: 'milo_open', slot: 'milo', order: 1, requires: { axis_compassion_openhand: true }, dialogue: 'epi_milo_open' }),
    C({ id: 'milo_iron', slot: 'milo', order: 1, requires: { axis_compassion_iron: true }, dialogue: 'epi_milo_iron' }),
    C({ id: 'milo_default', slot: 'milo', order: 9, dialogue: 'epi_milo_default', fallback: true }),

    // ── PIPPA (by whether she left on the STRINGS path) ──────────────────────
    C({ id: 'pippa_left', slot: 'pippa', order: 1, requires: { pippa_left: true }, dialogue: 'epi_pippa_left' }),
    C({ id: 'pippa_minister', slot: 'pippa', order: 9, dialogue: 'epi_pippa_minister', fallback: true }),

    // ── DORIN (by whether he left on the IRON path) ──────────────────────────
    C({ id: 'dorin_left', slot: 'dorin', order: 1, requires: { dorin_left: true }, dialogue: 'epi_dorin_left' }),
    C({ id: 'dorin_named', slot: 'dorin', order: 9, dialogue: 'epi_dorin_named', fallback: true }),

    // ── HOMECOMING TAG (golden vs standard) ──────────────────────────────────
    C({ id: 'home_long_shot', slot: 'home', order: 1, requires: { ending_long_shot: true }, dialogue: 'epi_home_long_shot' }),
    C({ id: 'home_standard', slot: 'home', order: 9, dialogue: 'epi_home_standard', fallback: true }),
  ].map((c) => [c.id, c]),
);

/** flags the cards gate on that are NOT choice flags (party fate + the golden gate) */
export const KNOWN_ENDING_FLAGS: readonly string[] = [
  'pippa_left',
  'dorin_left',
  'ending_long_shot',
  'stolen_light_banked',
];
