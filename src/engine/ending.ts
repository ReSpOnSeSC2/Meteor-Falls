/**
 * THE COMPOSED ENDING — the assembler (S21, ADR-128). Pure: select one best-
 * matching card per slot from the flag-state + caller count, guaranteeing a
 * non-empty sequence (every slot has a fallback). playEnding() (OverworldScene)
 * plays the canon walk-home spine, then these cards. Unit-tested exhaustively in
 * src/engine/ending.test.ts (every axis combo reachable, ≥9 distinct, no empties).
 */
import { GS } from './state';
import { ENDING_CARDS, SLOT_ORDER } from '../data/endings';
import { GOLDEN_CALLER_THRESHOLD, GOLDEN_REWIND_CAP } from '../data/echoes';
import { fortuneBand } from '../data/fortune';
import type { EpilogueCard } from '../schemas';

export interface EndingContext {
  /** truthiness of a save flag */
  flag: (f: string) => boolean;
  /** completed caller count (the §A6 score) */
  callers: number;
  /** the chapter the ending fires at (10) */
  chapter: number;
  /** liquid net worth, for the money-band card flavor */
  netWorth: number;
  /** how many times the Held Breath was spent */
  rewindCount: number;
}

/** the golden "Long Shot": fully-virtuous path + a full caller ledger + few rewinds */
export function isLongShot(ctx: EndingContext): boolean {
  return (
    ctx.flag('axis_trust_free') &&
    ctx.flag('axis_compassion_openhand') &&
    ctx.flag('axis_finale_forgive') &&
    ctx.callers >= GOLDEN_CALLER_THRESHOLD &&
    ctx.rewindCount <= GOLDEN_REWIND_CAP
  );
}

/** assemble the epilogue: one best-matching card per slot (fallback guaranteed) */
export function composeEnding(ctx: EndingContext): EpilogueCard[] {
  const golden = isLongShot(ctx);
  const band = fortuneBand(ctx.netWorth, ctx.chapter);
  // the golden gate is a derived flag the home-slot card reads
  const flag = (f: string): boolean => (f === 'ending_long_shot' ? golden : ctx.flag(f));
  const out: EpilogueCard[] = [];
  for (const slot of SLOT_ORDER) {
    const eligible = Object.values(ENDING_CARDS).filter((c) => {
      if (c.slot !== slot) return false;
      if (c.requires && !Object.entries(c.requires).every(([f, v]) => flag(f) === v)) return false;
      if (c.minCallers !== undefined && ctx.callers < c.minCallers) return false;
      if (c.moneyBand !== undefined && c.moneyBand !== band) return false;
      return true;
    });
    const specific = eligible.filter((c) => !c.fallback).sort((a, b) => a.order - b.order);
    const pick = specific[0] ?? eligible.find((c) => c.fallback);
    if (pick) out.push(pick);
  }
  return out;
}

/** the live ending context read off the save */
export function endingContext(): EndingContext {
  const d = GS.data;
  return {
    flag: (f) => GS.flag(f) === true,
    callers: d.callers.length,
    chapter: 10,
    netWorth: d.cashOnHand + d.banked,
    rewindCount: d.echoes.rewindCount,
  };
}
