import type { EnemyDef } from '../schemas';

export const ENEMY_OVERWORLD_FRAME = {
  w: 24 * 4,
  h: 32 * 4,
  frames: 8,
} as const;

export const ENEMY_OVERWORLD_SHEET_IDS = [
  'banana_bunch',
  'blazer_smiler',
  'boiler_golem',
  'borden',
  'brolly_bat',
  'coily_cicada',
  'cranky_mailbox',
  'cricket_eleven',
  'cursed_souvenir',
  'detention_desk',
  'fog_hound',
  'foggy_locker',
  'gilded_beetle',
  'greenhouse_creeper',
  'head_prefect',
  'hill_slug_deluxe',
  'jungle_jitterbug',
  'moor_sheep',
  'overdue_tome',
  'pickpocket_parrot',
  'pigeon_gang',
  'pillar_box',
  'possessed_textbook',
  'prefect_drone',
  'roman_sentry',
  'runaway_lawnmower',
  'schedule_bell',
  'soot_imp',
  'step_mask',
  'tea_poltergeist',
  'tea_trolley',
  'telephone_box',
  'the_invigilator',
  // overworld-art pass: authored 8-dir sheets replacing borrowed procedural minis
  'recycling_raccoon',
  'sprinkler_sentry',
  'unionized_gnome',
  'mandatory_memo',
  'motivational_poster',
  // final roamers: authored 8-dir sheets replacing the last pixelated procedural minis
  'quota_clock',
  'showroom_mannequin',
  'good_investment',
  'rogue_icecream_truck',
  'tick_nymph',
  'the_suit',
  'expired_meter',
] as const;

export type EnemyOverworldSheetId = (typeof ENEMY_OVERWORLD_SHEET_IDS)[number];

export const ENEMY_OVERWORLD_SHEET_ID_SET: ReadonlySet<string> = new Set(ENEMY_OVERWORLD_SHEET_IDS);

export function enemyOverworldKey(id: string): string {
  return `ow_enemy_${id}`;
}

export function enemyWearKeys(sprite: string): [string, string, string] {
  return [sprite, `${sprite}_w1`, `${sprite}_w2`];
}

export type EnemyFieldVisual =
  | { kind: 'walker'; key: string; sheet?: string }
  | { kind: 'overworld'; key: string; sheet: string }
  | { kind: 'mini'; key: string };

export interface EnemyVisualIdentity {
  id: string;
  battle: string;
  wear: [string, string, string];
  field: EnemyFieldVisual;
}

export function enemyVisualIdentity(enemy: Pick<EnemyDef, 'id' | 'sprite' | 'mini' | 'overworld' | 'walker'>): EnemyVisualIdentity {
  const field: EnemyFieldVisual = enemy.overworld
    ? { kind: 'overworld', key: enemy.overworld, sheet: `${enemy.id}_8dir.png` }
    : enemy.walker
      ? { kind: 'walker', key: enemy.walker }
      : { kind: 'mini', key: enemy.mini };
  return {
    id: enemy.id,
    battle: enemy.sprite,
    wear: enemyWearKeys(enemy.sprite),
    field,
  };
}
