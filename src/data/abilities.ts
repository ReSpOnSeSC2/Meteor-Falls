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
    // ADR-131: Surge α power 20→38. The old value was tuned to merely "track the bat"
    // (BALANCE_CH1-3_SPEC §1b), so by L5+ a free SMAAASH swing matched or beat the
    // 6-PP signature nuke and the menu pick was dead. 38 makes it a real nuke (~1.5× a
    // swing through its L1–17 window, before Surge β takes over at L18); the Tick's HP
    // rises to match so the solo-Jay TTK stays in the fair window (verify.ts boss check).
    A({ id: 'vibe_surge_a', name: 'Vibe Surge Alpha', kind: 'vibe', pp: 6, power: 38, target: 'enemy', element: 'none', text: '{user} let the old light surge!', fx: 'surge_a' }),
    A({ id: 'vibe_surge_b', name: 'Vibe Surge Beta', kind: 'vibe', pp: 18, power: 55, target: 'enemy', element: 'none', text: '{user} let the old light surge!', fx: 'surge_b' }),
    // ADR-133 (curve re-eval): Surge γ/Ω RE-DERIVED + earned EARLIER. The old
    // γ(pw1100,L31)/Ω(pw6846,L47) left Surge β as Jay's best nuke for FOUR chapters
    // (Ch.3–6) — a dead menu pick (PP for swing-equivalent damage, the exact ADR-131
    // anti-pattern). γ now lands at L26 (Ch.5) and Ω at L35 (Ch.7), each re-derived on
    // the band curve (power = bandTarget ÷ (1+Vibe/60)) so his signature nuke tracks
    // every chapter without a dead zone or an out-of-band spike. Σ (L52, the_whole_sky)
    // keeps the finale magnitude. Ladder stays monotonic (power+pp) for verify.test.
    A({ id: 'vibe_surge_g', name: 'Vibe Surge Gamma', kind: 'vibe', pp: 26, power: 360, target: 'enemies', element: 'none', text: '{user} let the old light ROAR!', fx: 'surge_g' }),
    A({ id: 'vibe_surge_o', name: 'Vibe Surge Omega', kind: 'vibe', pp: 44, power: 1250, target: 'enemies', element: 'none', text: 'The hill, the town, the sky — all of it surged through {user}!', fx: 'surge_o' }),
    A({ id: 'lifeup_a', name: 'Lifeup Alpha', kind: 'vibe', pp: 5, power: 12, heal: true, target: 'ally', element: 'none', text: '{user} hummed a warm note!', fx: 'lifeup' }),
    A({ id: 'lifeup_b', name: 'Lifeup Beta', kind: 'vibe', pp: 11, power: 116, heal: true, target: 'ally', element: 'none', text: '{user} hummed a warm note!', fx: 'lifeup' }),
    // heal tiers are tuned to the SHIPPED hero-HP curve (L38 ~330-460, L52 435-625
    // — the BALANCE_REVAMP §5 "tens of thousands" widening never landed): gamma
    // spreads a near-full single heal party-wide at its earn level, omega caps it
    A({ id: 'lifeup_g', name: 'Lifeup Gamma', kind: 'vibe', pp: 24, power: 250, heal: true, target: 'allies', element: 'none', text: '{user} hummed the whole chorus!', fx: 'lifeup' }),
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
    A({ id: 'vibe_surge_x', name: 'Vibe Surge Sigma', kind: 'vibe', pp: 96, power: 9114, target: 'enemies', element: 'none', text: 'Otterbrook, the Embers, every porch light he ever ran home to — all of it surged through {user}!', fx: 'surge_x' }),

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
    A({ id: 'lifeup_o', name: 'Lifeup Omega', kind: 'vibe', pp: 40, power: 350, heal: true, target: 'allies', element: 'none', text: '{user} hummed the whole sky bright!', fx: 'lifeup' }),
    A({ id: 'resolve_a', name: 'Resolve', kind: 'vibe', pp: 10, power: 0, target: 'ally', element: 'none', status: 'steeled', text: '{user} caught their eye: stand. STAND.', fx: 'brace_snap' }),

    // Pillar E — the two "full double" extras (trim-first, §3): a stronger
    // blind and the overworld escape upgrade.
    A({ id: 'flash_o', name: 'Flash Omega', kind: 'vibe', pp: 16, power: 0, target: 'enemies', element: 'none', status: 'crying', text: '{user} went off like a whole wall of cameras!', fx: 'flash' }),
    A({ id: 'teleport_b', name: 'Teleport Beta', kind: 'vibe', pp: 4, power: 0, target: 'self', element: 'none', text: '{user} found the fast way out!', fx: 'run_up' }),

    // ---- Mia, THE GIRL WHO PRAYS — ~30 spells ("Ability Expansion"). The
    // biggest spellcaster in the game: five full elemental ladders (α/β/γ/Ω/Σ)
    // plus PRAY and a small utility set, each doing something DIFFERENT. Post-S16
    // her elemental edge is mechanically loud — the weak/resist multiplier
    // (applyElement) is the answer Jay's Ward can't take away from her. Several
    // battle-lines carry emoji flair (🔥❄⚡✨🧲) — they render through the
    // procedural glyph map (src/ui/text.ts + spritegen/font.ts), zero binary
    // assets. Voice: kind, steel-spined; the sparkle rides the flourish lines.

    // Ladder 1 — FIRE 🔥 (single→AoE; γ+ apply `burn`, Fire's DoT identity).
    A({ id: 'vibe_fire_a', name: 'Vibe Fire Alpha', kind: 'vibe', pp: 6, power: 10, target: 'enemy', element: 'fire', text: '{user} snapped her fingers — FWOOSH! 🔥', fx: 'fire_a' }),
    A({ id: 'vibe_fire_b', name: 'Vibe Fire Beta', kind: 'vibe', pp: 14, power: 26, target: 'enemies', element: 'fire', text: '{user} snapped her fingers — FWOOSH! 🔥🔥', fx: 'fire_b' }),
    A({ id: 'vibe_fire_g', name: 'Vibe Fire Gamma', kind: 'vibe', pp: 28, power: 1542, target: 'enemies', element: 'fire', status: 'burn', text: 'The air itself caught! 🔥🔥🔥', fx: 'fire_g' }),
    A({ id: 'vibe_fire_o', name: 'Vibe Fire Omega', kind: 'vibe', pp: 49, power: 5251, target: 'enemies', element: 'fire', status: 'burn', text: 'The air itself caught!', fx: 'fire_o' }),
    A({ id: 'vibe_fire_x', name: 'Vibe Fire Sigma', kind: 'vibe', pp: 78, power: 6960, target: 'enemies', element: 'fire', status: 'burn', text: '🔥 The whole sky went orange — and stayed. 🔥', fx: 'fire_x' }),

    // Ladder 2 — FREEZE ❄ (the control element; γ+ apply `frozen`, boss-capped).
    A({ id: 'vibe_freeze_a', name: 'Vibe Freeze Alpha', kind: 'vibe', pp: 7, power: 12, target: 'enemy', element: 'freeze', text: '{user} exhaled winter! ❄', fx: 'freeze_a' }),
    A({ id: 'vibe_freeze_b', name: 'Vibe Freeze Beta', kind: 'vibe', pp: 15, power: 72, target: 'enemy', element: 'freeze', text: '{user} exhaled winter! ❄❄', fx: 'freeze_b' }),
    A({ id: 'vibe_freeze_g', name: 'Vibe Freeze Gamma', kind: 'vibe', pp: 30, power: 1772, target: 'enemy', element: 'freeze', status: 'frozen', text: 'Absolute zero, with feeling! ❄', fx: 'freeze_g' }),
    A({ id: 'vibe_freeze_o', name: 'Vibe Freeze Omega', kind: 'vibe', pp: 52, power: 6036, target: 'enemy', element: 'freeze', status: 'frozen', text: 'Absolute zero, with feeling!', fx: 'freeze_o' }),
    A({ id: 'vibe_freeze_x', name: 'Vibe Freeze Sigma', kind: 'vibe', pp: 80, power: 8000, target: 'enemies', element: 'freeze', status: 'frozen', text: '❄ She breathed, and the whole room held still. ❄', fx: 'freeze_x' }),

    // Ladder 3 — VOLT ⚡ (AoE + disruption; γ+ apply `paralyzed`, the answer to packs).
    A({ id: 'vibe_volt_a', name: 'Vibe Volt Alpha', kind: 'vibe', pp: 9, power: 49, target: 'enemy', element: 'volt', text: '{user} pointed at the sky! ⚡', fx: 'volt_a' }),
    A({ id: 'vibe_volt_b', name: 'Vibe Volt Beta', kind: 'vibe', pp: 19, power: 128, target: 'enemies', element: 'volt', text: '{user} pointed at the sky! ⚡⚡', fx: 'volt_b' }),
    A({ id: 'vibe_volt_g', name: 'Vibe Volt Gamma', kind: 'vibe', pp: 36, power: 1772, target: 'enemies', element: 'volt', status: 'paralyzed', text: 'The sky answered! ⚡', fx: 'volt_g' }),
    A({ id: 'vibe_volt_o', name: 'Vibe Volt Omega', kind: 'vibe', pp: 55, power: 6036, target: 'enemies', element: 'volt', status: 'paralyzed', text: 'The sky answered — and kept answering!', fx: 'volt_o' }),
    A({ id: 'vibe_volt_x', name: 'Vibe Volt Sigma', kind: 'vibe', pp: 82, power: 8000, target: 'enemies', element: 'volt', status: 'paralyzed', text: '⚡ Every hair on every arm stood up at once. ⚡', fx: 'volt_x' }),

    // Ladder 4 — PP STEAL 🧲 (Mia drains enemy magic; Ω/Σ also drain HP, `lifedrain`).
    A({ id: 'magnet_a', name: 'Magnet Alpha', kind: 'vibe', pp: 3, power: 0, target: 'enemy', element: 'none', status: 'pp_drain', text: '{user} held out her palm! 🧲', fx: 'magnet' }),
    A({ id: 'magnet_b', name: 'Magnet Beta', kind: 'vibe', pp: 6, power: 0, target: 'enemy', element: 'none', status: 'pp_drain', text: '{user} pulled harder — 🧲💜', fx: 'magnet' }),
    A({ id: 'magnet_g', name: 'Magnet Gamma', kind: 'vibe', pp: 10, power: 0, target: 'enemies', element: 'none', status: 'pp_drain', text: 'She drew the magic out of the whole room! 🧲', fx: 'magnet' }),
    A({ id: 'magnet_o', name: 'Magnet Omega', kind: 'vibe', pp: 16, power: 0, target: 'enemy', element: 'none', status: 'lifedrain', text: '🧲 She took the spark AND the warmth. 💜', fx: 'magnet' }),
    A({ id: 'magnet_x', name: 'Magnet Sigma', kind: 'vibe', pp: 24, power: 0, target: 'enemies', element: 'none', status: 'lifedrain', text: '🧲💜 Every Ember in earshot leaned toward her. 💜🧲', fx: 'magnet' }),

    // Ladder 5 — STARSONG ✨ (holy light, the anti-Hush element; pierces resist).
    A({ id: 'starsong_a', name: 'Starsong Alpha', kind: 'vibe', pp: 8, power: 10, target: 'enemy', element: 'holy', text: "{user} hummed a note the dark couldn't eat. ✨", fx: 'starsong_a' }),
    A({ id: 'starsong_b', name: 'Starsong Beta', kind: 'vibe', pp: 17, power: 500, target: 'enemies', element: 'holy', text: '✨ The note spread, warm and gold. ✨', fx: 'starsong_b' }),
    A({ id: 'starsong_g', name: 'Starsong Gamma', kind: 'vibe', pp: 30, power: 1772, target: 'enemies', element: 'holy', text: "Every Ember she'd ever heard answered. 🌟", fx: 'starsong_g' }),
    A({ id: 'starsong_o', name: 'Starsong Omega', kind: 'vibe', pp: 50, power: 6036, target: 'enemies', element: 'holy', text: 'The Homesong, one verse of it, let loose. ✨🌟', fx: 'starsong_o' }),
    A({ id: 'starsong_x', name: 'Starsong Sigma', kind: 'vibe', pp: 84, power: 8000, target: 'enemies', element: 'holy', text: '🌟✨ She sang, and for a moment the Hush remembered being light. ✨🌟', fx: 'starsong_x' }),

    A({ id: 'pray', name: 'Pray', kind: 'pray', pp: 0, power: 0, target: 'allies', element: 'holy', text: '{user} prayed with all her heart.', fx: 'pray' }),

    // Utility (4 — non-damage choices that round her to ~30 and make her a party
    // amplifier). Heartmend = a RELIABLE heal (not hostage to PRAY's RNG); Lucky
    // Star = party crit/dodge up (`lucky`); Hush Hex = focus-fire enabler
    // (`exposed`, ×1.3 incoming, stacks with `marked`); Dreamlull = mass sleep.
    A({ id: 'heartmend_a', name: 'Heartmend', kind: 'vibe', pp: 12, power: 199, heal: true, target: 'ally', element: 'none', text: '{user} pressed a warm hand to a hurt. 💛', fx: 'lifeup' }),
    A({ id: 'lucky_star', name: 'Lucky Star', kind: 'vibe', pp: 10, power: 0, target: 'allies', element: 'none', status: 'lucky', text: '{user} wished on the first star out. 🍀⭐', fx: 'starsong_a' }),
    A({ id: 'hush_hex', name: 'Hush Hex', kind: 'vibe', pp: 14, power: 0, target: 'enemies', element: 'none', status: 'exposed', text: '{user} named the hollow in them.', fx: 'brainjam' }),
    A({ id: 'dreamlull', name: 'Dreamlull', kind: 'vibe', pp: 12, power: 0, target: 'enemies', element: 'none', status: 'asleep', text: '{user} hummed the lullaby Mom used. 🌙', fx: 'hypno' }),

    // ---- Milo: gadgets (no Vibe)
    A({ id: 'spy', name: 'Spy', kind: 'gadget', pp: 0, power: 0, target: 'enemy', element: 'none', text: '{user} adjusted his glasses and took notes!', fx: 'spy_scan' }),
    A({ id: 'repair', name: 'Repair', kind: 'gadget', pp: 0, power: 0, target: 'self', element: 'none', text: '{user} tinkers while everyone sleeps.', fx: 'repair_overnight' }),
    A({ id: 'bottle_rocket', name: 'Bottle Rocket', kind: 'gadget', pp: 0, power: 28, target: 'enemy', element: 'physical', text: '{user} lit a bottle rocket! Psssshh!', fx: 'rocket' }),
    A({ id: 'big_bottle_rocket', name: 'Big Bottle Rocket', kind: 'gadget', pp: 0, power: 60, target: 'enemy', element: 'physical', text: '{user} lit a BIG bottle rocket!', fx: 'rocket_big' }),
    A({ id: 'multi_bottle_rocket', name: 'Multi Bottle Rocket', kind: 'gadget', pp: 0, power: 140, target: 'enemies', element: 'physical', text: '{user} lit the whole crate!', fx: 'rocket_multi' }),

    // ---- Milo, DOUBLED ("Gadget Genius, Doubled"). Six new 0-PP gadgets take
    // his kit 5 → 11 — pure competence, NO Vibe (gadgetDamage reads `power`
    // alone, his Vibe is 0). He's the party's TOOLBOX, never the nuke: a
    // force-multiplier MARK (the shared 'marked' status — amplify + can't-miss,
    // wired once with Pippa's), elemental grenades (volt/freeze) that give the
    // no-magic team coverage, a deployable party SHIELD, 0-PP healing so the
    // psychics aren't hostage to PP, and a boss-buster siege rocket. Every face
    // REUSES an existing fx family. Voice: deadpan, talks to machines.
    A({ id: 'scope', name: 'Scope', kind: 'gadget', pp: 0, power: 0, target: 'enemy', element: 'none', status: 'marked', text: '{user} ranged the target. "Calibrating… got you."', fx: 'scope' }),
    A({ id: 'static_bomb', name: 'Static Bomb', kind: 'gadget', pp: 0, power: 20, target: 'enemies', element: 'volt', status: 'paralyzed', text: '{user} armed the EMP. "Discharge."', fx: 'static_bomb' }),
    A({ id: 'cryo_grenade', name: 'Cryo Grenade', kind: 'gadget', pp: 0, power: 80, target: 'enemy', element: 'freeze', status: 'frozen', text: '{user} pulled the pin. "Coolant away."', fx: 'cryo_grenade' }),
    A({ id: 'forcefield_gizmo', name: 'Forcefield Gizmo', kind: 'gadget', pp: 0, power: 0, target: 'allies', element: 'none', status: 'shield', text: '{user} deployed the emitter. "Field up — everyone inside."', fx: 'forcefield_gizmo' }),
    A({ id: 'med_spray', name: 'Med-Spray', kind: 'gadget', pp: 0, power: 90, heal: true, target: 'ally', element: 'none', status: 'cure', text: '{user} hit them with the med-spray. "Hold still."', fx: 'med_spray' }),
    A({ id: 'siege_rocket', name: 'Siege Rocket', kind: 'gadget', pp: 0, power: 360, target: 'enemy', element: 'physical', pctMaxHp: 0.02, deepensBreak: true, text: '{user} shouldered the siege tube. "Payload away."', fx: 'siege_rocket' }),

    // ---- Dorin, THE MONK'S FULL PATH ("Ability Expansion"). The monastery
    // martial artist's kit roughly doubles (7 → ~14): the Comet, Healing, and
    // Brainjam ladders complete; Mirror gains a party version (nearly free on
    // the S16 mitigateIncoming seam); and two MARTIAL STANCES make his own turn
    // a defensive/offensive choice. His Ch.9 homecoming completes the path of a
    // master, not a new recruit, so his unlocks cluster high. Voice: formal, calm,
    // faintly baffled by the modern world; his battle lines read like sutras.
    // ADR-133 (curve re-eval): Comet RE-DERIVED for Dorin's Ch.5-end recruitment
    // (ADR-125 — he joins at L26 and travels Ch.6→10, NOT the obsolete Ch.9 join the §1d ceiling
    // numbers were computed for). The old powers (α1070…Ω6497) made him ~×4 over-band
    // the moment he joined (Comet β alone = ~4,170 AoE at L26). Re-derived on the band
    // curve at his real earn-levels (α on-join L26→Ch.6, β L33→Ch.7, γ L40→Ch.8,
    // Ω L46 awakening→Ch.9-10) so he joins a CAPABLE master who tracks the curve, never
    // a content-trivialiser. Ladder climbs by tier (430<900<2000<3400) AND by earn-level
    // now (γ L40 < Ω L46 — the old γ-after-Ω inversion is gone).
    A({ id: 'vibe_comet_a', name: 'Vibe Comet Alpha', kind: 'vibe', pp: 20, power: 430, target: 'enemies', element: 'none', text: '{user} called down the cold stars!', fx: 'comet_a' }),
    A({ id: 'vibe_comet_b', name: 'Vibe Comet Beta', kind: 'vibe', pp: 30, power: 900, target: 'enemies', element: 'none', text: '{user} called down the cold stars!', fx: 'comet_b' }),
    A({ id: 'vibe_comet_g', name: 'Vibe Comet Gamma', kind: 'vibe', pp: 44, power: 2000, target: 'enemies', element: 'none', text: 'The mountain answers. The sky falls.', fx: 'comet_g' }),
    // Comet Ω is the single awakening now (trial_of_the_mute_mountain, §6) — the
    // mastery earned at the homecoming Trial. NOT a level unlock or join gate.
    A({ id: 'vibe_comet_o', name: 'Vibe Comet Omega', kind: 'vibe', pp: 60, power: 3400, target: 'enemies', element: 'none', text: 'The sky opened. The stars remembered.', fx: 'comet_o' }),
    A({ id: 'mirror', name: 'Mirror', kind: 'vibe', pp: 4, power: 0, target: 'self', element: 'none', status: 'mirror', text: '{user} became perfectly still water.', fx: 'mirror_snap' }),
    // party Mirror — overlaps Jay's Power Shield on purpose but lands FASTER
    // (Dorin acts first). The 'mirror' status is already party-capable through
    // mitigateIncoming (S16); 'allies' just loops the existing apply path.
    A({ id: 'mirror_o', name: 'Mirror Omega', kind: 'vibe', pp: 16, power: 0, target: 'allies', element: 'none', status: 'mirror', text: '{user} made the whole party still water.', fx: 'mirror_o' }),
    A({ id: 'healing_a', name: 'Healing Alpha', kind: 'vibe', pp: 5, power: 0, target: 'ally', element: 'none', status: 'cure', text: '{user} pressed two fingers to the brow.', fx: 'healing_cure' }),
    // Healing β adds an actual HP heal (α is a status-cure only) so Dorin can
    // main-heal; Healing Ω is the clutch party pickup — mass revive + 60% HP +
    // a full cleanse, and his high Speed lands it FIRST (the whole point).
    A({ id: 'healing_b', name: 'Healing Beta', kind: 'vibe', pp: 12, power: 150, heal: true, target: 'ally', element: 'none', text: '{user} pressed warmth into the wound.', fx: 'healing_cure' }),
    A({ id: 'healing_g', name: 'Healing Gamma', kind: 'vibe', pp: 20, power: 0, target: 'ally', element: 'none', status: 'revive', text: '{user} spoke an old word.', fx: 'healing_revive' }),
    A({ id: 'healing_o', name: 'Healing Omega', kind: 'vibe', pp: 34, power: 0, target: 'allies', element: 'none', status: 'revive', text: '{user} spoke the old word over everyone.', fx: 'healing_revive' }),
    A({ id: 'brainjam_a', name: 'Brainjam Alpha', kind: 'vibe', pp: 12, power: 0, target: 'enemy', element: 'none', status: 'hushed', text: '{user} crossed the wires of a mind!', fx: 'brainjam' }),
    // Gamma bridges the single→AoE jump with a LONGER single-target lock — the
    // anti-caster tool (great vs enemy mages and boss spell phases).
    A({ id: 'brainjam_g', name: 'Brainjam Gamma', kind: 'vibe', pp: 20, power: 0, target: 'enemy', element: 'none', status: 'hushed', text: '{user} knotted the wires and held them shut!', fx: 'brainjam' }),
    A({ id: 'brainjam_o', name: 'Brainjam Omega', kind: 'vibe', pp: 30, power: 0, target: 'enemies', element: 'none', status: 'hushed', text: '{user} crossed every wire at once!', fx: 'brainjam' }),
    // MARTIAL STANCES — his turn isn't always "nuke or heal." braced answers a
    // physical boss (brace + counter); flowing answers a flurry (speed + dodge).
    A({ id: 'stone_stance', name: 'Stone Brow Stance', kind: 'vibe', pp: 6, power: 0, target: 'self', element: 'none', status: 'braced', text: '{user} settled into Stone Brow Stance. "The mountain answers."', fx: 'stone_stance' }),
    A({ id: 'flowing_step', name: 'Flowing Step', kind: 'vibe', pp: 6, power: 0, target: 'self', element: 'none', status: 'flowing', text: '{user} flowed into Flowing Step. "Be still water."', fx: 'flowing_step' }),

    // ---- Pippa: the page's tactical kit (§A3, S15h). NO Vibe, NO PP — like
    // Milo, her moves are competence not magic, so they ride kind 'physical'
    // at 0 PP. The statuses below are her Ch.5 battle hooks (the support
    // mechanics wire in when she joins); the faces reuse existing fx families.
    A({ id: 'pinpoint_mark', name: 'Pinpoint Mark', kind: 'physical', pp: 0, power: 0, target: 'enemy', element: 'none', status: 'marked', text: "{user} marked the shot — now the party can't miss it!", fx: 'pinpoint_mark' }),
    A({ id: 'royal_rally', name: 'Royal Rally', kind: 'physical', pp: 0, power: 0, target: 'allies', element: 'none', status: 'rally', text: '{user} called the rally — the party stands quick and lucky!', fx: 'royal_rally' }),
    A({ id: 'pocket_patch', name: 'Pocket Patch', kind: 'physical', pp: 0, power: 110, heal: true, target: 'ally', element: 'none', status: 'cure', text: '{user} patched an ally up — needle, thread, and a clean bandage!', fx: 'pocket_patch' }),
    A({ id: 'scale_step', name: 'Scale Step', kind: 'physical', pp: 0, power: 0, target: 'self', element: 'none', status: 'evasion', text: '{user} stepped to thimble-scale — and left a decoy standing!', fx: 'scale_step' }),
    A({ id: 'big_little_focus', name: 'Big-Little Focus', kind: 'physical', pp: 0, power: 0, target: 'allies', element: 'none', status: 'focus', text: '{user} and the party found the big-little focus!', fx: 'big_little_focus' }),
    A({ id: 'bellwether', name: 'Bellwether', kind: 'physical', pp: 0, power: 0, target: 'allies', element: 'none', status: 'morale', text: '{user} rang the bellwether — the next prayer will carry!', fx: 'bellwether' }),

    // ---- Pippa, DOUBLED (S15h+ — "The Page's Full Brief"). Six new tactical
    // moves take her to ~12, all kind 'physical'/0 PP (competence, not the old
    // light — none scale on Vibe). They deepen the support/control loop: marks
    // make the big kids reliable AND set up party AoE turns; rally/focus/morale
    // lift the team; field medicine keeps the no-magic kids covering upkeep; and
    // guarded/rattled answer telegraphed boss turns without a drop of magic.
    // Every face REUSES an existing fx family (scan / sparkle_rain / barrier).
    // Voice: precise, diplomatic, furious when called adorable — battle lines
    // read like the minutes of a meeting ("Noted. Marked. Proceed.").
    A({ id: 'volley_mark', name: 'Volley Mark', kind: 'physical', pp: 0, power: 0, target: 'enemies', element: 'none', status: 'marked', text: '{user} marked the whole row. "Noted. Marked. Proceed."', fx: 'volley_mark' }),
    A({ id: 'diplomatic_immunity', name: 'Diplomatic Immunity', kind: 'physical', pp: 0, power: 0, target: 'ally', element: 'none', status: 'guarded', text: '{user} stepped in front. "I will be taking that one."', fx: 'diplomatic_immunity' }),
    // 0-PP field medicine is FREE every turn, so it stays a top-up, not a full
    // reset: ~110 single / ~180 party against ~210-310 hero HP at earn keeps
    // enemy pressure meaningful through the back half (was 360/700 — tuned
    // against the never-landed §5 HP widening, i.e. infinite free full heals)
    A({ id: 'field_dressing', name: 'Field Dressing', kind: 'physical', pp: 0, power: 180, heal: true, target: 'allies', element: 'none', status: 'cure', text: '{user} worked the line — needle, thread, and a stern word.', fx: 'field_dressing' }),
    A({ id: 'stern_decree', name: 'Stern Decree', kind: 'physical', pp: 0, power: 0, target: 'enemies', element: 'none', status: 'rattled', text: '{user} read them the decree. The room went small and sorry.', fx: 'stern_decree' }),
    A({ id: 'standing_ovation', name: 'Standing Ovation', kind: 'physical', pp: 0, power: 0, target: 'allies', element: 'none', status: 'rally', text: '{user} called the house to its feet — GO!', fx: 'standing_ovation' }),
    A({ id: 'the_minutes', name: 'The Minutes', kind: 'physical', pp: 0, power: 0, target: 'allies', element: 'none', status: 'focus', text: '{user} took the minutes mid-disaster — and corrected the record.', fx: 'the_minutes' }),
  ].map((a) => [a.id, a]),
);

/* ---------------- ability families (ADR-133 — the grouped battle menu) ----------------
 * The in-battle Vibe/Gadgets/Tactics menus MESH a whole ladder (Vibe Fire α…Σ) into ONE
 * box, so a late-game Mia browses ~9 family rows instead of ~25 flat rungs. A family is an
 * ability's display name minus its α/β/γ/Ω/Σ tier word; a non-laddered ability is its own
 * one-rung family (the menu casts it directly, no submenu). Pure — unit-testable, no UI. */
const TIER_SUFFIX = /\s+(Alpha|Beta|Gamma|Omega|Sigma)$/;

/** the family an ability belongs to — its name without the trailing tier word. */
export function abilityFamily(name: string): string {
  return name.replace(TIER_SUFFIX, '');
}

export interface AbilityGroup {
  family: string;
  /** the family's rung ids, sorted by PP (α→Σ within a ladder) */
  ids: string[];
}

/** group an ORDERED ability-id list into families, preserving first-seen family order so
 *  the menu's top level reads stable; each family's rungs sort by PP (the ladder order). */
export function groupAbilityFamilies(ids: string[]): AbilityGroup[] {
  const order: string[] = [];
  const byFamily = new Map<string, string[]>();
  for (const id of ids) {
    const ab = ABILITIES[id];
    if (!ab) continue;
    const fam = abilityFamily(ab.name);
    if (!byFamily.has(fam)) {
      byFamily.set(fam, []);
      order.push(fam);
    }
    byFamily.get(fam)!.push(id);
  }
  return order.map((family) => ({
    family,
    ids: byFamily.get(family)!.slice().sort((a, b) => ABILITIES[a].pp - ABILITIES[b].pp),
  }));
}

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
