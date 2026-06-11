/**
 * Chapter 1 enemy roster — GAME_BIBLE §A7 canon HP/quirks + Boss 1 (§A6).
 * Every enemy: 2–4 moves, weakness tag, EXP/cash, flavor death line.
 * Types are z.infer'd from src/schemas (S5) — compile shape ≡ runtime schema.
 */
import { RAMP } from '../palette';
import type { EnemyDef } from '../schemas';

export type { EnemyDef, EnemyMove, MoveKind } from '../schemas';

const E = (e: EnemyDef): EnemyDef => e;

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  [
    E({
      id: 'cranky_mailbox',
      name: 'Cranky Mailbox',
      article: 'The',
      hp: 24,
      offense: 5,
      defense: 2,
      speed: 4,
      level: 1,
      exp: 8,
      cash: 4,
      weakness: [],
      moves: [
        { name: 'letter spit', kind: 'attack', mult: 1, text: '{e} spat a fistful of first-class insults!', weight: 5 },
        { name: 'flag slap', kind: 'attack', mult: 1.2, text: '{e} slapped with its little red flag!', weight: 3 },
        { name: 'grumble', kind: 'taunt', text: '{e} grumbled about postage rates.', weight: 2 },
      ],
      deathLine: 'The Cranky Mailbox was returned to sender.',
      sprite: 'battle_cranky_mailbox',
      mini: 'mini_cranky_mailbox',
      bg: [RAMP.BLUE, RAMP.PURPLE],
    }),
    E({
      id: 'runaway_lawnmower',
      name: 'Runaway Lawnmower',
      article: 'The',
      hp: 38,
      offense: 8,
      defense: 5,
      speed: 11,
      level: 3,
      exp: 14,
      cash: 8,
      weakness: ['volt'],
      moves: [
        { name: 'mow', kind: 'attack', mult: 1, text: '{e} mowed right over everything!', weight: 5 },
        { name: 'rev up', kind: 'strong', mult: 1.6, text: '{e} revved up WAY past the recommended RPM!', weight: 3 },
        { name: 'sputter', kind: 'taunt', text: '{e} sputtered and sprayed grass everywhere.', weight: 2 },
      ],
      deathLine: 'The Runaway Lawnmower finally ran out of gas.',
      sprite: 'battle_runaway_lawnmower',
      mini: 'mini_runaway_lawnmower',
      bg: [RAMP.GRASS, RAMP.MAGENTA],
    }),
    E({
      id: 'coily_cicada',
      name: 'Coily Cicada',
      article: 'The',
      hp: 30,
      offense: 6,
      defense: 1,
      speed: 9,
      level: 2,
      exp: 10,
      cash: 5,
      weakness: ['fire', 'insect'],
      moves: [
        { name: 'dive', kind: 'attack', mult: 1, text: '{e} dive-bombed with a horrible BZZZZT!', weight: 5 },
        { name: 'sun drone', kind: 'status', status: 'sunburn', text: '{e} droned the song of an endless August! {t} got Sunburned!', weight: 3 },
        { name: 'molt', kind: 'taunt', text: '{e} left a creepy shell on the ground. Nothing happened. It is just creepy.', weight: 2 },
      ],
      deathLine: 'The Coily Cicada went quiet for 17 more years.',
      sprite: 'battle_coily_cicada',
      mini: 'mini_coily_cicada',
      bg: [RAMP.FOREST, RAMP.GOLD],
    }),
    E({
      id: 'blazer_smiler',
      name: 'Blazer Smiler',
      article: 'The',
      hp: 55,
      offense: 9,
      defense: 6,
      speed: 7,
      level: 6,
      exp: 24,
      cash: 18,
      weakness: [],
      moves: [
        { name: 'handshake', kind: 'attack', mult: 1, text: '{e} delivered an aggressively firm handshake!', weight: 4 },
        { name: 'synergy', kind: 'status', status: 'productive', text: '{e} said "Have a PRODUCTIVE day!" {t} felt their weekend drain away!', weight: 4 },
        { name: 'smile', kind: 'taunt', text: '{e} smiled wider. Wider than that. No— wider.', weight: 2 },
      ],
      deathLine: 'The Blazer Smiler finally took a personal day.',
      sprite: 'battle_blazer_smiler',
      mini: 'mini_pigeon_gang',
      walker: 'smiler',
      bg: [RAMP.CYAN, RAMP.MAGENTA],
    }),
    E({
      id: 'pigeon_gang',
      name: 'Pigeon Gang',
      article: 'The',
      hp: 45,
      offense: 7,
      defense: 3,
      speed: 10,
      level: 4,
      exp: 18,
      cash: 11,
      weakness: [],
      moves: [
        { name: 'flurry', kind: 'attack', mult: 1, text: '{e} attacked in a flurry of gray feathers!', weight: 5 },
        { name: 'snack heist', kind: 'steal', text: '{e} made off with {t}\'s snack! The nerve!', weight: 3 },
        { name: 'coo', kind: 'taunt', text: '{e} cooed menacingly.', weight: 2 },
      ],
      deathLine: 'The Pigeon Gang dispersed to separate statues.',
      sprite: 'battle_pigeon_gang',
      mini: 'mini_pigeon_gang',
      bg: [RAMP.PAPER, RAMP.CYAN],
    }),
    E({
      id: 'hill_slug_deluxe',
      name: 'Hill Slug Deluxe',
      article: 'The',
      hp: 60,
      offense: 9,
      defense: 4,
      speed: 3,
      level: 4,
      exp: 22,
      cash: 9,
      weakness: ['salt', 'fire'],
      moves: [
        { name: 'body press', kind: 'strong', mult: 1.4, text: '{e} performed a deluxe body press!', weight: 4 },
        { name: 'slime', kind: 'attack', mult: 0.8, text: '{e} lobbed premium slime!', weight: 4 },
        { name: 'pose', kind: 'taunt', text: '{e} posed. It clearly thinks the crown is working.', weight: 2 },
      ],
      deathLine: 'The Hill Slug Deluxe was downgraded to standard.',
      sprite: 'battle_hill_slug',
      mini: 'mini_hill_slug',
      bg: [RAMP.GRASS, RAMP.PURPLE],
    }),
    // BOSS 1 — §A6: latches onto a hero and drains HP each turn until hit
    // with Vibe Fire or a thrown Salt Shaker.
    E({
      id: 'titanic_tick',
      name: 'TITANIC TICK',
      article: 'The',
      hp: 450,
      offense: 13,
      defense: 7,
      speed: 6,
      level: 7,
      exp: 320,
      cash: 150,
      weakness: ['fire', 'salt', 'insect'],
      moves: [
        { name: 'latch', kind: 'latch', text: '{e} LATCHED ONTO {t}!! Get it off! GET IT OFF!!', weight: 4 },
        { name: 'drain', kind: 'drain', mult: 1, text: '{e} drank deep. {t} felt the warmth leave!', weight: 4 },
        { name: 'chitter', kind: 'attack', mult: 1.1, text: '{e} swiped with a hooked leg!', weight: 3 },
        { name: 'hum', kind: 'taunt', text: '{e} hummed wrong. The crater hummed back.', weight: 1 },
      ],
      deathLine: 'The Titanic Tick popped like a water balloon. Gross. GROSS.',
      sprite: 'battle_titanic_tick',
      mini: 'mini_hill_slug',
      bg: [RAMP.MAGENTA, RAMP.NIGHT],
      boss: true,
    }),
  ].map((e) => [e.id, e]),
);

/** §A11.5 — intro lines in classic second person */
export function introLine(ids: string[]): string {
  const defs = ids.map((id) => ENEMIES[id]);
  if (defs.length === 1) {
    return `${defs[0].article} ${defs[0].name} drew near!`;
  }
  const counts = new Map<string, number>();
  for (const d of defs) counts.set(d.name, (counts.get(d.name) ?? 0) + 1);
  if (counts.size === 1) {
    const d = defs[0];
    return `${d.article} ${d.name} and its cousins drew near!`;
  }
  const names = [...counts.keys()];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} drew near!`;
}
