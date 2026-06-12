/**
 * New Game setup data — GAME_BIBLE Prompt 21 (§A11 voice).
 * Seven EB-style entry screens: the four heroes (prefilled, editable), the
 * player's own name (the finale's confirm box reads it, §A6 Ch.8), favorite
 * food (Mom's cooking / Homesick cure, §A4), and the coolest thing.
 * Don't-care pulls from the canon-flavored lists below.
 */
import { HEROES, type HeroId } from './heroes';

export type EntryKind = 'hero' | 'player' | 'food' | 'thing';

export interface NewGameEntry {
  key: HeroId | 'player' | 'food' | 'thing';
  kind: EntryKind;
  /** cast texture for the portrait beside the value box (null = no portrait) */
  sprite: string | null;
  prompt: string;
  prefill: string;
  cap: number;
  /** the Don't-care button picks from this list */
  dontCare: string[];
}

/** on-screen keyboard rows — every name/food/thing must spell from these + space */
export const GRID_ROWS: string[] = [
  'ABCDEFGHIJKLM',
  'NOPQRSTUVWXYZ',
  'abcdefghijklm',
  'nopqrstuvwxyz',
  "0123456789':-",
];

export const NAME_CAP = 8;
export const PHRASE_CAP = 14;

export const NEW_GAME_ENTRIES: NewGameEntry[] = [
  {
    key: 'rex',
    kind: 'hero',
    sprite: 'rex',
    prompt: 'Name the quiet kid from Otterbrook.',
    prefill: HEROES.rex.name,
    cap: NAME_CAP,
    dontCare: ['Rex', 'Casey', 'Otto', 'Champ', 'Slugger', 'Moss', 'Ace', 'Ray'],
  },
  {
    key: 'faye',
    kind: 'hero',
    sprite: 'faye',
    prompt: 'Name the girl who prays.',
    prefill: HEROES.faye.name,
    cap: NAME_CAP,
    // 'Faye' stays as a pickable alternate — she was almost named that
    dontCare: ['Faye', 'Wren', 'June', 'Pearl', 'Ember', 'Vesper', 'Hope', 'Lark'],
  },
  {
    key: 'milo',
    kind: 'hero',
    sprite: 'milo',
    prompt: 'Name the gadget genius and tea snob.',
    prefill: HEROES.milo.name,
    cap: NAME_CAP,
    dontCare: ['Milo', 'Gizmo', 'Earl', 'Oolong', 'Pekoe', 'Watt', 'Sprocket', 'Niles'],
  },
  {
    key: 'dorin',
    kind: 'hero',
    sprite: 'dorin',
    prompt: 'Name the monk from Stone Brow.',
    prefill: HEROES.dorin.name,
    cap: NAME_CAP,
    dontCare: ['Dorin', 'Petru', 'Sandu', 'Mirel', 'Stone', 'Luca', 'Anvil', 'Cedru'],
  },
  {
    key: 'player',
    kind: 'player',
    sprite: null,
    prompt: 'Now enter YOUR name. The person playing.',
    prefill: '',
    cap: NAME_CAP,
    dontCare: ['Buddy', 'Champ', 'Coach', 'Captain', 'Boss', 'Ace', 'Slick', 'Pal'],
  },
  {
    key: 'food',
    kind: 'food',
    sprite: null,
    prompt: "What is the hero's favorite homemade food?",
    prefill: 'corn dogs',
    cap: PHRASE_CAP,
    dontCare: [
      'corn dogs',
      'pizza',
      'fuzzy pickles',
      'lemonade',
      'bagels',
      'pancakes',
      'spaghetti',
      'eggs',
    ],
  },
  {
    key: 'thing',
    kind: 'thing',
    sprite: null,
    prompt: 'Name your coolest thing. The game will remember it.',
    prefill: 'meteors',
    cap: PHRASE_CAP,
    dontCare: [
      'meteors',
      'the 6:15',
      'pigeons',
      'dial tones',
      'bug zappers',
      'high scores',
      'hydrants',
      'Gerald',
    ],
  },
];

/** every character the grid can type (plus space, on the button row) */
export function gridCharset(): Set<string> {
  const set = new Set<string>(' ');
  for (const row of GRID_ROWS) for (const ch of row) set.add(ch);
  return set;
}

export function randomDontCare(entry: NewGameEntry): string {
  return entry.dontCare[Math.floor(Math.random() * entry.dontCare.length)];
}
