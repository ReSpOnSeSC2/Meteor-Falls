/**
 * Side quests — GAME_BIBLE §A10 #1–4 (S9–S10, Bible Prompt 26 + Prompt 11 shape).
 * Every quest is a flag-driven state machine: startFlag arms it, each
 * objective's flag marks a completed step (in journal order), doneFlag ends
 * it. The CALLER record is the finale's fuel (§A6 Ch.8) — completing the
 * quest freezes it onto the save's ledger via engine/quests.ts.
 * Objective texts are the JOURNAL lines — §A11 voice, map markers OFF.
 * Types are z.infer'd from src/schemas (S5); `npm run validate` pins this
 * file against the §A10 manifest (ids, names, callers, effects, rewards).
 */
import type { QuestDef } from '../schemas';

export type { QuestDef, QuestObjective, Caller } from '../schemas';

const Q = (q: QuestDef): QuestDef => q;

export const QUESTS: Record<string, QuestDef> = Object.fromEntries(
  [
    /* ---- §A10 #1 — the lost beagle, tracked by nose across 3 screens ---- */
    Q({
      id: 'biscuit_come_home',
      name: 'Biscuit, Come Home',
      chapter: 1,
      giver: 'mrs_pemmel',
      startFlag: 'q_biscuit',
      objectives: [
        { id: 'trailhead', text: 'Find Biscuit. He smells like pond.', flag: 'q_biscuit_c1' },
        { id: 'hill', text: 'The pond smell climbs Hickory Hill. Climb after it.', flag: 'q_biscuit_c2' },
        { id: 'doubled_back', text: 'The trail doubled back to OTTERBROOK DRUG. Of course it did.', flag: 'q_biscuit_c3' },
        { id: 'report', text: 'Tell Mrs. Pemmel her furry compass works.', flag: 'q_biscuit_walked' },
      ],
      rewardItem: 'lucky_collar',
      doneFlag: 'q_biscuit_done',
      caller: {
        name: 'Mrs. Pemmel',
        quote: 'Biscuit pointed at the sky and BARKED, dear. We know what that means. Send them everything.',
        effect: { kind: 'damage', power: 400 },
      },
    }),

    /* ---- §A10 #2 — Mr. Plummer's route: 5 doors, one lawnmower ---- */
    Q({
      id: 'mail_must_move',
      name: 'Mail Must Move',
      chapter: 1,
      giver: 'mr_plummer',
      startFlag: 'q_mail',
      objectives: [
        { id: 'pickles', text: "The Pickles' GREEN RANCH next door to your place, up on the bluff — walk to its front door (look for the raised mail flag).", flag: 'q_mail_pickles' },
        { id: 'sodd', text: "Mr. Sodd's YELLOW COTTAGE, east of the bluff stairs. His lawnmower has opinions about the lawn.", flag: 'q_mail_sodd' },
        { id: 'birch', text: 'The Birch BUNGALOW with the tire swing, far east end of the bluff row. The tidy one.', flag: 'q_mail_birch' },
        { id: 'chapel', text: 'The white CHAPEL on the main drag downtown, just west of the town square.', flag: 'q_mail_chapel' },
        { id: 'arcade', text: 'A bill for the STARPORT arcade — the neon star closing the east end of the drag. Mostly threats.', flag: 'q_mail_arcade' },
        { id: 'report', text: 'Every mail flag down? Tell Mr. Plummer — he walks the woods lane between the bluff and town.', flag: 'q_mail_reported' },
      ],
      rewardItem: 'fresh_stamps',
      doneFlag: 'q_mail_done',
      caller: {
        name: 'Mr. Plummer',
        quote: 'Thirty-one years, kid, and THIS is the special delivery. First class. No postage on courage.',
        effect: { kind: 'damage', power: 450 },
      },
    }),

    /* ---- §A10 #3 — the twins' supply run; the stand pays in forever ---- */
    Q({
      id: 'lemonade_empire',
      name: 'Lemonade Empire',
      chapter: 1,
      giver: 'ana',
      startFlag: 'q_lemonade',
      objectives: [
        { id: 'sugar', text: 'Sugar from OTTERBROOK DRUG. The recipe is one word long.', flag: 'q_lem_sugar' },
        { id: 'lemons', text: 'City lemons from STARMART in Twoton. Fancier. Lemonier.', flag: 'q_lem_lemons' },
        { id: 'water', text: 'Spring water from Hickory Hill. The jug believes in you.', flag: 'q_lem_water' },
        { id: 'pour', text: 'Bring it all to the stand. Witness glass one.', flag: 'q_lem_poured' },
      ],
      doneFlag: 'q_lemonade_done',
      caller: {
        name: 'Ana & Vivi',
        quote: "BOTH of us on one phone! The secret ingredient was you all along— okay, it's still lemons. TAKE THE LEMONS!",
        effect: { kind: 'heal', power: 400 },
      },
    }),

    /* ---- §A10 #4 — beat the Twoton arcade high score (replayable) ----
     * The score to beat is the Manager's "MGR" row (canon since the
     * locked_arcade2 attract gag; S2 gave MGR a face). The quest completes
     * ONCE; the ARCADE LEGEND cabinet stays endlessly replayable from any
     * save — the score table is the v4 save field, not quest state. */
    Q({
      id: 'arcade_legend',
      name: 'Arcade Legend',
      chapter: 1,
      giver: 'arcade_owner',
      startFlag: 'q_arcade',
      objectives: [
        { id: 'beat_mgr', text: 'Knock "MGR" off the top of the ARCADE LEGEND machine at STARPORT II.', flag: 'q_arcade_beat' },
        { id: 'claim', text: 'Tell Sal the big board has a new name on it.', flag: 'q_arcade_claimed' },
      ],
      rewardItem: 'champion_jacket',
      doneFlag: 'q_arcade_done',
      caller: {
        name: 'Sal',
        quote: 'Kid! Board update: SAVING THE WORLD — first place, all-time. I keep score, I would know. Send it EVERYTHING!',
        effect: { kind: 'damage', power: 425 },
      },
    }),

    /* ---- §A10 #5 — herd six llamas; one of them is lying ---- */
    Q({
      id: 'llama_drama',
      name: 'The Llama Drama',
      chapter: 2,
      giver: 'tomas',
      startFlag: 'q_llama',
      objectives: [
        { id: 'l1', text: 'Bring back Paloma. She is above such things as pens.', flag: 'q_llama_1' },
        { id: 'l2', text: 'Bring back Nube. He follows clouds. On foot.', flag: 'q_llama_2' },
        { id: 'l3', text: 'Bring back Rey. He has annexed the south meadow.', flag: 'q_llama_3' },
        { id: 'l4', text: 'Bring back Dorada. Tomas says she is "shinier than usual."', flag: 'q_llama_4' },
        { id: 'l5', text: 'Bring back Pepita. She is somewhere soft, asleep.', flag: 'q_llama_5' },
        { id: 'l6', text: 'Bring back Filosofo. He is staring at the pyramid again.', flag: 'q_llama_6' },
        { id: 'report', text: 'Tell Tomas the herd adds up to six again.', flag: 'q_llama_reported' },
      ],
      rewardItem: 'wool_poncho',
      doneFlag: 'q_llama_done',
      caller: {
        name: 'Tomas',
        quote: 'Six llamas are watching me dial! They KNOW it is for you! Take everything we have — the wool agrees!',
        effect: { kind: 'damage', power: 420 },
      },
    }),

    /* ---- §A10 #6 — four fake idols, one skeptical curator ---- */
    Q({
      id: 'museum_gold',
      name: 'Museum of Almost-Gold',
      chapter: 2,
      giver: 'curator',
      startFlag: 'q_museum',
      objectives: [
        { id: 'p1', text: 'Photograph the squat one. The curator says a tourist made it.', flag: 'q_photo_1' },
        { id: 'p2', text: 'Photograph the tall one. It is clearly a candlestick.', flag: 'q_photo_2' },
        { id: 'p3', text: 'Photograph the llama-shaped one. Suspiciously good.', flag: 'q_photo_3' },
        { id: 'p4', text: 'Photograph the abstract one. The plaque insists.', flag: 'q_photo_4' },
        { id: 'report', text: 'Return the camera before the curator reports it stolen. He will.', flag: 'q_museum_reported' },
      ],
      rewardItem: 'camera_flash',
      doneFlag: 'q_museum_done',
      caller: {
        name: 'The Curator',
        quote: 'I have authenticated EXACTLY one real thing in my career. It is calling you right now. Take the light!',
        effect: { kind: 'damage', power: 435 },
      },
    }),

    /* ---- S15i Task 3 (ADR-058) — Ch.1's 5th quest: the ROUTE quest on the Long
     * Walk legs (§A10 flow law: solved WHILE travelling, changes how you read the
     * map). Hal asks you to walk the whole way and notice each stretch; you sign the
     * Walkers' Register at the overpass. A sincere ending about going the long way. */
    Q({
      id: 'walkers_register',
      name: "The Walkers' Register",
      chapter: 1,
      giver: 'road_traveler',
      startFlag: 'q_walkreg',
      objectives: [
        { id: 'mile', text: 'On MEADOW MILE, notice the flower the bus people never slow down to see.', flag: 'q_walkreg_mile' },
        { id: 'woods', text: 'In the WHISPERWOOD, notice what the quiet leaves behind.', flag: 'q_walkreg_woods' },
        { id: 'far', text: 'In the FAR MEADOW, notice the spot where the air goes electric.', flag: 'q_walkreg_far' },
        { id: 'sign', text: "Sign the Walkers' Register at the overpass — both names, yours and Hal's.", flag: 'q_walkreg_signed' },
      ],
      rewardItem: 'walkers_charm',
      doneFlag: 'q_walkreg_done',
      caller: {
        name: 'Old Pell',
        quote: 'The Register has a new name today, and it WALKED here. Tell the dark some folks still go the long way. Everything we have — send it.',
        effect: { kind: 'damage', power: 430 },
      },
    }),

    /* ---- S15i Task 3 (ADR-058) — a Ch.2 dock-district quest (Puerto Sol's grown
     * waterfront, ADR-057). The tallyman's six-year mystery: one crate that never
     * leaves, never opens. Ask the crane man, the board-keeper, the salvage man; the
     * clues add up to a sea captain's piano. A quiet, sincere §A11 dock story. */
    Q({
      id: 'the_quiet_crate',
      name: 'The Quiet Crate',
      chapter: 2,
      giver: 'ps_tally',
      startFlag: 'q_crate',
      objectives: [
        { id: 'crane', text: 'Ask the crane man what the strange crate WEIGHS. He lifted it once.', flag: 'q_crate_crane' },
        { id: 'board', text: 'Ask the board-keeper which boat left it. He remembers every name — even the gone one.', flag: 'q_crate_board' },
        { id: 'market', text: 'Ask the salvage man what else came off that same boat.', flag: 'q_crate_market' },
        { id: 'tell', text: 'You know what is inside now. Go tell the tallyman. Gently.', flag: 'q_crate_told' },
      ],
      rewardItem: 'captains_button',
      doneFlag: 'q_crate_done',
      caller: {
        name: 'The Tallyman',
        quote: 'The count is CLEAN, niño! Six years, and it was music the whole time. Take everything — some numbers you let go.',
        effect: { kind: 'heal', power: 380 },
      },
    }),

    /* ════════════ CHAPTER 3 — ENGLAND (S18, ADR-099): the five §A10 quests ════════════
     * #7 Overdue + #8 The Groundskeeper's Cuppa (the named core), + the Flow-Law trio:
     * Return to Sender (local-person), The Penny Fog (hidden-place), The Last Over
     * (sincere). Rewards reuse the live §A8 ch3 catalog (no new ITEMS row); two are
     * caller+flag (the Paperboy precedent, ADR-073). Each strengthens the §A6 ledger. */

    /* ---- §A10 #7 — recover three library books from blinking drones ---- */
    Q({
      id: 'overdue',
      name: 'Overdue',
      chapter: 3,
      giver: 'wm_librarian',
      startFlag: 'q_overdue',
      objectives: [
        { id: 'b1', text: 'A blinking Prefect Drone dragged THE WHISPERING GALLERY into the stacks. Get it back.', flag: 'q_overdue_b1' },
        { id: 'b2', text: 'KNOTS & THEIR UNDOING is jammed in a form-room locker. Free it.', flag: 'q_overdue_b2' },
        { id: 'b3', text: 'A first edition walked into the DORMS. Bring it home.', flag: 'q_overdue_b3' },
        { id: 'report', text: 'Three books, recovered. Tell the Librarian the stacks are whole again.', flag: 'q_overdue_reported' },
      ],
      rewardItem: 'library_card',
      doneFlag: 'q_overdue_done',
      caller: {
        name: 'The Librarian',
        quote: 'The stacks are FULL again — full of loud things, said carefully. Borrow my whole voice. Return it whenever.',
        effect: { kind: 'heal', power: 400 },
      },
    }),

    /* ---- §A10 #8 — brew the groundskeeper's exact order: three ingredients ---- */
    Q({
      id: 'groundskeepers_cuppa',
      name: "The Groundskeeper's Cuppa",
      chapter: 3,
      giver: 'wm_groundskeeper',
      startFlag: 'q_cuppa',
      objectives: [
        { id: 'leaves', text: "The GOOD leaves, off Boothe's chemist in town.", flag: 'q_cuppa_leaves' },
        { id: 'milk', text: 'PROPER milk, from the cricket pavilion cart.', flag: 'q_cuppa_milk' },
        { id: 'water', text: 'Clean water the fog never touched — the spring at the Old Stones.', flag: 'q_cuppa_water' },
        { id: 'brew', text: 'Bring all three back and let the groundskeeper brew it right.', flag: 'q_cuppa_brewed' },
      ],
      rewardItem: 'thermos',
      doneFlag: 'q_cuppa_done',
      caller: {
        name: 'The Groundskeeper',
        quote: "Forty years I've kept these grounds — let me keep YOU a minute. A brew for the whole party, hot all the way to Mars.",
        effect: { kind: 'heal', power: 410 },
      },
    }),

    /* ---- Ch.3 regional (local-person): free three letters the pillar box ate ---- */
    Q({
      id: 'return_to_sender',
      name: 'Return to Sender',
      chapter: 3,
      giver: 'fb_postmistress',
      startFlag: 'q_sender',
      objectives: [
        { id: 'l1', text: "A graded letter behind the bench on the green. (A child's drawing of a dog.)", flag: 'q_sender_l1' },
        { id: 'l2', text: 'A letter under a cobble at the quay. (A fisherman, to the river.)', flag: 'q_sender_l2' },
        { id: 'l3', text: 'A love letter in the back lane. Forty years late.', flag: 'q_sender_l3' },
        { id: 'report', text: 'Three letters, freed. Get them to the postmistress for delivery.', flag: 'q_sender_reported' },
      ],
      rewardItem: 'commemorative_tin',
      doneFlag: 'q_sender_done',
      caller: {
        name: 'The Postmistress',
        quote: "A box can grade a letter all it likes — it can't STOP one. Special delivery to the end of the world: send it everything.",
        effect: { kind: 'damage', power: 440 },
      },
    }),

    /* ---- Ch.3 regional (hidden-place): the damp boy's penny-tasting fog ---- */
    Q({
      id: 'penny_fog',
      name: 'The Penny Fog',
      chapter: 3,
      giver: 'fb_boy',
      startFlag: 'q_penny',
      objectives: [
        { id: 'find', text: 'The broken Roman drain on the moor, where the fog pools thick. Go and taste it.', flag: 'q_penny_found' },
        { id: 'report', text: 'Bring the boy his proof. (The rules are binding. He made them up.)', flag: 'q_penny_reported' },
      ],
      doneFlag: 'q_penny_done',
      caller: {
        name: 'The Penny-Fog Boy',
        quote: "I FLIPPED the lucky coin and it LANDED, and that means it's YOU! Take all my pennies — the heavy ones, the lucky ones, ALL of them!",
        effect: { kind: 'damage', power: 420 },
      },
    }),

    /* ---- Ch.3 regional (sincere): the cricket match the term won't let end ---- */
    Q({
      id: 'the_last_over',
      name: 'The Last Over',
      chapter: 3,
      giver: 'cricket_captain',
      startFlag: 'q_over',
      objectives: [
        { id: 'umpire', text: 'Find Mr. Stumps, filed ABSENT by the mainframe. (A form room, marked TRUANT.)', flag: 'q_over_umpire' },
        { id: 'clock', text: "The match can't end while the thing upstairs runs the clock. Stop it.", flag: 'q_over_clock' },
        { id: 'stumps', text: 'Umpire found, clock stopped. Tell the captain it can finally be STUMPS.', flag: 'q_over_called' },
      ],
      doneFlag: 'q_over_done',
      caller: {
        name: 'The Cricket Captain',
        quote: "STUMPS! We're going HOME — but first the whole First XI bowls for you, all eleven at once. Play it everywhere it hurts!",
        effect: { kind: 'damage', power: 450 },
      },
    }),

    /* ═══════════════ CHAPTER 4 — NORWAY (§A10) ═══════════════ *
     * Four §A10 quests, pinned both directions in content-validate. The route quest
     * (Sigrid's Spectacles, bible #9) turns pond-sized lenses into landmarks; a
     * delivery, a NOISE-themed restoration, and a scale-comedy picnic round it out.
     * Rewards reuse the live §A8 ch4 catalog; each completion is a finale CALLER. */

    /* ---- §A10 route quest (bible #9): the lenses scattered across Bootstep Moor ---- */
    Q({
      id: 'sigrids_spectacles',
      name: "Sigrid's Spectacles",
      chapter: 4,
      giver: 'kv_sigrid',
      startFlag: 'q_sigrid',
      objectives: [
        { id: 'lens1', text: "Sigrid's spectacles blew apart on the moor. One lens is pond-sized, out past the first bog.", flag: 'q_sigrid_lens1' },
        { id: 'lens2', text: 'The other lens caught the light from the high moor. (You can see the fjord through it. Sideways.)', flag: 'q_sigrid_lens2' },
        { id: 'report', text: 'Both lenses, ground back down to a size that fits. Bring them home to Sigrid.', flag: 'q_sigrid_reported' },
      ],
      rewardItem: 'sigrids_monocle',
      doneFlag: 'q_sigrid_done',
      caller: {
        name: 'Sigrid',
        quote: 'I can SEE the fjord again, every wave of it. Here — borrow my eyes for the dark place. Look at it dead-on for me.',
        effect: { kind: 'heal', power: 430 },
      },
    }),

    /* ---- §A10 delivery: a letter the fisher never had the nerve to send ---- */
    Q({
      id: 'unsent_letter',
      name: 'The Unsent Letter',
      chapter: 4,
      giver: 'kv_halvor',
      startFlag: 'q_letter',
      objectives: [
        { id: 'take', text: "Halvor wrote to his sweetheart in Lilleby forty years ago and never sent it. Take the letter.", flag: 'q_letter_taken' },
        { id: 'deliver', text: 'She lives in Lilleby now — and she is, like everything there, very large. Find her. (You may have to shout.)', flag: 'q_letter_delivered' },
        { id: 'report', text: 'Letter delivered. Go tell Halvor what she said. He has been waiting a long time to hear it.', flag: 'q_letter_reported' },
      ],
      rewardItem: 'cool_charm',
      doneFlag: 'q_letter_done',
      caller: {
        name: 'Halvor',
        quote: 'Forty years I sat on those words and she said them right back. Whatever you are facing — you are not facing it alone. Take some warmth.',
        effect: { kind: 'heal', power: 420 },
      },
    }),

    /* ---- §A10 regional (NOISE theme): the harbor bell the Hush muffled ---- */
    Q({
      id: 'the_silenced_bell',
      name: 'The Silenced Bell',
      chapter: 4,
      giver: 'kv_bellkeeper',
      startFlag: 'q_bell',
      objectives: [
        { id: 'clapper', text: "Kvisthavn's harbor bell has gone quiet — the Hush took its voice. The clapper rolled off the quay.", flag: 'q_bell_clapper' },
        { id: 'ring', text: 'Clapper recovered. Hang it, and ring the bell loud enough to be heard across the water.', flag: 'q_bell_rung' },
        { id: 'report', text: 'The harbor has its bell back. Tell the bellkeeper it rings true again.', flag: 'q_bell_reported' },
      ],
      rewardItem: 'brass_ships_bell',
      doneFlag: 'q_bell_done',
      caller: {
        name: 'The Bellkeeper',
        quote: 'A bell is a town saying I AM STILL HERE. Let me ring it for you — clear across the dark, so the quiet KNOWS we are coming.',
        effect: { kind: 'damage', power: 435 },
      },
    }),

    /* ---- §A10 regional (scale comedy): a picnic the giants can't get right ---- */
    Q({
      id: 'the_giants_picnic',
      name: "The Giant's Picnic",
      chapter: 4,
      giver: 'll_mayor',
      startFlag: 'q_picnic',
      objectives: [
        { id: 'brunost', text: 'Lilleby wants to welcome you with a picnic, human-sized. They need a wheel of brunost cut down to a slice you can lift.', flag: 'q_picnic_brunost' },
        { id: 'berry', text: 'And a berry. Just one. (A Dog-Sized Berry is, to a giant, a perfectly normal blueberry.)', flag: 'q_picnic_berry' },
        { id: 'set', text: 'Lay the little feast on the great table. The whole town will kneel to watch you eat it.', flag: 'q_picnic_set' },
      ],
      rewardItem: 'troll_cross',
      doneFlag: 'q_picnic_done',
      caller: {
        name: 'The Mayor of Lilleby',
        quote: 'EVERYTHING HERE IS NORMAL-SIZED, and so is our gratitude, which is to say ENORMOUS. The whole town sends its warmth, small friends!',
        effect: { kind: 'heal', power: 425 },
      },
    }),

    /* ═══════════════ CHAPTER 5 (Minimus) — the five §A10 quests ═══════════════ *
     * Tiny-but-procedural (§A6/§A11): a census that proves every dot has a name, the
     * colossus-footprint repairs, the cross-scale Lost & Found, the bell choir behind
     * Heartlight 5, and the minister's macro-lens portrait. Rewards reuse the live §A8
     * ch5 catalog; pinned both directions in tools/content-validate.ts like the rest. */

    /* ---- §A10 #11 — the royal census: count 100 citizens who will not stand still ---- */
    Q({
      id: 'royal_census',
      name: 'The Royal Census',
      chapter: 5,
      giver: 'mn_census',
      startFlag: 'q_census',
      objectives: [
        { id: 'market', text: 'Count the citizens of the market ward. They keep moving — and they keep insisting they have already been counted, by a cousin, last Tuesday.', flag: 'q_census_market' },
        { id: 'stamps', text: 'Count the ones who keep walking under the postage stamps. (A stamp is, to Minimus, a billboard. They like the shade.)', flag: 'q_census_stamps' },
        { id: 'report', text: 'Bring the full tally back to the Census-Taker. Every dot has a name; she would like them all written down.', flag: 'q_census_reported' },
      ],
      rewardItem: 'census_quill_charm',
      doneFlag: 'q_census_done',
      caller: {
        name: 'The Census-Taker',
        quote: 'All one hundred, present and named! When you need us — and you will — every last citizen of Minimus answers the roll. LOUDLY. We have been practising.',
        effect: { kind: 'heal', power: 440 },
      },
    }),

    /* ---- §A10 #12 — civic repairs: the shrink (and a few footsteps) broke things ---- */
    Q({
      id: 'civic_repairs',
      name: 'Civic Repairs',
      chapter: 5,
      giver: 'mn_engineer',
      startFlag: 'q_repairs',
      objectives: [
        { id: 'bridge', text: 'A colossus stepped clean through the knee-high bridge on the Procession Way. The engineers need it shimmed back level — gently.', flag: 'q_repairs_bridge' },
        { id: 'well', text: 'The thimble-well ran dry when the water table shrank with the rest. Prime it from a single, enormous dewdrop.', flag: 'q_repairs_well' },
        { id: 'scaffold', text: 'The matchstick scaffold by the cathedral came down in a sneeze. Re-stack it, splinter by splinter.', flag: 'q_repairs_scaffold' },
      ],
      rewardItem: 'signet_bracer',
      doneFlag: 'q_repairs_done',
      caller: {
        name: 'The Duchy Engineer',
        quote: 'Every bridge, every well, every scaffold — sound again, thanks to you. When the big trouble comes, the whole works pool will throw its weight behind you. Such as it is!',
        effect: { kind: 'damage', power: 450 },
      },
    }),

    /* ---- §A10 regional — THE LOST & FOUND OF IMPOSSIBLE SIZES (cross-scale returns) ---- */
    Q({
      id: 'lost_and_found',
      name: 'The Lost & Found of Impossible Sizes',
      chapter: 5,
      giver: 'mn_lostfound',
      startFlag: 'q_lostfound',
      objectives: [
        { id: 'button', text: 'A giant button sits in the lost & found — a shield to you, a manhole cover somewhere else. Pippa insists on returning it correctly, as a diplomatic matter.', flag: 'q_lostfound_button' },
        { id: 'spoon', text: 'A Minimus spoon turned up, which is — elsewhere — a perfect tuning fork. It hums a low A when you flick it. Find where it belongs.', flag: 'q_lostfound_spoon' },
        { id: 'filed', text: 'File each return with the clerk. Pippa drafts a treaty for every one. They are all, she says, technically diplomatic incidents.', flag: 'q_lostfound_filed' },
      ],
      rewardItem: 'gilt_thimble_collection',
      doneFlag: 'q_lostfound_done',
      caller: {
        name: 'The Lost & Found Clerk',
        quote: 'Everything returned to its proper size and station. The ledger BALANCES. Do you know how rare that is? Here — let the whole filed-and-found weight of the duchy land on your enemy.',
        effect: { kind: 'damage', power: 430 },
      },
    }),

    /* ---- §A10 regional — THE SILENT BELFRY: restore the bell choir (Heartlight 5) ---- */
    Q({
      id: 'the_silent_belfry',
      name: 'The Silent Belfry',
      chapter: 5,
      giver: 'mn_bellkeeper',
      startFlag: 'q_belfry',
      objectives: [
        { id: 'clappers', text: 'The shrink scattered the bell choir\'s clappers across the duchy. Recover them — each is a tuning fork to you, a cathedral bell to them.', flag: 'q_belfry_clappers' },
        { id: 'ring', text: 'Hang the clappers and ring the choir in order, lowest to highest. The duchy has been waiting forty quiet days to hear it.', flag: 'q_belfry_rung' },
      ],
      doneFlag: 'q_belfry_done',
      caller: {
        name: 'The Belfry Keeper',
        quote: 'Listen — the choir rings again, the whole duchy in tune at last. When you need it most, every bell in Minimus will ring for YOU. Ring true, small friend.',
        effect: { kind: 'heal', power: 455 },
      },
    }),

    /* ---- §A10 regional — SAY CHEESE, MINISTER: Mr. Click's macro-lens portrait ---- */
    Q({
      id: 'say_cheese_minister',
      name: 'Say Cheese, Minister',
      chapter: 5,
      giver: 'pw_click',
      startFlag: 'q_cheese',
      objectives: [
        { id: 'pose', text: 'Mr. Click wants the minister\'s portrait. Pippa stands on a thimble like a podium and tries very hard to be taken seriously. Hold still.', flag: 'q_cheese_pose' },
        { id: 'develop', text: 'Mr. Click develops the macro-lens plate. (It takes a while. The duchy is small; the patience is enormous.)', flag: 'q_cheese_developed' },
      ],
      rewardItem: 'lens_charm',
      doneFlag: 'q_cheese_done',
      caller: {
        name: 'Mr. Click',
        quote: 'The portrait hangs in the gallery — the Minister of Being Taken Seriously, life-size, which is to say enormous. Say the word and I\'ll blow it up even BIGGER. FLASH!',
        effect: { kind: 'damage', power: 425 },
      },
    }),
    // ── CHAPTER 6 (Africa) — §A10 the two named core quests: the watering-hole
    //    convoy (the Dockmaster) + the stones that speak (the Ruins Guide). Each
    //    banks a finale CALLER (§A6). Data-valid + givers placed in zanzibel (the
    //    Ch.5 census/belfry precedent — shipped as data, completability is map-light). ──
    Q({
      id: 'watering_hole_convoy',
      name: 'The Watering-Hole Convoy',
      chapter: 6,
      giver: 'zn_dockmaster',
      startFlag: 'q_convoy',
      objectives: [
        { id: 'reach', text: "Reach the Dockmaster's stranded caravan at the watering hole, out along the Savanna Run.", flag: 'q_convoy_reach' },
        { id: 'escort', text: 'See the convoy safe past the hyenas and back onto the track to Zanzibel.', flag: 'q_convoy_escort' },
      ],
      rewardItem: 'savanna_cloak',
      doneFlag: 'q_convoy_done',
      caller: {
        name: 'The Dockmaster',
        quote: 'The convoy made it — every axle, every drop of water, every nervous driver. When the desert closes on YOU, big friend, the whole Zanzibel road turns out to haul you clear. LOUDLY.',
        effect: { kind: 'heal', power: 460 },
      },
    }),
    Q({
      id: 'stones_that_speak',
      name: 'The Stones That Speak',
      chapter: 6,
      giver: 'zn_guide',
      startFlag: 'q_stones',
      objectives: [
        { id: 'listen', text: 'In the Laughing Ruins, listen to the echoing stones until they finish the sentence someone left half-said.', flag: 'q_stones_listen' },
        { id: 'carry', text: 'Carry what the stones remember back down to the Ruins Guide in Zanzibel.', flag: 'q_stones_carry' },
      ],
      rewardItem: 'griot_string',
      doneFlag: 'q_stones_done',
      caller: {
        name: 'The Ruins Guide',
        quote: 'The stones finished their sentence — after all these years — and went quiet, content. When you need a voice in the dark, the old city remembers how to answer. It will answer for YOU now.',
        effect: { kind: 'damage', power: 455 },
      },
    }),
    // ── CHAPTER 7 (India) — §A10 the two named core quests: Seven Spices (the Spice
    //    Merchant's bazaar-maze hunt) + The Monkey Who Stole Tuesday (the Dabbawala's
    //    rooftop chase). Each banks a finale CALLER (§A6). Data-valid + givers placed in
    //    chandrapore (the Ch.5/6 precedent — shipped as data, completability is map-light). ──
    Q({
      id: 'seven_spices',
      name: 'Seven Spices',
      chapter: 7,
      giver: 'cp_spice_merchant',
      startFlag: 'q_spices',
      objectives: [
        { id: 'gather', text: "Run the Spice Merchant's list through the Chandrapore bazaar maze and find all seven of his stolen spices.", flag: 'q_spices_gather' },
        { id: 'return', text: 'Carry the full set back to the Spice Merchant before the lunch rush.', flag: 'q_spices_return' },
      ],
      rewardItem: 'spice_box',
      doneFlag: 'q_spices_done',
      caller: {
        name: 'The Spice Merchant',
        quote: 'Seven spices, all seven, home before the rush — you did in an afternoon what the whole bazaar swore could not be done. When the cold gets into YOUR cooking, big friend, I will season the whole festival in your name.',
        effect: { kind: 'heal', power: 700 },
      },
    }),
    Q({
      id: 'monkey_who_stole_tuesday',
      name: 'The Monkey Who Stole Tuesday',
      chapter: 7,
      giver: 'cp_dabbawala',
      startFlag: 'q_monkey',
      objectives: [
        { id: 'chase', text: 'Chase the Monkey Magnate over the rooftops of Chandrapore — he took the Dabbawala\'s run AND your hat.', flag: 'q_monkey_chase' },
        { id: 'corner', text: 'Corner the Magnate on the cinema roof and get your hat back (and whatever else he is clutching).', flag: 'q_monkey_corner' },
      ],
      rewardItem: 'monkey_paw_charm',
      doneFlag: 'q_monkey_done',
      caller: {
        name: 'The Monkey Magnate',
        quote: '(Static. Then — breathing. Hard, ragged, rhythmic breathing, very close to the receiver. There are no words. There never were. It is, somehow, exactly the help you needed.)',
        effect: { kind: 'damage', power: 690 },
      },
    }),
    // ── CHAPTER 8 (China) — §A10 the named core quest: Brushes of Mt. Shu (the
    //    Calligrapher's three brushes, blown off her sill into the Spore Forest). Banks a
    //    finale CALLER (§A6) and rewards the reusable SCROLL OF CALM (cures Mushroomize,
    //    §A10 #17). Data-valid + giver placed in lotus_harbor (the Ch.5/6/7 precedent —
    //    shipped as data, completability is map-light). ──
    Q({
      id: 'brushes_of_mt_shu',
      name: 'Brushes of Mt. Shu',
      chapter: 8,
      giver: 'lh_calligrapher',
      startFlag: 'q_brushes',
      objectives: [
        { id: 'gather', text: "Find the Calligrapher's three brushes where the river wind scattered them through the Spore Forest.", flag: 'q_brushes_gather' },
        { id: 'return', text: 'Carry all three brushes back to the Calligrapher at Lotus Harbor before the temple banner is due.', flag: 'q_brushes_return' },
      ],
      rewardItem: 'scroll_of_calm',
      doneFlag: 'q_brushes_done',
      caller: {
        name: 'The Calligrapher',
        quote: 'Three brushes, all the way down off that wicked mountain, and not a bristle bent — you have a steady hand for great big things. When the world goes all sideways and swimming for YOU, child, hold still: I will draw you one calm line, and the muddle will settle.',
        effect: { kind: 'heal', power: 1400 },
      },
    }),

    /* ---- §A10 Ch.9 (Romania) — BUNI'S TABLE: the grandmother needs five things up the
     * valley for the TRUE Feast Basket. Giver placed in valea_stelelor. Reward the Feast
     * Basket recipe (basket_feast). She banks the warmest finale CALLER (the bible's base
     * ally — her feast heals the whole party clear across the sky). ---- */
    Q({
      id: 'bunis_table',
      name: "Buni's Table",
      chapter: 9,
      giver: 'vs_buni',
      startFlag: 'q_bunis',
      objectives: [
        { id: 'gather', text: 'Buni needs five things for the true Feast Basket — the sour cream, the cheese in the bark, the barrel cabbage, the smoked meat, the autumn plums — scattered up the valley. Bring them home.', flag: 'q_bunis_gather' },
        { id: 'cook', text: 'Carry the five back to Buni and sit at her table while she cooks the Feast Basket the way only she can.', flag: 'q_bunis_cook' },
      ],
      rewardItem: 'basket_feast',
      doneFlag: 'q_bunis_done',
      caller: {
        name: 'Buni',
        quote: "You go so far, draga mea, and you let yourself get so empty. Not while I am alive. Whenever you are hungry — wherever you are, even up among the cold stars — you sit, and you eat, and you let your Buni feed you full again.",
        effect: { kind: 'heal', power: 1900 },
      },
    }),

    /* ---- §A10 Ch.10 (Alaska) — LIGHTS OF AURORA: the Station Keeper's beacon line went
     * dark when the cold leaned in. Re-light the aurora-beacons so the snowcat road home
     * stays lit for the ones who come after. Giver placed at AURORA STATION. A map-light
     * data quest (the brushes_of_mt_shu / bunis_table precedent); banks a warm finale
     * CALLER — the keeper who keeps a light on for travellers (§A6). ---- */
    Q({
      id: 'lights_of_aurora',
      name: 'Lights of Aurora',
      chapter: 10,
      giver: 'as_keeper',
      startFlag: 'q_aurora',
      objectives: [
        { id: 'gather', text: 'Six of the Keeper\'s aurora-beacons went dark up the glacier when the cold got into the wiring. Gather their generator-coils back in off the ice field.', flag: 'q_aurora_gather' },
        { id: 'relight', text: 'Carry the coils back and re-light the beacon line, so the snowcat road home stays lit for whoever comes down it after you.', flag: 'q_aurora_relit' },
      ],
      rewardItem: 'aurora_cocoa',
      doneFlag: 'q_aurora_done',
      caller: {
        name: 'The Station Keeper',
        quote: 'The whole line is lit again — green all the way down the glacier, like the lights came indoors. A keeper keeps ONE thing, child: a light on for whoever\'s still out in the cold. Let me keep one on for you, all the way out to Mars.',
        effect: { kind: 'heal', power: 2000 },
      },
    }),

    /* ---- §A10 Ch.10 (Hawaii) — THE LAST WAVE: Pemberton's rocket is one stage short, its
     * parts scattered down the lava flats by the last test-fire. Round up the manifest and
     * give The Long Shot its final stage — his best shot, and the kids', off the Mauna Lani
     * pad. Giver placed at MAUNA LANI. Map-light data quest; banks a damage finale CALLER
     * (the rocketeer firing the whole launch at the dark) (§A6). ---- */
    Q({
      id: 'the_last_wave',
      name: 'The Last Wave',
      chapter: 10,
      giver: 'ml_pemberton',
      startFlag: 'q_last_wave',
      objectives: [
        { id: 'gather', text: "The Long Shot is one stage short — Pemberton's final-stage parts blew clear down the magma flats in the last test-fire. Round up every line item on his manifest.", flag: 'q_last_wave_gather' },
        { id: 'fit', text: 'Haul the parts back to the gantry and watch Pemberton bolt the last stage on, muttering the whole time, hands perfectly steady.', flag: 'q_last_wave_fit' },
      ],
      rewardItem: 'rocket_manifest',
      doneFlag: 'q_last_wave_done',
      caller: {
        name: 'Pemberton',
        quote: "She's whole! Every bolt, every stage, the WHOLE Long Shot! Listen — I built one good rocket in my life and I aimed it at the cold for YOU. When the dark closes in, you say the word and I light the whole launch off in its face. FOR THE KIDS!",
        effect: { kind: 'damage', power: 2200 },
      },
    }),
  ].map((q) => [q.id, q]),
);
