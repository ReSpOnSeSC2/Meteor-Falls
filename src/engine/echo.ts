/**
 * THE HELD BREATH — rewind logic (S21, ADR-126). Pure + Phaser-free: snapshot at
 * a rewindable anchor, restore on rewind, pay the costs (a Breath, a tick of
 * rewind-debt, the Puppet-lock). Built on GS.serialize()/deserialize(); the
 * diegetic UI lives in MenuScene/OverworldScene. Unit-tested in echo.test.ts.
 */
import { GS } from './state';
import { ECHO_ANCHORS, MAX_BREATHS } from '../data/echoes';
import { CHOICES, type ChoiceId } from '../data/choices';
import { clearDownstreamChoiceFlags } from './choice';

export function breathsLeft(): number {
  return GS.data.echoes.breaths;
}

/** the rewind-debt counter the Trust Thread tone + the golden gate read */
export function rewindCount(): number {
  return GS.data.echoes.rewindCount;
}

/** a choice is rewindable iff it has an anchor and isn't terminal */
export function isRewindable(id: ChoiceId): boolean {
  return ECHO_ANCHORS[id] !== undefined && CHOICES[id].terminal !== true;
}

/** Mia's high-tier PRAY refuels the Locket (capped at the bank size) */
export function refillBreath(n = 1): void {
  GS.data.echoes.breaths = Math.min(MAX_BREATHS, GS.data.echoes.breaths + Math.max(0, n));
}

/**
 * Snapshot the instant BEFORE a rewindable decision. Replaces any prior snapshot
 * for the same anchor (re-deciding shouldn't stack dupes). No-op for terminal /
 * non-anchored choices.
 */
export function captureEcho(id: ChoiceId): void {
  if (!isRewindable(id)) return;
  const e = GS.data.echoes;
  e.stack = e.stack.filter((s) => s.choice !== id);
  e.stack.push({ choice: id, chapter: CHOICES[id].chapter, json: GS.serialize(), at: GS.data.playtimeSec });
}

/** can the player rewind to this anchor right now? (a Breath + a snapshot) */
export function canRewind(id: ChoiceId): boolean {
  return breathsLeft() > 0 && GS.data.echoes.stack.some((s) => s.choice === id);
}

/** the anchors the player could rewind to, earliest chapter first */
export function rewindableAnchors(): ChoiceId[] {
  return [...GS.data.echoes.stack]
    .filter((s) => isRewindable(s.choice as ChoiceId))
    .sort((a, b) => a.chapter - b.chapter)
    .map((s) => s.choice as ChoiceId);
}

/**
 * Rewind to a recorded moment: restore its pre-decision blob, spend a Breath,
 * tick the rewind-debt, drop this + every later snapshot, and clear every
 * downstream choice flag. Returns false (no-op) if out of Breaths or no snapshot.
 */
export function rewindTo(id: ChoiceId): boolean {
  const e = GS.data.echoes;
  if (e.breaths <= 0) return false;
  const snap = e.stack.find((s) => s.choice === id);
  if (!snap) return false;
  const breaths = e.breaths;
  const count = e.rewindCount;
  const chapter = CHOICES[id].chapter;
  GS.deserialize(snap.json); // replaces GS.data wholesale (the pre-decision state)
  // re-seat the meta counters onto the restored timeline, then pay the cost
  GS.data.echoes.breaths = breaths - 1;
  GS.data.echoes.rewindCount = count + 1;
  GS.data.echoes.stack = GS.data.echoes.stack.filter((s) => CHOICES[s.choice as ChoiceId].chapter < chapter);
  clearDownstreamChoiceFlags(chapter); // explicit: clear any flag set outside the snapshot window
  return true;
}

/* ── the Puppet-lock: a Breath spent leaves the Locket too spent to borrow a
 *    will this map (bend will OR time, never both). The scene clears it on map
 *    enter. ──────────────────────────────────────────────────────────────── */
export function lockPuppet(): void {
  GS.setFlag('puppet_locked', true);
}
export function puppetLocked(): boolean {
  return GS.flag('puppet_locked') === true;
}
export function clearPuppetLock(): void {
  GS.setFlag('puppet_locked', false);
}
