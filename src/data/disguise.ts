/**
 * THE DISGUISE / COSTUME SYSTEM (S18 Movement 31, ADR-071) — §A6 sneaks. Don a
 * disguise to blend with a faction (the Smilers, palace guards, Hoaxula's park
 * cast); NPCs of that faction read you as one of them. Getting "made" is a FIGHT,
 * never a fail (the EarthBound spirit). The rules live in `src/engine/disguise.ts`;
 * the sprite-variant swap + the `ifFlag` gating land in each sneak's scene.
 */

export interface DisguiseDef {
  id: string;
  name: string;
  /** the faction this costume blends you into */
  blendTag: string;
  /** the chapter band the sneak belongs to */
  band: string;
  /** how convincing it is (0–1); higher = harder to be "made" */
  quality: number;
  /** a §A11 one-liner */
  note: string;
}

const D = (d: DisguiseDef): DisguiseDef => d;

export const DISGUISES: Record<string, DisguiseDef> = Object.fromEntries(
  [
    D({
      id: 'blue_blazer', name: 'Blue Blazer', blendTag: 'smiler', band: 'ch1', quality: 0.7,
      note: 'Department of Smiles regulation blazer. Smile bigger than you mean it and nobody looks twice.',
    }),
    D({
      id: 'palace_silks', name: 'Palace Silks', blendTag: 'palace_guard', band: 'ch7', quality: 0.65,
      note: 'Cobra Palace livery, two sizes too big. Walk like you own a tiger and the guards salute.',
    }),
    D({
      id: 'park_costume', name: 'Park Mascot Suit', blendTag: 'hoaxula_cast', band: 'ch9', quality: 0.75,
      note: 'A bankrupt theme-park bat costume. Smells of fog machine. Hoaxula\'s cast wave you right through.',
    }),
  ].map((d) => [d.id, d]),
);

/** the canon factions a disguise can blend into (validator-pinned) */
export const DISGUISE_FACTIONS: readonly string[] = ['smiler', 'palace_guard', 'hoaxula_cast'];
