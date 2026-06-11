/**
 * S9 — quest engine behavior (Bible Prompt 26): status derivation from
 * flags, the journal's current-objective walk, completion through the
 * S3/S4 bag flow (hands-full BLOCKS — zero missables), and the CALLER
 * ledger freeze. Existence/cross-ref truth lives in the validator (S5).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GS } from './state';
import { QUESTS } from '../data/quests';
import {
  callerEarned,
  completeQuest,
  currentObjective,
  journalQuests,
  questStatus,
} from './quests';
import { BAG_MAX } from '../data/items';

const biscuit = QUESTS.biscuit_come_home;
const mail = QUESTS.mail_must_move;
const lemonade = QUESTS.lemonade_empire;

beforeEach(() => GS.reset());

describe('quest status derives from flags alone', () => {
  it('unstarted → active → done as startFlag/doneFlag land', () => {
    expect(questStatus(biscuit)).toBe('unstarted');
    GS.setFlag(biscuit.startFlag);
    expect(questStatus(biscuit)).toBe('active');
    GS.setFlag(biscuit.doneFlag);
    expect(questStatus(biscuit)).toBe('done');
  });

  it('the journal lists only started quests, in §A10 order', () => {
    expect(journalQuests()).toEqual([]);
    GS.setFlag(mail.startFlag);
    GS.setFlag(biscuit.startFlag);
    const rows = journalQuests();
    expect(rows.map((r) => r.def.id)).toEqual(['biscuit_come_home', 'mail_must_move']);
  });

  it('currentObjective walks the machine step by step', () => {
    GS.setFlag(biscuit.startFlag);
    expect(currentObjective(biscuit)?.id).toBe('trailhead');
    GS.setFlag('q_biscuit_c1');
    expect(currentObjective(biscuit)?.id).toBe('hill');
    GS.setFlag('q_biscuit_c2');
    GS.setFlag('q_biscuit_c3');
    expect(currentObjective(biscuit)?.id).toBe('report');
    GS.setFlag('q_biscuit_walked');
    expect(currentObjective(biscuit)).toBeNull();
  });
});

describe('completeQuest — rewards via the bag flow, callers onto the ledger', () => {
  it('grants the reward, sets doneFlag, freezes the §A10 caller record', () => {
    expect(completeQuest('biscuit_come_home')).toBe('ok');
    expect(GS.hasItem('lucky_collar')).toBe(true);
    expect(GS.flag(biscuit.doneFlag)).toBe(true);
    expect(callerEarned('biscuit_come_home')).toBe(true);
    expect(GS.data.callers[0]).toEqual({
      quest: 'biscuit_come_home',
      name: 'Mrs. Pemmel',
      quote: biscuit.caller.quote,
      effect: { kind: 'damage', power: 400 },
    });
  });

  it('a full bag BLOCKS completion — nothing commits, retry works (§B4 zero missables)', () => {
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) GS.addItem('pbj');
    expect(completeQuest('mail_must_move')).toBe('hands-full');
    expect(GS.flag(mail.doneFlag)).toBe(false);
    expect(GS.data.callers).toHaveLength(0);
    // make room, try again — the giver kept the reward warm
    GS.removeItem('pbj');
    expect(completeQuest('mail_must_move')).toBe('ok');
    expect(GS.hasItem('fresh_stamps')).toBe(true);
    expect(callerEarned('mail_must_move')).toBe(true);
  });

  it('a rewardless quest (the stand IS the reward) still records its callers', () => {
    expect(lemonade.rewardItem).toBeUndefined();
    expect(completeQuest('lemonade_empire')).toBe('ok');
    expect(GS.data.callers[0].name).toBe('Ana & Vivi');
    expect(GS.data.callers[0].effect.kind).toBe('heal');
  });

  it('double-completion is inert — one caller per quest, ever', () => {
    expect(completeQuest('lemonade_empire')).toBe('ok');
    expect(completeQuest('lemonade_empire')).toBe('already');
    expect(GS.data.callers).toHaveLength(1);
  });

  it('the ledger keeps completion ORDER — the finale dials in earned order', () => {
    completeQuest('lemonade_empire');
    completeQuest('biscuit_come_home');
    completeQuest('mail_must_move');
    expect(GS.data.callers.map((c) => c.quest)).toEqual([
      'lemonade_empire',
      'biscuit_come_home',
      'mail_must_move',
    ]);
  });

  it('ledger records are copies — later data edits cannot rewrite history', () => {
    completeQuest('biscuit_come_home');
    const frozen = GS.data.callers[0];
    expect(frozen.effect).not.toBe(biscuit.caller.effect); // distinct object
    expect(frozen.effect).toEqual(biscuit.caller.effect); // same values
  });
});
