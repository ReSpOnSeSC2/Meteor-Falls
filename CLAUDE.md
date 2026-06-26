# Meteor Falls — agent instructions

## Art is AUTHORED, not generated (read this first)

All sprites and art are **authored as PNGs** via the **ChatGPT → PNG** workflow —
**image generation is ALWAYS ChatGPT** (chatgpt.com image generation), never
procedural code and never a different model. Source art is produced at the
resolution of **`assets/art/masters/`** (the high-res source of truth), then
sliced/downscaled into runtime sheets under **`assets/art/**`** and loaded by
**`src/spritegen/authored.ts`**.

**To add or change any sprite:**
1. Author/update the master PNG in `assets/art/masters/` at the masters
   resolution (see [`docs/ART_PIPELINE.md`](docs/ART_PIPELINE.md) for per-category sizes).
2. Slice/export the runtime PNG into the right folder under `assets/art/...`.
3. Wire it into `src/spritegen/authored.ts` (it overrides the boot textures).

**Character 46-frame walk sheets** (`<id>_anim_46_4x.png`) are authored/repaired by the
**ChatGPT reference-paste pipeline**: attach the ORIGINAL sprite as the reference (keeps
the EarthBound look), generate the 5 facings with a **grounded 2-step walk** (stand → low
step → stand → step-other-foot, like jay — *not* a high knee-march, *not* a wide lunge),
then slice (`tools/slice-chroma-strip.js`) → assemble (`tools/assemble-char-sheet.js`) →
verify (`tools/extract-char-frames.js`) → sync runtime **and** master. Full step-by-step:
[`docs/ART_PIPELINE.md` § Character 46-frame walk sheets](docs/ART_PIPELINE.md#character-46-frame-walk-sheets--the-chatgpt-reference-paste-pipeline-canonical).

**Do NOT:**
- ❌ Do **not** write or extend procedural sprite generators. `src/spritegen/`
  is **FROZEN** — it exists only as the boot/build fallback for art that does
  not yet have an authored PNG. Never add a new `draw*`/generator function to
  produce game art.
- ❌ Do **not** wire an enemy's OVERWORLD roamer to a **procedural mini** (a
  `spritegen` `mini_*` texture). Overworld enemy sprites are AUTHORED hi-res, just
  like the battlers — every enemy already has an authored battler, so DERIVE the
  roamer mini from it (`tools/derive-ch5-minis.ts`: crop-to-alpha + alpha-weighted
  downscale to ~64px), register the key in `ENEMY_MINI_ART` (`authored.ts`), and
  point the enemy's `mini:` at it. (Enemies with an authored 8-dir `overworld` sheet
  keep it — that's the directional gold standard; don't replace those with a single
  mini.) The procedural `mini_*` are boot-fallback only and are being retired
  chapter-by-chapter; `npm run visuals:audit` reports the remaining legacy roamers.
- ❌ Do **not** use the parked tooling in `dormant/sprite-tools/` (the old
  `npm run art:*` render scripts). It is retired and kept only for reuse in a
  separate program.

See [`docs/ART_PIPELINE.md`](docs/ART_PIPELINE.md) for the full pipeline and
[`docs/GAME_BIBLE.md`](docs/GAME_BIBLE.md) for the design bible.

## Balance & money — the curve is CANON (read before touching combat or prices)

The game runs on **two deliberate axes**, and all content — every chapter,
enemy, ability, boss, item, and price — must follow them (ADR-122 / ADR-120):

1. **Combat numbers are small and legible.** They ramp from **1–2 digits in Ch.1
   to the low THOUSANDS by Ch.10** (a wide JRPG curve). Each rung/enemy/boss is
   tuned to the per-band targets in [`docs/BALANCE_REVAMP.md`](docs/BALANCE_REVAMP.md)
   (with the shipped Ch.1–3 numbers in [`docs/BALANCE_CH1-3_SPEC.md`](docs/BALANCE_CH1-3_SPEC.md)
   and the late game in `docs/BALANCE_CH4-10_SPEC.md`).
2. **Money is the BIG axis.** Net worth is the number the player chases: the
   Fortune Arc climbs **$1K (Ch.1) → $3B (Ch.10)** (`src/data/fortune.ts`).
   **Combat must always stay BELOW money** — the validator enforces that every
   chapter's boss HP < that chapter's Fortune-Arc target (`tools/content-validate.ts`,
   "monetary vision"). If you add a boss/chapter that out-scales the money axis,
   `npm run validate` fails. That is intentional.

**Rules of thumb when adding/editing combat or economy:**
- Derive ability `power` from the band's target damage through the **unchanged**
  formulas in `src/battle/formulas.ts` (`power = targetDmg ÷ (1 + Vibe/60)`); the
  boss HP ladder lives in `src/levelkit/forge/curves.ts` (`BOSS_HP`). Verify with
  **`npm run balance`** (TTK must stay in the fair 4–10 window) before committing.
- Never invent a magnitude ad-hoc. Place it on the curve, update its canon pin
  (the `canon{}` table / `BOSS_HP` / `CHAPTER_MANIFESTS`), and keep money > combat.

## Build / test

- `npm run dev` — run the game (Vite dev server).
- `npm run build` — typecheck (`tsc --noEmit`) + content validation + Vite build.
- `npm test` — content validation + unit tests (vitest).
- `npm run validate` — content validation only.
