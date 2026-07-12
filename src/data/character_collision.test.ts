import { describe, expect, it } from 'vitest';
import { aabbOverlap } from '../engine/movecollide';
import { NPC_FOOTPRINT, PLAYER_FOOTPRINT, characterFeet, footRect } from '../engine/actor-collision';
import { MAPS } from './maps';

describe('shipped character collision placements', () => {
  it('keeps corrected wandering characters clear of their former wall/prop cells', () => {
    expect(MAPS.brickton.npcs.find((n) => n.id === 'plaza_mime')).toMatchObject({ x: 42, y: 60 });
    expect(MAPS.puerto_sol.npcs.find((n) => n.id === 'ps_nina')).toMatchObject({ x: 50, y: 37 });
    expect(MAPS.valle_dorado.npcs.find((n) => n.id === 'downtown_suit')).toMatchObject({ x: 82, y: 51 });
    expect(MAPS.valle_dorado.npcs.find((n) => n.id === 'llama_pen_4')).toMatchObject({ x: 22, y: 78 });
    expect(MAPS.valle_dorado.npcs.find((n) => n.id === 'llama_pen_6')).toMatchObject({ x: 28, y: 78 });
  });

  it('routes the outer dorm patrol through the authored laundry-wall opening', () => {
    expect(MAPS.wintermoor_dorm.patrols?.find((p) => p.id === 'dorm_a')?.route).toEqual([
      [5, 12], [58, 12], [58, 32], [5, 32],
    ]);
  });

  it('returns from the pharmacy beside, not inside, the deli keeper', () => {
    const back = MAPS.drugstore_pharmacy.doors.find((d) => d.to === 'drugstore_int');
    const deli = MAPS.drugstore_int.npcs.find((n) => n.id === 'deli_otter');
    expect(back).toBeDefined();
    expect(deli).toBeDefined();

    const player = footRect({ x: back!.tx, y: back!.ty }, PLAYER_FOOTPRINT);
    const deliFeet = characterFeet(deli!.x, deli!.y);
    const deliBody = footRect(deliFeet, NPC_FOOTPRINT);
    expect(back?.tx).toBe(9 * 16 + 8);
    expect(aabbOverlap(player, deliBody)).toBe(false);
  });
});
