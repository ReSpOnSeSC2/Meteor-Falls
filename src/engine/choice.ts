/**
 * THE THREE AXES — choice logic (S21, ADR-127). Pure + Phaser-free so the
 * record / clear / validate paths unit-test headless (src/engine/choice.test.ts).
 * The scene glue (presenting the choice, capturing an Echo) lives on
 * OverworldScene; this module is the state machine behind it.
 */
import { GS } from './state';
import { CHOICES, type ChoiceId } from '../data/choices';
import type { ChoiceDef, ChoiceOption } from '../schemas';

/** the option the player recorded for a choice (its flag is set), or null */
export function recordedOption(id: ChoiceId): ChoiceOption | null {
  const def = CHOICES[id];
  return def.options.find((o) => GS.flag(o.flag) === true) ?? null;
}

/** TRUE once this choice has been answered (any option) */
export function isDecided(id: ChoiceId): boolean {
  return GS.flag(CHOICES[id].decidedFlag) === true;
}

/**
 * Record a pick: clear EVERY sibling option-flag (+ their alsoSets) so exactly
 * one is ever set, set the chosen flag + the decidedFlag, and bank a finale
 * caller if the option grants one (frozen onto the §A6 ledger, like a quest).
 */
export function recordChoice(id: ChoiceId, optionId: string): void {
  const def = CHOICES[id];
  // Validate before touching any save state. A stale/corrupt menu request must
  // not erase a real answer or leave decidedFlag without an option.
  const chosen = def.options.find((o) => o.id === optionId);
  if (!chosen) return;

  for (const o of def.options) {
    GS.setFlag(o.flag, false);
    o.alsoSets?.forEach((f) => GS.setFlag(f, false));
  }
  // A re-decision owns the complete choice transaction, including its Caller.
  // Removing first also collapses any legacy duplicate entries.
  const quest = `choice:${id}`;
  GS.data.callers = GS.data.callers.filter((c) => c.quest !== quest);
  GS.setFlag(chosen.flag, true);
  chosen.alsoSets?.forEach((f) => GS.setFlag(f, true));
  GS.setFlag(def.decidedFlag, true);
  if (chosen.caller) {
    GS.data.callers.push({
      quest,
      name: chosen.caller.name,
      quote: chosen.caller.quote,
      effect: { ...chosen.caller.effect },
    });
  }
}

/**
 * Clear every choice flag at/after `chapter` — used by the rewind so a restored
 * timeline can't keep a future it no longer leads to. Also drops each affected
 * choice's banked caller (re-deciding re-banks it).
 */
export function clearDownstreamChoiceFlags(chapter: number): void {
  for (const def of Object.values(CHOICES) as ChoiceDef[]) {
    if (def.chapter < chapter) continue;
    for (const o of def.options) {
      GS.setFlag(o.flag, false);
      o.alsoSets?.forEach((f) => GS.setFlag(f, false));
    }
    GS.setFlag(def.decidedFlag, false);
    GS.data.callers = GS.data.callers.filter((c) => c.quest !== `choice:${def.id}`);
  }
}

/**
 * Structural soundness of the choice registry (the chainProblems analogue):
 * chapters in 4..10, ≥2 options, option ids unique within a choice, and every
 * option-flag + decidedFlag unique across ALL choices. Returns [] when sound.
 */
export function choiceProblems(): string[] {
  const out: string[] = [];
  const seen = new Map<string, string>();
  const note = (flag: string, where: string): void => {
    const prior = seen.get(flag);
    if (prior) out.push(`${where}: flag '${flag}' also used by ${prior}`);
    else seen.set(flag, where);
  };
  for (const def of Object.values(CHOICES) as ChoiceDef[]) {
    if (def.chapter < 4 || def.chapter > 10) out.push(`${def.id}: chapter ${def.chapter} out of 4..10`);
    if (def.options.length < 2) out.push(`${def.id}: needs at least 2 options`);
    note(def.decidedFlag, `${def.id}.decidedFlag`);
    const ids = new Set<string>();
    for (const o of def.options) {
      if (ids.has(o.id)) out.push(`${def.id}: option id '${o.id}' repeats`);
      ids.add(o.id);
      note(o.flag, `${def.id}/${o.id}`);
    }
  }
  return out;
}
