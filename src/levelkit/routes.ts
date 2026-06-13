/**
 * THE LEVELKIT — routes + wilds (S15g, ADR-044).
 *
 * buildRoute is the connector-screen shape (Meadow Mile's class): treelines/
 * fences as edges, a path that ARGUES with the land (it bends, it is never a
 * straight corridor), §B4 density law (routes outrank towns — spawners run
 * hot), one picnic table BEFORE the densest pressure, and sign slots.
 * buildWild is the forest/moor variant (the BOOTSTEP MOOR class): denser
 * cover, a winding trail, and the highest encounter density of the kit.
 */
import type {
  RouteRecipe,
  WildRecipe,
  DraftMapDef,
  PropDef,
  SignDef,
  SpawnerDef,
  DoorZone,
} from '../schemas';
import { Streams, streamSeed } from './rng';
import { Grid, tree, furniture, BAND_ROSTER, clampSize } from './kit';

function bandEnemies(band: RouteRecipe['encounterBand']): string[] {
  return [...(BAND_ROSTER[band ?? 'ch1'] ?? BAND_ROSTER.ch1)];
}

/** a horizontal trail that wanders up and down as it crosses (never straight) */
function carveTrail(g: Grid, W: number, H: number, S: Streams, name: string): number[] {
  let py = Math.round(H / 2);
  const ys: number[] = [];
  for (let x = 0; x < W; x++) {
    g.set(x, py, ':');
    g.set(x, py + 1, ':');
    ys.push(py);
    if (S.chance(`${name}Bend${x}`, 0.22)) {
      py = Math.max(3, Math.min(H - 5, py + (S.chance(`${name}Dir${x}`, 0.5) ? 1 : -1)));
    }
  }
  return ys;
}

/** edge cover both sides; ends left/right are kept open for the doors */
function edgeCover(g: Grid, W: number, H: number, S: Streams, style: RouteRecipe['style']): PropDef[] {
  const cover: PropDef[] = [];
  const pines = style === 'ridge';
  for (let x = 1; x < W - 1; x++) {
    if (style === 'fenced') {
      g.set(x, 0, '-');
      g.set(x, H - 1, '-');
    } else if (style === 'coast') {
      g.set(x, H - 1, 'e');
      g.set(x, H - 2, 'E');
      if (S.chance(`topTree${x}`, 0.7)) cover.push(tree(x, 0, pines));
    } else {
      if (S.chance(`topTree${x}`, 0.8)) cover.push(tree(x, 0, pines));
      if (S.chance(`botTree${x}`, 0.8)) cover.push(tree(x, H - 2, pines));
    }
  }
  return cover;
}

export function buildRoute(r: RouteRecipe): DraftMapDef {
  const [W, H] = clampSize(r.size, 28, 16);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, '.');
  g.sprinkle(streamSeed(r.seed, 'sprinkle'), ',~ff F', 0.12);

  const trailYs = carveTrail(g, W, H, S, 'route');
  const props: PropDef[] = edgeCover(g, W, H, S, r.style);

  // scattered obstacle trees off the trail (the land the path argues with)
  for (let i = 0; i < Math.round((W * H) / 60); i++) {
    const x = 2 + S.int(`obx${i}`, W - 4);
    const y = 2 + S.int(`oby${i}`, H - 5);
    if (Math.abs(y - trailYs[x]) <= 1) continue; // keep the trail walkable
    props.push(tree(x, y, r.style === 'ridge'));
  }

  // one picnic table near the entrance (left), BEFORE the hot middle
  props.push(furniture('picnic', 3, Math.max(2, trailYs[3] - 2)));
  const phones = [{ x: 2, y: Math.min(H - 2, trailYs[2] + 2) }];
  props.push(furniture('payphone', 2, phones[0].y));

  const signs: SignDef[] = [];
  for (let i = 0; i < (r.signSlots ?? 1); i++) {
    const sx = Math.round((W * (i + 1)) / ((r.signSlots ?? 1) + 1));
    signs.push({ x: sx, y: Math.max(2, trailYs[sx] - 2), dialogue: `${r.id}_sign_${i}` });
  }

  // routes run HOT: a band of pressure across the middle third
  const spawners: SpawnerDef[] = [
    { enemies: bandEnemies(r.encounterBand), count: 3, rect: { x: Math.round(W / 3), y: 2, w: Math.round(W / 3), h: H - 4 } },
  ];

  const ends = r.ends ?? [`${r.id}__west`, `${r.id}__east`];
  const doors: DoorZone[] = [
    { x: 0, y: trailYs[0], w: 1, h: 2, to: ends[0], tx: (W - 2) * 16, ty: trailYs[W - 1] * 16, facing: 'left', indicator: 'none' },
    { x: W - 1, y: trailYs[W - 1], w: 1, h: 2, to: ends[1], tx: 16, ty: trailYs[0] * 16, facing: 'right', indicator: 'none' },
  ];

  return {
    id: r.id,
    name: r.id.replace(/_/g, ' ').toUpperCase(),
    music: null,
    grid: g.out(),
    props,
    npcs: [],
    signs,
    phones,
    doors,
    spawners,
    triggers: [],
  };
}

export function buildWild(r: WildRecipe): DraftMapDef {
  const [W, H] = clampSize(r.size, 28, 18);
  const S = new Streams(r.seed);
  const forest = r.style === 'forest';
  const g = new Grid(W, H, forest ? '.' : ',');
  g.sprinkle(streamSeed(r.seed, 'sprinkle'), forest ? ',~bb~' : ',~b ', 0.18);

  const trailYs = carveTrail(g, W, H, S, 'wild');
  const props: PropDef[] = [];
  // dense cover (forest) or sparse rocks/bushes (moor)
  const density = forest ? 0.34 : 0.12;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (Math.abs(y - trailYs[x]) <= 1) continue;
      if (S.chance(`cover${x}_${y}`, density)) props.push(tree(x, y, forest));
    }
  }

  props.push(furniture('picnic', 3, Math.max(2, trailYs[3] - 2)));
  const phones = [{ x: 2, y: Math.min(H - 2, trailYs[2] + 2) }];
  props.push(furniture('payphone', 2, phones[0].y));

  const spawners: SpawnerDef[] = [
    { enemies: bandEnemies(r.encounterBand), count: forest ? 4 : 3, rect: { x: 2, y: 2, w: W - 4, h: H - 4 } },
  ];

  const ends = r.ends ?? [`${r.id}__in`, `${r.id}__out`];
  const doors: DoorZone[] = [
    { x: 0, y: trailYs[0], w: 1, h: 2, to: ends[0], tx: (W - 2) * 16, ty: trailYs[W - 1] * 16, facing: 'left', indicator: 'none' },
    { x: W - 1, y: trailYs[W - 1], w: 1, h: 2, to: ends[1], tx: 16, ty: trailYs[0] * 16, facing: 'right', indicator: 'none' },
  ];

  return {
    id: r.id,
    name: r.id.replace(/_/g, ' ').toUpperCase(),
    music: null,
    grid: g.out(),
    props,
    npcs: [],
    signs: [],
    phones,
    doors,
    spawners,
    triggers: [],
  };
}
