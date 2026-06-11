/**
 * S6 — the save-slot family (GAME_BIBLE §A4.3 / Prompt 22, adapted).
 * Three slots + ONE rolling auto-backup, written before every overwrite.
 * Storage sits behind SaveStorage so §B1's IndexedDB lands later as a
 * driver change, not a rewrite (ADR-018 — localStorage is the interim
 * driver the same way ADR-004's grids stand in for Tiled).
 *
 * Everything a slot DISPLAYS is derived from its blob right here — name,
 * level, location, playtime, embers are never stored twice. Anything that
 * must genuinely ride the save registers a step in engine/migrations.ts
 * (ADR-015), never an ad-hoc merge.
 */
import { MAPS } from '../data/maps';
import { migrateSave } from './migrations';
import type { GameStateData } from './state';

export type SlotId = 1 | 2 | 3;
export const SLOT_IDS: readonly SlotId[] = [1, 2, 3];

/** slot 1 keeps the pre-S6 single-save key, so every existing playthrough
 *  simply becomes Notebook 1 — no storage-key migration needed */
export function slotKey(slot: SlotId): string {
  return `meteor-falls-slot-${slot}`;
}
export const BACKUP_KEY = 'meteor-falls-backup';

/** the future IndexedDB driver implements THIS — keep it three calls */
export interface SaveStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const localStorageDriver: SaveStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null; // storage unavailable (private mode) — play on
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* play on */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* play on */
    }
  },
};

/** the rolling backup remembers WHICH slot it shadows — recovery must never
 *  resurrect one playthrough into another playthrough's notebook */
interface BackupEnvelope {
  slot: SlotId;
  json: string;
}

export interface SlotSummary {
  slot: SlotId;
  /** the party leader's (typed) name — no tokens, render as-is */
  name: string;
  level: number;
  /** the map's display name, {tokens} intact — render
   *  vars(location, data).toUpperCase(), the ADR-013 banner pattern */
  location: string;
  playtimeSec: number;
  embers: number;
  /** the migrated blob the summary came from (vars() context, respawn target) */
  data: GameStateData;
}

export type SlotPeek = SlotSummary | 'empty' | 'corrupt';

export type OpenResult =
  | { kind: 'ok'; data: GameStateData }
  | { kind: 'recovered'; data: GameStateData } // slot corrupt — the backup held
  | { kind: 'lost' } // slot corrupt and the backup couldn't vouch for it
  | { kind: 'empty' };

export class SaveBank {
  constructor(private readonly store: SaveStorage) {}

  raw(slot: SlotId): string | null {
    return this.store.get(slotKey(slot));
  }

  has(slot: SlotId): boolean {
    return this.raw(slot) !== null;
  }

  any(): boolean {
    return SLOT_IDS.some((s) => this.has(s));
  }

  /** write a save; whatever the slot held rolls into the auto-backup first
   *  (a first write to an empty slot overwrites nothing — backup untouched) */
  write(slot: SlotId, json: string): void {
    const prev = this.raw(slot);
    if (prev !== null) {
      const env: BackupEnvelope = { slot, json: prev };
      this.store.set(BACKUP_KEY, JSON.stringify(env));
    }
    this.store.set(slotKey(slot), json);
  }

  private backup(): BackupEnvelope | null {
    const raw = this.store.get(BACKUP_KEY);
    if (raw === null) return null;
    try {
      const env: unknown = JSON.parse(raw);
      if (typeof env !== 'object' || env === null) return null;
      const { slot, json } = env as Record<string, unknown>;
      if (
        typeof slot === 'number' &&
        (SLOT_IDS as readonly number[]).includes(slot) &&
        typeof json === 'string'
      ) {
        return { slot: slot as SlotId, json };
      }
    } catch {
      /* an unreadable backup is no backup */
    }
    return null;
  }

  /**
   * Parse + migrate a slot for play. Bad JSON and migrateSave's loud
   * unknown-version throw (ADR-015) BOTH fall back to the rolling backup —
   * but only one shadowing this same slot. A successful recovery heals the
   * slot in place; the backup itself stays.
   */
  open(slot: SlotId, fresh: GameStateData): OpenResult {
    const raw = this.raw(slot);
    if (raw === null) return { kind: 'empty' };
    try {
      return { kind: 'ok', data: migrateSave(JSON.parse(raw), fresh) };
    } catch {
      const env = this.backup();
      if (env !== null && env.slot === slot) {
        try {
          const data = migrateSave(JSON.parse(env.json), fresh);
          this.store.set(slotKey(slot), env.json);
          return { kind: 'recovered', data };
        } catch {
          /* the carbon copy drowned too */
        }
      }
      return { kind: 'lost' };
    }
  }

  /**
   * Derive a slot-list row from the blob — strictly read-only (no healing
   * here: recovery is open()'s job, so Dad's apology plays when it happens).
   */
  peek(slot: SlotId, fresh: GameStateData): SlotPeek {
    const raw = this.raw(slot);
    if (raw === null) return 'empty';
    try {
      const data = migrateSave(JSON.parse(raw), fresh);
      const lead = data.party[0];
      return {
        slot,
        name: lead?.name ?? data.heroNames.rex,
        level: lead?.level ?? 1,
        location: MAPS[data.map]?.name ?? data.map,
        playtimeSec: data.playtimeSec,
        embers: data.embers,
        data,
      };
    } catch {
      return 'corrupt';
    }
  }
}

/** playtime renders H:MM (EB file-select style), derived on the spot */
export function fmtPlaytime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}
