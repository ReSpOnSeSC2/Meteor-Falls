/**
 * Shared pacing for auto-advancing cinematic text.
 *
 * The lead-in covers orientation and the stylized bitmap font; the per-character
 * allowance lands near an unhurried, young-reader-friendly narration speed.
 * Callers may request a larger minimum for an establishing beat, but never a
 * smaller one. Durations are rounded to 100 ms so authored timelines stay tidy.
 */
export const CINEMATIC_TEXT_TIMING = {
  minimumHoldMs: 3_200,
  leadInMs: 1_000,
  perCharacterMs: 55,
  liveFadeInMs: 360,
  liveFadeOutMs: 420,
} as const;

/** A held advance deliberately rolls through successive timed captions, but a
 * tiny guard keeps one stale held frame from erasing a newly faded-in card. */
export const CINEMATIC_HELD_SKIP_GUARD_MS = 180;

export function timedCaptionComplete(
  elapsedMs: number,
  durationMs: number,
  input: Readonly<{ pressed: boolean; held: boolean }>,
): boolean {
  return elapsedMs >= durationMs
    || input.pressed
    || (input.held && elapsedMs >= CINEMATIC_HELD_SKIP_GUARD_MS);
}

export function readableCaptionMs(text: string, minimumMs = 0): number {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const calculated = CINEMATIC_TEXT_TIMING.leadInMs
    + Array.from(normalized).length * CINEMATIC_TEXT_TIMING.perCharacterMs;
  const hold = Math.max(CINEMATIC_TEXT_TIMING.minimumHoldMs, minimumMs, calculated);
  return Math.ceil(hold / 100) * 100;
}

export function captionTimelineMs(
  text: string,
  opts: { minimumMs?: number; fadeInMs?: number; fadeOutMs?: number } = {},
): number {
  return (opts.fadeInMs ?? CINEMATIC_TEXT_TIMING.liveFadeInMs)
    + readableCaptionMs(text, opts.minimumMs)
    + (opts.fadeOutMs ?? CINEMATIC_TEXT_TIMING.liveFadeOutMs);
}
