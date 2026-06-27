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
    // §A7 Ch.1 SET-PIECE (S22, ADR-118 / ADR-121) — CONSTABLE BORDEN, the lone
    // Otterbrook lawman. Lightly Hushed + framed by Chad into "detaining" Jay over
    // the hill "vandalism"; he marches you toward the station and the frame-up tips
    // the Hushed cop into a fight (an OPTIONAL town beat, never a wall) — beating
    // him snaps him back to himself. By-the-book to a comic fault, a deliberate
    // RHYME with General Buckle (§A6/ADR-081). ADR-121 moved the Tick LATE, so this
    // is now a PRE-Tick scrap against SOLO Jay (Surge α, no Mia): the 70 HP ceiling
    // stays (BALANCE_CH1-3 §3), but Offense/move-pressure are tuned UP so a lone kid
    // actually feels it instead of taking 1 a swing.
    E({
      id: 'borden',
      name: 'Constable Borden',
      article: '',
      hp: 70,
      offense: 11,
      defense: 6,
      speed: 7,
      level: 6,
      exp: 40,
      cash: 30,
      weakness: [],
      moves: [
        { name: 'cite subsection', kind: 'attack', mult: 1.2, text: '{e} cited Otterbrook Municipal Code 7-B, subsection (ii)!', weight: 5 },
        { name: 'write a ticket', kind: 'strong', mult: 1.7, text: '{e} wrote {t} up for "loitering with intent to be twelve"!', weight: 4 },
        { name: 'the long arm', kind: 'strong', mult: 1.5, text: '{e} made a by-the-book GRAB — the long arm of Otterbrook law!', weight: 3 },
        { name: 'blow whistle', kind: 'taunt', text: '{e} blew the whistle. Long. Pointedly. It did not accomplish anything.', weight: 1 },
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
      // S22 (ADR-111) / ADR-121 (balance): BOSS 1, relocated LATER (the Heart Oak in
      // Pond Park) so it's fought by a stronger solo Jay (Surge α awakened, a few
      // levels of town trash behind him). Bumped 60→100 HP + offense 11→13 so it's a
      // real BOSS scrap, not a 2-turn pop. Stays on the canon ladder (BOSS_HP[1]).
      hp: 100,
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
    // §A6 / ADR-121 — THE HUSH SENTINEL. The Mars war-construct that rode the
    // meteor in: an END-GAME-TIER foreshadow you meet on the FIRST night. This is
    // a "cannot-win-alone" set-piece, NOT a money-axis boss — Glint goes supernova
    // and carries the fight while Jay's Vibe Surge α awakens mid-battle, and the
    // Sentinel is REPELLED (endBattleMercy at the scripted turn — see bosses.ts),
    // not killed. It powers down, sinks into the crater, and leaves a husk landmark
    // that wakes again FAR later (Ch.10 callback — keep it in the roster forever).
    // boss:true so its turnCount phases fire; it is deliberately NOT a CHAPTER
    // manifest boss, so it sidesteps the boss-curve / monetary-vision checks. HP is
    // a small legible floor (ADR-122) the scripted repel always pre-empts; you
    // repel a piece of Mars, you do not loot it (exp/cash 0).
    E({
      id: 'hush_sentinel',
      name: 'HUSH SENTINEL',
      article: 'The',
      // ADR-121 (balance): the Sentinel fights at FULL POWER — big imposing HP bar,
      // heavy hits — but it is REPELLED, never killed: while Glint blazes it can't be
      // reduced past 1 HP (BattleScene.damageEnemy) so a burst can't pre-empt the
      // scripted turn-5 repel, and GLINT GUARDS the party (incoming hits capped
      // non-lethal) + does the MAJORITY of the damage (glintPhase). HP is a scary
      // set-piece number, not on the §A7 small-Ch.1 band (it's an end-game Mars unit).
      hp: 240,
      offense: 28,
      defense: 18,
      speed: 16,
      level: 7,
      exp: 0,
      cash: 0,
      weakness: [],
      moves: [
        { name: 'cold rake', kind: 'attack', mult: 1.1, text: '{e} swept a segmented limb in a slow, cold arc!', weight: 4 },
        { name: 'hush pulse', kind: 'strong', mult: 1.5, text: '{e} pulsed Hush-blue light. The warmth bent away from {t}!', weight: 3 },
        { name: 'fix optic', kind: 'taunt', text: "{e}'s single optic fixed on {t}. It is deciding whether you matter.", weight: 2 },
      ],
      deathLine: 'The Hush Sentinel folded its limbs, dimmed, and sank back into the crater. Not dead. Waiting.',
      sprite: 'battle_hush_sentinel',
      mini: 'mini_hill_slug',
      bg: [RAMP.NIGHT, RAMP.PURPLE],
      boss: true,
    }),

    /* ═══════════════════════ §A7 CHAPTER 4 — NORWAY ═══════════════════════ *
     * "The Fjord That Sleeps" (Kvisthavn / Bootstep Moor / Lilleby / The
     * Sleeper's Spine). SCALE is the mechanic (§A7): some enemies aren't bigger
     * numbers, they're bigger PROBLEMS. Cold-blue palette, fire/salt the common
     * answers, the deep hum under everything. Stats sit on the Ch.4 band (L19–22,
     * curves.ts sanity). DEV-ART: the 3 authored Norway battlers (snail/gull/
     * berry) wear their own keys; the rest GRAY-BOX on shipped battlers (ADR-119
     * pattern — own EnemyDef, borrowed face) until the art pass lands each PNG. */

    /* ---- the §A7 SEED SIX (the chapter's anchors) ---- */
    E({
      id: 'colossal_gnat',
      name: 'Colossal Gnat',
      article: 'The',
      hp: 90, offense: 24, defense: 8, speed: 22, level: 19, exp: 95, cash: 48,
      weakness: ['fire'],
      moves: [
        { name: 'whine', kind: 'attack', mult: 1, text: '{e} whined past {t}\'s ear at the exact worst pitch!', weight: 5 },
        { name: 'eye dive', kind: 'status', status: 'crying', text: '{e} dove straight for {t}\'s eyes!', weight: 3 },
        { name: 'gnat bite', kind: 'attack', mult: 1.2, text: '{e} bit {t} with surprising commitment!', weight: 3 },
        { name: 'drone', kind: 'taunt', text: '{e} circled, droning, just out of reach.', weight: 1 },
      ],
      deathLine: 'The Colossal Gnat was, at last, swatted. It took both hands and a rolled-up newspaper.',
      sprite: 'battle_colossal_gnat', mini: 'mini_colossal_gnat',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),
    E({
      id: 'knitting_needles',
      name: 'Runaway Knitting Needles',
      article: 'The',
      hp: 175, offense: 28, defense: 14, speed: 16, level: 20, exp: 130, cash: 60,
      weakness: ['fire', 'volt'],
      moves: [
        { name: 'purl two', kind: 'attack', mult: 1, text: '{e} jabbed at {t} — knit one, purl {t}!', weight: 5 },
        { name: 'drop a stitch', kind: 'status', status: 'paralyzed', text: '{e} laced {t} up tight in a half-finished sleeve!', weight: 3 },
        { name: 'cast on', kind: 'strong', mult: 1.6, text: '{e} wound up a whole row and let {t} have it!', weight: 3 },
        { name: 'clack', kind: 'taunt', text: '{e} clacked together, ten to the dozen.', weight: 1 },
      ],
      deathLine: 'The Runaway Knitting Needles unravelled. Somewhere, an unfinished sweater sighed with relief.',
      sprite: 'battle_knitting_needles', mini: 'mini_knitting_needles',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),
    E({
      id: 'thunder_snail',
      name: 'Thunder Snail',
      article: 'The',
      // slow on the field, hits like weather in the fight (§A7 Ch.4)
      hp: 230, offense: 34, defense: 20, speed: 5, level: 21, exp: 175, cash: 78,
      weakness: ['salt'],
      moves: [
        { name: 'slow roll', kind: 'attack', mult: 1.1, text: '{e} rolled over {t} with the patience of geology!', weight: 4 },
        { name: 'thunderhead', kind: 'strong', mult: 1.7, text: '{e} pulled a whole storm out of its shell and dropped it on {t}!', weight: 3 },
        { name: 'squall', kind: 'status', status: 'crying', text: '{e} kicked up a stinging squall of grit and rain!', weight: 2 },
        { name: 'rumble', kind: 'taunt', text: '{e} rumbled, low and far-off. The light went grey.', weight: 1 },
      ],
      deathLine: 'The Thunder Snail rolled on, unhurried. The forecast cleared by evening.',
      drops: [{ item: 'amber_chunk', chance: 0.1 }],
      sprite: 'battle_thunder_snail', mini: 'mini_thunder_snail',
      bg: [RAMP.BLUE, RAMP.CYAN],
    }),
    E({
      id: 'dog_sized_berry',
      name: 'Dog-Sized Berry',
      article: 'The',
      // poses as a roadside pickup; heals itself if you let the fight drag (§A7)
      hp: 160, offense: 22, defense: 12, speed: 10, level: 20, exp: 150, cash: 70,
      weakness: ['fire'],
      moves: [
        { name: 'play dead', kind: 'taunt', text: '{e} sat very still, pretending to be lunch.', weight: 2 },
        { name: 'sun-ripen', kind: 'mend', text: '{e} drank a little sun and plumped back up!', weight: 3 },
        { name: 'roll over', kind: 'attack', mult: 1.1, text: '{e} rolled over {t} like a boulder of jam!', weight: 4 },
        { name: 'squish', kind: 'strong', mult: 1.5, text: '{e} squashed {t} flat and left a stain!', weight: 2 },
      ],
      deathLine: 'The Dog-Sized Berry burst at last. It was, after everything, just a berry. A very large, very rude berry.',
      drops: [{ item: 'dog_sized_berry', chance: 0.5 }],
      sprite: 'battle_giant_berry_blocker', mini: 'mini_giant_berry_blocker',
      bg: [RAMP.MAGENTA, RAMP.RED],
    }),
    E({
      id: 'hushed_gull',
      name: 'Hushed Gull, Enormous',
      article: 'The',
      hp: 200, offense: 26, defense: 12, speed: 18, level: 21, exp: 160, cash: 72,
      weakness: ['salt'],
      moves: [
        { name: 'dive', kind: 'attack', mult: 1.1, text: '{e} folded its wings and dropped on {t} like a thrown anchor!', weight: 4 },
        { name: 'snatch', kind: 'steal', text: '{e} snatched a snack right out of {t}\'s hands!', weight: 3 },
        { name: 'screech', kind: 'status', status: 'hushed', text: '{e} screamed the kind of scream that takes your voice with it!', weight: 2 },
        { name: 'wheel', kind: 'taunt', text: '{e} wheeled overhead, sizing up the chips.', weight: 1 },
      ],
      deathLine: 'The Hushed Gull, Enormous gave back the chip and left in a huff of feathers the size of oars.',
      drops: [{ item: 'pickled_herring', chance: 0.4 }, { item: 'stockfish_bundle', chance: 0.15 }],
      sprite: 'battle_fjord_gull_bully', mini: 'mini_fjord_gull_bully',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),
    E({
      id: 'junior_jotun',
      name: 'Junior Jötun',
      article: 'The',
      // a baby frost-giant; grabs a hero and won't let go (§A7 "grabs a hero")
      hp: 260, offense: 32, defense: 22, speed: 8, level: 22, exp: 190, cash: 80,
      weakness: ['fire'],
      moves: [
        { name: 'big grab', kind: 'status', status: 'paralyzed', text: '{e} closed one enormous cold fist around {t}!', weight: 3 },
        { name: 'boulder drop', kind: 'strong', mult: 1.7, text: '{e} dropped a boulder it had been using as a marble on {t}!', weight: 3 },
        { name: 'stomp', kind: 'attack', mult: 1.1, text: '{e} stomped, and the whole moor jumped — {t} most of all!', weight: 3 },
        { name: 'yawn', kind: 'taunt', text: '{e} yawned. It was a weather event.', weight: 1 },
      ],
      deathLine: 'The Junior Jötun sat down hard, decided it would rather nap, and did. Fair enough.',
      drops: [{ item: 'giants_banknote', chance: 0.1 }, { item: 'silver_hoard', chance: 0.12 }],
      sprite: 'battle_junior_jotun', mini: 'mini_junior_jotun',
      bg: [RAMP.BLUE, RAMP.CYAN],
    }),

    /* ---- FOUR road/field roamers (Bootstep Moor — scale comedy) ---- */
    E({
      id: 'moor_midge_cloud',
      name: 'Moor-Midge Cloud',
      article: 'The',
      hp: 70, offense: 16, defense: 6, speed: 20, level: 19, exp: 70, cash: 35,
      weakness: ['fire'],
      moves: [
        { name: 'cloud up', kind: 'attack', mult: 1, text: '{e} swallowed {t} whole in a haze of tiny wings!', weight: 5 },
        { name: 'in your eyes', kind: 'status', status: 'crying', text: '{e} got everywhere a midge can get!', weight: 3 },
        { name: 'a thousand bites', kind: 'attack', mult: 1.2, text: '{e} bit {t} a thousand times, fairly, in turn!', weight: 2 },
      ],
      deathLine: 'The Moor-Midge Cloud dispersed on the next gust, grumbling in a thousand tiny voices.',
      sprite: 'battle_moor_midge_cloud', mini: 'mini_moor_midge_cloud',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),
    E({
      id: 'boulder_lichen',
      name: 'Boulder-Lichen',
      article: 'The',
      hp: 240, offense: 24, defense: 26, speed: 4, level: 21, exp: 160, cash: 70,
      weakness: ['salt'],
      moves: [
        { name: 'shrug loose', kind: 'attack', mult: 1.1, text: '{e} shrugged a few tons of itself onto {t}!', weight: 4 },
        { name: 'great roll', kind: 'strong', mult: 1.7, text: '{e} got rolling, and rolling is hard to argue with!', weight: 3 },
        { name: 'settle', kind: 'taunt', text: '{e} settled, slowly, into being scenery again.', weight: 2 },
      ],
      deathLine: 'The Boulder-Lichen rolled to a stop and went back to pretending it had never moved at all.',
      drops: [{ item: 'amber_chunk', chance: 0.08 }],
      sprite: 'battle_boulder_lichen', mini: 'mini_boulder_lichen',
      bg: [RAMP.BLUE, RAMP.CYAN],
    }),
    E({
      id: 'frost_hare',
      name: 'Enormous Frost-Hare',
      article: 'The',
      hp: 150, offense: 30, defense: 12, speed: 24, level: 20, exp: 130, cash: 60,
      weakness: ['fire'],
      moves: [
        { name: 'thumper kick', kind: 'strong', mult: 1.6, text: '{e} kicked with both hind legs and sent {t} skidding!', weight: 4 },
        { name: 'bound', kind: 'attack', mult: 1.1, text: '{e} bounded clean over {t} and clipped them coming down!', weight: 4 },
        { name: 'nose twitch', kind: 'taunt', text: '{e} twitched its nose, deeply unimpressed.', weight: 2 },
      ],
      deathLine: 'The Enormous Frost-Hare bounded off across the moor, ears flat, thoroughly done with the lot of you.',
      sprite: 'battle_frost_hare', mini: 'mini_frost_hare',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),
    E({
      id: 'bog_cotton_wisp',
      name: 'Bog-Cotton Wisp',
      article: 'The',
      // a weather-sized nuisance that drifts across paths like a moving wall (§A7)
      hp: 120, offense: 18, defense: 10, speed: 14, level: 19, exp: 110, cash: 55,
      weakness: ['fire'],
      moves: [
        { name: 'drift across', kind: 'attack', mult: 1, text: '{e} drifted across {t}, soft and smothering!', weight: 4 },
        { name: 'lullaby fluff', kind: 'status', status: 'asleep', text: '{e} settled over {t} like the world\'s most boring blanket!', weight: 3 },
        { name: 'gather', kind: 'taunt', text: '{e} gathered itself, fluffier and somehow larger.', weight: 2 },
      ],
      deathLine: 'The Bog-Cotton Wisp came apart into seeds and floated off to clog some other path entirely.',
      sprite: 'battle_bog_cotton_wisp', mini: 'mini_bog_cotton_wisp',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),

    /* ---- THREE dungeon specialists (The Sleeper's Spine — body terrain) ---- */
    E({
      id: 'earwax_golem',
      name: 'Earwax Amber Golem',
      article: 'The',
      hp: 235, offense: 30, defense: 24, speed: 7, level: 21, exp: 175, cash: 75,
      weakness: ['fire'],
      moves: [
        { name: 'amber fist', kind: 'strong', mult: 1.6, text: '{e} swung a fist of warm gold amber at {t}!', weight: 4 },
        { name: 'seal the canal', kind: 'status', status: 'hushed', text: '{e} packed {t}\'s ears with wax — the world went muffled and small!', weight: 3 },
        { name: 'grind', kind: 'attack', mult: 1.1, text: '{e} ground {t} against the canal wall!', weight: 2 },
        { name: 'drip', kind: 'taunt', text: '{e} dripped, slow and golden, and waited.', weight: 1 },
      ],
      deathLine: 'The Earwax Amber Golem melted back into the warm dark of the canal, taking its grudge with it.',
      drops: [{ item: 'amber_chunk', chance: 0.1 }, { item: 'firecracker_string', chance: 0.25 }],
      sprite: 'battle_earwax_golem', mini: 'mini_earwax_golem',
      bg: [RAMP.BLUE, RAMP.CYAN],
    }),
    E({
      id: 'dream_leech',
      name: 'Dream-Leech',
      article: 'The',
      hp: 130, offense: 24, defense: 12, speed: 16, level: 20, exp: 150, cash: 70,
      weakness: ['salt'],
      moves: [
        { name: 'sip a dream', kind: 'drain', mult: 1, text: '{e} sipped a warm dream straight out of {t}!', weight: 4 },
        { name: 'nightmare nip', kind: 'attack', mult: 1.2, text: '{e} nipped {t} with a mouthful of bad dreams!', weight: 3 },
        { name: 'lull', kind: 'status', status: 'asleep', text: '{e} hummed the Sleeper\'s own breathing at {t}...', weight: 2 },
      ],
      deathLine: 'The Dream-Leech let go, fat and dozy, and rolled off into the Sleeper\'s dreams to digest.',
      drops: [{ item: 'salve_of_arnica', chance: 0.2 }],
      sprite: 'battle_dream_leech', mini: 'mini_dream_leech',
      bg: [RAMP.PURPLE, RAMP.NIGHT],
    }),
    E({
      id: 'snore_gust',
      name: 'Snore-Gust',
      article: 'The',
      hp: 110, offense: 22, defense: 10, speed: 20, level: 20, exp: 140, cash: 65,
      weakness: ['volt'],
      moves: [
        { name: 'gust', kind: 'attack', mult: 1.1, text: '{e} blasted {t} with one warm sleeping breath!', weight: 4 },
        { name: 'the big exhale', kind: 'strong', mult: 1.6, text: '{e} wound up the Sleeper\'s biggest snore yet and let it OUT!', weight: 3 },
        { name: 'warm fug', kind: 'status', status: 'asleep', text: '{e} wrapped {t} in a fug so cozy their eyes drooped...', weight: 2 },
        { name: 'whistle', kind: 'taunt', text: '{e} whistled through a giant nostril, far above.', weight: 1 },
      ],
      deathLine: 'The Snore-Gust faded as the Sleeper breathed back in. In, and out. In, and out.',
      drops: [{ item: 'firecracker_string', chance: 0.25 }],
      sprite: 'battle_snore_gust', mini: 'mini_snore_gust',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),

    /* ---- TWO social/urban oddities (Lilleby, the giants' town) ---- */
    E({
      id: 'giant_house_cat',
      name: 'Giant House-Cat',
      article: 'The',
      // ordinary to them, a kaiju to you — a quiet seed for Ch.5's Whiskerzilla
      hp: 220, offense: 28, defense: 16, speed: 16, level: 21, exp: 165, cash: 72,
      weakness: ['salt'],
      moves: [
        { name: 'idle swat', kind: 'attack', mult: 1.1, text: '{e} swatted {t} the way you\'d swat a fly — idly, devastatingly!', weight: 4 },
        { name: 'pounce', kind: 'strong', mult: 1.7, text: '{e} POUNCED, and the floor became the ceiling for {t}!', weight: 3 },
        { name: 'knead', kind: 'status', status: 'paralyzed', text: '{e} kneaded {t} into the rug, purring, pinning them flat!', weight: 2 },
        { name: 'purr', kind: 'taunt', text: '{e} purred. The windows buzzed in their frames.', weight: 1 },
      ],
      deathLine: 'The Giant House-Cat lost interest entirely and went to sit in a sunbeam the size of a tennis court.',
      sprite: 'battle_giant_house_cat', mini: 'mini_giant_house_cat',
      bg: [RAMP.GOLD, RAMP.RED],
    }),
    E({
      id: 'lost_mitten',
      name: 'Lost Giant Mitten',
      article: 'The',
      hp: 150, offense: 22, defense: 14, speed: 12, level: 20, exp: 130, cash: 60,
      weakness: ['fire'],
      moves: [
        { name: 'flop', kind: 'attack', mult: 1.1, text: '{e} flopped onto {t} with a damp woollen WHUMP!', weight: 4 },
        { name: 'grab for a hand', kind: 'status', status: 'paralyzed', text: '{e} swallowed {t} up to the elbow, looking for a hand to hold!', weight: 3 },
        { name: 'wring', kind: 'strong', mult: 1.5, text: '{e} wrung itself out all over {t}!', weight: 2 },
      ],
      deathLine: 'The Lost Giant Mitten went limp. It only ever wanted its other half. (Someone should file a form.)',
      drops: [{ item: 'reindeer_mittens', chance: 0.15 }],
      sprite: 'battle_lost_mitten', mini: 'mini_lost_mitten',
      bg: [RAMP.CYAN, RAMP.BLUE],
    }),

    /* ---- TWO rare / high-value (little stories, the wealth wink) ---- */
    E({
      id: 'amber_hoard_troll',
      name: 'Amber-Hoard Troll',
      article: 'The',
      hp: 165, offense: 24, defense: 16, speed: 12, level: 21, exp: 210, cash: 85,
      weakness: ['fire'],
      moves: [
        { name: 'clutch the hoard', kind: 'taunt', text: '{e} pulled its amber close and glared at {t}.', weight: 3 },
        { name: 'amber chuck', kind: 'strong', mult: 1.7, text: '{e} hurled a fist-sized lump of fossil sunshine at {t}!', weight: 3 },
        { name: 'scrabble', kind: 'attack', mult: 1.1, text: '{e} scrabbled at {t} with stubby, greedy fingers!', weight: 3 },
      ],
      deathLine: 'The Amber-Hoard Troll scattered its treasure and dove under a rock — heartbroken, and a great deal poorer.',
      drops: [{ item: 'amber_chunk', chance: 0.12 }, { item: 'silver_hoard', chance: 0.15 }],
      sprite: 'battle_amber_hoard_troll', mini: 'mini_amber_hoard_troll',
      bg: [RAMP.GOLD, RAMP.RED],
    }),
    E({
      id: 'aurora_moth',
      name: 'Aurora Moth',
      article: 'The',
      hp: 130, offense: 22, defense: 12, speed: 26, level: 21, exp: 200, cash: 84,
      weakness: ['salt'],
      moves: [
        { name: 'blinding wings', kind: 'status', status: 'crying', text: '{e} beat wings of cold green light right in {t}\'s face!', weight: 3 },
        { name: 'wing dust', kind: 'attack', mult: 1.2, text: '{e} shook a shimmer of dust over {t}!', weight: 3 },
        { name: 'flutter off', kind: 'taunt', text: '{e} drifted higher, harder to catch, brighter to see.', weight: 3 },
      ],
      deathLine: 'The Aurora Moth lifted off and drew one slow ribbon of light across the dark before it was gone.',
      drops: [{ item: 'amber_drop', chance: 0.1 }],
      sprite: 'battle_aurora_moth', mini: 'mini_aurora_moth',
      bg: [RAMP.PURPLE, RAMP.CYAN],
    }),

    /* ---- TWO late-chapter pressure (earlier lessons, one nasty twist) ---- */
    E({
      id: 'hushed_skua',
      name: 'Hushed Skua',
      article: 'The',
      hp: 210, offense: 30, defense: 14, speed: 20, level: 22, exp: 185, cash: 82,
      weakness: ['salt'],
      moves: [
        { name: 'strafe', kind: 'strong', mult: 1.6, text: '{e} came in low and fast and raked {t}!', weight: 4 },
        { name: 'snatch', kind: 'steal', text: '{e} robbed {t} mid-dive, just to prove the gull could!', weight: 3 },
        { name: 'shriek', kind: 'status', status: 'hushed', text: '{e} loosed a shriek that stole the words off {t}\'s tongue!', weight: 2 },
        { name: 'wheel', kind: 'status', status: 'crying', text: '{e} kicked salt spray into {t}\'s eyes!', weight: 1 },
      ],
      deathLine: 'The Hushed Skua dropped what it stole and screamed away over the grey water.',
      drops: [{ item: 'stockfish_bundle', chance: 0.15 }],
      sprite: 'battle_hushed_skua', mini: 'mini_hushed_skua',
      bg: [RAMP.BLUE, RAMP.CYAN],
    }),
    E({
      id: 'frost_jotun_elder',
      name: 'Frost-Jötun Elder',
      article: 'The',
      hp: 290, offense: 34, defense: 24, speed: 9, level: 22, exp: 200, cash: 86,
      weakness: ['fire'],
      moves: [
        { name: 'two-handed grab', kind: 'status', status: 'paralyzed', text: '{e} caught {t} up in both hands like a doll!', weight: 3 },
        { name: 'avalanche', kind: 'strong', mult: 1.8, text: '{e} brought a whole hillside of snow down on {t}!', weight: 3 },
        { name: 'backhand', kind: 'attack', mult: 1.2, text: '{e} backhanded {t} clear across the spine!', weight: 3 },
        { name: 'groan', kind: 'taunt', text: '{e} groaned, and you understood, suddenly, where mountains come from.', weight: 1 },
      ],
      deathLine: 'The Frost-Jötun Elder lay back against the slope and was, once more, just part of the mountain.',
      drops: [{ item: 'giants_banknote', chance: 0.1 }, { item: 'silver_hoard', chance: 0.12 }],
      sprite: 'battle_frost_jotun_elder', mini: 'mini_frost_jotun_elder',
      bg: [RAMP.BLUE, RAMP.CYAN],
    }),

    /* ---- ONE set-piece (breaks the rhythm: a berry that blocks the bridge) ---- */
    E({
      id: 'bridge_berry',
      name: 'Bridge Berry',
      article: 'The',
      // a wall with a stem: it blocks the gorge bridge until fought or rolled aside
      hp: 300, offense: 18, defense: 24, speed: 4, level: 22, exp: 220, cash: 80,
      weakness: ['fire'],
      moves: [
        { name: 'block the way', kind: 'taunt', text: '{e} settled deeper into the bridge mouth. It was not moving.', weight: 3 },
        { name: 'great roll', kind: 'strong', mult: 1.7, text: '{e} tipped forward and rolled the length of the planks at {t}!', weight: 3 },
        { name: 'squash', kind: 'attack', mult: 1.2, text: '{e} leaned its whole weight onto {t}!', weight: 3 },
      ],
      deathLine: 'The Bridge Berry rolled aside at last, leaving one long red smear and a clear path over the gorge.',
      drops: [{ item: 'dog_sized_berry', chance: 0.4 }],
      sprite: 'battle_giant_berry_blocker', mini: 'mini_giant_berry_blocker',
      bg: [RAMP.MAGENTA, RAMP.RED],
    }),

    /* ---- BOSS 4 — THE WHISPERWIG (§A6 Ch.4, 1,800 HP) ---- *
     * Burrows in the Sleeper's ear canal — UNTARGETABLE until NOISE forces it out
     * (Vibe Volt / a Firecracker String / Milo's Bottle Rockets). Every 3rd turn it
     * whispers party-wide Hushed pressure. MIA AWAKENS VIBE VOLT α the first time it
     * surfaces (the thunder-snore in her teeth — bosses.ts `awakeningOnForm`). Weak
     * to volt (the noise that answers it). The fight runs off bosses.ts +
     * BattleScene's noiseOut/targetable wiring; mind_immune like every boss. */
    E({
      id: 'the_whisperwig',
      name: 'THE WHISPERWIG',
      article: 'The',
      hp: 1800, offense: 36, defense: 18, speed: 12, level: 22, exp: 2400, cash: 900,
      weakness: ['volt'],
      moves: [
        { name: 'whisper', kind: 'status', status: 'hushed', text: '{e} whispered something into {t}\'s ear that took the words right out of their mouth.', weight: 3 },
        { name: 'probe', kind: 'attack', mult: 1.1, text: '{e} pressed deeper into the canal. {t} shuddered to the bone!', weight: 4 },
        { name: 'needle', kind: 'strong', mult: 1.6, text: '{e} drove a single bristle through {t} like a hot wire!', weight: 3 },
        { name: 'burrow', kind: 'taunt', text: '{e} dug deeper, out of reach, and the whispering went on.', weight: 2 },
      ],
      deathLine: 'The Whisperwig let go of the ear at last. In the new quiet, the Sleeper\'s breathing was the only sound — slow, even, and finally at peace.',
      sprite: 'battle_the_whisperwig', mini: 'mini_souvenir',
      bg: [RAMP.NIGHT, RAMP.PURPLE],
      boss: true,
      mind_immune: true,
    }),

    /* ═══════════════════════ §A7 CHAPTER 5 — MINIMUS ═══════════════════════ *
     * The Grand Duchy of Minimus, shrunk to 1/100 (§A6/§A7). Tiny-but-PROCEDURAL:
     * enemies fight in FORMATIONS, take VOTES, and exploit the party's huge
     * hitboxes. Smallness is never weakness — it's procedure. The roster keeps the
     * §A7 seed six (Tin Parade, Duelist Pip, Crumb Cannoneer, Powder-Wig Wasp,
     * Wind-Up Wyrmlet, Dust Bunny of Unusual Size) and expands to the Flow-Law 20.
     * On-curve HP (Ch.5 mid 193; ~95–360 band); citizens are never damaged — the
     * danger is embarrassment, paperwork, and (at the Crown) a housecat. Death
     * lines render RAW (literal canon names). Each GRAY-BOXES on a reused face. */

    /* ---- the §A7 SEED SIX (GAME_BIBLE §A7 Ch.5 anchors) ---- */
    E({
      id: 'tin_parade',
      name: 'Tin Parade',
      article: 'The',
      // a column of a dozen wind-up tin soldiers that march, halt, and fire as ONE
      hp: 140, offense: 28, defense: 14, speed: 18, level: 23, exp: 130, cash: 28,
      weakness: ['volt'],
      moves: [
        { name: 'present arms', kind: 'taunt', text: '{e} snapped into a square and presented a hedge of matchstick bayonets.', weight: 2 },
        { name: 'volley', kind: 'strong', mult: 1.5, text: '{e} fired a single, perfectly-drilled volley at {t}!', weight: 3 },
        { name: 'quick march', kind: 'attack', mult: 1, text: '{e} marched over {t} in lockstep, apologizing the whole way.', weight: 4 },
      ],
      deathLine: 'The Tin Parade broke ranks and toppled like a dozen dominoes. Someone will have to stand them all up again, by hand, in order.',
      drops: [{ item: 'tin_soldier', chance: 0.18 }],
      sprite: 'battle_tin_parade', mini: 'mini_tin_parade',
      bg: [RAMP.RED, RAMP.GOLD],
    }),
    E({
      id: 'duelist_pip',
      name: 'Duelist Pip',
      article: 'The',
      // minuscule and FORMAL — salutes, ripostes, demands satisfaction in writing
      hp: 165, offense: 34, defense: 12, speed: 28, level: 24, exp: 160, cash: 40,
      weakness: [],
      moves: [
        { name: 'en garde', kind: 'taunt', text: '{e} saluted with a pin-sized rapier and raised an immaculate guard.', weight: 2 },
        { name: 'riposte', kind: 'strong', mult: 1.6, text: '{e} turned {t}\'s own clumsy swing into a flashing counter!', weight: 3 },
        { name: 'pinprick', kind: 'attack', mult: 1.1, text: '{e} scored a touch on {t} too quick to see!', weight: 4 },
      ],
      deathLine: 'Duelist Pip bowed, acknowledged the touch, and stalked off to demand a rematch by certified mail.',
      drops: [{ item: 'needle_saber', chance: 0.06 }],
      sprite: 'battle_duelist_pip', mini: 'mini_duelist_pip',
      bg: [RAMP.PURPLE, RAMP.GOLD],
    }),
    E({
      id: 'crumb_cannoneer',
      name: 'Crumb Cannoneer',
      article: 'The',
      // loads the rations you DROPPED and fires them right back at you
      hp: 200, offense: 30, defense: 16, speed: 14, level: 24, exp: 170, cash: 36,
      weakness: ['fire'],
      moves: [
        { name: 'load the crumb', kind: 'taunt', text: '{e} rammed a biscuit-crumb down the barrel and sighted along it.', weight: 2 },
        { name: 'return fire', kind: 'strong', mult: 1.5, text: '{e} fired {t}\'s own rations back at full muzzle velocity!', weight: 3 },
        { name: 'grapeshot', kind: 'attack', mult: 1, text: '{e} sprayed {t} with a scattering of stale grapeshot!', weight: 4 },
      ],
      deathLine: 'The Crumb Cannoneer ran out of ammunition, which is to say snacks, and surrendered with great and crumby dignity.',
      drops: [{ item: 'crumb_loaf', chance: 0.25 }],
      sprite: 'battle_crumb_cannoneer', mini: 'mini_crumb_cannoneer',
      bg: [RAMP.EARTH, RAMP.GOLD],
    }),
    E({
      id: 'powderwig_wasp',
      name: 'Powder-Wig Wasp',
      article: 'The',
      // a courtier-wasp in a powdered wig; its minuet drone lulls you to sleep
      hp: 170, offense: 29, defense: 13, speed: 24, level: 24, exp: 165, cash: 38,
      weakness: ['insect'],
      moves: [
        { name: 'courtly drone', kind: 'status', status: 'asleep', text: '{e} hummed a soporific minuet, and {t}\'s eyelids grew very heavy...', weight: 3 },
        { name: 'wig powder', kind: 'status', status: 'crying', text: '{e} shook its wig and gave {t} a faceful of scented powder!', weight: 2 },
        { name: 'court sting', kind: 'attack', mult: 1.2, text: '{e} delivered a sting with a flourish and a tiny bow!', weight: 3 },
      ],
      deathLine: 'The Powder-Wig Wasp was unseated from the air. Its wig landed first, and with considerably more ceremony.',
      drops: [{ item: 'powder_wig_dust', chance: 0.2 }],
      sprite: 'battle_powderwig_wasp', mini: 'mini_powderwig_wasp',
      bg: [RAMP.PAPER, RAMP.PURPLE],
    }),
    E({
      id: 'windup_wyrmlet',
      name: 'Wind-Up Wyrmlet',
      article: 'The',
      // a clockwork dragon-toy that overwinds its own key, then lets the spring GO
      hp: 185, offense: 27, defense: 15, speed: 26, level: 25, exp: 175, cash: 42,
      weakness: ['volt'],
      moves: [
        { name: 'wind up', kind: 'taunt', text: '{e} cranked its own key one menacing notch tighter.', weight: 2 },
        { name: 'unwind', kind: 'strong', mult: 1.7, text: '{e} let the whole overwound spring go at {t} at once!', weight: 3 },
        { name: 'clockwork nip', kind: 'attack', mult: 1, text: '{e} nipped {t} with a little brass overbite.', weight: 4 },
      ],
      deathLine: 'The Wind-Up Wyrmlet wound down with a long descending whir and one final, disappointed tick.',
      sprite: 'battle_windup_wyrmlet', mini: 'mini_windup_wyrmlet',
      bg: [RAMP.GOLD, RAMP.RED],
    }),
    E({
      id: 'dust_bunny',
      name: 'Dust Bunny of Unusual Size',
      article: 'The',
      // a fuzzy under-the-throne dust ball that SPLITS into two indignant halves
      hp: 150, offense: 25, defense: 10, speed: 20, level: 23, exp: 140, cash: 26,
      weakness: ['fire'],
      moves: [
        { name: 'split', kind: 'taunt', text: '{e} divided into two smaller, equally indignant bunnies.', weight: 2 },
        { name: 'lint lash', kind: 'attack', mult: 1.1, text: '{e} lashed {t} with a whip of compacted lint!', weight: 4 },
        { name: 'sneeze cloud', kind: 'status', status: 'crying', text: '{e} burst into a cloud of dust that set {t}\'s eyes streaming!', weight: 3 },
      ],
      deathLine: 'The Dust Bunny of Unusual Size came apart into ordinary dust, which the duchy swept up and filed under "Resolved."',
      sprite: 'battle_dust_bunny', mini: 'mini_dust_bunny',
      bg: [RAMP.EARTH, RAMP.PAPER],
    }),

    /* ---- 4 road/field roamers — the Procession Way ---- */
    E({
      id: 'whistle_guard',
      name: 'Whistle Guard',
      article: 'The',
      // thumb-high constable; halts you "by the book" and blows for a second
      hp: 200, offense: 28, defense: 18, speed: 16, level: 23, exp: 145, cash: 30,
      weakness: [],
      moves: [
        { name: 'by the book', kind: 'taunt', text: '{e} read {t} the relevant bylaw and blew a shrill whistle for backup.', weight: 3 },
        { name: 'matchstick baton', kind: 'attack', mult: 1.2, text: '{e} rapped {t} smartly across the shin with a matchstick truncheon!', weight: 4 },
        { name: 'HALT', kind: 'strong', mult: 1.5, text: '{e} bellowed "HALT, IN THE NAME OF THE DUCHESS!" with the force of its whole tiny lungs!', weight: 2 },
      ],
      deathLine: 'The Whistle Guard blew one last plaintive note and went to file an incident report roughly the size of a postage stamp.',
      sprite: 'battle_whistle_guard', mini: 'mini_whistle_guard',
      bg: [RAMP.BLUE, RAMP.GOLD],
    }),
    E({
      id: 'census_pigeon',
      name: 'Census Pigeon',
      article: 'The',
      // parade-balloon-huge to them, an ordinary pigeon to you; steals snacks
      hp: 160, offense: 26, defense: 12, speed: 27, level: 23, exp: 135, cash: 28,
      weakness: ['volt'],
      moves: [
        { name: 'shoelace peck', kind: 'attack', mult: 1, text: '{e} pecked furiously at {t}\'s enormous shoelaces!', weight: 4 },
        { name: 'crumb snatch', kind: 'steal', text: '{e} made off with one of {t}\'s snacks in its beak!', weight: 2 },
        { name: 'roost', kind: 'taunt', text: '{e} settled on {t}\'s head, blotting out the sun over three city blocks.', weight: 3 },
      ],
      deathLine: 'The Census Pigeon was officially counted, found the experience deeply offensive, and flapped off to be uncounted elsewhere.',
      sprite: 'battle_census_pigeon', mini: 'mini_census_pigeon',
      bg: [RAMP.CYAN, RAMP.PAPER],
    }),
    E({
      id: 'toll_clerk',
      name: 'Toll Clerk',
      article: 'The',
      // spends a turn "taking a vote" on your fine, then garnishes your wallet
      hp: 175, offense: 27, defense: 16, speed: 15, level: 24, exp: 155, cash: 34,
      weakness: [],
      moves: [
        { name: 'take a vote', kind: 'taunt', text: '{e} convened a one-clerk committee to deliberate {t}\'s penalty.', weight: 3 },
        { name: 'levy a fine', kind: 'stealcash', text: '{e} assessed {t} an immediate and very official toll!', weight: 3 },
        { name: 'official stamp', kind: 'attack', mult: 1.1, text: '{e} brought a rubber stamp down on {t} with a resounding, bureaucratic THUMP!', weight: 3 },
      ],
      deathLine: 'The Toll Clerk\'s committee voted unanimously to adjourn. It collected its little podium and filed out in good order.',
      drops: [{ item: 'royal_doubloon_tiny', chance: 0.15 }],
      sprite: 'battle_toll_clerk', mini: 'mini_toll_clerk',
      bg: [RAMP.GOLD, RAMP.PURPLE],
    }),
    E({
      id: 'cobble_mite',
      name: 'Cobble Mite',
      article: 'The',
      // hides between cobbles where big feet WHIFF — Pippa's Pinpoint Mark fixes it
      hp: 95, offense: 30, defense: 8, speed: 26, level: 23, exp: 150, cash: 32,
      weakness: ['insect'],
      moves: [
        { name: 'cobble dive', kind: 'taunt', text: '{e} dropped into the gap between two stones; {t}\'s great swing whiffed clean over it.', weight: 3 },
        { name: 'ankle nip', kind: 'attack', mult: 1.2, text: '{e} darted out and nipped {t} at the ankle before vanishing again!', weight: 4 },
        { name: 'gravel spray', kind: 'status', status: 'crying', text: '{e} kicked up a spray of grit into {t}\'s eyes!', weight: 2 },
      ],
      deathLine: 'The Cobble Mite was finally pinned between two stones. Up close it was almost cute. Almost.',
      sprite: 'battle_cobble_mite', mini: 'mini_cobble_mite',
      bg: [RAMP.EARTH, RAMP.FOREST],
    }),

    /* ---- 3 dungeon specialists — The Hedgerow ---- */
    E({
      id: 'hedge_sprite',
      name: 'Hedge Sprite',
      article: 'The',
      // leaf-clad duelist; ambushes from the maze shadows, then melts back in
      hp: 220, offense: 33, defense: 16, speed: 24, level: 25, exp: 190, cash: 44,
      weakness: ['fire'],
      moves: [
        { name: 'ambush', kind: 'strong', mult: 1.6, text: '{e} dropped out of the hedge wall onto {t} from nowhere!', weight: 3 },
        { name: 'leaf-blade', kind: 'attack', mult: 1.2, text: '{e} slashed {t} with a blade honed from a single privet leaf!', weight: 4 },
        { name: 'rustle', kind: 'taunt', text: '{e} melted back into the green, leaving only a guilty rustle.', weight: 2 },
      ],
      deathLine: 'The Hedge Sprite dissolved back into the hedge, leaving one drifting leaf and the strong sense it was still watching.',
      sprite: 'battle_hedge_sprite', mini: 'mini_hedge_sprite',
      bg: [RAMP.FOREST, RAMP.GRASS],
    }),
    E({
      id: 'topiary_knight',
      name: 'Topiary Knight',
      article: 'The',
      // clipped-shrub guardian; hits like a greatsword, slow as a growing season
      hp: 320, offense: 38, defense: 24, speed: 8, level: 26, exp: 230, cash: 56,
      weakness: ['fire'],
      moves: [
        { name: 'pruned blade', kind: 'strong', mult: 1.8, text: '{e} brought a greatsword of clipped leaves down on {t}!', weight: 3 },
        { name: 'hedge slam', kind: 'attack', mult: 1.2, text: '{e} slammed its whole leafy bulk into {t}!', weight: 3 },
        { name: 'root stance', kind: 'taunt', text: '{e} set its roots deep. It would not be moved.', weight: 2 },
      ],
      deathLine: 'The Topiary Knight was clipped down to a tidy cube. The duchy\'s gardeners arrived at once to argue whose jurisdiction that was.',
      drops: [{ item: 'velvet_doublet', chance: 0.1 }],
      sprite: 'battle_topiary_knight', mini: 'mini_topiary_knight',
      bg: [RAMP.FOREST, RAMP.GOLD],
    }),
    E({
      id: 'bramble_tangle',
      name: 'Bramble Tangle',
      article: 'The',
      // thorn vines that root and entangle a colossus's feet
      hp: 240, offense: 30, defense: 18, speed: 12, level: 25, exp: 195, cash: 46,
      weakness: ['fire'],
      moves: [
        { name: 'entangle', kind: 'status', status: 'paralyzed', text: '{e} whipped thorn vines around {t}\'s feet and cinched them tight!', weight: 3 },
        { name: 'thorn lash', kind: 'attack', mult: 1.2, text: '{e} raked {t} with a fistful of bramble!', weight: 4 },
        { name: 'overgrow', kind: 'strong', mult: 1.5, text: '{e} surged a season\'s growth at {t} all at once!', weight: 2 },
      ],
      deathLine: 'The Bramble Tangle was cut back to a stump. It will, the gardeners warn, be back by Tuesday.',
      sprite: 'battle_bramble_tangle', mini: 'mini_bramble_tangle',
      bg: [RAMP.FOREST, RAMP.MAGENTA],
    }),

    /* ---- 2 social/urban oddities — Minimus Major ---- */
    E({
      id: 'lapel_pin_mob',
      name: 'Lapel-Pin Mob',
      article: 'The',
      // citizens who mistake you for civic furniture and CLIMB you (comes 2–3)
      hp: 105, offense: 24, defense: 10, speed: 22, level: 23, exp: 125, cash: 24,
      weakness: [],
      moves: [
        { name: 'climb aboard', kind: 'attack', mult: 1, text: '{e} scaled {t}\'s trouser-leg like a civic monument!', weight: 4 },
        { name: 'plant a flag', kind: 'taunt', text: '{e} planted a tiny flag on {t}\'s shoulder, claiming it for the duchy.', weight: 2 },
        { name: 'earnest chant', kind: 'status', status: 'crying', text: '{e} struck up a chant so earnest it brought {t} to tears!', weight: 3 },
      ],
      deathLine: 'The Lapel-Pin Mob was gently brushed off and set down. They formed an orderly queue to do it all again.',
      sprite: 'battle_lapel_pin_mob', mini: 'mini_lapel_pin_mob',
      bg: [RAMP.GOLD, RAMP.PAPER],
    }),
    E({
      id: 'town_crier',
      name: 'Town Crier',
      article: 'The',
      // reads proclamations that BUFF its allies ("By order of the Duchess…")
      hp: 200, offense: 26, defense: 16, speed: 14, level: 24, exp: 175, cash: 40,
      weakness: [],
      moves: [
        { name: 'proclamation', kind: 'mend', text: '{e} cried "BY ORDER OF THE DUCHESS, ALL RANKS SHALL RALLY!" and its allies took heart!', weight: 3 },
        { name: 'ring the bell', kind: 'taunt', text: '{e} rang a brass handbell — deafening, at this scale.', weight: 2 },
        { name: 'decree', kind: 'attack', mult: 1.1, text: '{e} read out a decree and rapped {t} with the rolled-up scroll!', weight: 3 },
      ],
      deathLine: 'The Town Crier read its own retraction aloud, rolled up the scroll, and declared the matter officially closed.',
      sprite: 'battle_town_crier', mini: 'mini_town_crier',
      bg: [RAMP.RED, RAMP.GOLD],
    }),

    /* ---- 2 rare/high-value — little stories, BIG purses (cash rides the drops) ---- */
    E({
      id: 'snuffbox_beetle',
      name: 'Gilded Snuffbox Beetle',
      article: 'The',
      // a jeweled beetle worth a fortune; folds gold (physical-immune) and bolts
      hp: 210, offense: 28, defense: 20, speed: 26, level: 25, exp: 240, cash: 100,
      weakness: ['insect'],
      moves: [
        { name: 'gild over', kind: 'gild', text: '{e} folded shut into a jeweled snuffbox — hard gold, and slick to a bat!', weight: 3 },
        { name: 'skitter', kind: 'taunt', text: '{e} feinted toward the gutter, threatening to flee with all that treasure.', weight: 3 },
        { name: 'gem flick', kind: 'attack', mult: 1.2, text: '{e} flicked a chip of emerald at {t} like a tiddlywink!', weight: 3 },
      ],
      deathLine: 'The Gilded Snuffbox Beetle popped open, spilled a king\'s ransom in snuff, and was, the duchy agreed, worth every penny.',
      drops: [{ item: 'gilt_thimble_collection', chance: 0.3 }, { item: 'royal_doubloon_tiny', chance: 0.4 }],
      sprite: 'battle_snuffbox_beetle', mini: 'mini_snuffbox_beetle',
      bg: [RAMP.GOLD, RAMP.MAGENTA],
    }),
    E({
      id: 'tax_assessor',
      name: 'Royal Tax Assessor',
      article: 'The',
      // appears to "assess" your colossal net worth, then flees with the ledger
      hp: 230, offense: 30, defense: 18, speed: 25, level: 25, exp: 245, cash: 98,
      weakness: [],
      moves: [
        { name: 'assess', kind: 'taunt', text: '{e} appraised {t}\'s colossal net worth aloud, audibly salivating.', weight: 3 },
        { name: 'on-the-spot levy', kind: 'stealcash', text: '{e} issued {t} an on-the-spot assessment and pocketed the difference!', weight: 3 },
        { name: 'abscond', kind: 'taunt', text: '{e} edged toward the exit with the ledger clutched to its chest.', weight: 2 },
      ],
      deathLine: 'The Royal Tax Assessor was served its own paperwork. It fainted dead away, which the duchy logged as "audited."',
      drops: [{ item: 'royal_doubloon_tiny', chance: 0.5 }, { item: 'census_ledger', chance: 0.2 }],
      sprite: 'battle_tax_assessor', mini: 'mini_tax_assessor',
      bg: [RAMP.GOLD, RAMP.BLUE],
    }),

    /* ---- 2 late-chapter pressure — remix the boss's lessons (Defend / evasion) ---- */
    E({
      id: 'halberd_column',
      name: 'Halberd Column',
      article: 'The',
      // a wall of tiny pikes that PUNISHES non-Defend (rhymes with the boss POUNCE)
      hp: 340, offense: 36, defense: 22, speed: 10, level: 26, exp: 250, cash: 58,
      weakness: ['volt'],
      moves: [
        { name: 'present pikes', kind: 'taunt', text: '{e} levelled a hedge of matchstick halberds at {t}. (DEFEND, or be run through.)', weight: 3 },
        { name: 'pike charge', kind: 'strong', mult: 1.8, text: '{e} advanced as one bristling wall and ran {t} through!', weight: 3 },
        { name: 'close ranks', kind: 'attack', mult: 1.2, text: '{e} closed ranks and shoved {t} back with a wall of shields!', weight: 3 },
      ],
      deathLine: 'The Halberd Column lowered its pikes, saluted, and marched off in perfect, tiny formation to become someone else\'s problem.',
      sprite: 'battle_halberd_column', mini: 'mini_halberd_column',
      bg: [RAMP.BLUE, RAMP.RED],
    }),
    E({
      id: 'bell_ringer_acolyte',
      name: 'Bell-Ringer Acolyte',
      article: 'The',
      // rings a peal granting allies EVASION — telegraphs the boss's Flat Bell
      hp: 280, offense: 30, defense: 18, speed: 16, level: 26, exp: 235, cash: 52,
      weakness: ['volt'],
      moves: [
        { name: 'warning peal', kind: 'shield', text: '{e} rang a bright warning peal; the toll wrapped its allies in a hard-to-hit shimmer!', weight: 3 },
        { name: 'clapper swing', kind: 'attack', mult: 1.3, text: '{e} swung the clapper into {t} like a wrecking ball!', weight: 4 },
        { name: 'belfry echo', kind: 'status', status: 'hushed', text: '{e} rang a note that shook the words right out of {t}!', weight: 2 },
      ],
      deathLine: 'The Bell-Ringer Acolyte\'s bell cracked on the final swing. In the ringing silence, everything was suddenly, suspiciously easy to hit.',
      drops: [{ item: 'thimble_bell', chance: 0.08 }],
      sprite: 'battle_bell_ringer_acolyte', mini: 'mini_bell_ringer_acolyte',
      bg: [RAMP.GOLD, RAMP.CYAN],
    }),

    /* ---- 1 set-piece — the §A6 formation battle (Pinpoint Mark turns chaos to order) ---- */
    E({
      id: 'grand_parade',
      name: 'The Grand Parade',
      article: 'The',
      // a whole procession that TAKES A VOTE each turn to decide its move
      hp: 360, offense: 34, defense: 20, speed: 18, level: 26, exp: 260, cash: 60,
      weakness: [],
      moves: [
        { name: 'take a vote', kind: 'taunt', text: '{e} halted the entire procession to ballot its next move. (It carried, narrowly.)', weight: 3 },
        { name: 'confetti barrage', kind: 'status', status: 'crying', text: '{e} buried {t} under a regulation quantity of festival confetti!', weight: 2 },
        { name: 'procession crush', kind: 'strong', mult: 1.6, text: '{e} rolled its float forward, by committee, over {t}!', weight: 3 },
        { name: 'marching band', kind: 'attack', mult: 1.1, text: '{e} brought up the brass section directly into {t}\'s ear!', weight: 3 },
      ],
      deathLine: 'The Grand Parade voted, at last, to disperse. The motion carried. They will reconvene, by charter, next festival.',
      drops: [{ item: 'confetti_cannon', chance: 0.2 }],
      sprite: 'battle_grand_parade', mini: 'mini_grand_parade',
      bg: [RAMP.PURPLE, RAMP.GOLD],
    }),

    /* ---- BOSS 5 — WHISKERZILLA (§A6 Ch.5, 4,000 HP) ---- *
     * An ordinary lost housecat; to the duchy, a KAIJU asleep on the crown jewel.
     * The fight is a MERCY/SURVIVAL, not a kill (bosses.ts `scriptedSurvival`): the
     * FLAT BELL is a second 150-HP target that grants the cat evasion while it
     * rings — break it and the purr gives every move away. Every 3rd turn the tail
     * wiggles → POUNCE (Defend or be knocked Flat → Paralyzed). It gets BORED on
     * turn 12 and the Duchess KNIGHTS it (endBattleMercy — a non-kill win). No
     * elemental weakness (the gimmick is the bell + the Defend read, not an
     * element); mind_immune like every boss. */
    E({
      id: 'whiskerzilla',
      name: 'WHISKERZILLA',
      article: 'The',
      hp: 4000, offense: 40, defense: 20, speed: 18, level: 26, exp: 3200, cash: 1200,
      weakness: [],
      moves: [
        { name: 'idle swat', kind: 'attack', mult: 1.2, text: '{e} swatted lazily at {t}, and a swat is, at this scale, a calamity.', weight: 4 },
        { name: 'POUNCE', kind: 'strong', mult: 1.9, text: '{e} POUNCED, and for one terrible moment the whole sky was paw!', weight: 3 },
        { name: 'knead the crown', kind: 'attack', mult: 1, text: '{e} settled in and kneaded the crown jewel, and the tremor knocked {t} flat.', weight: 3 },
        { name: 'tail-wiggle', kind: 'taunt', text: '{e}\'s tail began to wiggle. Something enormous was about to happen.', weight: 2 },
      ],
      deathLine: 'Whiskerzilla was not defeated — nothing so rude. It simply lost interest, yawned hugely, and the Duchess knighted it where it lay.',
      sprite: 'battle_whiskerzilla', mini: 'mini_hill_slug',
      bg: [RAMP.GOLD, RAMP.ORANGE],
      boss: true,
      mind_immune: true,
    }),
    E({
      id: 'flat_bell',
      name: 'The Flat Bell',
      article: 'The',
      // the §A6 SECOND target (150 HP): grants Whiskerzilla evasion while it rings;
      // break it → the cat purrs and every move is telegraphed (bosses.ts summon)
      hp: 150, offense: 18, defense: 12, speed: 30, level: 26, exp: 0, cash: 0,
      weakness: ['volt'],
      moves: [
        { name: 'ring out', kind: 'taunt', text: '{e} pealed a long flat note, and while it rang Whiskerzilla blurred at the edges.', weight: 3 },
        { name: 'discordant clang', kind: 'attack', mult: 1, text: '{e} clanged a sour, off-key note that rattled {t} to the teeth!', weight: 3 },
      ],
      deathLine: 'The Flat Bell cracked clean through and fell silent. Into the gap where its ringing had been crept a low, enormous purr.',
      sprite: 'battle_flat_bell', mini: 'mini_souvenir',
      bg: [RAMP.GOLD, RAMP.CYAN],
      mind_immune: true,
    }),

    /* ══════════════ CHAPTER 6 — THE RUINS THAT LAUGH (Africa) ══════════════ *
     * §A7 the Ch.6 roster (chapter level window 27-31, band ch6). A focused
     * art-matched set — four authored battlers work the Savanna Run + the
     * Laughing Ruins, and BOSS 6 (THE LAUGHING SPHINX) naps in its carved chin.
     * On-curve (Ch.6 forge mid; sun-baked GOLD/ORANGE/EARTH ramps). Region
     * affinity: freeze + salt bite the dust and the stone. */
    E({
      id: 'caravan_hyena_pack',
      name: 'Caravan Hyena Pack',
      article: 'The',
      hp: 220, offense: 36, defense: 16, speed: 30, level: 28, exp: 260, cash: 48,
      weakness: ['freeze'],
      moves: [
        { name: 'pack lunge', kind: 'attack', mult: 1.2, text: '{e} broke from the dust on three sides at once and lunged at {t}!', weight: 5 },
        { name: 'cackling snap', kind: 'attack', mult: 1, text: '{e} snapped, laughing, and the laugh was the worst part.', weight: 3 },
        { name: 'unnerving howl', kind: 'taunt', text: '{e} threw back its heads and howled a sound with no bottom to it.', weight: 2 },
      ],
      deathLine: 'The Caravan Hyena Pack scattered back into the heat-shimmer, still chuckling.',
      drops: [{ item: 'kola_nut_drink', chance: 0.16 }],
      sprite: 'battle_caravan_hyena_pack', mini: 'mini_caravan_hyena_pack',
      bg: [RAMP.GOLD, RAMP.ORANGE],
    }),
    E({
      id: 'baobab_root_snare',
      name: 'Baobab Root Snare',
      article: 'The',
      hp: 340, offense: 38, defense: 26, speed: 14, level: 29, exp: 320, cash: 52,
      weakness: ['salt'],
      moves: [
        { name: 'root grab', kind: 'attack', mult: 1.1, text: '{e} surged a knuckle of root up under {t} and dragged.', weight: 4 },
        { name: 'constrict', kind: 'strong', mult: 1.7, text: '{e} wound tight and SQUEEZED — the whole tree leaning into it.', weight: 3 },
        { name: 'thorn lash', kind: 'attack', mult: 1, text: '{e} whipped a thorned runner across {t}.', weight: 3 },
      ],
      deathLine: 'The Baobab Root Snare went slack and sank back into the red earth it came from.',
      drops: [{ item: 'trade_salt', chance: 0.14 }],
      sprite: 'battle_baobab_root_snare', mini: 'mini_baobab_root_snare',
      bg: [RAMP.EARTH, RAMP.GOLD],
    }),
    E({
      id: 'laughing_dust_pot',
      name: 'Laughing Dust Pot',
      article: 'The',
      hp: 150, offense: 24, defense: 17, speed: 22, level: 28, exp: 276, cash: 54,
      weakness: ['freeze', 'salt'],
      moves: [
        { name: 'catching cackle', kind: 'status', status: 'crying', text: '{e} let out a cackle so catching that {t} could not stop laughing — and laughing, and laughing.', weight: 3 },
        { name: 'dust puff', kind: 'attack', mult: 1, text: '{e} coughed a gritty puff of centuries into {t}\'s eyes.', weight: 4 },
        { name: 'shatter-laugh', kind: 'strong', mult: 1.5, text: '{e} laughed itself to pieces AT {t} — shards everywhere!', weight: 2 },
      ],
      deathLine: 'The Laughing Dust Pot tipped over, gave one last dry giggle, and was only a pot again.',
      sprite: 'battle_laughing_dust_pot', mini: 'mini_laughing_dust_pot',
      bg: [RAMP.GOLD, RAMP.RED],
    }),
    E({
      id: 'sphinx_paw_shadow',
      name: 'Sphinx Paw Shadow',
      article: 'The',
      hp: 190, offense: 35, defense: 15, speed: 33, level: 30, exp: 250, cash: 60,
      weakness: [],
      moves: [
        { name: 'pounce from the frieze', kind: 'strong', mult: 1.6, text: '{e} peeled off a carved wall and POUNCED on {t} before the eye could follow.', weight: 4 },
        { name: 'shadow swipe', kind: 'attack', mult: 1.1, text: '{e} raked {t} with a paw that was mostly dark.', weight: 4 },
        { name: 'unblinking stare', kind: 'taunt', text: '{e} simply looked at {t}, and the looking was a kind of weight.', weight: 2 },
      ],
      deathLine: 'The Sphinx Paw Shadow thinned back into the frieze it had stepped out of.',
      drops: [{ item: 'riddle_shard', chance: 0.12 }],
      sprite: 'battle_sphinx_paw_shadow', mini: 'mini_sphinx_paw_shadow',
      bg: [RAMP.NIGHT, RAMP.GOLD],
    }),

    /* §A6 BOSS 6 — THE LAUGHING SPHINX (9000 HP): naps in its own carved chin and
     * answers only RIDDLES (bosses.ts `riddle` template). A right answer stuns it
     * three turns; a wrong answer sets the whole party Crying — the safe rewind
     * sandbox the Held Breath was for (ADR-126). No elemental weakness (the gimmick
     * is the riddle, not an element); mind_immune like every boss. Money > combat:
     * 9000 HP sits far under the Ch.6 Fortune target ($1.2M). */
    E({
      id: 'laughing_sphinx',
      name: 'THE LAUGHING SPHINX',
      article: 'The',
      hp: 9000, offense: 46, defense: 24, speed: 20, level: 31, exp: 5600, cash: 2200,
      weakness: [],
      moves: [
        { name: 'paw swat', kind: 'attack', mult: 1.2, text: '{e} swatted {t} off the dais with the back of one carved paw.', weight: 4 },
        { name: 'riddling laugh', kind: 'status', status: 'crying', text: '{e} laughed a laugh that got INTO {t} — and {t} could not stop.', weight: 3 },
        { name: 'sandstorm breath', kind: 'strong', mult: 1.7, text: '{e} breathed out a thousand years of desert at {t}!', weight: 3 },
        { name: 'booming chuckle', kind: 'taunt', text: '{e} chuckled, and the whole chin rang like a struck bell.', weight: 2 },
      ],
      deathLine: 'The Laughing Sphinx ran clean out of riddles, gave one last delighted boom, and went still — pleased, somehow, to have been answered.',
      sprite: 'battle_laughing_sphinx', mini: 'mini_laughing_sphinx',
      bg: [RAMP.GOLD, RAMP.EARTH],
      boss: true,
      mind_immune: true,
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
