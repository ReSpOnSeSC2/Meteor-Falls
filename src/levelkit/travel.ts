/**
 * THE LEVELKIT — travel scenes (S15g, ADR-044).
 *
 * buildTravelScene extracts the masked-reel pattern from bus_interior /
 * boat_interior: a vehicle cabin (window band along the top, seats either
 * side of an aisle, an exit). One recipe per §A5 leg, so Lucille / the night
 * train / the riverboat / the snow-cat each cost a RECIPE, not a rebuild —
 * the scrolling window REEL is the scene runtime's job (a window-band mask +
 * a reel spawner); the recipe lays the geometry it masks.
 */
import type { TravelRecipe, DraftMapDef, PropDef, DoorZone } from '../schemas';
import { Streams } from './rng';
import { Grid, SOLID, clampSize } from './kit';

/** per-leg cabin tiles + size (bus/train carriages run long; boats run wide) */
const CABIN: Record<TravelRecipe['leg'], { floor: string; wall: string; size: [number, number] }> = {
  bus: { floor: 'u', wall: 'U', size: [14, 12] },
  train: { floor: 'u', wall: 'U', size: [12, 16] },
  snowcat: { floor: 'u', wall: 'U', size: [12, 10] },
  boat: { floor: 'w', wall: 'W', size: [18, 12] },
  riverboat: { floor: 'w', wall: 'W', size: [18, 12] },
  biplane: { floor: 'w', wall: 'W', size: [10, 14] },
};

const seat = (x: number, y: number): PropDef => ({ sprite: 'bench', x, y, solid: SOLID.bench });

export function buildTravelScene(r: TravelRecipe): DraftMapDef {
  const cab = CABIN[r.leg];
  const [W, H] = clampSize(cab.size, 8, 8);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, cab.floor);
  g.rect(0, 0, W, 1, cab.wall).rect(0, 0, 1, H, cab.wall).rect(W - 1, 0, 1, H, cab.wall).rect(0, H - 1, W, 1, cab.wall);
  // the WINDOW BAND: the top wall row the reel scrolls behind (mask hook)
  g.rect(1, 0, W - 2, 1, cab.wall);
  // exit doorway, bottom centre
  const gap = Math.round(W / 2) - 1;
  g.set(gap, H - 1, cab.floor);
  g.set(gap + 1, H - 1, cab.floor);

  // seats either side of a central aisle (the aisle column stays clear)
  const aisle = Math.round(W / 2);
  const rows = r.seatRows ?? Math.max(2, Math.floor((H - 4) / 2));
  const props: PropDef[] = [];
  for (let i = 0; i < rows; i++) {
    const y = 2 + i * 2;
    if (y >= H - 2) break;
    props.push(seat(2 + S.jitter(`seatLJit${i}`, 0), y));
    props.push(seat(aisle + 2, y));
  }

  const doors: DoorZone[] = [
    {
      x: gap,
      y: H - 1,
      w: 2,
      h: 1,
      to: r.exitTo ?? `${r.id}__arrive`,
      tx: 16,
      ty: 16,
      facing: 'down',
      indicator: 'mat',
    },
  ];

  return {
    id: r.id,
    name: r.id.replace(/_/g, ' ').toUpperCase(),
    music: null,
    interior: true,
    grid: g.out(),
    props,
    npcs: [],
    signs: [],
    phones: [],
    doors,
    spawners: [],
    triggers: [],
  };
}
