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
        { id: 'pickles', text: "A letter for the Pickles'. Slip it past Chad's victory speech.", flag: 'q_mail_pickles' },
        { id: 'sodd', text: "A letter for Mr. Sodd. His lawnmower has opinions about the lawn.", flag: 'q_mail_sodd' },
        { id: 'birch', text: 'A letter for the Birch place. The tidy one.', flag: 'q_mail_birch' },
        { id: 'chapel', text: 'A letter for the chapel. He gets his mail like everyone else.', flag: 'q_mail_chapel' },
        { id: 'arcade', text: 'A bill for the STARPORT. Arcades get mail. Mostly threats.', flag: 'q_mail_arcade' },
        { id: 'report', text: 'Tell Mr. Plummer the route moved.', flag: 'q_mail_reported' },
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
        { id: 'lemons', text: 'City lemons from STARMART in Brickton. Fancier. Lemonier.', flag: 'q_lem_lemons' },
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

    /* ---- §A10 #4 — beat the Brickton arcade high score (replayable) ----
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
  ].map((q) => [q.id, q]),
);
