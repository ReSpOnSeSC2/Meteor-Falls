/**
 * THE LEVELKIT — interiors (S15g, ADR-044).
 *
 * buildInterior emits the STRUCTURAL half of S17's interior program: one
 * template family per room kind (home/shop/hospital/chapel/deli/civic/hotel),
 * each laying the rug/counter/door-zone furniture the shipped interiors use.
 * S17's payload taxonomy (A–L) fills what this frames — note the handshake
 * when S17 runs.
 *
 * The exit is a bottom-edge mat facing 'down' (legal alone since S11b — the
 * door law only forbids an untagged facing-'up' mat through a wall).
 */
import type { InteriorRecipe, DraftMapDef, PropDef, DraftNpc } from '../schemas';
import { Streams } from './rng';
import { Grid, SOLID, furniture, clampSize } from './kit';

interface TemplatePlan {
  /** props laid relative to a W×H wood room (tile coords) */
  dress(g: Grid, W: number, H: number, S: Streams): PropDef[];
  /** an optional role-tagged keeper/staff slot */
  staff?: (W: number, H: number) => DraftNpc;
}

// canon solids (maps.ts): a counter spans 2 tiles, a shelf the same
const counter = (x: number, y: number): PropDef => ({ sprite: 'counter', x, y, solid: { ox: 0, oy: 4, w: 30, h: 14 } });
const shelf = (x: number, y: number): PropDef => ({ sprite: 'shelf', x, y, solid: { ox: 0, oy: 12, w: 32, h: 12 } });

const TEMPLATES: Record<InteriorRecipe['template'], TemplatePlan> = {
  home: {
    dress: (_g, W, H) => [
      furniture('bench', 3, 3),
      { sprite: 'rug', x: Math.round(W / 2) - 1, y: H - 5 } as PropDef,
    ],
  },
  shop: {
    dress: (_g, W) => [counter(2, 3), counter(4, 3), shelf(W - 5, 2), shelf(W - 3, 2)],
    staff: () => ({ id: 'keeper', sprite: 'martClerk', x: 3, y: 4, facing: 'down', role: 'keeper' }),
  },
  hospital: {
    dress: (_g, W, H) => [
      counter(2, 3),
      { sprite: 'bench', x: 4, y: H - 4, solid: SOLID.bench } as PropDef,
      { sprite: 'bench', x: W - 6, y: H - 4, solid: SOLID.bench } as PropDef,
    ],
    staff: () => ({ id: 'nurse', sprite: 'nurse', x: 3, y: 4, facing: 'down', role: 'doctor' }),
  },
  chapel: {
    dress: (_g, W, H) => {
      const pews: PropDef[] = [];
      for (let y = 4; y < H - 3; y += 2) {
        pews.push({ sprite: 'bench', x: 3, y, solid: SOLID.bench });
        pews.push({ sprite: 'bench', x: W - 5, y, solid: SOLID.bench });
      }
      return pews;
    },
    staff: (W) => ({ id: 'priest', sprite: 'priestOtter', x: Math.round(W / 2), y: 3, facing: 'down', role: 'priest' }),
  },
  deli: {
    dress: (_g, W) => [counter(2, 3), counter(4, 3), counter(6, 3), shelf(W - 4, 2)],
    staff: () => ({ id: 'deli_keeper', sprite: 'deliKeeper', x: 3, y: 4, facing: 'down', role: 'keeper' }),
  },
  civic: {
    dress: (_g, W, H) => [counter(Math.round(W / 2) - 2, 3), counter(Math.round(W / 2), 3), { sprite: 'rug', x: Math.round(W / 2) - 1, y: H - 5 } as PropDef],
  },
  hotel: {
    dress: (_g, W, H) => [
      counter(2, 3),
      counter(3, 3),
      { sprite: 'rug', x: Math.round(W / 2) - 2, y: H - 6 } as PropDef,
      { sprite: 'bench', x: W - 5, y: 4, solid: SOLID.bench },
    ],
    staff: () => ({ id: 'clerk', sprite: 'martClerk', x: 3, y: 4, facing: 'down', role: 'keeper' }),
  },
};

export function buildInterior(r: InteriorRecipe): DraftMapDef {
  const [W, H] = clampSize(r.size ?? [12, 9], 8, 7);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'w'); // wood floor
  // walls all around, doorway gap at the bottom centre
  g.rect(0, 0, W, 1, 'W').rect(0, 0, 1, H, 'W').rect(W - 1, 0, 1, H, 'W').rect(0, H - 1, W, 1, 'W');
  const gap = Math.round(W / 2) - 1;
  g.set(gap, H - 1, 'w');
  g.set(gap + 1, H - 1, 'w');
  // welcome rug at the entrance
  g.rect(gap, H - 2, 2, 1, 'r');

  const plan = TEMPLATES[r.template];
  const props: PropDef[] = plan.dress(g, W, H, S);
  const npcs: DraftNpc[] = [];
  if (plan.staff) npcs.push(plan.staff(W, H));

  return {
    id: r.id,
    name: r.id.replace(/_/g, ' ').toUpperCase(),
    music: null,
    interior: true,
    grid: g.out(),
    props,
    npcs,
    signs: [],
    phones: [],
    doors: [
      {
        x: gap,
        y: H - 1,
        w: 2,
        h: 1,
        to: r.exitTo ?? `${r.id}__exit`,
        tx: 16,
        ty: 16,
        facing: 'down',
        indicator: 'mat',
      },
    ],
    spawners: [],
    triggers: [],
  };
}
