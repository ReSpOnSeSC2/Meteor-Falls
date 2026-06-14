/**
 * STORY-THREAD DRIVER (S18 Movement 31, ADR-071) — pure logic over the §A4.10
 * flag-chained beats: which beat fires next, whether the chain is well-formed, and
 * whether a thread has resolved. The OverworldScene fires `nextBeat`'s scene at the
 * right place; this keeps the order honest and the climax non-missable.
 */
import { THREAD_BEATS, threadChain, type ThreadId, type ThreadBeat } from '../data/storythreads';

/** the next beat ready to fire: its prevFlag is satisfied and its own flag isn't set */
export function nextBeat(thread: ThreadId, isSet: (flag: string) => boolean): ThreadBeat | null {
  for (const beat of threadChain(thread)) {
    if (isSet(beat.flag)) continue;
    if (beat.prevFlag === null || isSet(beat.prevFlag)) return beat;
  }
  return null;
}

/** TRUE once a thread has reached its terminal beat (resolve / clearing) */
export function isResolved(thread: ThreadId, isSet: (flag: string) => boolean): boolean {
  const chain = threadChain(thread);
  const last = chain[chain.length - 1];
  return last ? isSet(last.flag) : false;
}

/** TRUE when every beat BEFORE the climax/terminal has fired (the climax is earned) */
export function climaxReady(thread: ThreadId, isSet: (flag: string) => boolean): boolean {
  const chain = threadChain(thread);
  const climaxIdx = chain.findIndex((b) => b.kind === 'climax' || b.kind === 'clearing');
  if (climaxIdx < 0) return false;
  return chain.slice(0, climaxIdx).every((b) => isSet(b.flag));
}

/** the finale CALLERS a thread's fired beats have earned (the §A6 PRAY payoff) */
export function earnedCallers(thread: ThreadId, isSet: (flag: string) => boolean): string[] {
  return threadChain(thread).filter((b) => isSet(b.flag) && b.caller).map((b) => b.caller as string);
}

/**
 * Validate a thread's chain is well-formed: contiguous 1-based order, each beat's
 * prevFlag links to the previous beat's flag (opener has null), bands never go
 * backwards, exactly one terminal (climax→resolve for trust; clearing for clicker),
 * and flags are unique. Returns [] when sound, else the problems.
 */
export function chainProblems(thread: ThreadId): string[] {
  const chain = threadChain(thread);
  const out: string[] = [];
  const flags = new Set<string>();
  let lastBand = 0;
  chain.forEach((b, i) => {
    if (b.order !== i + 1) out.push(`${b.id}: order ${b.order} ≠ position ${i + 1}`);
    const expectPrev = i === 0 ? null : chain[i - 1].flag;
    if (b.prevFlag !== expectPrev) out.push(`${b.id}: prevFlag '${b.prevFlag}' ≠ '${expectPrev}'`);
    if (flags.has(b.flag)) out.push(`${b.id}: flag '${b.flag}' repeats`);
    flags.add(b.flag);
    const band = Number(/^ch(\d+)$/.exec(b.band)?.[1] ?? 0);
    if (band < lastBand) out.push(`${b.id}: band '${b.band}' goes backwards`);
    lastBand = band;
    if (b.prevFlag && !THREAD_BEATS[chain[i - 1]?.id]) out.push(`${b.id}: dangling prevFlag`);
  });
  const terminals = chain.filter((b) => b.kind === 'resolve' || b.kind === 'clearing');
  if (terminals.length !== 1) out.push(`${thread}: expected exactly one terminal, found ${terminals.length}`);
  if (terminals[0] && terminals[0] !== chain[chain.length - 1]) out.push(`${thread}: terminal is not the last beat`);
  return out;
}
