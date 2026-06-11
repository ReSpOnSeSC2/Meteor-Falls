/**
 * Quest engine — GAME_BIBLE Prompt 26 (S9). Multi-step objective state
 * machines DERIVED from flags: startFlag arms a quest, each objective's flag
 * marks a completed step, doneFlag closes it. Nothing here is stored twice —
 * the only state a quest adds to the save beyond its flags is the CALLER
 * ledger entry completeQuest() freezes (GS.data.callers, the v3 field;
 * §A6 Ch.8 iterates it for the finale's phone-ring vignettes).
 *
 * Rewards route through the S3/S4 bag flow: GS.addItem with hands-full
 * handling — a full bag politely BLOCKS completion (the giver keeps the
 * reward warm; zero missables, §B4), so callers retry after making room.
 *
 * World wiring lives in map data + OverworldScene beats (ADR-014: flag-gated
 * NpcDef/PropDef/SignDef/SpawnerDef + fade-restart; shared MapDefs are never
 * mutated). The JOURNAL page reads this module (MenuScene, S3/pick()).
 *
 * QA recipe (ADR-008) — "Mail Must Move" end-to-end from a fresh profile,
 * verified S9 with key()/pump() only. Drain PAGES with KeyX (B advances but
 * never confirms a row); confirm ASKS with KeyZ (top row = the safe pick);
 * beware KeyX on an ask — it picks the cancel row ("Stay", "Never mind").
 *   1. Name entry: KeyZ KeyZ, Enter ×4, KeyZ Enter, Enter ×2, KeyZ (ADR-013).
 *   2. Intro: KeyZ ×~22 + pump (2AM pages, quake, wake). Downstairs is two
 *      hops since S9b: bedroom door → the upstairs HALL → the stairs at its
 *      right end → rex_home. Talk to Mom (mom_gear: the Salt Shaker — step 5
 *      needs it), out to the street, drain Chad's join (tween needs pumping;
 *      KeyX through his pages).
 *   3. Plummer wanders ±28px around (360,182) on the main street — read his
 *      live position, stand one tile south, face up, KeyZ; drain the ask.
 *      The beat fade-restarts the map: Mr. Sodd's mower takes its post.
 *   4. Doors in any order — stand at the facade base, face up, KeyZ:
 *      Pickles (209,110), Birch (520,110), chapel south face (521,359),
 *      STARPORT (131,362). Each sets its q_mail_* flag + a count toast.
 *   5. Mr. Sodd's (425,110): the guard mower charges inside ~64px — green
 *      swirl, then Goods → Salt Shaker (battle items are FLAT power: 40 ≥
 *      its 38 HP — a deterministic one-shot). Then deliver the letter.
 *   6. Back to Plummer: KeyZ → stamps land in Jay's bag, ledger gains
 *      Mr. Plummer (mfGS.data.callers), q_mail_done set.
 *   7. START → Down ×4 → KeyZ opens JOURNAL: the quest row carries the
 *      phone icon; KeyZ opens its detail page, KeyZ dismisses, KeyX KeyX out.
 *      (Verified at pump(n, 8.33) one-frame taps — the ADR-024 regime.)
 *   8. Ledger persistence: call Dad (contact list top row; first save asks
 *      "Which notebook?" — top row = Notebook 1), kill the tab, relaunch,
 *      Continue — callers[] intact through the v3 migration.
 * Post-ch1 runs (Biscuit/Lemonade) verified the same way from a constructed
 * post-ch1 state (mfGS flags + mfMakeHero('faye', 6, ...)); never restart
 * the scene ONTO an NPC's tile — their solid wedges the player (Pemmel is
 * at otterbrook 136,390).
 */
import { QUESTS, type QuestDef, type QuestObjective } from '../data/quests';
import { GS } from './state';

export type QuestStatus = 'unstarted' | 'active' | 'done';

export function questStatus(q: QuestDef): QuestStatus {
  if (GS.flag(q.doneFlag) === true) return 'done';
  if (GS.flag(q.startFlag) === true) return 'active';
  return 'unstarted';
}

/** first objective whose flag is still unset — the journal's current line */
export function currentObjective(q: QuestDef): QuestObjective | null {
  return q.objectives.find((o) => GS.flag(o.flag) !== true) ?? null;
}

export function objectiveDone(o: QuestObjective): boolean {
  return GS.flag(o.flag) === true;
}

/** every started quest in §A10 order with its status — the JOURNAL's rows */
export function journalQuests(): Array<{ def: QuestDef; status: QuestStatus }> {
  return Object.values(QUESTS)
    .map((def) => ({ def, status: questStatus(def) }))
    .filter((q) => q.status !== 'unstarted');
}

/** true once this quest's §A10 caller is frozen on the ledger */
export function callerEarned(questId: string): boolean {
  return GS.data.callers.some((c) => c.quest === questId);
}

export type CompleteResult = 'ok' | 'hands-full' | 'already';

/**
 * Close a quest: reward into a bag (leader's unless told otherwise), then
 * freeze the §A10 caller record onto the ledger and set doneFlag. A full
 * bag aborts BEFORE anything commits — call again once there's room.
 */
export function completeQuest(questId: string): CompleteResult {
  const q = QUESTS[questId];
  if (!q || GS.flag(q.doneFlag) === true) return 'already';
  if (q.rewardItem !== undefined && !GS.addItem(q.rewardItem)) return 'hands-full';
  GS.setFlag(q.doneFlag);
  if (!callerEarned(questId)) {
    const { name, quote, effect } = q.caller;
    GS.data.callers.push({ quest: questId, name, quote, effect: { ...effect } });
  }
  return 'ok';
}
