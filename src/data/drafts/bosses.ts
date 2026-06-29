/**
 * FORGED BOSS DRAFTS (S15g Movement Three, ADR-046) — every UNSHIPPED §A6 boss
 * (Ch.3–9) plus both Ch.10 minibosses, instantiated from the ten templates
 * (src/levelkit/forge/bosses.ts) at their canon HP/threshold numbers. DRAFTS
 * ARE NOT CONTENT (Prime Law 1): these live under src/data/drafts/**, parse as
 * BossScriptDef, but are EXCLUDED from BOSS_SCRIPTS, the §A6 manifest, and the
 * §B4 sweep — they cannot masquerade as the shipped Grin. Promotion is a human
 * act: a chapter session moves its boss into src/data/bosses.ts and the tone
 * editor rewrites every `*_draft` dialogue id into a real §A11 line.
 *
 * Ch.1 Tick + Ch.2 Grin + Ch.3 Mainframe are SHIPPED (data/bosses.ts) and absent
 * here. Ch.10's finale (THE HUSH) is bespoke like the Tick — not one of the ten
 * templates — and lands with the finale, not the forge.
 *
 * The draft dialogue ids (`*_draft`) and the boss/minion enemy ids they drive
 * (the_whisperwig, whiskerzilla, flat_bell, …) are UNSHIPPED — they resolve to
 * canon only at promotion. Determinism is trivial: static data, no
 * Date.now()/Math.random() (Prime Law 2).
 */
import type { BossScriptDef } from '../../schemas';
import {
  elementalGolem,
} from '../../levelkit/forge/bosses';

export const DRAFT_BOSS_SCRIPTS: Record<string, BossScriptDef> = {
  /* Ch.3 — HEADMASTER MAINFRAME: PROMOTED (ADR-099). Now a live boss in
   * src/data/bosses.ts (BOSS_SCRIPTS) driving a shipped §A7 enemy — no longer a
   * draft (Prime Law 1: a draft may not duplicate a shipped script or enemy). */

  /* Ch.4 — THE WHISPERWIG: PROMOTED (the Norway landing). Now a live boss in
   * src/data/bosses.ts (BOSS_SCRIPTS) driving a shipped §A7 enemy, with the
   * `the_thunder_snore` awakening (Mia's Vibe Volt α) — no longer a draft (Prime
   * Law 1: a draft may not duplicate a shipped script or enemy). */

  /* Ch.5 — WHISKERZILLA: PROMOTED (the Minimus landing). Now a live boss in
   * src/data/bosses.ts (BOSS_SCRIPTS) driving a shipped §A7 enemy + the Flat Bell
   * (its summoned 150-HP second target) — no longer a draft (Prime Law 1: a draft
   * may not duplicate a shipped script or enemy). */

  /* Ch.6 — THE LAUGHING SPHINX: PROMOTED (the Zanzibel landing). Now a live boss in
   * src/data/bosses.ts (BOSS_SCRIPTS) driving a shipped §A7 enemy + the 8-riddle pool —
   * no longer a draft (Prime Law 1: a draft may not duplicate a shipped script or enemy). */

  /* Ch.7 — COBRA RAJA: PROMOTED (the Chandrapore landing). Now a live boss in
   * src/data/bosses.ts (BOSS_SCRIPTS) driving a shipped §A7 enemy at canon 20,000 HP
   * (the gaze + 40% skin-shed) — no longer a draft (Prime Law 1: a draft may not
   * duplicate a shipped script or enemy). */

  /* Ch.8 — THE PAPER DRAGON: PROMOTED (the Lotus Harbor / Mt. Shu landing). Now a live
   * boss in src/data/bosses.ts (BOSS_SCRIPTS) driving a shipped §A7 enemy at canon
   * 45,000 HP (the airborne/grounded gimmick + the 30% self-immolation BURNING form) —
   * no longer a draft (Prime Law 1: a draft may not duplicate a shipped script or enemy). */

  /* Ch.9 — COUNT HOAXULA: PROMOTED (the Valea Stelelor landing). Now a live boss in
   * src/data/bosses.ts (BOSS_SCRIPTS) driving a shipped §A7 enemy at canon 95,000 HP
   * (theatrical → unmasked at 50% → Mia's Pray ends it in mercy, the mercyEnding
   * template, with the §A11 dialogue ids rewritten from `*_draft`) — no longer a draft
   * (Prime Law 1: a draft may not duplicate a shipped script or enemy). */

  /* Ch.10 minibosses — the WRONG element heals the golem (crackedBy is the key) */
  frost_sentinel: elementalGolem('frost_sentinel', {
    form: { id: 'frost', name: 'FROST SHELL', spriteSuffix: '' },
    weakTo: 'fire', // fire melts it
    healedBy: 'freeze', // frost feeds it
    slam: { every: 3, line: 'frost_slam_draft' },
  }),

  tiki_magma_golem: elementalGolem('tiki_magma_golem', {
    form: { id: 'magma', name: 'MAGMA CORE', spriteSuffix: '' },
    weakTo: 'freeze', // cold quenches it
    healedBy: 'fire', // fire stokes it
    slam: { every: 3, line: 'tiki_slam_draft' },
  }),
};

/** the unshipped bosses the forge instantiates, pinned (the COUNT is law — ten
 *  Embers/Heartlights/bosses; Ch.1 Tick + Ch.2 Grin shipped, Ch.10 Hush is the
 *  bespoke finale, leaving these seven + the two minibosses). */
export const DRAFT_BOSS_IDS = [
  // 'headmaster_mainframe' — PROMOTED to a live boss at the Ch.3 landing (ADR-099)
  // 'the_whisperwig' — PROMOTED to a live boss at the Ch.4 Norway landing
  // 'whiskerzilla' — PROMOTED to a live boss at the Ch.5 Minimus landing
  // 'laughing_sphinx' — PROMOTED to a live boss at the Ch.6 Zanzibel landing
  // 'cobra_raja' — PROMOTED to a live boss at the Ch.7 Chandrapore landing
  // 'paper_dragon' — PROMOTED to a live boss at the Ch.8 Lotus Harbor / Mt. Shu landing
  // 'count_hoaxula' — PROMOTED to a live boss at the Ch.9 Valea Stelelor landing
  'frost_sentinel',
  'tiki_magma_golem',
] as const;
