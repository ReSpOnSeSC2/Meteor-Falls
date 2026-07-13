import { describe, expect, it } from 'vitest';
import {
  AMBIENCE,
  AMBIENCE_BEDS,
  CONTINUOUS_AMBIENCE_IDS,
  NOISE_COLORS,
  ambienceBed,
  continuousAmbienceId,
} from './ambience';
import { EMOTES } from './emote';
import {
  AMBIENCE_IDS,
  AmbienceIdSchema,
  EMOTE_IDS,
  EmoteIdSchema,
  MapDefSchema,
  NpcDefSchema,
} from '../schemas';

/* ===== Wave 2 (ADR-108): the ambient-bed registry (#16) ===== */

describe('ambience — the bed registry', () => {
  it('defines exactly the schema AMBIENCE_IDS (both directions), in order', () => {
    expect(new Set(Object.keys(AMBIENCE))).toEqual(new Set(AMBIENCE_IDS));
    expect(AMBIENCE_BEDS).toEqual([...AMBIENCE_IDS]);
  });

  it('every bed is self-consistent and well-formed', () => {
    for (const id of AMBIENCE_IDS) {
      const bed = AMBIENCE[id];
      expect(bed.id).toBe(id); // the key and the bed's own id agree
      expect(bed.label.trim().length).toBeGreaterThan(0);
      expect(NOISE_COLORS).toContain(bed.base);
      expect(bed.gain).toBeGreaterThan(0);
      expect(bed.gain).toBeLessThanOrEqual(1); // a bed sits UNDER the music
      expect(bed.cutoff).toBeGreaterThan(0);
      if (bed.sway) {
        expect(bed.sway.depth).toBeGreaterThan(0);
        expect(bed.sway.rate).toBeGreaterThan(0);
      }
    }
  });

  it('ambienceBed() looks a bed up by id', () => {
    expect(ambienceBed('waves')).toBe(AMBIENCE.waves);
    expect(ambienceBed('cave').base).toBe('brown');
  });

  it('AmbienceIdSchema accepts a real bed id and rejects an invented one', () => {
    expect(AmbienceIdSchema.safeParse('rain').success).toBe(true);
    expect(AmbienceIdSchema.safeParse('thunder').success).toBe(false);
  });

  it('only keeps unmistakable rain and machinery as continuous noise beds', () => {
    expect(CONTINUOUS_AMBIENCE_IDS).toEqual(['rain', 'machine']);
    expect(continuousAmbienceId('rain')).toBe('rain');
    expect(continuousAmbienceId('machine')).toBe('machine');
    for (const id of ['wind', 'waves', 'river', 'birds', 'crowd', 'cave'] as const) {
      expect(continuousAmbienceId(id)).toBeNull();
    }
  });
});

/* ===== Wave 2 (ADR-108): the emote vocabulary stays pinned to EMOTES (#4) ===== */

describe('emote ids — schema union ⇔ runtime EMOTES', () => {
  it('EMOTE_IDS matches the EMOTES table both directions', () => {
    expect(new Set(EMOTE_IDS)).toEqual(new Set(Object.keys(EMOTES)));
  });

  it('EmoteIdSchema accepts a real mood and rejects an invented one', () => {
    expect(EmoteIdSchema.safeParse('think').success).toBe(true);
    expect(EmoteIdSchema.safeParse('confused').success).toBe(false);
  });
});

/* ===== Wave 2 (ADR-108): the new schema fields parse + reject correctly ===== */

const baseNpc = { id: 'x', sprite: 's', x: 0, y: 0, facing: 'down' as const, dialogue: 'd' };
const baseMap = {
  id: 'm',
  name: 'M',
  music: null,
  grid: ['.'],
  props: [],
  npcs: [],
  signs: [],
  phones: [],
  doors: [],
  spawners: [],
  triggers: [],
};

describe('NpcDef — the ambient-life fields (#4)', () => {
  it('accepts idle + a valid emote', () => {
    expect(NpcDefSchema.safeParse({ ...baseNpc, idle: true, emote: 'sleep' }).success).toBe(true);
  });
  it('rejects an unknown emote', () => {
    expect(NpcDefSchema.safeParse({ ...baseNpc, emote: 'grumpy' }).success).toBe(false);
  });
  it('a bare NPC (no ambient fields) still parses — they are optional', () => {
    expect(NpcDefSchema.safeParse(baseNpc).success).toBe(true);
  });
});

describe('MapDef — the audio + reflection fields (#16/#6)', () => {
  it('accepts ambience, an explicit muffle, and reflect rects', () => {
    const r = MapDefSchema.safeParse({
      ...baseMap,
      ambience: 'rain',
      muffle: 2,
      reflect: [{ x: 0, y: 0, w: 2, h: 1, within: 4 }],
    });
    expect(r.success).toBe(true);
  });
  it('rejects an out-of-range muffle level', () => {
    expect(MapDefSchema.safeParse({ ...baseMap, muffle: 3 }).success).toBe(false);
  });
  it('rejects an unknown ambience id', () => {
    expect(MapDefSchema.safeParse({ ...baseMap, ambience: 'static' }).success).toBe(false);
  });
  it('rejects a reflect rect with a negative origin or zero size', () => {
    expect(MapDefSchema.safeParse({ ...baseMap, reflect: [{ x: -1, y: 0, w: 1, h: 1 }] }).success).toBe(false);
    expect(MapDefSchema.safeParse({ ...baseMap, reflect: [{ x: 0, y: 0, w: 0, h: 1 }] }).success).toBe(false);
  });
  it('a bare map (no audio/reflect fields) still parses — they are optional', () => {
    expect(MapDefSchema.safeParse(baseMap).success).toBe(true);
  });
});
