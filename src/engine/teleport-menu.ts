/**
 * Field-menu handoff for Teleport Alpha/Beta.
 *
 * MenuScene owns choosing a legitimately visited town. OverworldScene owns the
 * run-up, collision, soot, followers, vehicles, and the one terminal PP charge.
 * Keeping the registry payload here makes that ownership boundary typed and
 * prevents either scene from silently inventing a second accounting path.
 */
import type { HeroId } from '../schemas';
import { CH8_WORLD } from '../data/maps_ch8';
import type { SaveFacing } from './state';
import {
  isTeleportDestinationEligible,
  teleportAbilityBlock,
  teleportPpCost,
  teleportRunUpDistance,
  type FlagReader,
  type TeleportAbility,
  type TeleportAbilityBlock,
  type TeleportDestination,
} from './teleport';

export const TELEPORT_REQUEST_REGISTRY_KEY = 'teleportRequest' as const;

const feet = (x: number, y: number): { x: number; y: number } => ({
  x: x * 16 + 8,
  y: y * 16 + 12,
});

/**
 * Stable native-pixel feet anchors for the story's open return towns.
 *
 * `visitedFlag` is intentionally evidence that the party actually entered the
 * town, not merely that its chapter number is old enough. `storyOpenFlag`
 * separately prevents a developer/legacy save from offering a destination
 * before its arrival beat has opened it. OverworldScene scales the selected
 * native arrival through `s()` only after a successful run-up.
 */
export const TELEPORT_TOWN_DESTINATIONS: readonly Readonly<TeleportDestination>[] = [
  {
    id: 'otterbrook', label: 'Otterbrooke',
    arrival: { map: 'otterbrook', ...feet(56, 94), facing: 'down' },
    visitedFlag: 'tick_defeated', storyOpenFlag: 'ch1_complete',
  },
  {
    id: 'brickton', label: 'Twoton',
    arrival: { map: 'brickton', x: 776, y: 296, facing: 'down' },
    visitedFlag: 'brickton_arrival_done', storyOpenFlag: 'ch1_complete',
  },
  {
    id: 'puerto_sol', label: 'Puerto Sol',
    arrival: { map: 'puerto_sol', x: 416, y: 996, facing: 'up' },
    visitedFlag: 'puerto_arrived', storyOpenFlag: 'puerto_arrived',
  },
  {
    id: 'valle_dorado', label: 'Valle Dorado',
    arrival: { map: 'valle_dorado', ...feet(5, 44), facing: 'right' },
    visitedFlag: 'valle_arrived', storyOpenFlag: 'valle_arrived',
  },
  {
    id: 'foggybottom', label: 'Foggybottom-on-Tyne',
    arrival: { map: 'foggybottom', ...feet(20, 44), facing: 'down' },
    visitedFlag: 'ch3_arrived', storyOpenFlag: 'ch3_arrived',
  },
  {
    id: 'kvisthavn', label: 'Kvisthavn',
    arrival: { map: 'kvisthavn', ...feet(18, 38), facing: 'up' },
    visitedFlag: 'ch4_arrived', storyOpenFlag: 'ch4_arrived',
  },
  {
    id: 'lilleby', label: 'Lilleby',
    arrival: { map: 'lilleby', ...feet(2, 29), facing: 'right' },
    visitedFlag: 'ch4_lilleby_seen', storyOpenFlag: 'ch4_arrived',
  },
  {
    id: 'minimus_major', label: 'Minimus Major',
    arrival: { map: 'minimus_major', ...feet(12, 49), facing: 'up' },
    visitedFlag: 'ch5_arrived', storyOpenFlag: 'ch5_arrived',
  },
  {
    id: 'zanzibel', label: 'Zanzibel',
    arrival: { map: 'zanzibel', ...feet(12, 52), facing: 'up' },
    visitedFlag: 'ch6_arrived', storyOpenFlag: 'ch6_arrived',
  },
  {
    id: 'chandrapore', label: 'Chandrapore',
    arrival: { map: 'chandrapore', ...feet(16, 75), facing: 'up' },
    visitedFlag: 'ch7_arrived', storyOpenFlag: 'ch7_arrived',
  },
  {
    id: 'lotus_harbor', label: 'Lotus Harbor',
    arrival: {
      map: 'lotus_harbor',
      ...feet(CH8_WORLD.lotusHarbor.arrival.city.x, CH8_WORLD.lotusHarbor.arrival.city.y),
      facing: CH8_WORLD.lotusHarbor.arrival.city.facing,
    },
    visitedFlag: 'ch8_arrived', storyOpenFlag: 'ch8_arrived',
  },
] as const;

export interface TeleportMenuOrigin {
  map: string;
  /** Runtime-scaled save coordinates, used to reject a stale handoff. */
  x: number;
  y: number;
  facing: SaveFacing;
}

/**
 * One-shot registry payload. Consumers remove it before beginning the run-up.
 * The destination is native-space; the origin is save/runtime-space.
 */
export interface TeleportMenuRequest {
  version: 1;
  ability: TeleportAbility;
  casterId: 'rex';
  destination: TeleportDestination;
  origin: TeleportMenuOrigin;
  runUpNativePx: number;
  ppCost: number;
  /** Always false at the menu seam. Only the terminal domain result may flip it. */
  ppAlreadyCharged: false;
}

export type TeleportMenuBlockReason = TeleportAbilityBlock
  | 'wrong-caster'
  | 'destination-locked'
  | 'not-enough-pp';

export type TeleportMenuSelection =
  | { ok: false; reason: TeleportMenuBlockReason }
  | { ok: true; request: TeleportMenuRequest };

export interface TeleportMenuSelectionInput {
  ability: TeleportAbility;
  casterId: HeroId;
  learnedAbilities: readonly string[];
  flagOf: FlagReader;
  pp: number;
  destination: Readonly<TeleportDestination>;
  origin: Readonly<TeleportMenuOrigin>;
}

/** Validate the menu selection without spending PP or mutating caller data. */
export function makeTeleportMenuRequest(
  input: Readonly<TeleportMenuSelectionInput>,
): TeleportMenuSelection {
  if (input.casterId !== 'rex') return { ok: false, reason: 'wrong-caster' };
  const abilityReason = teleportAbilityBlock(input.ability, input.learnedAbilities, input.flagOf);
  if (abilityReason) return { ok: false, reason: abilityReason };
  if (!isTeleportDestinationEligible(input.destination, input.flagOf)) {
    return { ok: false, reason: 'destination-locked' };
  }
  const ppCost = teleportPpCost(input.ability);
  if (!Number.isFinite(input.pp) || input.pp < ppCost) {
    return { ok: false, reason: 'not-enough-pp' };
  }
  return {
    ok: true,
    request: {
      version: 1,
      ability: input.ability,
      casterId: input.casterId,
      destination: { ...input.destination, arrival: { ...input.destination.arrival } },
      origin: { ...input.origin },
      runUpNativePx: teleportRunUpDistance(input.ability),
      ppCost,
      ppAlreadyCharged: false,
    },
  };
}

export function isTeleportAbilityId(id: string): id is TeleportAbility {
  return id === 'teleport_a' || id === 'teleport_b';
}
