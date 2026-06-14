/**
 * GAS STATIONS & CHARGING (S20 Movement 45, ADR-086) — §A4.17 where you PAY to
 * fill the tank. Every inhabited region has at least one: a gas pump, an EV
 * charging stall, or both — plus airfield jet fuel and marina diesel for the
 * fleet. Prices ride a per-region COST-OF-LIVING multiplier (Mars is dear, and
 * Mars sells electric only — there's no gas on Mars). THE NIKOLAI and the EV line
 * charge here cheap, and cheaper still at home (§A4.16 / the home CHARGER).
 *
 * This is the DATA registry; the fill MATH lives in `src/engine/refuel.ts` (pure,
 * tested). Each station has a real §A11 attendant with one obsession. The station
 * `area` is a real AREA_SKINS area (the validator pins it both ways).
 */
import type { FuelKind } from '../engine/fuel';

export type StationKind = 'gas' | 'charging' | 'both' | 'airfield' | 'marina';

export interface StationDef {
  id: string;
  /** the AREA_SKINS area it sits in (M25) */
  area: string;
  kind: StationKind;
  /** which fuels it sells (a subset of gas/diesel/jet/electric) */
  fuels: FuelKind[];
  /** region cost-of-living multiplier on the base price-per-unit */
  priceMult: number;
  /** the §A11 attendant (one obsession) */
  attendant: string;
  note: string;
}

const S = (s: StationDef): StationDef => s;

export const STATIONS: Record<string, StationDef> = Object.fromEntries(
  [
    // ── USA (live) ─────────────────────────────────────────────────────────
    S({ id: 'otterbrook_gasngo', area: 'otterbrook', kind: 'both', fuels: ['gas', 'electric'], priceMult: 1.0,
      attendant: 'Stan', note: 'Stan at the Gas-N-Go. Obsessed with the lottery. "Feeling lucky? The pump is. It rolled a jackpot of $14.20."' }),
    S({ id: 'brickton_fillup', area: 'brickton', kind: 'both', fuels: ['gas', 'diesel', 'electric'], priceMult: 1.05,
      attendant: 'Donna', note: '"Full serve, because I do not trust you with the squeegee. Wipers? You need wipers. Everyone needs wipers."' }),
    // ── South America ──────────────────────────────────────────────────────
    S({ id: 'puerto_sol_bomba', area: 'puerto_sol', kind: 'gas', fuels: ['gas', 'diesel'], priceMult: 1.1,
      attendant: 'Tomás', note: 'The roadside bomba. Tomás names every nozzle. "This one is Esperanza. She is gentle. Use Esperanza."' }),
    // ── England ────────────────────────────────────────────────────────────
    S({ id: 'foggybottom_petrol', area: 'foggybottom', kind: 'both', fuels: ['gas', 'electric'], priceMult: 1.2,
      attendant: 'Nigel', note: '"PETROL, not gas. Gas is what you cook with. Mind the queue, there is always a queue, this IS the queue."' }),
    // ── Norway ─────────────────────────────────────────────────────────────
    S({ id: 'kvisthavn_fyll', area: 'kvisthavn', kind: 'both', fuels: ['gas', 'diesel', 'electric'], priceMult: 1.3,
      attendant: 'Sigrid', note: 'Half the pumps are charging — Norway charges everything. "Petrol is for tourists and lawnmowers."' }),
    S({ id: 'lilleby_giant_pump', area: 'lilleby', kind: 'gas', fuels: ['gas', 'diesel'], priceMult: 1.3,
      attendant: 'the Booster Club', note: 'A pump the size of a silo. "EVERYTHING HERE IS NORMAL-SIZED. The nozzle just LOOKS like a fire hose."' }),
    // ── Minimus (a tiny station — careful where you step) ───────────────────
    S({ id: 'minimus_thimble', area: 'minimus', kind: 'charging', fuels: ['electric'], priceMult: 1.2,
      attendant: 'a Whistle Guard', note: 'A charging post the size of a thimble. "Park the colossus OVER there. The OTHER over there. Yes. Thank you."' }),
    // ── Africa ─────────────────────────────────────────────────────────────
    S({ id: 'zanzibel_pump', area: 'zanzibel', kind: 'gas', fuels: ['gas', 'diesel'], priceMult: 1.1,
      attendant: 'the market DJ', note: 'Best music on the row, pumps optional. "Fill up, stay for the set. The set never ends. Neither does the line."' }),
    // ── India ──────────────────────────────────────────────────────────────
    S({ id: 'chandrapore_filling', area: 'chandrapore', kind: 'both', fuels: ['gas', 'diesel', 'electric'], priceMult: 1.0,
      attendant: 'Ravi', note: '"Chai while you wait? You will wait. The whole city waits. We have made waiting beautiful." (It is.)' }),
    // ── China (riverboat country — marina diesel too) ──────────────────────
    S({ id: 'lotus_harbor_dock', area: 'lotus_harbor', kind: 'marina', fuels: ['gas', 'diesel', 'electric'], priceMult: 1.1,
      attendant: 'the harbormaster', note: 'Pumps for cars and a hose for boats. "Land or water, I sell you the same diesel. I just point the hose differently."' }),
    // ── Romania ────────────────────────────────────────────────────────────
    S({ id: 'valea_pump', area: 'valea', kind: 'gas', fuels: ['gas', 'diesel'], priceMult: 1.0,
      attendant: 'Buni', note: 'Buni runs the pump between feeding people. "Fill the tank, fill your plate. Both, puiul meu. I insist on both."' }),
    // ── Alaska (cold steel — jet fuel for the launch ferry) ────────────────
    S({ id: 'aurora_depot', area: 'aurora', kind: 'airfield', fuels: ['gas', 'diesel', 'jet', 'electric'], priceMult: 1.4,
      attendant: 'the station chief', note: 'A frozen fuel depot — jet fuel for the snow-cat planes. "Keep it running or it freezes solid. Including you."' }),
    // ── Hawaii (the launch pad's airfield) ─────────────────────────────────
    S({ id: 'mauna_lani_field', area: 'mauna_lani', kind: 'airfield', fuels: ['gas', 'jet', 'electric'], priceMult: 1.3,
      attendant: 'Professor Pemberton', note: '"Jet fuel, rocket fuel — different shelves, I PROMISE. Mostly. Do not light a match. Milo, put the match down."' }),
    // ── Mars (electric only — no gas a billion miles from a refinery) ──────
    S({ id: 'mars_solar', area: 'mars', kind: 'charging', fuels: ['electric'], priceMult: 2.5,
      attendant: 'the colony AI', note: 'A solar charging spire in the Sea of Silence. "WELCOME. THERE IS NO GASOLINE ON MARS. THERE IS, HOWEVER, SO MUCH SUN."' }),
  ].map((s) => [s.id, s]),
);

export const STATION_KINDS: readonly StationKind[] = ['gas', 'charging', 'both', 'airfield', 'marina'];
