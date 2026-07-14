import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  alphaBounds,
  countStrongMagentaResidue,
  deriveEnemyMini,
  rgbaHash,
} from '../../tools/ch1-raster-lib';
import { decodePng, encodePng } from '../../tools/imageio';
import { ENEMIES } from './enemies';
import {
  AUTHORED_ENEMY_BATTLE_ART_KEYS,
  AUTHORED_ENEMY_MINI_ART_KEYS,
  AUTHORED_ENEMY_OVERWORLD_ART_IDS,
} from '../spritegen/authored';

const root = process.cwd();

const SEED = [
  ['cranky_mailbox', 'cranky_mailbox'],
  ['runaway_lawnmower', 'runaway_lawnmower'],
  ['coily_cicada', 'coily_cicada'],
  ['blazer_smiler', 'blazer_smiler'],
  ['pigeon_gang', 'pigeon_gang'],
  ['hill_slug_deluxe', 'hill_slug'],
  ['borden', 'constable_borden'],
] as const;

const EXPANDED = [
  'sprinkler_sentry',
  'recycling_raccoon',
  'skeeter_swarm',
  'unionized_gnome',
  'mandatory_memo',
  'motivational_poster',
  'quota_clock',
  'expired_meter',
  'showroom_mannequin',
  'good_investment',
  'rogue_icecream_truck',
  'tick_nymph',
  'the_suit',
] as const;

const BOSSES = [
  ['titanic_tick', 'titanic_tick'],
  ['hush_sentinel', 'hush_sentinel'],
] as const;

const COMPLETE_ROSTER: readonly (readonly [string, string])[] = [
  ...SEED,
  ...EXPANDED.map((id) => [id, id] as const),
  ...BOSSES,
];

const MINI_SOURCES = [
  ['blazer_smiler', 'blazer_smiler'],
  ['borden', 'constable_borden'],
  ['sprinkler_sentry', 'sprinkler_sentry'],
  ['recycling_raccoon', 'recycling_raccoon'],
  ['unionized_gnome', 'unionized_gnome'],
  ['mandatory_memo', 'mandatory_memo'],
  ['motivational_poster', 'motivational_poster'],
  ['quota_clock', 'quota_clock'],
  ['expired_meter', 'expired_meter'],
  ['showroom_mannequin', 'showroom_mannequin'],
  ['good_investment', 'good_investment'],
  ['rogue_icecream_truck', 'rogue_icecream_truck'],
  ['tick_nymph', 'tick_nymph'],
  ['the_suit', 'the_suit'],
] as const;

const CH1_OVERWORLD_IDS = [
  'blazer_smiler',
  'borden',
  'coily_cicada',
  'cranky_mailbox',
  'hill_slug_deluxe',
  'pigeon_gang',
  'runaway_lawnmower',
  'recycling_raccoon',
  'sprinkler_sentry',
  'unionized_gnome',
  'mandatory_memo',
  'motivational_poster',
  'quota_clock',
  'showroom_mannequin',
  'good_investment',
  'rogue_icecream_truck',
  'tick_nymph',
  'the_suit',
  'expired_meter',
] as const;

function image(path: string) {
  return decodePng(readFileSync(resolve(root, path)));
}

function pixelDifference(a: ReturnType<typeof image>, b: ReturnType<typeof image>): number {
  expect({ w: a.w, h: a.h }).toEqual({ w: b.w, h: b.h });
  let different = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      a.data[i] !== b.data[i]
      || a.data[i + 1] !== b.data[i + 1]
      || a.data[i + 2] !== b.data[i + 2]
      || a.data[i + 3] !== b.data[i + 3]
    ) different++;
  }
  return different;
}

function alphaCountInFrame(sheet: ReturnType<typeof image>, frame: number): number {
  const x0 = frame * 96;
  let count = 0;
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 96; x++) {
      if (sheet.data[(y * sheet.w + x0 + x) * 4 + 3] > 16) count++;
    }
  }
  return count;
}

function animationFrameHash(sheet: ReturnType<typeof image>, frame: number): string {
  const x0 = (frame % 4) * 96;
  const y0 = Math.floor(frame / 4) * 128;
  const hash = createHash('sha256');
  for (let y = 0; y < 128; y++) {
    const start = ((y0 + y) * sheet.w + x0) * 4;
    hash.update(sheet.data.subarray(start, start + 96 * 4));
  }
  return hash.digest('hex');
}

describe('Chapter 1 targeted prop repair contract', () => {
  const props = [
    ['prop_waiting_bench', 136, 64],
    ['prop_wardbed', 324, 306],
  ] as const;

  it('preserves exact runtime dimensions, unclipped alpha, and clean chroma edges', () => {
    for (const [id, w, h] of props) {
      const runtime = image(`assets/art/world/props/${id}.png`);
      expect({ w: runtime.w, h: runtime.h }, id).toEqual({ w, h });
      const bounds = alphaBounds(runtime);
      expect(bounds, id).not.toBeNull();
      expect(bounds!.minX, `${id} left alpha margin`).toBeGreaterThan(0);
      expect(bounds!.minY, `${id} top alpha margin`).toBeGreaterThan(0);
      expect(bounds!.maxX, `${id} right alpha margin`).toBeLessThan(w - 1);
      expect(bounds!.maxY, `${id} bottom alpha margin`).toBeLessThan(h - 1);
      expect(countStrongMagentaResidue(runtime), id).toBe(0);
      for (let i = 0; i < runtime.data.length; i += 4) {
        if (runtime.data[i + 3] === 0) {
          expect(runtime.data[i] | runtime.data[i + 1] | runtime.data[i + 2], `${id} transparent RGB`).toBe(0);
        }
      }
    }
  });

  it('keeps byte-identical accepted masters and complete source provenance', () => {
    const provenancePath = resolve(root, 'assets/art/masters/world/ch1-props/provenance.json');
    const provenance = JSON.parse(readFileSync(provenancePath, 'utf8')) as {
      props: {
        id: string;
        runtime: string;
        acceptedMaster: string;
        sourceChain: string[];
        retainedSourceReferences: string[];
      }[];
    };
    expect(provenance.props.map((entry) => entry.id)).toEqual(props.map(([id]) => id));
    for (const entry of provenance.props) {
      expect(entry.sourceChain).toEqual([entry.acceptedMaster]);
      for (const source of entry.sourceChain) expect(existsSync(resolve(root, source)), source).toBe(true);
      expect(entry.retainedSourceReferences).toHaveLength(2);
      for (const source of entry.retainedSourceReferences) {
        expect(existsSync(resolve(root, source)), source).toBe(true);
      }
      expect(readFileSync(resolve(root, entry.runtime))).toEqual(readFileSync(resolve(root, entry.acceptedMaster)));
    }
  });

  it('keeps the broad package processor away from retained prop outputs', () => {
    const broadProcessor = readFileSync(resolve(root, 'tools/process-ch1-expanded-art.py'), 'utf8');
    const retainedSet = broadProcessor.match(/ACCEPTED_RETAINED_PROP_OUTPUTS\s*=\s*\{([\s\S]*?)\}/)?.[1];
    expect(retainedSet).toBeDefined();
    for (const [id] of props) expect(retainedSet, id).toContain(`"${id}"`);

    const propSheetStart = broadProcessor.indexOf('def prop_sheet(');
    const propSheetEnd = broadProcessor.indexOf('def hickory_tiles(', propSheetStart);
    expect(propSheetStart).toBeGreaterThanOrEqual(0);
    expect(propSheetEnd).toBeGreaterThan(propSheetStart);
    const propSheet = broadProcessor.slice(propSheetStart, propSheetEnd);
    expect(propSheet).toMatch(/if name in ACCEPTED_RETAINED_PROP_OUTPUTS:\r?\n\s+continue/);
  });
});

describe('Chapter 1 authored NPC walk-cycle contract', () => {
  it('pins the retained atlas, accepted runtime/master pair, and review evidence', () => {
    const provenance = JSON.parse(readFileSync(resolve(
      root,
      'assets/art/masters/generated/ch1-expanded/npc-walk-atlas-provenance.json',
    ), 'utf8')) as {
      rebuildCommand: string;
      npcs: Array<{
        id: string;
        preset: string;
        atlasSource: string;
        runtime: string;
        acceptedMaster: string;
        review: string;
        sha256: { atlasSource: string; runtimeAndMaster: string; review: string };
      }>;
    };
    expect(provenance.rebuildCommand).toBe('npm run ch1:npcs:walks');
    expect(provenance.npcs.map(({ id }) => id)).toEqual(['npc_borden', 'npc_realtor', 'npc_waitress']);

    for (const entry of provenance.npcs) {
      const atlasBytes = readFileSync(resolve(root, entry.atlasSource));
      const runtimeBytes = readFileSync(resolve(root, entry.runtime));
      const masterBytes = readFileSync(resolve(root, entry.acceptedMaster));
      const reviewBytes = readFileSync(resolve(root, entry.review));
      expect(createHash('sha256').update(atlasBytes).digest('hex'), entry.id).toBe(entry.sha256.atlasSource);
      expect(createHash('sha256').update(runtimeBytes).digest('hex'), entry.id).toBe(entry.sha256.runtimeAndMaster);
      expect(createHash('sha256').update(reviewBytes).digest('hex'), entry.id).toBe(entry.sha256.review);
      expect(runtimeBytes, `${entry.id} accepted master`).toEqual(masterBytes);

      const atlas = decodePng(atlasBytes);
      const sheet = decodePng(runtimeBytes);
      const review = decodePng(reviewBytes);
      expect(atlas.w, entry.id).toBeGreaterThan(700);
      expect(atlas.h, entry.id).toBeGreaterThan(1500);
      expect({ w: sheet.w, h: sheet.h }, entry.id).toEqual({ w: 384, h: 1536 });
      expect({ w: review.w, h: review.h }, entry.id).toEqual({ w: 1536, h: 768 });
      for (let frame = 0; frame < 46; frame++) {
        expect(animationFrameHash(sheet, frame), `${entry.id} frame ${frame}`).not.toBe(
          createHash('sha256').update(new Uint8Array(96 * 128 * 4)).digest('hex'),
        );
      }
      for (const trio of [[0, 1, 3], [4, 5, 7], [12, 13, 15], [27, 28, 29], [33, 34, 35]]) {
        expect(new Set(trio.map((frame) => animationFrameHash(sheet, frame))).size, `${entry.id} ${trio}`).toBe(3);
      }
    }
  });
});

describe('Chapter 1 battle base/wear contract', () => {
  it('pins complete seed, expanded, and boss trios in base -> wear 1 -> wear 2 order', () => {
    const registry: readonly string[] = AUTHORED_ENEMY_BATTLE_ART_KEYS;
    for (const [id, spriteId] of COMPLETE_ROSTER) {
      const baseKey = `battle_${spriteId}`;
      expect(ENEMIES[id]?.sprite, id).toBe(baseKey);
      const keys = [baseKey, `${baseKey}_w1`, `${baseKey}_w2`];
      const indices = keys.map((key) => registry.indexOf(key));
      expect(indices, `${id} registry order`).toEqual([indices[0], indices[0] + 1, indices[0] + 2]);

      const frames = keys.map((key) => image(`assets/art/enemies/${key}.png`));
      expect(frames[1].w, id).toBe(frames[0].w);
      expect(frames[1].h, id).toBe(frames[0].h);
      expect(frames[2].w, id).toBe(frames[0].w);
      expect(frames[2].h, id).toBe(frames[0].h);
      for (const [index, frame] of frames.entries()) expect(alphaBounds(frame), `${id} wear ${index}`).not.toBeNull();
      const area = frames[0].w * frames[0].h;
      expect(pixelDifference(frames[0], frames[1]), `${id} base/w1 distinction`).toBeGreaterThan(area * 0.1);
      expect(pixelDifference(frames[1], frames[2]), `${id} w1/w2 distinction`).toBeGreaterThan(area * 0.1);
    }
  });

  it('retains accepted high-resolution master coverage for every asset family', () => {
    expect(existsSync(resolve(root, 'assets/art/masters/enemies/ch1-enemies-wear-source.png'))).toBe(true);
    expect(existsSync(resolve(root, 'assets/art/masters/enemies/ch1-enemies-wear-transparent.png'))).toBe(true);
    expect(existsSync(resolve(root, 'assets/art/masters/battlers/npc_borden-battler-transparent.png'))).toBe(true);
    for (const id of EXPANDED) {
      for (const suffix of ['', '_w1', '_w2']) {
        expect(existsSync(resolve(root, `assets/art/masters/enemies/battle_${id}${suffix}.png`)), `${id}${suffix}`).toBe(true);
      }
    }
    for (const suffix of ['', '_w1', '_w2']) {
      expect(existsSync(resolve(root, `assets/art/masters/enemies/battle_hush_sentinel${suffix}.png`))).toBe(true);
    }
  });
});

describe('Chapter 1 honest fallback mini contract', () => {
  it('maps every former alias to a registered, same-identity, rederivable mini', () => {
    const hashes = new Set<string>();
    for (const [id, battleSource] of MINI_SOURCES) {
      const key = `mini_${id}`;
      expect(ENEMIES[id]?.mini, id).toBe(key);
      expect(AUTHORED_ENEMY_MINI_ART_KEYS, id).toContain(key);
      const runtimePath = resolve(root, `assets/art/enemies/${key}.png`);
      const acceptedPath = resolve(root, `assets/art/masters/enemies/ch1-minis/${key}-accepted-master.png`);
      const runtimeBytes = readFileSync(runtimePath);
      expect(runtimeBytes, `${id} accepted master`).toEqual(readFileSync(acceptedPath));
      const runtime = decodePng(runtimeBytes);
      expect(Math.max(runtime.w, runtime.h), id).toBe(64);
      expect(Math.min(runtime.w, runtime.h), id).toBeGreaterThan(20);
      const derived = deriveEnemyMini(image(`assets/art/enemies/battle_${battleSource}.png`));
      expect(runtimeBytes, `${id} derivation`).toEqual(Buffer.from(encodePng(derived)));
      hashes.add(rgbaHash(runtime));
    }
    expect(hashes.size).toBe(MINI_SOURCES.length);
  });

  it('records a complete same-identity source mapping in accepted provenance', () => {
    const provenance = JSON.parse(readFileSync(resolve(root, 'assets/art/masters/enemies/ch1-minis/provenance.json'), 'utf8')) as {
      minis: { id: string; derivedFromRuntimeBattler: string; retainedAuthoredMaster: string }[];
    };
    expect(provenance.minis.map(({ id }) => id)).toEqual(MINI_SOURCES.map(([id]) => id));
    for (const entry of provenance.minis) {
      expect(existsSync(resolve(root, entry.derivedFromRuntimeBattler)), entry.id).toBe(true);
      expect(existsSync(resolve(root, entry.retainedAuthoredMaster)), entry.id).toBe(true);
    }
  });
});

describe('Chapter 1 authored 8-direction field sheets', () => {
  it('keeps identity wiring and eight populated 96x128 slices per sheet', () => {
    const sheetHashes = new Set<string>();
    for (const id of CH1_OVERWORLD_IDS) {
      expect(AUTHORED_ENEMY_OVERWORLD_ART_IDS, id).toContain(id);
      expect(ENEMIES[id]?.overworld, id).toBe(`ow_enemy_${id}`);
      const path = resolve(root, `assets/art/enemies/overworld/${id}_8dir.png`);
      const sheet = decodePng(readFileSync(path));
      expect({ w: sheet.w, h: sheet.h }, id).toEqual({ w: 768, h: 128 });
      for (let frame = 0; frame < 8; frame++) {
        expect(alphaCountInFrame(sheet, frame), `${id} direction ${frame}`).toBeGreaterThan(500);
      }
      sheetHashes.add(createHash('sha256').update(sheet.data).digest('hex'));
    }
    expect(sheetHashes.size).toBe(CH1_OVERWORLD_IDS.length);
  });
});
