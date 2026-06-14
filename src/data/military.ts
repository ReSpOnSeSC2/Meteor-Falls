/**
 * THE MILITARY MOTOR POOL (S19 Movement 39, ADR-080) — §A7/§A8 the army's drawn
 * hardware: tanks, F-15s, Humvees, troop transports, attack helicopters. Each is
 * a real `VEHICLE_SPECS` type wearing a DEAD-AIR HELMET / Faraday shield by
 * default (`hardened`), so the army's kit refuses the Clicker until the shield is
 * knocked off — the §A4.10 control counter, on wheels and wings.
 *
 * This is the DATA registry (the §A6 army-pursuit arc rides it in M40); the
 * control rules reuse `src/engine/control.ts`'s existing `shielded` spine. Gated
 * both directions (`military`): every entry is a real hardened spec, and every
 * hardened spec is listed here.
 */

export interface MilitaryVehicle {
  /** the VEHICLE_SPECS type it is */
  type: string;
  /** the army's designation (one §A11-flavored line, never grim) */
  designation: string;
  /** a §A11 note — the army is bumbling-earnest, never the Hush */
  note: string;
}

const M = (m: MilitaryVehicle): MilitaryVehicle => m;

export const MILITARY_VEHICLES: Record<string, MilitaryVehicle> = Object.fromEntries(
  [
    M({ type: 'tank', designation: 'M-otterbrook Main Battle Tank',
      note: 'Helmeted up to the antenna. The Clicker just gives it a polite headache. Drive AROUND it.' }),
    M({ type: 'f15', designation: 'F-15 "Eagle Scout"',
      note: 'Does the flyover, rattles every window in town, banks, and does it again. Loves the flyover.' }),
    M({ type: 'humvee', designation: 'Humvee (the checkpoint kind)',
      note: 'Parks across the road with the blinkers on. The corporal inside is reading the manual upside down.' }),
    M({ type: 'troop_transport', designation: 'Troop Transport',
      note: 'A canvas full of recruits who would honestly rather be home too. Waves if you wave.' }),
    M({ type: 'attack_heli', designation: 'Attack Helicopter "Buzz"',
      note: 'Shadows you one screen back, never closer. The General insists this is "menacing." It is mostly loud.' }),
  ].map((m) => [m.type, m]),
);

/** the military vehicle types (the both-directions set the validator pins) */
export const MILITARY_TYPES: readonly string[] = Object.keys(MILITARY_VEHICLES);
