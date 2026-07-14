/**
 * Pure Chapter 8 compatibility planning for the Trust/Clicker threads and
 * Pippa's branch outcome. Runtime code plays each returned beat and sets its
 * own thread flag; this module never mutates saves or invents a choice axis.
 */
import { threadChain, type ThreadBeat, type ThreadId } from '../data/storythreads';
import type { CallerRecord } from '../schemas';

export const CH8_CLICKER_CALLER = {
  quest: 'thread:clicker',
  name: 'The Lotus Bargeman',
  quote: 'You saved every soul on my boat and showed the harbor the ghost wearing Milo\'s name. Call, and we will move the river for you.',
  effect: { kind: 'damage', power: 920 },
} as const satisfies CallerRecord;

const copyCaller = (caller: Readonly<CallerRecord>): CallerRecord => ({
  ...caller,
  effect: { ...caller.effect },
});

/**
 * Reconcile the Caller ledger with the committed Clicker clearing. A save may
 * be interrupted after the thread flag commits but before dialogue returns;
 * the next frontier repairs that seam. Legacy duplicates collapse to the
 * canonical Bargeman at the first earned position, exactly once.
 */
export function reconcileCh8ClickerCaller(
  callers: readonly Readonly<CallerRecord>[],
  clearingCommitted: boolean,
): CallerRecord[] {
  const result: CallerRecord[] = [];
  let keptClicker = false;
  for (const caller of callers) {
    if (caller.quest !== CH8_CLICKER_CALLER.quest) {
      result.push(copyCaller(caller));
      continue;
    }
    if (!clearingCommitted || keptClicker) continue;
    result.push(copyCaller(CH8_CLICKER_CALLER));
    keptClicker = true;
  }
  if (clearingCommitted && !keptClicker) result.push(copyCaller(CH8_CLICKER_CALLER));
  return result;
}

export const CH8_STORY_FRONTIERS = [
  'lotus_orientation',
  'lotus_clicker',
  'bamboo_trust',
  'bamboo_lock',
  'spore_forest',
  'mt_shu',
] as const;

export type Ch8StoryFrontier = (typeof CH8_STORY_FRONTIERS)[number];

interface FrontierTarget {
  thread: ThreadId;
  lastBeat: string;
}

/** Each actual trigger stages only its own thread, including missing prerequisites. */
const FRONTIER_TARGET: Readonly<Record<Ch8StoryFrontier, FrontierTarget>> = {
  lotus_orientation: { thread: 'trust', lastBeat: 'trust_esc_minimus' },
  lotus_clicker: { thread: 'clicker', lastBeat: 'clicker_seed' },
  bamboo_trust: { thread: 'trust', lastBeat: 'trust_esc_africa' },
  bamboo_lock: { thread: 'clicker', lastBeat: 'clicker_clearing' },
  spore_forest: { thread: 'trust', lastBeat: 'trust_esc_india' },
  mt_shu: { thread: 'trust', lastBeat: 'trust_resolve' },
};

/**
 * Return every missing non-choice scene through a frontier in real story order.
 * Existing flags are skipped, not rewritten. All returned flags are thread_*
 * flags from the canonical registry; FREE/STRINGS are never synthesized.
 */
export function planCh8Story(
  frontier: Ch8StoryFrontier,
  isSet: (flag: string) => boolean,
): ThreadBeat[] {
  const target = FRONTIER_TARGET[frontier];
  const chain = threadChain(target.thread);
  const last = chain.findIndex((beat) => beat.id === target.lastBeat);
  return chain.slice(0, last + 1).filter((beat) => !isSet(beat.flag));
}

export const PIPPA_RECONCILIATION_REWIND_CAP = 2;

export interface PippaOutcomeContext {
  choiceDecided: boolean;
  trustFree: boolean;
  trustStrings: boolean;
  reconciled: boolean;
  rewindCount: number;
}

export type PippaOutcomeDecision = 'stay' | 'depart' | 'preserve';

/**
 * Decide what Chapter 8 should ask party runtime to do with Pippa.
 * Undecided or contradictory states are preserved; they are never treated as
 * STRINGS. Only a coherent, decided STRINGS leaf can ask departHero to run.
 */
export function decidePippaOutcome(context: PippaOutcomeContext): PippaOutcomeDecision {
  const { choiceDecided, trustFree, trustStrings, reconciled, rewindCount } = context;
  if (!choiceDecided || trustFree === trustStrings) return 'preserve';
  if (!Number.isInteger(rewindCount) || rewindCount < 0) return 'preserve';
  if (trustFree) return 'stay';
  return reconciled && rewindCount <= PIPPA_RECONCILIATION_REWIND_CAP ? 'stay' : 'depart';
}

/** Convenience adapter that pins the save-facing flag names for runtime callers. */
export function decidePippaOutcomeFromFlags(
  isSet: (flag: string) => boolean,
  rewindCount: number,
): PippaOutcomeDecision {
  return decidePippaOutcome({
    choiceDecided: isSet('ch6_string_decided'),
    trustFree: isSet('axis_trust_free'),
    trustStrings: isSet('axis_trust_strings'),
    reconciled: isSet('pippa_reconciled'),
    rewindCount,
  });
}
