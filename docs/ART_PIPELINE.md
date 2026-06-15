# Art pipeline — AUTHORED PNGs (canonical)

**Status:** Canonical as of 2026-06-14 (ADR-109). Supersedes the procedural-art
rule of ADR-002 and the hero-art loop of ADR-104 ([ART_LOOP.md](ART_LOOP.md), now
historical).

All game art is **authored as PNGs**, produced with the ChatGPT / imagegen → PNG
workflow at the **`assets/art/masters/` resolution** (the high-res source of
truth), then sliced/downscaled into runtime sheets and loaded by
`src/spritegen/authored.ts`. The procedural engine in `src/spritegen/` is
**frozen** — at boot it only fills in art that has no authored PNG yet (see
[Fallback](#fallback-frozen-procedural-engine)).

## The loop

1. **Generate** the source image with ChatGPT / imagegen.
2. **Save the master** PNG into the right `assets/art/masters/<category>/`
   subfolder at the category's authoring resolution (see [Resolutions](#resolutions)).
   Keep both the raw `-source` and the background-removed `-transparent` variant
   when you have them. Raw imagegen drops can land in
   `assets/art/masters/generated/` first, then get promoted.
3. **Slice / downscale** into the runtime sheet under `assets/art/<category>/` at
   the runtime frame size.
4. **Wire it in** `src/spritegen/authored.ts` — add the key + URL to the right
   list (`HERO_ART`, `NPC_CHARACTER_ART`, `ENEMY_BATTLE_ART`, `WORLD_PROP_ART`,
   …) and, for a new category, a `preload…`/`apply…` step. `authored.ts`
   **overrides** the texture the procedural engine would have produced for that key.

At boot, authored art is applied over the generated base in this order
([BootScene](../src/scenes/BootScene.ts)):
`applyAuthoredHeroArt → generateAllTextures → applyAuthoredBattleArt →
applyAuthoredWorldArt`.

## Resolutions

Author at the masters resolution; export the runtime sheet at the frame size.
(Runtime frame sizes are the constants in `src/spritegen/authored.ts`.)

| Category | Masters source (`assets/art/masters/…`) | Runtime sheet (`assets/art/…`) |
|---|---|---|
| Characters (8-angle) | `characters/` ~2172×724 (8 facings in a row) | `characters/` 24×32 per frame · 46-frame sheet (4 cols) |
| Character animation | `characters/animation/` 384×1536 (46 frames @4×) | `characters/` 24×32 × 46 |
| Battle busts | `busts/` 1254×1254 | `busts/` 32×32 · 18 frames (4 cols) |
| Stage battlers | `battlers/` ~2030–2172×~724–775 | `battlers/` 28×36 · 14 frames (4 cols) |
| Enemies (3 wear tiers) | `enemies/` ~887×1774 | `enemies/` per-enemy `*` · `*_w1` · `*_w2` |
| World tiles / facades / props | `world/` ~1536×1024 | `world/facades/*`, `world/props/*`; tiles 16×16 |
| Minigames | (authored) | `minigames/hoops|golf|arcade/*` (sport 32×40) |
| Screens | (authored) | `screens/*` (title, boot, name-entry, game-over, …) |
| Icons | (authored) | `icons/items/*`, `icons/abilities/*`, `icons/status/*`, `fx/*` |

## Fallback (frozen procedural engine)

`src/spritegen/` still generates every texture at boot as the **base** layer,
because some categories don't have authored PNG loaders yet — the full **icon
atlas** (items/abilities/status/fx), the **bitmap font**, **vehicles**,
**glyphs/flair**, **particles**, **arcade/cage fixtures**, **forged faces**, and
**specials** (dog/angel/glint). It is **frozen**: do not add or extend
generators. To convert a still-generated category, author its PNGs and add a
loader in `authored.ts`. Once everything is covered, the engine itself can be
retired into `dormant/`.

## Do / don't

- ✅ Add or replace art by authoring a PNG + wiring `authored.ts`.
- ✅ Match the masters resolution for new source art.
- ❌ Don't write or extend `draw*` generators in `src/spritegen/`.
- ❌ Don't use `dormant/sprite-tools/` (the old `npm run art:*` render scripts) —
  they're parked for a separate program.

See also: [`/CLAUDE.md`](../CLAUDE.md), [`DECISIONS.md`](DECISIONS.md) (ADR-109),
[`IMAGE_ASSET_MANIFEST.md`](IMAGE_ASSET_MANIFEST.md).
