import { describe, expect, it } from 'vitest';
import { DIALOGUE } from '../data/dialogue';
import {
  CH8_CLICKER_CALLER,
  PIPPA_RECONCILIATION_REWIND_CAP,
  decidePippaOutcome,
  decidePippaOutcomeFromFlags,
  planCh8Story,
  reconcileCh8ClickerCaller,
} from './ch8Story';

describe('Chapter 8 story prerequisite planning', () => {
  it('stages real missing scenes in the frozen frontier chronology', () => {
    const none = (): boolean => false;
    expect(planCh8Story('lotus_orientation', none).map((beat) => beat.id)).toEqual([
      'trust_open', 'trust_esc_norway', 'trust_esc_minimus',
    ]);
    expect(planCh8Story('lotus_clicker', none).map((beat) => beat.id)).toEqual(['clicker_seed']);
    expect(planCh8Story('bamboo_trust', none).map((beat) => beat.id)).toEqual([
      'trust_open', 'trust_esc_norway', 'trust_esc_minimus', 'trust_esc_africa',
    ]);
    expect(planCh8Story('bamboo_lock', none).map((beat) => beat.id)).toEqual([
      'clicker_seed', 'clicker_crisis', 'clicker_clearing',
    ]);
    const spore = planCh8Story('spore_forest', none).map((beat) => beat.id);
    expect(spore[spore.length - 1]).toBe('trust_esc_india');
    expect(planCh8Story('mt_shu', none).map((beat) => beat.id).slice(-2)).toEqual([
      'trust_climax', 'trust_resolve',
    ]);
  });

  it('skips watched beats, repairs genuine gaps, and never invents a choice flag', () => {
    const set = new Set(['thread_trust_open', 'thread_trust_esc2', 'thread_clicker_seed']);
    const plan = planCh8Story('lotus_orientation', (flag) => set.has(flag));
    expect(plan.map((beat) => beat.id)).toEqual(['trust_esc_norway']);
    expect(plan.every((beat) => beat.flag.startsWith('thread_'))).toBe(true);
    expect(plan.some((beat) => beat.flag === 'axis_trust_free' || beat.flag === 'axis_trust_strings')).toBe(false);
    expect(planCh8Story('bamboo_lock', (flag) => flag === 'thread_clicker_seed').map((beat) => beat.id)).toEqual([
      'clicker_crisis', 'clicker_clearing',
    ]);
    expect(planCh8Story('bamboo_lock', (): boolean => false).find((beat) => beat.id === 'clicker_clearing')?.caller)
      .toBe('lotus_bargeman');
  });

  it('repairs a clearing-without-Caller seam and collapses legacy duplicates exactly once', () => {
    expect(reconcileCh8ClickerCaller([], false)).toEqual([]);
    expect(reconcileCh8ClickerCaller([], true)).toEqual([CH8_CLICKER_CALLER]);
    expect(reconcileCh8ClickerCaller([CH8_CLICKER_CALLER], false)).toEqual([]);
    const other = {
      quest: 'side:other', name: 'Other', quote: 'Still here.',
      effect: { kind: 'damage' as const, power: 1 },
    };
    const repaired = reconcileCh8ClickerCaller([
      other,
      CH8_CLICKER_CALLER,
      { ...CH8_CLICKER_CALLER, quote: 'duplicate' },
    ], true);
    expect(repaired.filter((caller) => caller.quest === 'thread:clicker')).toHaveLength(1);
    expect(repaired[0]).toEqual(other);
    expect(repaired[1]).toEqual(CH8_CLICKER_CALLER);
  });
});

describe('Chapter 8 Pippa outcome decision', () => {
  const base = {
    choiceDecided: true,
    trustFree: false,
    trustStrings: false,
    reconciled: false,
    rewindCount: 0,
  };

  it('keeps FREE warm and keeps reconciled STRINGS only within the rewind cap', () => {
    expect(decidePippaOutcome({ ...base, trustFree: true })).toBe('stay');
    expect(decidePippaOutcome({
      ...base,
      trustStrings: true,
      reconciled: true,
      rewindCount: PIPPA_RECONCILIATION_REWIND_CAP,
    })).toBe('stay');
    expect(decidePippaOutcome({
      ...base,
      trustStrings: true,
      reconciled: true,
      rewindCount: PIPPA_RECONCILIATION_REWIND_CAP + 1,
    })).toBe('depart');
  });

  it('departs only coherent decided STRINGS and preserves undecided/contradictory state', () => {
    expect(decidePippaOutcome({ ...base, trustStrings: true })).toBe('depart');
    expect(decidePippaOutcome({ ...base, choiceDecided: false, trustStrings: true })).toBe('preserve');
    expect(decidePippaOutcome({ ...base })).toBe('preserve');
    expect(decidePippaOutcome({ ...base, trustFree: true, trustStrings: true })).toBe('preserve');
    expect(decidePippaOutcome({ ...base, trustStrings: true, rewindCount: -1 })).toBe('preserve');
  });

  it('pins the real save-facing choice, reconciliation, and rewind inputs', () => {
    const flags = new Set(['ch6_string_decided', 'axis_trust_strings', 'pippa_reconciled']);
    expect(decidePippaOutcomeFromFlags((flag) => flags.has(flag), 2)).toBe('stay');
    flags.delete('pippa_reconciled');
    expect(decidePippaOutcomeFromFlags((flag) => flags.has(flag), 2)).toBe('depart');
    flags.delete('ch6_string_decided');
    expect(decidePippaOutcomeFromFlags((flag) => flags.has(flag), 2)).toBe('preserve');
  });
});

describe('Chapter 8 runtime dialogue seams', () => {
  it('authors travel, thread, Pippa, and every quest state used by runtime wiring', () => {
    const ids = [
      'ch8_riverboat_handoff', 'ch8_riverboat_board', 'ch8_riverboat_return',
      'ch8_arrival', 'ch8_yak_depart', 'ch8_yak_arrive', 'ch8_lock_footprint',
      'ch8_trust_open', 'ch8_trust_esc1', 'ch8_trust_esc2', 'ch8_trust_esc3',
      'ch8_trust_esc4', 'ch8_trust_climax', 'ch8_trust_resolve_free',
      'ch8_trust_resolve_strings_stay', 'ch8_trust_resolve_strings_leave',
      'ch8_trust_resolve_neutral', 'ch8_clicker_seed', 'ch8_clicker_crisis',
      'ch8_clicker_clearing', 'ch8_trust_esc4_elder', 'ch8_pippa_creases', 'ch8_pippa_creases_elder',
      'ch8_false_folds_pippa', 'ch8_false_folds_elder',
      'ch8_elder_teleport_beta', 'paper_dragon_door_pippa', 'paper_dragon_door_elder',
      'q_brushes_start', 'q_brushes_active', 'q_brushes_river', 'q_brushes_kiln',
      'q_brushes_cloud', 'q_brushes_gathered', 'q_brushes_full', 'q_brushes_done',
      'q_brushes_post', 'q_brushes_footprint_banner', 'q_brushes_footprint_rack',
      'q_false_fold_start', 'q_false_fold_active', 'q_false_fold_read', 'q_false_fold_refold',
      'q_false_fold_lantern_1', 'q_false_fold_lantern_2', 'q_false_fold_lantern_3',
      'q_false_fold_full', 'q_false_fold_done', 'q_false_fold_post', 'q_false_fold_footprint',
      'q_yak_waits_start', 'q_yak_waits_treats_full', 'q_yak_waits_active', 'q_yak_waits_feed',
      'q_yak_waits_route', 'q_yak_waits_full', 'q_yak_waits_done', 'q_yak_waits_post',
      'q_yak_waits_footprint', 'q_harbor_balance_start', 'q_harbor_balance_active',
      'q_harbor_balance_weights', 'q_harbor_balance_delivered', 'q_harbor_balance_full',
      'q_harbor_balance_weight_1', 'q_harbor_balance_weight_2',
      'q_harbor_balance_done', 'q_harbor_balance_post', 'q_harbor_balance_footprint',
      'q_empty_chair_start', 'q_empty_chair_active', 'q_empty_chair_brewed',
      'q_empty_chair_offered', 'q_empty_chair_full', 'q_empty_chair_done',
      'q_empty_chair_post', 'q_empty_chair_footprint',
    ];
    for (const id of ids) expect(DIALOGUE[id]?.length, id).toBeGreaterThan(0);
    expect(DIALOGUE.bert_china_ask.join(' ')).toContain('riverboat');
    expect(DIALOGUE.ch8_arrival[0]).toContain('riverboat');
    expect(DIALOGUE.ch8_clicker_clearing.join(' ')).toMatch(/LEFT:.*A:.*RIGHT:.*DOWN:/);
    expect(DIALOGUE.ch8_yak_depart.join(' ')).not.toMatch(/feed|treat/i);
    expect(DIALOGUE.ch8_yak_depart.join(' ')).toContain('knows this road already');
  });
});
