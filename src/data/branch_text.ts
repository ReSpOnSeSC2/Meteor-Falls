/**
 * BRANCHING DIALOGUE (S21, ADR-126/127/128) — §A11 sincere-voice copy for the
 * three Axes (src/data/choices.ts), the Held Breath rewind (src/data/echoes.ts),
 * and the composed-ending cards (src/data/endings.ts). Spread into DIALOGUE
 * (src/data/dialogue.ts), so `npm run validate` sweeps every {token} here too.
 *
 * Voice discipline (§A11.2/.3): the weighty beats carry NO flair glyphs; the
 * Hush stays sparse and lowercase, never a punchline; every ending lands warm —
 * the walk home is always lit, the branches only change the weather of the warmth.
 */
import type { DialogueScript } from '../schemas';

export const BRANCH_DIALOGUE: Record<string, DialogueScript> = {
  /* ═══════════════ THE HELD BREATH — the unlock (Ch.6) ═══════════════ */
  held_breath_awaken: [
    'The laughter in the ruins comes around again — the same laugh, the same place, like a record finding the same scratch.',
    "And then it isn't the laugh that repeats. It's the MOMENT. A caption you already read. A sound you already heard.",
    '{rex} closes a hand around the Star Locket. It is warm. It is recording — not the song this time. The breath around it.',
    'He breathes in. The world breathes in with him. And, just for a second, it lets him hold it.',
    '@…You can put it back, can\'t you. The breath. You can make it different. — {faye} is not smiling.',
    '@"You\'re not changing what happened, {rex}. You\'re changing what they CHOSE. Be careful which one of those you think it is."',
  ],

  /* ═══════════════ CHOICE 1 — TRUST (Ch.6, the Laughing Ruins) ═══════════════ */
  choice_ch6_intro: [
    'The Hush has the path mushroomed and the party split apart in the spore-fog. Its voice is everywhere and nowhere:',
    '@"how do you know the boy isn\'t holding your strings right now?"',
    'Then it takes {pippa} — freezes her mid-step at the lip of a stair that is quietly coming apart.',
    'One more step and she is gone, down into the fog where the others cannot follow.',
    'You know how to move her. You have moved strangers all the way across the world.',
    'The dark is very quiet. It is waiting to see what you will do.',
  ],
  choice_ch6_pull: [
    'You reach. You borrow her — one step, just one — and walk her back from the edge as gently as setting down a cup.',
    '{pippa} comes to with a gasp, safe, whole, and a half-second behind her own eyes.',
    'Nobody cheers. {milo} says "it worked, it\'s fine, it\'s just inputs" a little too fast, and his voice cracks on FINE.',
    'The dark, for the first time all night, sounds pleased. It got what it wanted: proof.',
  ],
  choice_ch6_open: [
    'You set the power down — open your hand where she can see you do it — and you let her go.',
    'For one whole, terrible second {pippa} sways at the edge, and the fog reaches up for her boots—',
    '—and her own feet find the stone. She steps back. She did that. Her. Nobody walked her.',
    'The party does not just trust {rex}. They CHOSE to, under the worst pressure the dark could find. The bond holds.',
  ],

  /* ═══════════════ CHOICE 2 — COMPASSION (Ch.9, Count Hoaxula) ═══════════════ */
  choice_ch9_intro: [
    'Vlad Dragomir — a bankrupt actor from Cleveland, stuffed full of stolen warmth he never asked for — drops to his knees.',
    'Every time he sobs, a haystack goes grey. Down the valley, {dorin}\'s grandmother\'s lamp gutters.',
    "{faye}'s hands are already folded. {milo}'s siphon is already humming.",
    'One of these ends it kindly. One of these ends it USEFUL. They are not the same door.',
  ],
  choice_ch9_open: [
    '{faye} prays. The stolen warmth lifts off him like steam and goes home to wherever it belongs.',
    'Vlad blinks, ordinary and hollowed of nothing — just tired, just sorry, just a man. The valley relights behind him.',
    'You won nothing you can carry. You won him. Later, at the village payphone, he calls his sister. He has not in years.',
  ],
  choice_ch9_iron: [
    "{milo}'s siphon takes hold, and the stolen Vibe comes OUT of Vlad and into a battery that hums in the Locket like a stone.",
    'He lives. He is un-Hushed. He is also empty — a castle of a man with the lights switched off, blinking at a ruin.',
    'You are flush now. You will feel it where you are going. Buni sets a bowl in front of you anyway, and says, quietly:',
    '@"You took the cold out of him, puiul meu. You did not put anything warm back. That is a thing you DID. Not a thing that happened to you."',
  ],

  /* ═══════════════ CHOICE 3 — FINALE (Ch.10, THE CALLING) ═══════════════ */
  choice_ch10_mia_gate: [
    '{faye} catches your sleeve before the last prayer. Her eyes are steady and a little afraid.',
    '@"{rex}. I need to know this one\'s mine. Not pulled. Not walked."',
    '@"Promise me you\'ll let me pray it wrong, if I pray it wrong."',
    'You let go of the Locket. You let go of the breath. You give her the choice. It is the hardest thing you have done.',
  ],
  hush_speaks: [
    'The callers have all phoned in. The Homesong is one instrument short — yours.',
    'And the dark, for the first time, speaks at length. Small. Lowercase. Wrong.',
    '@"you came so far. it was quiet here. i was quiet here. why."',
    'It is not a monster. It never was. It is a loneliness so total it learned to eat the one thing it could not have.',
  ],
  choice_ch10_intro: [
    'The song is almost whole. One voice short. Yours.',
    'The dark is asking you a question it has never once asked anyone.',
    "{faye}'s hands are folded. She is waiting to hear how you want her to pray.",
  ],
  choice_ch10_silence: [
    '{faye} plays the Homesong like a key turning a lock — every warm thing you gathered, aimed at the dark all at once.',
    'The quiet cannot eat it. The quiet cannot answer it. The quiet simply ENDS, the way a held breath finally lets go.',
    'It is over. It is clean. The morning is coming up over a world that has forgotten, already, to be afraid.',
  ],
  choice_ch10_forgive: [
    '{faye} plays the Homesong like a hand reaching down — not against the loneliness. TO it.',
    'The dark does not lose. It LISTENS. And somewhere out past Mars, for the first time in forever, it is not starving.',
    'It stops eating. Because it chose to. And a single firefly-light comes up off the Sea of Silence to see who is there.',
  ],

  /* ═══════════════ THE ECHOES — rewind offer + cost (the menu flow) ═══════════════ */
  echo_offer_ch6: [
    'The Locket holds the breath from the Laughing Ruins still — {pippa} at the edge of the stair, the choice not yet cold.',
    'You could go back. You could choose the other hand. The moment is right there, loose, waiting.',
  ],
  echo_cost_ch6: [
    'It will cost a Breath, and the dark will feel you take it — it always does.',
    'Hold the breath back?',
  ],
  echo_offer_ch9: [
    'The Locket holds the breath from the castle — Vlad on his knees, the siphon humming, the choice not yet cold.',
    'You could go back. You could choose the other door. The moment is right there, loose, waiting.',
  ],
  echo_cost_ch9: [
    'It will cost a Breath, and {milo} will know you reached, even after — he always does.',
    'Hold the breath back?',
  ],
  echo_no_breath: ['The Locket is cold. There is no breath left to hold. What is done is done.'],
  echo_done: ['The world breathes in, and back, and settles — different. Only you remember the other way.'],

  /* the rewind-debt barks (fire as the count climbs — the held string, felt) */
  echo_bark_mia: ['@"You took the breath back. …Was that yours to take, {rex}?"'],
  echo_bark_milo: ['@"It\'s fine. We do it, we un-do it, we do it again. It\'s just inputs. …It\'s fine."'],
  echo_bark_pippa: ['@"Wait. Did I decide that? Or— did we already do this? {rex}, did we already do this?"'],

  /* ═══════════════ THE COMPOSED ENDING — epilogue cards ═══════════════ */
  // TONE FRAME
  epi_tone_clean: [
    "The dark didn't argue. It just… wasn't, anymore. Like a held breath finally let go.",
    'The morning came up over Otterbrook the way mornings are supposed to, and nobody, anywhere, remembered to be afraid.',
  ],
  epi_tone_open_window: [
    "The dark didn't lose. It listened. Somewhere past Mars a quiet went soft — the way a quiet does when it finally has company.",
    'The morning came up over Otterbrook. And a few windows, here and there, stayed open all night. Just in case something lonely wanted in.',
  ],
  epi_tone_default: ['The dark ended, the way the old stories promised it would. The morning came. It was enough.'],

  // THE HUSH'S FATE
  epi_hush_sealed: ['The Sea of Silence on Mars went still, and stayed still. They named it nothing. Some things you let be empty.'],
  epi_hush_spent: [
    "The dark ended — and a little of the warmth it stole never made it home. It's in a locket, in a sock drawer, in Ohio now.",
    "{rex} can't bring himself to spend it. Some nights it hums.",
  ],
  epi_hush_befriended: [
    'They say if you sit by the Sea of Silence at the right hour, a single firefly-light comes up off the water to see who is there.',
    'They say it isn\'t hungry anymore. They say it just likes the company.',
  ],
  epi_hush_owed: [
    'The dark chose to stop. It CHOSE. {rex} thinks about that a lot — that the loneliest thing in the universe put its hunger down…',
    '…the same week he couldn\'t quite put his own down. He\'s working on it. Buni says there\'s time.',
  ],
  epi_hush_default: ['The dark is gone from Mars, and from the spaces between people, and from the flat places in the music. Gone.'],

  // WORLD-STATE
  epi_world_chosen: [
    'Everybody started calling their moms again. Not because anyone made them. Because they wanted to.',
    'That turned out to be the whole point.',
  ],
  epi_world_warm_guarded: [
    'The world woke up warm. Mostly. There is a man in Cleveland who wakes up un-haunted and un-warmed…',
    '…and on the days the kids think about him, they call him. He\'s getting there.',
  ],
  epi_world_grateful_uneasy: [
    "The world never knew how close it came to a boy who could've decided things for everyone.",
    'The boy knew. He decided, every single morning after, not to. That counts. That counts more than anything.',
  ],
  epi_world_quiet_kept: [
    'They saved everyone. Every soul on Earth, and one on Mars.',
    "They don't talk much about HOW. Some victories you keep in your pocket and don't take out at parties.",
  ],
  epi_world_default: ['The world the kids carried home was a little warmer than the one they left. They had done that. Together.'],

  // PER-CHARACTER — JAY
  epi_jay_free: [
    "{rex} never did learn to talk much. But there is a kid in Otterbrook who can bend the whole world to his will…",
    '…and CHOOSES to ask first, every time. His friends would walk into the dark for him. They nearly did. He eats too many corn dogs. He\'s happy.',
  ],
  epi_jay_holding: [
    '{rex} keeps the Locket on his nightstand where he can see it. He could move the whole world with his thumb.',
    "He's spent the rest of his life learning not to want to. {faye} checks on him. He lets her. That's the part that matters — he lets her.",
  ],
  epi_jay_default: ['{rex} went home a quiet kid from Ohio who had carried the old light all the way to Mars and back. He kept being quiet. He kept being kind.'],

  // PER-CHARACTER — MIA
  epi_mia_silence: [
    '{faye} prayed the dark closed and never once doubted it was the right prayer. She runs the youth choir now.',
    'When a kid asks if praying does anything, she just smiles and says, "Ask Mars."',
  ],
  epi_mia_forgive: [
    '{faye} prayed the loneliest thing in creation into peace instead of pieces, and she\'ll tell you it was the hardest, kindest thing her faith ever asked of her.',
    'She leaves a porch light on. She won\'t say who for.',
  ],
  epi_mia_default: ['{faye} kept praying — for the choir, for the strays, for the flat places in people. The light kept answering. It always had.'],

  // PER-CHARACTER — MILO
  epi_milo_open: [
    '{milo} and his dad rebuilt the rocket twice more, just to go up and come back.',
    'The Professor still talks to machines more than people — but he learned to call his son on Sundays, and {milo}, tea snob to the end, always picks up.',
  ],
  epi_milo_iron: [
    "{milo} built the device that emptied a man, and it worked perfectly, and that's the trouble — it worked perfectly.",
    "He doesn't build that kind of thing anymore. He builds bikes for kids now. He says it's better work. He's right.",
  ],
  epi_milo_default: ['{milo} went home and built things that helped, and drank tea that was too good for anyone, and called his dad more than he used to.'],

  // PER-CHARACTER — PIPPA
  epi_pippa_minister: [
    "{pippa} Quill returned to Minimus a giant's-height hero and was, of course, immediately mistaken for a commemorative statue.",
    'She is now the youngest Grand Marshal in duchy history. She takes minutes during celebrations now. She is furious about how cute the medal is.',
  ],
  epi_pippa_left: [
    '{pippa} went back to Minimus the long way, alone, and did not write for a season. Then, one spring, a matchbox letter came.',
    'It said: "I needed to know my choices were mine. They are. I know that now. Come visit. Mind the doorways." She signed it herself.',
  ],

  // PER-CHARACTER — DORIN
  epi_dorin_named: [
    '{dorin} said his name on the Mute Mountain and has not stopped saying it since — quietly, like a man making sure it is still his.',
    'Buni keeps his beads on the mantel and his chair at the table. He answers her letters now. Every one.',
  ],
  epi_dorin_left: [
    '{dorin}, who knows better than anyone what it costs to be emptied out, could not walk the last mile beside a choice he could not bless.',
    'He went back to the mountain instead. He prays for the man in the castle. He won\'t say it\'s working. He won\'t say it isn\'t.',
  ],

  // HOMECOMING TAG
  epi_home_standard: [
    '{rex} walked the long way home from the bus stop — past the lemonade stand with its hand-drawn flag, up to a door with a key that fits.',
    'He let himself in. Somebody had left the kitchen light on. He was home.',
  ],
  epi_home_long_shot: [
    '{rex} walked home the long way, and the whole way the phone lines hummed with people who were okay now — who called their moms tonight…',
    '…because a quiet kid from Ohio went all the way to Mars and decided, every chance he got, to let them choose for themselves.',
    'He unlocked the door. The light was on. From upstairs, two little voices, fighting over the lemonade money. The best kind of ordinary.',
    'A single firefly drifts past the porch light. This time, the bug zapper is unplugged.',
  ],
};
