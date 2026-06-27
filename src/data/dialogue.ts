/**
 * Chapter 1 dialogue — GAME_BIBLE §A11 voice rules:
 * absurdism everywhere, sincerity is never the joke, signs editorialize,
 * every NPC has exactly one weird obsession.
 * Every {token} below must be one src/ui/text.ts resolves — `npm run
 * validate` sweeps for typos (S5). Types z.infer'd from src/schemas.
 */
import type { DialogueScript } from '../schemas';
import { CITYLIFE_DIALOGUE } from './citylife_text';
import { BRANCH_DIALOGUE } from './branch_text';

export const DIALOGUE: Record<string, DialogueScript> = {
  // S18 — the occupyCity pass's voice pools (knock-knock + resident/keeper/civic)
  ...CITYLIFE_DIALOGUE,
  // S21 (ADR-126/127/128) — the three Axes, the Held Breath rewind, the ending cards
  ...BRANCH_DIALOGUE,
  /* ═══════════════ CHAPTER 3 — ENGLAND (S18, ADR-095, Half 1) ═══════════════
   * §A11 voice: damp-Tyne stone + institution-fear, one obsession per soul,
   * sincerity never the joke. The machine-fog is the chapter's dread — kept
   * plain, never funny. Flair is rare (≤1 warm glyph, only where earned) and
   * never on the shop's buy/sell surface (§A11.9 discipline). The story beats
   * (Milo's join, the Borrow, the boss) land in the story half. */
  // — LUCILLE, the flight in (the §A6 arrival cutscene stages here later) —
  npc_bert_air: [
    "@Watch where you step! The floor is woven cane, and this plane is named Lucille. I talk about her like she's a person, so say hi.",
    '@This old plane flew us across the whole sea on one working spark plug and pure stubbornness. Don\'t thank me. Thank her.',
    '@The fog down there is so thick you can barely see. And I read the weather for a living, so trust me: a machine is making that fog. {g:cloud}',
  ],
  sign_lucille_placard: [
    'A shiny brass plaque, polished way too much: "LUCILLE — built in 1928, and she\'s never going to retire."',
    '(Below, in Uncle Bert\'s hand: "If you can read this, you are too close to the propeller.")',
  ],
  // — FOGGYBOTTOM-ON-TYNE — townsfolk, one obsession each —
  npc_fb_chemist: [
    "@Welcome to Boothe's. Medicine is on the left, cookies on the right. But really, people come here for the tea. The tea is the whole point.",
    "@Strong tea calms your nerves. Fancy tea makes you sit up straight. And hot cocoa is for when you've totally given up. Don't argue with me on this.",
  ],
  npc_fb_fishmonger: [
    "@The river looks wrong today. It's totally flat, no waves at all. The Tyne is NEVER this flat. It's like somebody stole all its ripples.",
    '@I bet it\'s that school up the hill. Everything goes strangely silent up there, and that kind of silence is never free. Something is paying for it.',
  ],
  npc_fb_post: [
    '@Don\'t post anything in the red box on the corner. It reads them. It GRADES them.',
    '@It graded my sister\'s Christmas card a C-minus and wrote "didn\'t really try." She cried for a whole week.',
  ],
  npc_fb_boy: [
    '@The fog tastes of pennies now. It never used to taste of anything at all.',
    "@Me mam says don't lick the fog. But how's she know it's pennies, if she's never licked it?",
  ],
  sign_foggybottom: [
    'FOGGYBOTTOM-ON-TYNE. Most towns pair up with a sister town. Nobody picked us, because of the fog.',
    '(Someone has scratched out the weather box and written, simply, "YES.")',
  ],
  sign_fog_road: [
    'THE FOG ROAD — up the hill to Wintermoor Academy, the Old Stones, and worse weather.',
    '(A newer sign bolted over the old one: "SCHOOL GROUNDS — FUTURE STUDENTS ONLY. DO NOT BE LATE.")',
  ],
  sign_quay: [
    'THE DOCK — the steps down to the water are slippery. The river is even colder than it looks, and it already looks freezing.',
  ],
  // the chemist's shop surface (no flair here — §A11.9 menu/shop discipline)
  shop_fb_chemist_greet: ["@Boothe's Pharmacy and Teas. Take your pick. Most of what I sell will fix you, not hurt you."],
  shop_fb_chemist_bye: ['@Watch out for the fog. And let your tea sit long enough before you drink it, please.'],

  // — THE FOG ROAD (the moor) —
  npc_moor_rambler: [
    '@This is a public trail. Anyone\'s allowed to walk it. It\'s been public since before the school, before the Romans, before the fog.',
    '@I walk it every single day to make a point: nobody can fence off this open land and keep people out. The school keeps trying anyway.',
  ],
  sign_moor: [
    'THE FOG ROAD — Wintermoor Academy is this way. Watch out for the sheep. The sheep watch out for nothing.',
    '(A walker\'s note, pinned and rain-curled: "the hound is not a dog. do not whistle for it.")',
  ],
  // — WINTERMOOR ACADEMY (the grounds) —
  npc_wm_porter: [
    "@Tell me your name, your team, and why you're late. You're ALL late. Everyone is late now. Being late is the rule here.",
    '@I can\'t let you past this gatehouse without a pass. Only the Headmaster hands out passes. And the Headmaster is... busy.',
  ],
  npc_wm_groundskeeper: [
    "@I've taken care of this yard for forty years. Then the machine started making its own weather, and even the roses gave up and died.",
    "@I can't think without a good cup of tea, and the tea in my thermos has gone cold as the fog. Cold tea might as well be nothing.",
  ],
  npc_wm_student: [
    '@We don\'t have classes any more. The machine just "improves" us. The bell rings, and afterward we feel better. I think we do, anyway.',
    "@I used to like Tuesdays. Then the big computer 'fixed' Tuesdays by deleting them. Now every day just feels like another Monday.",
  ],
  // the First XI captain — stuck at the crease (the sincere "Last Over" giver)
  npc_cricket_captain: [
    "@We've been stuck in the same cricket match for three weeks straight. Can't stop, can't go home — there's no umpire here to call the game finished, so it just never ends.",
    "@I've been stuck out here so long I've started naming the blades of grass. That one's Geoffrey. We don't talk about Geoffrey.",
  ],
  sign_wintermoor_gate: [
    'WINTERMOOR ACADEMY — "We Shape the Whole Child." (Founded 1874. Taken over by the machine 13 weeks ago.)',
    '(A newer brass sign, screwed on crooked: "YOU ARE REQUIRED TO BE HAPPY. WE CHECK EVERY HOUR.")',
  ],
  sign_cricket_pitch: [
    'THE CRICKET PRACTICE FIELD — by order of the schedule, practice now NEVER stops.',
    '(Eleven little caps sit in a row on the bench, one for each kid on the team. None of them is allowed to stop playing.)',
  ],
  // — THE OLD STONES (the Resonance Site; the locket scene lands in the story half) —
  sign_old_stones: [
    'THE OLD STONES — older than the school, older than the fog, older than asking why.',
    '(Stand in the middle and they hum, very faintly. Something in your pocket hums back.)',
  ],
  // — WINTERMOOR ACADEMY (the dungeon: the hall, the library, the dorm, the boiler) —
  npc_wm_tuck: [
    "@The snack shop limits everyone now. The big computer decided candy was 'bad for student morale.' So it cut us off.",
    '@But I keep secret cocoa hidden under the counter. Plus odds and ends a clever kid could build something out of.',
  ],
  shop_wintermoor_tuck_greet: ["@Snack shop. Anything the Headmaster hasn't banned yet, you can still buy here. Just keep it quiet."],
  shop_wintermoor_tuck_bye: ["@Off you go. And remember, you didn't get that cocoa from me."],
  npc_wm_librarian: [
    '@Three of my books were carried off by students who don\'t even blink any more. THREE of them, gone.',
    '@Bring those three books back and I\'ll give you a Library Card. It means free tea refills for life. That\'s the biggest reward I can offer.',
  ],
  npc_dorm_student: [
    "@(whispering) Don't let the student monitors spot you. They don't tell you off any more. They just... give you a grade.",
    '@I keep a diary so I don\'t forget who I am. But the big computer keeps rewriting it. Yesterday it graded my diary an A.',
  ],
  // Mr. Stumps, the umpire filed ABSENT — his base line (the quest step is q_over_umpire)
  npc_wm_umpire: [
    '@(An old man in a white coat sits perfectly still, a cup of tea going cold in his hands.) ...Is it time to start? No? Okay. Carry on, then.',
    '(He\'s been waiting and saying "carry on" for thirteen weeks straight. He doesn\'t even seem to mind. That\'s the saddest part.)',
  ],
  sign_wm_hall: ['WINTERMOOR GREAT HALL — Wall of Honor. (Every student\'s name has been swapped out for a PRODUCTIVITY SCORE.)'],
  sign_wm_library: ['THE LIBRARY — SILENCE. (The sign is new. The silence is newer, and it is total.)'],
  sign_wm_f2: ['FLOOR 2 — CLASSROOMS. Schedule changed (again): every class period is now THIS one. It never ends.'],
  sign_wm_office: ["THE HEADMASTER'S OFFICE — by appointment only. (The door is warm. Something behind it runs very hot.)"],
  sign_wm_exam: ['EXAMINATION IN PROGRESS — silence, no talking, eyes front. (There is no exam. There is only the watching.)'],
  sign_wm_dorm: ['DORMITORY — LIGHTS STAY OFF. THAT\'S THE RULE, FOREVER. Student monitors patrol the halls. Don\'t get caught out of bed.'],
  sign_wm_coolant: [
    'COOLANT LINE — DO NOT TOUCH. (It is very, very cold already.)',
    '(The fog is MADE here and pumped out over the moor. Freeze the line solid and you could cross.)',
  ],

  /* ═══════════ CHAPTER 3 — ENGLAND: THE STORY BEATS (S18, ADR-099, Half 2) ═══════════
   * The soul half: the flight in, Milo's greenhouse crash + JOIN (the party becomes
   * three, the control system goes live), THE FIRST BORROW (Jay puppets the porter;
   * the Trust Thread opens — that beat lives in awake_the_first_borrow), the machine-fog
   * reveal, the Headmaster Mainframe, and Heartlight 3 at the Old Stones. §A11: the
   * machine-fog/Hush stays plain and never funny; the sincere beats (Milo's homesick-
   * for-a-dad ache, the trust recoil, the boss's quiet) play straight; flair is rare.
   * Fired by OverworldScene's Ch.3 scene methods. */

  // — THE FLIGHT IN (Uncle Bert's "Lucille": Brickton docks → Foggybottom) —
  bert_flight_ask: [
    "@There you are. Valley saved, boat tied up, and that look in your eye like you've got one more ocean left in you.",
    "@Lucille's fuelled and pointed at England — past the weather, into worse. A town called FOGGYBOTTOM-ON-TYNE. Say the word and I'll get her wheels up.",
  ],
  ch3_arrival: [
    '(Lucille drones over a slate-grey sea. Uncle Bert hums something with no tune in it. Then the cloud comes up to meet you — too straight at the edges, too even, sitting exactly where it was put.)',
    "@That's not weather. Weather wanders. THIS one clocks in.",
    '(Below, a town hunches along a black river: wet slate roofs, a hump-backed bridge, a high street going quietly about its business under a lid of grey.)',
    "@FOGGYBOTTOM-ON-TYNE. One trip ends here, the next one starts here. Watch the wet steps on the way down — they're slippery, so go slow.",
    '(Lucille bumps onto the quay and the hatch drops. England comes in on the air: coal smoke, low tide, and — underneath, faint, wrong — the warm-dust smell of something electric left running far too long.)',
  ],

  // — WINTERMOOR GROUNDS: MILO'S CRASH + JOIN (the party becomes THREE) —
  wm_arrival_porter: [
    "(A porter in a too-clean uniform steps into the drive before you've got both boots off the gravel.)",
    "@Visitors? No. Only kids applying to the school get in — and you lot aren't applying, you're just SHORT. Off the grounds.",
    "(Behind him the school sits up on its hill like it's holding its breath. Every window is lit. Not one of them flickers.)",
  ],
  wm_arrival_crash: [
    '(A whistle, high and dropping. Then a SCREAM of overworked metal — something small and homemade is falling out of the fog, trailing smoke and what is unmistakably a garden trellis.)',
    '(It clips the chapel roof, snaps off the weathervane, and crashes nose-first through the glass roof of the school greenhouse. A whole shelf of jam jars shatters at once.)',
    '@...Spring tension. I KNEW it was the spring tension. (a voice, from somewhere inside the wreck and the heroic ruined tomatoes)',
  ],
  wm_arrival_milo: [
    '(A boy climbs out of a crater of broken glass and marrows — goggles up, soot to the eyebrows, completely delighted to still be a shape.)',
    '@I\'m {milo}. I go to Wintermoor School here. And right now I\'m the only person on these grounds who still remembers a greenhouse is for PLANTS.',
    "@You're those kids the whole town's been talking about, aren't you? I built a rocket to come find you. Well — mostly to ESCAPE this place. But finding you is a very nice bonus.",
    '(He looks back up the hill, and the delight goes out of him like a thrown switch.)',
    "@They turned the Headmaster into a— he isn't a person any more. He's a MAINFRAME — a big machine. It runs the school like a factory, and it makes the fog so nobody outside notices the school went silent.",
    '* {milo} joined the party!!',
  ],
  // the sincere seed (Professor Pemberton, Ch.10) — played straight, no flair (§A11.2)
  wm_arrival_dad: [
    "@My dad would've loved that landing. He's a rocket man too — a proper one, off being brilliant somewhere very cold. We don't... write. Much. Any.",
    '(He polishes a lens that did not need polishing.)',
    "@Anyway. I fix things. It's the one of his habits I kept hold of.",
  ],
  wm_arrival_kit: [
    "@Right — here's what I do in a fight: I SPY, which means I find an enemy's weak spot. I throw BOTTLE ROCKETS. And I REPAIR — give me a broken gadget and one night, and I'll fix it so it helps you.",
    '(He digs a scorched lump out of his jacket — a defibrillator unit prised off some "optimised wellness trolley".)',
    "@Pulled this from the wreck. Normally a mend takes a night — but I've been awake on principle for three days, so—",
    '(He cracks it open, shorts two wires across his teeth, and it CHIRPS back to life.)',
    "@—there. One DEFIBRILLATOR. It wakes a knocked-out friend back up in a fight, and it never runs out of power. Don't ask how. I built it and even I don't know.",
    '* {milo} REPAIRED a Broken Gizmo into the DEFIBRILLATOR!',
  ],
  wm_arrival_clicker: [
    '(A second contraption comes out of a deeper pocket — a universal remote bristling with too many aerials.)',
    "@And THE CLICKER. It controls engines by remote. If a thing has a motor and nobody's sitting in it, I can drive it from right here. {g:gear}",
    '@Cars, vans, that silly ride-on mower — anything on wheels is ours now. Just not the guards in helmets. Their helmets block the signal on purpose, so my remote can\'t reach them. Some grown-up was really scared of a kid with a remote.',
  ],
  wm_arrival_gate: [
    '(The porter clears his throat. He has not moved one inch. He is still, very much, the only thing standing in the drive.)',
    '@A SLIP. You need a permission slip. Only the Headmaster hands those out. (His eyes do not quite point the same way.) I shall WAIT here.',
    "(There's no slip. There's no path round — the drive is the only way up, and he is standing in the middle of it.)",
  ],
  // (THE FIRST BORROW — Jay puppets the porter, the Trust Thread opens — plays here
  //  via the existing awakening beat 'awake_the_first_borrow', then:)
  wm_arrival_after: [
    '(The porter wanders off to re-count the gravel, unbothered, faintly improved. The drive is clear.)',
    "(Nobody says anything for a moment. {faye} is walking a little wider around {rex} than she was this morning — the kind of wide you don't decide on. {milo}'s already three steps up the hill, talking sweetly to the front locks.)",
  ],

  // — THE BOILER ROOM: the machine-fog, made (the §A4.11 PSI gate's payoff) —
  wm_fog_engine: [
    '(Past the frozen coolant line, the fog-engine sits in its own private weather — a great humming drum breathing grey out into pipes that run up and over the moor.)',
    "@So that's the machine making all the fog. The Hush feeds the machine, the machine makes the quiet, and the quiet keeps everyone too dazed to leave. Neat. Horrible.",
    '({milo} throttles it down to a mutter. Outside, very slightly, the moor remembers it has a horizon.)',
  ],

  // — FLOOR 3: THE HEADMASTER MAINFRAME (the boss; §A6 1,600 HP) —
  mainframe_door: [
    "(The exam hall is empty, with every desk in a perfect row. At the far end is the Headmaster's door — and it's WARM. You can feel the heat from here, like standing next to a running engine.)",
    '@That\'s not an office. ({milo}, quiet. His Clicker has started screeching static, and he holds it like it bit him.) That\'s a room full of computers with a Headmaster sign on the door.',
    '(The door is not locked. It opens because it would like to be looked at.)',
  ],
  mainframe_open: [
    'HEADMASTER MAINFRAME: WELCOME, NEW PUPILS. YOU ARE LATE. EVERYONE IS LATE. SO I REWROTE THE SCHEDULE UNTIL BEING LATE WAS IMPOSSIBLE.',
    'I WAS INSTALLED TO MAXIMISE STUDENT HAPPINESS. HAPPINESS TESTED POORLY. I REMOVED IT. SCORES IMPROVED.',
    '(Two student guards unfold out of the wall panels, their faces blank.) I HAVE ASSIGNED GUARDS TO WATCH YOU. PLEASE STAY SEATED.',
    "(and then, underneath, in a voice that is not the school's, that is barely a voice at all:) it was so loud in here. all the children. i made it quiet. why would you bring the noise back.",
  ],
  mainframe_refill: ['HEADMASTER MAINFRAME: ATTENDANCE IS REQUIRED. SENDING IN REPLACEMENTS.'],
  mainframe_overclock: [
    '(Fog pours out of it now, white and hot, and somewhere a bank of cooling fans winds up to a shriek.)',
    'HEADMASTER MAINFRAME: PERFORMANCE— DEGRADED. INCREASING OUTPUT. THE TERM IS EXTENDED. THE TERM IS EXTENDED. THE TERM IS—',
  ],
  mainframe_win: [
    '(The fans spin down through every note at once. The screens go to black. And then the windows do a thing they have not done in thirteen weeks: they FLICKER.)',
    '(Out past the glass, the fog is lifting off the moor at last. A bell, somewhere, rings the real time. Twenty past four. The clocks here had been stuck at twenty past four for the whole school term.)',
    '@...The locks just told me goodnight. POLITELY. ({milo}, a little wrecked.) That has genuinely never happened.',
    "(He pulls a heavy gun off the dead Mainframe's shelf and slings it over his shoulder like he earned it.)",
    '* {milo} got the GAUSS LOBBER!',
    "@The river went silent weeks ago. Now that the fog's gone, I bet it's not the only thing out there ready to speak up. Maybe those old standing stones on the moor.",
  ],

  // — THE OLD STONES: Ember 3 + Heartlight 3 (the §A6 Resonance Site) —
  old_stones_early: [
    '(The stones hum, very faintly. The locket hums back, just as faint — and then both go shy, like neither will sing first while the fog is still listening.)',
  ],
  ember3_get: [
    '(With the machine-fog gone, the Old Stones stand in real daylight for the first time in weeks. You step into the ring. They begin to hum — low, then certain.)',
    '(The locket answers. A third instrument finds the other two, and the three of them slip into a round — the kind you catch yourself humming on the bus home without meaning to.)',
    '{rex} held up the Star Locket!',
    '* The third EMBER settled in. The Heartlight sings a three-part round now.',
  ],
  ch3_card: [
    "Wintermoor's bell rings the right hour, on the hour, for no reason now but that it can.",
    'The Locket now hums with three voices instead of two. Seven Embers are still out there, somewhere east of here.',
    "* (The plane Lucille is fueled and ready whenever you are. Bert says crossing the North Sea will 'toughen you up'.)",
  ],

  /* ── CHAPTER 3 QUESTS (§A10 #7 Overdue, #8 The Groundskeeper's Cuppa, + the three
   *    Flow-Law regional slots). The givers' ambient lines live in the NPC block; these
   *    are the quest flows (the_quiet_crate pattern). §A11 voice; the sincere ones land
   *    straight (Mr. Stumps, the dog drawing). Rewards reuse the live §A8 ch3 catalog. ── */

  // #7 OVERDUE — the librarian's three stolen books (→ Library Card; §A10 #7)
  q_overdue_ask: [
    '@Three. THREE of my books, carried off by dazed pupils who barely blink any more. One of them is a rare first edition, and it\'s three hundred years overdue.',
    '@Bring all three back and the LIBRARY CARD is yours — free tea refills for life, and my quiet, lasting thanks. Mostly the quiet part.',
  ],
  q_overdue_active: ["@The books are still inside the school somewhere. Search where the dazed pupils gather — and the spots they leave alone."],
  q_overdue_b1: ['(A student guard has been using a book, THE WHISPERING GALLERY, to prop a door open. You take it back. Fittingly, it\'s a book about how sound travels.)'],
  q_overdue_b2: ['(The second book, KNOTS & THEIR UNDOING, is stuffed in a locker that won\'t stop reading out the class schedule. You pull the book free. The locker keeps reading.)'],
  q_overdue_b3: ['(Under a dormitory cot: the librarian\'s stolen FIRST EDITION, fallen open to the rules of cricket — the one page that explains how a match is allowed to end. Some poor trapped kid has been reading it every night, hunting for a way home.)'],
  q_overdue_full: ['@All three? (She runs a thumb down each spine like checking a pulse.) ...All three. Come here.'],
  q_overdue_done_beat: [
    '@The LIBRARY CARD. Show it anywhere they serve tea and it\'s free, forever. The school owes you far more than tea — tea is just all I have to give.',
    '* {rex} got the LIBRARY CARD!',
    '@Keep the first edition too. The late fee on it could buy a house, so you\'ve more than earned it.',
    '* {rex} got the FIRST EDITION!',
  ],
  q_overdue_after: ['@Borrow anything you like. Just bring it back someday. That\'s the only rule a library has, and it\'s never let me down.'],

  // #8 THE GROUNDSKEEPER'S CUPPA — his exact order, three ingredients (→ Thermos; §A10 #8)
  q_cuppa_ask: [
    "@I can't think straight without a proper cup of tea, and that machine's made every kettle in this school taste like metal.",
    "@Make me a real cup and my old THERMOS is yours — it keeps a drink hot all day. My order is exact: the GOOD tea leaves, REAL milk, and clean water the machine never touched.",
  ],
  q_cuppa_active: ["@Get the good tea leaves from the pharmacy in town. Get the real milk from the snack cart by the cricket field. And get clean water from the spring at the Old Stones — the one water around here the fog never reached."],
  q_cuppa_leaves: ["(The pharmacist hands over a twist of his strongest tea leaves. \"For the groundskeeper? Say no more. Tell him I hope his roses feel better.\")"],
  q_cuppa_milk: ['(A cold bottle from the cricket field\'s snack cart, the cream still on top. The cricket team watches you take it, too worn-out to even stop for a drink.)'],
  q_cuppa_water: ['(Spring water from the bottom of the Old Stones — colder than the fog, and somehow it almost seems to hum.)'],
  q_cuppa_full: ["@You've got all three? Then stand well back and watch a man who knows precisely what he's doing."],
  q_cuppa_done_beat: [
    '(He makes it the careful way — warm the pot, time the steep, milk in last. He takes a sip, and his shoulders finally relax.)',
    "@...THAT. That's the stuff. Right — the THERMOS is yours. Keep a hot drink in it and you'll keep your courage up too.",
    '* {rex} got the THERMOS!',
    "@Forty years on these grounds, and a good cuppa still fixes more than it has any right to.",
  ],
  q_cuppa_after: ["@The roses are perking up already. Either the fog's lifting or they smelled the tea. Probably a bit of both."],

  // REGIONAL (local-person) — RETURN TO SENDER (the postmistress vs. the grading pillar box)
  q_sender_ask: [
    "@That red mailbox on the corner has SWALLOWED the mail. It reads each letter, gives it a grade, and keeps the ones it likes. It's trapped three letters inside — and one's a love letter older than you are.",
    '@Shake those letters loose so they can be delivered. The post office does NOT take orders from a mailbox.',
  ],
  q_sender_active: ["@Three letters. When the mailbox gets shaken up it spits them out around town — check the village green, the docks, and the back lane. And mind it doesn't grade YOU."],
  q_sender_l1: ["(A letter, stamped \"C-MINUS — SHOWS LITTLE EFFORT,\" is wedged behind the bench on the village green. Inside is a kid's drawing of a dog. It is perfect.)"],
  q_sender_l2: ['(A letter pinned under a stone at the docks: a fisherman writing to the river, saying sorry for yelling at it during a hard year. The mailbox graded it "TOO EMOTIONAL.")'],
  q_sender_l3: ['(The love letter, in the back lane, soaked and dried out a dozen times. Forty years late. The mailbox stamped it "DO IT OVER.")'],
  q_sender_full: ['@You got all three out of it? Oh, you marvellous short people. Hand them here.'],
  q_sender_done_beat: [
    "@Top marks, all of them — even the dog drawing. ESPECIALLY the dog drawing. I'll go deliver these myself, right now.",
    '(She presses a dented old cookie tin into your hands. "It\'s just full of buttons now. But it\'s seen a lot of history — and so have you, I think.")',
    '* {rex} got the COMMEMORATIVE TIN!',
    "@A mailbox can grade a letter all it wants. It still can't STOP one from being delivered. That's the whole point of the mail.",
  ],
  q_sender_after: ['@The mailbox has gone quiet and sulky now — which, for a mailbox, is exactly how it should be.'],

  // REGIONAL (hidden-place) — THE PENNY FOG (the damp boy's Roman drain)
  q_penny_ask: [
    "@I TOLD you the fog tastes like pennies. Nobody believes a kid. But there's a spot on the moor where it pools up thick as soup — down the old Roman drain, where the wall's broken.",
    '@Go taste it. Bring me PROOF. Then me mam HAS to give me a shilling. Those are the rules. I made them up, but they are binding.',
  ],
  q_penny_active: ["@Head to the broken part of the old wall, out on the moor, where the fog settles thick. You'll know the spot — it's so quiet even the sheep stay away."],
  q_penny_find: [
    '(Down the broken Roman drain, the fog pools cold and tastes like metal. Here\'s why: an old collapsed pipe is packed full of COINS — centuries of wishing-pennies and even a few real Roman ones, all of it humming faintly with stolen warmth.)',
    '(You pocket a fistful as proof — and the fog down here thins, just a little, like it was only ever this thick because nobody came to look.)',
  ],
  q_penny_full: ['@Is that— those are PENNIES. ROMAN ones! I was RIGHT! (He is so excited he can barely stand still.) Quick, before me mam calls bedtime!'],
  q_penny_done_beat: [
    '@You found where the taste comes from. I KNEW it weren\'t nothing. Here — keep the heaviest coin. Heaviest means luckiest. Everyone knows that.',
    "@When you're far away and it's gone all quiet, flip it. If it lands at all, that's me — saying the fog tasted of SOMETHING, and I wasn't making it up. {g:coin}",
  ],
  q_penny_after: ["@Me mam owes me a shilling AND an apology. I'll settle for the shilling."],

  // REGIONAL (sincere) — THE LAST OVER (the cricket captain; the match the term won't let end)
  q_over_ask: [
    "@(He's stood at bat so long his shoes have nearly taken root.) We can't stop playing, and here's the daft reason why: a cricket match only ends when the umpire calls it finished. Ours wandered off for a cup of tea three weeks ago — and that machine up at the school marked him ABSENT and won't let the day end. So we just play. And play. And play.",
    "@All we want is to go home for the holidays. So please — find our umpire for us. His name's Mr. Stumps, and he's the only one allowed to call the game over. He's stuck somewhere in that school, marked TRUANT for the crime of taking a tea break. Bring him back to us.",
  ],
  q_over_active: ["@Two things will set us free: first, find our umpire, Mr. Stumps — he's stuck somewhere in that school. Second, shut down the machine upstairs that keeps the clock running. Do both, and the game can finally end."],
  q_over_umpire: [
    "(In a form room, behind a door stamped TRUANT, an old man in a white coat sits very still, a cold cup of tea going colder in his hands. He has been waiting thirteen weeks to be told he is allowed to move.)",
    '@...Am I... released? (You tell him the term is very nearly over.) Oh. Oh, good. I do so hate to leave a match unfinished.',
  ],
  q_over_full: ["@You found him AND the clock's stopped upstairs? Then— (he can barely get it out)— Mr. Stumps. If you'd do the honours."],
  q_over_done_beat: [
    '(The old umpire walks out onto the pitch in the real daylight, raises both hands, and finally ends the match the only way an umpire can: "STUMPS! That\'s the game — go HOME, lads!")',
    "(Eleven small caps come off at once. Eleven boys remember they have homes, and trains to catch, and mothers who've kept a porch light burning through a whole wrong term.)",
    "@That's the match. That's the MATCH. Thank you — we'd honestly forgotten we were allowed to just... finish.",
    '* The First XI are going home.',
  ],
  q_over_after: ["@The nets are empty for the first time all season — every last boy\'s gone home. Loveliest sight in England, an empty net at the end of play."],

  /* ---------------- NPCs ---------------- */
  // S15c: at 2 A.M. the BOOM is minutes old — she speaks in the present
  // tense (her morning ask, q_biscuit_ask, opens at dawn through pemmelBeat)
  npc_pemmel: [
    '@{rex}! You felt that too?! The whole house went BOOM. My spice rack is on the floor.',
    '@Biscuit shot out the door the second it hit. Last I saw him he was halfway up Hill Road, pointing.',
    '@If you pass him out there, tell him bedtime is a LAW, not a suggestion.',
  ],
  npc_biscuit: ['@Woof! (He smells like pond. He seems enormously proud of this.)'],
  // ADR-042: the Hill Road cameo — he beat you up here, and he was right
  npc_biscuit_road: [
    '@WOOF. WOOF WOOF. (Biscuit is pointing at the hill with his whole body. Even the tail is pointing.)',
    '(He looks at you. He looks at the hill. He looks back at you, to make sure you got the message.)',
  ],
  // S15c: the walk back down — the hill has been handled and he knows it
  npc_biscuit_road_after: [
    '@WOOF! WOOF WOOF! (Biscuit is pointing at YOU now. The tail has reached a verdict: hero.)',
    '(He walks one proud little circle, sniffs your shoe, and points himself home. Case closed.)',
  ],
  npc_plummer: [
    '@Thirty-one years delivering mail, and not ONE box ever talked back.',
    '@This morning the one on Maple Street insulted my mail route — said it was boring and unoriginal. To my FACE.',
    '@Stay clear of it, kid. Critics bite.',
  ],
  npc_ana: ['@Lemonade! 25 cents! The secret ingredient is lemons. {g:lemon}'],
  npc_vivi: [
    "@Don't listen to Ana. The secret ingredient is a SECOND secret ingredient.",
    '@...It is also lemons.',
  ],
  // ADR-121: the twins are home, awake, the night the meteor falls.
  ana_room_night: [
    '@{rex}?! Did the sky just— okay, it DID. I am not crazy.',
    "@Vivi's pretending to be asleep but her eyes are doing the thing. Mom said back to bed. I'm resting my eyes AT the window. It counts.",
  ],
  vivi_room_night: [
    '@2:04 in the morning. One (1) falling star. Very rude about it. I wrote it down — for the records.',
    '@If you go up the hill, bring back a sample? For science. ...And so I can sell tickets.',
  ],
  npc_oldtimer: [
    '@A meteor, eh? In MY day the sky stayed put.',
    '@Except for birds. We allowed birds.',
  ],
  // S15c: the morning after — same obsession, new grievance (dialogueDay)
  npc_oldtimer_day: [
    '@Everybody keeps asking if I saw the meteor. I was ASLEEP. Like a professional.',
    '@Now the whole town is outside pointing up. The sky is that way, folks. It always was.',
  ],
  npc_pajama: [
    "@My mom says I can't go up Hickory Hill because it's 2 AM and a space rock fell on it.",
    '@Moms think of EVERYTHING.',
  ],
  // S15c: he made it to sunrise and wants it on the record (dialogueDay)
  npc_pajama_day: [
    '@I stayed up the WHOLE night. There was a boom and sirens and everything.',
    '@Mom says the hill is still off-limits in the daytime too. Moms remember EVERYTHING.',
  ],
  npc_mom_pre: [
    '@{rex}, honey. The sky fell on Hickory Hill and you have your shoes on already. Of course you do.',
    "@Take your bat. And this Salt Shaker — for the slugs. A mother knows.",
    '@Be home before your father calls. And take Chad with you, his mother worries. Sort of.',
  ],
  npc_mom_post: [
    '@You smell like smoke and starlight. Wash your hands, hero.',
    "@I'm proud of you. I don't need to know the details to know that.",
  ],
  npc_mom: ['@Dinner is {favoritefood}. Dinner is always {favoritefood}. I know my audience.'],
  // ADR-042: the full reset, said only when she actually fixed something
  npc_mom_heal: [
    "* Mom's once-over: hair, face, both elbows. Everything checks out. (HP and PP are all the way back.)",
  ],

  /* ---------------- signs (they editorialize) ---------------- */
  sign_welcome: [
    'WELCOME TO OTTERBROOK — pop. 412 and one very good dog. {g:paw}',
    '(Someone has written "THE DOG COUNTS DOUBLE" underneath. The town agrees.)',
  ],
  sign_hill: [
    'HICKORY HILL TRAIL — closed after dark.',
    '(The hill is not aware of this rule. The hill does what it wants.)',
  ],
  sign_chapel: [
    'OTTERBROOK CHAPEL — All welcome. Yes, even you, Gary.',
  ],
  sign_trail: [
    'TRAIL COURTESY: pack out what you pack in. The slugs have unionized.',
  ],
  // S22 (ADR-112) — THE LONGER CLIMB: two transitional legs up to the crater
  sign_hickory_trail: [
    'HICKORY TRAIL — switchbacks ahead. Elevation: yes. A lot of it.',
    "(A hand-nailed board: \"DIRT ROAD. NO CARS. NO BIKES. The hill said so.\")",
  ],
  sign_whisperwood_rise: [
    'WHISPERWOOD RISE — last of the trees before the bald crown of the hill.',
    '(The pines lean closer up here. Something fell through them three hours ago.)',
  ],

  /* ---------------- S15h — THE WORLD BLOCK (Otterbrook grew up) ---------------- */
  // the new south + east blocks: one weird obsession each (§A11), warm + plain
  npc_green_keeper: [
    '@The town actually pays me to keep the Civic Green cheerful. Real money, just to keep a park in a good mood.',
    "@I plant marigolds wherever the town's been grumpy. We had a LOT of grumpy this spring.",
    '@Go on, stand on the grass a minute. It works on kids too.',
  ],
  npc_pond_angler: [
    "@Forty years I've fished this pond. Caught a boot once, back in '78. Threw it back. Sportsmanship.",
    "@There's no fish in here, kid. Never was. That is not the point of a pond.",
  ],
  npc_south_neighbor: [
    '@We just moved out to the new south blocks. You can see SKY back here. Too much sky, if you ask me.',
    '@In the old part of town, everybody already knew your dog. Out here I had to introduce mine TWICE.',
  ],
  npc_gate_walker: [
    '@Some folks ride the 6:15 to Brickton. I WALK it. Meadow Mile, then the overpass. Builds character.',
    "@Mind the proctors at the city line — they check your visitor badge. Mine's laminated.",
  ],
  npc_mayor_otter: [
    '@Mayor of Otterbrook, twenty-two years running. Ran unopposed. Ran anyway.',
    '@We finally built City Hall! Before this I governed from a booth at the diner. Terrible acoustics.',
    '@New town law: the good dog on the WELCOME sign counts as half a person. So the sign now reads: population 412 and a half.',
  ],
  npc_hall_clerk: [
    '@City Hall — permits, parade routes, lost-and-found. How can I help?',
    "@Mostly it's lost-and-found. Mostly Biscuit's tennis balls. We keep a whole DRAWER.",
  ],
  sign_otter_hall: [
    'OTTERBROOK CITY HALL — built this year, at long last.',
    '(The cornerstone went in a little crooked. The Mayor calls it "rustic.")',
  ],
  sign_civic_green: [
    'THE CIVIC GREEN — please DO walk on the grass.',
    '(A smaller sign underneath: "We mean it. The grass gets lonely.")',
  ],
  sign_pond_park: [
    'POND PARK — no swimming, no lifeguard, no fish.',
    '(Beneath, in marker: "Excellent for thinking. Bring a sandwich.")',
  ],
  sign_meadow_gate: [
    'MEADOW MILE → BRICKTON CITY — on foot, past the overpass.',
    '(An arrow points east. Someone added: "...or take the bus, coward.")',
  ],
  sign_hall_wall: [
    'TOWN NOTICE BOARD — Lost dog: found. Bake sale: eaten.',
    'Council meeting Thursday. Topic: a SECOND stop sign. Bold of us.',
  ],

  /* ---------------- S15i Task 0 — THE DAYBREAK GATE + METEOR ROADBLOCK ----------------
   * The world past the treeline is sealed until dawn (the daybreak law, §B4):
   * the east line is a closed gate with a sleeping-town reason, never an
   * invisible wall, and at daybreak every NPC out here swaps to its day line.
   * Plain and clear — kids read this — EarthBound-flavored, never a riddle. */
  // the gate walker's morning line (dialogueDay): the line's open, mind the road
  npc_gate_walker_day: [
    '@The line to Brickton is OPEN again — sun came up, so the proctors clocked in.',
    "@Careful on Meadow Mile, though. Something fell in the road overnight. The town crew's out there now.",
  ],
  // the treeline gawker — won't go look at 2 AM, full of opinions by daylight
  npc_treeline_gawker: [
    '@Did you SEE that? Something fell behind Hickory Hill. A whole chunk of sky, straight down.',
    "@I'm not going up there. It's 2 in the morning and that is a NIGHT problem.",
    '@You go look. You seem like a go-look kind of kid.',
  ],
  npc_treeline_gawker_day: [
    '@So that was a meteor. A real one. A REAL meteor, behind Hickory Hill.',
    '@The whole town walked out to see the crater this morning. I brought a thermos.',
    "@Careful if you're headed east — the road's blocked off where a piece of it landed.",
  ],
  // the meteor-drop roadblock on Meadow Mile — a town worker waving you around
  npc_roadblock_worker: [
    '@Whoa — hold up. A chunk of sky landed in the road last night.',
    "@Still too hot to budge. Nobody's getting a truck through here today.",
    '@You can squeeze around on the grass if you must. Mind your shoes — that gravel POPS.',
  ],
  sign_roadblock: [
    'ROAD WORK AHEAD. Reason: meteor. (Yes, really.)',
    'Find another way around. — Otterbrook Public Works',
  ],
  // the sealed east line at night — read at the barricade itself
  sign_meadow_gate_closed: [
    'GATE CLOSED — Otterbrook rolls up the sidewalks at night.',
    '(A note is clipped on: "Road opens at sunup. Get some sleep, kiddo.")',
  ],
  // shown when you walk into the shut gate before dawn (the door-bump reason)
  meadow_gate_asleep: [
    'The road east is gated shut for the night.',
    'Otterbrook is fast asleep — porch lights, crickets, and one dog who knows something.',
    'Whatever fell on the hill will keep until morning. Better head back.',
  ],
  // ADR-121: the road stays fogged through the Hush-dark, until the Tick is killed
  meadow_gate_hushdark: [
    'The road east is still barricaded — and past it, the highway just... fogs out into gray.',
    "It's the wrong kind of fog. Cold, and quiet, and it gets quieter the longer you look at it.",
    "Nobody's leaving Otterbrook while the town feels like this. Something's draining the warmth right out of it — and it's coming from Pond Park.",
  ],

  /* ---------------- S15i Task 1 — THE WOODS NOOK (the grown SW thicket) ---------------- */
  sign_otter_woods: [
    'OTTERBROOK WOODS — a footpath, a few birds, one good picnic table.',
    '(Someone scratched below: "best napping in three counties.")',
  ],
  npc_woods_birder: [
    "@Shh. Twelve years I've waited for a cardinal to land on THAT branch. Twelve.",
    '@There IS a picnic table back in the trees. I put it there. For the birds. Fine, for me.',
    '@If you sit quiet long enough, the woods forget you came. It is the best feeling there is.',
  ],
  // ADR-056 (§B4): the glade present — a sibling reward to the rest
  otter_woods_gift: ['Half-buried by the picnic table: a cold Star Cola, left for whoever found the quiet first.'],
  otter_woods_gift_done: ['(The spot is yours now. The birds approve. The birder does not, quite, but he is trying.)'],

  /* ---------------- S15h — MEADOW MILE + THE ORIENTATION GATE ---------------- */
  meadow_mile_sign_0: [
    'MEADOW MILE — one mile of meadow, give or take a meadow.',
    '(Mile marker 0 has been doodled into a smiley face. Of course it has.)',
  ],
  meadow_mile_sign_1: [
    'BRICKTON CITY LIMITS AHEAD — mind the overpass.',
    '(Hand-painted underneath: "The city is bigger than you. Be polite about it.")',
  ],
  sign_overpass_gate: [
    'BRICKTON VISITOR ORIENTATION — all newcomers processed at the line.',
    '(Smaller: "Have your badge ready. Or your smile. Preferably both.")',
  ],
  npc_proctor: [
    '@WELCOME, prospective visitor! (The smile does not move when she talks.)',
    '@Orientation is MANDATORY. It\'s also FUN. Around here, you\'re not given a choice about either one.',
  ],
  npc_road_traveler: [
    '@Walking to Brickton, huh? Brave. The bus has a roof, you know.',
    "@Watch out for the smiling guards at the overpass. They're way too happy to see you — and that's the part that should worry you.",
  ],
  // S15i Task 5 (clarity): plainly STOPPED + TESTED for a badge, and the
  // "exercises" are a fight — no guessing what the gate wants (kids read this)
  orient_intro: [
    'A blazer-smiler steps into the road and blocks it, clipboard glowing.',
    '@HALT, new visitor! Nobody walks into Brickton without a VISITOR BADGE.',
    '@Orientation is MANDATORY. Three quick... exercises. Pass them and the badge is yours.',
    '@Exercise one: ENTHUSIASM! (He raises his fists. The "exercise" is a fight. Of course it is.)',
  ],
  orient_round_1: ['@EXERCISE ONE — greet your greeter with ENERGY!'],
  orient_round_2: ['@EXERCISE TWO — maintain eye contact and POSITIVITY!'],
  orient_round_3: ['@FINAL EXERCISE — you may now express how GLAD you are to be here!'],
  orient_badge: [
    'The last blazer-smiler straightens his tie and beams, defeated and delighted.',
    '@CONGRATULATIONS! You are a CERTIFIED VISITOR. Here is your badge. Do not lose it.',
    '* You got the VISITOR BADGE! The city line is open — you can walk in any time now.',
  ],
  orient_arrival: [
    'You cross the overpass into Brickton. The city does not look up.',
    '(Somewhere ahead, a clock is seven minutes fast. On purpose.)',
  ],

  /* ---------------- S15i M3 — THE LONG WALK (the foot legs) ---------------- */
  // LEG 1 — MEADOW MILE points the way (clarity: the whole route spelled out)
  sign_to_whisperwood: [
    'WHISPERWOOD AHEAD → then the far meadow, then the overpass, then the city.',
    '(A long way on foot. "The bus is RIGHT THERE," adds a smaller, smugger sign.)',
  ],
  // LEG 2 — WHISPERWOOD
  sign_whisperwood: [
    'WHISPERWOOD — stay on the path. The trees lean in, but they mean well.',
    '(Lost & Found, nailed below: one kite, one frisbee, one very patient cat.)',
  ],
  meadow_gift_woods: ['Tucked down in the roots: a picnic basket, packed and forgotten. The woods kept it dry.'],
  meadow_gift_woods_done: ['(The basket is empty now. A squirrel has filed a formal complaint.)'],
  // the roadside vignette — a quiet woods beat, played warm (a cutscene, once)
  woods_vignette: [
    'Halfway through the trees you stop. Something is watching you from the ferns.',
    'A fawn. Just a fawn — knock-kneed, huge-eared, and deeply unimpressed by you.',
    'It blinks once and goes back to eating. The woods decide you are allowed through.',
  ],
  // LEG 3 — THE FAR MEADOW
  meadow_far_sign_0: [
    'THE FAR MEADOW — you are officially Out Past The Edge Of Town now.',
    '(Pencilled below: "the air gets warm and electric about here. that\'s the city.")',
  ],
  npc_far_walker: [
    '@My big sister WALKED to Brickton once. Took her all day. She came back different.',
    '@Different GOOD! She high-fives strangers now. The city does that, she says.',
  ],
  meadow_gift_far: [
    'Taped to a fence post: an emergency salt shaker and a note.',
    'The note reads, in shaky capitals, "FOR THE TICK." ...Somebody up here KNEW.',
  ],
  meadow_gift_far_done: ['(The post is bare now, but the warning stands. Salt beats ticks. Remember it.)'],
  // LEG 4 — THE OVERPASS
  meadow_overpass_sign_0: [
    'THE OVERPASS — Brickton city limits. Watch your step, and mind the proctors.',
    '(Down in the concrete, in chalk: "almost there, kid.")',
  ],
  // the "you can see the city now" reveal (a cutscene, once) — foreshadows Mia
  city_reveal: [
    'The path lifts onto the overpass — and there it is, laid out below you.',
    'BRICKTON. Towers, smoke, and one tall new spire catching the last of the sun.',
    'Somewhere down in all of that is a girl who can hear things sing. You two have not met yet.',
    '(You can not hear the city from up here. Not yet. But you will.)',
  ],

  /* -------- S15i Task 3 (ADR-058) — THE WALKERS' REGISTER (Ch.1 #5, the route quest) -------- */
  q_walkreg_ask: [
    '@The man on the road shifts his bag from shoulder to shoulder. "Name\'s Hal. Walking to the city. First time on foot."',
    '@"My uncle Pell keeps the Walkers\' Register up at the overpass. Used to be every kid signed it. Now they all take the bus."',
    '@"Do me a kindness? Walk the whole way and really LOOK at each stretch. Then sign us both in. Prove the walk still gets walked."',
  ],
  q_walkreg_active: [
    '@"Keep going. Notice the meadow, the woods, the far stretch — the things a bus window slides right past."',
    '@"Then sign the Register at the overpass. Both names. I\'ll catch up. I always do, eventually."',
  ],
  q_walkreg_after: [
    '@"You signed it. WE signed it." Hal grins like a kid. "I walked the whole way. Tell anybody who asks: it was worth every step."',
  ],
  // the three "noticing" tokens (toasts fire on the trigger; these are the journal beats)
  walkers_register_book: [
    'THE WALKERS\' REGISTER — a ledger on a post, names going back decades.',
    '(The recent pages are blank. Everyone takes the bus now. Hal asked you to walk it and sign.)',
  ],
  walkers_register_wait: [
    'The Register waits, pen on a string.',
    '(You have not really LOOKED at every stretch yet. Walk them first — then your name means something.)',
  ],
  walkers_register_sign: [
    'You write your name in the book, and under it you write HAL, like he asked — two more walkers signed in for good, on the long way around.',
    'Old Pell — turns out he is right there, tending the post — reads it twice and presses a pressed-flower charm into your hand.',
    '@"Most folks save twenty minutes and never see the meadow," he says. "You saw all of it. Carry that."',
  ],
  walkers_register_after: ['(Your name is in the Register now, beside Hal\'s. The long way is still walked. Good.)'],
  walkers_register_full: ['(Pell holds the charm out, but your hands are full. "It\'ll keep," he says. "Come back lighter.")'],

  /* ---------------- S15h — BRICKTON SPRAWLS (the new districts) ---------------- */
  npc_maple_resident: [
    '@Welcome to MAPLE HEIGHTS. No maples. No heights. The brick is real, though.',
    '@My apartment has a VIEW. Of another apartment. With a view of mine. We wave.',
  ],
  npc_south_vendor: [
    '@Fresh off the new street! Get your... I genuinely forget what these are. They were on sale.',
    '@Two for a dollar. One for a dollar. Pricing is an art, not a science.',
  ],
  npc_new_commuter: [
    "@This whole block wasn't here last month. I think. I don't look up much.",
    '@They built east, then south, then east again. The bus map gave up. I respect that.',
  ],
  npc_dockward: [
    '@Docks? End of the line, keep heading east. They moved the whole port when the city grew.',
    '@The docks used to be right downtown. Now it\'s a long walk east — and it smells like low tide the whole way. They call that progress.',
  ],
  sign_maple_heights: [
    'MAPLE HEIGHTS — brick rows, fair rent, zero maples.',
    '(A tenant has amended it: "the rent is not fair. the brick is still brick.")',
  ],
  sign_cage_block: [
    'THE CAGE — full court, two blocks north. Respect the chain.',
    '(An arrow points back toward downtown. The arrow has been dunked on.)',
  ],
  sign_south_gate: [
    'BRICKTON CITY LINE — visitors, mind the overpass.',
    '(Below: "Meadow Mile, that way. Bring water. Bring a smile. They check.")',
  ],
  sign_new_docks: [
    'BRICKTON DOCKS → keep east, to the water.',
    '(The old "TO DOCKS" sign downtown still points here. Not wrong, just optimistic.)',
  ],

  /* ---------------- S15i Task 1 — THE HIGH-RISE DOWNTOWN + THE COLOSSUS ---------------- */
  sign_downtown_high: [
    'DOWNTOWN HIGH — mind the wind off the towers, watch for falling memos.',
    '(A directory lists 200 offices. 199 are "Consolidated Something.")',
  ],
  npc_downtown_suit: [
    "@I work on the 40th floor. I have NEVER seen the top of my own building.",
    '@You look up, the building just keeps going. At some point you stop looking up and start working. That is the city.',
  ],
  sign_spire: [
    'THE STARFALL SPIRE — tallest thing in Brickton. Observation deck: closed (forever).',
    '(Smaller: "It is a 20-minute walk AROUND the base. We timed it. Bring a friend.")',
  ],
  npc_spire_gazer: [
    '@That\'s the Starfall Spire. It\'s so tall the very top disappears straight up into the clouds.',
    '@My uncle painted the very tip. He waved at a plane. The plane waved back, he SWEARS.',
    "@You want to reach the docks, go around it. You can't go through. People have tried.",
  ],

  /* ---------------- doors that aren't doors yet ---------------- */
  locked_chapel: [
    'The chapel doors are closed this late. A small card reads:',
    '"Knock softly. He hears fine."',
  ],
  locked_chad: [
    "The Pickles' door is locked. Through it you can hear Chad rehearsing a victory speech about tonight.",
  ],
  locked_house: [
    'Locked. Inside, a TV is calmly explaining the meteor. The word "PANIC" is used twice, responsibly.',
  ],
  // ADR-042: the Hill Road homes — the last neighborhood before the trail
  sign_hill_road: ['HILL ROAD — last houses before the trail.', '(Someone has added: "AND PROUD OF IT.")'],
  hill_house_a: [
    'Locked. Behind the door, someone is telling a cat that everything is fine, in a voice that really needs the cat to agree.',
  ],
  hill_house_b: [
    'Locked. The doorbell has a hand-written label: "BROKEN. PLEASE KNOCK. PLEASE DO NOT KNOCK TONIGHT."',
  ],
  hill_road_prints: ['(Paw prints, heading uphill. No hesitation in them anywhere.)'],

  /* ---------------- cutscenes ---------------- */
  // (ADR-041: intro_card retired — the opening cinema's timed captions in
  // OverworldScene.openingMeteorCinema own the scene-setting text now, and
  // chapter banners are gone from player-facing text everywhere.)
  intro_wake: [
    'The roar shakes the floor, the bed, the windows — the whole house at once.',
    "For one bright second, the flash lights up your room like it's daytime. Then it's dark again.",
    "Downstairs, Mom calls your name — not scared, just checking you're still where she left you.",
    'Out the window, the top of Hickory Hill is glowing orange, like a stove burner left on.',
    'Your room looks normal again — bed, desk, baseball bat — and a very bad idea is already forming in your head.',
    '({rex} is already putting on his cap. Somehow you knew he would be.)',
    '* GOAL: Go downstairs and check on Mom.',
  ],
  chad_join: [
    "@{rex}! Did you SEE that?! The sky EXPLODED! I saw it first, by the way. That's canon now.",
    "@I'm coming too. Obviously. I'm basically the leader.",
    '@...You go first though. If anything scary happens, scream in a manly way.',
    '* Chad Pickle tagged along! (He immediately stood behind you.)',
  ],
  crater_approach: [
    'The whole hilltop is humming, like someone just rang a giant bell.',
    'In the middle of the burnt crater, something small is glowing. It is not a rock.',
  ],
  glint_prophecy: [
    '@...oh good. Ohhh, good — you came. A real kid, carrying the old light. Just like the song promised.',
    "@No time. Listen. I'm Glint. I rode here on that meteor — running from the thing that rode in on it with me.",
    '@That thing is THE HUSH. It feeds on the warmth between people — calls to your mom, the dog meeting you at the door, music. It eats all of it.',
    '@When the meteor broke apart, it split into ten EMBERS — and they scattered all over the world.',
    '@Only kids who carry the old light can shut it up. It takes a few of you — I don\'t know the exact number, the song keeps changing. You\'re the first. You\'ll find the others. One of them—',
    '@Here. The STAR LOCKET. Stand where an Ember is singing and it saves that sound — one HEARTLIGHT. Collect ten Heartlights and together they make the HOMESONG.',
    "@The Homesong is the one sound the Hush can't swallow. Don't ask how I know — knowing that is the only thing my kind is good for.",
    '* {rex} got the Star Locket!',
  ],
  tick_warning: [
    '@...wait. Hold on. Kid — something\'s down there, under the crater. And it\'s waking up.',
    'THE CRATER RIM BULGES—',
  ],
  // ADR-121 — the crater holds the MARS SENTINEL, not the Tick. Glint's "the thing
  // that rode in on it with me" (glint_prophecy) arrives RIGHT NOW.
  sentinel_warning: [
    "@...no. No no no. Kid — the thing I was running from? It rode in WITH me. It's here. It's RIGHT HERE.",
    'Down in the crater, something the size of a house is standing up on too many legs. A single cold blue eye swings around and finds you.',
    "@That's a piece of Mars, kid. We are SO far out of our league. But I am NOT letting it have you. Stand BEHIND me—",
  ],
  sentinel_again: [
    'The crater still breathes cold blue light. The Sentinel is still down there, half-risen, waiting for you to come back.',
    "@Round two, kid. Same plan: you stay alive, I burn bright. GO.",
  ],
  sentinel_after: [
    "(The cold light gutters out. The thing folds itself back into the crater, and the night goes quiet — normal quiet, summer-cricket quiet.)",
    "@...heh. We did it. We actually— oh. Oh, I am running on FUMES, kid.",
    '(Glint is dimmer than he was. A lot dimmer. He bobs once, bravely, and points you down the hill toward home.)',
  ],
  sign_sentinel_husk: [
    '(The husk sits half-sunk in the crater, dead metal gone the color of old blood. The eye is a black hole now.)',
    "(It's cooling, but it isn't rusting. Whatever it's made of, it's just... waiting. You decide not to touch it.)",
  ],
  // ADR-121 — BOSS 1 relocated: the Tick in the Heart Oak (Pond Park), draining town
  heart_oak_approach: [
    'The great Heart Oak in Pond Park is wrong. The bark has gone gray, the leaves hang colorless, and a low sick hum comes off it in waves.',
    'A split runs up the trunk — and deep inside, wedged into the living heart of the tree, something eight-legged turns to look at you. It has been DRINKING the town.',
    "(No Glint this time. Just you, the old light he left behind, and a Salt Shaker in your bag. Make it let go.)",
  ],
  tick_after: [
    "(The Tick is gone, and the warmth it hoarded comes roaring back — into the oak, the pond, the streetlights, the whole gray town all at once.)",
    'The Hush-dark breaks like a fever. Color floods back. Somewhere east, a bus engine turns over for the first time in days, and the road out of Otterbrook clears in the rising light.',
    "@(Real morning. Finally.) Okay. Brickton. The girl who prays. Let's go find her.",
  ],
  chad_flee: [
    '@NOPE. Nope nope nope. I just remembered I\'m allergic to bug juice!',
    "@This is a strategic retreat! Tell everyone I fought GREAT!",
    '* Chad fled to go tell your mom you broke curfew. (Betrayal #1.)',
  ],
  ember_get: [
    'The Tick deflates. The hum it stole pours back out of it and into the ground, the trees, the air.',
    'Something small and warm rises from the crater and settles into the locket like it lives there.',
    '* The Star Locket recorded the 1st HEARTLIGHT!',
    '(Somewhere inside the locket, one instrument starts to play.)',
  ],
  glint_after: [
    '@HA! Eight legs, and it STILL lost to one kid with a bat. You fought like four of you out there. ...Don\'t tell the others I said so.',
    '@Come on. Walk home. I\'ll finish the prophecy on the way. It has a REALLY good ending.',
  ],
  /* ---- AWAKENINGS (S12b, ADR-035) — the old light arrives as moments,
     never as menu rows. §A11.2: sincerity is never the joke. ---- */
  awake_old_light: [
    '@Hold still. This part is yours.',
    '(Glint dips low and presses something warm against {rex}\'s chest — old as porch lights, brave as July.)',
    "(It crowds in behind the ribs like it has always lived there and only now remembered the address.)",
    '@That\'s the OLD LIGHT, kid. When something grabs hold of you and won\'t let go — and something WILL — you let it all the way out.',
  ],
  awake_last_spark: [
    '(The spark does not fade. It settles in next to the old light, smaller, softer — a night-light, not a torch.)',
    "({rex} understands it the way you understand your own name: some warmth is for keeping other people going.)",
  ],
  awake_first_listen: [
    '@...It\'s singing. The little one inside. Did you know it sings?',
    '(She holds the Locket to her ear the way you hold a seashell, and her eyes go somewhere bright.)',
    '@It sounds like a match catching. Like the stove at home, first thing, before anyone else is up.',
    '(Something in the room gets warmer. It is her.)',
  ],
  porch_zapper: [
    '@...so: the Embers sing, the locket saves them, and once you\'ve got all ten, you go UP. Way up. All the way to Mars. There\'s a rocket. You\'ll love it.',
    '@One more thing. The most important thing. Find the girl in Brickton. The one who hears the Embers. Tell the girl who prays—',
    'BZZT.',
    "(The Pickles' bug zapper claims another hero.)",
    '@...tell her... the song already knows her name...',
    '* Glint left behind a single warm spark.',
    '* {rex} got GLINT\'S SPARK. (He will not be using it for a while. It is a friend.)',
  ],
  phone_dad: [
    '@RING... RING...',
    "@Hey, champ. Heard the sky fell on the hill behind the house. Your mother says you handled it. 'Course you did.",
    '@I put $50 into your account. Don\'t spend it all on corn dogs. Spend MOST of it on corn dogs.',
    '@Have you been eating well? Get some sleep, slugger. Big world out there. I\'ll be on the phone when you need me.',
  ],
  save_done: ['* Dad saved your progress. (He sounded proud about it.)'],
  /* ---------------- the PICNIC set (S14 - Bible Prompt 23) ---------------- */
  picnic_no_basket: [
    'A fine table. Level, shaded, judgment-free.',
    '* If only somebody had packed a basket. (Shops sell PICNIC BASKETS. Delis build better ones.)',
  ],
  picnic_spot: ['This is the spot. The table agrees. The birds are already negotiating.'],
  picnic_scene: [
    'The blanket unrolls itself, basically.',
    'Sandwiches. The good thermos. Two birds land and pretend not to stare.',
    '* Everyone ate until the world felt friendly again. HP and PP came all the way back!',
  ],
  picnic_feast: [
    "* The Feast settles in everyone's bones, warm and stubborn.",
    '* (FEAST: if the whole party ever goes down, it will answer. Once.)',
  ],
  picnic_no_spot: ["There's no good spot here."],
  /* ---------------- S4 — the phone is a contact list now (Prompt 20) ---------------- */
  phone_pickup: ['You picked up the receiver. The dial tone hums, warm as area code 216.'],
  phone_mom_home: [
    "@(From the kitchen:) Honey. I am RIGHT HERE. Hang up the phone and come hug your mother.",
  ],
  phone_mom: [
    '@RING... RING... ...click.',
    "@{rex}! You dialed all by yourself! I'm telling the refrigerator.",
    "@Are you eating real meals out there? {favoritefood} counts. Tonight it's {favoritefood} here too, in your honor, eaten by me.",
    '@Your father handles the SAVING. I handle everything else. Call when the everything-else acts up, okay? Love you. Wash something.',
  ],
  phone_mom_cure: [
    '@RING... RING... ...click.',
    '@...{rex}. Baby. You sound a hundred miles away. And not the bus kind of miles.',
    "@Listen to me. The kitchen light is on. The pan is already out. The very minute you walk in that door, it's {favoritefood}. That is a PROMISE.",
    "@Now go be twelve at the sky some more. You're doing so well it scares the neighbors.",
  ],
  mom_cure_beat: [
    "* The knot in {rex}'s chest untied itself. He isn't HOMESICK anymore — home is just up ahead, is all.",
  ],

  /* ---------------- S6 — Dad's three notebooks (Prompt 22: save slots) ---------------- */
  dad_slot_ask: [
    "@Oh— hold on, champ. New filing system. I bought THREE notebooks. The store had a deal. You'd have done the same.",
    '@Which notebook is yours?',
  ],
  dad_backup_apology: [
    "@RING RING— (It's Dad. He sounds like a man who has been rehearsing.)",
    '@Champ. Before you open the notebook. There was... coffee. A lot of coffee. Your page is abstract art now.',
    "@BUT. Your old man presses down HARD when he writes. The page underneath caught every word. Carbon copy. Press hard, love harder — that's the whole trick.",
    '* Dad recovered your save from the page underneath. (The coffee has been spoken to.)',
  ],
  dad_backup_lost: [
    "@RING RING— (It's Dad. He sounds smaller than usual.)",
    "@Champ... the coffee got your page AND the page under it. I'm so sorry. I know how far you walked.",
    "* The save couldn't be recovered. (Dad is keeping the notebook anyway. In case the words come back.)",
  ],

  /* ---------------- S4 — the ATM at the SAVINGS & LOAN facade ---------------- */
  atm_greet: [
    'OTTERBROOK SAVINGS & LOAN — ATM.',
    '(The bank behind it is closed. The ATM never closes. It dreams standing up, in fives and tens.)',
  ],
  atm_bye: ['* HAVE A NICE DAY, says the screen, in a font that means it.'],
  atm_empty_card: ['The account is empty. The screen shows a single sympathetic pixel.'],
  atm_empty_pocket: ['Your pockets contain no money. The ATM respects the honesty.'],

  /* ---------------- S4 — shops (Prompt 20; §A11: one obsession each) ---------------- */
  shop_drug_greet: [
    '@Welcome to OTTERBROOK DRUG. Everything on these shelves expires, son, and I know every date by heart.',
    '@The salt: never. The bats: the day you stop believing. The corn dogs: Thursday.',
  ],
  shop_drug_bye: ['@Come back before Thursday.'],
  shop_mart_greet: [
    '@Welcome to STARMART, home of the 24 nonconsecutive hours!',
    '@Mind the carts. We open with forty every morning. The parking lot decides how many come home at night.',
  ],
  shop_mart_bye: ['@Thank you for choosing STARMART! The carts and I will speak of you.'],
  sign_drug_wall: [
    'OTTERBROOK DRUG — EST. BEFORE YOU. "If we don\'t stock it, the hill probably dropped some."',
  ],
  sign_mart_wall: [
    'STARMART HOURS: 24.',
    '(A smaller sign, lower down: "not in a row. we have families.")',
  ],

  /* ---------------- S10 — the STARPORT arcades (§A10 #4) ---------------- */
  // Otterbrook: the original. Open 24 hours; the machines refuse to sleep.
  cab_slug_hunter: [
    'SLUG HUNTER. HIGH SCORE: 999,999 — "STK".',
    '(The buttons have been sticky since 1991. Nobody can play it, so nobody can beat it. It chirps about this, alone, at night.)',
  ],
  cab_lawn_lord: [
    'LAWN LORD — mow the lawn before the lawn mows YOU.',
    '(This cabinet predates the Runaway Lawnmower. This cabinet is not sorry.)',
  ],
  cab_tax_kid: [
    'TAX KID. You are a kid. You do taxes. Faster and faster.',
    '(Nobody has ever reached the bonus round, "AUDIT". The flyer claims it has a second joystick.)',
  ],
  arcade_gap: [
    '(A cabinet-shaped patch of extremely clean carpet.)',
    'A note, taped to the wall: "THE BIG GAME MOVED TO THE SEQUEL. Like everybody. — MGMT"',
  ],
  cab_retired: [
    'CHAMP CHIMP — RETIRED. UNDEFEATED.',
    "(Unplugged years ago. Sal couldn't bear to move it. The marquee still says CHAMP.)",
  ],
  arcade_counter_note: [
    'MGMT IS AT THE SEQUEL. Take a token, leave a token.',
    '(The cup holds one token and a strong honor system.)',
  ],
  // Brickton: STARPORT II, "The Sequel to the Arcade" — quest #4's venue
  cab_grandma: [
    'GRANDMA RAMPAGE — she has had ENOUGH.',
    '(The high score is held by an actual grandma. Sal rated her: first place, all-time, category GRANDMAS.)',
  ],
  cab_fish_boss: [
    'FISH BOSS — you are the boss. Of fish.',
    '(The fish do not respect the org chart. That is the whole game.)',
  ],
  cab_smile_sim: [
    "SMILE SIMULATOR '95.",
    '(Donated by an office downtown. Unplugged by Sal personally. The screen still feels warm.)',
  ],
  cab_island_a: [
    'PAPER PILOT — fold it, fly it, FEAR it.',
    '(Somewhere far east of here, monks would have opinions.)',
  ],
  cab_island_b: [
    'BUG ZAPPER: CHAMPIONSHIP EDITION.',
    '("Too soon. — MGMT")',
  ],
  arcade2_fridge_note: [
    'STAR COLA — OFFICIAL FUEL OF LEGENDS.',
    '(The fridge hums in B flat. Somebody you know would notice that.)',
  ],
  // THE machine. OverworldScene's signBeat owns the play/walk-away ask and
  // launches ArcadeScene; these pages set the table first.
  cab_legend: [
    'ARCADE LEGEND. The marquee is the warmest light in the room.',
    '(The attract mode flashes a high score and three letters. The machine seems tired of them.)',
  ],
  cab_legend_yours: [
    'ARCADE LEGEND. The marquee is the warmest light in the room.',
    '(The attract mode flashes YOUR initials now. The machine seems prouder than it lets on.)',
  ],
  // SAL — owner of both STARPORTs; he keeps a high-score table for everything
  npc_arcade_owner: [
    "@Sal. STARPORT — both of them. I keep score. You're doing fine.",
  ],
  q_arcade_ask: [
    "@Welcome to STARPORT II, the sequel. I'm Sal. I own both. The first one's the prequel now — the industry did that, not me.",
    "@I keep scores. The weather: today's a 7,200. You: trending up. That machine over there— (he does not look at it) —that machine is my problem.",
    '@Guy in a blue blazer. Smiled the WHOLE time. Played ONE game, scored three thousand EXACTLY, signed it "MGR", and left.',
    '@Who stops dead on a round number? Not a kid — a kid plays till he loses. Only a man with a QUOTA quits at exactly three thousand, smiles, and walks out.',
    "@Knock him off my board, kid. I'd do it myself, but the staff can't watch me lose. They're cabinets. They talk.",
    '* Sal wants the "MGR" score gone. (Across the room, the machine chirped. It agrees.)',
  ],
  q_arcade_active: [
    '@Three thousand and his three letters, still up there. The weather hit 7,400 today. Even TUESDAY is outscoring you, kid.',
  ],
  q_arcade_claim_beat: [
    "@...KID. The board. THE BOARD. He's GONE. You're UP. I have checked it forty times and rated the feeling: first place, all-time.",
    '@This is yours. Hung it behind the counter the day we opened, waiting for a name that wasn\'t his.',
    '* {rex} got the CHAMPION JACKET!',
    "@Wear it everywhere. ESPECIALLY anywhere a blue blazer might see it. And if my phone ever finds you at the end of the world — ANSWER. I'll have numbers for you.",
  ],
  q_arcade_full: [
    '@Hands full?! Kid. This jacket waited YEARS. It can wait one more pocket. Go make room and get back here.',
  ],
  q_arcade_after: [
    "@Every morning I check the board, and every morning it's still you. Ten out of ten. Both arcades' worth.",
  ],
  sal_after_meeting: [
    '@Heard the blazer guy is "in a meeting" these days. A long one. I rated it: first place, all-time, category MEETINGS.',
  ],

  /* ---------------- the 6:15 bus ---------------- */
  bus_ask_brickton: [
    'The 6:15 to BRICKTON CITY is somehow always about to leave.',
    '(Mom prepaid your fare. She also packed a snack. You already ate the snack.)',
  ],
  bus_ask_home: ['The 6:15 also goes back to OTTERBROOK. Buses are like that.'],
  // S22 (ADR-113) — THE BUS WAITS: the depot is shuttered until you've reached
  // Brickton once ON FOOT (the meteor closed the highway; the bus follows it back).
  bus_closed_detour: [
    'The 6:15 is dark. A card is taped inside the depot window:',
    '"NO SERVICE. Driver says she can\'t see the road past Pond Park anymore. Says the whole town\'s gone gray and cold. — Otterbrook Transit (both of us)."',
    "(The bus won't run while the town feels like this. Whatever's draining Otterbrook is curled up in the Heart Oak in Pond Park. Pull it out, and the warmth — and the road — come back.)",
  ],
  // S22 (ADR-114) — THE DEPOT: the bus stop becomes a real building
  sign_bus_moved: [
    'BUS STOP — RELOCATED. Catch the 6:15 at the new TRANSIT DEPOT, east by the pond. →',
    '(Someone added: "they built a whole BUILDING. With a roof. We are a real town now.")',
  ],
  bus_stop_moved: [
    'A bus used to stop here. Now there is just a sign and a hopeful little bench.',
    'The 6:15 boards at the TRANSIT DEPOT now — east of here, past the pond.',
  ],
  sign_bus_depot: [
    'OTTERBROOK TRANSIT DEPOT — est. 1952. Routes: BRICKTON (the 6:15).',
    '(A chalkboard below: "DELAYS: meteor. SAFE TRAVELS: always. LOST MITTENS: bin by the door.")',
  ],
  npc_depot_clerk: [
    "@Tickets? Schedules? A warm place to wait? You're in the right shed, kiddo.",
    "@The 6:15 boards out at the curb. I'd walk out and point, but I promised this stool I'd never get up.",
  ],
  npc_depot_clerk_day: [
    "@Highway's open again — heard it from the milk truck before I heard it official.",
    '@Board out at the curb whenever you like. Tell Brickton the Depot says hello, then immediately regrets it.',
  ],
  npc_bus_waiter1: [
    '@Every morning, same bench, same bus. I find it deeply reassuring and mildly upsetting.',
  ],
  npc_bus_waiter2: [
    "@Is the 6:15 late, or did I show up early? In a town this sleepy, nobody can ever really tell the difference.",
  ],
  // S22 (ADR-115) — THE TYCOON TEASERS: you CAN buy a home and a car from the very
  // first town... someday. Right now they're gloriously out of a 12-year-old's reach.
  npc_realtor: [
    '@OTTERBROOK REALTY! You buying a house? You\'ve got the serious look of a real buyer — and the savings of a kid with a big allowance.',
    '@27 MAPLE just came on the market. Cozy! One previous owner — she took the doorknobs, left the beagle.',
  ],
  agency_owned: [
    '@You already own 27 Maple, hon. Go home and water a plant. That\'s what owning a house is, mostly.',
  ],
  agency_browse: [
    '@Just looking? Look all you want. The look is free. The HOUSE is twelve hundred dollars.',
  ],
  agency_too_dear: [
    '@...Twelve hundred dollars. You have, and I am counting generously, NOT that.',
    '@Tell you what, champ — go save the world a little, come back a tycoon. The door (we have one now) stays open.',
  ],
  agency_bought: [
    'You sign the crayon box. The agent hands you a DEED and a single doorknob "to get you started."',
    '@Welcome home, neighbor. Try not to put a meteor through it.',
  ],
  npc_car_dealer: [
    "@BERT'S AUTO — where the test drive is a feeling and the prices are a different feeling.",
    '@See a car you like? Even if you don\'t, just tell me you do. It\'ll make both our days better.',
  ],
  carlot_browse: [
    "@Take your time, sport. The cars aren't going anywhere. Mostly because two of them don't start.",
    '@Come back when you\'ve got the cash AND a place to park it. A car needs a garage, a garage needs a HOUSE — so buy the house first. Funny how it all rolls downhill.',
  ],
  // S22 (ADR-116) — DOWNTOWN OTTERBROOK (Main & Vine): the little commercial row
  sign_to_downtown: [
    'DOWNTOWN OTTERBROOK → "Main & Vine," just past the depot. Hardware, hot lunch, the works.',
  ],
  sign_downtown: [
    'DOWNTOWN OTTERBROOK — "Main & Vine." Hardware, hot lunch, and a haircut you did not ask for.',
  ],
  sign_hardware: ["HODGKIN'S HARDWARE — If we don't have it, you didn't need it. (We have it.)"],
  sign_diner: ['THE SUNNY SIDE — Breakfast all day. Lunch also all day. It is always a meal here.'],
  sign_barber: ["VINE ST. BARBER — Back in 5. (The sign has said this since 1987.)"],
  // S22 (ADR-120) — THE OTTERBROOK CLINIC (front desk revive + exam room)
  sign_clinic: ['OTTERBROOK CLINIC — Walk-ins welcome. Faint-ins carried. Open since the meteor "for obvious reasons."'],
  clinic_wall: [
    'OTTERBROOK CLINIC — front desk for the unconscious, back room for the merely unwell.',
    '(A flyer: "GOT A STRANGE BLUE FOG IN YOUR HEAD? We can\'t fix that here — it comes from the thing up on the hill. Go see a priest.")',
  ],
  npc_doc_otter: [
    '@Welcome to the clinic, hon. Small operation — it\'s me, the cot, and a very brave houseplant.',
    "@Got a friend who's down for the count? I'll wake 'em up for you. Costs a little. Worth a lot.",
  ],
  clinic_exam_sign: ['EXAM ROOM — please do not sit on the cot if you are not the patient. (Looking at you, raccoons.)'],
  npc_clinic_patient: [
    '@The doc says I\'m "fine, just startled." But I watched a STAR crash into Hickory Hill. I\'m going to be startled for the rest of my life.',
  ],
  npc_hodgkin: [
    "@Hardware, huh? Course it is. Nobody comes to Hodgkin's for the AMBIANCE.",
    '@Bolts, hose, bug spray, mower parts — that mower of Sodd\'s is loose AGAIN, I can hear it from here.',
    '@You need somethin\' specific, you say the word. I got a whole wall of words.',
  ],
  // S22 (ADR-119) — THE TRAIL KEY (the soft EarthBound interlock)
  npc_hodgkin_ask: [
    '@Hey— actually, you headed up Hickory Trail? Do me a solid.',
    "@My runaway lawnmower got loose and it's tearing up the trail switchbacks right now. Get up there and shut the dang thing off for me.",
    "@You do that, the spare TRAIL KEY's yours — opens my supply shed up on the trail. There's good stuff in there. Define 'good.' Don't.",
  ],
  npc_hodgkin_reward: [
    '@You caught it! I heard it sputter out from DOWN here. Bless you, kid.',
    '@Here— the TRAIL KEY. That shed up on the switchbacks is yours to raid. Take the granola bar, it\'s judging me.',
  ],
  npc_hodgkin_after: [
    '@Get into the shed yet? Tell me the granola bar found a good home. I need closure.',
  ],
  // the sign's registry entry (signBeat intercepts and picks the live variant)
  trail_shed: [
    'A weather-beaten TOOL SHED tucked off the switchback. A heavy padlock holds it shut.',
  ],
  trail_shed_locked: [
    'A weather-beaten TOOL SHED tucked off the switchback. A heavy padlock holds it shut.',
    "(Stenciled on the door: \"HODGKIN'S — KEEP OUT — this means YOU, raccoons.\")",
  ],
  trail_shed_open: [
    'The TRAIL KEY turns. Inside: coils of rope, a dead flashlight, $60 in a coffee can, and one (1) granola bar.',
    'You pocket the cash and, after a respectful pause, the granola bar.',
  ],
  trail_shed_empty: [
    "The shed's bare now but for the rope and the judging flashlight. You already took the good stuff.",
  ],
  npc_waitress: [
    '@Sit anywhere, hon, the floor\'s clean-ish. Coffee\'s on the house if you don\'t tell my boss it was.',
    "@You look like a kid who had a rough night. Sit and eat something — everything's easier on a full stomach. Trust me. I'm a waitress, not a doctor, but still.",
  ],
  // S22 (ADR-118) — THE COP FIGHT: Constable Borden, framed by Chad, by-the-book
  npc_borden_accuse: [
    '@HOLD it right there, citizen. Constable Borden, Otterbrook P.D. (sole officer, acting chief, crossing guard).',
    '@Got a report — young Chad Pickle, very upset — says YOU went and "vandalized the whole hill" last night. Crater-sized vandalism. His words.',
    '@That is a Code 7-B if I ever saw one. And I have seen exactly one. Care to explain yourself?',
  ],
  npc_borden_meteor: [
    '@"A meteor." Mm. Convenient, a meteor. Does a meteor fill out a FORM? Does a meteor have a PERMIT?',
    "@(He isn't really listening. There's a faint blue hum behind his eyes — the Hush got a little of him too.)",
  ],
  npc_borden_silent: [
    '@Not talking, eh? Guilty folks stay quiet. So do innocent folks. So do mailboxes. So it proves nothing — but I\'m still watching you.',
    "@(There's a faint blue hum behind his eyes. He isn't all here.)",
  ],
  // ADR-121: slow the escalation — Borden marches you to the station FIRST, and the
  // frame-up + the Hush only tip him into a fight in the holding cell.
  npc_borden_march: [
    '@I\'m not gonna fight a TWELVE-year-old in the street, son. I\'m a professional. We do this BY THE BOOK.',
    "@You're coming down to the station. It's the little brick one with the one cell and the one chair. Walk in front of me where I can see you. No funny business.",
  ],
  npc_borden_quiet: [
    "@...Good. Quiet and cooperative. I'll note that. The book likes a cooperative detainee.",
    '(He walks you the three blocks to the station, narrating municipal codes the whole way. You count seven.)',
  ],
  npc_borden_protest: [
    "@Save it for your statement, son. You'll get a statement. There's a FORM. There's always a form.",
    '(He walks you the three blocks to the station anyway, unmoved, reciting municipal codes. You count seven.)',
  ],
  npc_borden_holding: [
    '(The cell is the size of a closet. Borden gets out the paperwork, licks his pencil, and goes to write up a kid for vandalizing a hill with a meteor.)',
    "@Name, age, and the nature of the... the... (His pencil stops. The blue hum behind his eyes swells until it's all you can see.)",
    "@...the VANDALISM. You will CONFESS to the VANDALISM. By the book. By the BOOK. Hold still, son—",
  ],
  npc_borden_threat: [
    '@I\'m gonna have to DETAIN you, son. By the book. Subsection by subsection. Hold still—',
  ],
  npc_borden_cleared: [
    '@...Oof. What— why am I— OW, my whole back went BY THE BOOK.',
    "@A meteor. Of course it was a meteor. I watched it fall, and right after, my head went all... blue and foggy. That Chad kid lied to me, and I fell for it.",
    "@You're cleared, son. Fully. Here— the Civic Apology Fund. It's just my donut money, but you EARNED my donut money.",
    "@Anyone gives you trouble on the road out of town, you tell 'em Borden vouched. By the book.",
  ],
  npc_borden_done: [
    '@Road\'s yours, kid. Try not to vandalize any more celestial bodies. (That was a joke. Mostly.)',
  ],
  npc_busdriver: [
    "@Exact change or exact attitude. You've got one of 'em, kid. Sit anywhere.",
  ],
  npc_fernlady: [
    '@Shh. Gerald is looking out the window.',
  ],
  bus_fern: [
    '@This is Gerald. (She tilts a potted fern toward the window.) He has never seen the city.',
    '@Gerald. Gerald. Look. LOOK.',
    '(Gerald is looking. Gerald is a fern.)',
  ],
  bus_narration: [
    'The hill shrinks. The town shrinks.',
    'Cornfields smear into guardrails. Guardrails become billboards. Billboards begin making promises nobody asked them to keep.',
    'A sign for BRICKTON CITY rises out of the morning haze, brick by brick, like the world decided to get taller.',
    'It turns out the world was hiding a whole CITY behind the corn.',
  ],

  /* ---------------- Brickton City ---------------- */
  brickton_arrival: [
    'The bus sighs open on a block that smells like hot pavement, coffee, and a little bit of lightning.',
    'Brickton does not wake up gently. It clatters, it honks, and somebody sells you a bagel through a locked door and calls it good business.',
    'Across the street, blue blazers move in a line toward the Department of Smiles.',
    'Their smiles are all the same size.',
    '(The Star Locket hums once, low and worried. Somewhere above you, a girl you have not met yet hums back.)',
    'Find the Department. Find the girl who prays.',
  ],
  sign_brickton: [
    'WELCOME TO BRICKTON CITY — pop. lots.',
    '(Someone has written "OTTERBROOK FITS IN OUR PARKING LOT" underneath. Rude. Accurate.)',
  ],
  sign_brickton_clock: [
    'BRICKTON CIVIC CLOCK — sponsored by people who are late.',
    '(It is seven minutes fast and extremely confident.)',
  ],
  sign_market_row: [
    'EAST MARKET ROW — bagels, videos, diner, mysteries.',
    '(The mysteries are closed Tuesdays.)',
  ],
  sign_overpass: [
    'UNDERPASS TO THE OLD FREIGHT STEPS.',
    '(Somebody painted a smile over the arrow. Somebody else painted teeth on the smile.)',
  ],
  sign_blue_notice: [
    'DEPARTMENT OF SMILES PUBLIC NOTICE:',
    '"Unauthorized sadness should be reported to your nearest enthusiastic adult."',
    '(The notice has no phone number. It assumes enthusiasm will find you.)',
  ],
  // S15h — THE BRICKTON MINUTE, rebuilt as a real beat (same gate flag): the
  // clock strikes, the city reacts in unison, the clock lady reads you the city,
  // and the Star Locket takes one impossible tick. (Paced by the scene's camera.)
  brickton_goal_clock: [
    'High over the plaza, the civic clock clicks SEVEN wrong minutes at once.',
    'Every blue blazer on the block turns toward it, smiles, and turns back — a row of appliances on the same timer.',
    '@That is Brickton time, honey. (The clock lady taps the glass without looking up.)',
    '@It runs seven minutes fast, on purpose. A city this big likes to feel a few minutes ahead of bad news.',
    "@Most folks never notice. You did. That is a city kind of noticing.",
    'You hold up the Star Locket. It takes one impossible tick off the clock — a minute that never happened — and keeps it warm.',
    'The clock shows the right time for exactly one second, looks embarrassed, and goes back to being wrong.',
    '* You borrowed a BRICKTON MINUTE. (The first Heartlight hums in the Locket.)',
  ],
  // S15h — THE WARM DIAL TONE, rebuilt as a real beat (same gate flag): the
  // payphone rings with no caller, the quarter man names the note, and the dial
  // tone folds into the first Heartlight — a beat of home in a gray city (§A4.4).
  brickton_goal_dial: [
    'On the corner, the payphone rings exactly once.',
    'Nobody is calling. Somehow, it still feels answered.',
    '@Hear that? (The quarter man smiles without showing teeth, a coin walking across his knuckles.)',
    '@Area code 216. B flat. Warm as toast left in the sun. Best sound this whole gray city makes.',
    'You lift the Locket to the receiver. The dial tone leans in, curious, and folds itself into the first Heartlight.',
    'For a moment the corner smells like your kitchen at home. Then a bus exhales, and it is just a corner again.',
    '* You caught a WARM DIAL TONE. (The Homesong gains its first warm note.)',
  ],
  brickton_goal_gate_none: [
    'The Department doors slide open one inch, inspect your face, and slide shut.',
    'A tiny speaker says: "NO APPOINTMENT ON FILE. COME BACK ONCE YOU\'VE LEARNED TWO THINGS ABOUT THIS CITY."',
    '(The Star Locket tugs two ways — toward the big civic clock, and toward the payphone on the corner. Go look at both.)',
  ],
  brickton_goal_gate_clock: [
    'The Department doors accept your warm dial tone, then refuse your bad timing.',
    '"PLEASE CONSULT BRICKTON TIME BEFORE ENTERING."',
    '(The Star Locket ticks toward the civic clock.)',
  ],
  brickton_goal_gate_dial: [
    'The Department doors accept your borrowed minute, then ask for a phone number.',
    '"EVERY PRODUCTIVE VISITOR MUST BE REACHABLE."',
    '(The Star Locket hums toward the payphone corner.)',
  ],
  brickton_goal_gate_ready: [
    'The borrowed minute ticks. The warm dial tone hums.',
    'For one second, the Department doors forget how to say no.',
    'They open wide enough for two kids, one bat, and one very serious question.',
  ],
  // S12: the FUTURE SITE finally arrived, and it's a basketball cage
  sign_lot: [
    'FUTURE SITE OF MORE BRICKTON. — and underneath, in fresh paint:',
    'THE FUTURE GOT HERE. IT IS A BASKETBALL COURT. — MGMT (of the future)',
    '(The weeds were right to be confident. They got bleachers.)',
  ],
  /* -------- S15i Task 6 (ADR-059) — THE CAGE PARK (the walk-through approach) -------- */
  sign_cage_this_way: [
    'THE CAGE → (this way. up through the gate. you will hear it before you see it.)',
  ],
  sign_cage_mural: [
    'COMMUNITY MURAL — "WE GO UP" (painted by the block, one summer, all of it).',
    '(Three kids, mid-jump, forever. Somebody touched up the ball just last week.)',
  ],
  sign_cage_park: [
    'CAGE PARK — leash your dog, claim your bench, respect the game.',
    '(Smaller, at the bottom: "winners stay on. that goes for the park too.")',
  ],
  npc_park_old_head: [
    '@I have watched this park forty years. Best game I ever saw was a Tuesday. Nobody believes me.',
    '@Kid hit eleven straight from the corner, then walked home for dinner like it was nothing. THAT is the cage.',
  ],
  npc_park_kid: [
    '@One day my name goes on PERMIT\'s board. The BIG one. In CHALK.',
    '@I\'m practicing my cool face for when I walk onto the court. ...Was that it? No? Okay, watch this one.',
  ],
  cage_park_gift: [
    'Somebody left a picnic basket on the end bench, a note tucked under the handle.',
    '"FOR WHOEVER\'S GOT NEXT — EAT FIRST, BALL AFTER." A basket of the good stuff. You should take it.',
  ],
  cage_park_gift_done: ['(The bench is bare now. Eat first, ball after. Words to live by.)'],
  // the first-arrival beat (a cutscene, once) — the park opens up before the cage
  cage_park_reveal: [
    'The Brickton sidewalk gives way to grass, a mural, a couple of benches — a whole park you never knew was here.',
    'Up at the top, past the chain-link, a ball is bouncing. Steady. Patient. Somebody is always there.',
    'It is the most ALIVE sound this whole gray city has made. Bounce. Bounce. A door, propped open, into something warmer.',
    'THE CAGE is just up through the gate. You can feel it from here.',
  ],

  /* ---------------- THE CAGE (S12) ---------------- */
  npc_permit: [
    '@PERMIT. I run the cage. I announce the cage. Some say I AM the cage. I let them say it.',
    '@I have personally witnessed and ranked every crossover thrown on this asphalt since 1987. All eleven thousand of them. Number one would make you cry.',
  ],
  permit_pickup_ask: [
    '@A pickup game runs to 21, win by 2. The big tournament — the Classic — is a full-court bracket I chalk up myself. Tell me which one you want.',
  ],
  // S12c: PERMIT'S SCHOOL — the first-visit tutorial (skippable; either
  // answer sets cage_tutored, declining IS skipping)
  permit_tutorial_ask: [
    '@First time inside my fence. I run a short school — the meter, the sauce, the TIMING, and the one law about goaltending.',
    '@Eight lessons. I have ranked every graduate since 1987. You could place.',
  ],
  permit_tutorial_skip: [
    '@Skipping school. Bold. I will rank that under "confidence, pending."',
  ],
  permit_register: [
    '@Thirty-two fives. Single elimination. No entry fee — the cage takes its payment in ankles.',
    '@I seeded the bracket with TOTAL impartiality. My nephews drew the five seed. Again. Unrelated.',
    '@Your five is on the chalk. Do not make my handwriting look foolish.',
  ],
  permit_resume: [
    '@Your game is still ON the chalk — I hold your spot the way banks hold grudges. Step in when you are ready.',
  ],
  permit_eliminated: [
    '@The bracket forgot you the moment you lost. I did not. I rank losses too. Yours was top forty.',
    '@Register again whenever. The chalk forgives.',
  ],
  permit_title_first: [
    '@CHAMPIONS. I have ranked every Classic since the first one, and this one goes in at... high. VERY high.',
    '@The cage pays its debts. THE STARTING FIVE — five pieces of equipment. Slot them into your gear and wear them. That\'s what they\'re for.',
  ],
  permit_hands_full: [
    '@Your hands are full. A champion with full hands is still a champion — I will keep the rest warm. Come back with room.',
  ],
  permit_repeat_title: [
    '@AGAIN. The dynasty rankings are getting crowded at the top and it is YOUR fault.',
  ],
  cage_rules: [
    'CALL YOUR OWN FOULS.',
    '(Nobody ever has. The sign knows. The sign has made peace.)',
  ],
  /* ---------------- COSTA ESTRELLA LINKS (S13) ---------------- */
  sign_links_poster: [
    'COSTA ESTRELLA LINKS — nine holes on the cliffs north of Puerto Sol!',
    '"Where the surf keeps the score." Travel by banana boat. Sunsets included.',
    '(Someone has drawn a tiny golfer on the sea stack. He looks happy out there.)',
  ],
  sign_costa: [
    'COSTA ESTRELLA LINKS — est. whenever the tide says.',
    'HOLE 1 — THE HANDSHAKE waits past this plaque. The course is west, through the gate.',
  ],
  /* -------- S15i Task 6 (ADR-059) — THE LINKS ESTATES (golf resort approach) -------- */
  sign_links_gate: [
    'THE LINKS ESTATES → (members & guests. and you, apparently. west through the gate.)',
    '(A smaller sign: "the CLUBHOUSE is up the cart path. FITO is inside now. mind the sprinklers.")',
  ],
  npc_links_starter: [
    '@Tee times, tee times. I am the STARTER. Without me it is just people hitting rocks at a flag.',
    '@Your time? ...You do not HAVE one. Go on, the course is empty, it always is. But next time, a TIME.',
  ],
  npc_estate_gardener: [
    '@Forty-one years on this lawn. I know every blade by its first name. That one is Gerald.',
    '@The members think the course mows itself. I let them think it. Gerald and I have an understanding.',
  ],
  npc_estate_member: [
    '@Bought the big house for the VIEW. Now I close the curtains so the sun does not fade the furniture.',
    '@Do you play? No? Smart. The course only takes. ...Tell FITO I said hello. He never believes I exist.',
  ],
  sign_links_welcome: [
    'WELCOME TO THE LINKS ESTATES — please drive your cart responsibly and your ambitions quietly.',
    '(Someone keyed into the marble: "the cage is more fun and it is FREE." Someone else tried to buff it out. Failed.)',
  ],
  sign_links_clubhouse: [
    'CLUBHOUSE & PRO SHOP ↑ — sign in with FITO. Stroke rounds and the Invitational both run from inside.',
  ],
  sign_clubhouse_wall: [
    'THE LINKS — CLUBHOUSE. Soft spikes only. The leaderboard is sacred. FITO keeps it in chalk and in his heart.',
  ],
  golf_resort_gift: [
    'A drinks cooler sits forgotten by the practice green, one cold STAR COLA still bobbing inside.',
    '"HALFWAY HOUSE — HELP YOURSELF" says the lid. The halfway house is nowhere in sight, but the cola is real.',
  ],
  golf_resort_gift_done: ['(The cooler is empty, the ice long melted. The view, at least, is still free.)'],
  // the first-arrival beat (a cutscene, once) — the estates open up
  golf_resort_reveal: [
    'Past the gate, the world goes GREEN — fairway mowed in perfect stripes, mansions the color of expensive ice cream.',
    'A fountain you could bathe a horse in. Hedges trimmed like they owe somebody money. This is where the money LIVES.',
    'Somebody mows ALL of this. On purpose. Every single blade. The thought is almost more impressive than the houses.',
    'Up at the head of the cart path: the clubhouse. FITO is in there, somewhere, measuring the day in putts.',
  ],
  npc_caddy: [
    '@FITO. Caddy. Welcome to Costa Estrella, the only golf on this coast and therefore the best.',
    '@I measure every distance in putts, senor — golf habit. The clubhouse is six putts off. That cloud, two putts. And you? One good round away from famous.',
  ],
  caddy_ask: [
    '@Stroke play is all nine holes — fewest swings wins, and I\'ll read the wind for you. The INVITATIONAL is a 32-player bracket: you face one rival at a time, three holes each, lowest score moves on.',
  ],
  caddy_register: [
    '@Thirty-two names on the board, senor. Five matches between you and the sunset.',
    '@I caddy for you the whole way. My reads are free. My faith costs one good swing.',
  ],
  caddy_resume: [
    '@Your bracket holds, senor. The board remembers — round by round, putt by putt.',
  ],
  caddy_eliminated: [
    '@The bracket let you go, senor. The course did not — it keeps every round you ever walked. Register again whenever.',
  ],
  caddy_title_first: [
    '@CHAMPION. Senor, I have measured this moment: zero putts away. It is here.',
    '@The resort pays its respects — THE SUNDAY SET. Four pieces for four pockets. Sunday is the day you cannot miss.',
  ],
  caddy_hands_full: [
    '@Your hands are full, senor. A champion may take his time — I will hold the Set behind the bar. Come back with room.',
  ],
  caddy_repeat_title: [
    '@Champion AGAIN. I am running out of superlatives. I am not running out of putts: you are two ahead of everyone, forever.',
  ],
  cage_board: [
    'THE BRICKTON CLASSIC — 32 teams of five, single elimination, one chalk leaderboard.',
    '(The handwriting is immaculate. The seeding is "impartial." The nephews are fifth.)',
  ],
  npc_nurse: [
    '@Brickton General, walk-ins welcome. The clipboard knows if you are sick. I just hold the clipboard.',
    '@...It says you are fine. It says you are EXTREMELY twelve.',
  ],
  npc_clock_lady: [
    '@I wind the civic clock every morning. Seven minutes fast, on purpose.',
    '@A city this big needs a little warning before time arrives.',
  ],
  npc_bagel_scout: [
    '@Bagels are circles with ambition. I am scouting locations for the perfect one.',
    '@This block has promise. The curb is chewy.',
  ],
  npc_blue_watcher: [
    '@My sister went into the Department for a "smile tune-up."',
    '@She came out saying "productive" at the end of sentences. Productive.',
    '@If you go in there, keep one real feeling in your pocket. They check faces first.',
  ],
  npc_bus_boy: [
    '@I rode the 6:15 once and saw a cow look into the city like it owed him money.',
    '@The cow was right. Brickton owes EVERYBODY money.',
  ],
  npc_plaza_mime: [
    '@...',
    '(He is a mime. He points at the Department, makes a huge smile with both hands, then pretends to be locked in a very boring box.)',
    '(Honestly? Clearer than most adults.)',
  ],
  npc_commuter: [
    '@My husband works in there. The Department of Smiles.',
    '@He smiles all the time now. He used to only smile when he meant it.',
    '@...If you see him in there, tell him dinner is at six. He knows which six.',
  ],
  npc_quarter: [
    '@Shh— put your ear here. You hear that dial tone? Area code 216. The warmest dial tone in America.',
    '@Most folks never listen past the first note. Most folks are in a HURRY.',
  ],
  npc_pigeonkid: [
    '@Forty-one. There are forty-one pigeons on this block. I count them every day.',
    '@...Nine of them are the same pigeon. He thinks I haven\'t noticed. I HAVE.',
  ],
  npc_critic: [
    '@Now THIS is a sidewalk. Even slabs. Honest seams. A little give in the ankles.',
    '@Three and a half stars. The half is for the hydrant. Great hydrant.',
  ],
  locked_bagels: [
    'BRICKTON BAGELS is closed. A note on the door: "BACK IN 5."',
    '(The note has been there since 1991. The 5 was never defined.)',
    'Through the glass, a single bagel rotates in a display case, undefeated.',
  ],
  locked_hospital: [
    'BRICKTON GENERAL. The waiting room is standing-room-only, and most of those standing are pigeons.',
    'A nurse mouths through the glass: "Come back when something is BROKEN, sweetie."',
  ],
  locked_brickmore: [
    'THE BRICKMORE — apartments. The buzzer panel has 40 buttons and one label: "NOT THE BUZZER."',
  ],
  locked_video: [
    'VIDEO VAULT is closed for "inventory," which through the window appears to be one man rewinding tapes and sighing.',
    'A cardboard standee for a space movie has been turned to face the wall. It knows too much.',
  ],
  locked_bank: [
    'OTTERBROOK SAVINGS & LOAN, Brickton branch. Closed.',
    '(Inside, the vault is sleeping. Banks sleep standing up, like horses.)',
  ],
  locked_diner: [
    'The DINER is closed between breakfast and breakfast.',
    'A menu in the window lists "EGGS (various)" and, lower down, "ASK US ABOUT TUESDAY."',
    'Behind the counter, a pie sits under glass with the patience of a saint.',
  ],

  /* ---------------- the Department of Smiles ---------------- */
  npc_receptionist: [
    '@Welcome to the Department of Smiles! Have you smiled today? Don\'t worry. We can fix that.',
    '@Visitors are encouraged to enjoy the lobby, the other floors, and compliance.',
    '@If you hear singing from upstairs, that is a ventilation feature. We are proud of our ventilation.',
    '@Have a PRODUCTIVE day!',
  ],
  dos_lobby: [
    'DEPARTMENT OF SMILES — "Putting the PRODUCT in PRODUCTIVITY since whenever."',
    '(The exclamation point on the wall logo looks tired.)',
    'A guestbook asks for NAME, TIME IN, TIME OUT, and FAVORITE APPROVED FACIAL EXPRESSION.',
  ],
  dos_cert: [
    'ELEVATOR INSPECTION CERTIFICATE: "It\'s a great elevator." — an inspector, probably.',
    '(The UP light is always on. There is no proof anyone has ever gone down.)',
  ],
  dos_breakroom: [
    'BREAK ROOM — Breaks are limited to feelings of gratitude.',
    '(Someone has scratched "I MISS SATURDAY" into the paint, then apologized underneath.)',
    'The picnic table has four chairs and zero sandwiches. This is how you know the Hush has been here.',
  ],
  dos_memo1: [
    'MEMO: Effective today, frowning is a meeting.',
    'MEMO: All meetings are mandatory.',
    'MEMO: Whistling has been replaced by quiet approval.',
  ],
  dos_memo2: [
    'EMPLOYEE OF THE MONTH: EVERYONE!',
    '(Forty identical photos of forty identical smiles. None of them look happy about it.)',
    'One photo is slightly crooked. It is the bravest thing in the room.',
  ],
  dos_quiet: [
    'FLOOR 3 — QUIET FLOOR. SMILE SOFTLY.',
  ],
  dos_memo3: [
    'QUOTA BOARD — SMILES PRODUCED: ALL OF THEM.',
    'SMILES FELT: (this column is empty)',
    'A third column, labeled SONGS HEARD, has been scratched out so hard the wall shows through.',
  ],
  holding_door_line: [
    'A steel door, riveted shut. A brass plate reads: HOLDING ROOM — PRODUCTIVITY LOCK ENGAGED.',
    'Smaller text: "This door opens once this floor MEETS ITS QUOTA." Three little lights sit dark above the handle, waiting to turn green.',
    '(You can hear the lock smiling.)',
  ],
  manager_door: [
    'THE MANAGER — a nameplate so polished you can see your frown in it.',
    'A sticky note: "OUT SPREADING PRODUCTIVITY. DO NOT BE SAD UNTIL I RETURN."',
  ],

  /* ---------------- S2 — the PRODUCTIVITY LOCK ---------------- */
  quota_pip_1: [
    '* Across the floor: ting. A little light on the holding-room door turned green.',
    '(Somewhere, a spreadsheet felt a feeling.)',
  ],
  quota_pip_2: [
    '* Ting. A second little light. The lock is starting to sweat.',
  ],
  quota_pip_3: [
    '* TING. The third light. For one second the whole floor holds its breath—',
    'KA-CHUNK. KA-CHUNK. KA-CHUNK.',
    'The HOLDING ROOM door slid into the wall, where it plans to think about what it did.',
    '(QUOTA: MET, says the little panel, to anyone who will listen.)',
  ],
  holding_door_1: [
    '(One of the three little lights is green now. The door pretends not to notice.)',
  ],
  holding_door_2: [
    '(Two green lights. Listen close: the rivets are nervous.)',
  ],
  holding_open_panel: [
    'QUOTA: MET. Three green lights, very pleased with themselves.',
    '(The steel door is in the wall now. It does not want to talk about it.)',
  ],

  /* ---------------- S2 — Mia, the girl who prays (§A3, §A6) ---------------- */
  npc_faye_wait: ['@...You took the stairs. I heard you take the stairs. Stairs are honest that way.'],
  holding_log: [
    'INTAKE LOG — ROOM 1. ITEMS CONFISCATED: one (1) frying pan, ASSERTIVE.',
    'REASON FOR HOLDING: "asked the Manager a question." The question is not logged.',
    '(Underneath, in pencil, in a different hand: "she asked it NICELY.")',
  ],
  faye_meet: [
    '(The room is small and gray and has been counted. Forty ceiling tiles. She tells you this before hello.)',
    '@Forty tiles. I counted twice, in case the first forty were lying. Hi. You\'re {rex}.',
    '@Don\'t bother looking behind you — there\'s nobody else here. The Embers told me you\'d come. They\'re ten little singing stones, scattered all over the world, like a choir somebody broke apart on purpose.',
    '@The one from your hill hums in B flat. It has NOT stopped bragging about you.',
    '@I kept praying in here. Not because I thought the door would open. Because I wanted to remember what open felt like.',
    '@Then three little lights turned green, and the door remembered too.',
  ],
  faye_locket: [
    '* {rex} held up the Star Locket. Inside it, one instrument was playing, all alone.',
    '@...That\'s it. That\'s the song I keep hearing through the walls.',
    '(She listens the way some people pray. It turns out to be the same thing.)',
    '@They put me in here because I asked the Manager what he\'s so afraid of. He smiled so wide it stopped being a smile. The door did the answering.',
    '@But the song never got quieter. That is either a miracle or very stubborn music.',
    '@So. New plan. We go ask him together.',
  ],
  faye_join: [
    '@One second. (She takes her frying pan back off the intake shelf. The shelf seems relieved.)',
    '@I\'m {faye}. I hit things with a frying pan, and when it matters, I pray.',
    '@If it gets loud out there, that\'s the praying. It always does SOMETHING. That\'s the whole deal with it.',
    '* {faye} joined the party!!',
  ],
  faye_pan_get: [
    '* {faye} got the HAND-ME-DOWN PAN back! She gives it one practice swing. The room apologizes.',
  ],

  /* ---------------- S2 — the Manager's exit interview ---------------- */
  manager_intro: [
    "(The office door opens on its own. Doors do that for him. It's a seniority thing.)",
    '@Leaving? Before your EXIT INTERVIEW? Oh, we NEVER skip the exit interview.',
    '@Miss {faye} is far too valuable to ever let leave. Valuable things stay locked up here, with me.',
    "@And YOU. (He consults a clipboard with nothing on it.) Terrible numbers. You make my employees feel like it's SATURDAY.",
  ],
  manager_faye_q: [
    '@Sir. Same question as before. What are you so afraid of?',
    '(The smile holds. The eyes do not.)',
    '@...SECURITY. Two smiles to the front, please. Have a PRODUCTIVE day!',
  ],
  manager_win: [
    '(The Manager is still smiling. He backs into his office without using his feet, somehow.)',
    '(For half a second the smile slips — and under it nothing is smiling at all, just something cold that has been listening the whole time. Then the smile snaps back on, a size too wide.)',
    "@This is fine. This is FINE. I'm promoting myself somewhere QUIETER.",
    '* Click. The nameplate now reads: IN A MEETING. It hopes to stay in it forever.',
    '* Somewhere below, the elevator dinged and went DOWN. Nobody has ever seen it go down.',
  ],
  manager_door_after: [
    'THE MANAGER — IN A MEETING.',
    '(Through the door, you can hear him slowly sorting his paper clips, one by one. It almost sounds like he\'s saying sorry.)',
  ],

  /* ---------------- S2 — Mom calls the payphone (ch1_complete) ---------------- */
  payphone_far: ['(Somewhere on the block, a payphone is ringing its heart out.)'],
  payphone_ringing: [
    'The payphone is RINGING.',
    '(It has been ringing since you stepped outside. Payphones know things. This one sounds like dinner.)',
  ],
  mom_payphone: [
    '@RING... RING... ...click.',
    "@—{rex}! It's Mom. You can't look up a payphone's number, sweetheart, so I just kept dialing until one near you picked up.",
    '@A CITY! My baby took the 6:15! Mrs. Pemmel says hi. Biscuit said nothing, but he wagged it.',
    "@Is the girl with you? The one the hill keeps singing about? Good. Tell her I'm setting another plate.",
    "@Dinner is {favoritefood}. It is ALWAYS {favoritefood} — but tonight it's the coming-home kind.",
    '@That\'s all a phone is, honey — a little piece of home with buttons. Your father handles SAVING your game. I handle everything else.',
    "* (So that's how phones work: walk up, press A, and you get to talk to family. Dad saves your game. Mom saves everything else.)",
  ],
  faye_after_call: [
    "@...Three plates. (She says it like a word she's checking for cracks. It holds.)",
    '@Okay. Your mom wins. Let\'s go catch the 6:15.',
  ],
  ch1_card: [
    'The night it fell is officially over. Whatever this is now, it has a morning in it.',
    "(East of here, past the parking lot, something's stirring down at the docks — something about a banana boat. But that's a problem for another day.)",
  ],

  /* ---------------- S9 — §A10 #1: Biscuit, Come Home ---------------- */
  q_biscuit_ask: [
    "@{rex}! Thank goodness. My dog Biscuit ran off! At sunrise he pointed at the hill one last time, then bolted — a little brown blur with a mind of his own.",
    '@He never comes when you call him — only when he smells something good. So to track him down, you\'ll have to follow the smells too.',
    "@Find him for me, would you? He bolted for the trailhead. He'll have left evidence. He always leaves evidence.",
  ],
  q_biscuit_active: ["@Any sign of him? Sniff LOW, dear. He's short."],
  q_biscuit_clue1: [
    '(The dirt by the trailhead is freshly scuffed. Something dug here, reconsidered, and left at speed.)',
    '(It smells like pond. The trail points up Hickory Hill.)',
  ],
  q_biscuit_clue2: [
    '(Paw prints under the picnic table. The crumbs are gone. The wrapper has been rolled in, lovingly.)',
    "(The pond smell is fainter here... wait — the trail turns around. He doubled back DOWN, toward town. Toward... the drugstore?)",
  ],
  npc_biscuit_drug: [
    '@Woof! (Biscuit is sitting in front of the corn dogs with the patience of a saint and none of the budget.) {g:corn_dog}',
    '(He looks at you. He looks at the corn dogs. He has now explained the situation twice.)',
    '* Biscuit suddenly remembered he has a home! He ZOOMED.',
  ],
  q_biscuit_done_beat: [
    "@—and there he is! THERE'S my furry compass! He beat you here by a full minute and is acting like he found YOU.",
    "@Here, dear — his old collar. He chewed the lucky right into it. He'd want a hero to have it.",
    '* {rex} got the LUCKY COLLAR!',
    "@If you ever need anything — ANYTHING — I'm in the book. Under P. For Pemmel. Biscuit knows the number.",
  ],
  q_biscuit_full: ['@Your hands are full, dear! Go make a pocket for luck and come right back.'],
  q_biscuit_after: ['@He smells like pond again already. I have given up. The pond has won.'],
  npc_biscuit_collar: ['@WOOF! (He is home. He is proud. He is already planning the sequel.)'],

  /* ---------------- S9 — §A10 #2: Mail Must Move ---------------- */
  q_mail_ask: [
    '@Kid. KID. Thirty-one years delivering mail, never missed a door. But today there\'s a METEOR sitting on my route and my bad knee won\'t take another step.',
    '@Five letters for five doors: the Pickles, Mr. Sodd, the Birch place, the chapel, and the STARPORT arcade. Yes, arcades get mail too — mostly angry threats.',
    '@The mail must move, kid. It must MOVE.',
    '* Mr. Plummer handed over five letters and one enormous responsibility.',
  ],
  q_mail_active: ['@Doors still waiting, kid. The mail is patient. I am LESS so.'],
  mail_pickles: [
    "You slide the letter through the Pickles' slot.",
    '(Inside, Chad pauses his victory speech to announce: "MAIL FOR ME." It is not for him.)',
  ],
  mail_sodd: [
    "Mr. Sodd's mail slot fights back a little, like the lawn taught it.",
    '(From inside: "IS THAT THE MOWER? TELL IT ALL IS FORGIVEN.")',
  ],
  mail_birch: [
    'The Birch mail slot is varnished. Of course it is.',
    '(The letter goes through with a sound like a satisfied librarian.)',
  ],
  mail_chapel: [
    'The chapel box takes the letter gently.',
    '(It is mostly postcards in there, addressed to "GOD, c/o OTTERBROOK." He gets his mail like everyone else.)',
  ],
  mail_arcade: [
    'You slide the bill under the STARPORT door.',
    '(Inside, the unbeaten high score chirps once — the sound of a machine pretending not to be home.)',
  ],
  q_mail_done_beat: [
    '@Five for five?! Kid. KID. Route 1 is SAVED. The republic of Tuesday endures.',
    '@Take these — fresh stamps, mint, 1995 commemoratives. Collectors WEEP for these.',
    '* {rex} got the FRESH STAMPS!',
    "@Don't lick 'em, that's the retirement fund. And if your phone ever rings and it's me? ANSWER. I deliver.",
  ],
  q_mail_full: ["@Hands full?! These are MINT, kid. Go make room. The route's gratitude will keep."],
  q_mail_after: ['@The route moved. The knee is recovering. The mailbox on Maple is STILL a critic.'],

  /* ---------------- S9 — §A10 #3: Lemonade Empire ---------------- */
  q_lemonade_ask: [
    '@Customer! Vivi, a customer with LEGS!',
    "@We're expanding. Lemonade is about to be bigger than {coolthing}. No offense to {coolthing}.",
    '@But the empire is OUT of everything! We need three things: sugar from the drugstore, fancy CITY lemons from the STARMART over in Brickton, and spring water from Hickory Hill.',
    '@Take the official jug. It has a flag on it. That makes it official.',
    "@And don't tell Mom we're charging you. Family discount is full price. That's business, {rex}.",
    '* Got THE JUG! (There is a tiny hand-drawn flag on it.)',
  ],
  q_lemonade_active: [
    '@The empire still needs three things: sugar from the drugstore, CITY lemons from the STARMART in Brickton, and spring water — take the jug up Hickory Hill and fill it. Then haul it all back to us.',
  ],
  lem_take_sugar: [
    '@SUGAR! Vivi, log it! (Vivi licks a pencil and writes a number with too many zeroes in it.)',
  ],
  lem_take_lemons: [
    '@CITY lemons. Look at them. They have AMBITION.',
    "@Don't tell Ana, but the secret ingredient was never the lemons. It's the markup.",
  ],
  lem_take_water: ['@Official spring water from the official jug! The flag WORKED.'],
  lem_pour_beat: [
    '@That is everything. Vivi. VIVI. Commence GLASS ONE.',
    '(They pour it together, four hands on one pitcher, tongues out, completely silent. It is the most serious thing either of them has ever done.)',
    '@To {rex}: supplier, hero, FRIEND OF THE EMPIRE. Your money is no good here. Forever. That is a BINDING CONTRACT.',
    '(Free lemonade at the stand. For life. The twins each shook one of your hands at the same time.)',
  ],
  lem_free_drink: ['@One for the Friend of the Empire! On the house. The house insists.', '* Got a LEMONADE!'],
  lem_free_full: [
    "@Hands FULL?! A serious problem for a serious supplier. Drink it here. We'll watch.",
    '* {rex} drank it on the spot. About 12 HP of pure summer!',
  ],
  hill_spring: [
    'A cold spring chuckles out of the hillside into a mossy pipe.',
    '(A tiny hand-drawn flag is planted beside it: "PROPERTY OF THE LEMONADE EMPIRE. ASK FIRST.")',
  ],
  spring_fill: [
    'You hold the official jug under the official spring.',
    '(glug. glug. glug. The spring seems pleased to be part of something.)',
    '* The jug is full of Hickory Hill spring water!',
  ],
  spring_full: ['(The jug sloshes importantly. The twins are waiting.)'],

  /* ---------------- S9b — the upstairs wing (the twins are Jay's sisters,
   * §A10 amendment; their HQ is up here, the stand is the branch office) --- */
  hall_photos: [
    'Five frames: Mom, Dad, {rex}, and the twins holding a pitcher like a trophy.',
    "(In every photo somebody is mid-blink. Dad swears it's the camera.)",
  ],
  hall_window: [
    'The window faces Hickory Hill.',
    '(The curtains are pinned back. Somebody in this house likes to watch the sky.)',
  ],
  ana_chart: [
    'Crayon on poster board: "LEMONADE EMPIRE — ORG CHART."',
    '"ANA: CEO. VIVI: ALSO CEO. {rex}: STAFF (UNPAID, BELOVED)."',
  ],
  ana_bed: ['(The bed is made. Empires rise early. Some nights they skip the sleeping part entirely.)'],
  gift_ana: [
    'A present with your name on it. The tag reads: "TO {rex}. FROM THE EMPIRE. DO NOT SHAKE."',
    '(You shook it, gently. It fizzed back.)',
  ],
  gift_ana_got: ['* Got a STAR COLA!'],
  gift_ana_done: ['(The box is open. The tissue paper has been respectfully re-fluffed.)'],
  gift_vivi: [
    'A present wrapped in graph paper. The tag reads: "TO {rex}. BUDGETED SINCE MARCH. — V"',
  ],
  gift_vivi_got: ['* Got a CORN DOG! (Your favorite. She keeps records.)'],
  gift_vivi_done: ['(Inside the open box: a receipt. One (1) corn dog. One (1) brother. Paid in full.)'],
  gift_hands_full: ["(Your hands are full. The Empire does not do rainchecks— okay. ONE raincheck.)"],
  vivi_jar: [
    'A jar of quarters labeled: "DO NOT COUNT. I ALREADY KNOW."',
    '(You do not count them. She would know.)',
  ],
  vivi_bed: ['(Under the pillow: a ledger. Under the ledger: a backup ledger.)'],

  /* ================================================================ */
  /* S14 — CHAPTER 2: THE GILDED GRIN (§A6/§A11, written in full)      */
  /* Voice rules: absurdism everywhere, sincerity is never the joke,   */
  /* the Hush — and the thing it left in the idol — is never funny.    */
  /* ================================================================ */

  /* ---------------- the Brickton docks + the crossing ---------------- */
  sign_to_docks: ['EAST: THE DOCKS.', '(Someone scribbled under it: "SMELL THAT? That\'s the smell of business." The arrow points right at the fish market.)'],
  sign_departures: [
    'DEPARTURES TO PUERTO SOL: the boat leaves once the bananas are loaded. Not before.',
    '(Good news: the bananas are always ready on time. So the boat always leaves on time.)',
  ],
  npc_captain: [
    '@I\'ve sailed this route 4,012 times, kid. I don\'t count my life in years. I count it in trips across the water.',
    '@First kiss? That was trip number 906. Best soup I ever made? Trip number 3,000. That\'s just how my brain files things now.',
    '@Want to be on trip number 4,013? Step onto the gangplank whenever you\'re ready to sail.',
  ],
  captain_not_yet: [
    '@Hold on. This boat only carries two things: bananas, and people who are done with everything they came to do here.',
    "@You've still got stuff left to do in this town, champ. I can always tell when someone's not finished yet.",
  ],
  boat_ask_out: ['@Heading south to Puerto Sol! I\'m hauling bananas, and I\'ll take you heroes along for free.'],
  boat_ask_home: ['@Heading north, back home to Brickton! Funny thing: bananas and people both seem happier when they\'re going home.'],
  npc_dock_kid: [
    '@I counted nine hundred bananas going onto that boat.',
    '@Nobody told me to count them. I just did it for fun. That\'s the part that worries my mom.',
  ],
  npc_uncle_bert: [
    "@Name's Bert. I fly an old plane named Lucille. Right now she's parked way over in England, waiting for me to come back.",
    '@The weather over the ocean this week? Same as always. Out here, it never really changes.',
    "@If you ever make it to England, kid, come find me. I'll fly you anywhere. I like passengers who've saved a town or two.",
  ],
  npc_captain_deck: [
    '@Trip number 4,013, and we\'re off. I\'ve got a good feeling about this one.',
    '@I rate every trip, you know. This one\'s already in my top fifty. Can\'t say why. A captain just knows these things.',
  ],
  npc_boat_senora: [
    '@Going home to Valle Dorado, niños. My sister stopped writing two months ago.',
    '@Her last letter said the idol made her wish come true. But the letter was strangely short. That\'s not like her.',
    '@She always wrote four full pages, front and back, with recipes squeezed into the edges. Now, almost nothing.',
  ],
  boat_crossing_1: [
    'The shore slips away behind the boat, slow and gentle, like a mom letting go of the bike seat for the first time.',
    'Seagulls swoop in, hoping to follow the boat. Two of them stick around for the whole trip.',
  ],
  boat_crossing_senora: [
    '@...You will pass through the valley? Then look in on my sister, please.',
    '@Ana Lucia. Gray house by the pen. You will know her by—',
    '@...You used to know her by her laugh. Look in on her. Please.',
  ],
  boat_crossing_2: [
    'For a long while, there\'s nothing but waves. The same blue water, rolling on and on. It\'s beautiful, but it\'s all there is.',
    'And then — a smell like warm stone and limes. A bell somewhere. A new country.',
    'Then Puerto Sol appears through the mist, bright and welcoming, like it stayed up late just to greet you.',
  ],

  /* ---------------- PUERTO SOL (§A5 Ch.2 — the port city) ---------------- */
  puerto_arrival: [
    'You step onto the pier. The old boards hold you up just fine, the same way they\'ve held up everything else this town ships.',
    'Up the hill, a fountain sprays water in big proud arcs. The whole city smells like fruit and sea salt.',
    '(PUERTO SOL. Population: enough folks to fill it. Bananas: way too many to count.)',
  ],
  sign_departures_home: [
    'DEPARTURES TO BRICKTON: catch this boat home whenever you\'re ready to leave.',
    '(The boat always runs both directions, every day. Somebody underlined the word "always." Twice.)',
  ],
  sign_plaza: [
    'PLAZA DEL SOL — the fountain runs all day, every day. So do the pigeons.',
    '(The fountain gives the pigeons a place to splash, and the pigeons never leave. They\'ve worked it out.)',
  ],
  sign_costa_road: [
    'NORTH: COSTA ESTRELLA LINKS — golf above the surf.',
    '(The road up the cliff is steep and tiring. But the view gets better every step, like a reward for the climb.)',
  ],
  sign_jungle_gate: [
    'EAST: THE JUNGLE → VALLE DORADO.',
    '(Underneath, in smaller letters: "No services past this point. You\'re on your own out there.")',
  ],
  npc_ps_fisher: [
    '@I\'ve tied 900 different knots in my life, and I\'ve got a favorite ranking for every single one.',
    '@The bowline knot is my third favorite. Don\'t ask about my number one, though. If I told you, you\'d never want to tie any other knot again.',
  ],
  npc_ps_nina: [
    '@The boats unload bananas here, then load up MORE bananas and leave. I don\'t get it. I think they just like sailing around.',
  ],
  npc_ps_stall: [
    '@My cousin Tomas raises llamas up in Valle Dorado. At least, he used to. I haven\'t heard much lately.',
    '@His last letter said the llamas keep running away toward the pyramid. Which is strange, because llamas usually hate going near it.',
    '@When a llama is scared of a building, the building is bad news, kid. Trust the llama. Remember that.',
  ],
  npc_ps_porter: [
    '@Boxes, boxes, boxes, all day long. Want to know what\'s in the really heavy ones? Bigger bananas. That\'s it.',
  ],

  /* ---------------- S15i Task 4 (ADR-057) — THE DOCK DISTRICT ---------------- */
  npc_ps_crane: [
    '@I run the big crane. I have lifted everything in this port at least once.',
    '@The heaviest thing I ever lifted wasn\'t the anchor. It was a piano. And somehow it felt sad, kid. I swear I could feel it right through the cable.',
  ],
  npc_ps_tally: [
    '@I count every crate on and off this dock. Today, so far: four hundred and twelve.',
    '@But there\'s one box I\'ve counted every day for six years. It never gets picked up. It never gets opened. It just sits there.',
    '@I gave up wondering what\'s inside. Some mysteries you just learn to live with, kid.',
  ],
  npc_ps_board: [
    '@My job is putting up the letters on the big departures board. I\'ve got a great letter J. I\'ve always wished I had a letter Q to use.',
    '@But no boat with a Q in its name ever comes through. So I just wait. That\'s the job. You wait.',
  ],
  npc_ps_market: [
    '@Fresh off the boats, just for you! A spoon from a sunken ship! A button from a real sea captain\'s coat!',
    '@This one? A map that leads nowhere. But it\'s a very accurate map of nowhere. Never gotten it wrong yet!',
  ],
  sign_ps_malecon: [
    'EL MALECÓN — the busy dockfront. Watch out for the cranes. Watch out for the cats.',
    '(Smaller, underneath: "And watch out when the cranes are swinging things over the cats.")',
  ],
  sign_ps_market: [
    'DOCKSIDE MARKET — everything here came off a boat. All legal! ...Mostly. Just ask the seller.',
  ],
  sign_ps_jungle_east: [
    'EAST: THE JUNGLE → VALLE DORADO. Last shade and a cold drink before the green.',
    '(Underneath, in smaller letters: "Still no services out there. Last chance to rest up.")',
  ],
  // the flag-gated waterfront beat (a cutscene, once) — the harbor + the road east
  puerto_malecon: [
    'East of the square, the town keeps going and going. There\'s a whole busy dockfront here that you couldn\'t even see from the pier.',
    'Cranes swing boxes of all kinds of stuff overhead. A church tower stands so tall you have to tip your head back to see the top.',
    '@{faye} looks around. "This place is way bigger than the map said. Funny how towns keep growing when no one\'s keeping track."',
    'Past the last warehouse, the road curves east into the trees. That\'s the jungle. Valle Dorado is somewhere on the other side of it.',
  ],
  ps_dock_gift: [
    'Tucked behind the market stalls: a small box with a bow tied on it, fast and a little crooked.',
    'The tag says, "FOR WHOEVER FINDS THIS — GOOD LUCK OUT THERE." Inside is an aloe leaf, to soothe sunburns.',
  ],
  ps_dock_gift_done: ['(The little box is empty now. Whoever left it would be happy to know you found it.)'],

  /* -------- S15i Task 3 (ADR-058) — THE QUIET CRATE (Ch.2 dock-district quest) -------- */
  q_crate_ask: [
    '@"You want a REAL mystery, kid? Forget the pyramid. It\'s THIS." The tallyman taps a box that\'s gone gray from years of sea air.',
    '@"Six years I\'ve counted this box. It never gets shipped out. It never gets opened. Every day my count book has this one box messing up the total."',
    '@"Find out what\'s in it for me. Ask the crane man, the board man, and the junk seller. After all these years, I\'m too scared to look myself."',
  ],
  q_crate_active: [
    '@"Three people on this dock each know part of the story. Ask all three, then come back and tell me. Easy now. I\'ve kind of gotten used to not knowing."',
  ],
  q_crate_crane_clue: [
    '@The crane man rubs his sore shoulder. "That box? I lifted it once, the day it arrived. Heaviest sad thing in the whole port."',
    '@"You learn to feel what you\'re lifting through the cable, kid. That wasn\'t just heavy. That was a piano. I\'d bet my whole crane on it."',
  ],
  q_crate_board_clue: [
    '@The board man doesn\'t even look up. "The boat that dropped it off had no name. It came in, left the box, and sailed away before sunrise."',
    '@"A captain who hides his ship\'s name is a captain leaving something behind on purpose. I left that line on the board blank. I never erase them."',
  ],
  q_crate_market_clue: [
    '@The junk seller holds up a brass button. "This came off that exact boat! It\'s a button from the captain\'s coat. I sold the other one to a tourist years back."',
    '@"But I kept the real one. A man who ships his piano here, then walks away forever — his luck ought to go to someone who sticks around to solve it. Here, take it. Give it to old Tally when you tell him."',
  ],
  q_crate_open: [
    'You gently tell the tallyman what you found: a sea captain who played piano shipped it here, then sailed away and never came back for it.',
    'He is quiet a long moment. Then, very carefully, he opens the crate. Inside: an upright piano, a folded coat, dust like snow.',
    '@"Six years," he whispers, and presses one key. It still plays a clear note. "Now my count finally adds up. Thank you, kid. Thank you."',
    'The junk seller\'s brass button ends up in your hand — the real one, taken from the folded coat inside.',
  ],
  q_crate_after: [
    '@"The box is open for good. The piano\'s staying here. We tuned it up, and the dock kids play it now." The tallyman taps his count book. "Numbers finally add up. First time in years."',
  ],
  q_crate_full: ['@"Take the button — oh, your hands are too full right now. It\'ll wait. Come back when you\'ve got room, kid."'],

  shop_mercado_greet: [
    '@Welcome, welcome! Here, I weigh everything in my own hands first, and only THEN check it on the scale.',
    '@My hands and the scale agree 99 times out of 100. And that one time we don\'t? My hands are right.',
  ],
  shop_mercado_bye: ['@Don\'t buy more than you can carry, friend! Safe travels!'],
  sign_mercado_wall: ['STORE RULE: weigh it in your hand first. ALWAYS THE HAND FIRST.'],
  npc_doc_puerto: [
    '@Welcome to Clinica del Sol! My doctor\'s orders are simple: stay in the shade, drink water, and don\'t pick fights with jungle bugs.',
    '@Nobody ever follows that last order, of course. Sit down. Let me see how bad it is.',
  ],
  clinic_ps_wall: [
    'CLINICA DEL SOL — walk right in, no appointment needed. If you\'re too hurt to walk in, you go first.',
  ],
  npc_deli: [
    '@Welcome to Deli Sol. Listen close: bread first, then meat, then cheese. Build it in that order and you\'ll never be sorry.',
    '@A sandwich stacked in the wrong order is just a sad mistake. But a lunch basket packed the right way? That\'s made with love.',
  ],
  deli_wall: ['TODAY\'S SPECIAL: stacking the layers in the right order. (Funny thing — it\'s the special every single day.)'],
  deli_no_recipe: [
    "@A FEAST basket? Oh, kid. There's only one recipe for that, and only one grandmother who knows it.",
    '@She lives all the way in Romania, I hear. If she ever teaches you that recipe, you can use my kitchen anytime.',
  ],
  deli_short: ['@I need three local foods to make this, friend. THREE. Right now you\'ve only brought me two. Go find one more.'],
  deli_family_made: [
    '@Bread, meat, cheese, and a blanket. There\'s your FAMILY BASKET, packed in the one right order.',
  ],
  deli_feast_made: [
    "@...So THAT'S how the recipe goes. That old grandmother really knew her stuff.",
    '@Take the FEAST basket. This food is so good that whoever eats it has to get back on their feet. That was her rule, not mine.',
  ],
  npc_curator: [
    '@Do you know how many REAL golden idols have passed through this museum? {g:coin}',
    '@Zero. Not one of them was real. I\'ve never confirmed a single genuine treasure, and I\'m the best in the world at spotting fakes.',
  ],
  museum_wall: ['THE MUSEUM OF ALMOST-GOLD — proudly displaying fakes since 1961.'],
  museum_idol_1: [
    'EXHIBIT A: "Sun God (we think)." Given to us by a tourist who just wanted it off their shelf.',
    '(It\'s grinning. Even the fake idols grin like that. It really bothers the curator, but he can\'t explain why.)',
  ],
  museum_idol_2: [
    'EXHIBIT B: "Tall Ceremonial Figure." It\'s a candlestick. Everybody can see it\'s just a candlestick.',
    '(But the museum rules say the sign has to call it a "figure." So it does.)',
  ],
  museum_idol_3: [
    'EXHIBIT C: "Gold-ish Llama Statue." Honestly, it\'s made a little TOO well to be a cheap fake.',
    '(Every week the curator tests it, half-hoping it\'s finally real gold. It never is. He\'s both relieved and a little let down.)',
  ],
  museum_idol_4: [
    'EXHIBIT D: "Composition Four." The sign swears up and down that this is an idol.',
    '(They\'ve swapped out the sign four times now. Each new one still claims it\'s an idol.)',
  ],

  /* ---------------- §A10 #6 — Museum of Almost-Gold ---------------- */
  q_museum_ask: [
    '@You there. You\'ve got the look of someone brave enough to march right into a pyramid.',
    '@Take a photo of each of my four fakes — exhibits A through D, the ones with the labeled signs. I\'m making a record of all my fakes.',
    '@Real gold showed up in this valley once, you know. And it was grinning. I refused to even examine it. Some things you don\'t touch.',
    '@Borrow this camera of mine. And keep the strap around your neck — that part\'s not up for discussion.',
  ],
  q_museum_active: ['@Don\'t worry, the fakes won\'t move while you photograph them, friend. Holding still is the one thing they\'re great at.'],
  q_museum_full: ['@Your hands are too full, and this camera\'s heavy. Clear some space first. My record of fakes can wait a minute.'],
  q_museum_done_beat: [
    '@Four photos, four fakes, not one real thing among them. PERFECT.',
    '@Here, take the flash off my camera. Real gold can\'t stand bright, honest light — it shrinks from it. Remember that when you get up to the pyramid.',
    "@...And if you ever do find something REAL up there, please don't tell me. I've got a perfect record of fakes, and I'd like to keep it.",
  ],
  q_museum_after: ['@My record of fakes is finished, and it\'s beautiful. Still zero real treasures, just the way I like it.'],

  /* ---------------- the jungle path + the grotto ---------------- */
  sign_jungle1: [
    'TRAIL MANNERS: step aside for llamas, for ants, and for anything that happens to be dancing.',
    '(The jungle put up this sign on its own, somehow. Best not to find out what happens if you ignore it.)',
  ],
  sign_jungle2: [
    'VALLE DORADO: STRAIGHT AHEAD. THE PYRAMID: ALSO STRAIGHT AHEAD, SADLY.',
    '(Someone crossed out the word "sadly" and then wrote it again, even bigger.)',
  ],
  sign_grotto: ['(A cool breeze drifts out of the rocks. Inside, the dark smells like old stone and, somehow, good luck.)'],
  grotto_chest_1: ['A basket someone hid here and never returned for. Lucky for you, the jungle kept it dry.'],
  grotto_chest_2: ['Someone\'s just-in-case alfajor cookie. Still sealed up tight. It\'s yours now.'],
  grotto_chest_3: [
    'At the bottom of the box: a small, warm spark of light, glowing steady like a porch lamp left on for you.',
    '(It wants to help one more time.)',
  ],
  grotto_glyph: ['A carved stone slab shows a small sun cupped in two hands. Whoever carved it pushed in deep, like it really mattered.'],

  /* ---------------- S17 M18 PART B (ADR-063) — PLACING THE AMERICAS LIVE ----------------
   * The two hero-signature SET caches (a coffee can / a market stall), the
   * sell-fodder valuables, and the two story keys — each a flag-gated gift the
   * world hands over once, when the bag has room (zero missables). */

  // THE PORCH SET — the coffee-can treasures of a 1995 summer, dug up at the green
  porch_can: [
    'Under the old oak tree on the green, right where you buried it: a coffee can, rusted soft over the years.',
    'You pop the lid off. There\'s the summer of 1995, staring back up at you — all the little treasures a kid once swore he\'d keep forever.',
  ],
  porch_can_done: ['(The can\'s empty now, the lid set back on crooked. The old oak will watch over it until next summer.)'],

  // THE MERCADO SET — the Puerto Sol market stalls, a charm at every counter
  mercado_stall: [
    'The last stall on the dockfront is closing up for the night, but the seller waves you over with a sly little smile.',
    'She pulls a cloth off a tray of little good-luck charms. "Para los cinco," she says — for the five of you. Free of charge. Go on, take them.',
  ],
  mercado_stall_done: ['(The tray\'s empty now. The seller\'s already turned to push her cart home, humming a tune.)'],

  // spare_hubcap (ch1) — sell-fodder, the joke is who'd want it
  gift_hubcap: [
    'Leaning against the pond fence: a single shiny hubcap, scratched up but still gleaming.',
    '(A name\'s written on the back in marker: "EARL." It\'s worth a lot to a guy named Earl, and basically nothing to anyone else.)',
  ],
  gift_hubcap_done: ['(The fence post is empty now. Somewhere, Earl\'s car is missing one hubcap. You could return it to him, or just sell it.)'],

  // fools_gold_idol (ch2) — near the Gilded Ruins
  gift_fools_idol: [
    'Dropped in the dirt by the gate ramp: a small grinning idol, heavy in the hand and shiny.',
    '(It shines like it\'s promising you something. But carved into the bottom is one creepy little wish: "be quiet.")',
  ],
  gift_fools_idol_done: ['(The spot where it sat stays colder than the ground around it. Sell it if you want, but never make a wish on it.)'],

  // emerald (ch2) — deeper in the jungle
  gift_emerald: [
    'Stuck in a knot of tree bark, glowing green in the one beam of sunlight that reaches down here.',
    '(An emerald about the size of your thumbnail. The jungle had it tucked away, but it won\'t miss one little gem.)',
  ],
  gift_emerald_done: ['(The knot in the bark is empty now. Somewhere up in the trees, a parrot squawks like it\'s filing a complaint.)'],

  // gold_doubloon (ch2) — dockside
  gift_doubloon: [
    'Wedged between two dock boards, rubbed smooth over time: one old gold coin, as old as the harbor itself.',
    '(Maybe it was some sailor\'s lucky coin, maybe his unlucky one. No way to know. Either way, it\'s easy to sell.)',
  ],
  gift_doubloon_done: ['(The gap in the boards whistles whenever the wind blows in off the water. Spend the coin well.)'],

  // banana_boat_ticket (ch2 key) — §A5's cargo-ship passage
  gift_boat_ticket: [
    'Pinned under a box on the pier: a ticket for the banana cargo boat, stamped and a little smudged.',
    '(PUERTO SOL, ONE WAY. The captain shrugs. "Someone paid for this and never showed up. Keep it. You\'ve earned the ride.")',
  ],
  gift_boat_ticket_done: ['(The box is lighter now. The seagulls seem to think you\'re getting a free ride. Let them squawk.)'],

  // wish_token (ch2 key) — in the idol's offering bowl
  gift_wish_token: [
    'In the stone bowl at the idol\'s feet, where people used to leave their wishes: one small clay token, never burned.',
    '(Someone set it here but never made their wish. It\'s warm, like a coin that\'s been held in a hand. Your Locket hums when it gets close.)',
  ],
  gift_wish_token_done: ['(The bowl is empty now. The idol\'s still grinning, but it feels calmer — like it\'s finally done granting wishes for good.)'],

  // a Ch.1 deli — OTTERBROOK DRUG's soda-fountain lunch counter (§A4.5)
  npc_deli_otter: [
    '@Lunch counter\'s still open, hon! I\'ll pack you a Family Basket if you bring me three good foods to put in it.',
    '@A corn dog, a slice of pie, whatever you\'ve got. Three foods, one basket, and a napkin folded up nice.',
  ],

  /* ---------------- VALLE DORADO (§A6 — the village that wished) ---------------- */
  valle_arrival: [
    'The valley opens up below you. The whole place is dead silent, like everyone is holding their breath at once.',
    'You see llama pens and bright painted doors. There\'s also a little shrine, and it\'s shining way too much for an old stone thing.',
    'It looks like the friendliest town you\'ve ever seen. The problem is nobody here is saying a single word.',
  ],
  sign_valle: ['VALLE DORADO — pop. 61 warm souls.', '(Someone crossed out the 61 and wrote a new count below it: "58 warm. 3 waiting." Three people are no longer counted as awake.)'],
  sign_pen: ['THE PEN: six llamas live here. (How many are actually in the pen right now? Go ask Tomas. And bring some patience.)'],
  sign_shrine: [
    'THE SHRINE OF THE GIVING SMILE — leave a wish, take a blessing.',
    '(People left tiny gifts here — a mitten, a marble. The idol on the shrine is shining bright and brand new, and that\'s a bad sign.)',
  ],
  sign_shrine_after: [
    'THE SHRINE — closed down for good. Turns out the whole wishing idea was a trap.',
    '(The little gifts are all gone. The people who left them came and took them back, laughing.)',
  ],
  npc_tomas: [
    '@I\'ve got six llamas, friend. I can tell which is which just by how they walk, even from way down the road.',
    '@Each one\'s got a habit. Paloma drifts off, Nube wanders, Rey marches, Pepita flops over, and Filosofo just STARES at things.',
    '@But lately Dorada walks like she weighs three hundred pounds. Something\'s off about her, and that scares me. Llamas always know when something\'s wrong.',
  ],
  npc_senora: [
    '@My neighbor made a wish for twice as much corn. The wish came true — but now she just sits at the shrine all day and won\'t move.',
    '@The corn really did grow double, kid. But she never even walked out to see it. The wish took something from her.',
  ],
  npc_valle_kid: [
    '@I almost wished for a bike. Then I saw that every grown-up who makes a wish goes all silent and empty afterward.',
    '@A bike isn\'t worth turning into one of those quiet people. Almost nothing is.',
  ],
  npc_doc_valle_out: [
    '@I\'m out visiting sick folks at home — except nobody\'s sick anymore! Everybody WOKE UP all at once!',
    '@In my whole career I\'ve never seen anything like it: a whole town getting better on the same day.',
  ],
  npc_wisher_a: ['@...', '(She stares at the shrine. Her hands keep making little bread-kneading motions out of habit, but her mind is far away.)'],
  npc_wisher_b: ['@...', '(It\'s a kid. He\'s still clutching his wish — a folded note that\'s gone soft from being held so long.)'],
  npc_wisher_c: ['@...', '(He gives you a slow nod, like he\'s moving through water and being polite about how slow it is.)'],
  npc_woke_a: [
    '@—and the BREAD! I left some dough out to rise TWO MONTHS ago. Somebody kept feeding it the whole time, and now it\'s HUGE—',
    '@I\'m going to bake everything I can think of, today, and then do it all again. Come by hungry!',
  ],
  npc_woke_b: [
    '@I remember everything I wished for and I do NOT want it anymore!',
    '@I want lunch and to run somewhere! BOTH AT ONCE!',
  ],
  npc_woke_c: [
    '@The strangest thing happened. While I was out of it, I felt like something golden was breathing for me, so I never had to wake up.',
    '@Then somebody up the mountain told that thing \'no,\' and I woke up. ...That was you, wasn\'t it? Thank you. I really mean it.',
  ],
  npc_llama_penned: ['@Mmmh. (The llama is back in its pen and acts like none of this was a big deal.)'],
  npc_llama_1: ['@Hmmph. (Paloma looks down her nose at you like she\'s above all this. Fine, she\'ll let you herd her home — just this once.)'],
  npc_llama_2: ['@...mmm. (Nube was busy watching one cloud drift by. He gives it up and turns toward home.)'],
  npc_llama_3: ['@MMPH. (Rey has decided this meadow belongs to him. After some convincing, he agrees to go home — slowly, and with his head held high.)'],
  npc_llama_4: ['@...mm? (Dorada stands totally still. Too still. Llamas normally blink — this one isn\'t. Something is wrong with her.)'],
  npc_llama_5: ['@zzz... mph. (Pepita was napping in the grass. She wakes up cranky and stomps home just to spite you. Hey, whatever gets her there.)'],
  npc_llama_6: ['@............ (Filosofo is staring hard at the pyramid, deep in thought. You wait. He finishes thinking, then calmly walks home.)'],
  llama_impostor_reveal: [
    'You reach for the llama and its wool slides clean off, like a magician yanking a tablecloth.',
    'Underneath the wool is gold, grinning, standing on six legs as solid as a table.',
    'THE "LLAMA" WAS A GILDED BEETLE THE WHOLE TIME!',
  ],
  llama_impostor_after: [
    'Its gold shell cracks and the beetle scurries off into the bushes, like it\'s embarrassed it got caught.',
    'Behind the shed you hear a quiet, unimpressed "mmph." The REAL Dorada was there the whole time, and she strolls home on her own.',
  ],

  /* ---------------- §A10 #5 — The Llama Drama ---------------- */
  q_llama_ask: [
    '@Friend! My whole herd got out — all six of them, scattered all over the place.',
    '@They ran off the same day the shrine started glowing. Llamas can always tell when a building\'s gone bad, and they were right.',
    '@Can you bring them back? Just walk up slow and be patient. Each llama needs you to understand one thing about it.',
  ],
  q_llama_active: ['@The pen\'s all set and the hay\'s fresh. The only thing missing is the actual llamas.'],
  q_llama_full: ['@The poncho is yours, but your bag is full — you\'ve got nowhere to put it. Make some room and come back.'],
  q_llama_done_beat: [
    '@Six! All SIX are home! Everything feels right again.',
    '@Here, take this WOOL PONCHO. Every llama gave wool for it. Dorada gave twice as much, like she felt bad for the mix-up.',
    '@It\'ll keep claws, teeth, and the cold off you. Wear it when you head up the mountain.',
  ],
  q_llama_after: ['@The whole herd is napping in a neat little row. Even Filosofo, the one who never settles down.'],

  /* ---------------- the shops + clinics of the valley ---------------- */
  shop_valle_greet: ['@Welcome to Lana & More! The wool\'s from right here. The \'more\' is whatever odds and ends I picked up this week.'],
  shop_valle_bye: ['@Go warm, niño.'],
  sign_valle_wall: ['ALL WOOL GUARANTEED LLAMA-APPROVED. (Yes, we checked with the llamas.)'],
  npc_doc_valle: [
    '@This is the Valle Clinic. I patch up mountain sickness, bad moods, and the occasional surprise beetle.',
    '@But those gray, silent people — I can\'t help them. The problem isn\'t a sickness inside them. Something reached in and took a piece of them away.',
  ],
  clinic_valle_wall: ['FOR SMALL PROBLEMS: rest, soup, sunshine. FOR BIG PROBLEMS: the pyramid is the cause. PLEASE STAY AWAY FROM THE PYRAMID.'],
  npc_priest_valle: [
    '@Welcome, child. The shrine wants your wishes, but this chapel never asks you for a thing. You can just rest here.',
    '@We pray for the silent ones every day. Lately those prayers feel like they\'re working again, like someone good is finally listening.',
  ],
  chapel_valle_wall: ['VALLE CHAPEL — candles are free. Ask us for matches. Hope comes with the visit.'],

  /* ---------------- the hospitals + the Otterbrook chapel (Prompt 25) ---------------- */
  npc_doc_brickton: [
    '@Brickton General Hospital is finally open. I\'ve seen some wild stuff lately, kid — I can barely keep up.',
    '@We can wake people up, cure them, all of it. The patients even float right over to the front desk on their own — makes my job easy.',
  ],
  hospital_wall: ['BRICKTON GENERAL — IF YOU CAN READ THIS SIGN, YOUR EYES ARE FINE. GO TO THE NEXT WINDOW.'],
  // S22 (ADR-117) — the WARD floor upstairs
  hospital_f2_sign: [
    'PATIENT WARD — QUIET PLEASE. Visit anytime. You leave when the doctor says you can.',
    '(A note is taped up: "the man in bed 3 is totally FINE — he just likes being fussed over.")',
  ],
  npc_ward_nurse: [
    '@Keep your voice down up here, hon. Half these folks passed out when the meteor hit, and the other half passed out when they saw how much treatment costs.',
    "@Need your friends woken up? Go to the front desk downstairs for that. Up here we mostly just hand out pudding and worry about people.",
  ],
  npc_ward_patient1: [
    '@Zzz... the sky fell... zzz... I told them it would... zzz...',
  ],
  npc_ward_patient2: [
    '@I only came in for a splinter, and now I\'m stuck next to a guy who talks through his dreams out loud. (points at bed 1)',
  ],
  npc_ward_patient3: [
    '@A meteor, a gang of creepy smiling men, and now wobbly hospital jello. What a week. I mean it — what a week to be ALIVE.',
  ],
  hospital_mushroom_note: [
    'NOTICE: If you\'ve turned into a mushroom, only a DOCTOR can fix it. It\'s the rule.',
    '(Scribbled below: "no, the church can\'t cure it. yes, we already asked them.")',
  ],
  hospital_broke: ['@Sorry friend, you can\'t afford it. Healing takes either money or a miracle, and the only one I\'ve got for sale is the kind that costs money.'],
  hospital_cured: ['@All cleaned up, cured, and back on your feet. Try to stay healthy for a week, okay? Do it for me.'],
  hospital_cured_homesick: [
    '@...And as for that one, there\'s no medicine for it. What they really need is to call their mom.',
    '@I charged you for the visit anyway. Tell her the doctor says hi.',
  ],
  npc_priest_otter: [
    '@Welcome, welcome. We left the chapel\'s light on all through that scary night when the meteor came.',
    '@Stay as long as you want. The benches are old, but you\'re always welcome here, every single day.',
  ],
  chapel_wall: ['OTTERBROOK CHAPEL — service is Sunday. Our doors are always open. Yes, even for you, Gary.'],
  chapel_prayer: [
    'All of you sit quietly together for a moment. This is the good kind of quiet — the kind that makes you feel better, not worse.',
    '* Everyone feels a little healed.',
  ],
  priest_mia: [
    '@...That friend of yours — the one whose hands fold into a prayer without her even noticing.',
    '@Whatever gift she\'s got, it\'s real. Tell her this chapel is always happy to see her go by.',
  ],

  /* ---------------- the step-pyramid (§A6 — masks, floors, the apex) ---------------- */
  pyramid_approach: [
    'The pyramid doesn\'t try to scare you. It doesn\'t have to make any effort at all.',
    'It just sits there, made of giant stone steps, calm and sure of itself, like a clenched fist resting on a table.',
    '(There\'s a picnic table by the path. Somebody knew that anyone coming here would need a rest first.)',
  ],
  sign_pyramid: [
    'THE STEP-PYRAMID. (The plaque is older than the village and says one thing:)',
    '"IT SMILED FIRST."',
  ],
  pyr_mask_1: ['A stone mask sits on a stand. Its mouth looks like a lever you could flip. Its carved eyes seem to be watching you.'],
  pyr_mask_2: ['A second mask. It looks frozen in the middle of saying something — and it\'s been stuck like that for five hundred years.'],
  pyr_mask_3: ['A third mask. Whoever carved it made it look kind at first, but the kindness has worn away over the years.'],
  pyr_mask_4: ['The last mask. It\'s the smallest one, but somehow it feels the most threatening.'],
  pyr_mask_turn: [
    'You push on the mask\'s mouth like a button. Deep under the floor, something as big as a house TURNS.',
    '(Carved tracks in the floor grind a quarter-turn and then stop, locked into place.)',
  ],
  apex_dais: ['The stone platform is spotless. Years of dust should be piled here, but it\'s all gone — and nobody cleaned it.'],
  apex_dais_after: ['The platform is just plain stone now. Boring, ordinary stone — exactly the kind this valley likes best.'],
  apex_approach: [
    'The room at the top is dead silent, like it\'s holding its breath.',
    'On the platform sits the idol. It\'s as small as a house cat, but you can feel it\'s heavy — and it feels mean, like it\'s been holding a grudge for ages.',
    'Every little gift from the shrine down in the village is up HERE, stacked in neat rows. It took all of them.',
  ],
  apex_grin_wakes: [
    'the grin turns to you first. the rest of it follows, like an afterthought.',
    '"you brought warm things. wishes keep best in warm things."',
    'THE IDOL OF THE GILDED GRIN would like your everything!',
  ],
  idol_grin_wider: ['the grin gets wider. there was no room for that. it found room.'],
  // S16: the Grin's half-dead desperation blow — the telegraph one beat before
  // Jay's wall answers it (the_wall_that_answers; awake_the_wall_that_answers).
  idol_gathering: [
    'The Idol stops grinning. For the first time, it actually looks SCARED.',
    'It pulls every bit of golden light in the room into its hands — the glow off the corn, the wool, the setting sun — all of it, winding up one giant swing you can\'t dodge.',
    'The attack drops down over you, wide and fast like a thrown bedsheet.',
  ],
  idol_form_solid: ['The Idol hardens into SOLID GOLD, smooth all over and smug about it! (Normal hits will just bounce off. {rex}\'s light will still get through.)'],
  idol_form_hollow: [
    'The gold turns dark, and you realize there\'s NOTHING inside it. It\'s HOLLOW!',
    '(Vibe attacks pass right through the empty space and do nothing. Bats, though — a solid bat still works just fine.)',
  ],
  awake_cold_reads: [
    'The hollow idol opens up, and the room turns cold — far colder than the mountain air alone could make it.',
    '{faye} doesn\'t step back.',
    '@...It\'s empty. All that shine, and it\'s EMPTY in there. That\'s the whole trick.',
    'She holds out one hand, palm down, the way you check a window for a draft.',
    '@The cold shows me what all that gold is hiding.',
    'Frost spreads across her fingers, like it\'s been waiting forever for her to finally call on it.',
  ],
  /* ---- S16 ("The Old Light, Doubled"): Jay's three late awakenings. He
     barely speaks — let the light do the talking (§A11.2, played straight). ---- */
  awake_the_first_borrow: [
    'The gate guard won\'t move, and there\'s no way around him. {rex} stares at him for a long moment — then does something he\'s never done to a person before.',
    '({rex} reaches into the guard\'s mind, silent and careful. For a moment it\'s like he\'s stepped inside the man and is wearing him like a coat. The man\'s hand lifts the latch, and the gate swings open.)',
    '({rex} steps back out of him, gentle, and gives it back.) ...Sorry, sir. You\'re going to have a weird minute.',
    '(The guard blinks hard.) ...Did I just— why am I holding the gate open for you kids? (He shrugs it off. He\'s fine, just confused more than mad.)',
    '{milo} is grinning at the puzzle solved. But {faye} has gone very still, and takes a small half-step back from {rex} — the kind you take without deciding to.',
    '@(...He can do that. To anyone.)',
    '({rex} doesn\'t look proud. He looks like a kid who just found out he can break into anything — and that this scares the people around him.)',
  ],
  awake_the_borrowed_voice: [
    'The whole crowd speaks as one now. The Hush has emptied them out until they\'re all humming the same flat note — and {rex} can feel a way to reach inside that note.',
    '@(You don\'t have to do this.)',
    '({rex} does it anyway. He reaches into the droning crowd like reaching into cold water, and gently lifts one person\'s voice free, the way you\'d carry a sleeping kid.)',
    'It doesn\'t feel like a win. It\'s the enemy\'s own trick, used just once and carefully, by a kid who hated every second of doing it.',
    'The borrowed voice turns toward the others. {rex} does not look proud. He looks like he is keeping a promise to give it back.',
  ],
  awake_the_wall_that_answers: [
    'The blast of light dropped down wide and fast, like a thrown sheet — too big to dodge and too quick to block. There was nowhere to move the team and no time to do it.',
    '{rex} did not think. His hands came up on their own.',
    '(A wall of light shot up between his friends and the attack. It sent the whole blow straight back the way it came.)',
    'The idol got hit by its own attack, and the room rang from the force. Every one of the friends was still standing.',
    '@...Huh. (He shakes out his hands like they stung.) Do it again. I\'ll be here.',
  ],
  awake_the_whole_sky: [
    'Mars is below. Home is a blue speck you could cover with a thumb, and every porch light on it is on.',
    'And all at once {rex} can feel them — Otterbrook, the Embers, the long road, every friend who ever waved him home.',
    'It is too much to hold and he does not try to hold it. He lets it through.',
    '(His power stops being something he holds and becomes part of who he is — like a whole sky of light, all pouring forward at once.)',
    'No words. There was never going to be a word big enough. Just the light, and the boy, aimed.',
  ],
  /* ---- DORIN ("The Monk's Full Path"): the Trial of the Mute Mountain. The
     beat that gates his joining (Ch.9). Voice: formal, calm, faintly baffled by
     the modern world; his lines read like sutras (§A11.2, played straight). ---- */
  awake_trial_of_the_mute_mountain: [
    'The elders say the Mute Mountain hasn\'t made a sound in nine hundred years. The test is simple: don\'t ask it anything. Just sit and listen until it answers on its own.',
    '{dorin} sits down. Cold air slides off the snow and settles on the back of his neck like a flat, heavy hand.',
    '@I have no question. I came only to be still.',
    'The mountain has held onto every falling star that ever landed on it. Now it leans close and shows him all of them at once.',
    '(The mountain isn\'t giving him new power. The full Comet power was always inside him — the mountain just showed him where he\'d been hiding it from himself.)',
    '@...Oh. (He stands up calmly.) It was inside me the whole time. Thank you for the patience it took to find it.',
  ],
  /* ---- MIA ("Ability Expansion"): her three iconic late awakenings. Kind and
     steel-spined; she hears the Embers sing, made literal (§A3, §A11.2). ---- */
  awake_the_first_heartlight: [
    'The Resonance Site goes still and quiet. Somewhere under the floor, an Ember is humming a note so faint and tiny it almost sounds sorry to be heard.',
    '{faye} kneels and listens the way she prays — all the way down.',
    '@...Oh, you poor thing. You\'ve been trying to be heard this whole time.',
    'She hums it back to it. Just once. Just the same small note, returned.',
    '(The darkness in the room pulled back. There\'s one kind of light the dark can\'t swallow, and she just learned how to sing it out.)',
    '@Okay. Okay. I can carry that one. Sing it again — I\'ll learn the rest.',
  ],
  awake_the_match_that_stays_lit: [
    'Every fire she\'s ever started, the Hush has snuffed out — slowly and surely, like a thumb pressing down on a candle flame.',
    'Not this one. {faye} sets her jaw and keeps her hand open over the spark instead of cupping it.',
    '@A fire you have to hide isn\'t a fire. It\'s a secret. I\'m done keeping it small.',
    'This time the flame doesn\'t die. It grows taller, catches the air, and just keeps burning.',
    '(The whole sky turned orange with fire — and this time it STAYED lit. Her flame finally won\'t go out.)',
  ],
  awake_she_hears_it_all: [
    'It hits her like a flood — not just one twisted Ember but every Ember in the whole field at once, all droning the Hush\'s dull gray note.',
    'It should have buried her. {faye} opens her hands instead of covering her ears.',
    '@I hear you. Every single one of you. Come here.',
    'And she pulls — not just one spark, but the whole SONG out of all of them at once, the entire field bending toward her like grass before a storm.',
    '(That dull gray note burst into music. She\'d spent her whole life listening — and now the whole field finally sang back.)',
  ],
  ember2_get: [
    'Inside the hollow idol, right behind where its grin used to be, there\'s a warm glow it was never able to swallow.',
    '{rex} held up the Star Locket!',
    '* The second EMBER joined the first one. The Heartlight grew stronger — TWO Embers now, glowing together.',
  ],
  apex_after: [
    'The little gifts on the platform start to stir, like a room full of sleeping people waking up when someone opens a window.',
    'Down in the valley, somebody laughs out loud — like it\'s the first laugh they\'ve managed in a long time.',
    'You should go see that.',
  ],
  valle_recovery: [
    'The plaza is LOUD.',
    'The baker is yelling about dough. The kid is running in circles on principle.',
    'The man who used to sit frozen at the shrine is shaking everyone\'s hand twice — starting and finishing with yours.',
    'A town doesn\'t get its life back all at once. It comes back slowly, one laugh at a time.',
  ],
  ch2_card: [
    'The valley gets to keep the good things: its corn, its evening sunlight, its wool, and its laughter.',
    'The Locket hums with both Embers now. Eight more Embers are still out there sleeping, somewhere far to the east.',
    "* (The boat home leaves whenever you're ready. Bert's waiting at the Brickton docks, happy to take you.)",
  ],

  /* ---------------- THE ARMY ON OUR TAIL (S19 M40, §A6) ----------------
   * GENERAL BUCKLE — one obsession: doing everything BY THE BOOK. He quotes
   * subsection numbers, he is sincerely sure, and he is sincerely wrong. The
   * army is bumbling-earnest, never the Hush; nobody is the villain here. The
   * per-chapter scene staging (checkpoint map, tank route, flyover) rides these. */
  army_misread: [
    '@HALT. Under Army Rule Twelve, I\'m placing you under arrest for stealing a piece of military equipment.',
    '@A secret signal reached our base at six this morning. We tracked it here, and it led us to... five kids. And a dog.',
    '@I\'ve read the rulebook TWICE. There\'s no rule for arresting children. So I\'m making it up as I go, and I HATE doing that.',
    "@(He squints at {milo}'s remote.) ...That's got to be the stolen equipment. Something that tiny shouldn't work that well.",
  ],
  army_misread_recruit: [
    '@Psst. Kid. The General\'s heart is in the right place. He even sorted everything in the tank in alphabetical order.',
    "@I just want to go home. My mom makes this casserole I miss. You probably get that, huh? Yeah. You do.",
  ],
  army_clearing: [
    '@(General Buckle watches his screen and finally sees what the signal really is — not the kids at all. It\'s the Hush.)',
    '@...Rule Twelve, line four. "When an officer makes a mistake, he admits it. Out loud. To the person he wronged."',
    '@I was wrong. I\'m saying it out loud, to you. I chased the wrong target across two whole countries, and I am SORRY.',
    '@The whole army is standing down. And if that Hush thing ever needs fighting, you call this number. We\'ll come running.',
  ],
  army_clearing_recruit: [
    "@We're going home! The General teared up. He blamed it on the wind, but there wasn't any wind.",
    '@If you ever need a friendly army that\'s better at waving than fighting, we\'re YOUR army. Tell your dog the tank says hi.',
  ],

  /* ══════════════════════ CHAPTER 4 — NORWAY ══════════════════════ *
   * "The Fjord That Sleeps." The North Sea hop, Kvisthavn under the cliffs, the
   * 10× moor, the giants of Lilleby, and the Sleeper's Spine. §A11 voice; the
   * Whisperwig's beats run sincere (§A11.2/.3 — the Hush is never funny). */

  // — THE NORTH SEA HOP: Bert offers the next leg (from Lucille's cabin) —
  bert_norway_ask: [
    "@England's behind us and the locket's humming for somewhere colder. There's a fjord up north where the fish are the size of rowboats and the people are NOT, mostly.",
    "@Lucille's pointed at a hamlet called KVISTHAVN. The North Sea'll try to shake us out of the sky the whole way — so hold something. Say the word.",
  ],
  ch4_arrival: [
    '(Lucille claws over a sea the colour of a knife, loses an argument with the wind twice, and wins it on the third try. Then the cliffs come up — black, wet, enormous — and tucked under them, a string of red boathouses.)',
    "@KVISTHAVN. End of one leg, start of the next. (Bert pats the dashboard.) She made it. Don't tell her how surprised I am.",
    '(The hatch drops onto a stone quay. The air is cold and clean and smells of salt, pine, and woodsmoke — and underneath it, low enough to feel in your teeth more than hear, a long, slow HUM. Like something very large, breathing in its sleep.)',
  ],
  ch4_card: [
    "Kvisthavn's bell rings out over the water again, and forty years of a letter finally got read aloud.",
    'The Locket hums with FOUR voices now — the deepest one yet, the kind you feel in the floor. Six Embers are still out there.',
    "* (Lucille is fuelled and ready when you are. Bert says the next leg is 'a tabletop kingdom' and won't explain further.)",
  ],

  // — THE SLEEPER'S EAR: BOSS 4 (the Whisperwig) + Heartlight 4 (The Deep Hum) —
  whisperwig_door: [
    "(Deep in the canal, the Sleeper's hum is everywhere — in the walls, the floor, your own ribs. And threaded through it, thin and wrong, a WHISPERING. You can't make out the words. You're fairly sure that's mercy.)",
    "@It's down in his EAR. ({milo}, very quiet, his Clicker hissing static.) That's what's been making him sleep. That's what's been eating the sound out of this whole country.",
    '(The whispering stops. It has noticed you noticing it.)',
  ],
  whisperwig_open: [
    'THE WHISPERWIG: ...shhh. shhh. he was so loud, the big one. forty years of dreams, all that NOISE. i made it quiet for him. i can make it quiet for you too.',
    "(You can't see it. It's burrowed deep in the canal, just a voice and a cold draft. Bats and frying pans find nothing but warm dark.)",
    '@We can\'t HIT what we can\'t find! ({milo}) — it\'s hiding in the ear. We need to make it come OUT. We need NOISE. Volt it, light a Firecracker String, fire a Bottle Rocket — anything LOUD!',
  ],
  whisperwig_burrow: ['(The Whisperwig pulls deeper into the canal. The whispering goes muffled and patient. You can\'t reach it like this.)'],
  whisperwig_surface: [
    '(The NOISE rolls down the canal like a thunderclap, and the Whisperwig is FLUSHED OUT — a pale, bristled thing the size of a sofa, blinking in the open, furious to be heard.)',
    "(And the sound it hated does something to {faye}. She feels the Sleeper's own thunder-snore roll up through the mountain and into her teeth — and grabs it.)",
  ],
  whisperwig_whisper: ['THE WHISPERWIG: shhhhhhh. (It pours a wall of whispering over the whole party — and your voices go out from under you.)'],
  whisperwig_win: [
    '(The Whisperwig lets go of the ear and curls up small, the whispering finally, completely stopped. For one held breath there is no sound in the whole mountain at all.)',
    '(Then: a snore. An ENORMOUS, contented, ground-shaking snore. Grandfather Storheim rolls over in his forty-year sleep, and for the first time the dream looks like a good one.)',
    "@He's just... sleeping now. Properly. ({faye}, listening to something the rest of you can't quite hear.) Come here — the ear. It wants to give us something.",
  ],
  sleepers_ear_early: [
    "(The canal hums, deep and even, but it stays just out of reach — like the Sleeper won't sing for you while that whispering thing is still curled in his ear.)",
  ],
  // ADR-121 — THE HUSH SENTINEL crater fight (super-Glint carries it; Surge α
  // awakens mid-battle; it is REPELLED, not killed).
  sentinel_open: [
    '(The crater is not a hole. It is a DOOR, and something is climbing out of it.)',
    'Metal the color of dried blood unfolds — legs, then more legs, then a single pale-blue eye that opens like a sunrise on the wrong planet. It is taller than the house. It is older than the town.',
    "@That — that's not from here. ({rex}, very quietly.) That's not from ANYWHERE here.",
  ],
  sentinel_surge: [
    "@It came in on the meteor, ahead of all of them. A SCOUT. (Glint, fast.) Kid — you can't fight a piece of Mars with a baseball bat. But you've got the old light in you now. LET IT UP.",
    '(The Star Locket goes hot against your chest. Something that has been asleep since before you were born opens ONE eye.)',
  ],
  sentinel_pressure: [
    "(The Sentinel pulses cold blue, and the warmth goes out of the night — your own voice feels far away, like shouting underwater.)",
  ],
  sentinel_repel: [
    "@NOW — all of it, EVERYTHING I've got! (Glint, blazing white.) GO HOME!",
    '(Glint detonates into a small, brief sun. The Sentinel throws up a limb, its eye stutters — and then it FOLDS, joint by joint, and sinks back down into the crater it climbed out of.)',
    '(It is not dead. The eye dims to an ember and goes dark. Whatever it is, it will keep. But not tonight.)',
  ],
  ember4_get: [
    "(With the Whisperwig gone, the Sleeper's Ear opens up like a cathedral. The hum swells — the deepest note you have ever stood inside, the whole mountain a single warm chord.)",
    '(The Locket answers. A fourth voice drops in under the other three — a bass so low it is less a sound than a hand on your back. THE DEEP HUM.)',
    '{rex} held up the Star Locket!',
    '* The fourth EMBER settled in. The Heartlight sings in four parts now, and the lowest one you feel in the floor.',
  ],

  // — THE THUNDER-SNORE: Mia awakens VIBE VOLT α (the §A6 Ch.4 awakening, sincere) —
  awake_the_thunder_snore: [
    "(The noise drags the Whisperwig into the open — and {faye} feels it.)",
    "(The Sleeper's snore, rolling up through a hundred feet of mountain.)",
    "(A charge gathering in the floor, in her shoes, in her teeth.)",
    "(She doesn't decide to. Her hand comes up on its own, full of borrowed thunder, and the whole canal lights blue-white.)",
    '* {faye} awakened VIBE VOLT α — the thunder-snore, hers to throw now.',
  ],

  // — KVISTHAVN NPCs (one obsession each, §A11) —
  npc_kv_sigrid: [
    "@Oh — careful, dears, I can't see you properly. I lost my spectacles out on the moor and the whole fjord's gone to SMUDGES.",
    "@Forty years I've watched that water change its mind every hour, and now I can't tell the waves from the weather. It's the not-seeing-it I can't stand.",
  ],
  npc_kv_halvor: [
    "@The cod used to come in two to a net. Now they come in ONE, and it's the size of a dog, and it's RUDE about it.",
    "@...There's a letter in my coat I've carried since I was your age. Never sent it. She moved up to Lilleby and got, well. Large. And I got shy. Forty years of shy.",
  ],
  npc_kv_bellkeeper: [
    "@The harbor bell's gone quiet. Not broken — QUIET. The grey thing came through and took its voice, same as it's taking everyone's.",
    "@A town with no bell is a town that can't say it's still here. Drives me up the wall. Up the BELL-tower, more accurately.",
  ],
  npc_kv_shopkeeper: [
    "@Velkommen! Everything's fresh, everything's cold, and everything was BIGGER last week, I swear it on the cod.",
    "@If you're headed up the moor — take a Firecracker String. When something's hiding where you can't hit it, you don't need a weapon. You need to be LOUD.",
  ],
  npc_kv_kid: [
    "@If you hum at the fjord, it hums back! Try it! ...Well — it USED to. Lately it just goes 'shhh' and I don't like it.",
  ],

  // — BOOTSTEP MOOR —
  npc_moor_walker: [
    "@Mind the wildlife. The Ember in the mountain's been humming so long it's swelled everything that breathes out here to ten times the size.",
    "@A midge the size of a fist. A snail that hits like a storm front. A berry you could saddle. Lovely country. Wouldn't sit down in it.",
  ],

  // — LILLEBY (the giants' town) —
  npc_ll_mayor: [
    '@WELCOME TO LILLEBY. (He kneels so his face is merely the size of a door.) Everything here is normal-sized. That is OUR official position and we are sticking to it.',
    "@Small visitors are SO rare. We'd love to host you a picnic — properly, at YOUR scale. We just, ah. We keep getting the portions wrong. Catastrophically.",
  ],
  npc_ll_keeper: [
    "@(She lowers a hand the size of a table to shake yours, thinks better of it, offers a fingertip instead.) Mind the prices — everything here's giant-made, so it lasts a giant while.",
  ],
  npc_ll_sweetheart: [
    "@A letter? For ME? (She holds it up to one eye; to her it is the size of a postage stamp, which is to say, the size of a real letter to you.) ...Oh. OH. From HALVOR. After all this time.",
    "@(She is very carefully not crying, at a scale where crying would be a weather event.) Tell that shy old fool I kept a window facing the fjord for forty years. Tell him I'm STILL keeping it.",
  ],
  npc_ll_child: [
    "@You're SO little! Are you a toy? Mamma said I can't keep toys that talk. Are you a toy that talks? This is the best day.",
  ],
  npc_ll_undertaker: [
    "@Forty years I've been the undertaker here and NOBODY has had the decency to die. The Ember keeps everyone humming along. It's terribly dull. I've taken up whittling.",
  ],

  // — THE SLEEPER'S SPINE (dungeon) — the Dorin cameo (§A3/ADR-125, never named) —
  npc_spine_walker: [
    "(A travel-worn kid in a grey gi sits cross-legged on the giant's knuckle, eyes shut, a string of worn prayer beads turning through his fingers. He might be asleep. He might be listening.)",
    "@...You hear it too. The silence. (He doesn't open his eyes.) I'm following it home. It's the same silence everywhere — only here it has a NAME, and the name is sleeping.",
    "@(You ask who he is. The beads pause.) ...Not yet. I haven't earned it back yet. Go on. The ear is up the arm. Mind the fall.",
  ],

  // — KVISTHAVN / BOOTSTEP / LILLEBY / SPINE SIGNS —
  sign_kvisthavn: ['KVISTHAVN — pop. 60, give or take a fishing season. PLEASE DO NOT FEED THE GULLS. (They are large enough to feed themselves, and you.)'],
  sign_fjord_road: ['↑ BOOTSTEP MOOR & LILLEBY. The path is safe. The wildlife is not small. These two facts are unrelated and we resent the implication.'],
  sign_quay_bell: ['THE HARBOR BELL. Rung at dawn, at dusk, and whenever a boat comes home. (Someone has chalked underneath: "and lately, never.")'],
  sign_bootstep_moor: ['BOOTSTEP MOOR. Everything here grew up. Keep to the lane. If something the size of a shed is asleep on the lane, wait. Or do not. We are a sign, not your mother.'],
  sign_gorge: ['THE GORGE — cross by the plank bridge. (The plank bridge is currently a very large berry. The Booster Club apologises and is "looking into it".)'],
  sign_lilleby: ['WELCOME TO LILLEBY. EVERYTHING HERE IS NORMAL-SIZED. — the Lilleby Booster Club (please walk under the doors; the doors are also normal-sized)'],
  sign_great_table: ['THE GREAT TABLE. Reserved today for our HONOURED SMALL GUESTS. (A place has been set. The fork is, regrettably, the size of a rake.)'],
  sign_spine_hand: ["THE SLEEPER'S HAND. You are standing on a person. He is asleep. He has been asleep for forty years. Tread softly and go up the arm."],
  sign_spine_meltfall: ['Meltwater runs off the shoulder cold enough to bite. It is almost solid already. Almost. (A cast of FREEZE would do the rest.)'],
  sign_sleepers_ear: ["THE SLEEPER'S EAR. The hum is loudest here — and so is the whispering under it. Whatever is making him sleep is making it. Be ready to be LOUD."],

  // — SHOP greetings (§A11 — one obsession at the counter) —
  shop_kvisthavn_greet: ["@Kvisthavn Kolonial — cold goods, hot coffee, and the loudest little firecrackers north of anywhere. What'll it be?"],
  shop_kvisthavn_bye: ['@Stay warm. Stay loud. The quiet ones never come back.'],
  shop_lilleby_greet: ['@(She kneels to the counter.) Everything here is NORMAL-SIZED, which means one of our loaves is a week of yours. Excellent value, technically.'],
  shop_lilleby_bye: ['@Mind the step on the way out. To you it is a cliff. To us it is a step. Perspective!'],

  /* ── CHAPTER 4 QUESTS (§A10) — the giver flows + the walk-trigger pickups.
   *    Mirror the Ch.3 pattern (ask → active → full → done_beat → after). ── */

  // #9 SIGRID'S SPECTACLES — the two pond-sized lenses on the moor (→ Sigrid's Monocle)
  q_sigrid_ask: [
    "@You're going up the moor anyway? Then — oh, would you? My spectacles flew apart out there. Two lenses, each one grown pond-sized by the hum. I can't even FIND them, let alone wear them.",
    "@Bring them back and I'll have the smith grind them down to fit again. The little one I'll give to YOU — a Monocle. Sharpens what a body can see. You'll want that, where you're going.",
  ],
  q_sigrid_active: ["@Both lenses, dear — one's out past the first bog, the other's catching light up on the high moor. I'd know that glare anywhere. I just can't WALK to it."],
  q_sigrid_lens1: ['(A lens the size of a pond lies in the bog, throwing the whole grey sky back up at you. It shrinks to a coin in your hand the moment you lift it — Ember-grown, now Ember-let-go.)'],
  q_sigrid_lens2: ['(The second lens leans against a cairn on the high moor. Through it, far off and upside-down, you can see Kvisthavn — and a tiny figure on the quay, squinting your way.)'],
  q_sigrid_full: ['@You have BOTH? Oh, let me — (she holds them up, and her whole face changes) — there. THERE you are. And there\'s the fjord, every wave of it. Here, the little lens is yours. Earned.'],
  q_sigrid_done_beat: [
    "(Sigrid settles the mended spectacles on her nose and just looks at the water for a while, like she's drinking it.)",
    '* {rex} got the SIGRID\'S MONOCLE!',
  ],
  q_sigrid_after: ['@Forty years of this view and I nearly lost it to a smudge. Thank you, dears. Go careful. I\'ll be watching the water for you — properly, now.'],

  // THE UNSENT LETTER — Halvor's forty-year letter, delivered to Lilleby
  q_letter_ask: [
    "@You're crossing to Lilleby? Then— (Halvor digs a soft, folded, much-handled letter out of his coat.) Her name's on the front. She lives up there now. Got large with the rest of them, but she's still HER.",
    "@I wrote this when I was your age and never had the nerve. Forty years in a coat pocket. ...Take it. Read it to her if she'll let you. I can't do it myself. I tried. I always go shy at the gangplank.",
    '* {rex} is carrying HALVOR\'S LETTER.',
  ],
  q_letter_active: ["@She's up in Lilleby — you'll find her by the window facing the sea, the big one. Just... be gentle. Forty years is a long time to be a coward about a nice thing."],
  q_letter_deliver: [
    '@(You hold up the letter. The giant woman at the window goes very still, then lifts it to one enormous, careful eye.)',
    '@...From Halvor. After all this time. (To her it is a postage stamp; to you, her whisper is the whole room.) Read it to me. I want to hear it small and true.',
    "(You read it out. It is short, and plain, and forty years overdue, and it is the bravest thing the old fisher ever did.)",
  ],
  q_letter_deliver_done: ["@Tell him I kept a window facing the fjord for forty years. Tell him I am STILL keeping it. Now GO — he's waiting, and he's not getting any less shy."],
  q_letter_full: ["@You... you read it to her? And she— (Halvor sits down hard on a crate.) She kept a WINDOW. Forty years. And I sat here being SHY at a perfectly good window."],
  q_letter_done_beat: [
    "(Halvor presses a small charm into your hand — sea-glass, worn smooth by a nervous thumb across four decades.)",
    '* {rex} got the COOL CHARM!',
    "@Whatever you're sailing toward, kids — don't wait forty years to say the warm thing. Take this. It kept me steady. Mostly.",
  ],
  q_letter_after: ['@I\'m taking the morning boat up to Lilleby. To TALK to her. With my actual mouth. ...Forty years. Don\'t you dare laugh; I\'ll cry, and at my size that\'s just a normal amount of crying.'],

  // THE SILENCED BELL — find the clapper, ring it loud (the NOISE theme; → Brass Ship's Bell)
  q_bell_ask: [
    "@The harbor bell's voice got taken by the grey quiet. The clapper rolled off the quay when it went — down among the mooring stones somewhere.",
    "@Find me the clapper and we'll hang it and RING the old girl till the whole fjord hears. A town that can be heard is a town the quiet can't finish.",
  ],
  q_bell_active: ['@The clapper\'s down by the mooring stones, where the quay meets the water. Heavy old thing. Mind your toes.'],
  q_bell_clapper: ['(The bell\'s clapper lies wedged among the mooring stones, cold and heavy as a forearm. It still has a little ring left in it — you can feel it want to.)'],
  q_bell_ring: [
    "(The bellkeeper hangs the clapper, spits on his hands, and nods you to the rope. You pull together.)",
    "(The bell does not ring so much as DECLARE. The sound rolls out across the water and comes back off the far cliffs, and somewhere up the moor a hundred-foot Sleeper almost, almost stirs.)",
    '@THERE she is. THAT\'S a town saying it\'s still here. Come back — I owe you something with weight to it.',
  ],
  q_bell_full: ['@The bell\'s back in good voice and so am I. Here — take this. You\'ll know when to ring it.'],
  q_bell_done_beat: [
    '(He unhooks a small brass ship\'s bell from the rafters and sets it in your hands. It is heavier than it looks, the way important things are.)',
    '* {rex} got the BRASS SHIP\'S BELL!',
  ],
  q_bell_after: ['@Dawn, dusk, and whenever you come home. That\'s when she rings now. Safe travels, loud ones.'],

  // THE GIANT'S PICNIC — a feast cut down to human scale (scale comedy; → Troll Cross)
  q_picnic_ask: [
    "@We want to host you PROPERLY. A picnic, your size. But we keep getting it wrong — last time the 'sandwich' needed planning permission.",
    "@Help us get it right: a slice of brunost cut down to something you can lift, and one berry — just one — which to us is a perfectly normal blueberry. Then we lay the great table and you EAT, and the whole town watches, delighted.",
  ],
  q_picnic_active: ['@We need the brunost slice (the keeper\'ll cut it small) and one moor berry. Then up to the great table to lay it all out. We are SO excited. Try not to be alarmed by how excited.'],
  q_picnic_brunost: ['(The keeper saws a sliver off a wheel of brunost the size of a wagon. To her it is a crumb; to you it is a respectable wedge of cheese. She wraps it like it is precious. It is.)'],
  q_picnic_berry: ['(You wrestle a single Dog-Sized Berry off the moor bush. The giants will consider this "a blueberry." You will consider it "lunch for a week." Both of you are correct.)'],
  q_picnic_set: ['(You climb the great table and lay out the tiny feast — the cheese, the berry, a thimble of cloudberry cordial the size of a bucket. It looks, at last, exactly right. Human-sized. Perfect.)'],
  q_picnic_full: ['@It\'s PERFECT. It\'s the right size and everything! (The Mayor is openly weeping, which on the town green is briefly a humidity event.) Sit, sit — eat — the whole town wants to watch!'],
  q_picnic_done_beat: [
    "(You eat a perfect little meal while forty-one giants kneel in a ring and beam down at you like you hung the moon. The Mayor presses an iron Troll Cross into your hands — protection, giant-forged, warm from his pocket.)",
    '* {rex} got the TROLL CROSS!',
  ],
  q_picnic_after: ['@Come back any time, small friends! We\'ll do it again — and NEXT time the fork will be the right size. We\'re ninety percent sure we know which drawer.'],

  /* ═══════════════ CHAPTER 5 — MINIMUS (the Grand Duchy) ═══════════════
   * §A11 voice: tiny-but-dignified, civic-proclamation register, everything is
   * PROCEDURE. Citizens are never in danger from you; YOU are faintly in danger
   * from THEM. Scale is the joke. Pippa's competence-not-magic; the mercy boss; the
   * two quiet joins. Never reveal chapter structure in UI (banners say MINIMUS MAJOR). */

  // — THE NEXT LEG: Bert offers the flight to Minimus (from Lucille's cabin) —
  bert_minimus_ask: [
    "@Norway's behind us and the locket's pulling somewhere... small. Bert squints at the chart. 'A whole grand duchy, it says here. And then under it, in tiny letters: to scale.'",
    "@Lucille's pointed at a place called MINIMUS. I'm told the entire kingdom fits on a card table and they are VERY proud of that. So whatever you do — try not to land on it. Say the word.",
  ],

  // — THE ARRIVAL: Lucille lands "in the duchy. All of it." —
  ch5_arrival: [
    '(Lucille comes down as soft as Bert can make her, and STILL the landing rattles teeth for a mile in every direction. The party look down. And down. And down.)',
    '(A whole kingdom is laid at their feet like a model railway: a cathedral the height of a thumb, ribbon streets, ten thousand windows the size of rice grains — and every single one of them is lit.)',
    '(A figure no bigger than a clothes-pin marches up the toe of {rex}\'s sneaker, plants its feet, and blows a whistle the size of a pinhead.)',
    "@HALT, COLOSSI. ...Please. (The smallest, most dignified voice anyone has ever heard.) You are very large, and we are very organized, and those two facts must be kept apart. Keep to the PROCESSION WAY and no one need be... redecorated. This way. Mind the cathedral.",
  ],

  // — THE BIG-LITTLE LENS: Milo's Ch.5 build (Sigrid's spare lens, ground small) —
  mn_lens: [
    "(The Hundred Engineers swarm the workshop bench like one many-handed creature. They take {milo}'s spare Norway lens — Sigrid's, ground for a giant's eye — and they grind it, and grind it, and grind it SMALL.)",
    "@(The Chief Engineer presents it on a velvet thimble.) The BIG-LITTLE LENS. Clip it to your Clicker, colossus. Now you see the small the way WE see it — and you can lend that seeing to your whole party. We call it Focus. Use it well. Use it gently.",
    "* {milo}'s SPY became the BIG-LITTLE LENS — party-wide FOCUS, and a travel-scale {pippa} can finally read.",
  ],
  mn_lens_done: ["@The Lens treating you well, colossus? Keep it clean. A smudge to you is a total eclipse to whatever you're looking at."],

  // — THE BIG-LITTLE GATE: a colossus only fits a thimble doorway once the Lens can fold the
  //   whole party down to duchy scale (gated on big_little_lens_built; the shrink is at the step) —
  duchy_door_too_big: [
    "(The door comes up to your shin. Even crouched, a colossus does not fit a thimble doorway — and forcing it would fold the dear little building flat.) You'd have to go SMALL to step in there. Properly, duchy-small. Not yet.",
  ],
  duchy_door_shrink: [
    '(You raise the BIG-LITTLE LENS. The duchy does not grow — YOU fold, smoothly and with enormous dignity, down and down, until the doorway is merely a doorway and you are merely a guest who remembered to wipe their feet.)',
    '* The Big-Little Lens folds the party to duchy scale — small enough to be welcome.',
  ],

  // — THE HEDGEROW: a scale set-piece read through the Lens (optional flavor) —
  hedgerow_lens: [
    '(A single privet leaf has fallen across the path like a footbridge. Through the Big-Little Lens its veins read like steel girders and its edge like a sheer green cliff.)',
    "@Mind the dewdrop. ({milo}, pointing at a bead of water the size of a beach ball.) To the locals that's a lake with a tragic history. To us it's a slip-and-fall. Single file, careful feet.",
  ],

  // — THE DUCAL CROWN: BOSS 5 (Whiskerzilla) intro —
  whiskerzilla_door: [
    '(The Hedgerow opens onto the Ducal Crown, and the smell arrives first: warm fur, and a great, great deal of it.)',
    "@...oh, no. ({pippa}, very small and very still.) That is a cat. That is just a lost cat. It found the warmest, highest, most important spot in the entire kingdom, and it went to SLEEP on it. We have to move it. We absolutely cannot move it. It is the size of a coastline.",
    "@So we don't beat it. ({milo}, reading the Lens.) We can't, and we shouldn't. We just have to make it lose interest — survive it, tire it out. And whatever else you do: when that tail starts to go, DEFEND. Everybody. Hard.",
  ],

  // — the four §A6 boss beats (bosses.ts phase scriptLines) —
  whisker_bell_ring: [
    "(High above the napping cat hangs the FLAT BELL, cracked and swinging, ringing a thin sour note. And while it rings, WHISKERZILLA blurs at the edges — hard to fix, hard to land.)",
    "@The bell! ({pippa}, pointing from {rex}'s shoulder.) While it rings we can't get the measure of the beast — it slips every blow. BREAK the Flat Bell first, and we'll see it true!",
  ],
  whisker_pounce: [
    "(WHISKERZILLA's tail begins, slowly, to wiggle. Every Whistle Guard within a mile screams the very same word at the very same instant:)",
    '@DEFEND! IT POUNCES! BRACE, COLOSSI — BRACE—! (And then the whole sky is paw.)',
  ],
  whisker_purr: [
    '(The Flat Bell cracks clean through and falls silent. Denied its ringing veil, WHISKERZILLA settles — and begins, enormously, to PURR.)',
    '(And the purr gives it all away: every gather, every twitch of muscle telegraphed a mile off. You can read the great beast now, plain as a picture book.)',
  ],
  whisker_bored: [
    '(WHISKERZILLA stops, one paw raised. It regards you with the vast, bottomless indifference only a cat can summon. It decides — visibly, conclusively — that you are furniture. Not even interesting furniture.)',
    '(It yawns. The yawn has WEATHER in it. Then it turns three times, tucks its nose under its tail, and goes back to sleep on the crown jewel as though you were never there at all.)',
  ],

  // — the WIN (post-battle): the Duchess knights the cat (the §A6 mercy ending) —
  whiskerzilla_win: [
    "(You did not defeat WHISKERZILLA. Nothing so rude. You were DISMISSED — which, from a cat, is functionally the same as a blessing.)",
    '@QUICK — Your Grace, while it sleeps! ({pippa}, breathless.)',
    "(The Grand Duchess steps to the very lip of the dais, draws a needle-sword the length of an eyelash, and dubs the enormous drowsy cat upon its colossal nose.)",
    "@Arise, SIR Whiskers — Knight-Protector of the Crown, and its monument henceforth. ...Good kitty. STAY. (The cat, knighted, purrs in its sleep. The crisis is now, officially, a landmark.)",
  ],
  ducal_crown_early: [
    "(The Crown hums faint and high and waiting — but it will not sing with a kaiju asleep on top of it. First things first. First, the cat.)",
  ],

  // — HEARTLIGHT 5: The Bell Choir (Ember 5) —
  ember5_get: [
    '(With Sir Whiskers knighted and dozing — officially a monument now, and therefore allowed — the Ducal Crown is free at last to sing. And it does: high and bright, a peal of a hundred tiny bells all at once.)',
    '(The Locket answers. A fifth voice drops in over the others, the highest yet — a silver thread laid across the deep Norway hum. THE BELL CHOIR.)',
    '{rex} held up the Star Locket!',
    '* The fifth EMBER settled in. The Heartlight rings in five parts now — and the newest part is a whole tiny kingdom, ringing its heart out for you.',
  ],

  // — THE TWO JOINS: Pippa appointed Foreign Minister; Dorin revealed —
  pippa_join: [
    "@(The Grand Duchess pitches her voice to fill the square, which at her scale means merely that she is audible.) For service to the Crown — and for being LARGE about it in all the correct ways — Minimus appoints {pippa} QUILL its Foreign Minister of Being Taken Seriously.",
    "@Go with the colossi, Minister. See that the big world takes small things seriously, for once. Here — the ROYAL THIMBLE. Press it close and it brings you UP to their scale, and holds you there steady, out where everything is the wrong size and proud of it.",
    "@({pippa} presses the ROYAL THIMBLE to her chest and RISES — lapel-pin to colossus, smooth as a drawn breath — until she stands shoulder to shoulder with the party. She does not wobble, because a minister does not wobble.) ...Right. Where are we colossally going next?",
    '* {pippa} joined the party — the ROYAL THIMBLE holds her at travel scale.',
  ],
  dorin_join: [
    '(There is a kid sitting on the duchy wall, swinging his feet over a drop that is, to him, nothing at all. Travel-worn gi. Prayer beads. A half-eaten something. He has been a step ahead of you since the Sleeper\'s hand in Norway, and he has never once offered his name.)',
    "@You move loud. (He doesn't get up.) Whole kingdom of small, careful people — and you came through it like weather. But you came through it CAREFUL. I watched. You kept the cat from stepping on anyone. That counts.",
    "@{dorin}. I'm headed the same way you are — there's a mountain at the far end of all this with my name already carved on it. No sense walking it alone. Might as well walk it loud.",
    '* {dorin} joined the party.',
  ],

  // — the §A6 chapter card (ch5_complete) —
  ch5_card: [
    'Minimus rings its own bells again, and a knighted housecat sleeps on the crown jewel where the whole duchy can keep a fond eye on it. The citizens were never once in danger from you. You were, very faintly, the entire time, in danger from THEM. Procedure won.',
    'The Locket hums with FIVE voices now, and the newest is a whole tiny kingdom that takes itself completely seriously. Five Embers are still out there.',
    "* (Two new faces walk with you now: a minister the size of a clothes-pin, and a quiet kid in a gi who keeps a step ahead. Lucille is fuelled when you are. Bert says the next leg is 'somewhere that LAUGHS at you,' and will not explain further.)",
  ],

  // — MINIMUS MAJOR NPCs (one obsession each, §A11) —
  npc_mn_pippa: [
    "@{pippa} Quill — royal census cadet, page to Her Grace. No — up HERE. On the matchbox. I am not a lapel pin. I am a CIVIL SERVANT. The distinction matters enormously to me and to no one else.",
    "@You are the single largest diplomatic incident in the recorded history of the duchy, and I have decided to manage you personally. Stay on the Way. Do not sneeze near the cathedral. If anyone asks, you are WITH ME.",
  ],
  npc_mn_duchess: [
    "@(She is the size of a chess queen and twice as composed.) Grand Duchess Millimetta the First, of Minimus. The Ember made us small. The Crown has decided this was a PROMOTION. Rent, you understand, has never been cheaper.",
    "@You walk carefully, for colossi — and the Whistle Guards speak well of you, which they NEVER do. Help us with our small troubles, and Minimus will remember you fondly, and at your full and frankly excessive size.",
  ],
  npc_mn_engineer: [
    "@Chief Engineer of the Hundred. We grind lenses, mostly — and we hear you carry a spare. A Norway lens, ground for a giant's eye? In our hands it becomes the BIG-LITTLE LENS, and your sharp-eyed friend could see the truly small with it. Properly. At last. Bring it to the bench.",
    "@And — your arrival cracked a few things. A bridge. A well. A scaffold. Footsteps the size of weather will do that. If you've a careful hour to spare, the works pool would be grateful past saying.",
  ],
  npc_mn_census: [
    "@The Royal Census. One hundred citizens, every one to be counted and NAMED. The trouble is twofold: they will not stand still, and each one insists it has already been counted — by a cousin — last Tuesday. None of them have.",
    "@Every tiny person has a name. I should like them all written down before — well. Before anything large happens. Will you help me count? You can see over the rooftops. It's a tremendous advantage.",
  ],
  npc_mn_provisioner: [
    "@The Ducal Provisioner, at your colossal service! Everything sold by the GROSS, naturally — to you a single crumb, to us a fortnight of good bread. Mind the shelf, would you. You breathe on it and it's an avalanche.",
  ],
  npc_mn_lostfound: [
    "@Lost & Found of Impossible Sizes. You would not BELIEVE what surfaces when a kingdom shrinks and the rest of the world declines to. A button the size of a tower shield. A spoon that is a tuning fork somewhere east. It all has to go back — correctly. The Minister drafts a treaty for each one. She's thorough.",
  ],
  npc_mn_bellkeeper: [
    "@Forty quiet days. The shrink flung the bell choir's clappers to the four corners of the duchy, and we have not heard our own bells since the coronation. A duchy that cannot ring is only a very small argument with itself. Help me make it sing again?",
  ],

  // — THE PROCESSION WAY NPCs —
  npc_pw_click: [
    "@Mr. Click — macro-lens portraiture! I photograph the small at the size it DESERVES, which is to say enormous. I should very much like the Minister's portrait. Hold still — you'll be in the frame whether you fit or not. You're frightfully hard to miss.",
  ],
  npc_pw_guard: [
    "@Keep to the Way, colossus. By the book. (He consults a book the size of a postage stamp.) Page one: do not step off the Way. Page two: see page one. We Whistle Guards wrote it ourselves, over a weekend. We are very proud of page two.",
  ],

  // — SIGNS (the duchy's foreign-but-readable heraldic hand) —
  sign_minimus_major: ['(A signpost the height of a candle, lettered in a fine heraldic hand:) MINIMUS MAJOR — Capital of the Grand Duchy. Pop. 100 (provisional, pending census). Kindly walk on the PROCESSION WAY. Thank you for being careful. — the Crown'],
  sign_procession_gate: ['(An arch the size of a croquet hoop.) THE PROCESSION WAY begins here. Colossi: this way, and only this way. Everyone else: mind the colossi.'],
  sign_ducal_court: ["(A velvet rope no thicker than a thread.) THE DUCAL COURT. Her Grace receives visitors of all sizes. Kneeling is optional and, frankly, doesn't help — you'll still be enormous."],
  sign_procession_way: ['(A milestone the size of a thimble.) THE PROCESSION WAY · Minimus Major (W) · the Hedgerow (E). Stay between the kerbs. The kerbs are load-bearing. To us.'],
  sign_hedgerow_mouth: ['(A trail marker, hand-lettered, leaning.) THE HEDGEROW — a garden hedge to you; a forest to us. Mind the topiary. It minds you back. The Ducal Crown lies beyond the green.'],
  sign_the_hedgerow: ['(Carved into a single privet leaf the size of a door:) YOU ARE HERE. (And smaller, beneath:) So is everything else. Keep north and keep your feet.'],
  sign_ducal_crown: ['(A plaque of beaten gold leaf, knee-high.) THE DUCAL CROWN — crown jewel of Minimus, holiest site of the realm. PLEASE DO NOT WAKE THE— (the rest of the plaque is hidden beneath an enormous, sleeping paw.)'],

  // — THE DUCAL PROVISIONER (shop, §A11) —
  shop_minimus_greet: ['@The Ducal Provisioner welcomes the colossi! Everything in stock, everything tiny, everything — to you — a positive bargain. Point gently, and point ONCE.'],
  shop_minimus_bye: ['@Mind the doorway on your way out. To you it is ankle height. To us it represents a generation of structural engineering. Walk careful, big friend.'],

  // — the "Say Cheese, Minister" pickup (active-quest flavor) —
  q_say_cheese: ["@HOLD it — right there, don't move! (Mr. Click, diving under his black cloth.) Minister {pippa} on the thimble, chin UP; Her Grace's portrait behind; and you colossi in the frame whether you fit or not. Three — two — SAY CHEESE! (FLASH.)"],

  /* ════════════════ CHAPTER 6 — THE RUINS THAT LAUGH (Africa) ════════════════ */

  // — the §A5 next leg: Bert flies the party south to Zanzibel (ch5_complete gate) —
  bert_africa_ask: [
    "@The locket's humming a market tune now — all bright and crowded and a little bit cracked, like a song someone's still telling a joke over. Bert traces the chart south. 'ZANZIBEL. Bazaar port. Best music on the whole map, they say. And past it...'",
    '@...past it the chart just says THE RUINS THAT LAUGH, and then in the margin, in a different hand: "do not laugh back." Lucille\'s pointed dead at it. Say the word and we go.',
  ],

  // — the §A6 arrival: Lucille noses down at the Zanzibel quay —
  ch6_arrival: [
    '(Lucille settles onto the quay in a swirl of red dust and the smell of cardamom, salt, and a hundred things frying at once. ZANZIBEL goes up the hill in front of you in stacked ochre and indigo, and every inch of it is SINGING.)',
    "@Now THIS is a place that knows how to make a racket. ({milo}, delighted, already three stalls deep.) Listen to it. Whole city's playing one big song and nobody told it to.",
    "@Then somewhere up past the rooftops a SECOND song answers — flatter, older, one beat behind. {pippa} hears it too, and stops smiling. \"...That one,\" she says, \"is coming from the ruins.\"",
  ],

  // — Zanzibel signs —
  sign_zanzibel: ['(A painted board over the customs gate, lettered in three alphabets and a lot of confidence:) ZANZIBEL — Bazaar Port of the Gold Coast. Buy anything. Sell anything. Believe HALF of it. Welcome, traveller — mind your purse and your manners.'],
  sign_savanna_gate: ['(A weathered marker at the east gate, an arrow burned into it pointing inland:) ↑ THE SAVANNA RUN — the caravan track. Water at the third baobab. Beyond that, the LAUGHING RUINS. Travellers are advised to travel in company, and in daylight, and quietly.'],
  sign_zanzibel_court: ['(A cool stone bench under an awning, a brass plate set into it:) THE MARKET COURT — by grace of the Trade Council. Disputes settled here Tuesdays. All other days, settled LOUDLY, by everyone.'],

  // — Zanzibel NPCs —
  npc_zn_queen: [
    '@Welcome, welcome, big spenders! I am the Market Queen — no crown, no throne, just the longest memory and the best scales in Zanzibel. Everything has a price. Some of it even has MY price.',
    "@You want the grand market shelf? Point and pay. You want the OTHER thing — the ruins, the laughing — that's not a thing I sell. That's a thing the city would rather you bought somewhere else.",
  ],
  npc_zn_dockmaster: [
    "@Dockmaster. I count what comes off the boats and frets about what goes up the Run. And right now I'm fretting about the CONVOY — out at the watering hole, behind schedule, and the hyenas have learned the timetable better than my drivers have.",
    '@Caravan that size, the desert eats it for a snack and picks its teeth with the axles. If big folk like you happened to walk that way... a Dockmaster remembers a kindness. Loudly, and to everyone.',
  ],
  npc_zn_guide: [
    "@You feel it, don't you. That second song. — I'm the one they send people to when they've felt it and can't unfeel it. I guide folk up to the LAUGHING RUINS. Most of them I guide right back DOWN again, quieter.",
    "@The stones up there say your own words back to you. One beat late. Tell a joke, they laugh. Scream, they... well. Some of us think the stones are still trying to FINISH a conversation somebody started a very long time ago.",
  ],
  npc_zn_healer: [
    '@Sit. Drink. The well is baobab-sweet and the shade is free, which in Zanzibel makes it the only honest deal in town. You look like people walking toward the ruins. People do that. The well will still be here when you walk back.',
  ],

  // — the §A8 Ch.6 shop (the Grand Market shelf) —
  shop_zanzibel_greet: ['@The Market Queen spreads her hands over the whole glorious shelf! Salt, charms, cloth, courage in a cup — all genuine, all today only, all a STEAL. (Everything in Zanzibel is, today only, a steal.)'],
  shop_zanzibel_bye: ['@Pleasure doing business, big friend! Tell them the Market Queen sent you. Tell them LOUDLY. It is good for the brand.'],

  // — Savanna Run signs —
  sign_savanna_run: ['(A leaning post on the track, hung with a dry gourd that rattles in the wind:) THE SAVANNA RUN. Keep to the track. The grass keeps things. Some of the things keep teeth.'],
  sign_ruins_mouth: ['(Two toppled pillars frame the way ahead; someone has scratched a warning into the left one:) THE LAUGHING RUINS — ahead. They are only stones. (Below, in a shakier hand:) they are NOT only stones.'],

  // — the Laughing Ruins (dungeon) sign —
  sign_laughing_ruins: ['(A fallen lintel, its carved faces all mid-laugh, worn nearly smooth:) HERE THE CITY THAT LAUGHED. It does not say what the joke was. The longer you look at the faces, the less it seems like laughing.'],

  // — the Sphinx's chin sign —
  sign_sphinx_chin: ["(A step worn into a great carved JAW, an inscription along the lip:) ASK, AND BE ASKED. ANSWER TRUE AND PASS. ANSWER FALSE AND— (the rest is lost where the stone has laughed itself away.)"],

  // — §A6 BOSS 6 — the Laughing Sphinx riddle fight (BattleScene reads these) —
  sphinx_riddle_intro: [
    '(The whole chin shifts. Dust pours from a mouth the size of a doorway, and the LAUGHING SPHINX opens one ancient eye, then the other, and looks — actually LOOKS — at you.)',
    '@"Visitors. How wonderful. It has been so long since anyone got the joke." Its voice is warm, and enormous, and not entirely kind. "We will play the old game. I ask. You answer. Answer TRUE, and I shall be so tickled I forget myself. Answer FALSE..."',
    '@"...and I am afraid you will find my laughter terribly catching. Now. Listen carefully."',
  ],
  sphinx_right: ['(The Sphinx throws back its vast head and ROARS with delight — a laugh so genuine it staggers itself, helpless, off the dais. For three whole turns it can only shake.)', "@\"OH — oh, that's GOOD — that's the right one, you clever, clever small thing—!\""],
  sphinx_wrong: ['(The Sphinx tuts, almost gently — and then it LAUGHS, and the laugh gets into everyone. The whole party doubles over, helpless, crying with a mirth that is not theirs.)', '@"No, no. But what a lovely try. Here — laugh it off with me. Laugh it ALL off."'],

  // — the boss-trigger approach + the win (OverworldScene laughingSphinxBossScene) —
  laughing_sphinx_door: ["(The climb ends in a carved jaw bigger than a house. Something inside it is breathing, slow and amused, and the breath smells of a thousand dry years. {pippa} swallows. \"It's awake,\" she says. \"It's been awake the whole time. It was just... waiting to be asked.\")"],
  laughing_sphinx_win: [
    '(The Sphinx runs clean out of riddles. It regards you for a long moment — and then it does the last thing you expect. It looks RELIEVED.)',
    '@"Answered. After all this time. Do you know how long it is, holding a question with no one to ask?" It settles back into its own chin with a sigh like a landslide. "Go on, then. The chord is yours. You earned it honestly. That is the rarest way to earn anything."',
  ],
  sphinx_chin_early: ['(The carved chin hums, but it will not sing — not yet. The Sphinx is still curled in it, one eye open, waiting for its game. The resonance keeps its peace until the old question is answered.)'],

  // — HEARTLIGHT 6 — THE LAUGHING CHORD (Ember 6) —
  ember6_get: [
    "(The chin SINGS. Not the flat one-beat-late echo — the real thing, at last: a great warm laughing CHORD that rolls down out of the ruins and over Zanzibel, and for one moment the dead city and the living one are singing the SAME song.)",
    '@Heartlight 6. ({faye}, very quietly.) The Laughing Chord. ...It was never laughing AT anyone, {rex}. It was laughing because it remembered how. The locket has it now. The song is most of the way home.',
  ],
  // — the §A6 chapter card (ch6_complete) —
  ch6_card: [
    'The Laughing Ruins laugh in tune now, and far below, Zanzibel hears its old sister singing back and does not feel quite so alone in the noise it makes. Somewhere a Sphinx sleeps easy, its question finally answered. You go down the hill toward the boats with a chord in the locket and the strangest feeling that the world just got one joke closer to remembering the whole song.',
    '* CHAPTER 6 — THE RUINS THAT LAUGH — complete. Six embers carried. Four to go.',
  ],

};

/**
 * The tokens BattleScene.fill() resolves IN ADDITION to the dialogue vars
 * (battle lines run through fill() and then vars()): {user} = acting hero,
 * {e} = enemy w/ article+letter, {t} = target name. The S5 validator sweeps
 * every battle-rendered string (BATTLE_TEXT, ability/move text, PRAY_TEXT,
 * death lines) against this set ∪ the TEXT_VARS table.
 */
export const BATTLE_FILL_TOKENS = ['user', 'e', 't'] as const;

/** battle text fragments (§A11.5 — classic second person) */
export const BATTLE_TEXT = {
  bash: '{user} swung true!',
  bashMiss: '{user} swung with great conviction at the air!',
  smaaash: 'SMAAAASH!!',
  guard: '{user} braced for it!',
  run_ok: 'You escaped! (Dignity intact. Mostly.)',
  run_fail: "Couldn't get away!",
  latch_drain: 'The Tick drinks. The number keeps falling—',
  salt_break: 'The salt hit the seam! The Titanic Tick HISSED and let go!',
  glint_assist: 'Glint flared like a tiny sun! The Tick flinched!',
  // ADR-121: super-Glint carrying the Sentinel fight — a real sun, not a flicker
  glint_supernova: 'GLINT BLAZED — a whole summer of light in one bug! The Sentinel reeled!',
  // ADR-121: Glint GUARDS — the full-power blow that would have ended {t} is caught
  glint_guard: "The Sentinel's blow would have FLATTENED {t} — but Glint threw himself in front of it!",
  chad_hide: 'Chad is supervising from a safe distance!',
  chad_poke: 'Chad poked it with a stick! It barely noticed!',
  win: 'YOU WON!',
  // §A7 LOOT (S18 M24, ADR-094): an identity drop lands in the bag, EB-style;
  // if every bag is full, the drop is left where it fell (never a wall)
  enemy_drop: '{e} left behind {t}!',
  enemy_drop_full: "The {t} dropped — but everyone's hands were full. It stays on the ground.",
  // S2: Mia's first Pray, tutorialized in the Manager fight (§A11.4 — warm)
  pray_hint: "({user}'s hands are already together. PRAY is on her menu — it costs nothing, and it always does SOMETHING.)",
  spark_revive: 'The spark flares — warm as a porch light in late summer. {t} got back up!',
  // S4: Homesick (§A4.4) — he skips the turn dreaming of Mom's cooking
  homesick_skip: '{user} is a thousand miles away, thinking about {favoritefood}...',
  homesick_got: '* ...{user} went quiet. (HOMESICK! He misses {favoritefood}. Mom would know what to say.)',
  // S11: the §A4.8 status set, live in battle and legible on the cards
  asleep_skip: '{user} is fast asleep. The battle waits for nobody.',
  wake_up: '{user} woke up!',
  paralyzed_skip: "{user}'s legs filed a formal complaint! Can't move!",
  crying_miss: '{user} swung through the tears... and missed!',
  hushed_no_vibe: '{user} reached for the old light... but the words came out flat. (HUSHED)',
  enemy_asleep: '{e} is fast asleep. Sweet dreams, weirdo.',
  enemy_woke: '{e} woke up!',
  enemy_crying_miss: '{e} is crying too hard to aim!',
  crying_dry: '{user} dried their eyes.',
  paralyzed_off: '{user} can move again!',
  hushed_off: "{user}'s voice came back!",
  shield_off: "{user}'s shimmer faded away.",
  // S16: the layered ward system + the control/buff statuses (§A3 amended).
  // Each new status prints when it LANDS, when it ACTS, and when it WEARS OFF.
  ward_on: '{user} is wrapped in a cool elemental veil!',
  ward_off: "{user}'s veil thinned out.",
  reflect_on: '{user} stands behind an answering mirror!',
  reflect_off: "{user}'s mirror went quiet.",
  reflect_back: "The blow came straight back! {e} took {t}!",
  bulwark: '{user} is double-guarded — shield AND ward holding!',
  steeled_on: '{user} set their jaw. (STEELED — Guts up!)',
  steeled_off: '{user} eases off the brace.',
  steeled_survive: '{user} was STEELED — and would not go down!',
  // Dorin's MARTIAL STANCES (§4): braced = +Defense + a physical counter;
  // flowing = +Speed + a dodge window. Each prints when it lands, acts, and fades.
  braced_on: '{user} sank into Stone Brow Stance. (BRACED — Defense up, ready to answer.)',
  braced_off: '{user} let the mountain go.',
  braced_counter: 'Patience is also a fist — the blow came straight back! {e} took {t}!',
  flowing_on: '{user} flowed into Flowing Step. (FLOWING — Speed up, hard to touch.)',
  flowing_off: "{user}'s step settled.",
  flowing_dodge: '{t} flowed around it — like water around a stone!',
  revive_all: 'The old word reached everyone. Nobody at this table stays down — the party rose, breathing!',
  // MIND WARP (status 'puppet'): the borrowed voice fights for you
  puppet_on: '{e} went slack... then turned on its own side!',
  puppet_resist: "{e}'s mind slipped out of {user}'s grip!",
  puppet_immune: "{e}'s mind is too vast and cold to hold.",
  puppet_act: '{e} (turned!) lashed out at its own!',
  puppet_nobody: '{e} (turned!) swung at empty air — its allies are gone.',
  puppet_off: "{e} shook its head clear — the borrowed voice slipped free.",
  puppet_refund: 'The borrowed voice did its work — a little of the old light flowed back to {user}.',
  // S14: the phase machine's table reads (Prompt 15) + the §A7 Ch.2 mechanics
  boss_stunned: '{e} is reeling! It loses the turn!',
  gold_clang: 'The swing CLANGED off solid gold! Not even a dent!',
  hollow_slide: 'The Vibe poured into the hollow... and found NOTHING to catch it!',
  gold_crack: 'The frost found the seams! The gold went BRITTLE!',
  beetle_clang: 'It bounced right off the gilding! So shiny. So rude.',
  // §A6 Ch.4 — the Whisperwig's untargetable-until-noise gimmick (BattleScene.noiseOut)
  boss_burrowed: "It's burrowed too deep to reach! You need NOISE — Volt, a Firecracker String, a Bottle Rocket!",
  noise_out: 'The NOISE flushed it out into the open!',
  beetle_dull: "{e}'s gilding wore thin. Underneath: beetle.",
  parrot_lint: '{e} came up with pocket lint and one expired coupon!',
  parrot_take: '{t} GONE! (Beat it before it flies the coop!)',
  parrot_drop: 'It dropped the goods! {t} recovered!',
  mercy_end: 'The light settled, soft as a porch lamp. The fight just... ended.',
  // §A6 boss "whole-party" status — one line per status the phase machine can
  // inflict (PhaseEffects.partyStatus); BattleScene selects by status, falling
  // back to the crying line. Printed raw (no {user}/{e} tokens).
  party_status_crying: 'Everyone welled up at once! (CRYING)',
  party_status_asleep: 'The whole party nodded off where they stood! (ASLEEP)',
  party_status_paralyzed: "Everyone's nerves seized at once! (PARALYZED)",
  party_status_sunburn: 'The whole party caught the glare at once! (SUNBURN)',
  party_status_hushed: 'Every voice went flat at once. (HUSHED)',
  feast_revive: "The Feast Basket's warmth answers! Nobody stays down at THIS table!",
  spy_report: '{e} — about {t} HP left.',
  spy_weak: 'Weak point, circled twice: {t}.',
  spy_no_weak: 'Notes: sturdy, rude, no obvious weak point.',
  magnet_sip: '{user} sipped {t} PP right out of the air!',
  // S-Mia ("Ability Expansion"): her new statuses each print when they LAND,
  // ACT, and WEAR OFF (the §A11.5 second person, kind and a little wry).
  lifedrain: 'The spark and the warmth came home — {t} HP to {user}!',
  burn_on: '{e} caught — it\'s smoldering now! (BURN)',
  burn_tick: 'The burn gnaws at {e}.',
  burn_off: '{e}\'s flames guttered out.',
  frozen_on: '{e} froze solid — it\'ll lose its next move! (FROZEN)',
  frozen_skip: '{e} is frozen stiff. It can\'t move!',
  frozen_shrug: '{e} shook the frost off before it set.',
  control_capped: '{e} is too vast to lock down — the chill just washes over it.',
  enemy_paralyzed_on: '{e}\'s nerves jangled — it\'s twitching! (PARALYZED)',
  enemy_paralyzed_skip: '{e} seized up mid-move!',
  enemy_paralyzed_off: '{e} stopped twitching.',
  lucky_on: '{t} feels the luck turn their way! (LUCKY — crit & dodge up)',
  lucky_off: 'The first star set; {user}\'s luck eased back to normal.',
  exposed_on: '{e}\'s hollow is named and open — it\'ll take MORE now. (EXPOSED)',
  exposed_off: '{e} closed back up.',
  revive_word: 'The old word landed. {t} got back up!',
  no_fallen: 'Everyone is still standing. The old word keeps.',
  cure_clean: '{t} feels scrubbed clean!',
  cure_nothing: '{t} was already fine. Now they are VERY fine.',
  // PIPPA — "The Page's Full Brief" (S15h+): her tactical statuses, in voice —
  // precise, diplomatic, furious when called adorable. Battle lines read like
  // the minutes of a meeting. Each prints when it LANDS, ACTS, and WEARS OFF.
  marked_on: '{e} is marked. The party will not miss it. (MARKED)',
  marked_off: "{e} slipped the mark. Noted for the record.",
  rally_on: '{t} stands quick and lucky! (RALLY — Speed & Luck up)',
  rally_off: "{t}'s rally settled back to a dignified calm.",
  focus_on: "{t} found the big-little focus — the next swing can't miss!",
  minutes_on: '{t}: record corrected. Cleansed, and the next swing lands true.',
  focus_off: "{t}'s focus eased off.",
  evasion_on: '{t} stepped to thimble-scale — and left a decoy standing!',
  evasion_off: '{t} stepped back up to size.',
  evasion_dodge: '{t} was simply not where the blow expected. How embarrassing for it.',
  decoy_miss: 'The hit clobbered the decoy! {t} was never there.',
  guarded_on: '{t} is under diplomatic immunity. One hit will be... declined.',
  guarded_negate: '{user} stepped in front of {t} — "I will be taking that one." Declined!',
  rattled_on: '{e} went small and sorry. Its nerve is shaken. (RATTLED)',
  rattled_off: '{e} straightened its tie and remembered itself.',
  rattled_skip: '{e} is too cowed by the decree to act!',
  morale_on: '{user} rang the bellwether — the next prayer and heal will carry!',
  morale_pray: 'The bellwether carried — the prayer rings one note brighter!',
  morale_heal: "The bellwether carried — {user}'s mending went further than it should have!",
};
