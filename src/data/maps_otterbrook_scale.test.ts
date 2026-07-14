import { describe, expect, it } from 'vitest';
import {
  NPC_FOOTPRINT,
  PLAYER_FOOTPRINT,
  characterFeet,
  footRect,
  npcEffectiveScale,
  type Rect,
} from '../engine/actor-collision';
import { aabbOverlap } from '../engine/movecollide';
import { groundedVisualDepth } from '../engine/world-depth';
import {
  CH1_TRAIL_FLAGS,
  CH1_TRAIL_KEY_ITEM_ID,
  chapter1TrailOwnsKey,
} from '../engine/ch1TrailRoute';
import type { NpcDef, PropDef, SignDef } from '../schemas';
import { AUTHORED_WORLD_PROP_DISPLAY_SIZE } from '../spritegen/authored';
import { TILESET } from '../spritegen/tiles';
import { CHAR_LEGEND, MAPS, OTTERBROOK_LANDMARK_DIMS, OTTERBROOK_TOWN_BASE } from './maps';
import { CH1_WORLD } from './maps_ch1';
import { doorstepOf, treeSolid, type TreeSprite } from './mapkit';

const map = MAPS.otterbrook;
const solidByName = new Map(TILESET.map((tile) => [tile.name, tile.solid]));
const visible = (def: { ifFlag?: string; unlessFlag?: string }, flags: ReadonlySet<string>): boolean =>
  (!def.ifFlag || flags.has(def.ifFlag)) && (!def.unlessFlag || !flags.has(def.unlessFlag));
const isSolidTile = (ch: string): boolean =>
  ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;
const propScale = (prop: PropDef): { x: number; y: number } => {
  if (typeof prop.scale === 'number') return { x: prop.scale, y: prop.scale };
  return { x: prop.scale?.x ?? 1, y: prop.scale?.y ?? 1 };
};

/** Native-pixel mirror of OverworldScene.facadeSolids(). */
function facadeSolids(prop: PropDef): Rect[] {
  const dims = OTTERBROOK_LANDMARK_DIMS[prop.sprite];
  if (!dims) return [];
  const scale = propScale(prop);
  const left = prop.x * 16;
  const topPx = prop.y * 16;
  const width = (dims[0] / 4) * scale.x;
  const height = (dims[1] / 4) * scale.y;
  const top = topPx + 10 * scale.y;
  const right = left + width;
  const foot = topPx + height;
  if (!prop.door) return [{ x: left, y: top, w: width, h: foot - top }];

  const nativeDoorWidth = prop.door.w * scale.x;
  const center = left + prop.door.ox * scale.x + nativeDoorWidth / 2;
  const gap = Math.max(nativeDoorWidth, 12);
  const doorLeft = center - gap / 2;
  const doorRight = center + gap / 2;
  const doorTop = foot - 18 * scale.y;
  const out: Rect[] = [];
  if (doorLeft > left) out.push({ x: left, y: top, w: doorLeft - left, h: foot - top });
  if (right > doorRight) out.push({ x: doorRight, y: top, w: right - doorRight, h: foot - top });
  if (doorTop > top) out.push({ x: doorLeft, y: top, w: gap, h: doorTop - top });
  return out;
}

function propSolids(prop: PropDef): Rect[] {
  if (prop.sprite in OTTERBROOK_LANDMARK_DIMS) return facadeSolids(prop);
  const scale = propScale(prop);
  return (prop.solidParts ?? (prop.solid ? [prop.solid] : [])).map((part) => ({
    x: prop.x * 16 + part.ox * scale.x,
    y: prop.y * 16 + part.oy * scale.y,
    w: part.w * scale.x,
    h: part.h * scale.y,
  }));
}

const nativeLevelDepthBias = map.grid.length * 16;
const nativeLevelAt = (x: number, y: number): number =>
  Number(map.elevation?.level[Math.floor(y / 16)]?.[Math.floor(x / 16)] ?? 0);

function landmarkVisualRect(prop: PropDef): Rect {
  const dims = OTTERBROOK_LANDMARK_DIMS[prop.sprite];
  if (!dims) throw new Error(`Missing Otterbrooke landmark dimensions for ${prop.sprite}`);
  const scale = propScale(prop);
  return {
    x: prop.x * 16,
    y: prop.y * 16,
    w: (dims[0] / 4) * scale.x,
    h: (dims[1] / 4) * scale.y,
  };
}

function landmarkGroundDepth(prop: PropDef) {
  const rect = landmarkVisualRect(prop);
  const scale = propScale(prop);
  const doorGround = prop.door
    ? {
        x: rect.x + prop.door.ox * scale.x + (prop.door.w * scale.x) / 2,
        y: rect.y + (prop.door.oy + prop.door.h) * scale.y + 5,
      }
    : undefined;
  return groundedVisualDepth(rect, nativeLevelDepthBias, nativeLevelAt, doorGround);
}

function bodyTouchesTile(body: Rect): boolean {
  const x0 = Math.floor(body.x / 16);
  const y0 = Math.floor(body.y / 16);
  const x1 = Math.floor((body.x + body.w) / 16);
  const y1 = Math.floor((body.y + body.h) / 16);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (y < 0 || x < 0 || y >= map.grid.length || x >= map.grid[0].length || isSolidTile(map.grid[y][x])) return true;
    }
  }
  return false;
}

function playerBody(x: number, y: number): Rect {
  return footRect({ x: x * 16 + 8, y: y * 16 + 12 }, PLAYER_FOOTPRINT);
}

function activeSolids(flags: ReadonlySet<string>): Rect[] {
  return map.props.filter((prop) => visible(prop, flags)).flatMap(propSolids);
}

function reachableTiles(
  flags: ReadonlySet<string>,
  start: Readonly<{ x: number; y: number }> = CH1_WORLD.recovery.tile,
): Set<string> {
  const solids = activeSolids(flags);
  const fits = (x: number, y: number): boolean => {
    const body = playerBody(x, y);
    return !bodyTouchesTile(body) && !solids.some((solid) => aabbOverlap(body, solid));
  };
  const queue: Array<readonly [number, number]> = [[start.x, start.y]];
  const seen = new Set<string>();
  if (!fits(start.x, start.y)) return seen;
  seen.add(`${start.x},${start.y}`);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !fits(nx, ny)) continue;
      const fromLevel = map.elevation?.level[y]?.[x];
      const toLevel = map.elevation?.level[ny]?.[nx];
      const stairs = map.grid[y]?.[x] === 'T' || map.grid[ny]?.[nx] === 'T';
      if (fromLevel !== toLevel && !stairs) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return seen;
}

/** Mirror the route-key portion of OverworldScene's save reconciliation. */
function reconciledTrailFlags(flags: ReadonlySet<string>, keyItems: readonly string[]): Set<string> {
  const reconciled = new Set(flags);
  if (chapter1TrailOwnsKey((flag) => reconciled.has(flag), keyItems)) {
    reconciled.add(CH1_TRAIL_FLAGS.hasKey);
  }
  return reconciled;
}

function doorBox(prop: PropDef): Rect {
  const dims = OTTERBROOK_LANDMARK_DIMS[prop.sprite];
  const scale = propScale(prop);
  const height = (dims[1] / 4) * scale.y;
  const nativeDoorWidth = prop.door!.w * scale.x;
  const center = prop.x * 16 + prop.door!.ox * scale.x + nativeDoorWidth / 2;
  const gap = Math.max(nativeDoorWidth, 12);
  return {
    x: center - gap / 2,
    y: prop.y * 16 + height - 14 * scale.y,
    w: gap,
    h: prop.door!.h * scale.y,
  };
}

function npcBody(npc: NpcDef): Rect {
  return footRect(
    characterFeet(npc.x, npc.y),
    NPC_FOOTPRINT,
    npcEffectiveScale(map.id, npc.dog === true, npc.scale),
  );
}

const facings = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
function signCanBeRead(sign: SignDef, seen: ReadonlySet<string>, flags: ReadonlySet<string>): boolean {
  const target = { x: sign.x * 16 + 8, y: sign.y * 16 + 8 };
  const npcs = map.npcs.filter((npc) => visible(npc, flags));
  for (let y = Math.floor(sign.y) - 2; y <= Math.floor(sign.y) + 2; y++) {
    for (let x = Math.floor(sign.x) - 2; x <= Math.floor(sign.x) + 2; x++) {
      if (!seen.has(`${x},${y}`)) continue;
      const feet = { x: x * 16 + 8, y: y * 16 + 12 };
      for (const [dx, dy] of facings) {
        const probe = { x: feet.x + dx * 16, y: feet.y - 6 + dy * 14 };
        if (Math.hypot(target.x - probe.x, target.y - probe.y) >= 16) continue;
        const npcWins = npcs.some((npc) => {
          const npcFeet = characterFeet(npc.x, npc.y);
          return Math.hypot(npcFeet.x - probe.x, npcFeet.y - 6 - probe.y) < 16;
        });
        if (!npcWins) return true;
      }
    }
  }
  return false;
}

describe('Otterbrooke enlarged-facade runtime geometry', () => {
  const phases = [
    { id: 'night', flags: new Set<string>() },
    { id: 'key route', flags: new Set(['meteor_fell', 'zapper_done', 'has_trail_key']) },
    { id: 'restored', flags: new Set(['meteor_fell', 'zapper_done', 'has_trail_key', 'tick_defeated', 'owned_27_maple']) },
  ];

  it('keeps every phase-active exterior doorway reachable through its scaled wall opening', () => {
    for (const phase of phases) {
      const seen = reachableTiles(phase.flags);
      expect(seen.size, `${phase.id} connected tiles`).toBeGreaterThan(1_000);
      const solids = activeSolids(phase.flags);
      const entrances = map.props.filter((prop) => visible(prop, phase.flags) && prop.door && prop.sprite in OTTERBROOK_LANDMARK_DIMS);
      for (const prop of entrances) {
        const box = doorBox(prop);
        // Movement is continuous, not tile-centre quantized. Prove that the
        // exact centre of the entrance admits the full player body, and that a
        // connected sampled tile reaches the same doorway cell.
        const feet = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
        const body = footRect(feet, PLAYER_FOOTPRINT);
        const tx = Math.floor(feet.x / 16);
        const ty = Math.floor(feet.y / 16);
        const approach = [...seen].some((key) => {
          const [x, y] = key.split(',').map(Number);
          return Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1;
        });
        expect(bodyTouchesTile(body), `${phase.id}: ${prop.sprite} threshold tiles`).toBe(false);
        expect(solids.some((solid) => aabbOverlap(body, solid)), `${phase.id}: ${prop.sprite} threshold body`).toBe(false);
        expect(approach, `${phase.id}: ${prop.sprite} -> ${prop.door!.to}`).toBe(true);
      }
    }
  });

  it('renders Jay in front of the purple house when he leaves rex_home', () => {
    const house = map.props.find((prop) => prop.sprite === 'house_rex' && prop.door?.to === 'rex_home');
    const doorstep = doorstepOf(map, 'rex_home');
    expect(house).toBeDefined();
    expect(doorstep).not.toBeNull();
    if (!house || !doorstep) return;

    const rect = landmarkVisualRect(house);
    const houseGround = landmarkGroundDepth(house);
    const actorDepth = doorstep.ty + nativeLevelAt(doorstep.tx, doorstep.ty) * nativeLevelDepthBias;
    const body = footRect({ x: doorstep.tx, y: doorstep.ty }, PLAYER_FOOTPRINT);

    // The enlarged art reaches up onto L2, but its doorway and visual foot are
    // planted on Jay's L1 terrace. Roof-based sorting made that extra level of
    // bias cover his whole body; ground-based sorting leaves Jay in front.
    expect(nativeLevelAt(rect.x, rect.y)).toBe(2);
    expect(houseGround.level).toBe(1);
    expect(nativeLevelAt(doorstep.tx, doorstep.ty)).toBe(houseGround.level);
    expect(actorDepth).toBeGreaterThan(houseGround.depth);
    expect(bodyTouchesTile(body)).toBe(false);
    expect(activeSolids(new Set()).some((solid) => aabbOverlap(body, solid))).toBe(false);
  });

  it('grounds the hillside treeline at its forest foot so the birder draws in front', () => {
    const birder = map.npcs.find((npc) => npc.id === 'woods_birder');
    const front = map.props.find((prop) => prop.sprite === 'treeline_8' && prop.x === 64 && prop.y === 24.5);
    expect(birder).toBeDefined();
    expect(front).toBeDefined();
    if (!birder || !front) return;

    const size = AUTHORED_WORLD_PROP_DISPLAY_SIZE.treeline_8;
    const rect = { x: front.x * 16, y: front.y * 16, w: size.w, h: size.h };
    const grounded = groundedVisualDepth(rect, nativeLevelDepthBias, nativeLevelAt);
    const northFeet = characterFeet(birder.x, birder.y);
    northFeet.y -= 24; // full authored wander radius
    const actorDepth = northFeet.y + nativeLevelAt(northFeet.x, northFeet.y) * nativeLevelDepthBias;
    const body = footRect(northFeet, NPC_FOOTPRINT);

    expect(nativeLevelAt(rect.x, rect.y)).toBe(4); // canopy reaches the upper terrace
    expect(grounded.level).toBe(3); // the forest/path seam it actually stands on
    expect(nativeLevelAt(northFeet.x, northFeet.y)).toBe(3);
    expect(actorDepth).toBeGreaterThan(grounded.depth);
    expect(bodyTouchesTile(body)).toBe(false);
  });

  it('gives every town tree an art-matched trunk on grass, clear of NPC spawns', () => {
    const treeSprites = new Set<TreeSprite>(['tree', 'tree_b', 'tree_c', 'pine']);
    const trees = map.props.filter(
      (prop) => prop.y >= OTTERBROOK_TOWN_BASE && treeSprites.has(prop.sprite as TreeSprite),
    );
    expect(trees.length).toBeGreaterThan(200);

    for (const tree of trees) {
      const sprite = tree.sprite as TreeSprite;
      expect(tree.solid, `${sprite} @ ${tree.x},${tree.y}`).toEqual(treeSolid(sprite));
      const trunk = propSolids(tree)[0];
      expect(trunk).toBeDefined();
      if (!trunk) continue;
      const x0 = Math.floor(trunk.x / 16);
      const y0 = Math.floor(trunk.y / 16);
      const x1 = Math.floor((trunk.x + trunk.w - 0.001) / 16);
      const y1 = Math.floor((trunk.y + trunk.h - 0.001) / 16);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          expect(' .,~fF', `${sprite} trunk terrain @ ${x},${y}`).toContain(map.grid[y]?.[x]);
        }
      }
      for (const npc of map.npcs) {
        expect(aabbOverlap(npcBody(npc), trunk), `${npc.id} vs ${sprite} @ ${tree.x},${tree.y}`).toBe(false);
      }
    }
  });

  it('keeps collision-free hill tree art backed by solid forest tiles', () => {
    const treeSprites = new Set<TreeSprite>(['tree', 'tree_b', 'tree_c', 'pine']);
    const decorative = map.props.filter(
      (prop) => prop.y < OTTERBROOK_TOWN_BASE && !prop.solid && treeSprites.has(prop.sprite as TreeSprite),
    );
    expect(decorative.length).toBeGreaterThan(50);
    for (const tree of decorative) {
      const solid = treeSolid(tree.sprite as TreeSprite);
      const trunk = {
        x: tree.x * 16 + solid.ox,
        y: tree.y * 16 + solid.oy,
        w: solid.w,
        h: solid.h,
      };
      const x0 = Math.floor(trunk.x / 16);
      const y0 = Math.floor(trunk.y / 16);
      const x1 = Math.floor((trunk.x + trunk.w - 0.001) / 16);
      const y1 = Math.floor((trunk.y + trunk.h - 0.001) / 16);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          expect(isSolidTile(map.grid[y]?.[x] ?? ''), `${tree.sprite} forest backing @ ${x},${y}`).toBe(true);
        }
      }
    }
  });

  it('sorts every active enterable facade from its doorway elevation', () => {
    for (const phase of phases) {
      const entrances = map.props.filter(
        (prop) => visible(prop, phase.flags) && prop.door && prop.sprite in OTTERBROOK_LANDMARK_DIMS,
      );
      for (const prop of entrances) {
        const doorstep = doorstepOf(map, prop.door!.to);
        expect(doorstep, `${phase.id}: ${prop.sprite} reciprocal doorstep`).not.toBeNull();
        if (!doorstep) continue;
        const facadeGround = landmarkGroundDepth(prop);
        expect(facadeGround.x, `${phase.id}: ${prop.sprite} doorstep X`).toBeCloseTo(doorstep.tx);
        expect(facadeGround.y, `${phase.id}: ${prop.sprite} doorstep Y`).toBeCloseTo(doorstep.ty);
        expect(
          facadeGround.level,
          `${phase.id}: ${prop.sprite} facade/doorway elevation`,
        ).toBe(nativeLevelAt(doorstep.tx, doorstep.ty));
      }
    }
  });

  it('keeps every phase-active NPC outside the enlarged facade bodies', () => {
    for (const phase of phases) {
      const walls = map.props
        .filter((prop) => visible(prop, phase.flags) && prop.sprite in OTTERBROOK_LANDMARK_DIMS)
        .flatMap(facadeSolids);
      for (const npc of map.npcs.filter((candidate) => visible(candidate, phase.flags))) {
        expect(walls.some((wall) => aabbOverlap(npcBody(npc), wall)), `${phase.id}: ${npc.id}`).toBe(false);
      }
    }
  });

  it('keeps the building, street, and quest signs readable after the footprint expansion', () => {
    const mustRead = new Set([
      'sign_otter_hotel', 'sign_otter_hall', 'sign_chapel', 'sign_realty',
      'sign_27_maple', 'sign_27_maple_sold', 'sign_29_maple', 'sign_pemberton_workshop',
      'shop_closed_hush', 'shop_reopened_board',
      'trail_shed_gate_locked', 'trail_shed_gate_open',
      'q_biscuit_clue1', 'q_biscuit_clue2', 'hill_spring',
    ]);
    for (const phase of phases) {
      const seen = reachableTiles(phase.flags);
      for (const sign of map.signs.filter((candidate) => mustRead.has(candidate.dialogue) && visible(candidate, phase.flags))) {
        expect(signCanBeRead(sign, seen, phase.flags), `${phase.id}: ${sign.dialogue}`).toBe(true);
      }
    }
  });

  it('keeps the cave approach isolated until the Trail Key route crosses the shed', () => {
    const claimReady = new Set([
      'meteor_fell',
      'zapper_done',
      CH1_TRAIL_FLAGS.metPemberton,
      CH1_TRAIL_FLAGS.keyAsked,
      CH1_TRAIL_FLAGS.mowerCaught,
    ]);
    const lockedShed = map.props.find((prop) => prop.sprite === 'bldg_ob_trail_shed');
    const openShed = map.props.find((prop) => prop.sprite === 'bldg_ob_trail_shed_open');
    const frontDoor = map.doors.find((door) => door.to === 'trail_shed_int' && door.ifFlag === CH1_TRAIL_FLAGS.hasKey);
    const caveDoor = map.doors.find((door) => door.to === 'oak_roots');
    expect(lockedShed).toBeDefined();
    expect(openShed).toBeDefined();
    expect(frontDoor).toBeDefined();
    expect(caveDoor).toBeDefined();

    const withoutKey = reconciledTrailFlags(claimReady, []);
    const townSide = reachableTiles(withoutKey);
    expect(townSide.has('12,33'), 'the lower shed approach remains reachable').toBe(true);
    expect(townSide.has('12,24'), 'the rear-breach landing cannot be reached around the locked shed').toBe(false);
    expect(townSide.has('7,7'), 'the cave corridor stays in the isolated upper component').toBe(false);
    expect(visible(lockedShed!, withoutKey)).toBe(true);
    expect(visible(openShed!, withoutKey)).toBe(false);
    expect(visible(frontDoor!, withoutKey)).toBe(false);
    expect(visible(caveDoor!, withoutKey)).toBe(false);

    const keyedSaves = [
      {
        id: 'compatibility flag',
        flags: reconciledTrailFlags(new Set([...claimReady, CH1_TRAIL_FLAGS.hasKey]), []),
      },
      {
        id: 'key-item record',
        flags: reconciledTrailFlags(claimReady, [CH1_TRAIL_KEY_ITEM_ID]),
      },
    ];
    for (const save of keyedSaves) {
      expect(visible(lockedShed!, save.flags), `${save.id}: locked facade retires`).toBe(false);
      expect(visible(openShed!, save.flags), `${save.id}: walk-through facade appears`).toBe(true);
      expect(visible(frontDoor!, save.flags), `${save.id}: shed entrance activates`).toBe(true);
      expect(visible(caveDoor!, save.flags), `${save.id}: cave transition activates`).toBe(true);

      // Unlocking exposes a doorway, not an exterior shortcut through the whole
      // building. The only route to this upper component remains the shed's
      // interior rear breach; from that landing the cave mouth is connected.
      expect(reachableTiles(save.flags).has('12,24'), `${save.id}: exterior cannot bypass shed`).toBe(false);
      const aboveShed = reachableTiles(save.flags, { x: 12, y: 24 });
      expect(aboveShed.has('8,3'), `${save.id}: rear breach connects to cave mouth`).toBe(true);
    }
  });
});
