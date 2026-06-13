/**
 * AWAKENINGS — story-triggered Vibe grants (S12b, ADR-035; GAME_BIBLE §A3
 * as amended). Heroes no longer start with Vibe: the old light arrives at
 * STORY MOMENTS, each one scene-staged and §A11.2-sincere, so every ability
 * is an event — not a menu row that was always there.
 *
 * The grant is a FLAG on the save (the Homesick pattern — flags ride free),
 * and availability = level unlocks ∪ awakened flags. The v5→v6 migration
 * backfills flags from story flags, so an old save that already watched the
 * prophecy keeps the Surge it had.
 *
 * Ch.1 ships three (the validator pins them; chapter sessions add theirs —
 * the §A3 amendment sketches the full arc):
 *   old_light    — Glint's prophecy at the crater hands Jay VIBE SURGE α,
 *                  one beat before the Tick that the Surge can answer
 *                  (it severs the latch — §A6 amended; the awakening IS
 *                  the tutorial for the fight that follows).
 *   last_spark   — the bug zapper takes Glint; his spark settles into Jay
 *                  as LIFEUP α (healing born of grief, played straight)
 *                  alongside the GLINT'S SPARK item the beat already gave.
 *   first_listen — Mia touches the Star Locket in the holding room and
 *                  hears Heartlight #1 — a note like a struck match: VIBE
 *                  FIRE α ("hears the Embers sing", §A3, made literal).
 */
import type { AwakeningDef, HeroId } from '../schemas';

export type { AwakeningDef } from '../schemas';

const W = (a: AwakeningDef): AwakeningDef => a;

export const AWAKENINGS: Record<string, AwakeningDef> = Object.fromEntries(
  [
    W({
      id: 'old_light',
      hero: 'rex',
      ability: 'vibe_surge_a',
      flag: 'awake_surge_a',
      dialogue: 'awake_old_light',
      toast: '{rex} awakened VIBE SURGE Alpha!',
    }),
    W({
      id: 'last_spark',
      hero: 'rex',
      ability: 'lifeup_a',
      flag: 'awake_lifeup_a',
      dialogue: 'awake_last_spark',
      toast: '{rex} awakened LIFEUP Alpha!',
    }),
    W({
      id: 'first_listen',
      hero: 'faye',
      ability: 'vibe_fire_a',
      flag: 'awake_fire_a',
      dialogue: 'awake_first_listen',
      toast: '{faye} awakened VIBE FIRE Alpha!',
    }),
    /* ---- Ch.2 (S14, the §A3 amendment's arc): the HOLLOW reveal ----
     * cold_reads — the Gilded Grin swaps and the gold turns out to be
     * EMPTY. Mia, who hears the Embers sing, hears the nothing inside it
     * first: VIBE FREEZE α arrives mid-battle ("cold reads what gold
     * hides"), staged sincere (§A11.2). Freeze α leaves her L12 unlock
     * row in the same commit — one path only, validator-pinned. */
    W({
      id: 'cold_reads',
      hero: 'faye',
      ability: 'vibe_freeze_a',
      flag: 'awake_freeze_a',
      dialogue: 'awake_cold_reads',
      toast: '{faye} awakened VIBE FREEZE Alpha!',
    }),
    /* ---- S16 ("The Old Light, Doubled"): Jay's three iconic late beats. The
     * 80/20 split (§3) reserves AWAKENINGS for the powers that should land as
     * MOMENTS, not level-up toasts. Each is staged §A11.2-sincere; none of the
     * three abilities appears in HEROES.rex.unlocks (one-path rule). They sit
     * mid-to-late, where the §A6 arc has room (see the dialogue + the chapter
     * notes in the build prompt §6). */
    W({
      // a Resonance Site where the Hush has hollowed a crowd into one droning
      // voice. To pass, Jay does the unthinkable — borrows ONE of those voices
      // and turns it. Uneasy, not triumphant: it mirrors what the villain does.
      id: 'the_borrowed_voice',
      hero: 'rex',
      ability: 'mindwarp_o',
      flag: 'awake_mindwarp_o',
      dialogue: 'awake_the_borrowed_voice',
      toast: '{rex} learned to borrow a voice…',
    }),
    W({
      // after a boss nearly wipes the party with an unblockable-looking AoE,
      // Jay instinctively throws up a wall that BOUNCES it back, saving everyone.
      id: 'the_wall_that_answers',
      hero: 'rex',
      ability: 'powershield_s',
      flag: 'awake_powershield_s',
      dialogue: 'awake_the_wall_that_answers',
      toast: '{rex} raised the wall that answers!',
    }),
    W({
      // the Mars approach: every porch light, every friend, the whole homeward
      // road surges through him at once. The "fully powered up" moment.
      id: 'the_whole_sky',
      hero: 'rex',
      ability: 'vibe_surge_x',
      flag: 'awake_surge_x',
      dialogue: 'awake_the_whole_sky',
      toast: '{rex} let the WHOLE SKY surge!',
    }),
  ].map((a) => [a.id, a]),
);

/** abilities a hero's awakening flags have granted (order = table order) */
export function awakenedAbilities(heroId: HeroId, flagOf: (flag: string) => boolean): string[] {
  return Object.values(AWAKENINGS)
    .filter((a) => a.hero === heroId && flagOf(a.flag))
    .map((a) => a.ability);
}
