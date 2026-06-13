/**
 * THE LEVELKIT — the demo recipes (S15g). One named recipe per generator,
 * shared by the determinism test (hash pins), the LEVELKIT LAB (its menu),
 * and `npm run bench:map` (resolve a draft by name). The city recipe is the
 * prompt's verbatim example (Zanzibel, seed 4104).
 */
import type { Recipe } from '../schemas';

export const SAMPLE_RECIPES: Record<string, Recipe> = {
  zanzibel: {
    kind: 'city',
    id: 'zanzibel',
    seed: 4104,
    style: 'bazaar-port',
    size: [58, 36],
    districts: ['harbor', 'market', 'clinic', 'chapel', 'docks'],
    landmarks: ['grand_market', 'teleport_dojo'],
    requiredDoors: ['shop', 'hospital', 'story_gate'],
    npcSlots: 14,
    picnicCount: 3,
    encounterBand: 'ch6',
  },
  brickmore_heights: {
    kind: 'city',
    id: 'brickmore_heights',
    seed: 2077,
    style: 'americana',
    size: [64, 42],
    districts: ['downtown', 'market', 'civic'],
    landmarks: ['city_hall'],
    requiredDoors: ['shop', 'hospital'],
    npcSlots: 10,
    picnicCount: 3,
    encounterBand: 'ch1',
  },
  foggybottom: {
    kind: 'town',
    id: 'foggybottom',
    seed: 303,
    style: 'fog-stone',
    size: [40, 28],
    lanes: 3,
    requiredDoors: ['shop'],
    landmarks: ['old_stones'],
    npcSlots: 8,
    picnicCount: 2,
    encounterBand: 'ch3',
  },
  lilleby: {
    kind: 'village',
    id: 'lilleby',
    seed: 404,
    style: 'spire-canton',
    size: [28, 22],
    requiredDoors: ['shop'],
    npcSlots: 5,
    picnicCount: 1,
    encounterBand: 'ch4',
  },
  grand_market_int: {
    kind: 'interior',
    id: 'grand_market_int',
    seed: 9,
    template: 'shop',
    size: [14, 10],
  },
  meadow_mile: {
    kind: 'route',
    id: 'meadow_mile',
    seed: 1500,
    size: [34, 16],
    style: 'treeline',
    encounterBand: 'ch1',
    signSlots: 2,
  },
  bootstep_moor: {
    kind: 'wild',
    id: 'bootstep_moor',
    seed: 1600,
    size: [32, 20],
    style: 'moor',
    encounterBand: 'ch4',
  },
  lucille: {
    kind: 'travel',
    id: 'lucille',
    seed: 303,
    leg: 'biplane',
    seatRows: 3,
  },
};

export const SAMPLE_IDS = Object.keys(SAMPLE_RECIPES);
