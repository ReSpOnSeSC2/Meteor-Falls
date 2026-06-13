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
        { id: 'pickles', text: "A letter for the Pickles'. Slide it past the victory speech.", flag: 'q_mail_pickles' },
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
  ].map((q) => [q.id, q]),
);
