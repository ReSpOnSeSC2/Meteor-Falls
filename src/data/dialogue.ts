/**
 * Chapter 1 dialogue — GAME_BIBLE §A11 voice rules:
 * absurdism everywhere, sincerity is never the joke, signs editorialize,
 * every NPC has exactly one weird obsession.
 * Every {token} below must be one src/ui/text.ts resolves — `npm run
 * validate` sweeps for typos (S5). Types z.infer'd from src/schemas.
 */
import type { DialogueScript } from '../schemas';

export const DIALOGUE: Record<string, DialogueScript> = {
  /* ---------------- NPCs ---------------- */
  npc_pemmel: [
    '@Oh! {rex}! Did you feel the sky last night? My whole spice rack jumped.',
    "@Biscuit heard it too. He's been pointing at the hill all morning like a furry compass.",
    '@If you ever see him wander off, send him home, would you? He smells like pond.',
  ],
  npc_biscuit: ['@Woof! (He smells like pond. He seems enormously proud of this.)'],
  // ADR-042: the Hill Road cameo — he beat you up here, and he was right
  npc_biscuit_road: [
    '@WOOF. WOOF WOOF. (Biscuit is pointing at the hill with his whole body. Even the tail is pointing.)',
    '(He looks at you. He looks at the hill. He looks back at you, to make sure you got the message.)',
  ],
  npc_plummer: [
    '@Thirty-one years delivering mail, and not ONE box ever talked back.',
    '@This morning the one on Maple Street called my route "derivative."',
    '@Stay clear of it, kid. Critics bite.',
  ],
  npc_ana: ['@Lemonade! 25 cents! The secret ingredient is lemons.'],
  npc_vivi: [
    "@Don't listen to Ana. The secret ingredient is a SECOND secret ingredient.",
    '@...It is also lemons.',
  ],
  npc_oldtimer: [
    '@A meteor, eh? In MY day the sky stayed put.',
    '@Except for birds. We allowed birds.',
  ],
  npc_pajama: [
    "@My mom says I can't go up Hickory Hill because it's 2 AM and a space rock fell on it.",
    '@Moms think of EVERYTHING.',
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
    'WELCOME TO OTTERBROOK — pop. 412 and one very good dog.',
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
    '@The meteor broke into eight EMBERS and scattered along its path, all the way around your world.',
    '@Four kids carrying the old light can silence it. You are one. You will find the others. One of them—',
    '@Here. The STAR LOCKET. When you stand where an Ember sings, it will record a HEARTLIGHT. Eight Heartlights make the HOMESONG.',
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
    '@...so the Embers sing, the locket listens, and when you have all eight, you go UP. Way up. Mars-up. There\'s a rocket involved, you\'ll love it.',
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
  brickton_goal_clock: [
    'The civic clock clicks seven wrong minutes at once.',
    'Every blue blazer on the block turns toward it, smiles, and turns away again like a row of appliances.',
    '@That is Brickton time, honey. (The clock lady taps the glass.) Seven minutes fast, on purpose.',
    '@A city this big needs a head start on bad news.',
    '(The Star Locket takes one impossible tick from the clock and keeps it warm.)',
    '* GOAL: Borrowed a BRICKTON MINUTE!',
  ],
  brickton_goal_dial: [
    'The payphone rings once.',
    'Nobody is calling. Somehow, it still feels answered.',
    '@Hear it? (The quarter man smiles without showing teeth.) Area code 216, B flat, warm as toast.',
    'You hold the Star Locket near the receiver. The dial tone folds itself into the first Heartlight.',
    '* GOAL: Caught a WARM DIAL TONE!',
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
    '@The cage pays its debts. THE STARTING FOUR — four pieces of the game itself. They go where the arms go. That is the slot they are for.',
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
    'HOLE 1 — THE HANDSHAKE waits past this plaque. The caddy waits closer.',
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
    '@Don\'t look behind you, there\'s nobody else here. The Embers told me. They sing, you know. All eight of them, all over the world, like a choir that got scattered on purpose.',
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
    '@Woof! (Biscuit is sitting in front of the corn dogs with the patience of a saint and none of the budget.)',
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
    '@Do you know how many REAL golden idols have passed through this museum?',
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
  revive_word: 'The old word landed. {t} got back up!',
  no_fallen: 'Everyone is still standing. The old word keeps.',
  cure_clean: '{t} feels scrubbed clean!',
  cure_nothing: '{t} was already fine. Now they are VERY fine.',
};
