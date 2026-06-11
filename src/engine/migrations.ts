/**
 * Save migration registry (S3, per GAME_BIBLE Prompt 22's "versioned schema
 * with a migration registry" — landed early because the v1→v2 bag split needs
 * it). Each step lifts a parsed save one version; deserialize walks the chain.
 * Future sessions REGISTER new steps here (S6 slots, S9 caller ledger, S10
 * arcade score) instead of spread-merging ad hoc.
 *
 * v1 → v2 (S3): the shared `inventory` becomes per-hero 14-slot bags + equip
 * slots. Folds in ADR-013's tolerant backfill (pre-S12 v1 saves miss
 * heroNames/playerName/coolestThing — canon defaults fill them).
 */
import { ITEMS, BAG_MAX } from '../data/items';
import type { GameStateData } from './state';

export const CURRENT_SAVE_VERSION = 2;

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null;
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];

interface MigrationStep {
  /** the version this step migrates TO */
  to: number;
  migrate: (raw: Raw, fresh: GameStateData) => Raw;
}

export const MIGRATIONS: MigrationStep[] = [
  {
    to: 2,
    migrate(raw, fresh) {
      // ADR-013's spread-merge backfill lives here now: any field a v1 save
      // never wrote gets its canon default (names, food, the finale hook).
      const freshRaw = { ...(fresh as unknown as Raw) };
      const out: Raw = { ...freshRaw, ...raw };
      out.heroNames = {
        ...(fresh.heroNames as unknown as Raw),
        ...(isObj(raw.heroNames) ? raw.heroNames : {}),
      };

      // every hero gains a bag + equip slots
      const party = (Array.isArray(out.party) ? out.party : []).filter(isObj);
      for (const h of party) {
        if (!Array.isArray(h.bag)) h.bag = [];
        if (!isObj(h.equip)) h.equip = {};
      }
      if (party.length === 0) party.push(...((freshRaw.party as Raw[]) ?? []));
      out.party = party;

      // the shared bag becomes the leader's — Rex carried the party's stuff
      const lead = party.find((h) => h.id === 'rex') ?? party[0];
      const inv = strings(out.inventory);
      if (lead) {
        const bag = strings(lead.bag);
        lead.bag = [...bag, ...inv].slice(0, BAG_MAX);
        // old battles applied the first weapon in the shared bag to everyone;
        // equipping it on the leader preserves his damage exactly
        const equip = lead.equip as Raw;
        if (equip.weapon === undefined) {
          const w = (lead.bag as string[]).find((i) => {
            const d = ITEMS[i];
            return d?.kind === 'weapon' && (!d.wielder || d.wielder === lead.id);
          });
          if (w !== undefined) equip.weapon = w;
        }
      }
      delete out.inventory;

      // S2 canon: Mia took her Hand-Me-Down Pan back off the intake shelf.
      // Saves made after her join scene predate the grant — give it here.
      const flags = isObj(out.flags) ? out.flags : {};
      const faye = party.find((h) => h.id === 'faye');
      if (flags.faye_joined === true && faye) {
        const bag = strings(faye.bag);
        if (!bag.includes('hand_me_down_pan') && bag.length < BAG_MAX) {
          bag.push('hand_me_down_pan');
        }
        faye.bag = bag;
        const equip = faye.equip as Raw;
        if (equip.weapon === undefined && bag.includes('hand_me_down_pan')) {
          equip.weapon = 'hand_me_down_pan';
        }
      }

      out.version = 2;
      return out;
    },
  },
];

/**
 * Lift a parsed save to the current version. Throws on shapes we can't
 * vouch for (non-objects, unknown/future versions) — callers fall back.
 */
export function migrateSave(parsed: unknown, fresh: GameStateData): GameStateData {
  if (!isObj(parsed)) throw new Error('save is not an object');
  const v = typeof parsed.version === 'number' ? parsed.version : NaN;
  if (!Number.isInteger(v) || v < 1 || v > CURRENT_SAVE_VERSION) {
    throw new Error(`unknown save version ${String(parsed.version)}`);
  }
  let raw: Raw = { ...parsed };
  for (const step of MIGRATIONS) {
    if (v < step.to) raw = step.migrate(raw, fresh);
  }
  return raw as unknown as GameStateData;
}
