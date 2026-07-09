import { describe, expect, it } from 'vitest';
import { chapter1BannerTag, chapter1Phase } from './ch1Story';

const flags = (...on: string[]) => (id: string): boolean => on.includes(id);

describe('Chapter 1 story phase', () => {
  it('distinguishes the meteor night from the wrong-colored morning', () => {
    expect(chapter1Phase(flags())).toBe('meteor-night');
    expect(chapter1BannerTag(chapter1Phase(flags()))).toBe('2 A.M.');
    expect(chapter1Phase(flags('zapper_done'))).toBe('hush-morning');
    expect(chapter1BannerTag(chapter1Phase(flags('zapper_done')))).toBe('HUSH MORNING');
  });

  it('restores daylight after the Tick and closes the chapter only afterward', () => {
    expect(chapter1Phase(flags('zapper_done', 'tick_defeated'))).toBe('restored-day');
    expect(chapter1Phase(flags('zapper_done', 'tick_defeated', 'ch1_complete'))).toBe('chapter-complete');
  });
});
