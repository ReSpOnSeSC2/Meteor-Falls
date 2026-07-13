/** Pure Chapter 6 world gates, kept out of Phaser for regression tests. */

export interface Chapter6ChoiceState {
  heldBreathUnlocked: boolean;
  choiceDecided: boolean;
}

export type Chapter6ChoiceAction = 'already-decided' | 'held-breath-required' | 'present-choice';

/** The Trust dilemma is never legal before the Locket can record its echo. */
export function chapter6ChoiceAction(state: Chapter6ChoiceState): Chapter6ChoiceAction {
  if (state.choiceDecided) return 'already-decided';
  return state.heldBreathUnlocked ? 'present-choice' : 'held-breath-required';
}
