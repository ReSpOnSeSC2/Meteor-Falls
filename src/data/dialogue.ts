/**
 * Chapter 1 dialogue — GAME_BIBLE §A11 voice rules:
 * absurdism everywhere, sincerity is never the joke, signs editorialize,
 * every NPC has exactly one weird obsession.
 */

export const DIALOGUE: Record<string, string[]> = {
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
  locked_drugstore: [
    'The drugstore is dark. A note on the door:',
    '"BACK WHEN THE SKY CALMS DOWN. — Mgmt."',
  ],
  locked_arcade: [
    'The STARPORT is locked. From somewhere inside comes the lonely chirp of an unbeaten high score.',
  ],
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
  phone_save_q: ['Call Dad and save your progress?'],

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
  sign_lot: [
    'FUTURE SITE OF MORE BRICKTON.',
    '(The lot has been the future since before you were born. The weeds seem confident.)',
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
  locked_starmart: [
    'STARMART — OPEN 24 HOURS. It is locked.',
    '(A smaller sign clarifies: "not 24 hours in a ROW.")',
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
  locked_arcade2: [
    'STARPORT II — "The Sequel to the Arcade." Locked.',
    'Through the glass, one cabinet idles its attract mode at nobody, flashing a high score with three letters: "MGR".',
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

  /* ---------------- S2 — Faye, the girl who prays (§A3, §A6) ---------------- */
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
    "@Is the girl with you? The one the hill keeps singing about? Good. Tell her I'm setting three plates.",
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
};

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
  // S2: Faye's first Pray, tutorialized in the Manager fight (§A11.4 — warm)
  pray_hint: "({user}'s hands are already together. PRAY is on her menu — it costs nothing, and it always does SOMETHING.)",
  spark_revive: 'The spark flares — warm as a porch light in late summer. {t} got back up!',
};
