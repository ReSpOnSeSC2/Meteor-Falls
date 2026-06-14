/**
 * OVERWORLD PSI (S18 Movement 28, ADR-069) — §A4.11 "powers as keys". The pure
 * rules for FIELD-casting a PSI key at an obstacle: which ability counts as which
 * key, whether a hero has LEARNED it (a gate is never the sole teacher), and
 * whether a cast CLEARS a given gate. Reuses the M27 control spine for range +
 * PP; the OverworldScene owns the new cast FX + the obstacle reaction.
 */
import { ABILITIES } from '../data/abilities';
import { GATE_KEY, type PsiKey, type PsiGateDef, type PsiGateKind } from '../data/psigates';

/** the overworld PSI key an ability casts, or null if it isn't a field key */
export function psiKeyOf(abilityId: string): PsiKey | null {
  const ab = ABILITIES[abilityId];
  if (!ab) return null;
  if (ab.element === 'fire') return 'fire';
  if (ab.element === 'freeze') return 'freeze';
  if (abilityId.startsWith('flash')) return 'flash';
  return null;
}

/** every ability that can cast a given key (so the gate has a real teacher) */
export function abilitiesForKey(key: PsiKey): string[] {
  return Object.keys(ABILITIES).filter((id) => psiKeyOf(id) === key);
}

/** the key that answers a gate KIND (the single source of truth) */
export function keyForGateKind(kind: PsiGateKind): PsiKey {
  return GATE_KEY[kind];
}

/** does casting `abilityId` clear `gate`? (right key for the obstacle) */
export function clearsGate(abilityId: string, gate: PsiGateDef): boolean {
  return psiKeyOf(abilityId) === gate.key;
}

/** has the party LEARNED any ability that clears this gate? (learned-first law) */
export function canClearGate(gate: PsiGateDef, knownAbilityIds: readonly string[]): boolean {
  return knownAbilityIds.some((id) => clearsGate(id, gate));
}

/**
 * Pick the cheapest learned ability that clears the gate (the cast the field UI
 * defaults to), or null if the party can't yet — a clear "you'll need a way to
 * {key} this" prompt, never a soft-lock (the route always has another path until
 * the ability is taught; the gate is non-missable + retry-safe).
 */
export function bestCastFor(gate: PsiGateDef, knownAbilityIds: readonly string[]): string | null {
  const able = knownAbilityIds.filter((id) => clearsGate(id, gate));
  if (able.length === 0) return null;
  return able.reduce((best, id) => (ABILITIES[id].pp < ABILITIES[best].pp ? id : best));
}
