/**
 * THE ARMY ON OUR TAIL (S19 Movement 40, ADR-081) — §A6 the army-pursuit arc as
 * an ORDERED, FLAG-CHAINED, NON-MISSABLE beat registry (the storythreads pattern,
 * `src/engine/armyarc.ts` drives it). A bumbling-but-earnest GENERAL becomes
 * convinced the party stole a military prototype — really Milo's Clicker pinged a
 * base, OR the Hush spoofed the signal to frame them (the §A4.10 Clicker Question,
 * rhymed: the Hush turning a hero's gift into a reason to be feared). The army
 * chases them across a chapter or two — a checkpoint, a helmeted TANK to route
 * around, an F-15 FLYOVER set-piece — and the misunderstanding CLEARS, the General
 * becoming a finale CALLER.
 *
 * The army is WRONG, never EVIL (§A11): no one dies, the Hush stays the only true
 * villain, and the General's change of heart is EARNED, not a gag. The beats are a
 * chain (each beat's `prevFlag` is the previous beat's `flag`) so the engine fires
 * them IN ORDER and the clearing is non-missable; the per-chapter scene staging
 * (the checkpoint map, the tank route, the flyover) lands in each chapter session.
 */

export type ArmyBeatKind = 'misread' | 'checkpoint' | 'tank' | 'flyover' | 'clearing';

export interface ArmyBeat {
  id: string;
  /** chapter band the beat lands in ('ch5'…'ch10') */
  band: string;
  /** position in the chain (1-based, contiguous) */
  order: number;
  kind: ArmyBeatKind;
  /** the save flag this beat sets when it fires */
  flag: string;
  /** the flag that must already be set for this beat to fire (null = the opener) */
  prevFlag: string | null;
  /** a finale CALLER this beat earns (the §A6 payoff), if any */
  caller?: string;
  /** a §A11-voice one-liner — funny-but-sincere, never grim */
  note: string;
}

const B = (b: ArmyBeat): ArmyBeat => b;

export const ARMY_BEATS: Record<string, ArmyBeat> = Object.fromEntries(
  [
    B({
      id: 'army_misread', band: 'ch5', order: 1, kind: 'misread',
      flag: 'army_misread', prevFlag: null,
      note: "Milo's Clicker pings a base by accident (or the Hush spoofs it). General Buckle is CERTAIN five kids stole a prototype. He is, by the book, wrong.",
    }),
    B({
      id: 'army_checkpoint', band: 'ch6', order: 2, kind: 'checkpoint',
      flag: 'army_checkpoint', prevFlag: 'army_misread',
      note: 'A Humvee parks across the road, blinkers on. Drive past, talk past, or slip it in army fatigues — getting waved through, not a wall.',
    }),
    B({
      id: 'army_tank', band: 'ch6', order: 3, kind: 'tank',
      flag: 'army_tank', prevFlag: 'army_checkpoint',
      note: "A helmeted tank squats in the only lane. The Clicker just gives it a headache — route AROUND it on the road graph, or out-drive it.",
    }),
    B({
      id: 'army_flyover', band: 'ch7', order: 4, kind: 'flyover',
      flag: 'army_flyover', prevFlag: 'army_tank',
      note: 'The F-15 "Eagle Scout" screams overhead, rattles every window, banks, and does it again. Loud, harmless, and weirdly proud of itself.',
    }),
    B({
      id: 'army_clearing', band: 'ch7', order: 5, kind: 'clearing',
      flag: 'army_clearing', prevFlag: 'army_flyover',
      caller: 'general_buckle',
      note: 'The party shows Buckle the real signal — the Hush, not them. He apologizes BY THE BOOK (Subsection 12, paragraph 4) and joins the finale callers.',
    }),
  ].map((b) => [b.id, b]),
);

/** the ordered beat list (by `order`) */
export function armyChain(): ArmyBeat[] {
  return Object.values(ARMY_BEATS).sort((a, b) => a.order - b.order);
}
