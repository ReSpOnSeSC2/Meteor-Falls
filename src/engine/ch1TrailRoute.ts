/**
 * Chapter 1's Hush-morning route to the Titanic Tick.
 *
 * The route is intentionally represented by durable facts rather than scene
 * locals: Pemberton points Jay to Hodgkin, Hodgkin asks for the mower, the
 * mower earns a key, and crossing the shed opens the cave approach. Keeping
 * the vocabulary here lets runtime recovery, dev profiles, and tests agree on
 * the same sequence after a save/reload.
 */
export const CH1_TRAIL_KEY_ITEM_ID = 'trail_key' as const;

export const CH1_TRAIL_FLAGS = Object.freeze({
  metPemberton: 'met_pemberton',
  keyAsked: 'ch1_trail_key_asked',
  mowerCaught: 'q_mower_caught',
  hasKey: 'has_trail_key',
  shedCrossed: 'ch1_trail_shed_crossed',
} as const);

export type Chapter1TrailStage =
  | 'asleep'
  | 'pemberton'
  | 'hodgkin'
  | 'mower'
  | 'claim-key'
  | 'shed'
  | 'cave'
  | 'complete';

export function chapter1TrailOwnsKey(
  isSet: (flag: string) => boolean,
  keyItems: readonly string[],
): boolean {
  return isSet(CH1_TRAIL_FLAGS.hasKey) || keyItems.includes(CH1_TRAIL_KEY_ITEM_ID);
}

/** One canonical copy, preserving the order of every unrelated key item. */
export function normalizeChapter1TrailKeyItems(
  keyItems: readonly string[],
  earned: boolean,
): string[] {
  const withoutTrailKey = keyItems.filter((item) => item !== CH1_TRAIL_KEY_ITEM_ID);
  return earned ? [...withoutTrailKey, CH1_TRAIL_KEY_ITEM_ID] : withoutTrailKey;
}

export function chapter1TrailStage(
  isSet: (flag: string) => boolean,
  keyItems: readonly string[],
): Chapter1TrailStage {
  if (isSet('tick_defeated')) return 'complete';
  if (!isSet('zapper_done')) return 'asleep';
  if (isSet(CH1_TRAIL_FLAGS.shedCrossed)) return 'cave';
  if (chapter1TrailOwnsKey(isSet, keyItems)) return 'shed';
  if (isSet(CH1_TRAIL_FLAGS.mowerCaught)) return 'claim-key';
  if (isSet(CH1_TRAIL_FLAGS.keyAsked)) return 'mower';
  if (isSet(CH1_TRAIL_FLAGS.metPemberton)) return 'hodgkin';
  return 'pemberton';
}
