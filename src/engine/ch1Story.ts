/** Save-compatible Chapter 1 world phase. Lighting, dialogue, crowds, and travel
 * all derive from this one state instead of treating the sickly morning as night. */
export type Chapter1Phase = 'meteor-night' | 'hush-morning' | 'restored-day' | 'chapter-complete';

export function chapter1Phase(flag: (id: string) => boolean): Chapter1Phase {
  if (flag('ch1_complete')) return 'chapter-complete';
  if (flag('tick_defeated')) return 'restored-day';
  if (flag('zapper_done')) return 'hush-morning';
  return 'meteor-night';
}

export function chapter1BannerTag(phase: Chapter1Phase): string | undefined {
  if (phase === 'meteor-night') return '2 A.M.';
  if (phase === 'hush-morning') return 'HUSH MORNING';
  return undefined;
}
