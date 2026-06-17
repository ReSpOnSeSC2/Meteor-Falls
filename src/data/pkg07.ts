import { CHAPTER_MANIFESTS } from './chapters';
import { DEALERSHIP } from './dealership';
import { FLEET_CRAFT } from './fleet';
import { THE_LONG_SHOT } from './rocket';

export const PKG07_TRAVEL_VEHICLE_IDS = [
  'banana_boat',
  'bus',
  'lucille',
  'night_train',
  'riverboat',
  'school_bus',
  'yak_express',
  'orient_less_express',
  'snowcat',
  THE_LONG_SHOT.id,
  // Also export the literal chapter travel keys, so the package is pinned to
  // the manifest field names as well as the story-facing craft names.
  'boat',
  'biplane',
  'train',
  'rocket',
  'llama',
] as const;

function uniqueSorted(ids: Iterable<string>): string[] {
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

export function pkg07ChapterTravelIds(): string[] {
  const ids: string[] = [];
  for (const chapter of Object.values(CHAPTER_MANIFESTS)) {
    if (chapter.travel) ids.push(chapter.travel);
  }
  return uniqueSorted(ids);
}

export function pkg07VehicleArtIds(): string[] {
  return uniqueSorted([
    ...Object.keys(DEALERSHIP),
    ...Object.keys(FLEET_CRAFT),
    ...pkg07ChapterTravelIds(),
    ...PKG07_TRAVEL_VEHICLE_IDS,
  ]);
}
