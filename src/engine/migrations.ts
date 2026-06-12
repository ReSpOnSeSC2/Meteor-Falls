/**
 * Save migration registry (S3, per GAME_BIBLE Prompt 22's "versioned schema
 * with a migration registry" — landed early because the v1→v2 bag split needs
 * it). Each step lifts a parsed save one version; deserialize walks the chain.
 * Future sessions REGISTER new steps here (S10 arcade score next) instead of
 * spread-merging ad hoc.
 *
 * v1 → v2 (S3): the shared `inventory` becomes per-hero 14-slot bags + equip
 * slots. Folds in ADR-013's tolerant backfill (pre-S12 v1 saves miss
 * heroNames/playerName/coolestThing — canon defaults fill them).
 *
 * v2 → v3 (S9): the CALLER ledger (§A6 Ch.8's fuel). Quests did not exist
 * before v3, so an empty ledger is a v2 save's TRUE history, not a guess.
 *
 * v3 → v4 (S10): the ARCADE LEGEND high-score table (§A10 #4). Old saves
 * backfill MGR's lonely row — the cabinet's attract mode was flashing it
 * long before any save could walk through the door (locked_arcade2, canon).
 *
 * v4 → v5 (S12): THE CAGE — tournament state is save data. Old saves
 * backfill a clean hoops slate (no bracket, no checkpoint, zero titles):
 * the gate in the vacant lot's fence is v5-new, so an empty record is a
 * pre-v5 save's TRUE history, exactly like the v3 ledger.
 *
 * v5 → v6 (S12b/ADR-035): AWAKENINGS — Vibe arrives at story moments now.
 * Flags backfill from the story flags those scenes set (met_glint →
 * Surge, zapper_done → Lifeup, faye_joined → Fire): an old save keeps
 * exactly what its story already earned, never what its levels implied.
 *
 * v6 → v7 (S14/ADR-039): VIBE FREEZE α moves from Mia's L12 unlock row to
 * the Gilded Grin's HOLLOW-reveal awakening (cold_reads). A v6 save whose
 * Mia already crossed L12 HAD Freeze under the old table — the backfill
 * keeps exactly what the save could already cast, the ADR-035 stance
 * applied to a moved row (losing a known ability on update is never ok).
 */
import { ITEMS, BAG_MAX } from '../data/items';
import { MGR_ROW } from '../data/arcade';
import type { GameStateData } from './state';
import type { HoopsState } from '../schemas';

export const CURRENT_SAVE_VERSION = 7;

/** the v5 hoops field's clean slate — newGameData and the v4→v5 step share
 *  it (lives here, not state.ts, so the import graph stays acyclic) */
export function freshHoops(): HoopsState {
  return { bracket: null, match: null, titles: 0, handed: [], played: 0 };
}

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

      // the shared bag becomes the leader's — Jay carried the party's stuff
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
  {
    to: 3,
    migrate(raw) {
      // S9: the first real new save field since v2 — earned §A10 caller
      // records, in completion order (engine/quests.ts appends them).
      if (!Array.isArray(raw.callers)) raw.callers = [];
      raw.version = 3;
      return raw;
    },
  },
  {
    to: 4,
    migrate(raw) {
      // S10: the ARCADE LEGEND table. A pre-v4 save never played the
      // cabinet, but MGR's attract-mode row predates everyone (§A10 #4) —
      // the lonely row IS an old save's true history.
      if (!Array.isArray(raw.arcadeScores)) raw.arcadeScores = [{ ...MGR_ROW }];
      raw.version = 4;
      return raw;
    },
  },
  {
    to: 5,
    migrate(raw) {
      // S12: THE CAGE. The vacant lot's gate didn't exist before v5 — a
      // clean slate (no bracket, no checkpoint, no titles) is a pre-v5
      // save's true history, the v3 empty-ledger stance applied to hoops.
      if (!isObj(raw.hoops)) raw.hoops = freshHoops() as unknown as Raw;
      raw.version = 5;
      return raw;
    },
  },
  {
    to: 6,
    migrate(raw) {
      // S12b (ADR-035): Vibe arrives by AWAKENING now. A pre-v6 save that
      // already lived a story moment keeps the ability it had — the flags
      // backfill from the story flags that scene set, never from levels.
      const flags = isObj(raw.flags) ? raw.flags : (raw.flags = {});
      if (flags.met_glint === true) flags.awake_surge_a = true;
      if (flags.zapper_done === true) flags.awake_lifeup_a = true;
      if (flags.faye_joined === true) flags.awake_fire_a = true;
      raw.version = 6;
      return raw;
    },
  },
  {
    to: 7,
    migrate(raw) {
      // S14 (ADR-039): Freeze α left Mia's L12 row for the Gilded Grin's
      // HOLLOW-reveal awakening. A v6 Mia at L12+ could already cast it —
      // she keeps it (the backfill mirrors what the old table granted).
      const flags = isObj(raw.flags) ? raw.flags : (raw.flags = {});
      const party = (Array.isArray(raw.party) ? raw.party : []).filter(isObj);
      const faye = party.find((h) => h.id === 'faye');
      if (faye && typeof faye.level === 'number' && faye.level >= 12) {
        flags.awake_freeze_a = true;
      }
      raw.version = 7;
      return raw;
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
