/**
 * Vibe abilities, gadgets, and PRAY — GAME_BIBLE §A3.
 * Power ratios follow EB's α/β/γ/Ω ≈ 1 : 2.2 : 3.6 : 5.5 (Prompt 9).
 * Types are z.infer'd from src/schemas (S5) — compile shape ≡ runtime schema.
 */
import type { AbilityDef, PrayTier, PrayWeights } from '../schemas';

export type { AbilityDef, AbilityKind, Element, PrayTier, PrayWeights, TargetMode } from '../schemas';

const A = (a: AbilityDef): AbilityDef => a;

export const ABILITIES: Record<string, AbilityDef> = Object.fromEntries(
  [
    // ---- Jay: Vibe Surge line (signature nuke), support
    A({ id: 'vibe_surge_a', name: 'Vibe Surge Alpha', kind: 'vibe', pp: 10, power: 55, target: 'enemy', element: 'none', text: '{user} let the old light surge!', fx: 'surge_a' }),
    A({ id: 'vibe_surge_b', name: 'Vibe Surge Beta', kind: 'vibe', pp: 22, power: 143, target: 'enemy', element: 'none', text: '{user} let the old light surge!', fx: 'surge_b' }),
    A({ id: 'vibe_surge_g', name: 'Vibe Surge Gamma', kind: 'vibe', pp: 38, power: 231, target: 'enemies', element: 'none', text: '{user} let the old light ROAR!', fx: 'surge_g' }),
    A({ id: 'vibe_surge_o', name: 'Vibe Surge Omega', kind: 'vibe', pp: 64, power: 341, target: 'enemies', element: 'none', text: 'The hill, the town, the sky — all of it surged through {user}!', fx: 'surge_o' }),
    A({ id: 'lifeup_a', name: 'Lifeup Alpha', kind: 'vibe', pp: 5, power: 45, heal: true, target: 'ally', element: 'none', text: '{user} hummed a warm note!', fx: 'lifeup' }),
    A({ id: 'lifeup_b', name: 'Lifeup Beta', kind: 'vibe', pp: 11, power: 110, heal: true, target: 'ally', element: 'none', text: '{user} hummed a warm note!', fx: 'lifeup' }),
    A({ id: 'lifeup_g', name: 'Lifeup Gamma', kind: 'vibe', pp: 24, power: 180, heal: true, target: 'allies', element: 'none', text: '{user} hummed the whole chorus!', fx: 'lifeup' }),
    A({ id: 'hypno_a', name: 'Hypno Alpha', kind: 'vibe', pp: 6, power: 0, target: 'enemy', element: 'none', status: 'asleep', text: '{user} hummed a lullaby!', fx: 'hypno' }),
    A({ id: 'shield_a', name: 'Shield Alpha', kind: 'vibe', pp: 6, power: 0, target: 'ally', element: 'none', status: 'shield', text: '{user} raised a shimmer in the air!', fx: 'shield_snap' }),
    A({ id: 'shield_s', name: 'Shield Sigma', kind: 'vibe', pp: 18, power: 0, target: 'allies', element: 'none', status: 'shield', text: '{user} raised a wall of shimmer!', fx: 'shield_snap' }),
    A({ id: 'flash_a', name: 'Flash Alpha', kind: 'vibe', pp: 8, power: 0, target: 'enemies', element: 'none', status: 'crying', text: '{user} went off like a camera!', fx: 'flash' }),
    A({ id: 'teleport_a', name: 'Teleport Alpha', kind: 'vibe', pp: 2, power: 0, target: 'self', element: 'none', text: '{user} started running!', fx: 'run_up' }),

    // ---- Jay, DOUBLED (S16 — "The Old Light, Doubled"). The signature gets a
    // true five-rung ladder ending in a story finale (Σ); Hypno grows into a
    // real control suite (mass sleep + literal MIND WARP); the shields become a
    // LAYERED ward system (physical Shield / elemental Ward / all-types Reflect);
    // and Lifeup caps out beside a clutch self-buff. Every new row is a real
    // menu choice (§7 of the build prompt) — see the per-pillar notes.

    // Pillar A — Vibe Surge Σ (the screen-filling capstone, awakening). No
    // element: the answer to elementally-immune foes that shrug off Mia. 96 PP
    // is most of his bar — "one Σ or three βs" is a per-fight budget decision.
    A({ id: 'vibe_surge_x', name: 'Vibe Surge Sigma', kind: 'vibe', pp: 96, power: 480, target: 'enemies', element: 'none', text: 'Otterbrook, the Embers, every porch light he ever ran home to — all of it surged through {user}!', fx: 'surge_x' }),

    // Pillar B — mind control. Hypno Ω puts a whole pack to sleep; Mind Warp
    // turns ONE foe against its own allies (status 'puppet'). Trivial vs trash,
    // useless vs bosses (mind_immune) and resisted by elites — a tempo tool,
    // never an "I win" button.
    A({ id: 'hypno_o', name: 'Hypno Omega', kind: 'vibe', pp: 18, power: 0, target: 'enemies', element: 'none', status: 'asleep', text: '{user} hummed the whole room under!', fx: 'hypno' }),
    A({ id: 'mindwarp_a', name: 'Mind Warp Alpha', kind: 'vibe', pp: 14, power: 0, target: 'enemy', element: 'none', status: 'puppet', text: '{user} reached in, quiet as a held breath...', fx: 'mindwarp' }),
    A({ id: 'mindwarp_o', name: 'Mind Warp Omega', kind: 'vibe', pp: 40, power: 0, target: 'enemy', element: 'none', status: 'puppet', text: '{user} borrowed the voice whole — and turned it.', fx: 'mindwarp' }),

    // Pillar C — the layered ward system. Shield (existing) halves PHYSICAL;
    // Ward halves ELEMENTAL (fire/freeze/volt/holy); Power Shield's 'reflect'
    // halves ALL and bounces ~1/3 back. Different attacks, different answers —
    // a careful player stacks Shield+Ward (the BULWARK synergy) on a telegraph.
    A({ id: 'ward_a', name: 'Ward Alpha', kind: 'vibe', pp: 8, power: 0, target: 'ally', element: 'none', status: 'ward', text: '{user} hung a cool veil in the air!', fx: 'ward_snap' }),
    A({ id: 'ward_s', name: 'Ward Sigma', kind: 'vibe', pp: 22, power: 0, target: 'allies', element: 'none', status: 'ward', text: '{user} drew the veil over everyone!', fx: 'ward_snap' }),
    A({ id: 'powershield_a', name: 'Power Shield Alpha', kind: 'vibe', pp: 14, power: 0, target: 'ally', element: 'none', status: 'reflect', text: '{user} set a still, answering mirror in the air!', fx: 'reflect_snap' }),
    A({ id: 'powershield_s', name: 'Power Shield Sigma', kind: 'vibe', pp: 34, power: 0, target: 'allies', element: 'none', status: 'reflect', text: '{user} raised the wall that answers!', fx: 'reflect_snap' }),

    // Pillar D — Lifeup Ω (Jay can main-heal so Mia is free to nuke) + Resolve
    // ('steeled': +Guts → crit and a 1-HP mortal-blow survive, a proactive
    // don't-die button the party otherwise lacks).
    A({ id: 'lifeup_o', name: 'Lifeup Omega', kind: 'vibe', pp: 40, power: 320, heal: true, target: 'allies', element: 'none', text: '{user} hummed the whole sky bright!', fx: 'lifeup' }),
    A({ id: 'resolve_a', name: 'Resolve', kind: 'vibe', pp: 10, power: 0, target: 'ally', element: 'none', status: 'steeled', text: '{user} caught their eye: stand. STAND.', fx: 'brace_snap' }),

    // Pillar E — the two "full double" extras (trim-first, §3): a stronger
    // blind and the overworld escape upgrade.
    A({ id: 'flash_o', name: 'Flash Omega', kind: 'vibe', pp: 16, power: 0, target: 'enemies', element: 'none', status: 'crying', text: '{user} went off like a whole wall of cameras!', fx: 'flash' }),
    A({ id: 'teleport_b', name: 'Teleport Beta', kind: 'vibe', pp: 4, power: 0, target: 'self', element: 'none', text: '{user} found the fast way out!', fx: 'run_up' }),

    // ---- Mia: elemental lines + PRAY
    A({ id: 'vibe_fire_a', name: 'Vibe Fire Alpha', kind: 'vibe', pp: 6, power: 48, target: 'enemy', element: 'fire', text: '{user} snapped her fingers — FWOOSH!', fx: 'fire_a' }),
    A({ id: 'vibe_fire_b', name: 'Vibe Fire Beta', kind: 'vibe', pp: 14, power: 125, target: 'enemies', element: 'fire', text: '{user} snapped her fingers — FWOOSH!', fx: 'fire_b' }),
    A({ id: 'vibe_fire_g', name: 'Vibe Fire Gamma', kind: 'vibe', pp: 28, power: 202, target: 'enemies', element: 'fire', text: 'The air itself caught!', fx: 'fire_g' }),
    A({ id: 'vibe_fire_o', name: 'Vibe Fire Omega', kind: 'vibe', pp: 49, power: 298, target: 'enemies', element: 'fire', text: 'The air itself caught!', fx: 'fire_o' }),
    A({ id: 'vibe_freeze_a', name: 'Vibe Freeze Alpha', kind: 'vibe', pp: 7, power: 52, target: 'enemy', element: 'freeze', text: '{user} exhaled winter!', fx: 'freeze_a' }),
    A({ id: 'vibe_freeze_b', name: 'Vibe Freeze Beta', kind: 'vibe', pp: 15, power: 114, target: 'enemy', element: 'freeze', text: '{user} exhaled winter!', fx: 'freeze_b' }),
    A({ id: 'vibe_freeze_g', name: 'Vibe Freeze Gamma', kind: 'vibe', pp: 30, power: 187, target: 'enemy', element: 'freeze', text: 'Absolute zero, with feeling!', fx: 'freeze_g' }),
    A({ id: 'vibe_freeze_o', name: 'Vibe Freeze Omega', kind: 'vibe', pp: 52, power: 286, target: 'enemy', element: 'freeze', text: 'Absolute zero, with feeling!', fx: 'freeze_o' }),
    A({ id: 'vibe_volt_a', name: 'Vibe Volt Alpha', kind: 'vibe', pp: 9, power: 58, target: 'enemy', element: 'volt', text: '{user} pointed at the sky!', fx: 'volt_a' }),
    A({ id: 'vibe_volt_b', name: 'Vibe Volt Beta', kind: 'vibe', pp: 19, power: 128, target: 'enemies', element: 'volt', text: '{user} pointed at the sky!', fx: 'volt_b' }),
    A({ id: 'vibe_volt_g', name: 'Vibe Volt Gamma', kind: 'vibe', pp: 36, power: 209, target: 'enemies', element: 'volt', text: 'The sky answered!', fx: 'volt_g' }),
    A({ id: 'magnet_a', name: 'Magnet Alpha', kind: 'vibe', pp: 3, power: 0, target: 'enemy', element: 'none', status: 'pp_drain', text: '{user} held out her palm!', fx: 'magnet' }),
    A({ id: 'pray', name: 'Pray', kind: 'pray', pp: 0, power: 0, target: 'allies', element: 'holy', text: '{user} prayed with all her heart.', fx: 'pray' }),

    // ---- Milo: gadgets (no Vibe)
    A({ id: 'spy', name: 'Spy', kind: 'gadget', pp: 0, power: 0, target: 'enemy', element: 'none', text: '{user} adjusted his glasses and took notes!', fx: 'spy_scan' }),
    A({ id: 'repair', name: 'Repair', kind: 'gadget', pp: 0, power: 0, target: 'self', element: 'none', text: '{user} tinkers while everyone sleeps.', fx: 'repair_overnight' }),
    A({ id: 'bottle_rocket', name: 'Bottle Rocket', kind: 'gadget', pp: 0, power: 90, target: 'enemy', element: 'physical', text: '{user} lit a bottle rocket! Psssshh!', fx: 'rocket' }),
    A({ id: 'big_bottle_rocket', name: 'Big Bottle Rocket', kind: 'gadget', pp: 0, power: 220, target: 'enemy', element: 'physical', text: '{user} lit a BIG bottle rocket!', fx: 'rocket_big' }),
    A({ id: 'multi_bottle_rocket', name: 'Multi Bottle Rocket', kind: 'gadget', pp: 0, power: 140, target: 'enemies', element: 'physical', text: '{user} lit the whole crate!', fx: 'rocket_multi' }),

    // ---- Dorin
    A({ id: 'vibe_comet_a', name: 'Vibe Comet Alpha', kind: 'vibe', pp: 20, power: 130, target: 'enemies', element: 'none', text: '{user} called down the cold stars!', fx: 'comet_a' }),
    A({ id: 'vibe_comet_o', name: 'Vibe Comet Omega', kind: 'vibe', pp: 60, power: 320, target: 'enemies', element: 'none', text: 'The sky opened. The stars remembered.', fx: 'comet_o' }),
    A({ id: 'mirror', name: 'Mirror', kind: 'vibe', pp: 4, power: 0, target: 'self', element: 'none', status: 'mirror', text: '{user} became perfectly still water.', fx: 'mirror_snap' }),
    A({ id: 'healing_a', name: 'Healing Alpha', kind: 'vibe', pp: 5, power: 0, target: 'ally', element: 'none', status: 'cure', text: '{user} pressed two fingers to the brow.', fx: 'healing_cure' }),
    A({ id: 'healing_g', name: 'Healing Gamma', kind: 'vibe', pp: 20, power: 0, target: 'ally', element: 'none', status: 'revive', text: '{user} spoke an old word.', fx: 'healing_revive' }),
    A({ id: 'brainjam_a', name: 'Brainjam Alpha', kind: 'vibe', pp: 12, power: 0, target: 'enemy', element: 'none', status: 'hushed', text: '{user} crossed the wires of a mind!', fx: 'brainjam' }),
    A({ id: 'brainjam_o', name: 'Brainjam Omega', kind: 'vibe', pp: 30, power: 0, target: 'enemies', element: 'none', status: 'hushed', text: '{user} crossed every wire at once!', fx: 'brainjam' }),

    // ---- Pippa: the page's tactical kit (§A3, S15h). NO Vibe, NO PP — like
    // Milo, her moves are competence not magic, so they ride kind 'physical'
    // at 0 PP. The statuses below are her Ch.5 battle hooks (the support
    // mechanics wire in when she joins); the faces reuse existing fx families.
    A({ id: 'pinpoint_mark', name: 'Pinpoint Mark', kind: 'physical', pp: 0, power: 0, target: 'ally', element: 'none', status: 'marked', text: "{user} marked the shot — the next ally hit can't miss!", fx: 'pinpoint_mark' }),
    A({ id: 'royal_rally', name: 'Royal Rally', kind: 'physical', pp: 0, power: 0, target: 'allies', element: 'none', status: 'rally', text: '{user} called the rally — the party stands quick and lucky!', fx: 'royal_rally' }),
    A({ id: 'pocket_patch', name: 'Pocket Patch', kind: 'physical', pp: 0, power: 35, heal: true, target: 'ally', element: 'none', status: 'cure', text: '{user} patched an ally up — needle, thread, and a clean bandage!', fx: 'pocket_patch' }),
    A({ id: 'scale_step', name: 'Scale Step', kind: 'physical', pp: 0, power: 0, target: 'self', element: 'none', status: 'evasion', text: '{user} stepped to thimble-scale — and left a decoy standing!', fx: 'scale_step' }),
    A({ id: 'big_little_focus', name: 'Big-Little Focus', kind: 'physical', pp: 0, power: 0, target: 'allies', element: 'none', status: 'focus', text: '{user} and the party found the big-little focus!', fx: 'big_little_focus' }),
    A({ id: 'bellwether', name: 'Bellwether', kind: 'physical', pp: 0, power: 0, target: 'allies', element: 'none', status: 'morale', text: '{user} rang the bellwether — the next prayer will carry!', fx: 'bellwether' }),
  ].map((a) => [a.id, a]),
);

/* ---------------- PRAY — §A3 canon table ---------------- */

export const PRAY_BASE: PrayWeights = {
  miraculous: 10,
  wonderful: 20,
  good: 30,
  nothing: 25,
  strange: 10,
  backfire: 5,
};

/**
 * Weights shift +5% toward better tiers every 15 levels of Mia;
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
