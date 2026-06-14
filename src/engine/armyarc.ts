/**
 * THE ARMY-ARC DRIVER (S19 Movement 40, ADR-081) — pure logic over the §A6
 * army-pursuit beats (the storythread driver, applied to one chain): which beat
 * fires next, whether the arc has resolved, the earned finale callers, and a
 * well-formedness check the validator + the test share. The OverworldScene fires
 * `nextBeat`'s scene at the right place; this keeps the order honest and the
 * CLEARING non-missable (the General's change of heart is always reachable).
 */
import { ARMY_BEATS, armyChain, type ArmyBeat } from '../data/armyarc';

/** the next beat ready to fire: its prevFlag is satisfied and its own flag isn't set */
export function nextBeat(isSet: (flag: string) => boolean): ArmyBeat | null {
  for (const beat of armyChain()) {
    if (isSet(beat.flag)) continue;
    if (beat.prevFlag === null || isSet(beat.prevFlag)) return beat;
  }
  return null;
}

/** TRUE once the arc reaches its terminal beat (the clearing — the General clears) */
export function isResolved(isSet: (flag: string) => boolean): boolean {
  const chain = armyChain();
  const last = chain[chain.length - 1];
  return last ? isSet(last.flag) : false;
}

/** the finale CALLERS the fired beats have earned (the General, once cleared) */
export function earnedCallers(isSet: (flag: string) => boolean): string[] {
  return armyChain().filter((b) => isSet(b.flag) && b.caller).map((b) => b.caller as string);
}

/**
 * Validate the arc is well-formed: contiguous 1-based order, each beat's prevFlag
 * links to the previous beat's flag (opener has null), bands never go backwards,
 * exactly one terminal (the clearing) and it is last, flags are unique, the opener
 * is the misread, and the clearing earns a caller. Returns [] when sound.
 */
export function armyArcProblems(): string[] {
  const chain = armyChain();
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
  });
  const first = chain[0];
  if (!first || first.kind !== 'misread') out.push('the arc must OPEN on the misread (the army gets it wrong)');
  const clearings = chain.filter((b) => b.kind === 'clearing');
  if (clearings.length !== 1) out.push(`expected exactly one clearing, found ${clearings.length}`);
  if (clearings[0] && clearings[0] !== chain[chain.length - 1]) out.push('the clearing is not the last beat — the arc must end resolved');
  if (clearings[0] && !clearings[0].caller) out.push('the clearing must earn a finale caller (the General)');
  // every beat exists in the registry (no dangling chain)
  for (const b of chain) if (!ARMY_BEATS[b.id]) out.push(`${b.id}: dangling beat`);
  return out;
}
