/**
 * THE STORY THREADS (S18 Movement 31, ADR-071) — §A4.10's two game-long arcs as
 * ORDERED, FLAG-CHAINED, NON-MISSABLE beat registries:
 *
 *   THE TRUST THREAD (Jay's mirror — free will). Opens the first time the others
 *   SEE Jay PUPPET someone (Ch.3); a slow burn compounds the doubt ("are we even
 *   here by our own free will?") across Ch.4–7; CLIMAXES at the three-quarter mark
 *   (the Ch.7→8 stretch — the Hush weaponizes the doubt to split the party) and
 *   RESOLVES when the party chooses trust and Jay proves he's the Hush's opposite.
 *   After it the party is bonded for Ch.9–10 and it feeds the finale free-will PRAY.
 *
 *   THE CLICKER QUESTION (Milo's mirror — blame). The comedic SEED (Ch.5, the
 *   parade-float mishap), the sincere CRISIS (Ch.7 — a Hush-spoofed signal frames
 *   Milo; even he isn't sure), and the public CLEARING (Ch.8 — he Clickers a
 *   disaster to safety in the open, narrating every input, and exposes the spoof).
 *
 * The beats are a chain (each beat's `prevFlag` is the previous beat's `flag`), so
 * the engine fires them IN ORDER and the climax/clearing is non-missable. The
 * scene dialogue + the per-chapter staging land in each chapter's session; this is
 * the spine the validator + `src/engine/storythread.ts` pin.
 */

export type ThreadId = 'trust' | 'clicker';
export type BeatKind = 'open' | 'seed' | 'escalation' | 'crisis' | 'climax' | 'clearing' | 'resolve';

export interface ThreadBeat {
  id: string;
  thread: ThreadId;
  /** chapter band the beat lands in ('ch3'…'ch10') */
  band: string;
  /** position in its thread's chain (1-based, contiguous) */
  order: number;
  kind: BeatKind;
  /** the save flag this beat sets when it fires */
  flag: string;
  /** the flag that must already be set for this beat to fire (null = the opener) */
  prevFlag: string | null;
  /** a finale CALLER this beat adds/strengthens (the §A6 payoff), if any */
  caller?: string;
  /** a §A11-voice one-liner describing the beat (never a lecture) */
  note: string;
}

const B = (b: ThreadBeat): ThreadBeat => b;

export const THREAD_BEATS: Record<string, ThreadBeat> = Object.fromEntries(
  [
    // ── THE TRUST THREAD ──────────────────────────────────────────────────
    B({
      id: 'trust_open', thread: 'trust', band: 'ch3', order: 1, kind: 'open',
      flag: 'thread_trust_open', prevFlag: null,
      note: 'They SEE Jay puppet the gate guard for the first time. Not applause — a half-step back.',
    }),
    B({
      id: 'trust_esc_norway', thread: 'trust', band: 'ch4', order: 2, kind: 'escalation',
      flag: 'thread_trust_esc1', prevFlag: 'thread_trust_open',
      note: 'Mia goes quiet after a borrow — she HEARS what it costs the person Jay let go.',
    }),
    B({
      id: 'trust_esc_minimus', thread: 'trust', band: 'ch5', order: 3, kind: 'escalation',
      flag: 'thread_trust_esc2', prevFlag: 'thread_trust_esc1',
      note: 'Milo over-rationalizes it ("it\'s just inputs, it\'s fine") a little too fast.',
    }),
    B({
      id: 'trust_esc_africa', thread: 'trust', band: 'ch6', order: 4, kind: 'escalation',
      flag: 'thread_trust_esc3', prevFlag: 'thread_trust_esc2',
      note: 'A held glance, a withheld line. The unasked question is getting loud.',
    }),
    B({
      id: 'trust_esc_india', thread: 'trust', band: 'ch7', order: 5, kind: 'escalation',
      flag: 'thread_trust_esc4', prevFlag: 'thread_trust_esc3',
      note: 'Pippa quietly tests whether a choice was really hers. "...that WAS me, right?"',
    }),
    B({
      id: 'trust_climax', thread: 'trust', band: 'ch8', order: 6, kind: 'climax',
      flag: 'thread_trust_climax', prevFlag: 'thread_trust_esc4',
      note: 'The Hush whispers: "How do you know the boy isn\'t holding your strings right now?" The party nearly splits.',
    }),
    B({
      id: 'trust_resolve', thread: 'trust', band: 'ch8', order: 7, kind: 'resolve',
      flag: 'thread_trust_resolve', prevFlag: 'thread_trust_climax',
      caller: 'the_party',
      note: 'Jay refuses to take a will even when it would fix everything. They realize they followed him freely all along.',
    }),
    // ── THE CLICKER QUESTION ──────────────────────────────────────────────
    B({
      id: 'clicker_seed', thread: 'clicker', band: 'ch5', order: 1, kind: 'seed',
      flag: 'thread_clicker_seed', prevFlag: null,
      note: 'A tiny parade float he was Clickering lurches and flattens something knee-high. Played for laughs — but it plants a doubt.',
    }),
    B({
      id: 'clicker_crisis', thread: 'clicker', band: 'ch7', order: 2, kind: 'crisis',
      flag: 'thread_clicker_crisis', prevFlag: 'thread_clicker_seed',
      note: 'A crane drops its load — the party is hurt and BLAMED. The Hush spoofed his signal to frame him; even Milo isn\'t sure.',
    }),
    B({
      id: 'clicker_clearing', thread: 'clicker', band: 'ch8', order: 3, kind: 'clearing',
      flag: 'thread_clicker_clearing', prevFlag: 'thread_clicker_crisis',
      caller: 'lotus_bargeman',
      note: 'A runaway barge, people aboard. Milo takes the remote in the open, narrates every input, saves everyone, and exposes the spoof.',
    }),
  ].map((b) => [b.id, b]),
);

/** the ordered beat list for a thread (by `order`) */
export function threadChain(thread: ThreadId): ThreadBeat[] {
  return Object.values(THREAD_BEATS).filter((b) => b.thread === thread).sort((a, b) => a.order - b.order);
}

export const THREAD_IDS: readonly ThreadId[] = ['trust', 'clicker'];
