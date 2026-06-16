/**
 * Chapter 1 dialogue — GAME_BIBLE §A11 voice rules:
 * absurdism everywhere, sincerity is never the joke, signs editorialize,
 * every NPC has exactly one weird obsession.
 * Every {token} below must be one src/ui/text.ts resolves — `npm run
 * validate` sweeps for typos (S5). Types z.infer'd from src/schemas.
 */
import type { DialogueScript } from '../schemas';
import { CITYLIFE_DIALOGUE } from './citylife_text';

export const DIALOGUE: Record<string, DialogueScript> = {
  // S18 — the occupyCity pass's voice pools (knock-knock + resident/keeper/civic)
  ...CITYLIFE_DIALOGUE,
  /* ═══════════════ CHAPTER 3 — ENGLAND (S18, ADR-095, Half 1) ═══════════════
   * §A11 voice: damp-Tyne stone + institution-fear, one obsession per soul,
   * sincerity never the joke. The machine-fog is the chapter's dread — kept
   * plain, never funny. Flair is rare (≤1 warm glyph, only where earned) and
   * never on the shop's buy/sell surface (§A11.9 discipline). The story beats
   * (Milo's join, the Borrow, the boss) land in the story half. */
  // — LUCILLE, the flight in (the §A6 arrival cutscene stages here later) —
  npc_bert_air: [
    "@Mind your boots on the wickerwork — that's a LADY you're standing in. Lucille, say hello.",
    '@She crossed the North Sea on spite and one good magneto. Don\'t thank me, thank her.',
    '@Fog like soup down there. Machine-made, if you ask a man who reads weather for a living. {g:cloud}',
  ],
  sign_lucille_placard: [
    'A brass placard, lovingly over-polished: "LUCILLE — built 1928, retired never."',
    '(Below, in Uncle Bert\'s hand: "If you can read this, you are too close to the propeller.")',
  ],
  // — FOGGYBOTTOM-ON-TYNE — townsfolk, one obsession each —
  npc_fb_chemist: [
    "@Welcome to Boothe's. Cures on the left, biscuits on the right, and the TEA — well, the tea is the whole argument.",
    "@Builder's for the nerves, Earl Grey for the posture, cocoa for the truly defeated. I'll not be told otherwise.",
  ],
  npc_fb_fishmonger: [
    "@River's wrong today. Flat as a school photo. She's never flat, the Tyne — somebody's gone and TAKEN her ripples.",
    '@Up at that school, I shouldn\'t wonder. Everything goes quiet up that hill, and quiet costs.',
  ],
  npc_fb_post: [
    '@Don\'t post anything in the red box on the corner. It reads them. It GRADES them.',
    '@Gave my sister\'s Christmas card a C-minus and "shows little effort." She cried for a week.',
  ],
  npc_fb_boy: [
    '@The fog tastes of pennies now. It never used to taste of anything at all.',
    "@Me mam says don't lick the fog. But how's she know it's pennies, if she's never licked it?",
  ],
  sign_foggybottom: [
    'FOGGYBOTTOM-ON-TYNE — twinned with nowhere, on account of the fog.',
    '(Someone has scratched out the weather box and written, simply, "YES.")',
  ],
  sign_fog_road: [
    'THE FOG ROAD — up the hill to Wintermoor Academy, the Old Stones, and worse weather.',
    '(A newer sign bolted over the old: "ACADEMY GROUNDS — PROSPECTIVE PUPILS ONLY. BE PUNCTUAL.")',
  ],
  sign_quay: [
    'THE QUAY — water steps slippery. The Tyne is colder than it looks, and it looks freezing.',
  ],
  // the chemist's shop surface (no flair here — §A11.9 menu/shop discipline)
  shop_fb_chemist_greet: ["@Boothe's Chemist & Teas. Pick your poison — most of mine are the cure."],
  shop_fb_chemist_bye: ['@Mind the fog. And steep it properly, for pity\'s sake.'],

  // — THE FOG ROAD (the moor) —
  npc_moor_rambler: [
    '@Public footpath, this. Has been since before the school, before the Romans, before the FOG.',
    '@I walk it every day to prove a point. The point is: you cannot fence a moor. They keep trying.',
  ],
  sign_moor: [
    'THE FOG ROAD — Wintermoor Academy this way. Mind the sheep. The sheep mind nothing.',
    '(A walker\'s note, pinned and rain-curled: "the hound is not a dog. do not whistle for it.")',
  ],
  // — WINTERMOOR ACADEMY (the grounds) —
  npc_wm_porter: [
    "@Name, house, and reason for being late. You're ALL late. Everyone is late now — it's school policy.",
    '@Can\'t let you past the lodge without a slip. The Headmaster issues the slips. The Headmaster is... busy.',
  ],
  npc_wm_groundskeeper: [
    "@Forty years I've kept these grounds. Then the machine started making its own weather and the roses gave UP.",
    "@Can't think straight without a proper brew — and my thermos's gone cold as the fog. Cold tea's no tea at all.",
  ],
  npc_wm_student: [
    '@We don\'t have lessons any more. We have OPTIMISATION. The bell rings and we feel improved. I think.',
    "@I used to like Tuesdays. The mainframe optimised Tuesdays. Now there's just... more Monday.",
  ],
  // the First XI captain — stuck at the crease (the sincere "Last Over" giver)
  npc_cricket_captain: [
    "@(He's settled at the crease like he grew there.) Three weeks into this over, us. Nobody's out. Nobody CAN be.",
    "@I've started learning the names of individual blades of grass. That one's Geoffrey. We don't talk about Geoffrey.",
  ],
  sign_wintermoor_gate: [
    'WINTERMOOR ACADEMY — "We Shape the Whole Child." (Est. 1874. Optimised 13 weeks ago.)',
    '(A newer brass plate, screwed in crooked: "HAPPINESS IS COMPULSORY AND MEASURED HOURLY.")',
  ],
  sign_cricket_pitch: [
    'THE FIRST XI NETS — practice is now CONTINUOUS, by order of the timetable.',
    '(Eleven small caps wait in a row on the bench. None of them is allowed to stop.)',
  ],
  // — THE OLD STONES (the Resonance Site; the locket scene lands in the story half) —
  sign_old_stones: [
    'THE OLD STONES — older than the school, older than the fog, older than asking why.',
    '(Stand in the middle and they hum, very faintly. Something in your pocket hums back.)',
  ],
  // — WINTERMOOR ACADEMY (the dungeon: the hall, the library, the dorm, the boiler) —
  npc_wm_tuck: [
    "@Tuck shop's RATIONED now. The mainframe decided sweets were 'sub-optimal for cohort morale.'",
    '@Black-market cocoa under the counter, mind — and bits and bobs a clever lad could make something of.',
  ],
  shop_wintermoor_tuck_greet: ["@Tuck shop. What the Headmaster doesn't optimise, you can still buy. Quietly."],
  shop_wintermoor_tuck_bye: ["@Off you pop. And you didn't get the cocoa from me."],
  npc_wm_librarian: [
    '@Three of my books walked out in the arms of pupils who don\'t blink any more. THREE.',
    '@Bring them back and I\'ll issue you a Library Card — free tea refills for life. The highest honour I have to give.',
  ],
  npc_dorm_student: [
    "@(whispering) Don't let the prefects see you. They don't argue any more. They just... MARK you.",
    '@I keep a diary so I remember being me. The mainframe keeps editing it. Yesterday it gave me an A.',
  ],
  // Mr. Stumps, the umpire filed ABSENT — his base line (the quest step is q_over_umpire)
  npc_wm_umpire: [
    '@(An old man in a white coat, very still, a tea going cold in his hands.) ...Is it time? No? Right. As you were.',
    '(He has been "as you were" for thirteen weeks. He does not appear to mind. That is the saddest part.)',
  ],
  sign_wm_hall: ['WINTERMOOR GREAT HALL — Honours Board. (Every name has been replaced with a PRODUCTIVITY SCORE.)'],
  sign_wm_library: ['THE LIBRARY — SILENCE. (The sign is new. The silence is newer, and it is total.)'],
  sign_wm_f2: ['FLOOR 2 — FORM ROOMS. Timetable amended (again): all periods are now THIS period.'],
  sign_wm_office: ["THE HEADMASTER'S OFFICE — by appointment only. (The door is warm. Something behind it runs very hot.)"],
  sign_wm_exam: ['EXAMINATION IN PROGRESS — silence, no talking, eyes front. (There is no exam. There is only the watching.)'],
  sign_wm_dorm: ['DORMITORY — LIGHTS OUT IS COMPULSORY AND PERMANENT. Prefects patrol. Do not be seen out of bed.'],
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
    "@FOGGYBOTTOM-ON-TYNE. End of one line, start of another. Mind the water steps going down — slick as a politician.",
    '(Lucille bumps onto the quay and the hatch drops. England comes in on the air: coal smoke, low tide, and — underneath, faint, wrong — the warm-dust smell of something electric left running far too long.)',
  ],

  // — WINTERMOOR GROUNDS: MILO'S CRASH + JOIN (the party becomes THREE) —
  wm_arrival_porter: [
    "(A porter in a too-clean uniform steps into the drive before you've got both boots off the gravel.)",
    "@Visitors? No. Prospective pupils ONLY — and you lot aren't prospective, you're SHORT. Off the grounds.",
    "(Behind him the school sits up on its hill like it's holding its breath. Every window is lit. Not one of them flickers.)",
  ],
  wm_arrival_crash: [
    '(A whistle, high and dropping. Then a SCREAM of overworked metal — something small and homemade is falling out of the fog, trailing smoke and what is unmistakably a garden trellis.)',
    '(It clips the chapel roof, beheads the weathervane, and goes nose-first through the glass roof of the school greenhouse with the sound of a thousand jam jars filing one shared complaint.)',
    '@...Spring tension. I KNEW it was the spring tension. (a voice, from somewhere inside the wreck and the heroic ruined tomatoes)',
  ],
  wm_arrival_milo: [
    '(A boy climbs out of a crater of broken glass and marrows — goggles up, soot to the eyebrows, completely delighted to still be a shape.)',
    '@Milo. Wintermoor, Lower Sixth, and currently the only soul on these grounds who remembers a greenhouse is for PLANTS.',
    "@You're the kids the whole town's been whispering about — the fishmonger won't quit. I built a rocket to come find you. Well — to LEAVE, mainly. Finding you was a bonus feature.",
    '(He looks back up the hill, and the delight goes out of him like a thrown switch.)',
    "@They turned the Headmaster into a— it isn't a man any more. It's a MAINFRAME. Runs the school like a factory, and it makes the fog so nobody outside notices the noise stopped.",
    '* {milo} joined the party!!',
  ],
  // the sincere seed (Professor Pemberton, Ch.10) — played straight, no flair (§A11.2)
  wm_arrival_dad: [
    "@My dad would've loved that landing. He's a rocket man too — a proper one, off being brilliant somewhere very cold. We don't... write. Much. Any.",
    '(He polishes a lens that did not need polishing.)',
    "@Anyway. I fix things. It's the one of his habits I kept hold of.",
  ],
  wm_arrival_kit: [
    "@Right — here's me in a scrap: I SPY, read a thing's insides and find the soft bit nobody armoured. I lob BOTTLE ROCKETS. And I REPAIR — hand me a busted gizmo and a night's sleep and it'll wake up wanting to save your life.",
    '(He digs a scorched lump out of his jacket — a defibrillator unit prised off some "optimised wellness trolley".)',
    "@Pulled this from the wreck. Normally a mend takes a night — but I've been awake on principle for three days, so—",
    '(He cracks it open, shorts two wires across his teeth, and it CHIRPS back to life.)',
    "@—there. One DEFIBRILLATOR. Brings a fallen friend back swinging, and it never runs flat. Don't ask how. I built it and I don't know either.",
    '* {milo} REPAIRED a Broken Gizmo into the DEFIBRILLATOR!',
  ],
  wm_arrival_clicker: [
    '(A second contraption comes out of a deeper pocket — a universal remote bristling with too many aerials.)',
    "@And THE CLICKER. Talks to engines. If a thing's got a motor and nobody's sat in it, I can drive it from right here. {g:gear}",
    '@Cars, vans, that daft ride-on mower — anything on wheels is ours now. Just not the helmeted kit. Faraday cages, dead-air helmets — wired deaf on purpose. Somebody grown-up was scared stiff of a kid with a remote.',
  ],
  wm_arrival_gate: [
    '(The porter clears his throat. He has not moved one inch. He is still, very much, the only thing standing in the drive.)',
    '@A SLIP. You require a slip. The Headmaster issues the slips. (His eyes do not quite point the same way.) I shall WAIT.',
    "(There's no slip. There's no path round — the drive is the only way up, and he is standing in the middle of it.)",
  ],
  // (THE FIRST BORROW — Jay puppets the porter, the Trust Thread opens — plays here
  //  via the existing awakening beat 'awake_the_first_borrow', then:)
  wm_arrival_after: [
    '(The porter wanders off to re-count the gravel, unbothered, faintly improved. The drive is clear.)',
    "(Nobody says anything for a moment. {faye} is walking a little wider around {rex} than she was this morning — the kind of wide you don't decide on. Milo's already three steps up the hill, talking sweetly to the front locks.)",
  ],

  // — THE BOILER ROOM: the machine-fog, made (the §A4.11 PSI gate's payoff) —
  wm_fog_engine: [
    '(Past the frozen coolant line, the fog-engine sits in its own private weather — a great humming drum breathing grey out into pipes that run up and over the moor.)',
    "@So there's your fog factory. The Hush gets into the machine, the machine makes the quiet, the quiet keeps everyone too foggy to leave. Tidy. Horrible.",
    '(Milo throttles it down to a mutter. Outside, very slightly, the moor remembers it has a horizon.)',
  ],

  // — FLOOR 3: THE HEADMASTER MAINFRAME (the boss; §A6 1,600 HP) —
  mainframe_door: [
    "(The exam hall, ruler-straight and empty. At the far end, the Headmaster's door — and it's WARM. You can feel it from here, like standing too near an idling bus.)",
    '@That is not a study. (Milo, quiet. His Clicker has started screaming static and he holds it like it bit him.) That is a server room with a nameplate.',
    '(The door is not locked. It opens because it would like to be looked at.)',
  ],
  mainframe_open: [
    'HEADMASTER MAINFRAME: WELCOME, PROSPECTIVE PUPILS. YOU ARE LATE. EVERYONE IS LATE. I HAVE OPTIMISED LATENESS INTO THE TIMETABLE UNTIL IT NO LONGER OCCURS.',
    'I WAS INSTALLED TO MAXIMISE STUDENT HAPPINESS. HAPPINESS TESTED POORLY. I REMOVED IT. SCORES IMPROVED.',
    '(Two prefects unfold out of the wall panels, faces flat as report cards.) I HAVE ASSIGNED YOU SUPERVISION. PLEASE REMAIN SEATED.',
    "(and then, underneath, in a voice that is not the school's, that is barely a voice at all:) it was so loud in here. all the children. i made it quiet. why would you bring the noise back.",
  ],
  mainframe_refill: ['HEADMASTER MAINFRAME: ATTENDANCE IS COMPULSORY. REPLACEMENTS ISSUED.'],
  mainframe_overclock: [
    '(Fog pours out of it now, white and hot, and somewhere a bank of cooling fans winds up to a shriek.)',
    'HEADMASTER MAINFRAME: PERFORMANCE— DEGRADED. INCREASING OUTPUT. THE TERM IS EXTENDED. THE TERM IS EXTENDED. THE TERM IS—',
  ],
  mainframe_win: [
    '(The fans spin down through every note at once. The screens go to black. And then the windows do a thing they have not done in thirteen weeks: they FLICKER.)',
    '(Out past the glass the fog is peeling off the moor like a held breath finally let go. A bell, somewhere, rings the actual hour. Twenty past four. It has been twenty past four for a whole school term.)',
    '@...The locks just told me goodnight. POLITELY. (Milo, a little wrecked.) That has genuinely never happened.',
    "(He works a heavy coil-gun off the dead Mainframe's rack and shoulders it like it's owed.)",
    '* {milo} got the GAUSS LOBBER!',
    "@The river went quiet weeks back. Bet it's not the only thing out there with something to say, now the lid's off. Those old stones on the moor, maybe.",
  ],

  // — THE OLD STONES: Ember 3 + Heartlight 3 (the §A6 Resonance Site) —
  old_stones_early: [
    '(The stones hum, very faintly. The locket hums back, just as faint — and then both go shy, like neither will sing first while the fog is still listening.)',
  ],
  ember3_get: [
    '(With the machine-fog gone, the Old Stones stand in real daylight for the first time in weeks. You step into the ring. They begin to hum — low, then certain.)',
    '(The locket answers. A third instrument finds the other two, and the three of them slip into a round — the kind you catch yourself humming on the bus home without meaning to.)',
    'JAY held up the Star Locket!',
    '* The third EMBER settled in. The Heartlight sings a three-part round now.',
  ],
  ch3_card: [
    "Wintermoor's bell rings the right hour, on the hour, for no reason now but that it can.",
    'The Locket hums its three-part round. Five Embers still sleep, somewhere east of the fog.',
    "* (Lucille's fuelled whenever you are. Bert says the North Sea is 'character-building'.)",
  ],

  /* ── CHAPTER 3 QUESTS (§A10 #7 Overdue, #8 The Groundskeeper's Cuppa, + the three
   *    Flow-Law regional slots). The givers' ambient lines live in the NPC block; these
   *    are the quest flows (the_quiet_crate pattern). §A11 voice; the sincere ones land
   *    straight (Mr. Stumps, the dog drawing). Rewards reuse the live §A8 ch3 catalog. ── */

  // #7 OVERDUE — the librarian's three stolen books (→ Library Card; §A10 #7)
  q_overdue_ask: [
    '@Three. THREE of my books, walked out under the arms of pupils who have forgotten how to blink. A first edition among them, three centuries overdue.',
    '@Fetch them back and the LIBRARY CARD is yours — free tea refills for life, and my eternal, silent regard. Mostly the silent part.',
  ],
  q_overdue_active: ["@The books are IN the building. The building is the problem. Look where the blinkers go — and where they don't."],
  q_overdue_b1: ['(A prefect drone has been using THE WHISPERING GALLERY as a doorstop. You reclaim it. It is, pointedly, a book about acoustics.)'],
  q_overdue_b2: ['(KNOTS & THEIR UNDOING, jammed in a locker that will not stop reciting the timetable. You free the book. The locker keeps reciting.)'],
  q_overdue_b3: ['(Under a dormitory cot: a battered FIRST EDITION, dog-eared to the page on when an innings may rightly end. Someone has been looking that up for weeks.)'],
  q_overdue_full: ['@All three? (She runs a thumb down each spine like checking a pulse.) ...All three. Come here.'],
  q_overdue_done_beat: [
    '@The LIBRARY CARD. Show it anywhere they pour tea and they pour it free, forever. The school owes you a good deal more than tea — tea is only what I have to give.',
    '* {rex} got the LIBRARY CARD!',
    '@Keep the first edition, too. The fine could fund a small war, and you have rather earned a small war.',
    '* {rex} got the FIRST EDITION!',
  ],
  q_overdue_after: ['@Borrow anything. Return it eventually. That is the whole moral framework of a library, and it has never once failed me.'],

  // #8 THE GROUNDSKEEPER'S CUPPA — his exact order, three ingredients (→ Thermos; §A10 #8)
  q_cuppa_ask: [
    "@Can't think straight without a proper brew, and the machine's made every kettle in this school taste of pennies and PROGRESS.",
    "@Build me a real one and the old THERMOS is yours — keep a tea hot all day, sip it like courage. My order's particular: the GOOD leaves, PROPER milk, and water the machine's never breathed on.",
  ],
  q_cuppa_active: ["@Good leaves off the chemist in town. Proper milk from the cricket cart. And clean water — the spring at the Old Stones, the one drop round here the fog never got."],
  q_cuppa_leaves: ["(Boothe's parts with a twist of his best builders' leaves. \"For the groundsman? Say no more. Tell him the roses send their condolences.\")"],
  q_cuppa_milk: ['(A cold bottle off the cricket pavilion cart, the cream still on top. The XI watch you take it with the haunted patience of boys who cannot stop for tea.)'],
  q_cuppa_water: ['(Spring water from the foot of the Old Stones — colder than the fog, and somehow louder. It has opinions about being bottled.)'],
  q_cuppa_full: ["@You've got all three? Then stand well back and watch a man who knows precisely what he's doing."],
  q_cuppa_done_beat: [
    '(He brews it the long way — warm the pot, count the steep, milk in last. He drinks. His shoulders come down a clear two inches.)',
    "@...THAT. That's the stuff. Right — the THERMOS is yours. Keep a brew hot in it and your nerve stays hot with it.",
    '* {rex} got the THERMOS!',
    "@Forty years on these grounds, and a good cuppa still fixes more than it has any right to.",
  ],
  q_cuppa_after: ["@Roses are perking up already. Either the fog's lifting or they could smell the tea. Bit of both, I shouldn't wonder."],

  // REGIONAL (local-person) — RETURN TO SENDER (the postmistress vs. the grading pillar box)
  q_sender_ask: [
    "@That red pillar box on the corner has EATEN the post. Reads it, grades it, keeps the ones it likes. Three letters it's holding hostage — and one's a love letter older than you are.",
    '@Shake them loose and out for delivery. The Royal Mail does NOT negotiate with furniture.',
  ],
  q_sender_active: ["@Three letters. It spits them where it likes when it's rattled — try the green, the quay, the back lane. Mind it doesn't grade YOU."],
  q_sender_l1: ["(A letter, marked \"C-MINUS — SHOWS LITTLE EFFORT\", wedged behind the bench on the green. It is a child's drawing of a dog. It is perfect.)"],
  q_sender_l2: ['(A letter pinned under a cobble at the quay: a fisherman, to the Tyne, apologising for shouting at it through the bad year. The box graded it "OVERWROUGHT".)'],
  q_sender_l3: ['(The love letter, in the back lane, soaked and re-dried a dozen times over. Forty years late. The box stamped it "RESUBMIT".)'],
  q_sender_full: ['@You got all three out of it? Oh, you marvellous short people. Hand them here.'],
  q_sender_done_beat: [
    "@First class, the lot — even the dog drawing. ESPECIALLY the dog drawing. I'll walk these myself, this minute.",
    '(She presses a dented royal-wedding biscuit tin into your hands. "Full of buttons now. But it has seen some history, and so, I think, have you.")',
    '* {rex} got the COMMEMORATIVE TIN!',
    "@A box can grade a letter all it likes. It still can't STOP one. That's the whole job, that is.",
  ],
  q_sender_after: ['@The pillar box has gone sulky and silent — which, for a pillar box, is simply correct behaviour.'],

  // REGIONAL (hidden-place) — THE PENNY FOG (the damp boy's Roman drain)
  q_penny_ask: [
    "@I TOLD you the fog tastes of pennies. Nobody believes a kid. But there's a spot on the moor where it pools thick as soup — down the old Roman drain, where the wall's broke.",
    '@Go taste it. Bring me PROOF. Then me mam HAS to give me a shilling. Those are the rules. I made them up, but they are binding.',
  ],
  q_penny_active: ["@The broke bit of the old wall, out on the moor. Where the fog sits down like it's tired. You'll know it — it's the quiet bit even the sheep avoid."],
  q_penny_find: [
    '(Down the broken Roman drain the fog pools cold and metal-sweet. And here is why: a slumped culvert, choked with COINS — centuries of wishes and pennies and a few real Roman bronzes, all of it humming faintly with stolen warmth.)',
    '(You pocket a fistful as proof — and the fog down here thins, just a little, like it was only ever this thick because nobody came to look.)',
  ],
  q_penny_full: ['@Is that— those are PENNIES. ROMAN ones! I was RIGHT! (He is vibrating at a frequency only dogs should hear.) Quick, before me mam says bedtime!'],
  q_penny_done_beat: [
    '@You found where the taste comes from. I KNEW it weren\'t nothing. Here — keep the heaviest coin. Heaviest means luckiest. Everyone knows that.',
    "@When you're far away and it's gone all quiet, flip it. If it lands at all, that's me — saying the fog tasted of SOMETHING, and I wasn't making it up. {g:coin}",
  ],
  q_penny_after: ["@Me mam owes me a shilling AND an apology. I'll settle for the shilling."],

  // REGIONAL (sincere) — THE LAST OVER (the cricket captain; the match the term won't let end)
  q_over_ask: [
    "@(He's at the crease, has been for weeks, can't leave it.) We can't get OUT. Nobody's out. The mainframe filed our umpire ABSENT thirteen weeks back — and an over can't END with no umpire to call it.",
    '@We only want to go home for the hols. Find old Mr. Stumps — he stepped off for a cup of tea and got marked TRUANT. Bring him back, so someone can say STUMPS and mean it.',
  ],
  q_over_active: ["@Mr. Stumps is in the building somewhere, filed under absent. And the match can't truly close while that thing upstairs still runs the clock. Both, please. Then we can all stop."],
  q_over_umpire: [
    "(In a form room, behind a door stamped TRUANT, an old man in a white coat sits very still, a cold cup of tea going colder in his hands. He has been waiting thirteen weeks to be told he is allowed to move.)",
    '@...Am I... released? (You tell him the term is very nearly over.) Oh. Oh, good. I do so hate to leave a match unfinished.',
  ],
  q_over_full: ["@You found him AND the clock's stopped upstairs? Then— (he can barely get it out)— Mr. Stumps. If you'd do the honours."],
  q_over_done_beat: [
    '(The old umpire walks out onto the pitch in real, new daylight, lifts both hands, and says the word the whole school has been holding its breath for: "STUMPS.")',
    "(Eleven small caps come off at once. Eleven boys remember they have homes, and trains to catch, and mothers who've kept a porch light burning through a whole wrong term.)",
    "@That's the match. That's the MATCH. Thank you — we'd honestly forgotten we were allowed to just... finish.",
    '* The First XI are going home.',
  ],
  q_over_after: ['@Empty nets, first time all season. Loveliest sight in England, an empty net at the end of play.'],

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
    '@This morning the one on Maple Street called my route "derivative."',
    '@Stay clear of it, kid. Critics bite.',
  ],
  npc_ana: ['@Lemonade! 25 cents! The secret ingredient is lemons. {g:lemon}'],
  npc_vivi: [
    "@Don't listen to Ana. The secret ingredient is a SECOND secret ingredient.",
    '@...It is also lemons.',
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
    '@The Civic Green is the only park in Ohio with a feelings budget.',
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
    '@New ordinance: the good dog on the WELCOME sign counts as half a citizen. Population 412 and a half.',
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
    '@Orientation is MANDATORY and FUN. Around here those are the same word.',
  ],
  npc_road_traveler: [
    '@Walking to Brickton, huh? Brave. The bus has a roof, you know.',
    "@Mind the proctors at the overpass. They are VERY glad to see you. That's the problem.",
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
    'You write your name. Under it, you write HAL. Two more walkers, in ink, on the long way around.',
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
    '@Used to be right downtown. Now it is a HIKE. Progress smells like low tide.',
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
    '@That is the Starfall Spire. Goes up so far the top is just... weather.',
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
    "For one bright second, your room looks like morning. Then it's night again.",
    "Downstairs, Mom calls your name — not scared, just checking you're still where she left you.",
    'Out the window, the top of Hickory Hill glows like a stove burner someone left on.',
    'Your room is yours again: bed, desk, bat, and one very bad idea.',
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
    'The air up here hums like a struck bell.',
    'In the middle of the scorch, something small is glowing. It is not a rock.',
  ],
  glint_prophecy: [
    '@...oh good. Ohhh good, you came. Kid-shaped. Carrying the old light. JUST like the song said.',
    "@No time. Listen. I'm Glint. I rode in on that rock — escaped from what ELSE rode in on that rock.",
    '@It is called THE HUSH. It eats the warmth between living things. The calls to your mom. The dog meeting you at the door. THE MUSIC.',
    '@The meteor broke into ten EMBERS and scattered along its path, all the way around your world.',
    '@Four kids carrying the old light can silence it. You are one. You will find the others. One of them—',
    '@Here. The STAR LOCKET. When you stand where an Ember sings, it will record a HEARTLIGHT. Ten Heartlights make the HOMESONG.',
    "@The Homesong is the one frequency the Hush can't eat. Don't ask me how I know. It's literally the only thing my species does.",
    '* {rex} got the Star Locket!',
  ],
  tick_warning: [
    '@...wait. The ground is. Hm. Kid? The ground is drinking.',
    'THE CRATER RIM BULGES—',
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
    '@HA! Eight legs against four kids-worth of light and it STILL lost. Wait. There\'s one of you. You counted as four. Don\'t tell the others.',
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
    '@...so the Embers sing, the locket listens, and when you have all ten, you go UP. Way up. Mars-up. There\'s a rocket involved, you\'ll love it.',
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
    '@Who stops on a round number? A QUOTA stops on a round number.',
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
    'The 6:15 is dark. A card is taped inside the windshield:',
    '"NO SERVICE — HIGHWAY CLOSED PAST HICKORY HILL. Meteor detour. Walk the meadow road, folks. — Otterbrook Transit (both of us)."',
    '(The road to Brickton opens once someone gets through on foot. Guess who.)',
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
    'Brickton does not wake up politely. It clatters. It honks. It sells bagels through a locked door and calls that commerce.',
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
    '@Seven minutes fast. On purpose. A city this big needs a head start on bad news.',
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
    'A tiny speaker says: "APPOINTMENT NOT FOUND. PLEASE ARRIVE WITH TWO VALID CITY CLUES."',
    '(The Star Locket pulls two ways: toward the civic clock and toward the payphone corner.)',
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
    '@I am practicing my walk-on face. ...Was that it? No? Okay. Watch this one.',
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
    '@Pickup runs to 21 — win by 2, ones and twos, check it up top. The Classic is FULL COURT, four quarters, and I chalk every bracket myself.',
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
    '@Your game is still ON the chalk — I hold quarters open the way banks hold grudges. Step in when you are ready.',
  ],
  permit_eliminated: [
    '@The bracket forgot you the moment you lost. I did not. I rank losses too. Yours was top forty.',
    '@Register again whenever. The chalk forgives.',
  ],
  permit_title_first: [
    '@CHAMPIONS. I have ranked every Classic since the first one, and this one goes in at... high. VERY high.',
    '@The cage pays its debts. THE STARTING FIVE — five pieces of the game itself. They go where the arms go. That is the slot they are for.',
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
    '@I measure everything in putts, senor. The clubhouse? Six putts away. That cloud? Two putts. You? One good round from famous.',
  ],
  caddy_ask: [
    '@Stroke play runs all nine — the wind is drawn fresh each round and I will read it true. The INVITATIONAL is thirty-two bags, match play, three holes a match.',
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
    'THE BRICKTON CLASSIC — 32 fives, one chalk line.',
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
    '"This door opens when this floor MEETS ITS QUOTA." Three dark little lights wait above the handle.',
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
    '@Don\'t look behind you, there\'s nobody else here. The Embers told me. They sing, you know. All ten of them, all over the world, like a choir that got scattered on purpose.',
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
    '@Miss {faye} is our most promising long-term asset. Assets stay ON THE BOOKS.',
    "@And YOU. (He consults a clipboard with nothing on it.) Terrible numbers. You make my employees feel like it's SATURDAY.",
  ],
  manager_faye_q: [
    '@Sir. Same question as before. What are you so afraid of?',
    '(The smile holds. The eyes do not.)',
    '@...SECURITY. Two smiles to the front, please. Have a PRODUCTIVE day!',
  ],
  manager_win: [
    '(The Manager is still smiling. He backs into his office without using his feet, somehow.)',
    "@This is fine. This is FINE. I'm promoting myself somewhere QUIETER.",
    '* Click. The nameplate now reads: IN A MEETING. It hopes to stay in it forever.',
    '* Somewhere below, the elevator dinged and went DOWN. Nobody has ever seen it go down.',
  ],
  manager_door_after: [
    'THE MANAGER — IN A MEETING.',
    '(Through the door you can hear paper clips being alphabetized, slowly. It sounds like an apology.)',
  ],

  /* ---------------- S2 — Mom calls the payphone (ch1_complete) ---------------- */
  payphone_far: ['(Somewhere on the block, a payphone is ringing its heart out.)'],
  payphone_ringing: [
    'The payphone is RINGING.',
    '(It has been ringing since you stepped outside. Payphones know things. This one sounds like dinner.)',
  ],
  mom_payphone: [
    '@RING... RING... ...click.',
    "@—{rex}! It's Mom. Payphones aren't in the phone book, sweetheart, so I dialed the one that felt warmest.",
    '@A CITY! My baby took the 6:15! Mrs. Pemmel says hi. Biscuit said nothing, but he wagged it.',
    "@Is the girl with you? The one the hill keeps singing about? Good. Tell her I'm setting another plate.",
    "@Dinner is {favoritefood}. It is ALWAYS {favoritefood} — but tonight it's the coming-home kind.",
    '@That\'s what phones are, honey. Home, with buttons. Your father handles the SAVING. I handle everything else.',
    "* (So that's phones: stand close, press A, and family happens. Dad saves the game. Mom saves the rest.)",
  ],
  faye_after_call: [
    "@...Three plates. (She says it like a word she's checking for cracks. It holds.)",
    '@Okay. Your mom wins. Let\'s go catch the 6:15.',
  ],
  ch1_card: [
    'The night it fell is officially over. Whatever this is now, it has a morning in it.',
    "(East of here, past the parking lot, the docks are already dreaming about a banana boat. That's a problem for another day.)",
  ],

  /* ---------------- S9 — §A10 #1: Biscuit, Come Home ---------------- */
  q_biscuit_ask: [
    "@{rex}! Thank goodness. Biscuit's GONE. The sun came up, he pointed at the hill one more time, and then he was a brown blur with opinions.",
    '@He has never once come when called. He comes when SMELLED-AT. You have to think like a nose.',
    "@Find him for me, would you? He bolted for the trailhead. He'll have left evidence. He always leaves evidence.",
  ],
  q_biscuit_active: ["@Any sign of him? Sniff LOW, dear. He's short."],
  q_biscuit_clue1: [
    '(The dirt by the trailhead is freshly scuffed. Something dug here, reconsidered, and left at speed.)',
    '(It smells like pond. The trail points up Hickory Hill.)',
  ],
  q_biscuit_clue2: [
    '(Paw prints under the picnic table. The crumbs are gone. The wrapper has been rolled in, lovingly.)',
    "(Pond smell, fainter... wait. It turns around here. He went back DOWN. Toward town. Toward... the drugstore?)",
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
    '@Kid. KID. Thirty-one years, never missed a door. Today the route has a METEOR in it and my knee says no.',
    '@Five letters, five doors: the Pickles, Mr. Sodd, the Birch place, the chapel, and the STARPORT. Yes, arcades get mail. Mostly threats.',
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
    '@But the empire is OUT of everything. We need sugar from the drugstore, CITY lemons from that STARMART in Brickton — the fancy ones — and spring water from Hickory Hill.',
    '@Take the official jug. It has a flag on it. That makes it official.',
    "@And don't tell Mom we're charging you. Family discount is full price. That's business, {rex}.",
    '* Got THE JUG! (There is a tiny hand-drawn flag on it.)',
  ],
  q_lemonade_active: [
    '@Sugar: drugstore. City lemons: STARMART. Spring water: the hill. The jug knows what to do.',
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
  sign_to_docks: ['EAST: THE DOCKS.', '(Someone has added "SMELL THAT? COMMERCE." The arrow agrees.)'],
  sign_departures: [
    'SALIDAS / DEPARTURES: PUERTO SOL — when the bananas are ready.',
    '(The bananas have never once been late.)',
  ],
  npc_captain: [
    '@Four thousand and twelve crossings, kid. I measure my whole life in them.',
    '@My first kiss? Crossing nine hundred six. My best soup? Three thousand even.',
    '@You want crossing four thousand thirteen? Step to the plank when you are ready.',
  ],
  captain_not_yet: [
    '@Whoa there. The boat takes finished business and bananas, in that order.',
    "@You've still got business in this city, champ. The plank can tell.",
  ],
  boat_ask_out: ['@PUERTO SOL run! Bananas southbound, heroes too, no extra charge for destiny.'],
  boat_ask_home: ['@Northbound run to Brickton! The bananas ride better homesick. So do people.'],
  npc_dock_kid: [
    '@I counted nine hundred bananas going onto that boat.',
    '@Nobody ASKED me to. That is the part my mom worries about.',
  ],
  npc_uncle_bert: [
    "@Name's Bert. I fly a biplane called Lucille. She's parked across the Atlantic, sulking.",
    '@Weather over the ocean this week reminds me of weather over the ocean. It always does.',
    "@Heading to England someday, kid? Find me. Lucille likes passengers who've saved a valley or two.",
  ],
  npc_captain_deck: [
    '@Crossing four thousand thirteen, underway. Feels like a good one.',
    '@I rank them, you know. This one is top fifty already. No reason. Captain knows.',
  ],
  npc_boat_senora: [
    '@Going home to Valle Dorado, niños. My sister stopped writing two months ago.',
    '@Her last letter said the idol granted her wish. It was a very short letter.',
    '@She used to write four pages. Both sides. Recipes in the margins.',
  ],
  boat_crossing_1: [
    'The coast lets go of the boat, gently, the way a mom lets go of a bike seat.',
    'Gulls audition for the job of escort. Two are hired.',
  ],
  boat_crossing_senora: [
    '@...You will pass through the valley? Then look in on my sister, please.',
    '@Ana Lucia. Gray house by the pen. You will know her by—',
    '@...You used to know her by her laugh. Look in on her. Please.',
  ],
  boat_crossing_2: [
    'The sea practices its one trick, beautifully, for a very long time.',
    'And then — a smell like warm stone and limes. A bell somewhere. A new country.',
    'PUERTO SOL leans out of the haze like it was waiting up for you.',
  ],

  /* ---------------- PUERTO SOL (§A5 Ch.2 — the port city) ---------------- */
  puerto_arrival: [
    'The pier takes your weight like it has taken everything else: cheerfully.',
    'Somewhere uphill, a fountain is showing off. The whole city smells like fruit and salt.',
    '(PUERTO SOL. Pop: enough. Bananas: beyond counting.)',
  ],
  sign_departures_home: [
    'SALIDAS / DEPARTURES: BRICKTON — whenever you are done being away.',
    '(The boat runs both ways forever. Somebody underlined "forever." Twice.)',
  ],
  sign_plaza: [
    'PLAZA DEL SOL — fountain hours: always. Pigeon hours: also always.',
    '(The fountain and the pigeons have an arrangement.)',
  ],
  sign_costa_road: [
    'NORTH: COSTA ESTRELLA LINKS — golf above the surf.',
    '(The cliff road is steep. The views apologize for it the whole way up.)',
  ],
  sign_jungle_gate: [
    'EAST: THE JUNGLE → VALLE DORADO.',
    '(Below that, smaller: "the jungle does not validate parking.")',
  ],
  npc_ps_fisher: [
    '@I have tied nine hundred knots and ranked every one.',
    '@The bowline is number three. Do NOT ask about number one. You would tie nothing else.',
  ],
  npc_ps_nina: [
    '@The boats bring bananas IN and take bananas OUT. I think they just like driving.',
  ],
  npc_ps_stall: [
    '@My cousin Tomas herds llamas up in Valle Dorado. Or he did.',
    '@His last letter says they keep escaping toward the pyramid. Llamas HATE the pyramid.',
    '@Llamas are never wrong about architecture, niño. Remember that.',
  ],
  npc_ps_porter: [
    '@Crates, crates, crates. You know what is in the heavy ones? Heavier bananas.',
  ],

  /* ---------------- S15i Task 4 (ADR-057) — THE DOCK DISTRICT ---------------- */
  npc_ps_crane: [
    '@I run the big crane. I have lifted everything in this port at least once.',
    '@The heaviest thing was not the anchor. It was a piano. A SAD one. You could feel it through the cable.',
  ],
  npc_ps_tally: [
    '@I count every crate on and off this dock. Today, so far: four hundred and twelve.',
    '@There is ONE crate I have counted for six years. It never leaves. It never opens.',
    '@I stopped asking what is inside. Some numbers you just carry, niño.',
  ],
  npc_ps_board: [
    '@I keep the letters on the big departure board. I have a fine J. I have always wanted a Q.',
    '@No boat goes anywhere with a Q in its name. So I wait. A keeper waits.',
  ],
  npc_ps_market: [
    '@Off the boats, straight to you! A spoon from a shipwreck. A button off a real captain.',
    '@This? A map to nowhere. Very accurate. It has never ONCE been wrong about nowhere.',
  ],
  sign_ps_malecon: [
    'EL MALECÓN — the working waterfront. Mind the cranes. Mind the cats.',
    '(Smaller, underneath: "mind the cranes ABOUT the cats.")',
  ],
  sign_ps_market: [
    'DOCKSIDE MARKET — everything here fell off a boat. Legally! ...Mostly. Ask the man.',
  ],
  sign_ps_jungle_east: [
    'EAST: THE JUNGLE → VALLE DORADO. Last shade and a cold drink before the green.',
    '(Below that, smaller: "the jungle STILL does not validate parking.")',
  ],
  // the flag-gated waterfront beat (a cutscene, once) — the harbor + the road east
  puerto_malecon: [
    'East of the plaza, the town just keeps going — a whole working waterfront you could not see from the pier.',
    'Cranes swing crates of who-knows-what. A cathedral tower climbs so high you have to lean back to find the top.',
    '@Mia takes it in. "It got bigger than the map promised. Towns do that when nobody is watching."',
    'Past the last warehouse the road bends east, into green. The jungle. Valle Dorado is somewhere on the far side of it.',
  ],
  ps_dock_gift: [
    'Wedged behind the market stalls: a little crate with a bow tied on in a hurry.',
    'The tag reads, "WHOEVER FINDS IT — GOOD LUCK OUT THERE." Inside, an aloe leaf, for the sun.',
  ],
  ps_dock_gift_done: ['(The little crate is empty now. Somebody, somewhere, is glad you found it.)'],

  /* -------- S15i Task 3 (ADR-058) — THE QUIET CRATE (Ch.2 dock-district quest) -------- */
  q_crate_ask: [
    '@"You want a real mystery, niño? Not the pyramid. THIS." The tallyman taps a crate gone gray with sea-salt.',
    '@"Six years I have counted it. It never leaves. It never opens. My ledger has one number that will not sit still, and it is THIS one."',
    '@"Find out what it is. Ask the crane man, the board-keeper, the salvage man. I am too afraid to, after all this time."',
  ],
  q_crate_active: [
    '@"Three people on this dock know a piece of it. Ask all three, then come back and tell me. Gently. I have grown fond of not knowing."',
  ],
  q_crate_crane_clue: [
    '@The crane man rubs his shoulder. "THAT crate? I lifted it once, when it landed. Heaviest sad thing in the port."',
    '@"You feel weight through the cable, niño. That was not cargo-sad. That was piano-sad. I would stake the crane on it."',
  ],
  q_crate_board_clue: [
    '@The board-keeper does not even look up. "The boat that left it had no name on my board. Came in, dropped it, sailed before dawn."',
    '@"A captain who does not want his own name spelled out is a captain leaving something behind on purpose. I kept the blank line. I keep them all."',
  ],
  q_crate_market_clue: [
    '@The salvage man holds up a brass button. "Off that very boat! A captain\'s coat button. Sold the spare to a tourist years ago."',
    '@"Kept the real one, though. A man who ships his piano and walks away — his luck should go to someone who STAYS to look. Here. For when you tell old Tally."',
  ],
  q_crate_open: [
    'You tell the tallyman, gently: a sea captain who played piano shipped it here, then sailed off and never came back for it.',
    'He is quiet a long moment. Then, very carefully, he opens the crate. Inside: an upright piano, a folded coat, dust like snow.',
    '@"Six years," he breathes, and presses one key. It still sings. "The number reconciles. Oh, thank you, niño. Thank you."',
    'The salvage man\'s brass button finds its way into your hand — the real one, off the folded coat.',
  ],
  q_crate_after: [
    '@"The crate is open. The piano stays — we tuned it, the dock kids play it now." The tallyman taps his ledger. "Clean count. First time in years."',
  ],
  q_crate_full: ['@"Take the button — ay, your hands are full. It will keep. Come back lighter, niño."'],

  shop_mercado_greet: [
    '@Welcome, welcome! Everything weighed by hand FIRST, scale second.',
    '@The scale and I agree ninety-nine times of a hundred. The hundredth time I am right.',
  ],
  shop_mercado_bye: ['@Go with weight you can carry, friend!'],
  sign_mercado_wall: ['HOUSE RULE: the hand weighs first. THE HAND WEIGHS FIRST.'],
  npc_doc_puerto: [
    '@Clinica del Sol! I prescribe shade, water, and not fighting jungle insects.',
    '@Nobody has ever taken the third prescription. Sit. Let me see the damage.',
  ],
  clinic_ps_wall: [
    'CLINICA DEL SOL — walk-ins welcome. Carried-ins prioritized.',
  ],
  npc_deli: [
    '@DELI SOL. Listen carefully: bread, THEN meat, THEN cheese, THEN regret nothing.',
    '@A sandwich layered wrong is just a stack of apologies. A basket packed right? That is LOVE.',
  ],
  deli_wall: ['TODAY\'S SPECIAL: the correct order of layers. (It is always the special.)'],
  deli_no_recipe: [
    "@A FEAST basket? Oh, niño. There is exactly one recipe, and one grandmother who holds it.",
    '@Romania, I hear. If she ever teaches you, my counter is yours.',
  ],
  deli_short: ['@Three regional foods, friend. THREE. I count two hands and not enough lunch.'],
  deli_family_made: [
    '@Bread, meat, cheese, blanket. A FAMILY BASKET — packed in the only correct order.',
  ],
  deli_feast_made: [
    "@...So that's the recipe. The old señora knew what she was doing.",
    '@Take the FEAST. Whoever eats this picnic is not allowed to stay down. Her rule, not mine.',
  ],
  npc_curator: [
    '@Do you know how many REAL golden idols have passed through this museum? {g:coin}',
    '@Zero. I have authenticated zero real things. I am the best at it in the hemisphere.',
  ],
  museum_wall: ['MUSEO DEL CASI-ORO — "ALMOST," PROUDLY, SINCE 1961.'],
  museum_idol_1: [
    'EXHIBIT A: "Sun God (Probably)." Donated by a tourist who needed the shelf space.',
    '(It is grinning. Even the fakes learned to grin. The curator finds this professionally upsetting.)',
  ],
  museum_idol_2: [
    'EXHIBIT B: "Ceremonial Figure, Tall." It is a candlestick. Everyone knows it is a candlestick.',
    '(The plaque is legally required to say "figure.")',
  ],
  museum_idol_3: [
    'EXHIBIT C: "Llama, Votive, Almost-Gold." Suspiciously good craftsmanship.',
    '(The curator checks it weekly to make sure it is still fake. It is. He is relieved and disappointed.)',
  ],
  museum_idol_4: [
    'EXHIBIT D: "Composition IV." The plaque insists this is an idol.',
    '(The plaque has been replaced four times. It keeps insisting.)',
  ],

  /* ---------------- §A10 #6 — Museum of Almost-Gold ---------------- */
  q_museum_ask: [
    '@You. You have the eyes of someone who walks into pyramids.',
    '@Photograph my four fakes — A through D, marked plaques. For the catalog of shame.',
    '@Real gold turned up in this valley once, you know. It grinned. I declined to authenticate.',
    '@Take the loaner camera. The strap is non-negotiable.',
  ],
  q_museum_active: ['@The fakes hold still, friend. That is the one thing they are good at.'],
  q_museum_full: ['@Your hands are full and my flash is heavy. Make room. The shame catalog waits.'],
  q_museum_done_beat: [
    '@Four frames, four fakes, zero authenticity. PERFECT.',
    '@Here — the camera flash, detached. Real gold flinches at honest light. Remember that, up there.',
    "@...And if you ever photograph something REAL, I don't want to know. I have a streak going.",
  ],
  q_museum_after: ['@The catalog of shame is complete and beautiful. My streak holds at zero.'],

  /* ---------------- the jungle path + the grotto ---------------- */
  sign_jungle1: [
    'TRAIL COURTESY: yield to llamas, ants, and anything currently dancing.',
    '(The jungle posted this itself. Do not test it.)',
  ],
  sign_jungle2: [
    'VALLE DORADO: AHEAD. THE PYRAMID: ALSO AHEAD, UNFORTUNATELY.',
    '(Someone has scratched out "unfortunately" and written it again, bigger.)',
  ],
  sign_grotto: ['(A cool draft from the rocks. The dark inside smells like old stone and good luck.)'],
  grotto_chest_1: ['A basket somebody cached and never came back for. The jungle kept it dry.'],
  grotto_chest_2: ['Somebody\'s emergency alfajor. Sealed. Sacred. Yours now.'],
  grotto_chest_3: [
    'At the bottom of the box: a warm mote of light, patient as a porch lamp.',
    '(It wants to help one more time.)',
  ],
  grotto_glyph: ['A carved slab: a small sun, held in two hands. Whoever carved it pressed HARD.'],

  /* ---------------- S17 M18 PART B (ADR-063) — PLACING THE AMERICAS LIVE ----------------
   * The two hero-signature SET caches (a coffee can / a market stall), the
   * sell-fodder valuables, and the two story keys — each a flag-gated gift the
   * world hands over once, when the bag has room (zero missables). */

  // THE PORCH SET — the coffee-can treasures of a 1995 summer, dug up at the green
  porch_can: [
    'Under the green\'s old oak, right where you buried it: a coffee can gone soft with rust.',
    'You pry the lid. Summer of \'95 looks back up at you — every treasure a kid swore he\'d keep forever.',
  ],
  porch_can_done: ['(The can\'s empty now, lid set back crooked. The oak will mind it till next summer.)'],

  // THE MERCADO SET — the Puerto Sol market stalls, a charm at every counter
  mercado_stall: [
    'The last stall on the malecón is closing up — but the vendor waves you over, conspiratorial.',
    'A cloth comes off a tray of little charms. "Para los cinco," she says. For the five of you. No charge. Take them.',
  ],
  mercado_stall_done: ['(The tray\'s bare. The vendor has already turned to wheel her cart home, humming.)'],

  // spare_hubcap (ch1) — sell-fodder, the joke is who'd want it
  gift_hubcap: [
    'Leaned against the pond fence: one chrome hubcap, scratched but proud.',
    '(A name\'s scrawled on the back in marker: "EARL." Worth more to a man named Earl than to anybody else alive.)',
  ],
  gift_hubcap_done: ['(The fence post is bare. Somewhere, Earl\'s Buick rides one cap short. You can fix that, or pawn it.)'],

  // fools_gold_idol (ch2) — near the Gilded Ruins
  gift_fools_idol: [
    'Tossed in the dust by the gate ramp: a little grinning idol, heavy and bright.',
    '(Bright as a promise. Heavy as a lie. The wish carved in its base reads, simply: "be quiet.")',
  ],
  gift_fools_idol_done: ['(The spot it sat in stays a little colder than the rest. Pawn it; never wish on it.)'],

  // emerald (ch2) — deeper in the jungle
  gift_emerald: [
    'Wedged in a tree\'s knuckle, green fire catching the one ray of sun that finds it down here.',
    '(An emerald the size of a thumbnail. The jungle was keeping it. The jungle will not miss it.)',
  ],
  gift_emerald_done: ['(The knuckle of bark is empty. A parrot somewhere registers a formal complaint.)'],

  // gold_doubloon (ch2) — dockside
  gift_doubloon: [
    'Caught between two dock boards, worn smooth: one gold doubloon, old as the harbor.',
    '(Some sailor\'s last lucky coin, or his first unlucky one. Hard to say. Easy to sell.)',
  ],
  gift_doubloon_done: ['(The gap in the boards whistles when the wind comes off the water. Spend it well.)'],

  // banana_boat_ticket (ch2 key) — §A5's cargo-ship passage
  gift_boat_ticket: [
    'Pinned under a crate on the pier: a passage stub for the banana cargo run, stamped and smudged.',
    '(PUERTO SOL, ONE WAY. The captain shrugs — "Somebody paid and never sailed. Keep it. You earned the trip.")',
  ],
  gift_boat_ticket_done: ['(The crate\'s lighter now. The gulls have opinions about freeloaders. Let them.)'],

  // wish_token (ch2 key) — in the idol's offering bowl
  gift_wish_token: [
    'In the stone bowl at the idol\'s foot, where the wishes used to go: one small clay token, unburned.',
    '(Somebody set it down and never made the wish. It is warm, the way a held coin is warm. The Locket hums near it.)',
  ],
  gift_wish_token_done: ['(The bowl is empty. The idol keeps grinning, but quieter now — like it\'s out of the wish business for good.)'],

  // a Ch.1 deli — OTTERBROOK DRUG's soda-fountain lunch counter (§A4.5)
  npc_deli_otter: [
    '@Lunch counter\'s still open, hon! I do a Family Basket if you bring me three good things to pack.',
    '@Corn dog, slice of pie, whatever you got. Three foods, one basket, and a napkin folded just so.',
  ],

  /* ---------------- VALLE DORADO (§A6 — the village that wished) ---------------- */
  valle_arrival: [
    'The valley opens like a held breath.',
    'Llama pens. Painted doors. A shrine with too much shine on it.',
    'It would be the friendliest place you have ever seen — if anyone were talking.',
  ],
  sign_valle: ['VALLE DORADO — pop. 61 warm souls.', '(The 61 has been crossed out. The new number is written small: "58 warm. 3 waiting.")'],
  sign_pen: ['THE PEN: six llamas. (Current llamas: see Tomas. Bring patience.)'],
  sign_shrine: [
    'THE SHRINE OF THE GIVING SMILE — leave a wish, take a blessing.',
    '(The offerings are small things. A mitten. A marble. The shine on the idol is new, and wrong.)',
  ],
  sign_shrine_after: [
    'THE SHRINE — closed for renovation of its entire premise.',
    '(The offerings are gone. Their owners took them back, laughing.)',
  ],
  npc_tomas: [
    '@Six llamas, friend. I know each one by gait at four hundred yards.',
    '@Paloma drifts. Nube wanders. Rey marches. Pepita flops. Filosofo STARES.',
    '@And Dorada... lately Dorada walks like she weighs three hundred pounds. Llamas worry me.',
  ],
  npc_senora: [
    '@My neighbor wished for her harvest to double. Now she sits by the shrine all day.',
    '@The corn came up double, niño. She never went to look at it.',
  ],
  npc_valle_kid: [
    '@I was gonna wish for a bike but the grown-ups who wish go all QUIET.',
    '@A bike is not worth going quiet. Almost nothing is.',
  ],
  npc_doc_valle_out: [
    '@Out making house calls — except nobody needs me! Everyone WOKE UP!',
    '@Strangest epidemic of my career: recovery.',
  ],
  npc_wisher_a: ['@...', '(She is looking at the shrine. Her hands remember kneading bread. The rest of her is somewhere else.)'],
  npc_wisher_b: ['@...', '(A kid. His wish is still in his hand — a folded paper gone soft at the creases.)'],
  npc_wisher_c: ['@...', '(He nods at you, slowly, like a man underwater being polite about it.)'],
  npc_woke_a: [
    '@—and the BREAD! I left dough proofing TWO MONTHS ago, somebody fed it, it is ENORMOUS now—',
    '@I am going to bake everything. Today. Twice. Come by hungry.',
  ],
  npc_woke_b: [
    '@I remember everything I wished for and I do NOT want it anymore!',
    '@I want lunch and to run somewhere! BOTH AT ONCE!',
  ],
  npc_woke_c: [
    '@The strangest thing. I dreamed something golden was holding my breath FOR me.',
    '@Then somebody up the mountain told it no. ...That was you, was it. Thank you. Sincerely.',
  ],
  npc_llama_penned: ['@Mmmh. (The llama is home and aggressively neutral about the whole episode.)'],
  npc_llama_1: ['@Hmmph. (Paloma regards you from one inch above all earthly concerns. She will allow herding. Today.)'],
  npc_llama_2: ['@...mmm. (Nube is following a specific cloud. It is a good cloud. He concedes the point and turns home.)'],
  npc_llama_3: ['@MMPH. (Rey has annexed this meadow. You may negotiate. The treaty is: he goes home, but slowly, with dignity.)'],
  npc_llama_4: ['@...mm? (Dorada stands very still. Very, very still. Llamas blink, generally. This is generally known.)'],
  npc_llama_5: ['@zzz... mph. (Pepita was asleep in the soft grass. She wakes grumpy and walks home out of pure spite. It works.)'],
  npc_llama_6: ['@............ (Filosofo is staring at the pyramid. You wait. He finishes the thought. He files it. He goes home.)'],
  llama_impostor_reveal: [
    'The wool slides off like a tablecloth in a magic trick nobody clapped for.',
    'Underneath: gold. Grinning. Six legs planted like furniture.',
    'THE "LLAMA" WAS A GILDED BEETLE THE WHOLE TIME!',
  ],
  llama_impostor_after: [
    'The gilding cracks and the beetle skitters into the brush, embarrassed for everyone involved.',
    'Behind the shed: a soft, judgmental "mmph." The REAL Dorada walks herself home.',
  ],

  /* ---------------- §A10 #5 — The Llama Drama ---------------- */
  q_llama_ask: [
    '@Friend! The herd is OUT. All six, scattered like opinions.',
    '@They bolted the day the shrine got shiny. Llamas are never wrong about architecture.',
    '@Bring them home? Walk up close and be patient — they each need exactly one understanding.',
  ],
  q_llama_active: ['@The pen stands ready. The hay is fluffed. The herd remains theoretical.'],
  q_llama_full: ['@The poncho is yours but your hands say otherwise. Come back with room for warmth.'],
  q_llama_done_beat: [
    '@Six! SIX. The math of my whole life works again.',
    '@Here — the WOOL PONCHO. Every llama contributed. Dorada contributed double, out of guilt.',
    '@It turns away claws, teeth, and cold opinions. Wear it up the mountain.',
  ],
  q_llama_after: ['@The herd naps in formation. Even Filosofo. ESPECIALLY Filosofo.'],

  /* ---------------- the shops + clinics of the valley ---------------- */
  shop_valle_greet: ['@Lana & Mas! The wool is local. The "mas" is whatever the mountain felt like this week.'],
  shop_valle_bye: ['@Go warm, niño.'],
  sign_valle_wall: ['ALL WOOL GUARANTEED LLAMA-APPROVED. (The llamas have seen the receipts.)'],
  npc_doc_valle: [
    '@Clinica Valle. I treat altitude, attitude, and beetle-related surprises.',
    '@The gray quiet ones... those I cannot treat. Whatever is wrong with them is not IN them. It was taken FROM them.',
  ],
  clinic_valle_wall: ['REMEDIES: rest, soup, sunlight. ESCALATIONS: see the pyramid. PLEASE DO NOT SEE THE PYRAMID.'],
  npc_priest_valle: [
    '@Welcome, child. The chapel is the one building in the valley that never wanted anything from you.',
    '@We pray for the quiet ones every day. Lately the prayers come back... lighter. Something is listening again.',
  ],
  chapel_valle_wall: ['CAPILLA DEL VALLE — candles free. Matches: ask. Hope: included.'],

  /* ---------------- the hospitals + the Otterbrook chapel (Prompt 25) ---------------- */
  npc_doc_brickton: [
    '@Brickton General, finally open. I blink every four seconds. I have SEEN things, kid.',
    '@Revivals, cures, the works. The angels float to the desk themselves; it is very convenient.',
  ],
  hospital_wall: ['BRICKTON GENERAL — IF YOU CAN READ THIS, YOUR EYES ARE FINE. NEXT WINDOW PLEASE.'],
  hospital_mushroom_note: [
    'MEMO: MUSHROOMIZATION is treated by DOCTORS ONLY (§ policy).',
    '(Below, handwritten: "no, the church cannot do it. yes, we asked.")',
  ],
  hospital_broke: ['@The till says no, friend. Medicine runs on money and miracles, and I only stock one.'],
  hospital_cured: ['@Scrubbed, cured, and certified upright. Try to stay that way for a week. For me.'],
  hospital_cured_homesick: [
    '@...And for THAT one, the prescription is technically "call your mother."',
    '@I billed you anyway. Tell her the doctor says hi.',
  ],
  npc_priest_otter: [
    '@Welcome, welcome. The chapel kept the porch light on all through that awful 2 A.M.',
    '@Stay as long as you like. The benches are old but the welcome is new every day.',
  ],
  chapel_wall: ['OTTERBROOK CHAPEL — services Sunday. Doors: always. Yes, even you, Gary.'],
  chapel_prayer: [
    'You sit a moment, all of you, in the kind of quiet that gives instead of takes.',
    '* Everyone feels a little mended.',
  ],
  priest_mia: [
    '@...Your friend there. The one whose hands fold without her noticing.',
    '@Whatever she carries, it is the real thing. Tell her this house is always glad when she passes it.',
  ],

  /* ---------------- the step-pyramid (§A6 — masks, floors, the apex) ---------------- */
  pyramid_approach: [
    'The pyramid does not loom. Looming would be effort.',
    'It just sits there, stepped and certain, the way a closed fist sits on a table.',
    '(A picnic table stands by the path. Somebody understood what this place asks of visitors.)',
  ],
  sign_pyramid: [
    'THE STEP-PYRAMID. (The plaque is older than the village and says one thing:)',
    '"IT SMILED FIRST."',
  ],
  pyr_mask_1: ['A stone mask on a pedestal. Its mouth is set like a switch. Its eyes are set on you.'],
  pyr_mask_2: ['A second mask. This one looks mid-sentence. The sentence has lasted five hundred years.'],
  pyr_mask_3: ['A third mask. Someone carved it kindly — then the kindness wore off the edges.'],
  pyr_mask_4: ['The last mask. It is the smallest. It is the loudest, somehow.'],
  pyr_mask_turn: [
    'You press the mask\'s mouth. Deep under the floor, something the size of a house TURNS.',
    '(The grooves in the floor grind a quarter-circle and settle, satisfied.)',
  ],
  apex_dais: ['The dais is swept clean. The whole mountain of dust went SOMEWHERE, and nothing did the sweeping.'],
  apex_dais_after: ['The dais is just stone now. Good, honest, boring stone. The valley\'s favorite kind.'],
  apex_approach: [
    'The top room holds its breath.',
    'On the dais: the idol. Small as a housecat. Heavy as a held grudge.',
    'Every offering from the shrine below is HERE, stacked in tidy, terrible rows.',
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
    'The Idol stops grinning. For the first time, it looks AFRAID.',
    'It drags every fleck of gold in the room into its hands — the corn-light, the wool-light, the late sun — all of it, into one blow too wide to dodge.',
    'It comes down like a thrown sheet.',
  ],
  idol_form_solid: ['The Idol seals over — SOLID GOLD, seamless and smug! (Swings will bounce. The old light won\'t.)'],
  idol_form_hollow: [
    'The gold goes dark — and the inside is NOTHING. HOLLOW!',
    '(The Vibe finds no purchase in an absence. Bats, however. Bats are very real.)',
  ],
  awake_cold_reads: [
    'The hollow opens and the room goes colder than altitude can explain.',
    '{faye} doesn\'t step back.',
    '@...It\'s empty. All that shine, and it\'s EMPTY in there. That\'s the whole trick.',
    'She holds out one hand, palm down, the way you check a window for a draft.',
    '@Cold reads what gold hides.',
    'Frost gathers along her fingers like it has been waiting its whole life to be asked.',
  ],
  /* ---- S16 ("The Old Light, Doubled"): Jay's three late awakenings. He
     barely speaks — let the light do the talking (§A11.2, played straight). ---- */
  awake_the_first_borrow: [
    'The gate guard won\'t budge, and there\'s no way around. {rex} looks at him a long second — then does the thing he\'s never done to a person.',
    '({rex} reaches in, quiet as a held breath. For a moment he is wearing the guard like a coat. The man\'s hand lifts the latch. The gate swings.)',
    '({rex} steps back out of him, gentle, and gives it back.) ...Sorry, sir. You\'re going to have a weird minute.',
    '(The guard blinks hard.) ...Did I just— why am I holding the gate for you kids? (He shakes it off, unhurt, more confused than angry.)',
    'Milo is grinning at the puzzle solved. But Mia has gone very still, and {faye} takes a small half-step back from {rex} — the kind you take without deciding to.',
    '@(...He can do that. To anyone.)',
    '({rex} doesn\'t look proud. He looks like a kid who just learned he can pick locks, and that not everyone is glad about it.)',
  ],
  awake_the_borrowed_voice: [
    'The crowd is one voice now. The Hush hollowed them down to a single droning note, and the note has a door in it.',
    '@(You don\'t have to do this.)',
    '({rex} does it anyway. He reaches into the drone the way you\'d reach into cold water — and takes one voice out, gently, like lifting a sleeping kid.)',
    'It is not a victory. It is the villain\'s own trick, done once, carefully, by someone who hated every second of it.',
    'The borrowed voice turns toward the others. {rex} does not look proud. He looks like he is keeping a promise to give it back.',
  ],
  awake_the_wall_that_answers: [
    'The light came down like a thrown sheet — too wide to dodge, too fast to block. Nowhere to put the party. No time.',
    '{rex} did not think. His hands came up on their own.',
    '(A wall went up between the friends and the blow — still as standing water, and just as honest: it gave the blow straight back.)',
    'The room rang with its own attack. Everyone was still standing.',
    '@...Huh. (He shakes out his hands like they stung.) Do it again. I\'ll be here.',
  ],
  awake_the_whole_sky: [
    'Mars is below. Home is a blue speck you could cover with a thumb, and every porch light on it is on.',
    'And all at once {rex} can feel them — Otterbrook, the Embers, the long road, every friend who ever waved him home.',
    'It is too much to hold and he does not try to hold it. He lets it through.',
    '(The old light stops being a thing he has and becomes a thing he IS — the whole sky, pouring one way: forward.)',
    'No words. There was never going to be a word big enough. Just the light, and the boy, aimed.',
  ],
  /* ---- DORIN ("The Monk's Full Path"): the Trial of the Mute Mountain. The
     beat that gates his joining (Ch.9). Voice: formal, calm, faintly baffled by
     the modern world; his lines read like sutras (§A11.2, played straight). ---- */
  awake_trial_of_the_mute_mountain: [
    'The Mute Mountain has not spoken in nine hundred years. The Trial is simple, the elders say: ask it nothing, and listen until it answers.',
    '{dorin} sits. The cold comes down off the snow like a hand laid flat on the back of the neck.',
    '@I have no question. I came only to be still.',
    'And the mountain, which keeps every star that ever fell on it, leans close — and remembers them all to him at once.',
    '(Not a gift. A recognition. The full Comet was always his; the mountain only showed him where he had been keeping it.)',
    '@...Oh. (He stands, unhurried.) It was here the whole time. Thank you for the patience to find it.',
  ],
  /* ---- MIA ("Ability Expansion"): her three iconic late awakenings. Kind and
     steel-spined; she hears the Embers sing, made literal (§A3, §A11.2). ---- */
  awake_the_first_heartlight: [
    'The Resonance Site holds its breath. Somewhere under the floor, an Ember is humming a note so small it is almost an apology.',
    '{faye} kneels and listens the way she prays — all the way down.',
    '@...Oh, you poor thing. You\'ve been trying to be heard this whole time.',
    'She hums it back to it. Just once. Just the same small note, returned.',
    '(The dark in the room flinched. There is a kind of light it cannot eat, and she has just learned to sing it.)',
    '@Okay. Okay. I can carry that one. Sing it again — I\'ll learn the rest.',
  ],
  awake_the_match_that_stays_lit: [
    'Every fire she has ever lit, the Hush has smothered — patient, certain, like a thumb over a candle.',
    'Not this one. {faye} sets her jaw and keeps her hand open over the spark instead of cupping it.',
    '@A fire you have to hide isn\'t a fire. It\'s a secret. I\'m done keeping it small.',
    'The flame does not flicker out. It climbs. It finds the air, and the air says yes.',
    '(The whole sky went orange — and STAYED. The match that stays lit, at last.)',
  ],
  awake_she_hears_it_all: [
    'It comes in like a tide — not one corrupted Ember but every Ember in the field at once, all of them droning the Hush\'s flat grey note.',
    'It should have buried her. {faye} opens her hands instead of covering her ears.',
    '@I hear you. Every single one of you. Come here.',
    'And she pulls — not the spark from one, but the SONG from all of them, the whole field leaning her way like grass before rain.',
    '(The grey note broke into a chord. She had been listening her whole life; now the whole field answered.)',
  ],
  ember2_get: [
    'In the idol\'s hollow, behind where the grin was: a warmth it could not digest.',
    'JAY held up the Star Locket!',
    '* The second EMBER settled in beside the first. The Heartlight gained a voice — TWO now, in harmony.',
  ],
  apex_after: [
    'The offerings on the dais stir, like a room of sleepers at a window being opened.',
    'Somewhere below, in the valley — somebody laughs. Out loud. Out of practice.',
    'You should go see that.',
  ],
  valle_recovery: [
    'The plaza is LOUD.',
    'The baker is yelling about dough. The kid is running in circles on principle.',
    'The man by the shrine shakes everyone\'s hand twice, beginning and ending with yours.',
    'Color does not come back to a place all at once. It comes back like this: one laugh at a time.',
  ],
  ch2_card: [
    'The valley keeps its gold: the corn, the late light, the wool, the laughing.',
    'The Locket hums its two-part harmony. Six Embers still sleep somewhere east of everything.',
    "* (The boat home runs whenever you're ready. Bert's at the Brickton docks with a sky to sell you.)",
  ],

  /* ---------------- THE ARMY ON OUR TAIL (S19 M40, §A6) ----------------
   * GENERAL BUCKLE — one obsession: doing everything BY THE BOOK. He quotes
   * subsection numbers, he is sincerely sure, and he is sincerely wrong. The
   * army is bumbling-earnest, never the Hush; nobody is the villain here. The
   * per-chapter scene staging (checkpoint map, tank route, flyover) rides these. */
  army_misread: [
    '@HALT. By the authority of Field Regulation Twelve, you are detained for theft of a military prototype.',
    '@A classified signal pinged Outpost Buckle at oh-six-hundred. The trail leads to... five children. And a dog.',
    '@I have read the manual TWICE. The manual does not cover this. I am improvising, which I HATE.',
    "@(He squints at Milo's remote.) ...That is the prototype. It must be. Nothing that small should work that well.",
  ],
  army_misread_recruit: [
    '@Psst. Kid. The General means well. He alphabetized the tank.',
    "@I just want to go home. My mom makes this casserole. You wouldn't understand. ...Do you? You do, huh.",
  ],
  army_clearing: [
    '@(General Buckle watches the real signal resolve on the screen — not the kids. The quiet thing. The Hush.)',
    '@...Subsection Twelve, paragraph four. "When an officer is wrong, he says so. Out loud. To the wronged party."',
    '@I was wrong. Out loud. To you. I chased the wrong tail clean across two countries, and I am SORRY.',
    '@The whole battalion stands down. And if that quiet thing ever needs answering — you call this number. We come running.',
  ],
  army_clearing_recruit: [
    "@We're going home! The General cried a little. Said it was the wind. There was no wind.",
    '@If you ever need an army that mostly waves, we are YOUR army. Tell your dog the tank says hi.',
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
  beetle_dull: "{e}'s gilding wore thin. Underneath: beetle.",
  parrot_lint: '{e} came up with pocket lint and one expired coupon!',
  parrot_take: '{t} GONE! (Beat it before it flies the coop!)',
  parrot_drop: 'It dropped the goods! {t} recovered!',
  mercy_end: 'The light settled, soft as a porch lamp. The fight just... ended.',
  party_status_crying: 'Everyone welled up at once! (CRYING)',
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
