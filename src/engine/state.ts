/**
 * GameState — the serializable heart of every save (GAME_BIBLE §B1).
 * Plain data + helpers; no Phaser imports so it unit-tests headlessly.
 * Save shape is VERSIONED — see engine/migrations.ts for the registry (S3).
 * Persistence is the S6 slot family (engine/saves.ts): 3 slots + a rolling
 * auto-backup behind a swappable SaveStorage driver (ADR-018).
 */
import { HEROES, type HeroId, statsAtLevel, maxHpAtLevel, maxPpAtLevel } from '../data/heroes';
import { ITEMS, slotOf, BAG_MAX, EQUIP_SLOTS, type EquipSlot } from '../data/items';
import { MGR_ROW, SCORE_ROWS } from '../data/arcade';
import { migrateSave, freshHoops } from './migrations';
import { SaveBank, SLOT_IDS, localStorageDriver, type OpenResult, type SlotId, type SlotPeek } from './saves';
import type { ArcadeScore, BoostStat, CallerRecord, HoopsState, Stats, TonicBoost } from '../schemas';

// S5: Stats is z.infer'd from src/schemas — one shape for compile and runtime
export type { Stats } from '../schemas';

export interface HeroState {
  id: HeroId;
  name: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  pp: number;
  maxPp: number;
  stats: Stats;
  down: boolean;
  /** S3 (Prompt 19): each hero carries their own 14-slot bag */
  bag: string[];
  /** equipped item ids by slot; an equipped item stays in this hero's bag, EB-style */
  equip: Partial<Record<EquipSlot, string>>;
  /** S17 (v9, ADR-061): permanent TONIC boosts (§A4.12). Kept OUT of `stats`
   *  (which level-up recomputes from base+growth) so a boost survives leveling:
   *  the heroX seams add boosts[stat]; max HP/PP are re-added at every recompute
   *  site. Empty for every save until a tonic is used. */
  boosts: Partial<Record<BoostStat, number>>;
}

export interface GameStateData {
  version: 12;
  party: HeroState[];
  guest: string | null; // e.g. Chad tagging along
  keyItems: string[];
  cashOnHand: number;
  banked: number;
  pendingDeposit: number;
  flags: Record<string, number | boolean>;
  playtimeSec: number;
  map: string;
  x: number;
  y: number;
  facing: 'down' | 'left' | 'right' | 'up';
  embers: number;
  favoriteFood: string;
  playerName: string;
  coolestThing: string;
  /** Prompt 21 names for all five heroes — joined or not (heroes joining later read theirs from here) */
  heroNames: Record<HeroId, string>;
  /** S9 (v3): the CALLER ledger — one §A10 record per completed side quest,
   *  frozen at completion in earned order. §A6 Ch.8's finale iterates THIS. */
  callers: CallerRecord[];
  /** S10 (v4): the ARCADE LEGEND high-score table (§A10 #4), best first,
   *  SCORE_ROWS deep. Born holding the Manager's lonely MGR row. */
  arcadeScores: ArcadeScore[];
  /** S12 (v5): THE CAGE — tournament state IS save data. The Classic
   *  bracket survives save → kill → continue from any round; a live match
   *  checkpoints at quarter breaks; titles + the STARTING FOUR raincheck
   *  ledger + the pickup-seed counter all ride here. */
  hoops: HoopsState;
  /** S18 (v11, ADR-070): THE PROPERTY MARKET — per-owned-home item storage (the
   *  footlocker), keyed by property id. The only array-shaped property state;
   *  ownership, loans, and the price-walk seed all ride ADR-015 number/bool FLAGS
   *  (owned_<id>, garnishPrincipal, garnishPaid, propWalk). */
  homeStorage: Record<string, string[]>;
  /** S18 (v12, ADR-071): THE HOME EDITOR — per-owned-home furniture LAYOUT, keyed
   *  by property id. Each entry is a list of {f,x,y,rot} placements; COZINESS is
   *  computed from it (the rest buff + the flip resale lift). Array-shaped, so it
   *  earns a typed field + a migration (everything else stays ADR-015 flags). */
  homeLayouts: Record<string, Array<{ f: string; x: number; y: number; rot: 0 | 1 | 2 | 3 }>>;
}

/** everything the New Game sequence collects (GAME_BIBLE Prompt 21) */
export interface NewGameChoices {
  heroNames: Record<HeroId, string>;
  playerName: string;
  favoriteFood: string;
  coolestThing: string;
}

export function makeHeroState(id: HeroId, level: number, name?: string): HeroState {
  const def = HEROES[id];
  return {
    id,
    name: name ?? def.name,
    level,
    exp: expForLevel(level),
    hp: maxHpAtLevel(id, level),
    maxHp: maxHpAtLevel(id, level),
    pp: maxPpAtLevel(id, level),
    maxPp: maxPpAtLevel(id, level),
    stats: statsAtLevel(id, level),
    down: false,
    bag: [],
    equip: {},
    boosts: {},
  };
}

/**
 * S17 (ADR-061) — §A4.12: apply a TONIC's permanent boost to a hero. Combat
 * stats accumulate in `boosts` (the seams add them; level-up can't wipe them);
 * max HP / max PP raise the stored ceiling AND the current pool by the same
 * amount, EB-style (Growth Spurt Milk fills what it grows). Idempotent per call.
 */
export function applyTonic(hero: HeroState, boost: TonicBoost): void {
  const { stat, amount } = boost;
  hero.boosts[stat] = (hero.boosts[stat] ?? 0) + amount;
  if (stat === 'hp') {
    hero.maxHp += amount;
    hero.hp += amount;
  } else if (stat === 'pp') {
    hero.maxPp += amount;
    hero.pp += amount;
  }
}

/** canon EXP curve: EXP(L) = 4·L³ ÷ 3 (GAME_BIBLE §A9) */
export function expForLevel(level: number): number {
  return Math.ceil((4 * level * level * level) / 3);
}

/** display name for any hero IN a given blob, joined or not (Prompt 21 names).
 *  vars() resolves {rex} et al. through this so S6 slot summaries can render
 *  against a slot's OWN blob instead of the loaded game's. */
export function heroNameIn(data: GameStateData, id: HeroId): string {
  return data.party.find((h) => h.id === id)?.name ?? data.heroNames[id];
}

/** §A4.7: where a party wipe wakes up — the last Dad-save's spot (S6) */
export interface RespawnPoint {
  mapId: string;
  x: number;
  y: number;
  facing: GameStateData['facing'];
}

export function newGameData(): GameStateData {
  const rex = makeHeroState('rex', 1);
  rex.bag = ['cracked_bat', 'corn_dog', 'corn_dog'];
  rex.equip = { weapon: 'cracked_bat' };
  return {
    version: 12,
    party: [rex],
    guest: null,
    keyItems: [],
    cashOnHand: 12,
    banked: 0,
    pendingDeposit: 0,
    flags: {},
    playtimeSec: 0,
    map: 'rex_bedroom',
    x: 72,
    y: 88,
    facing: 'down',
    embers: 0,
    favoriteFood: 'corn dogs',
    playerName: 'Player',
    coolestThing: 'meteors',
    heroNames: {
      rex: HEROES.rex.name,
      faye: HEROES.faye.name,
      milo: HEROES.milo.name,
      pippa: HEROES.pippa.name,
      dorin: HEROES.dorin.name,
    },
    callers: [],
    // the cabinet's attract mode flashes this row before you ever walk in —
    // MGR's score is canon (§A10 #4); fresh saves start with him to beat
    arcadeScores: [{ ...MGR_ROW }],
    hoops: freshHoops(),
    homeStorage: {},
    homeLayouts: {},
  };
}

export type EquipResult = 'ok' | 'not-yours' | 'hands-full' | 'missing';

class GameStateStore {
  data: GameStateData = newGameData();
  /** S6: which slot Dad writes to — asked on his first save, then reused.
   *  Runtime-only; the slot a save lives in is its storage key, never a field. */
  activeSlot: SlotId | null = null;
  /** swappable seam: tests inject a memory driver; §B1's IndexedDB arrives
   *  as another SaveStorage implementation (ADR-018) */
  bank = new SaveBank(localStorageDriver);

  reset(): void {
    this.data = newGameData();
    this.activeSlot = null; // a fresh game gets Dad's "which notebook?" ask again
  }

  /** the §A4.3 playtime clock — pumped with real delta from the game loop
   *  whenever the overworld is alive (S6); serialized fractional, shown H:MM */
  tickPlaytime(sec: number): void {
    this.data.playtimeSec += sec;
  }

  flag(name: string): number | boolean {
    return this.data.flags[name] ?? false;
  }

  setFlag(name: string, v: number | boolean = true): void {
    this.data.flags[name] = v;
  }

  hero(id: HeroId): HeroState | undefined {
    return this.data.party.find((h) => h.id === id);
  }

  /** display name for any hero, joined or not (Prompt 21 names) */
  heroName(id: HeroId): string {
    return heroNameIn(this.data, id);
  }

  /** Prompt 21: commit the New Game choices to state (party members rename too) */
  applyNewGameChoices(c: NewGameChoices): void {
    this.data.heroNames = { ...c.heroNames };
    this.data.playerName = c.playerName;
    this.data.favoriteFood = c.favoriteFood;
    this.data.coolestThing = c.coolestThing;
    for (const h of this.data.party) h.name = this.data.heroNames[h.id];
  }

  aliveParty(): HeroState[] {
    return this.data.party.filter((h) => !h.down);
  }

  /* ---------------- per-hero bags (S3 / Prompt 19) ---------------- */

  bagOf(id: HeroId): string[] {
    return this.hero(id)?.bag ?? [];
  }

  /** put an item into a hero's 14-slot bag (defaults to the party leader) */
  addItem(itemId: string, heroId?: HeroId): boolean {
    const h = heroId ? this.hero(heroId) : this.data.party[0];
    if (!h || h.bag.length >= BAG_MAX) return false;
    h.bag.push(itemId);
    return true;
  }

  /**
   * Remove one copy from a hero's bag (or the first bag carrying it).
   * A dangling equip reference is cleared when the last copy leaves.
   */
  removeItem(itemId: string, heroId?: HeroId): boolean {
    const owners = heroId ? [this.hero(heroId)] : this.data.party;
    for (const h of owners) {
      if (!h) continue;
      const i = h.bag.indexOf(itemId);
      if (i < 0) continue;
      h.bag.splice(i, 1);
      this.clearDanglingEquip(h, itemId);
      return true;
    }
    return false;
  }

  hasItem(itemId: string): boolean {
    return this.data.party.some((h) => h.bag.includes(itemId));
  }

  /** who carries this item, in party order */
  itemOwner(itemId: string): HeroState | undefined {
    return this.data.party.find((h) => h.bag.includes(itemId));
  }

  /**
   * Prompt 19: equip from anyone's bag — the item moves into the equipper's
   * bag first (EB-style: equipped gear occupies a bag slot). Wielder tags
   * are enforced (§A8: bats are Jay's, pans are Mia's).
   */
  equipItem(heroId: HeroId, itemId: string): EquipResult {
    const hero = this.hero(heroId);
    const def = ITEMS[itemId];
    const slot = def ? slotOf(def) : null;
    if (!hero || !def || !slot) return 'missing';
    if (def.wielder && def.wielder !== heroId) return 'not-yours';
    const owner = hero.bag.includes(itemId) ? hero : this.itemOwner(itemId);
    if (!owner) return 'missing';
    if (owner !== hero) {
      if (hero.bag.length >= BAG_MAX) return 'hands-full';
      owner.bag.splice(owner.bag.indexOf(itemId), 1);
      this.clearDanglingEquip(owner, itemId);
      hero.bag.push(itemId);
    }
    hero.equip[slot] = itemId;
    return 'ok';
  }

  unequip(heroId: HeroId, slot: EquipSlot): void {
    const hero = this.hero(heroId);
    if (hero) delete hero.equip[slot];
  }

  private clearDanglingEquip(h: HeroState, itemId: string): void {
    if (h.bag.includes(itemId)) return; // another copy still carries the slot
    for (const slot of EQUIP_SLOTS) {
      if (h.equip[slot] === itemId) delete h.equip[slot];
    }
  }

  /* ---------------- the ARCADE LEGEND table (S10 / §A10 #4) ---------------- */

  /** the score to beat — the table's top row (MGR until somebody isn't) */
  arcadeTopScore(): number {
    return this.data.arcadeScores[0]?.score ?? 0;
  }

  /** 0-based rank this score would take, or null if it doesn't place.
   *  Ties rank BELOW the sitting row — a legend must EXCEED (cabinet law). */
  arcadeRankOf(score: number): number | null {
    const t = this.data.arcadeScores;
    const at = t.findIndex((r) => score > r.score);
    if (at >= 0) return at;
    return t.length < SCORE_ROWS ? t.length : null;
  }

  /** carve the initials into the table; returns the row taken (or null) */
  submitArcadeScore(initials: string, score: number): number | null {
    const rank = this.arcadeRankOf(score);
    if (rank === null) return null;
    this.data.arcadeScores.splice(rank, 0, { initials, score });
    this.data.arcadeScores.length = Math.min(this.data.arcadeScores.length, SCORE_ROWS);
    return rank;
  }

  /* ---------------- the ATM (S4 / Prompt 20) ---------------- */

  /** move cash card → pocket; clamps to the balance, returns what moved */
  withdraw(amount: number): number {
    const a = Math.min(Math.max(0, Math.floor(amount)), this.data.banked);
    this.data.banked -= a;
    this.data.cashOnHand += a;
    return a;
  }

  /** move cash pocket → card; clamps to what's on hand, returns what moved */
  deposit(amount: number): number {
    const a = Math.min(Math.max(0, Math.floor(amount)), this.data.cashOnHand);
    this.data.cashOnHand -= a;
    this.data.banked += a;
    return a;
  }

  /* ---------------- persistence ---------------- */

  serialize(): string {
    return JSON.stringify(this.data);
  }

  /** parse + walk the migration registry up to the current version (S3) */
  deserialize(json: string): void {
    this.data = migrateSave(JSON.parse(json), newGameData());
  }

  /** Dad writes the notebook; whatever it held rolls into the auto-backup (S6) */
  saveTo(slot: SlotId): void {
    this.activeSlot = slot;
    this.bank.write(slot, this.serialize());
  }

  /** Continue: load a slot, falling back to the rolling backup on corruption.
   *  'recovered' means the backup held — the caller plays Dad's apology. */
  continueFrom(slot: SlotId): OpenResult['kind'] {
    const out = this.bank.open(slot, newGameData());
    if (out.kind === 'ok' || out.kind === 'recovered') {
      this.data = out.data;
      this.activeSlot = slot;
    }
    return out.kind;
  }

  /** slot-list rows derived from the blobs — nothing here is stored twice */
  slotPeeks(): SlotPeek[] {
    return SLOT_IDS.map((s) => this.bank.peek(s, newGameData()));
  }

  anySave(): boolean {
    return this.bank.any();
  }

  /**
   * §A4.7: defeat (and S11's hospitals later) return the party to the last
   * Dad-save's map/position — read back from the saved blob, never tracked
   * in a second field. No save yet → Jay's house, ADR-014's interim respawn.
   */
  respawnPoint(): RespawnPoint {
    if (this.activeSlot !== null) {
      const peek = this.bank.peek(this.activeSlot, newGameData());
      if (typeof peek !== 'string') {
        const { map, x, y, facing } = peek.data;
        return { mapId: map, x, y, facing };
      }
    }
    return { mapId: 'rex_home', x: 104, y: 124, facing: 'down' };
  }
}

export const GS = new GameStateStore();
