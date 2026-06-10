/**
 * Vibe abilities, gadgets, and PRAY — GAME_BIBLE §A3.
 * Power ratios follow EB's α/β/γ/Ω ≈ 1 : 2.2 : 3.6 : 5.5 (Prompt 9).
 */

export type AbilityKind = 'vibe' | 'gadget' | 'pray' | 'physical';
export type TargetMode = 'enemy' | 'enemies' | 'ally' | 'allies' | 'self';
export type Element = 'fire' | 'freeze' | 'volt' | 'holy' | 'physical' | 'none';

export interface AbilityDef {
  id: string;
  name: string;
  kind: AbilityKind;
  pp: number;
  /** damage or heal base power (scaled by Vibe stat in formulas) */
  power: number;
  heal?: boolean;
  target: TargetMode;
  element: Element;
  status?: string;
  text: string;
}

const A = (a: AbilityDef): AbilityDef => a;

export const ABILITIES: Record<string, AbilityDef> = Object.fromEntries(
  [
    // ---- Rex: Vibe Surge line (signature nuke), support
    A({ id: 'vibe_surge_a', name: 'Vibe Surge a', kind: 'vibe', pp: 10, power: 55, target: 'enemy', element: 'none', text: '{user} let the old light surge!' }),
    A({ id: 'vibe_surge_b', name: 'Vibe Surge B', kind: 'vibe', pp: 22, power: 121, target: 'enemy', element: 'none', text: '{user} let the old light surge!' }),
    A({ id: 'vibe_surge_g', name: 'Vibe Surge y', kind: 'vibe', pp: 38, power: 198, target: 'enemies', element: 'none', text: '{user} let the old light ROAR!' }),
    A({ id: 'vibe_surge_o', name: 'Vibe Surge O', kind: 'vibe', pp: 64, power: 302, target: 'enemies', element: 'none', text: 'The hill, the town, the sky — all of it surged through {user}!' }),
    A({ id: 'lifeup_a', name: 'Lifeup a', kind: 'vibe', pp: 5, power: 45, heal: true, target: 'ally', element: 'none', text: '{user} hummed a warm note!' }),
    A({ id: 'lifeup_b', name: 'Lifeup B', kind: 'vibe', pp: 11, power: 110, heal: true, target: 'ally', element: 'none', text: '{user} hummed a warm note!' }),
    A({ id: 'lifeup_g', name: 'Lifeup y', kind: 'vibe', pp: 24, power: 180, heal: true, target: 'allies', element: 'none', text: '{user} hummed the whole chorus!' }),
    A({ id: 'hypno_a', name: 'Hypno a', kind: 'vibe', pp: 6, power: 0, target: 'enemy', element: 'none', status: 'asleep', text: '{user} hummed a lullaby!' }),
    A({ id: 'shield_a', name: 'Shield a', kind: 'vibe', pp: 6, power: 0, target: 'ally', element: 'none', status: 'shield', text: '{user} raised a shimmer in the air!' }),
    A({ id: 'shield_s', name: 'Shield S', kind: 'vibe', pp: 18, power: 0, target: 'allies', element: 'none', status: 'shield', text: '{user} raised a wall of shimmer!' }),
    A({ id: 'flash_a', name: 'Flash a', kind: 'vibe', pp: 8, power: 0, target: 'enemies', element: 'none', status: 'crying', text: '{user} went off like a camera!' }),
    A({ id: 'teleport_a', name: 'Teleport a', kind: 'vibe', pp: 2, power: 0, target: 'self', element: 'none', text: '{user} started running!' }),

    // ---- Faye: elemental lines + PRAY
    A({ id: 'vibe_fire_a', name: 'Vibe Fire a', kind: 'vibe', pp: 6, power: 48, target: 'enemy', element: 'fire', text: '{user} snapped her fingers — FWOOSH!' }),
    A({ id: 'vibe_fire_b', name: 'Vibe Fire B', kind: 'vibe', pp: 14, power: 106, target: 'enemies', element: 'fire', text: '{user} snapped her fingers — FWOOSH!' }),
    A({ id: 'vibe_fire_g', name: 'Vibe Fire y', kind: 'vibe', pp: 28, power: 173, target: 'enemies', element: 'fire', text: 'The air itself caught!' }),
    A({ id: 'vibe_fire_o', name: 'Vibe Fire O', kind: 'vibe', pp: 49, power: 264, target: 'enemies', element: 'fire', text: 'The air itself caught!' }),
    A({ id: 'vibe_freeze_a', name: 'Vibe Freeze a', kind: 'vibe', pp: 7, power: 52, target: 'enemy', element: 'freeze', text: '{user} exhaled winter!' }),
    A({ id: 'vibe_freeze_b', name: 'Vibe Freeze B', kind: 'vibe', pp: 15, power: 114, target: 'enemy', element: 'freeze', text: '{user} exhaled winter!' }),
    A({ id: 'vibe_freeze_g', name: 'Vibe Freeze y', kind: 'vibe', pp: 30, power: 187, target: 'enemy', element: 'freeze', text: 'Absolute zero, with feeling!' }),
    A({ id: 'vibe_freeze_o', name: 'Vibe Freeze O', kind: 'vibe', pp: 52, power: 286, target: 'enemy', element: 'freeze', text: 'Absolute zero, with feeling!' }),
    A({ id: 'vibe_volt_a', name: 'Vibe Volt a', kind: 'vibe', pp: 9, power: 58, target: 'enemy', element: 'volt', text: '{user} pointed at the sky!' }),
    A({ id: 'vibe_volt_b', name: 'Vibe Volt B', kind: 'vibe', pp: 19, power: 128, target: 'enemies', element: 'volt', text: '{user} pointed at the sky!' }),
    A({ id: 'vibe_volt_g', name: 'Vibe Volt y', kind: 'vibe', pp: 36, power: 209, target: 'enemies', element: 'volt', text: 'The sky answered!' }),
    A({ id: 'magnet_a', name: 'Magnet a', kind: 'vibe', pp: 3, power: 0, target: 'enemy', element: 'none', status: 'pp_drain', text: '{user} held out her palm!' }),
    A({ id: 'pray', name: 'Pray', kind: 'pray', pp: 0, power: 0, target: 'allies', element: 'holy', text: '{user} prayed with all her heart.' }),

    // ---- Milo: gadgets (no Vibe)
    A({ id: 'spy', name: 'Spy', kind: 'gadget', pp: 0, power: 0, target: 'enemy', element: 'none', text: '{user} adjusted his glasses and took notes!' }),
    A({ id: 'repair', name: 'Repair', kind: 'gadget', pp: 0, power: 0, target: 'self', element: 'none', text: '{user} tinkers while everyone sleeps.' }),
    A({ id: 'bottle_rocket', name: 'Bottle Rocket', kind: 'gadget', pp: 0, power: 90, target: 'enemy', element: 'physical', text: '{user} lit a bottle rocket! psssshh— ' }),
    A({ id: 'big_bottle_rocket', name: 'Big Bottle Rocket', kind: 'gadget', pp: 0, power: 220, target: 'enemy', element: 'physical', text: '{user} lit a BIG bottle rocket!' }),
    A({ id: 'multi_bottle_rocket', name: 'Multi Bottle Rocket', kind: 'gadget', pp: 0, power: 140, target: 'enemies', element: 'physical', text: '{user} lit the whole crate!' }),

    // ---- Dorin
    A({ id: 'vibe_comet_a', name: 'Vibe Comet a', kind: 'vibe', pp: 20, power: 130, target: 'enemies', element: 'none', text: '{user} called down the cold stars!' }),
    A({ id: 'vibe_comet_o', name: 'Vibe Comet O', kind: 'vibe', pp: 60, power: 320, target: 'enemies', element: 'none', text: 'The sky opened. The stars remembered.' }),
    A({ id: 'mirror', name: 'Mirror', kind: 'vibe', pp: 4, power: 0, target: 'self', element: 'none', status: 'mirror', text: '{user} became perfectly still water.' }),
    A({ id: 'healing_a', name: 'Healing a', kind: 'vibe', pp: 5, power: 0, target: 'ally', element: 'none', status: 'cure', text: '{user} pressed two fingers to the brow.' }),
    A({ id: 'healing_g', name: 'Healing y', kind: 'vibe', pp: 20, power: 0, target: 'ally', element: 'none', status: 'revive', text: '{user} spoke an old word.' }),
    A({ id: 'brainjam_a', name: 'Brainjam a', kind: 'vibe', pp: 12, power: 0, target: 'enemy', element: 'none', status: 'hushed', text: '{user} crossed the wires of a mind!' }),
    A({ id: 'brainjam_o', name: 'Brainjam O', kind: 'vibe', pp: 30, power: 0, target: 'enemies', element: 'none', status: 'hushed', text: '{user} crossed every wire at once!' }),
  ].map((a) => [a.id, a]),
);

/* ---------------- PRAY — §A3 canon table ---------------- */

export type PrayTier = 'miraculous' | 'wonderful' | 'good' | 'nothing' | 'strange' | 'backfire';

export interface PrayWeights {
  miraculous: number;
  wonderful: number;
  good: number;
  nothing: number;
  strange: number;
  backfire: number;
}

export const PRAY_BASE: PrayWeights = {
  miraculous: 10,
  wonderful: 20,
  good: 30,
  nothing: 25,
  strange: 10,
  backfire: 5,
};

/**
 * Weights shift +5% toward better tiers every 15 levels of Faye;
 * Guts adds ±1% per 10 Guts (canon §A3).
 */
export function prayWeights(level: number, guts: number): PrayWeights {
  const w: PrayWeights = { ...PRAY_BASE };
  const steps = Math.floor(level / 15);
  for (let s = 0; s < steps; s++) {
    const take = (k: keyof PrayWeights, n: number): number => {
      const t = Math.min(w[k], n);
      w[k] -= t;
      return t;
    };
    let moved = 0;
    moved += take('backfire', 1);
    moved += take('strange', 2);
    moved += take('nothing', 2);
    w.miraculous += Math.ceil(moved * 0.4);
    w.wonderful += Math.floor(moved * 0.4);
    w.good += moved - Math.ceil(moved * 0.4) - Math.floor(moved * 0.4);
  }
  const g = Math.floor(guts / 10);
  const shift = Math.min(g, w.nothing);
  w.nothing -= shift;
  w.miraculous += shift;
  return w;
}

export function rollPray(level: number, guts: number, rng: () => number): PrayTier {
  const w = prayWeights(level, guts);
  const total = w.miraculous + w.wonderful + w.good + w.nothing + w.strange + w.backfire;
  let r = rng() * total;
  const order: PrayTier[] = ['miraculous', 'wonderful', 'good', 'nothing', 'strange', 'backfire'];
  for (const k of order) {
    r -= w[k];
    if (r < 0) return k;
  }
  return 'nothing';
}

/** Pray flavor text — hopeful even on Nothing (§A11.4) */
export const PRAY_TEXT: Record<PrayTier, string> = {
  miraculous: 'The night filled with warm gold light... something ENORMOUS smiled back!',
  wonderful: 'A wave of warmth rolled over everyone!',
  good: 'A soft light settled on the party.',
  nothing: '{user} prayed with all her heart... but nothing happened. Yet.',
  strange: 'The light came back... weird. Really weird.',
  backfire: 'The light flared a little too bright!',
};
