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
 *
 * v7 → v8 (S15h/ADR-048): the cast expands from four heroes to FIVE — Pippa
 * Quill (§A3, joins Ch.5). Old saves' heroNames know only the four; the step
 * backfills Pippa's name from the canon default. Pippa is NOT added to the
 * party (she hasn't joined — Ch.5 does that), so the existing four ride
 * through untouched, exactly like every save field a later hero never wrote.
 *
 * v8 → v9 (S17/ADR-061): THE CATALOG SPINE — heroes gain a `boosts` map for
 * permanent TONIC effects (§A4.12). No tonic existed before v9, so an empty
 * map is a pre-v9 save's TRUE history (the v3 empty-ledger / v5 clean-hoops
 * stance applied to boosts); every existing hero backfills `{}`.
 *
 * v12 → v13 (S19/ADR-079): THE HOME GARAGE — owned-car TITLES parked per home
 * (`garage`) + the ACTIVE car driven (`activeVehicle`). A pre-v13 save owned no
 * car (the dealership is v13-new), so an empty garage + no active ride is its
 * TRUE history (the v11 empty-homeStorage stance applied to the garage).
 *
 * v13 → v14 (S20/ADR-084): THE FUEL SYSTEM — current fuel UNITS per owned car
 * (`fuel`). A pre-v14 save tracked no fuel (the system is v14-new), so an empty
 * map is its true history; a car gains a full tank when bought from here on.
 *
 * v14 → v15 (S20/ADR-087): VEHICLE FERRYING — which continent each owned car is
 * parked on (`carLocation`). A pre-v15 save owned no car off its home continent
 * (ferrying is v15-new), so an empty map is its true history.
 *
 * v15 → v16 (S21/ADR-126): THE HELD BREATH — Jay's Locket rewind rides a new
 * `echoes` field (the Breath bank + snapshot ring + rewind-debt). A pre-v16 save
 * never rewound (the power is v16-new), so a full bank, an empty stack, and zero
 * rewinds is its TRUE history (the v3 empty-ledger stance applied to echoes). The
 * three Axes (choices) ride ADR-015 flags — an unmade choice is just an unset flag.
 *
 * v16 → v17 (2026-07 Twoton rebuild): Twoton shrank and the four Long Walk
 * screens rotated from landscape to portrait. Saves made on those old layouts
 * are moved to a known-safe entrance on the same route rather than retaining a
 * now meaningless or out-of-bounds pixel. Retired sequential Twoton tenancy
 * ids recover to the city curb; story flags and all other state are untouched.
 *
 * v17 → v18 (2026-07 Department rebuild): all three Department of Smiles
 * floors grew and their required route changed. Saves standing on an old floor
 * recover to that floor's canonical entry, never into a wall or beyond a gate.
 */
import { ITEMS, BAG_MAX } from '../data/items';
import { MGR_ROW } from '../data/arcade';
import { freshEchoes } from '../data/echoes';
import type { GameStateData } from './state';
import type { HoopsState } from '../schemas';
import { s } from '../spritegen/scale';

export const CURRENT_SAVE_VERSION = 18;

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
  {
    to: 8,
    migrate(raw, fresh) {
      // S15h (ADR-048): the cast expands to FIVE. A pre-v8 save's heroNames
      // knows only the four — backfill Pippa's name from the canon default
      // (the name screen named her, or the default stands). No party change:
      // a hero who hasn't joined isn't on the party list (Pippa joins at Ch.5),
      // exactly like Milo and Dorin before their chapters, so old saves load
      // unbroken with their existing four untouched.
      const hn = isObj(raw.heroNames) ? raw.heroNames : (raw.heroNames = {});
      if (typeof hn.pippa !== 'string') hn.pippa = fresh.heroNames.pippa;
      raw.version = 8;
      return raw;
    },
  },
  {
    to: 9,
    migrate(raw) {
      // S17 (ADR-061): THE CATALOG SPINE — permanent tonic boosts ride a new
      // per-hero `boosts` map. A pre-v9 save never used a tonic (none existed),
      // so an empty map is its true history — backfill {} on every hero.
      const party = (Array.isArray(raw.party) ? raw.party : []).filter(isObj);
      for (const h of party) {
        if (!isObj(h.boosts)) h.boosts = {};
      }
      raw.version = 9;
      return raw;
    },
  },
  {
    to: 10,
    migrate(raw) {
      // S18 M27 (ADR-068): mindwarp_a RE-STAGED from rex's L21 level unlock to the
      // Ch.3 PUPPET awakening (the_first_borrow / `awake_mindwarp_a`). Availability =
      // unlocks ∪ awakened flags, so a save that ALREADY earned Mind Warp at L21 must
      // keep it: backfill the awakening flag for any save whose Jay (rex) is ≥ L21
      // (the old unlock level). A save that never reached L21 didn't have it and gains
      // it normally when the Ch.3 awakening fires. Engine id frozen — only the path moved.
      const party = (Array.isArray(raw.party) ? raw.party : []).filter(isObj);
      const rex = party.find((h) => h.id === 'rex');
      const flags = isObj(raw.flags) ? raw.flags : (raw.flags = {});
      if (rex && typeof rex.level === 'number' && rex.level >= 21 && flags.awake_mindwarp_a !== true) {
        flags.awake_mindwarp_a = true;
      }
      raw.version = 10;
      return raw;
    },
  },
  {
    to: 11,
    migrate(raw) {
      // S18 M29 (ADR-070): THE PROPERTY MARKET — a new per-home item store (the
      // footlocker), keyed by property id. A pre-v11 save owned no property and
      // stored nothing home-side, so an empty map is its true history. Ownership,
      // loans, and the price walk ride ADR-015 flags (no field needed for those).
      if (!isObj(raw.homeStorage)) raw.homeStorage = {};
      raw.version = 11;
      return raw;
    },
  },
  {
    to: 12,
    migrate(raw) {
      // S18 M30 (ADR-071): THE HOME EDITOR — per-home furniture layouts. A pre-v12
      // save decorated nothing, so an empty map is its true history. Coziness is
      // computed from this; an empty layout is coziness 0 (the resale floor).
      if (!isObj(raw.homeLayouts)) raw.homeLayouts = {};
      raw.version = 12;
      return raw;
    },
  },
  {
    to: 13,
    migrate(raw) {
      // S19 M38 (ADR-079): THE HOME GARAGE — owned-car titles parked per home +
      // the active ride. A pre-v13 save owned no car (the dealership is v13-new),
      // so an empty garage + no active vehicle is its true history.
      if (!isObj(raw.garage)) raw.garage = {};
      if (typeof raw.activeVehicle !== 'string' && raw.activeVehicle !== null) raw.activeVehicle = null;
      raw.version = 13;
      return raw;
    },
  },
  {
    to: 14,
    migrate(raw) {
      // S20 M43 (ADR-084): THE FUEL SYSTEM — per-car fuel units. A pre-v14 save
      // tracked no fuel (the system is v14-new), so an empty map is its true history.
      if (!isObj(raw.fuel)) raw.fuel = {};
      raw.version = 14;
      return raw;
    },
  },
  {
    to: 15,
    migrate(raw) {
      // S20 M46 (ADR-087): VEHICLE FERRYING — which continent each car is parked on.
      // A pre-v15 save never ferried (it's v15-new), so an empty map is its history.
      if (!isObj(raw.carLocation)) raw.carLocation = {};
      raw.version = 15;
      return raw;
    },
  },
  {
    to: 16,
    migrate(raw) {
      // S21 (ADR-126): THE HELD BREATH — Jay's Locket rewind. A pre-v16 save never
      // rewound (the power is v16-new), so a full Breath bank with an empty snapshot
      // stack and zero rewinds is its TRUE history (the v3 empty-ledger stance applied
      // to echoes). The Axes ride flags, so they need no backfill — an unmade choice is
      // simply an unset flag, which GS.flag() already reads as `false`.
      if (!isObj(raw.echoes)) raw.echoes = freshEchoes() as unknown as Raw;
      raw.version = 16;
      return raw;
    },
  },
  {
    to: 17,
    migrate(raw) {
      // These maps were re-authored in a different axis/footprint. Reset only
      // the player's location; every quest, flag, inventory, and relationship
      // remains byte-for-byte the save's own history.
      const map = typeof raw.map === 'string' ? raw.map : '';
      const legacyTwotonUnit = /^brickton_unit_\d+$/.test(map);
      const recovery: Record<string, { x: number; y: number }> = {
        brickton: { x: 48 * 16 + 8, y: 18 * 16 + 8 },
        meadow_mile: { x: 7 * 16 + 8, y: 3 * 16 + 12 },
        meadow_woods: { x: 8 * 16 + 8, y: 3 * 16 + 12 },
        meadow_far: { x: 6 * 16 + 8, y: 3 * 16 + 12 },
        meadow_overpass: { x: 7 * 16 + 8, y: 3 * 16 + 12 },
      };
      const target = legacyTwotonUnit ? recovery.brickton : recovery[map];
      if (target) {
        if (legacyTwotonUnit) raw.map = 'brickton';
        raw.x = s(target.x);
        raw.y = s(target.y);
        raw.facing = 'down';
      }
      raw.version = 17;
      return raw;
    },
  },
  {
    to: 18,
    migrate(raw) {
      const map = typeof raw.map === 'string' ? raw.map : '';
      const recovery: Record<string, { x: number; y: number; facing: 'up' | 'down' }> = {
        dos_f1: { x: 20 * 16, y: 24 * 16 + 10, facing: 'up' },
        dos_f2: { x: 4 * 16, y: 3 * 16 + 12, facing: 'down' },
        dos_f3: { x: 39 * 16 + 8, y: 3 * 16 + 12, facing: 'down' },
      };
      const target = recovery[map];
      if (target) {
        raw.x = s(target.x);
        raw.y = s(target.y);
        raw.facing = target.facing;
      }
      raw.version = 18;
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
