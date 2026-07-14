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
import { CHAPTER_MANIFESTS } from '../data/chapters';

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

  it('pins both Chapter 6 rewards and caller effects, with idempotent completion', () => {
    expect(completeQuest('watering_hole_convoy')).toBe('ok');
    expect(GS.hasItem('savanna_cloak')).toBe(true);
    expect(GS.data.callers[0]).toMatchObject({
      quest: 'watering_hole_convoy', effect: { kind: 'heal', power: 460 },
    });
    expect(completeQuest('stones_that_speak')).toBe('ok');
    expect(GS.hasItem('griot_string')).toBe(true);
    expect(GS.data.callers[1]).toMatchObject({
      quest: 'stones_that_speak', effect: { kind: 'damage', power: 455 },
    });
    expect(completeQuest('watering_hole_convoy')).toBe('already');
    expect(completeQuest('stones_that_speak')).toBe('already');
    expect(GS.data.callers).toHaveLength(2);
  });

  it('keeps a Chapter 6 quest retryable when every bag is full', () => {
    for (const hero of GS.data.party) while (hero.bag.length < BAG_MAX) hero.bag.push('pbj');
    expect(completeQuest('stones_that_speak')).toBe('hands-full');
    expect(GS.flag('q_stones_done')).toBe(false);
    expect(GS.data.callers).toHaveLength(0);
    GS.data.party[0].bag.pop();
    expect(completeQuest('stones_that_speak')).toBe('ok');
    expect(GS.hasItem('griot_string')).toBe(true);
    expect(GS.data.callers).toHaveLength(1);
  });

  it('pins exactly five Chapter 7 quest contracts, rewards, and caller strengths', () => {
    const ids = [
      'seven_spices',
      'monkey_who_stole_tuesday',
      'the_last_showing',
      'third_class_rules',
      'the_river_remembers',
    ];
    expect(CHAPTER_MANIFESTS['7'].quests).toEqual(ids);
    expect(Object.values(QUESTS).filter((quest) => quest.chapter === 7).map((quest) => quest.id)).toEqual(ids);

    for (const id of ids) expect(completeQuest(id)).toBe('ok');
    expect(ids.map((id) => QUESTS[id].rewardItem)).toEqual([
      'spice_box', 'monkey_paw_charm', 'cinema_stub', 'star_pendant', 'brass_elephant',
    ]);
    expect(GS.data.callers.map(({ quest, name, effect }) => ({ quest, name, effect }))).toEqual([
      { quest: 'seven_spices', name: 'The Spice Merchant', effect: { kind: 'heal', power: 700 } },
      { quest: 'monkey_who_stole_tuesday', name: 'The Monkey Magnate', effect: { kind: 'damage', power: 690 } },
      { quest: 'the_last_showing', name: 'The Majestic Usher', effect: { kind: 'heal', power: 680 } },
      { quest: 'third_class_rules', name: 'The Stationmaster', effect: { kind: 'damage', power: 710 } },
      { quest: 'the_river_remembers', name: 'The Ghat Elder', effect: { kind: 'heal', power: 720 } },
    ]);
    for (const id of ids) expect(completeQuest(id)).toBe('already');
    expect(GS.data.callers).toHaveLength(5);
  });

  it('keeps every Chapter 7 reward and caller retryable when the bag is full', () => {
    const ids = [
      'seven_spices',
      'monkey_who_stole_tuesday',
      'the_last_showing',
      'third_class_rules',
      'the_river_remembers',
    ];
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');

    for (const id of ids) {
      const doneFlag = QUESTS[id].doneFlag;
      expect(completeQuest(id)).toBe('hands-full');
      expect(GS.flag(doneFlag)).toBe(false);
      expect(callerEarned(id)).toBe(false);
    }

    rex.bag.pop();
    expect(completeQuest('the_last_showing')).toBe('ok');
    expect(GS.hasItem('cinema_stub')).toBe(true);
    expect(callerEarned('the_last_showing')).toBe(true);
  });

  it('pins exactly five Chapter 8 quest contracts, rewards, and caller strengths', () => {
    const ids = [
      'brushes_of_mt_shu',
      'lanterns_of_the_false_fold',
      'the_yak_who_waits',
      'the_harbors_balance',
      'tea_for_the_empty_chair',
    ];
    expect(CHAPTER_MANIFESTS['8'].quests).toEqual(ids);
    expect(Object.values(QUESTS).filter((quest) => quest.chapter === 8).map((quest) => quest.id)).toEqual(ids);
    expect(ids.map((id) => QUESTS[id].giver)).toEqual([
      'lh_calligrapher',
      'lh_lantern_girl',
      'lh_yak_handler',
      'lh_harbor_master',
      'lh_tea_monk',
    ]);
    expect(ids.map((id) => QUESTS[id].rewardItem)).toEqual([
      'scroll_of_calm',
      'paper_crane_charm',
      'jade_salamander_charm',
      'river_beads',
      'temple_incense',
    ]);

    for (const id of ids) expect(completeQuest(id)).toBe('ok');
    expect(GS.data.callers.map(({ quest, name, effect }) => ({ quest, name, effect }))).toEqual([
      { quest: 'brushes_of_mt_shu', name: 'The Calligrapher', effect: { kind: 'heal', power: 1400 } },
      { quest: 'lanterns_of_the_false_fold', name: 'The Lantern Girl', effect: { kind: 'damage', power: 820 } },
      { quest: 'the_yak_who_waits', name: 'The Yak Handler', effect: { kind: 'damage', power: 880 } },
      { quest: 'the_harbors_balance', name: 'The Harbor Master', effect: { kind: 'damage', power: 900 } },
      { quest: 'tea_for_the_empty_chair', name: 'The Tea-House Monk', effect: { kind: 'heal', power: 960 } },
    ]);
    for (const id of ids) expect(completeQuest(id)).toBe('already');
    expect(GS.data.callers).toHaveLength(5);
  });

  it('keeps every Chapter 8 reward and caller retryable when all bags are full', () => {
    const ids = [
      'brushes_of_mt_shu',
      'lanterns_of_the_false_fold',
      'the_yak_who_waits',
      'the_harbors_balance',
      'tea_for_the_empty_chair',
    ];
    for (const hero of GS.data.party) while (hero.bag.length < BAG_MAX) hero.bag.push('pbj');

    for (const id of ids) {
      expect(completeQuest(id)).toBe('hands-full');
      expect(GS.flag(QUESTS[id].doneFlag)).toBe(false);
      expect(callerEarned(id)).toBe(false);
    }

    GS.data.party[0].bag.pop();
    expect(completeQuest('tea_for_the_empty_chair')).toBe('ok');
    expect(GS.hasItem('temple_incense')).toBe(true);
    expect(callerEarned('tea_for_the_empty_chair')).toBe(true);
  });
});
