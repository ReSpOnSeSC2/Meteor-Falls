/**
 * Chapter 2 transition-map production guards (2026-07-11).
 *
 * These pins keep the polished harbor -> crossing -> grotto / clifftop route
 * from collapsing back into placeholder rectangles. They intentionally cover
 * both story wiring and the authored landmark vocabulary; dialogue/item behavior
 * remains covered by maps_ch2.test.ts and OverworldScene tests.
 */
import { describe, expect, it } from 'vitest';
import { CHAR_LEGEND, COSTA_DOOR_FOR_PUERTO_SOL, MAPS } from './maps';
import { TILESET } from '../spritegen/tiles';

const solidByName = new Map(TILESET.map((tile) => [tile.name, tile.solid] as const));
const isSolidChar = (ch: string): boolean =>
  ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

function reachable(
  grid: readonly string[],
  from: readonly [number, number],
  to: readonly [number, number],
): boolean {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const queue: Array<readonly [number, number]> = [from];
  const seen = new Set<string>([`${from[0]},${from[1]}`]);

  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (x === to[0] && y === to[1]) return true;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(key) || isSolidChar(grid[ny][nx])) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return false;
}

describe('TWOTON DOCKS - the production harbor threshold', () => {
  const docks = MAPS.brickton_docks;

  it('keeps the exact round-trip door, boarding zone, and ticket cache contract', () => {
    expect(docks.grid[0].length).toBe(30);
    expect(docks.grid.length).toBe(18);
    expect(docks.doors).toContainEqual({
      x: 0,
      y: 6,
      w: 1,
      h: 3,
      to: 'brickton',
      tx: 101 * 16 + 8,
      ty: 56 * 16 + 8,
      facing: 'left',
    });
    expect(docks.triggers).toContainEqual({
      id: 'board_boat',
      rect: { x: 22, y: 7, w: 2, h: 3 },
      once: false,
    });

    const closed = docks.props.find((p) => p.sprite === 'gift_box' && p.unlessFlag === 'gift_boat_ticket');
    const opened = docks.props.find((p) => p.sprite === 'gift_box_open' && p.ifFlag === 'gift_boat_ticket');
    expect(closed).toMatchObject({ x: 14, y: 8 });
    expect(opened).toMatchObject({ x: 14, y: 8 });
    expect(docks.signs.find((s) => s.dialogue === 'gift_boat_ticket')).toMatchObject({
      x: 14,
      y: 9,
      unlessFlag: 'gift_boat_ticket',
    });
    expect(docks.signs.find((s) => s.dialogue === 'gift_boat_ticket_done')).toMatchObject({
      x: 14,
      y: 9,
      ifFlag: 'gift_boat_ticket',
    });
  });

  it('retains the authored terminal, cargo, auction, and mooring landmarks', () => {
    const sprites = new Set(docks.props.map((p) => p.sprite));
    for (const sprite of [
      'puerto_ticket_kiosk',
      'puerto_cargo_crane',
      'puerto_luggage_cart',
      'puerto_mooring_bollards',
      'puerto_fish_stall',
      'puerto_harbor_bell',
    ]) {
      expect(sprites.has(sprite), `brickton_docks missing ${sprite}`).toBe(true);
    }
  });
});

describe('THE BANANA BOAT - a real crossing deck', () => {
  const boat = MAPS.boat_interior;
  // OverworldScene.boatAsk's first-ride landing, converted to its containing tile.
  const cutsceneSpawn: readonly [number, number] = [Math.floor(184 / 16), Math.floor(116 / 16)];

  it('is a 24x14 cinematic deck with a walkable first-ride spawn', () => {
    expect(boat.grid[0].length).toBe(24);
    expect(boat.grid.length).toBe(14);
    expect(boat.interior).toBe(true);
    expect(isSolidChar(boat.grid[cutsceneSpawn[1]][cutsceneSpawn[0]])).toBe(false);
    expect(boat.doors).toEqual([]);
    expect(boat.triggers).toEqual([]);
  });

  it('does not regress to land-fence rails or city wear painted onto the ship', () => {
    const cells = boat.grid.join('');
    const forbidden = [...new Set(cells)].filter((ch) => ['-', '|', '1', '2', '3', '4'].includes(ch));
    expect(forbidden).toEqual([]);
  });

  it('keeps its authored wheelhouse and working-deck winch', () => {
    const sprites = new Set(boat.props.map((p) => p.sprite));
    expect(sprites.has('puerto_wheelhouse')).toBe(true);
    expect(sprites.has('puerto_deck_winch')).toBe(true);
  });
});

describe('LAS DUNAS GROTTO - the multi-chamber cache run', () => {
  const grotto = MAPS.grotto;
  const mouthLanding: readonly [number, number] = [14, 18];

  it('keeps the 28x20 cave, reciprocal door, and corrected Dunas landing', () => {
    expect(grotto.grid[0].length).toBe(28);
    expect(grotto.grid.length).toBe(20);
    expect(grotto.doors).toContainEqual({
      x: 12,
      y: 19,
      w: 4,
      h: 1,
      to: 'jungle_2',
      tx: 192,
      ty: 40,
      facing: 'down',
      indicator: 'mat',
    });
    expect(MAPS.jungle_2.doors.find((d) => d.to === 'grotto')).toMatchObject({ tx: 224, ty: 296 });
    expect(isSolidChar(grotto.grid[mouthLanding[1]][mouthLanding[0]])).toBe(false);
  });

  it('keeps every legacy cache pair reachable from the rebuilt mouth', () => {
    for (const flag of ['grotto_chest_1', 'grotto_chest_2', 'grotto_chest_3']) {
      const closed = grotto.props.find((p) => p.sprite === 'gift_box' && p.unlessFlag === flag);
      const opened = grotto.props.find((p) => p.sprite === 'gift_box_open' && p.ifFlag === flag);
      const prompt = grotto.signs.find((s) => s.dialogue === flag && s.unlessFlag === flag);
      expect(closed, `${flag} closed state`).toBeDefined();
      expect(opened, `${flag} opened state`).toBeDefined();
      expect(prompt, `${flag} prompt`).toBeDefined();
      const target: readonly [number, number] = [Math.round(prompt?.x ?? -1), Math.round(prompt?.y ?? -1)];
      expect(isSolidChar(grotto.grid[target[1]][target[0]]), `${flag} prompt tile`).toBe(false);
      expect(reachable(grotto.grid, mouthLanding, target), `${flag} reachable`).toBe(true);
    }
  });

  it('retains the sun shrine, entry arch, fissure bridge, and underground spring', () => {
    const sprites = new Set(grotto.props.map((p) => p.sprite));
    for (const sprite of ['grotto_sun_shrine', 'grotto_stone_arch', 'grotto_rope_bridge', 'grotto_spring']) {
      expect(sprites.has(sprite), `grotto missing ${sprite}`).toBe(true);
    }
  });
});

describe('COSTA ESTRELLA - the moonlit clifftop threshold', () => {
  const costa = MAPS.costa_estrella;

  it('keeps both exact reciprocal world links', () => {
    expect(costa.grid[0].length).toBe(27);
    expect(costa.grid.length).toBe(16);
    expect(costa.doors.find((d) => d.to === 'puerto_sol')).toEqual(COSTA_DOOR_FOR_PUERTO_SOL);
    expect(costa.doors.find((d) => d.to === 'golf_resort')).toEqual({
      x: 0,
      y: 8,
      w: 1,
      h: 2,
      to: 'golf_resort',
      tx: 224,
      ty: 320,
      facing: 'left',
    });
    expect(MAPS.puerto_sol.doors.find((d) => d.to === 'costa_estrella')).toMatchObject({ tx: 216, ty: 232 });
    expect(MAPS.golf_resort.doors.find((d) => d.to === 'costa_estrella')).toMatchObject({ tx: 24, ty: 128 });
  });

  it('stays in Puerto Sol night and retains its authored clifftop landmarks', () => {
    expect(costa.night).toBe(true);
    expect(costa.ambience).toBe('waves');
    const sprites = new Set(costa.props.map((p) => p.sprite));
    for (const sprite of ['costa_sun_marker', 'costa_telescope', 'costa_windsock', 'costa_flower_urns']) {
      expect(sprites.has(sprite), `costa_estrella missing ${sprite}`).toBe(true);
    }
    expect(sprites.has('clubhouse')).toBe(false);
    expect(sprites.has('clubhouse_grand')).toBe(false);
  });
});
