/**
 * Chapter 1 enemy roster — GAME_BIBLE §A7 canon HP/quirks + Boss 1 (§A6).
 * Every enemy: 2–4 moves, weakness tag, EXP/cash, flavor death line.
 * Types are z.infer'd from src/schemas (S5) — compile shape ≡ runtime schema.
 */
import { RAMP } from '../palette';
import type { EnemyDef } from '../schemas';
import { ENEMY_OVERWORLD_SHEET_ID_SET } from './visuals';

export type { EnemyDef, EnemyMove, MoveKind } from '../schemas';

const E = (e: EnemyDef): EnemyDef => (ENEMY_OVERWORLD_SHEET_ID_SET.has(e.id) ? { ...e, overworld: `ow_enemy_${e.id}` } : e);

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  [
    E({
      id: 'cranky_mailbox',
      name: 'Cranky Mailbox',
      article: 'The',
      // S22 (ADR-111) — THE SLOW BURN: Ch.1 trash HP/Offense pulled DOWN so the
      // pre-crater fights (Jay at 1–2 dmg, no Vibe yet) are a fair 5–8-hit scrap,
      // not a 19-hit slog, and enemy hits land in the 1–5 band.
      hp: 12,
      offense: 3,
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
      hp: 16,
      offense: 4,
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
      hp: 14,
      offense: 3,
      defense: 1,
      speed: 9,
      level: 2,
      exp: 10,
      cash: 5,
      weakness: ['fire', 'insect'],
      moves: [
        { name: 'dive', kind: 'attack', mult: 1, text: '{e} dive-bombed with a horrible BZZZZT!', weight: 5 },
        { name: 'sun drone', kind: 'status', status: 'sunburn', text: '{e} droned the song of an endless August! {t} got Sunburned!', weight: 3 },
        // S18 M24 (ADR-094): the first LANDED elemental enemy move — the cicada
        // focuses the August heat to a white point. A worn fire pendant
        // (§A8 resists) finally has something to halve (resistIncoming).
        { name: 'August glare', kind: 'attack', mult: 1.1, element: 'fire', text: '{e} bent the whole white August sky down to one burning point!', weight: 2 },
        { name: 'molt', kind: 'taunt', text: '{e} left a creepy shell on the ground. Nothing happened. It is just creepy.', weight: 2 },
      ],
      deathLine: 'The Coily Cicada went quiet for 17 more years.',
      // the bug that burns you leaves the cooling leaf — cause, then cure (§A7)
      drops: [{ item: 'aloe_leaf', chance: 0.15 }],
      sprite: 'battle_coily_cicada',
      mini: 'mini_coily_cicada',
      bg: [RAMP.FOREST, RAMP.GOLD],
    }),
    E({
      id: 'blazer_smiler',
      name: 'Blazer Smiler',
      article: 'The',
      hp: 26,
      offense: 4,
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
      // a sad can of the break-room drink, warm now (§A7 — smells of the office)
      drops: [{ item: 'diet_star_cola', chance: 0.15 }],
      sprite: 'battle_blazer_smiler',
      mini: 'mini_pigeon_gang',
      walker: 'smiler',
      bg: [RAMP.CYAN, RAMP.MAGENTA],
    }),
    E({
      id: 'pigeon_gang',
      name: 'Pigeon Gang',
      article: 'The',
      hp: 20,
      offense: 4,
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
      // it makes off with your snack — sometimes it leaves one behind (§A7)
      drops: [{ item: 'corn_dog', chance: 0.25 }],
      sprite: 'battle_pigeon_gang',
      mini: 'mini_pigeon_gang',
      bg: [RAMP.PAPER, RAMP.CYAN],
    }),
    E({
      id: 'hill_slug_deluxe',
      name: 'Hill Slug Deluxe',
      article: 'The',
      hp: 28,
      offense: 4,
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
      // the "crown" it kept posing in turns out to be a bottle cap (§A7)
      drops: [{ item: 'bottle_cap_medallion', chance: 0.12 }],
      sprite: 'battle_hill_slug',
      mini: 'mini_hill_slug',
      bg: [RAMP.GRASS, RAMP.PURPLE],
    }),
    // §A7 Ch.1 SET-PIECE (S22, ADR-118) — CONSTABLE BORDEN, the lone Otterbrook
    // lawman. Lightly Hushed + framed by Chad into "detaining" Jay over the hill
    // "vandalism"; the morning cop fight (an OPTIONAL town beat, never a wall) snaps
    // him back to himself. By-the-book to a comic fault — a deliberate RHYME with
    // General Buckle (§A6/ADR-081). Slow-burn HP so a post-Tick party clears him fast.
    E({
      id: 'borden',
      name: 'Constable Borden',
      article: '',
      hp: 70,
      offense: 6,
      defense: 5,
      speed: 6,
      level: 6,
      exp: 40,
      cash: 30,
      weakness: [],
      moves: [
        { name: 'cite subsection', kind: 'attack', mult: 1, text: '{e} cited Otterbrook Municipal Code 7-B, subsection (ii)!', weight: 5 },
        { name: 'write a ticket', kind: 'strong', mult: 1.3, text: '{e} wrote {t} up for "loitering with intent to be twelve"!', weight: 3 },
        { name: 'blow whistle', kind: 'taunt', text: '{e} blew the whistle. Long. Pointedly. It did not accomplish anything.', weight: 2 },
      ],
      deathLine: 'Constable Borden sat down hard, blinked twice, and remembered he liked you.',
      sprite: 'battle_constable_borden',
      mini: 'mini_pigeon_gang',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),

    /* ================= §A7 CHAPTER 1 — the ecosystem to 20 (ADR-119) =================
     * 13 new types take Otterbrook/Brickton/the Dept. of Smiles to the canon 20.
     * Slow-Burn band (HP ~14–32, hits 1–5; rare types pay BIG cash for the
     * Fortune Arc). Every one: a MAP TELL (comment), a battle HOOK, an identity
     * DROP where it earns one, and a death line. All GRAY-BOX on shipped
     * battlers — authored art is queued in docs/CH1_ART_PROMPTS.md. */

    // --- four road/field roamers: suburbia having its worst Tuesday ---
    E({
      // TELL: oscillates back and forth guarding a too-green lawn; cross its arc.
      id: 'sprinkler_sentry',
      name: 'Sprinkler Sentry',
      article: 'The',
      hp: 18, offense: 3, defense: 4, speed: 7, level: 2, exp: 11, cash: 6,
      weakness: [],
      moves: [
        { name: 'tick-tick-tick', kind: 'taunt', text: '{e} swept its head the other way, winding up.', weight: 2 },
        { name: 'oscillating spray', kind: 'strong', mult: 1.3, text: '{e} caught the whole party on the backswing!', weight: 3 },
        { name: 'soak', kind: 'status', status: 'crying', text: "{e} got {t} right in the eyes! {t} can't see straight!", weight: 3 },
      ],
      deathLine: 'The Sprinkler Sentry retracted into the lawn, coverage complete.',
      sprite: 'battle_sprinkler_sentry', mini: 'mini_runaway_lawnmower',
      bg: [RAMP.GRASS, RAMP.CYAN],
    }),
    E({
      // TELL: head-down in a tipped-over can; bolts if you face it, easy from behind.
      id: 'recycling_raccoon',
      name: 'Recycling Raccoon',
      article: 'The',
      hp: 16, offense: 4, defense: 3, speed: 11, level: 3, exp: 13, cash: 8,
      weakness: [],
      moves: [
        { name: 'rummage', kind: 'attack', mult: 1, text: "{e} went through {t} like last week's mail!", weight: 5 },
        { name: 'deposit grab', kind: 'stealcash', text: "{e} cashed in {t}'s nickels at the redemption center!", weight: 3 },
        { name: 'hiss', kind: 'taunt', text: '{e} hissed with the confidence of an animal that pays no rent.', weight: 2 },
      ],
      deathLine: 'The Recycling Raccoon waddled off with the five-cent deposit.',
      drops: [{ item: 'corn_dog', chance: 0.2 }],
      sprite: 'battle_recycling_raccoon', mini: 'mini_pigeon_gang',
      bg: [RAMP.NIGHT, RAMP.EARTH],
    }),
    E({
      // TELL: a gray haze hanging over the pond and the trail at dusk.
      id: 'skeeter_swarm',
      name: 'Skeeter Swarm',
      article: 'The',
      hp: 14, offense: 3, defense: 1, speed: 12, level: 3, exp: 12, cash: 5,
      weakness: ['fire', 'insect'],
      moves: [
        { name: 'whine', kind: 'taunt', text: '{e} whined in that pitch only the back of your neck can hear.', weight: 2 },
        { name: 'bite, bite, bite', kind: 'attack', mult: 1, text: '{e} got {t} in eleven places at once!', weight: 5 },
        { name: 'swarm the eyes', kind: 'status', status: 'crying', text: "{e} clouded {t}'s eyes! {t} started swatting at nothing!", weight: 3 },
      ],
      deathLine: "The Skeeter Swarm dispersed to ruin somebody else's porch.",
      drops: [{ item: 'bug_juice', chance: 0.15 }],
      sprite: 'battle_skeeter_swarm', mini: 'mini_skeeter_swarm',
      bg: [RAMP.FOREST, RAMP.NIGHT],
    }),
    E({
      // TELL: stands dead still in the flowerbed; moves a few tiles when you look away.
      id: 'unionized_gnome',
      name: 'Garden Gnome, Unionized',
      article: 'The',
      hp: 22, offense: 4, defense: 6, speed: 3, level: 4, exp: 16, cash: 9,
      weakness: [],
      moves: [
        { name: 'tiny pickaxe', kind: 'attack', mult: 1.1, text: '{e} swung its little pickaxe with full benefits!', weight: 4 },
        { name: 'hold the line', kind: 'shield', text: '{e} braced behind its beard. It is not going anywhere.', weight: 2 },
        { name: 'file a grievance', kind: 'taunt', text: '{e} took notes for the record. The record is very long.', weight: 2 },
      ],
      deathLine: 'The Garden Gnome filed one last grievance and clocked out.',
      drops: [{ item: 'bottle_cap_medallion', chance: 0.08 }],
      sprite: 'battle_unionized_gnome', mini: 'mini_cranky_mailbox',
      bg: [RAMP.RED, RAMP.FOREST],
    }),

    // --- three Department of Smiles specialists: the institution fights back ---
    E({
      // TELL: a sheet of paperwork gliding the hall on a fixed patrol; step in its lane.
      id: 'mandatory_memo',
      name: 'Mandatory Memo',
      article: 'The',
      hp: 16, offense: 4, defense: 2, speed: 8, level: 5, exp: 18, cash: 10,
      weakness: ['fire'],
      moves: [
        { name: 'paper cut', kind: 'attack', mult: 1, text: '{e} sliced {t} on the dotted line!', weight: 5 },
        { name: 're: re: re:', kind: 'status', status: 'productive', text: "{e} CC'd {t} on everything! {t}'s weekend started leaking away!", weight: 3 },
        { name: 'reply-all', kind: 'taunt', text: '{e} replied to the whole floor. Nobody asked. Everybody got it.', weight: 2 },
      ],
      deathLine: "The Mandatory Memo was filed, at last, under 'No.'",
      drops: [{ item: 'diet_star_cola', chance: 0.15 }],
      sprite: 'battle_mandatory_memo', mini: 'mini_cranky_mailbox',
      bg: [RAMP.PAPER, RAMP.INK],
    }),
    E({
      // TELL: a framed kitten poster whose eyes follow you across the room.
      id: 'motivational_poster',
      name: 'Motivational Poster',
      article: 'The',
      hp: 20, offense: 4, defense: 4, speed: 5, level: 5, exp: 19, cash: 11,
      weakness: ['fire'],
      moves: [
        { name: 'HANG IN THERE', kind: 'status', status: 'asleep', text: '{e} encouraged {t} so relentlessly that {t} dozed off in self-defense!', weight: 3 },
        { name: 'forced eye contact', kind: 'attack', mult: 1.1, text: '{e} believed in {t}. It hurt.', weight: 4 },
        { name: 'live, laugh, languish', kind: 'taunt', text: '{e} reminded everyone that today is a gift. Nobody felt gifted.', weight: 2 },
      ],
      deathLine: 'The Motivational Poster curled at the corners and finally let go.',
      sprite: 'battle_motivational_poster', mini: 'mini_pigeon_gang',
      bg: [RAMP.CYAN, RAMP.GOLD],
    }),
    E({
      // TELL: a wall clock whose ticking speeds up the closer you stand.
      id: 'quota_clock',
      name: 'Quota Clock',
      article: 'The',
      hp: 24, offense: 5, defense: 5, speed: 6, level: 6, exp: 22, cash: 13,
      weakness: ['volt'],
      moves: [
        { name: 'deadline', kind: 'attack', mult: 1, text: '{e} reminded {t} that time was, in fact, up!', weight: 4 },
        { name: 'overtime', kind: 'strong', mult: 1.4, text: '{e} made itself stay late and hit twice as hard!', weight: 3 },
        { name: 'tick', kind: 'taunt', text: '{e} ticked. Loudly. It wanted you to hear the seconds leave.', weight: 2 },
      ],
      deathLine: 'The Quota Clock finally struck five and stopped dead.',
      sprite: 'battle_quota_clock', mini: 'mini_runaway_lawnmower',
      bg: [RAMP.INK, RAMP.ORANGE],
    }),

    // --- two social/urban oddities: town stays mostly safe, mostly ---
    E({
      // TELL: blinks red on a Brickton sidewalk; tickets you on sight, fights only if you argue.
      id: 'expired_meter',
      name: 'Expired Parking Meter',
      article: 'The',
      hp: 18, offense: 3, defense: 5, speed: 4, level: 4, exp: 15, cash: 7,
      weakness: [],
      moves: [
        { name: 'VIOLATION', kind: 'stealcash', text: '{e} wrote {t} a ticket and helped itself to the fine!', weight: 3 },
        { name: 'coin-slot jam', kind: 'attack', mult: 1.1, text: "{e} ate {t}'s quarter AND {t}'s patience!", weight: 4 },
        { name: 'flag up', kind: 'taunt', text: '{e} flipped its little red flag. The audacity has a sound.', weight: 2 },
      ],
      deathLine: "The Expired Parking Meter accepted that some things can't be charged.",
      sprite: 'battle_expired_meter', mini: 'mini_cranky_mailbox',
      bg: [RAMP.RED, RAMP.PAPER],
    }),
    E({
      // TELL: poses in a shop window; only wakes if you try on three hats.
      id: 'showroom_mannequin',
      name: 'Showroom Mannequin',
      article: 'The',
      hp: 20, offense: 4, defense: 4, speed: 6, level: 5, exp: 17, cash: 10,
      weakness: [],
      moves: [
        { name: 'runway strut', kind: 'attack', mult: 1, text: '{e} strutted straight through {t}!', weight: 4 },
        { name: 'accessorize', kind: 'steal', text: "{e} decided {t}'s hat completed the look, and took it!", weight: 3 },
        { name: 'vogue', kind: 'taunt', text: '{e} struck a pose and held it. Held it. Still holding it.', weight: 2 },
      ],
      deathLine: 'The Showroom Mannequin returned to the window, deeply unbothered.',
      drops: [{ item: 'foam_finger', chance: 0.1 }],
      sprite: 'battle_showroom_mannequin', mini: 'mini_pigeon_gang',
      bg: [RAMP.MAGENTA, RAMP.PURPLE],
    }),

    // --- two rare/high-value: little stories that PAY (the Fortune Arc starts here) ---
    E({
      // TELL: a rare golden dog that trots across one screen and is gone — catch it for a fat payout.
      id: 'good_investment',
      name: 'The Good Investment',
      article: '',
      hp: 26, offense: 3, defense: 4, speed: 13, level: 5, exp: 30, cash: 95,
      weakness: [],
      moves: [
        { name: 'fetch', kind: 'attack', mult: 1, text: '{e} brought back the stick and also bowled over {t}!', weight: 4 },
        { name: 'puppy eyes', kind: 'taunt', text: '{e} looked up at {t}. {t} hesitated. Everyone always hesitates.', weight: 3 },
        { name: 'good-boy bolt', kind: 'taunt', text: '{e} thought, very seriously, about trotting home.', weight: 3 },
      ],
      deathLine: 'The Good Investment trotted home. It was, in every sense, a sound one.',
      sprite: 'battle_good_investment', mini: 'mini_pigeon_gang',
      bg: [RAMP.GOLD, RAMP.GRASS],
    }),
    E({
      // TELL: appears only when the music cuts out; rolls past playing a warped jingle.
      id: 'rogue_icecream_truck',
      name: 'Rogue Ice-Cream Truck',
      article: 'The',
      hp: 30, offense: 4, defense: 6, speed: 5, level: 6, exp: 28, cash: 75,
      weakness: ['volt'],
      moves: [
        { name: 'off-key jingle', kind: 'status', status: 'asleep', text: '{e} played a lullaby with three wrong notes! {t} nodded off!', weight: 3 },
        { name: 'brain freeze', kind: 'status', status: 'paralyzed', text: '{e} served {t} a cone too fast! {t} seized up, clutching their head!', weight: 3 },
        { name: 'soft-serve slam', kind: 'strong', mult: 1.3, text: '{e} lurched the whole chassis at {t}!', weight: 3 },
      ],
      deathLine: 'The Rogue Ice-Cream Truck coasted to a stop, finally out of jingle.',
      drops: [{ item: 'diet_star_cola', chance: 0.3 }],
      sprite: 'battle_rogue_icecream_truck', mini: 'mini_runaway_lawnmower',
      bg: [RAMP.CYAN, RAMP.MAGENTA],
    }),

    // --- two late-chapter pressure: remix the lessons right before the Tick ---
    E({
      // TELL: small ticks on the crater rim — a warning of what is waiting below.
      id: 'tick_nymph',
      name: 'Tick Nymph',
      article: 'The',
      hp: 28, offense: 5, defense: 4, speed: 8, level: 6, exp: 24, cash: 14,
      weakness: ['fire', 'salt', 'insect'],
      moves: [
        { name: 'latch on', kind: 'strong', mult: 1.3, text: '{e} sank in and would not let go of {t}!', weight: 4 },
        { name: 'sip', kind: 'attack', mult: 1, text: "{e} took a little of {t}'s warmth for the road.", weight: 3 },
        { name: 'chitter', kind: 'taunt', text: '{e} chittered. Somewhere below, something much larger chittered back.', weight: 2 },
      ],
      deathLine: 'The Tick Nymph let go and skittered off to grow up. Regrettably.',
      drops: [{ item: 'salt_shaker', chance: 0.15 }],
      sprite: 'battle_tick_nymph', mini: 'mini_coily_cicada',
      bg: [RAMP.PURPLE, RAMP.RED],
    }),
    E({
      // TELL: the most-gone Smiler, patrolling near the holding room; the air goes quiet around it.
      id: 'the_suit',
      name: 'The Suit',
      article: '',
      hp: 32, offense: 6, defense: 5, speed: 6, level: 7, exp: 26, cash: 16,
      weakness: [],
      moves: [
        { name: 'exit interview', kind: 'strong', mult: 1.2, text: '{e} walked {t} through their shortcomings, item by item!', weight: 4 },
        { name: 'silence the room', kind: 'status', status: 'hushed', text: "{e} smiled, and the warmth went out of {t}'s voice!", weight: 3 },
        { name: 'straighten tie', kind: 'taunt', text: '{e} straightened a tie that was already straight. The smile never moved.', weight: 2 },
      ],
      deathLine: "The Suit's smile finally reached its eyes. Then both switched off.",
      sprite: 'battle_the_suit', mini: 'mini_pigeon_gang',
      bg: [RAMP.INK, RAMP.NIGHT],
    }),

    /* ================= §A7 CHAPTER 2 — South America (S14) =================
     * Target level 13; EXP/cash on the §A9 curve between Ch.1's street pay
     * and Boss 2's purse. Every quirk §A7 names is a real mechanic:
     * the Parrot's pending-cash theft, the Beetle's gold form, the
     * Souvenir's Crying, the Step-Mask's Shield, the Bunch's 5×22 union,
     * the Jitterbug's Paralyze. */
    E({
      id: 'pickpocket_parrot',
      name: 'Pickpocket Parrot',
      article: 'The',
      hp: 70,
      offense: 14,
      defense: 6,
      speed: 16,
      level: 9,
      exp: 38,
      cash: 22,
      weakness: [],
      moves: [
        { name: 'peck', kind: 'attack', mult: 1, text: '{e} pecked with professional disinterest!', weight: 4 },
        { name: 'pocket dive', kind: 'stealcash', text: "{e} went through {t}'s pockets IN BROAD DAYLIGHT!", weight: 4 },
        { name: 'squawk', kind: 'taunt', text: '{e} squawked an exact dollar amount. How does it know.', weight: 2 },
      ],
      deathLine: 'The Pickpocket Parrot dropped everything. EVERYTHING.',
      sprite: 'battle_pickpocket_parrot',
      mini: 'mini_parrot',
      bg: [RAMP.GRASS, RAMP.RED],
    }),
    E({
      id: 'gilded_beetle',
      name: 'Gilded Beetle',
      article: 'The',
      hp: 85,
      offense: 15,
      defense: 12,
      speed: 8,
      level: 10,
      exp: 46,
      cash: 30,
      weakness: ['freeze'],
      moves: [
        { name: 'horn toss', kind: 'attack', mult: 1.1, text: '{e} flipped {t} an entire opinion with its horn!', weight: 4 },
        { name: 'gild up', kind: 'gild', text: '{e} polished itself into SOLID GOLD! Swings just slide off!', weight: 3 },
        { name: 'heavy ram', kind: 'strong', mult: 1.5, text: '{e} rammed with the full weight of its savings!', weight: 3 },
      ],
      deathLine: 'The Gilded Beetle turned out to be mostly beetle.',
      // a beetle that gilded itself sheds one real coin of its "savings" (§A7)
      drops: [{ item: 'gold_doubloon', chance: 0.2 }],
      sprite: 'battle_gilded_beetle',
      mini: 'mini_beetle',
      bg: [RAMP.GOLD, RAMP.FOREST],
    }),
    E({
      id: 'cursed_souvenir',
      name: 'Cursed Souvenir',
      article: 'The',
      hp: 78,
      offense: 16,
      defense: 8,
      speed: 7,
      level: 11,
      exp: 52,
      cash: 26,
      weakness: ['fire'],
      moves: [
        { name: 'tiny wail', kind: 'status', status: 'crying', text: '{e} wailed about the gift shop! {t} welled right up!', weight: 4 },
        { name: 'shelf lunge', kind: 'attack', mult: 1, text: '{e} lunged like a price tag in the wind!', weight: 4 },
        { name: 'regret', kind: 'strong', mult: 1.4, text: '{e} radiated pure buyer\'s remorse!', weight: 2 },
      ],
      deathLine: 'The Cursed Souvenir was finally returned. No receipt necessary.',
      // the trinket that made you weep leaves the hanky to dry it (§A7)
      drops: [{ item: 'hanky', chance: 0.18 }],
      sprite: 'battle_cursed_souvenir',
      mini: 'mini_souvenir',
      bg: [RAMP.PURPLE, RAMP.GOLD],
    }),
    E({
      id: 'step_mask',
      name: 'Step-Mask',
      article: 'The',
      hp: 80,
      offense: 17,
      defense: 10,
      speed: 9,
      level: 12,
      exp: 60,
      cash: 32,
      weakness: ['volt'],
      moves: [
        { name: 'stone slap', kind: 'attack', mult: 1.1, text: '{e} slapped with five hundred years of patience!', weight: 4 },
        { name: 'mask of calm', kind: 'shield', text: '{e} composed its face into a SHIELD of perfect calm!', weight: 3 },
        { name: 'judgement', kind: 'strong', mult: 1.5, text: '{e} looked at {t} the way museums look at gum!', weight: 3 },
      ],
      deathLine: 'The Step-Mask cracked a smile. Then just cracked.',
      sprite: 'battle_step_mask',
      mini: 'mini_mask',
      bg: [RAMP.EARTH, RAMP.MAGENTA],
    }),
    E({
      id: 'banana_bunch',
      name: 'Banana Bunch United',
      article: 'The',
      hp: 22,
      offense: 12,
      defense: 3,
      speed: 11,
      level: 9,
      exp: 9,
      cash: 5,
      weakness: ['fire'],
      moves: [
        { name: 'overripe lob', kind: 'attack', mult: 1, text: '{e} lobbed its most overripe member!', weight: 5 },
        { name: 'union chant', kind: 'taunt', text: '{e} chanted about fair ripening conditions.', weight: 3 },
        { name: 'split', kind: 'strong', mult: 1.4, text: '{e} performed a devastating banana split!', weight: 2 },
      ],
      deathLine: 'One fifth of Banana Bunch United peeled off the cause.',
      sprite: 'battle_banana_bunch',
      mini: 'mini_banana',
      bg: [RAMP.GOLD, RAMP.GRASS],
    }),
    E({
      id: 'jungle_jitterbug',
      name: 'Jungle Jitterbug',
      article: 'The',
      hp: 80,
      offense: 19,
      defense: 9,
      speed: 18,
      level: 13,
      exp: 70,
      cash: 36,
      weakness: ['insect', 'freeze'],
      moves: [
        { name: 'jitter sting', kind: 'status', status: 'paralyzed', text: '{e} stung in 7/8 time! {t} went stiff as a flagpole!', weight: 3 },
        { name: 'blur strike', kind: 'attack', mult: 1.2, text: '{e} struck from somewhere in the percussion section!', weight: 4 },
        { name: 'frenzy', kind: 'strong', mult: 1.6, text: '{e} danced the one dance nobody survives unmoved!', weight: 2 },
        { name: 'count in', kind: 'taunt', text: '{e} counted itself in. Five, six, seven, EIGHT—', weight: 1 },
      ],
      deathLine: 'The Jungle Jitterbug took its final bow. The jungle applauded.',
      sprite: 'battle_jungle_jitterbug',
      mini: 'mini_jitterbug',
      bg: [RAMP.FOREST, RAMP.MAGENTA],
    }),
    /* ═══════════ Ch.3 ENGLAND — Foggybottom-on-Tyne / Wintermoor Academy ═══════
     * §A7 institution-as-monster (target L18): prefects patrol like rules with
     * shoes, textbooks punish wrong answers, tea ghosts pour for the enemy side
     * because hospitality got misfiled, and the fog is machine-made. Twenty unique
     * types — the SEED SIX + the Enemy Flow Law mix (4 road/field · 3 dungeon · 2
     * social · 2 rare · 2 late-pressure · 1 set-piece). Each carries a battle HOOK,
     * an identity DROP that smells of that foe (economy-neutral, §A9), and a
     * place-specific DEATH LINE; the MAP TELL rides each one's encounter placement
     * + sign in maps_ch3 (§A7). Dev-art reuses the forged Ch.3 faces (ADR-046,
     * registered at boot); bespoke silhouettes land in the art pass. The boss
     * (Headmaster Mainframe) stays a forge DRAFT until the manifest flips. ──────── */
    // ── THE SEED SIX (§A7) ──────────────────────────────────────────────────────
    E({
      id: 'prefect_drone',
      name: 'Prefect Drone',
      article: 'The',
      hp: 130,
      offense: 22,
      defense: 12,
      speed: 9,
      level: 16,
      exp: 82,
      cash: 44,
      weakness: ['volt', 'freeze'],
      moves: [
        { name: 'demerit', kind: 'status', status: 'productive', text: '{e} issued {t} a demerit and a meaningful look.', weight: 4 },
        { name: 'corridor sweep', kind: 'attack', mult: 1.1, text: '{e} swept the corridor — and {t} — with one clipboard arc!', weight: 4 },
        { name: 'see me at break', kind: 'strong', mult: 1.5, text: '{e} frog-marched {t} toward a door marked QUIET STUDY!', weight: 2 },
        { name: 'whistle', kind: 'taunt', text: '{e} blew a whistle that brooked no appeal.', weight: 1 },
      ],
      deathLine: 'The Prefect Drone was, at last, dismissed for the term.',
      // a Hushed enforcer sheds the enamel badge it polished too hard (§A7)
      drops: [{ item: 'house_pin', chance: 0.15 }],
      sprite: 'battle_prefect_drone',
      mini: 'mini_ch3_grunt_4',
      bg: [RAMP.BLUE, RAMP.CYAN],
    }),
    E({
      id: 'possessed_textbook',
      name: 'Possessed Textbook',
      article: 'The',
      hp: 115,
      offense: 20,
      defense: 14,
      speed: 5,
      level: 15,
      exp: 72,
      cash: 40,
      weakness: ['fire'],
      moves: [
        { name: 'pop quiz', kind: 'status', status: 'hushed', text: '{e} sprang a surprise quiz! {t} went blank — and the answer would not come!', weight: 4 },
        { name: 'spine snap', kind: 'attack', mult: 1.1, text: '{e} snapped shut on {t} like a trap with a bibliography!', weight: 4 },
        { name: 'red ink', kind: 'strong', mult: 1.45, text: "{e} bled red ink through {t}'s every wrong answer!", weight: 2 },
        { name: 'errata', kind: 'taunt', text: '{e} revised its own errata. Now {t} had always been wrong.', weight: 1 },
      ],
      deathLine: 'The Possessed Textbook closed for good — footnotes, appendix and all.',
      // the book that stole your voice came stamped with the matron's lozenge (cause → cure, §A7)
      drops: [{ item: 'honey_lozenge', chance: 0.25 }],
      sprite: 'battle_possessed_textbook',
      mini: 'mini_ch3_caster_2',
      bg: [RAMP.CYAN, RAMP.NIGHT],
    }),
    E({
      id: 'fog_hound',
      name: 'Fog Hound',
      article: 'The',
      hp: 150,
      offense: 24,
      defense: 10,
      speed: 14,
      level: 16,
      exp: 88,
      cash: 46,
      weakness: ['volt', 'fire'],
      moves: [
        { name: 'fog lunge', kind: 'attack', mult: 1.2, text: '{e} was already mid-leap by the time it left the fog!', weight: 5 },
        { name: 'damp howl', kind: 'status', status: 'crying', text: "{e} howled cold and wet. {t}'s eyes stung shut!", weight: 3 },
        { name: 'grey pounce', kind: 'strong', mult: 1.5, text: '{e} folded the whole moor into one pounce!', weight: 2 },
      ],
      deathLine: 'The Fog Hound thinned back out into ordinary bad weather.',
      // a fog-machine made flesh sheds a cracked emitter cog — scrap to anyone but Milo (§A7)
      drops: [{ item: 'broken_gizmo', chance: 0.2 }],
      sprite: 'battle_fog_hound',
      mini: 'mini_ch3_lurker_3',
      bg: [RAMP.CYAN, RAMP.PAPER],
    }),
    E({
      id: 'tea_poltergeist',
      name: 'Tea Poltergeist',
      article: 'The',
      hp: 90,
      offense: 18,
      defense: 9,
      speed: 12,
      level: 15,
      exp: 68,
      cash: 38,
      weakness: ['freeze'],
      moves: [
        { name: 'scalding pour', kind: 'attack', mult: 1.1, element: 'fire', text: '{e} poured a cup three degrees past hospitable over {t}!', weight: 4 },
        { name: 'warm the pot', kind: 'shield', text: '{e} wrapped itself in a cosy and refused to cool down!', weight: 3 },
        { name: 'one more cup?', kind: 'mend', text: "{e} topped up the OTHER side's cups. Frightfully rude to refuse — and frightfully restorative.", weight: 3 },
      ],
      deathLine: 'The Tea Poltergeist let the pot go cold at last. Filed under: mercy.',
      // misfiled hospitality leaves the brew behind — tea is PP in this chapter (§A7)
      drops: [{ item: 'builders_tea', chance: 0.3 }],
      sprite: 'battle_tea_poltergeist',
      mini: 'mini_ch3_caster_5',
      bg: [RAMP.CYAN, RAMP.PURPLE],
    }),
    E({
      id: 'cricket_eleven',
      name: 'Cricket Eleven',
      article: 'The',
      hp: 16,
      offense: 15,
      defense: 4,
      speed: 13,
      level: 15,
      exp: 12,
      cash: 7,
      weakness: [],
      moves: [
        { name: 'over', kind: 'attack', mult: 0.9, text: '{e} bowled a full over at {t} — six deliveries, no mercy!', weight: 5 },
        { name: 'appeal', kind: 'taunt', text: '{e} went up as one: "HOWZAT?!" The umpire was, alarmingly, also them.', weight: 3 },
        { name: 'googly', kind: 'strong', mult: 1.3, text: '{e} sent down a googly nobody read. Least of all {t}.', weight: 2 },
      ],
      deathLine: 'One eleventh of the Cricket Eleven trudged back to the pavilion.',
      // they break for tea after every wicket — a flaky currant cake left on the boundary (§A7)
      drops: [{ item: 'eccles_cake', chance: 0.1 }],
      sprite: 'battle_cricket_eleven',
      mini: 'mini_ch3_grunt_0',
      bg: [RAMP.PAPER, RAMP.CYAN],
    }),
    E({
      id: 'greenhouse_creeper',
      name: 'Greenhouse Creeper',
      article: 'The',
      hp: 170,
      offense: 26,
      defense: 13,
      speed: 6,
      level: 17,
      exp: 100,
      cash: 52,
      weakness: ['fire', 'freeze'],
      moves: [
        { name: 'thorn whip', kind: 'attack', mult: 1.2, text: '{e} lashed {t} with a runner that has read about sunlight, not kindness!', weight: 4 },
        { name: 'entangle', kind: 'status', status: 'paralyzed', text: '{e} wound {t} up in rocket-wreck vines! {t} could not move!', weight: 3 },
        { name: 'glasshouse crush', kind: 'strong', mult: 1.6, text: '{e} brought the whole greenhouse roof down on {t}!', weight: 2 },
      ],
      deathLine: 'The Greenhouse Creeper let go of the rocket at last. Milo wept, a little.',
      // it grew through Milo's crashed rocket — a coil of scrap drops from its roots (§A7)
      drops: [{ item: 'broken_gizmo', chance: 0.3 }],
      sprite: 'battle_greenhouse_creeper',
      mini: 'mini_ch3_bruiser_1',
      bg: [RAMP.FOREST, RAMP.CYAN],
    }),
    // ── 4 ROAD/FIELD ROAMERS (the high street + the moor lanes) ───────────────────
    E({
      id: 'pillar_box',
      name: 'Pillar Box',
      article: 'The',
      hp: 120,
      offense: 19,
      defense: 15,
      speed: 3,
      level: 14,
      exp: 64,
      cash: 40,
      weakness: [],
      moves: [
        { name: 'frank', kind: 'attack', mult: 1.1, text: '{e} stamped {t} FIRST CLASS, FACE FORWARD!', weight: 4 },
        { name: 'eat the post', kind: 'steal', text: '{e} swallowed something of {t}\'s for "safekeeping." It is now Royal Mail property.', weight: 3 },
        { name: 'second post', kind: 'strong', mult: 1.4, text: '{e} delivered, with terrible punctuality, a second post!', weight: 2 },
      ],
      deathLine: 'The Pillar Box tipped over and posted itself. Return to sender.',
      // a cast-iron hoarder, full of undelivered odds — a royal-wedding tin rolls out (§A7)
      drops: [{ item: 'commemorative_tin', chance: 0.15 }],
      sprite: 'battle_pillar_box',
      mini: 'mini_ch3_bruiser_1',
      bg: [RAMP.RED, RAMP.NIGHT],
    }),
    E({
      id: 'brolly_bat',
      name: 'Brolly Bat',
      article: 'The',
      hp: 95,
      offense: 18,
      defense: 7,
      speed: 17,
      level: 14,
      exp: 62,
      cash: 34,
      weakness: ['volt'],
      moves: [
        { name: 'gust flap', kind: 'attack', mult: 1, text: '{e} flapped wrong-way-out and clouted {t} across the high street!', weight: 5 },
        { name: 'downpour', kind: 'status', status: 'crying', text: '{e} dumped a held downpour on {t}! Rain first, then tears!', weight: 3 },
        { name: 'inside out', kind: 'strong', mult: 1.4, text: '{e} turned fully inside out and came back ANGRIER!', weight: 2 },
      ],
      deathLine: 'The Brolly Bat folded up sulkily — the way they never do when you need them.',
      // a storm-turned umbrella leaves the little tin one on a clip behind (§A7)
      drops: [{ item: 'rain_charm', chance: 0.12 }],
      sprite: 'battle_brolly_bat',
      mini: 'mini_ch3_lurker_3',
      bg: [RAMP.BLUE, RAMP.NIGHT],
    }),
    E({
      id: 'moor_sheep',
      name: 'Moor Sheep',
      article: 'The',
      hp: 140,
      offense: 21,
      defense: 11,
      speed: 6,
      level: 15,
      exp: 74,
      cash: 38,
      weakness: [],
      moves: [
        { name: 'will not budge', kind: 'taunt', text: '{e} planted all four feet in the lane and simply would not.', weight: 3 },
        { name: 'headbutt', kind: 'strong', mult: 1.5, text: '{e} reversed up and delivered the entire Pennines to {t}!', weight: 4 },
        { name: 'wrong baa', kind: 'attack', mult: 1, text: '{e} baa-ed in a register that has gone wrong. {t} flinched.', weight: 3 },
      ],
      deathLine: 'The Moor Sheep wandered off mid-sentence, as is its ancient right.',
      // a shepherd's lost lunch, jellied and cold, turns up in the wool (§A7)
      drops: [{ item: 'pork_pie', chance: 0.2 }],
      sprite: 'battle_moor_sheep',
      mini: 'mini_ch3_grunt_0',
      bg: [RAMP.PAPER, RAMP.EARTH],
    }),
    E({
      id: 'soot_imp',
      name: 'Soot Imp',
      article: 'The',
      hp: 88,
      offense: 17,
      defense: 6,
      speed: 15,
      level: 14,
      exp: 60,
      cash: 33,
      weakness: ['freeze', 'volt'],
      moves: [
        { name: 'soot puff', kind: 'status', status: 'crying', text: "{e} puffed a lungful of chimney soot into {t}'s eyes!", weight: 4 },
        { name: 'cinder nip', kind: 'attack', mult: 1.1, element: 'fire', text: '{e} nipped {t} with a fistful of still-warm cinders!', weight: 4 },
        { name: 'up the flue', kind: 'taunt', text: '{e} vanished up a flue and came back down a different chimney.', weight: 2 },
      ],
      deathLine: 'The Soot Imp went up the flue for good. The chimney sighed, relieved.',
      // soot in the eyes, drops left behind to clear them (cause → cure, §A7)
      drops: [{ item: 'eye_drops', chance: 0.25 }],
      sprite: 'battle_soot_imp',
      mini: 'mini_ch3_grunt_0',
      bg: [RAMP.INK, RAMP.NIGHT],
    }),
    // ── 3 DUNGEON SPECIALISTS (Wintermoor enforces sight lines + schedule bells) ──
    E({
      id: 'detention_desk',
      name: 'Detention Desk',
      article: 'The',
      hp: 155,
      offense: 23,
      defense: 16,
      speed: 4,
      level: 17,
      exp: 96,
      cash: 50,
      weakness: ['fire'],
      moves: [
        { name: 'lid clamp', kind: 'status', status: 'paralyzed', text: "{e} clamped its lid on {t}'s sleeve! DETENTION — {t} was held fast!", weight: 3 },
        { name: 'inkwell fling', kind: 'attack', mult: 1.1, text: '{e} flung a century of crusted inkwells at {t}!', weight: 4 },
        { name: 'lines', kind: 'strong', mult: 1.45, text: '{e} made {t} write "I MUST NOT" five hundred times, all at once!', weight: 3 },
      ],
      deathLine: 'The Detention Desk was, with great ceremony, finally excused.',
      // a confiscated book has been jammed in its lid for three centuries (§A7)
      drops: [{ item: 'first_edition', chance: 0.06 }],
      sprite: 'battle_detention_desk',
      mini: 'mini_ch3_bruiser_1',
      bg: [RAMP.EARTH, RAMP.NIGHT],
    }),
    E({
      id: 'schedule_bell',
      name: 'Schedule Bell',
      article: 'The',
      hp: 110,
      offense: 20,
      defense: 10,
      speed: 11,
      level: 16,
      exp: 80,
      cash: 44,
      weakness: ['freeze'],
      moves: [
        { name: 'period change', kind: 'attack', mult: 1.2, element: 'volt', text: "{e} rang the period bell straight through {t}'s teeth!", weight: 4 },
        { name: 'fire drill', kind: 'status', status: 'paralyzed', text: '{e} rang a drill so official that {t} froze in the corridor!', weight: 3 },
        { name: 'double maths', kind: 'strong', mult: 1.4, text: '{e} tolled DOUBLE MATHS. The sound alone left a bruise!', weight: 3 },
      ],
      deathLine: 'The Schedule Bell rang once more — recess, finally, forever.',
      // it rings for tea break whether anyone wants tea or not (§A7)
      drops: [{ item: 'builders_tea', chance: 0.3 }],
      sprite: 'battle_schedule_bell',
      mini: 'mini_ch3_caster_2',
      bg: [RAMP.GOLD, RAMP.CYAN],
    }),
    E({
      id: 'foggy_locker',
      name: 'Foggy Locker',
      article: 'The',
      hp: 165,
      offense: 25,
      defense: 14,
      speed: 6,
      level: 17,
      exp: 98,
      cash: 50,
      weakness: ['volt'],
      moves: [
        { name: 'confiscate', kind: 'steal', text: '{e} clanged open and confiscated something of {t}\'s "pending inspection."', weight: 3 },
        { name: 'door slam', kind: 'attack', mult: 1.2, text: '{e} slammed its door on {t} with institutional finality!', weight: 4 },
        { name: 'dent inward', kind: 'strong', mult: 1.45, text: '{e} threw its whole grinning bulk at {t} and dented inward!', weight: 3 },
      ],
      deathLine: 'The Foggy Locker popped open and gave everything back. Term over.',
      // years of confiscated tat spill out — a busted gizmo and a biscuit tin (§A7)
      drops: [
        { item: 'broken_gizmo', chance: 0.35 },
        { item: 'commemorative_tin', chance: 0.12 },
      ],
      sprite: 'battle_foggy_locker',
      mini: 'mini_ch3_bruiser_1',
      bg: [RAMP.BLUE, RAMP.CYAN],
    }),
    // ── 2 SOCIAL / URBAN ODDITIES (town jokes that don't make the town unsafe) ────
    E({
      id: 'tea_trolley',
      name: 'Tea Trolley',
      article: 'The',
      hp: 130,
      offense: 21,
      defense: 12,
      speed: 7,
      level: 16,
      exp: 82,
      cash: 44,
      weakness: ['freeze'],
      moves: [
        { name: 'scald', kind: 'attack', mult: 1.2, element: 'fire', text: '{e} slopped urn-tea over {t} at exactly serving temperature!', weight: 4 },
        { name: 'third biscuit', kind: 'taunt', text: '{e} offered {t} a third biscuit. Somehow, it was a threat.', weight: 3 },
        { name: 'trolley charge', kind: 'strong', mult: 1.4, text: '{e} built a full head of steam down the corridor and CHARGED!', weight: 3 },
      ],
      deathLine: 'The Tea Trolley rolled to a polite stop. "Mind how you go."',
      // it can't help serving you on the way out — a scone, jam-and-cream (§A7)
      drops: [{ item: 'scone_clotted_cream', chance: 0.25 }],
      sprite: 'battle_tea_trolley',
      mini: 'mini_ch3_caster_5',
      bg: [RAMP.PAPER, RAMP.CYAN],
    }),
    E({
      id: 'telephone_box',
      name: 'Telephone Box',
      article: 'The',
      hp: 145,
      offense: 22,
      defense: 15,
      speed: 4,
      level: 16,
      exp: 84,
      cash: 46,
      weakness: ['volt'],
      moves: [
        { name: 'dial tone', kind: 'status', status: 'hushed', text: '{e} held out a receiver of pure dial tone. {t} listened — and lost the words!', weight: 3 },
        { name: 'door swing', kind: 'attack', mult: 1.2, text: '{e} swung its heavy red door into {t} with a clunk like a verdict!', weight: 4 },
        { name: 'reverse charge', kind: 'strong', mult: 1.4, text: '{e} reversed the charges. {t} paid, in full, immediately.', weight: 3 },
      ],
      deathLine: 'The Telephone Box went off the hook for good. It had said quite enough.',
      // loose change and forgotten tat rattle in the coin slot (§A7)
      drops: [{ item: 'commemorative_tin', chance: 0.1 }],
      sprite: 'battle_telephone_box',
      mini: 'mini_ch3_bruiser_1',
      bg: [RAMP.RED, RAMP.NIGHT],
    }),
    // ── 2 RARE / HIGH-VALUE (little stories, odd spawns, joke-tied rewards) ───────
    E({
      id: 'overdue_tome',
      name: 'Overdue Tome',
      article: 'The',
      hp: 130,
      offense: 24,
      defense: 12,
      speed: 9,
      level: 18,
      exp: 130,
      cash: 60,
      weakness: ['fire'],
      moves: [
        { name: 'accrued fine', kind: 'strong', mult: 1.6, text: '{e} read {t} the fine — three centuries, compounding. It HURT.', weight: 4 },
        { name: 'shush', kind: 'status', status: 'hushed', text: '{e} shushed {t} with the whole weight of a silent library!', weight: 3 },
        { name: 'dust exhale', kind: 'attack', mult: 1.1, text: '{e} breathed three hundred years of dust over {t}!', weight: 3 },
      ],
      deathLine: 'The Overdue Tome was, at long last, returned. The fine was quietly waived.',
      // the whole point of it: a genuine, ruinously valuable first edition (§A7)
      drops: [{ item: 'first_edition', chance: 0.25 }],
      sprite: 'battle_overdue_tome',
      mini: 'mini_ch3_caster_2',
      bg: [RAMP.PURPLE, RAMP.NIGHT],
    }),
    E({
      id: 'roman_sentry',
      name: 'Roman Sentry',
      article: 'The',
      hp: 180,
      offense: 28,
      defense: 18,
      speed: 7,
      level: 18,
      exp: 140,
      cash: 72,
      weakness: [],
      moves: [
        { name: 'pilum throw', kind: 'attack', mult: 1.3, text: '{e} hurled a ghost-iron pilum nineteen centuries across the moor at {t}!', weight: 4 },
        { name: 'testudo', kind: 'shield', text: '{e} locked into a one-man tortoise. Shields, all round!', weight: 3 },
        { name: 'hold the wall', kind: 'strong', mult: 1.6, text: '{e} held the line as if Hadrian himself were still watching!', weight: 3 },
      ],
      deathLine: 'The Roman Sentry saluted the empty moor and finally, gratefully, stood down.',
      // an iron discipline left in a brown bottle for whoever outlasts him (§A7)
      drops: [{ item: 'iron_tonic', chance: 0.05 }],
      sprite: 'battle_roman_sentry',
      mini: 'mini_ch3_lurker_3',
      bg: [RAMP.EARTH, RAMP.PAPER],
    }),
    // ── 2 LATE-CHAPTER PRESSURE (remix the earlier lessons before the boss) ───────
    E({
      id: 'head_prefect',
      name: 'Head Prefect',
      article: 'The',
      hp: 175,
      offense: 27,
      defense: 15,
      speed: 12,
      level: 18,
      exp: 120,
      cash: 62,
      weakness: ['volt', 'freeze'],
      moves: [
        { name: 'detention squad', kind: 'taunt', text: '{e} raised two fingers for backup. The corridor felt suddenly fuller.', weight: 3 },
        { name: 'merit beating', kind: 'strong', mult: 1.6, text: '{e} awarded {t} negative merits — physically!', weight: 4 },
        { name: 'house spirit', kind: 'status', status: 'productive', text: '{e} demanded HOUSE SPIRIT of {t}! {t} felt obligated, and horribly PRODUCTIVE!', weight: 3 },
        { name: 'prefect glare', kind: 'attack', mult: 1.2, text: '{e} glared down a very senior nose at {t}!', weight: 3 },
      ],
      deathLine: 'The Head Prefect resigned the badge. Somewhere, a first-year exhaled.',
      // hands down the blazer and the badge — the whole office, vacated (§A7)
      drops: [
        { item: 'school_blazer', chance: 0.1 },
        { item: 'house_pin', chance: 0.2 },
      ],
      sprite: 'battle_head_prefect',
      mini: 'mini_ch3_grunt_4',
      bg: [RAMP.BLUE, RAMP.PURPLE],
    }),
    E({
      id: 'boiler_golem',
      name: 'Boiler Golem',
      article: 'The',
      hp: 190,
      offense: 29,
      defense: 14,
      speed: 6,
      level: 19,
      exp: 130,
      cash: 60,
      weakness: ['freeze'],
      moves: [
        { name: 'flue blast', kind: 'attack', mult: 1.3, element: 'fire', text: '{e} vented a flue-blast of superheated fog over {t}!', weight: 4 },
        { name: 'pressure build', kind: 'strong', mult: 1.7, text: '{e} let the gauge climb into the red — and BURST over {t}!', weight: 3 },
        { name: 'steam wrap', kind: 'status', status: 'sunburn', text: '{e} wrapped {t} in scalding machine-steam! {t} got Sunburned — indoors!', weight: 3 },
      ],
      deathLine: 'The Boiler Golem ran cold and quiet. Outside, the machine-fog thinned.',
      // crack it open and the repaired-gizmo guts spill — a coil, a wound spring (§A7)
      drops: [
        { item: 'spark_coil', chance: 0.25 },
        { item: 'cog_grenade', chance: 0.15 },
      ],
      sprite: 'battle_boiler_golem',
      mini: 'mini_ch3_caster_5',
      bg: [RAMP.ORANGE, RAMP.NIGHT],
    }),
    // ── 1 SET-PIECE (breaks the rhythm — the silent stalker of the exam hall) ─────
    E({
      id: 'the_invigilator',
      name: 'The Invigilator',
      article: '',
      hp: 200,
      offense: 30,
      defense: 16,
      speed: 8,
      level: 19,
      exp: 150,
      cash: 66,
      weakness: [],
      moves: [
        { name: 'eyes front', kind: 'attack', mult: 1.3, text: '{e} was suddenly much closer. It does that when you look away.', weight: 4 },
        { name: 'no talking', kind: 'status', status: 'hushed', text: '{e} pressed one finger to where its lips should be. {t} dared not speak!', weight: 3 },
        { name: 'pens down', kind: 'strong', mult: 1.7, text: '{e} announced "PENS DOWN" — and brought the great clock down on {t}!', weight: 3 },
      ],
      deathLine: 'The Invigilator collected the papers, nodded once, and was no longer there.',
      // a confiscated crib sheet turns out to be a perfectly balanced packed lunch (§A7)
      drops: [{ item: 'brain_food_lunch', chance: 0.05 }],
      sprite: 'battle_the_invigilator',
      mini: 'mini_ch3_lurker_3',
      bg: [RAMP.INK, RAMP.CYAN],
      // a silent exam-hall stalker can't be Puppeted — it never had a will to borrow (§A4.10)
      mind_immune: true,
    }),
    // BOSS 2 — §A6 Ch.2: IDOL OF THE GILDED GRIN. Alternates SOLID GOLD
    // (physical immune) and HOLLOW (Vibe immune), telegraphing every swap by
    // grinning wider — the form machine lives in src/data/bosses.ts over the
    // S14 phase interpreter. It eats wishes. It is never funny.
    E({
      id: 'gilded_grin',
      name: 'IDOL OF THE GILDED GRIN',
      article: 'The',
      hp: 300,
      offense: 24,
      defense: 14,
      speed: 10,
      level: 14,
      exp: 1400,
      cash: 600,
      weakness: ['freeze'],
      moves: [
        { name: 'golden gaze', kind: 'attack', mult: 1, text: '{e} looked at {t} with both empty eyes. The warmth dimmed!', weight: 4 },
        { name: 'gilded fist', kind: 'strong', mult: 1.5, text: '{e} swung a fist worth more than the village!', weight: 3 },
        { name: 'hollow toll', kind: 'attack', mult: 1.2, text: '{e} rang like a bell with nothing inside!', weight: 3 },
        { name: 'the grin', kind: 'taunt', text: '{e} grinned. it is already too wide. it keeps going.', weight: 1 },
      ],
      deathLine: 'The Idol stopped grinning. The whole valley remembered how to breathe.',
      sprite: 'battle_gilded_grin',
      mini: 'mini_mask',
      bg: [RAMP.GOLD, RAMP.NIGHT],
      boss: true,
    }),
    // BOSS 3 — §A6 Ch.3: HEADMASTER MAINFRAME (1,600 HP). Institution-as-monster:
    // installed to "optimise student happiness", Hushed, now running the school like
    // a factory and making the fog. It SUMMONS two Prefect Drones each time both are
    // down (the summon machine lives in src/data/bosses.ts over the S14 interpreter);
    // Milo's SPY reveals the cooling-fan weak point and Vibe FREEZE DOUBLES the hit —
    // the `weakMul: 2` override below makes "doubles" literal (§A6); the generic §A7
    // weakness is ×1.5, so only this foe's cooling fan reads at ×2. mind_immune:
    // a server with a nameplate has no will to borrow. The genuinely-Hush moments are
    // never funny; the bureaucratic horror is. The Gauss Lobber is its boss drop,
    // handed in the victory beat (story gear, ADR-035), so no EnemyDef.drops here.
    E({
      id: 'headmaster_mainframe',
      name: 'HEADMASTER MAINFRAME',
      article: 'The',
      hp: 750,
      offense: 31,
      defense: 18,
      speed: 9,
      level: 18,
      exp: 2000,
      cash: 800,
      weakness: ['freeze'],
      moves: [
        { name: 'reprimand', kind: 'attack', mult: 1.1, text: '{e} printed {t} a formal reprimand at 600 d.p.i. It stung more than paper has any right to.', weight: 4 },
        { name: 'optimise', kind: 'strong', mult: 1.6, text: '{e} ran {t} through an efficiency review. The findings were brutal and double-spaced.', weight: 3 },
        { name: 'extra study', kind: 'status', status: 'productive', text: '{e} assigned {t} additional self-improvement. {t} feels optimised, against every wish.', weight: 2 },
        { name: 'the watching', kind: 'taunt', text: '{e} simply watched. Every screen in the room turned, slowly, to face {t}.', weight: 1 },
      ],
      deathLine: 'The Headmaster Mainframe logged off for the last time. The fog, very slowly, began to forget how.',
      sprite: 'battle_headmaster_mainframe',
      mini: 'mini_ch3_lurker_3',
      bg: [RAMP.CYAN, RAMP.NIGHT],
      boss: true,
      mind_immune: true,
      // §A6: "Vibe Freeze doubles damage" on the cooling-fan weak point — so freeze
      // hits this foe at ×2 (the generic §A7 weakness is ×1.5; this override doubles it)
      weakMul: 2,
    }),
    // BOSS 1 — §A6: latches onto a hero and drains HP each turn until hit
    // with Vibe Fire or a thrown Salt Shaker.
    E({
      id: 'titanic_tick',
      name: 'TITANIC TICK',
      article: 'The',
      // S22 (ADR-111) — THE SLOW BURN: 450→150 HP so the fight still falls in a
      // fair ~5–8 turns now that solo Jay deals far less per swing (Vibe Surge α,
      // awakened one beat earlier, carries the burst; severing the latch costs
      // turns). EXP stays generous to keep the L8 target reachable.
      hp: 60,
      offense: 11,
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

/**
 * ADR-106 — how many foes a single battle seats. BattleScene lays the letter
 * row A–E, so a contact pack + its hop-in joiners is capped here, and the
 * overworld's encounter assembler reads this same number (one source of truth).
 */
export const MAX_BATTLE_ENEMIES = 5;

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
