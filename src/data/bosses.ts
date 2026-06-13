/**
 * Boss phase scripts — GAME_BIBLE §A6 gimmicks as DATA over the S14 phase
 * machine (src/battle/phases.ts, Bible Prompt 15). One entry per scripted
 * boss; Prompts 29–34 add theirs as rows here, never as engine code.
 *
 * BOSS 2 — IDOL OF THE GILDED GRIN (§A6 Ch.2, 980 HP): alternates between
 * SOLID GOLD (physical immune — use Vibe) and HOLLOW (Vibe immune — swing
 * bats), telegraphing every swap by GRINNING WIDER one turn before it.
 * Cadence: telegraph on boss turns 2, 6, 10…; swap on 3, 7, 11… The HOLLOW
 * reveal is Chapter 2's emotional center: MIA AWAKENS VIBE FREEZE α the
 * moment the gold turns out to be empty ("cold reads what gold hides",
 * ADR-035 — §A11.2, staged sincere) — and Freeze CRACKS the SOLID form's
 * immunity for a beat (crackedBy), so the swap the fight teaches goes both
 * ways: Vibe answers gold, bats answer hollow, and frost makes gold brittle.
 *
 * THE TICK IS NOT HERE — its latch shipped bespoke (S11) and stays law.
 *
 * Types are z.infer'd from src/schemas (ADR-017); `npm run validate` parses
 * every script and pins the Grin's manifest both directions.
 */
import type { BossScriptDef } from '../schemas';

export type { BossScriptDef } from '../schemas';

const B = (b: BossScriptDef): BossScriptDef => b;

export const BOSS_SCRIPTS: Record<string, BossScriptDef> = {
  gilded_grin: B({
    boss: 'gilded_grin',
    initialForm: 'solid',
    forms: [
      {
        id: 'solid',
        name: 'SOLID GOLD',
        physicalImmune: true,
        crackedBy: 'freeze',
        spriteSuffix: '',
        line: 'idol_form_solid',
      },
      {
        id: 'hollow',
        name: 'HOLLOW',
        vibeImmune: true,
        spriteSuffix: '_hollow',
        line: 'idol_form_hollow',
      },
    ],
    awakeningOnForm: { form: 'hollow', awakening: 'cold_reads' },
    phases: [
      {
        id: 'telegraph',
        trigger: { kind: 'turnCount', n: 2, every: 4 },
        once: false,
        actions: [{ kind: 'scriptLine', line: 'idol_grin_wider' }],
      },
      {
        id: 'swap',
        trigger: { kind: 'turnCount', n: 3, every: 4 },
        once: false,
        actions: [{ kind: 'setForm', form: 'cycle' }],
      },
      {
        // S16 (ADR-035 extended): the half-dead DESPERATION blow. The Idol
        // gathers every fleck of gold in the room into one unblockable-looking
        // sheet of light — and JAY throws up a wall that ANSWERS it. POWER
        // SHIELD Σ awakens (the_wall_that_answers; §A11.2-sincere, the second
        // Ch.2 awakening beside Mia's Freeze). Fires ONCE, late, as a moment.
        id: 'the_wall',
        trigger: { kind: 'hpBelow', frac: 0.45 },
        actions: [
          { kind: 'scriptLine', line: 'idol_gathering' },
          { kind: 'awaken', awakening: 'the_wall_that_answers' },
        ],
      },
    ],
  }),
};
