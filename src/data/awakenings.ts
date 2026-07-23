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
      toast: '{rex} awakened VIBE SURGE Alpha! Choose VIBE on the next turn.',
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
    /* ---- Ch.3 (S18 M27, ADR-068): THE FIRST BORROW — the CONTROL SYSTEM unlocks
     * on the party hitting three (Milo joins). Jay's Hypno line takes its higher
     * turn: PUPPET (mind control of PEOPLE on the field) and Mind Warp (turn an
     * enemy in battle) are ONE staged power — `mindwarp_a`, re-staged here off its
     * old L21 unlock (engine id frozen; only the timing moved). The OTHER heroes
     * SEE him use it for the first time and pull back a step — the TRUST THREAD
     * opens here (the borrowed stranger comes back rattled), §A11.2 sincere. The
     * DEAD-AIR HELMET (`mind_immune`) is the single counter, battle + field. */
    W({
      id: 'the_first_borrow',
      hero: 'rex',
      ability: 'mindwarp_a',
      flag: 'awake_mindwarp_a',
      dialogue: 'awake_the_first_borrow',
      toast: '{rex} learned to PUPPET — borrow a person, briefly…',
    }),
    /* ---- Ch.4 (Norway, S?? — the chapter landing): THE THUNDER-SNORE. The
     * Whisperwig burrows in the Sleeper's ear, untargetable, until NOISE drags it
     * out — and the FIRST time it surfaces, the thunder-snore Mia feels rolling up
     * through the mountain's teeth becomes a charge she can throw: VIBE VOLT α
     * (§A6 Ch.4 boss, staged §A11.2-sincere; bosses.ts awakeningOnForm fires it).
     * vibe_volt_a LEAVES her HEROES.faye.unlocks row in the same commit (one-path
     * rule); verify.ts AWAKENING_LEVEL pins it at L20 so the balance read is
     * unchanged (she has Volt by L22, the Ch.4 target, either way). */
    W({
      id: 'the_thunder_snore',
      hero: 'faye',
      ability: 'vibe_volt_a',
      flag: 'awake_volt_a',
      dialogue: 'awake_the_thunder_snore',
      toast: '{faye} awakened VIBE VOLT Alpha! ⚡',
    }),
    /* ---- Ch.8: THE SHORT STEP. Teleport Alpha remains Jay's L26 row; Beta
     * has exactly one path, the Mt. Shu elder's story lesson. */
    W({
      id: 'awake_teleport_b',
      hero: 'rex',
      ability: 'teleport_b',
      flag: 'awake_teleport_b',
      dialogue: 'awake_teleport_b',
      toast: '{rex} awakened TELEPORT Beta!',
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
    /* ---- MIA ("Ability Expansion"): her three iconic late beats. The grind-
       and-learn virtuoso keeps MOST spells as level unlocks (§A3 amended); these
       three AWAKEN as moments. None appears in HEROES.faye.unlocks (one-path).
       Each grants kind-'vibe' (the validator pins it) and a real dialogue key. */
    W({
      // the first Heartlight recorded at a Resonance Site: the Embers' note
      // becomes something she can SING BACK. Opens her holy / anti-Hush line.
      id: 'the_first_heartlight',
      hero: 'faye',
      ability: 'starsong_a',
      flag: 'awake_starsong_a',
      dialogue: 'awake_the_first_heartlight',
      toast: '{faye} awakened STARSONG Alpha! ✨',
    }),
    W({
      // the late beat where she finally makes a flame the Hush can't smother —
      // Fire Σ, the whole sky orange and STAYING lit.
      id: 'the_match_that_stays_lit',
      hero: 'faye',
      ability: 'vibe_fire_x',
      flag: 'awake_fire_x',
      dialogue: 'awake_the_match_that_stays_lit',
      toast: '{faye} awakened VIBE FIRE Sigma! 🔥',
    }),
    W({
      // she hears every corrupted Ember at once and pulls the song back out of a
      // whole field — Magnet Σ, the field-wide drain.
      id: 'she_hears_it_all',
      hero: 'faye',
      ability: 'magnet_x',
      flag: 'awake_magnet_x',
      dialogue: 'awake_she_hears_it_all',
      toast: '{faye} awakened MAGNET Sigma! 🧲',
    }),
    /* ---- DORIN ("The Monk's Full Path"): his single awakening. The Trial of
       the Mute Mountain is his Ch.9 homecoming and mastery-earned beat — he has
       travelled with the party since Ch.5. Passing it, he masters the full Comet. Vibe Comet Ω left his
       L52 unlock row in the same commit (one-path rule, §6). */
    W({
      id: 'trial_of_the_mute_mountain',
      hero: 'dorin',
      ability: 'vibe_comet_o',
      flag: 'awake_comet_o',
      dialogue: 'awake_trial_of_the_mute_mountain',
      toast: '{dorin} called down the whole sky — VIBE COMET Omega!',
    }),
  ].map((a) => [a.id, a]),
);

/** abilities a hero's awakening flags have granted (order = table order) */
export function awakenedAbilities(heroId: HeroId, flagOf: (flag: string) => boolean): string[] {
  return Object.values(AWAKENINGS)
    .filter((a) => a.hero === heroId && flagOf(a.flag))
    .map((a) => a.ability);
}
