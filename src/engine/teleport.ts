/** Pure field-domain rules for Teleport Alpha/Beta. Scene code supplies input
 * distance and collision facts; this module owns eligibility, thresholds,
 * single PP charging, and safe-arrival results. */
import type { SaveFacing } from './state';

export type TeleportAbility = 'teleport_a' | 'teleport_b';

export const TELEPORT_RUN_UP_NATIVE_PX: Readonly<Record<TeleportAbility, number>> = {
  teleport_a: 96,
  teleport_b: 32,
};

export const TELEPORT_PP_COST: Readonly<Record<TeleportAbility, number>> = {
  teleport_a: 2,
  teleport_b: 4,
};

export interface TeleportArrival {
  map: string;
  x: number;
  y: number;
  facing: SaveFacing;
}

/** Destination specs point only at authored safe-arrival anchors. A town must
 * have been visited and, when supplied, its story-open flag must still be true. */
export interface TeleportDestination {
  id: string;
  label: string;
  arrival: TeleportArrival;
  visitedFlag: string;
  storyOpenFlag?: string;
  storyClosedFlag?: string;
}

export type FlagReader = (flag: string) => boolean;

const CARDINAL_OR_DIAGONAL = new Set<SaveFacing>([
  'down', 'left', 'right', 'up', 'downright', 'downleft', 'upright', 'upleft',
]);

export function isSafeTeleportArrival(arrival: Readonly<TeleportArrival>): boolean {
  return arrival.map.length > 0
    && Number.isFinite(arrival.x)
    && arrival.x >= 0
    && Number.isFinite(arrival.y)
    && arrival.y >= 0
    && CARDINAL_OR_DIAGONAL.has(arrival.facing);
}

export function isTeleportDestinationEligible(
  destination: Readonly<TeleportDestination>,
  flagOf: FlagReader,
): boolean {
  return flagOf(destination.visitedFlag)
    && (!destination.storyOpenFlag || flagOf(destination.storyOpenFlag))
    && (!destination.storyClosedFlag || !flagOf(destination.storyClosedFlag))
    && isSafeTeleportArrival(destination.arrival);
}

export function eligibleTeleportDestinations(
  destinations: readonly Readonly<TeleportDestination>[],
  flagOf: FlagReader,
): TeleportDestination[] {
  const seen = new Set<string>();
  const eligible: TeleportDestination[] = [];
  for (const destination of destinations) {
    if (seen.has(destination.id) || !isTeleportDestinationEligible(destination, flagOf)) continue;
    seen.add(destination.id);
    eligible.push({ ...destination, arrival: { ...destination.arrival } });
  }
  return eligible;
}

export function teleportRunUpDistance(ability: TeleportAbility): number {
  return TELEPORT_RUN_UP_NATIVE_PX[ability];
}

export function teleportPpCost(ability: TeleportAbility): number {
  return TELEPORT_PP_COST[ability];
}

export type TeleportAbilityBlock = 'ability-unlearned' | 'beta-story-locked';

export function teleportAbilityBlock(
  ability: TeleportAbility,
  learnedAbilities: readonly string[],
  flagOf: FlagReader,
): TeleportAbilityBlock | null {
  if (!learnedAbilities.includes(ability)) return 'ability-unlearned';
  if (ability === 'teleport_b' && !flagOf('awake_teleport_b')) return 'beta-story-locked';
  return null;
}

export function canUseTeleportAbility(
  ability: TeleportAbility,
  learnedAbilities: readonly string[],
  flagOf: FlagReader,
): boolean {
  return teleportAbilityBlock(ability, learnedAbilities, flagOf) === null;
}

export interface TeleportFieldContext {
  inBattle: boolean;
  inCutscene: boolean;
  modalOpen: boolean;
  incompatibleVehicle: boolean;
  locketStolen: boolean;
}

export type TeleportBlockReason = TeleportAbilityBlock
  | 'battle'
  | 'cutscene'
  | 'modal'
  | 'incompatible-vehicle'
  | 'locket-stolen'
  | 'destination-locked'
  | 'not-enough-pp';

export interface TeleportAttemptInput {
  ability: TeleportAbility;
  learnedAbilities: readonly string[];
  flagOf: FlagReader;
  pp: number;
  destination: Readonly<TeleportDestination>;
  distanceNativePx: number;
  wallCollision: boolean;
  context: Readonly<TeleportFieldContext>;
  /** A terminal result sets this true. Passing that result back through a
   * terminal scene callback cannot charge a second time. */
  ppAlreadyCharged?: boolean;
}

interface TeleportAccounting {
  ppSpent: number;
  ppAfter: number;
  ppCharged: boolean;
}

export type TeleportAttemptResult =
  | ({ status: 'blocked'; reason: TeleportBlockReason } & TeleportAccounting)
  | ({ status: 'running'; remainingNativePx: number } & TeleportAccounting)
  | ({
      status: 'failed';
      reason: 'wall';
      soot: true;
      traveled: false;
      arrival: null;
    } & TeleportAccounting)
  | ({
      status: 'success';
      traveled: true;
      arrival: TeleportArrival;
      followers: 'reform';
      vehicles: 'unchanged';
    } & TeleportAccounting);

const uncharged = (pp: number): TeleportAccounting => ({
  ppSpent: 0, ppAfter: pp, ppCharged: false,
});

function terminalAccounting(
  ability: TeleportAbility,
  pp: number,
  alreadyCharged: boolean,
): TeleportAccounting {
  const spent = alreadyCharged ? 0 : teleportPpCost(ability);
  return { ppSpent: spent, ppAfter: Math.max(0, pp - spent), ppCharged: true };
}

function contextBlock(context: Readonly<TeleportFieldContext>): TeleportBlockReason | null {
  if (context.inBattle) return 'battle';
  if (context.inCutscene) return 'cutscene';
  if (context.modalOpen) return 'modal';
  if (context.incompatibleVehicle) return 'incompatible-vehicle';
  if (context.locketStolen) return 'locket-stolen';
  return null;
}

export function resolveTeleportAttempt(input: Readonly<TeleportAttemptInput>): TeleportAttemptResult {
  const abilityReason = teleportAbilityBlock(input.ability, input.learnedAbilities, input.flagOf);
  if (abilityReason) return { status: 'blocked', reason: abilityReason, ...uncharged(input.pp) };
  const fieldReason = contextBlock(input.context);
  if (fieldReason) return { status: 'blocked', reason: fieldReason, ...uncharged(input.pp) };
  if (!isTeleportDestinationEligible(input.destination, input.flagOf)) {
    return { status: 'blocked', reason: 'destination-locked', ...uncharged(input.pp) };
  }
  const alreadyCharged = input.ppAlreadyCharged === true;
  if (!alreadyCharged && (!Number.isFinite(input.pp) || input.pp < teleportPpCost(input.ability))) {
    return { status: 'blocked', reason: 'not-enough-pp', ...uncharged(input.pp) };
  }

  const threshold = teleportRunUpDistance(input.ability);
  const distance = Number.isFinite(input.distanceNativePx)
    ? Math.max(0, input.distanceNativePx)
    : 0;
  if (input.wallCollision && distance < threshold) {
    return {
      status: 'failed', reason: 'wall', soot: true, traveled: false, arrival: null,
      ...terminalAccounting(input.ability, input.pp, alreadyCharged),
    };
  }
  if (distance < threshold) {
    return {
      status: 'running', remainingNativePx: threshold - distance,
      ...uncharged(input.pp),
    };
  }
  return {
    status: 'success',
    traveled: true,
    arrival: { ...input.destination.arrival },
    followers: 'reform',
    vehicles: 'unchanged',
    ...terminalAccounting(input.ability, input.pp, alreadyCharged),
  };
}
