/**
 * THE LONG SHOT (S20 Movement 48, ADR-089) — §A5/§A6 Professor Pemberton's rocket,
 * the Earth↔Mars shuttle. In the story it carries the party to Mars for the finale
 * (§A6 Ch.10); once the launch works it becomes a REPEATABLE shuttle between the
 * Mauna Lani launch pad (Hawaii) and the Sea of Silence (Mars) — so a billionaire
 * can live on Mars and still come home for Mom's cooking.
 *
 * Ownership rides a `title_*` key-item (the fleet pattern); it's EARNED at the
 * launch, then yours to fly. The launch rules live in `src/engine/rocket.ts`; the
 * rocket sprite is a `VEHICLE_SPECS` type (cls 'rocket', drawn in the forge).
 */

export interface RocketDef {
  id: string;
  /** the VEHICLE_SPECS type (the drawn sprite) */
  vehicleType: string;
  /** the key-item TITLE ownership rides */
  title: string;
  /** the ultimate Fortune-Arc price (also the story-earned value) */
  price: number;
  /** the Earth launch-pad CONTINENT (Hawaii / Mauna Lani, §A6 Ch.10) */
  earthPad: string;
  /** the Mars destination CONTINENT */
  marsPad: string;
  /** who built it (Milo's estranged dad, the Dr. Andonuts analog) */
  builder: string;
  note: string;
}

export const THE_LONG_SHOT: RocketDef = {
  id: 'the_long_shot',
  vehicleType: 'rocket',
  title: 'title_the_long_shot',
  price: 500_000_000,
  earthPad: 'hawaii',
  marsPad: 'mars',
  builder: 'Professor Pemberton',
  note: '"She flew once and came back. Twice, if you count the part where we did not plan to come back. Now she runs a route."',
};
