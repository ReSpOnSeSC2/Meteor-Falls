import { describe, expect, it } from 'vitest';
import {
  CH1_TRAIL_FLAGS,
  CH1_TRAIL_KEY_ITEM_ID,
  chapter1TrailOwnsKey,
  chapter1TrailStage,
  normalizeChapter1TrailKeyItems,
} from './ch1TrailRoute';

const flags = (...set: string[]): ((flag: string) => boolean) => (flag) => set.includes(flag);

describe('Chapter 1 Hush trail route', () => {
  it('advances through every durable route frontier in order', () => {
    expect(chapter1TrailStage(flags(), [])).toBe('asleep');
    expect(chapter1TrailStage(flags('zapper_done'), [])).toBe('pemberton');
    expect(chapter1TrailStage(flags('zapper_done', CH1_TRAIL_FLAGS.metPemberton), [])).toBe('hodgkin');
    expect(chapter1TrailStage(flags('zapper_done', CH1_TRAIL_FLAGS.keyAsked), [])).toBe('mower');
    expect(chapter1TrailStage(flags('zapper_done', CH1_TRAIL_FLAGS.mowerCaught), [])).toBe('claim-key');
    expect(chapter1TrailStage(flags('zapper_done', CH1_TRAIL_FLAGS.hasKey), [])).toBe('shed');
    expect(chapter1TrailStage(flags('zapper_done', CH1_TRAIL_FLAGS.shedCrossed), [])).toBe('cave');
    expect(chapter1TrailStage(flags('zapper_done', 'tick_defeated'), [])).toBe('complete');
  });

  it('treats either legacy flag or inventory record as ownership', () => {
    expect(chapter1TrailOwnsKey(flags(CH1_TRAIL_FLAGS.hasKey), [])).toBe(true);
    expect(chapter1TrailOwnsKey(flags(), [CH1_TRAIL_KEY_ITEM_ID])).toBe(true);
    expect(chapter1TrailOwnsKey(flags(), [])).toBe(false);
  });

  it('normalizes duplicate key records without disturbing other keys', () => {
    expect(normalizeChapter1TrailKeyItems(
      ['star_locket', CH1_TRAIL_KEY_ITEM_ID, 'camera', CH1_TRAIL_KEY_ITEM_ID],
      true,
    )).toEqual(['star_locket', 'camera', CH1_TRAIL_KEY_ITEM_ID]);
    expect(normalizeChapter1TrailKeyItems(['star_locket', CH1_TRAIL_KEY_ITEM_ID], false)).toEqual(['star_locket']);
  });
});
