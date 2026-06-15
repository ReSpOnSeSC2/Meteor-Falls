/**
 * STAGED CUTSCENES — the in-engine, director-driven scenes (engine/cutsceneStage.ts).
 * Each is an imperative beat-sheet so the project lead blocks it by hand. They
 * compose painted cards (the stills) with live sprite acting — the hybrid.
 */
import type { Director } from '../engine/cutsceneStage';
import { DIALOGUE } from './dialogue';

/**
 * Ch.1 CLOSE — THE FIRST HEARTLIGHT, as a hybrid: the painted panel establishes
 * the Resonance Site "for a second," then we CUT to live actors — {faye} (Mia)
 * crosses to the Ember, kneels to listen, hums its note back, and the first
 * Heartlight wakes while {rex} watches. Lines are the canon
 * `awake_the_first_heartlight` beat.
 */
export async function ch1FirstHeartlight(d: Director): Promise<void> {
  const L = DIALOGUE.awake_the_first_heartlight;

  // 1) establish with the painted still
  await d.card('first_heartlight', {
    caption: 'The Resonance Site. The night it all begins.',
  });

  // 2) cut to the in-engine set + actors
  d.music('starfall');
  d.set('chamber');
  const ember = d.glow(230, 150, { r: 5 });
  const mia = d.actor('faye', { x: 300, y: 150, facing: 'left', scale: 2 });
  const rex = d.actor('rex', { x: 92, y: 154, facing: 'right', scale: 2 });
  await d.wait(450);

  await d.say(L[0]); // the site holds its breath; the Ember hums an apology
  await mia.moveTo(252, 1100); // she crosses to the Ember
  mia.face('left');
  mia.emote('think');
  await d.say(L[1]); // {faye} kneels and listens the way she prays
  await d.say(L[2]); // @...Oh, you poor thing.

  d.sfx('ember');
  d.sparkle(230, 150, 10);
  await d.say(L[3]); // she hums it back, once

  d.flash(420);
  d.shake(440, 0.006);
  ember.brighten();
  await d.say(L[4]); // the dark flinched — a light it cannot eat

  mia.emote('happy');
  rex.emote('surprise');
  await d.say(L[5]); // @Okay. I can carry that one. Sing it again.
  await d.wait(700);
}
