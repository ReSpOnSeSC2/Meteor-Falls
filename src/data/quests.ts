/**
 * Side quests — GAME_BIBLE §A10 #1–3 (S9, Bible Prompt 26 + Prompt 11 shape).
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
  ].map((q) => [q.id, q]),
);
