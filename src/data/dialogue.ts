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

  /* ---------------- cutscenes ---------------- */
  intro_card: [
    'Otterbrook, Ohio. Summer, 1995.',
    '2:11 AM.',
  ],
  intro_wake: [
    'The roar came up through the floor, through the bed, through the back teeth.',
    'Something enormous just landed on Hickory Hill.',
    '({rex} is already putting on his cap. Somehow you knew he would be.)',
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
    '@Four kids carrying the old light can silence it. You are one. You will find the others. One of them— ',
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
  picnic_rest: [
    'You sit at the table a while. Somewhere nearby, a bird applauds.',
    '* The party rested a little. (Full picnics arrive with Picnic Baskets.)',
  ],
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
    '@Guy in a blue blazer. Smiled the WHOLE time. Played ONE game, scored three thousand EXACTLY, signed it "MGR", and left. Who stops on a round number? A QUOTA stops on a round number.',
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
    'It turns out the world was hiding a whole CITY behind the corn.',
  ],

  /* ---------------- Brickton City ---------------- */
  sign_brickton: [
    'WELCOME TO BRICKTON CITY — pop. lots.',
    '(Someone has written "OTTERBROOK FITS IN OUR PARKING LOT" underneath. Rude. Accurate.)',
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
  cage_board: [
    'THE BRICKTON CLASSIC — 32 fives, one chalk line.',
    '(The handwriting is immaculate. The seeding is "impartial." The nephews are fifth.)',
  ],
  npc_nurse: [
    '@Brickton General, walk-ins welcome. The clipboard knows if you are sick. I just hold the clipboard.',
    '@...It says you are fine. It says you are EXTREMELY twelve.',
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
  ],
  locked_bank: [
    'OTTERBROOK SAVINGS & LOAN, Brickton branch. Closed.',
    '(Inside, the vault is sleeping. Banks sleep standing up, like horses.)',
  ],
  locked_diner: [
    'The DINER is closed between breakfast and breakfast.',
    'A menu in the window lists "EGGS (various)" and, lower down, "ASK US ABOUT TUESDAY."',
  ],

  /* ---------------- the Department of Smiles ---------------- */
  npc_receptionist: [
    '@Welcome to the Department of Smiles! Have you smiled today? Don\'t worry. We can fix that.',
    '@Visitors are encouraged to enjoy the lobby, the other floors, and compliance.',
    '@Have a PRODUCTIVE day!',
  ],
  dos_lobby: [
    'DEPARTMENT OF SMILES — "Putting the PRODUCT in PRODUCTIVITY since whenever."',
    '(The exclamation point on the wall logo looks tired.)',
  ],
  dos_cert: [
    'ELEVATOR INSPECTION CERTIFICATE: "It\'s a great elevator." — an inspector, probably.',
    '(The UP light is always on. There is no proof anyone has ever gone down.)',
  ],
  dos_breakroom: [
    'BREAK ROOM — Breaks are limited to feelings of gratitude.',
    '(Someone has scratched "I MISS SATURDAY" into the paint, then apologized underneath.)',
  ],
  dos_memo1: [
    'MEMO: Effective today, frowning is a meeting.',
    'MEMO: All meetings are mandatory.',
  ],
  dos_memo2: [
    'EMPLOYEE OF THE MONTH: EVERYONE!',
    '(Forty identical photos of forty identical smiles. None of them look happy about it.)',
  ],
  dos_quiet: [
    'FLOOR 3 — QUIET FLOOR. SMILE SOFTLY.',
  ],
  dos_memo3: [
    'QUOTA BOARD — SMILES PRODUCED: ALL OF THEM.',
    'SMILES FELT: (this column is empty)',
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
  ],
  faye_locket: [
    '* {rex} held up the Star Locket. Inside it, one instrument was playing, all alone.',
    '@...That\'s it. That\'s the song I keep hearing through the walls.',
    '(She listens the way some people pray. It turns out to be the same thing.)',
    '@They put me in here because I asked the Manager what he\'s so afraid of. He smiled so wide it stopped being a smile. The door did the answering.',
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
    'CHAPTER ONE — THE NIGHT IT FELL',
    'complete.',
    "(East of here, past the parking lot, the docks are already dreaming about a banana boat. That's a Chapter 2 problem.)",
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
  spy_report: '{e} — about {t} HP left.',
  spy_weak: 'Weak point, circled twice: {t}.',
  spy_no_weak: 'Notes: sturdy, rude, no obvious weak point.',
  magnet_sip: '{user} sipped {t} PP right out of the air!',
  revive_word: 'The old word landed. {t} got back up!',
  no_fallen: 'Everyone is still standing. The old word keeps.',
  cure_clean: '{t} feels scrubbed clean!',
  cure_nothing: '{t} was already fine. Now they are VERY fine.',
};
