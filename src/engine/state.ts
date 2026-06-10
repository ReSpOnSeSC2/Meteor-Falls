/**
 * GameState — the serializable heart of every save (GAME_BIBLE §B1).
 * Plain data + helpers; no Phaser imports so it unit-tests headlessly.
 */
import { HEROES, type HeroId, statsAtLevel, maxHpAtLevel, maxPpAtLevel } from '../data/heroes';

export interface Stats {
  offense: number;
  defense: number;
  speed: number;
  guts: number;
  vibe: number;
  luck: number;
}

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
}

export interface GameStateData {
  version: 1;
  party: HeroState[];
  guest: string | null; // e.g. Chad tagging along
  inventory: string[];
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
  /** Prompt 21 names for all four heroes — joined or not (heroes joining later read theirs from here) */
  heroNames: Record<HeroId, string>;
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
  };
}

/** canon EXP curve: EXP(L) = 4·L³ ÷ 3 (GAME_BIBLE §A9) */
export function expForLevel(level: number): number {
  return Math.ceil((4 * level * level * level) / 3);
}

export function newGameData(): GameStateData {
  return {
    version: 1,
    party: [makeHeroState('rex', 1)],
    guest: null,
    inventory: ['cracked_bat', 'corn_dog', 'corn_dog'],
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
      dorin: HEROES.dorin.name,
    },
  };
}

const SLOT_KEY = 'meteor-falls-slot-1';

class GameStateStore {
  data: GameStateData = newGameData();

  reset(): void {
    this.data = newGameData();
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
    return this.hero(id)?.name ?? this.data.heroNames[id];
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

  addItem(id: string): boolean {
    if (this.data.inventory.length >= 14) return false;
    this.data.inventory.push(id);
    return true;
  }

  removeItem(id: string): boolean {
    const i = this.data.inventory.indexOf(id);
    if (i < 0) return false;
    this.data.inventory.splice(i, 1);
    return true;
  }

  hasItem(id: string): boolean {
    return this.data.inventory.includes(id);
  }

  serialize(): string {
    return JSON.stringify(this.data);
  }

  deserialize(json: string): void {
    const parsed = JSON.parse(json) as Partial<GameStateData>;
    if (parsed.version !== 1) throw new Error(`unknown save version ${String(parsed.version)}`);
    // pre-Prompt-21 saves lack the New Game fields — backfill canon defaults.
    // version stays 1; the real migration registry arrives with save slots.
    const fresh = newGameData();
    this.data = {
      ...fresh,
      ...parsed,
      version: 1,
      heroNames: { ...fresh.heroNames, ...(parsed.heroNames ?? {}) },
    };
  }

  save(): void {
    try {
      localStorage.setItem(SLOT_KEY, this.serialize());
    } catch {
      /* storage unavailable (private mode) — play on */
    }
  }

  hasSave(): boolean {
    try {
      return localStorage.getItem(SLOT_KEY) !== null;
    } catch {
      return false;
    }
  }

  load(): boolean {
    try {
      const json = localStorage.getItem(SLOT_KEY);
      if (!json) return false;
      this.deserialize(json);
      return true;
    } catch {
      return false;
    }
  }
}

export const GS = new GameStateStore();
