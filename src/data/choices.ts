/**
 * THE THREE AXES — the game-long player choices (S21, ADR-127; GAME_BIBLE §A4
 * as amended). Three weighty, no-correct-answer decisions, each placed on an
 * existing dramatic peak, each setting ONE binary axis flag that gates later
 * content (`ifFlag`/`unlessFlag`), party fate (src/engine/party.ts), end-game
 * powers, map state, and — composed — one of nine endings (src/data/endings.ts):
 *
 *   TRUST       ch6_string  — STRINGS | FREE     (Ch.6, the Laughing Ruins)
 *   COMPASSION  ch9_count   — IRON | OPEN_HAND   (Ch.9, Count Hoaxula's mercy)
 *   FINALE      ch10_song   — SILENCE | FORGIVE  (Ch.10, THE CALLING) — terminal
 *
 * The spine is untouched: a player who never engages still finishes the Ember
 * trail and gets a default-composed ending. Recording a choice clears its
 * sibling option-flags (exactly one is ever set) and may bank a finale caller
 * (the §A6 ledger). Modeled on the flag-chained story threads (storythreads.ts).
 */
import type { ChoiceDef } from '../schemas';

export type ChoiceId = 'ch6_string' | 'ch9_count' | 'ch10_song';

export const CHOICE_IDS: readonly ChoiceId[] = ['ch6_string', 'ch9_count', 'ch10_song'];

export const CHOICES: Record<ChoiceId, ChoiceDef> = {
  // ── TRUST · Ch.6 "The Ruins That Laugh" — the first pull ──────────────────
  // Rides the Trust escalation (thread_trust_esc3) the same chapter the Held
  // Breath unlocks. The Hush freezes Pippa at a crumbling stair; Jay can BORROW
  // her one step to safety (Puppet) — proving the whisper true — or set the
  // power down and trust her to find her own feet.
  ch6_string: {
    id: 'ch6_string',
    chapter: 6,
    band: 'ch6',
    axis: 'trust',
    intro: 'choice_ch6_intro',
    decidedFlag: 'ch6_string_decided',
    options: [
      {
        id: 'pull',
        label: 'PULL THE STRING.',
        blurb: 'Borrow {pippa}. Walk her back. Save her now — and let them all see exactly what you can do.',
        flag: 'axis_trust_strings',
        outro: 'choice_ch6_pull',
      },
      {
        id: 'open',
        label: 'OPEN YOUR HAND.',
        blurb: "Drop the power where she can see you drop it. Trust her to find her own feet. Even if she doesn't.",
        flag: 'axis_trust_free',
        outro: 'choice_ch6_open',
      },
    ],
  },

  // ── COMPASSION · Ch.9 "The Count of Valea Stelelor" — iron or open hand ────
  // Rides the canon Hoaxula mercy beat. At the Unmask, Mia can PRAY Vlad to
  // peace (canon mercy, untouched) — OR Milo's Vibe Siphon can rip the stolen
  // warmth out and bank the STOLEN LIGHT, leaving Vlad alive but emptied.
  ch9_count: {
    id: 'ch9_count',
    chapter: 9,
    band: 'ch9',
    axis: 'compassion',
    intro: 'choice_ch9_intro',
    decidedFlag: 'ch9_count_decided',
    options: [
      {
        id: 'mercy',
        label: 'THE OPEN HAND.',
        blurb: 'Pray. Let the stolen warmth go home. Win nothing but the valley back.',
        flag: 'axis_compassion_openhand',
        outro: 'choice_ch9_open',
        // mercy is rewarded: Vlad goes home to Cleveland and phones in for the
        // finale CALLING (the §A6 ledger, frozen like a quest caller).
        caller: {
          name: 'Vlad, the Actor',
          quote: 'I played a vampire for eleven years. You looked at me and saw a guy. Send it everything.',
          effect: { kind: 'damage', power: 440 },
        },
      },
      {
        id: 'iron',
        label: 'THE IRON.',
        blurb: "Pull the Vibe out and keep it. He lives. He just lives with nothing. You'll need it where you're going.",
        flag: 'axis_compassion_iron',
        outro: 'choice_ch9_iron',
        // banks the Stolen Light (a finale edge) — and disturbs Dorin (party.ts)
        alsoSets: ['stolen_light_banked'],
      },
    ],
  },

  // ── FINALE · Ch.10 "The Long Shot" — what the song is for (TERMINAL) ───────
  // Rides THE CALLING. Both options END the Hush (canon honored); they differ
  // in what the Homesong DOES — which swaps the boss's final phase (BattleScene)
  // and frames the ending. Non-rewindable: the Locket is empty of Breaths here.
  ch10_song: {
    id: 'ch10_song',
    chapter: 10,
    band: 'ch10',
    axis: 'finale',
    terminal: true,
    intro: 'choice_ch10_intro',
    decidedFlag: 'ch10_song_decided',
    options: [
      {
        id: 'silence',
        label: 'SILENCE IT.',
        blurb: 'Play the Homesong like a key turning a lock. End the quiet. Send the dark home and never hear it again.',
        flag: 'axis_finale_silence',
        outro: 'choice_ch10_silence',
      },
      {
        id: 'forgive',
        label: 'FORGIVE IT.',
        blurb: "Play the Homesong like a hand reaching down. Don't beat the loneliness — outlast it. Let it choose to stop being hungry.",
        flag: 'axis_finale_forgive',
        outro: 'choice_ch10_forgive',
      },
    ],
  },
};

/** the option the player recorded for a choice (reads the save flags), or null */
export function optionFlags(): string[] {
  return Object.values(CHOICES).flatMap((d) => d.options.map((o) => o.flag));
}

/** every flag a choice can set (option flags + decidedFlags + alsoSets) */
export function allChoiceFlags(): string[] {
  const out: string[] = [];
  for (const d of Object.values(CHOICES)) {
    out.push(d.decidedFlag);
    for (const o of d.options) {
      out.push(o.flag);
      o.alsoSets?.forEach((f) => out.push(f));
    }
  }
  return out;
}
