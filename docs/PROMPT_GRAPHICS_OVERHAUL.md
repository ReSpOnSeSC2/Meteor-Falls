# PROMPT — METEOR FALLS: SNES-Tier Pixel-Art Upgrade (Chrono Trigger / Mother 3 / EarthBound)

> **⚠️ SUPERSEDED — resolution rules.** This brief proposes redrawing the procedural
> generators at `ART_SCALE = 2` (48×64 hero). That is **not** what shipped. The
> canonical rules are now **ADR-110**: the render bump is `ART_SCALE = 4` →
> **1600×900** framebuffer, the procedural engine is **FROZEN** at its native sizes
> (ADR-109), and the runtime upscales ×4 — so characters render at **96×128**
> (24×32 native), tiles 64×64, busts 128×128, battlers 112×144, sport 128×160. Art
> is now **authored as PNGs** ([ART_PIPELINE.md](ART_PIPELINE.md)), not regenerated.
> The `ART_SCALE = 2` / 48×64 numbers below are kept as the historical proposal;
> read [SCALE_CONVENTION.md](SCALE_CONVENTION.md) for the live rules.

> **Paste this whole file to the implementing agent.** It is the complete brief for
> raising every procedurally-generated sprite in the game from the shipping
> **minimal 24×32 EarthBound look** to a **richer, crisp SNES/GBA JRPG tier** —
> Chrono Trigger / Mother 3 / EarthBound — proven in `tools/proto-snes.ts`.
>
> **This stays inside the existing engine.** No RGBA rewrite, no anti-aliased soft
> gradients, no new renderer. The upgrade is three things, all in the current
> palette-locked, hard-pixel, index-based pipeline:
>   1. **higher native resolution** (≈2×),
>   2. **more shading detail** via the engine's *existing* ADR-101 6-stop lit
>      primitives (`litRect`, `litEllipse`, `sphere`, `softShade`, `rimLight`,
>      `outlineLit`, `aaDiag`, `finish`),
>   3. **better (less-chibi) proportions**.
>
> Because we keep the index/palette architecture, we also keep its superpowers:
> **determinism, zero binary assets, palette conformance, and cheap recolor
> variety** — all unchanged. That is what makes this weeks, not months.
>
> *(Supersedes the earlier HD/RGBA-overhaul draft, which was rejected as too soft
> and too costly. `tools/proto-hero.ts` remains only as the record of that path.)*
>
> The work still touches the whole game, so it is phased so the **game stays
> runnable and all tests stay green after every phase**. Do the phases in order.

---

## 0. Mission & non-negotiables

**Mission.** One cohesive SNES-JRPG art system — one light model, the existing
material ramps, crisp pixels, expressive 6-stop shading, slightly slimmer
proportions — applied uniformly to heroes, NPCs, enemies, busts, battlers,
buildings, vehicles, tiles, icons, font, and UI, so the whole game reads as one
upgraded title in the Chrono Trigger / Mother 3 lineage.

**Non-negotiables (tested; violating any one fails the phase):**

1. **Deterministic.** Seeded `mulberry32` only. No `Date.now`/`Math.random`/`new
   Date`. Same inputs → same bytes.
2. **Zero binary art assets.** Everything code-generated. (`.shots/` PNGs are
   throwaway review output only.)
3. **Palette-locked — ADR-020 stays.** Every pixel is a master-palette index or
   transparent. *Keep* the existing "palette-only" conformance test; do not loosen
   it. (This is the big advantage over the rejected RGBA path — minimal test churn.)
4. **Cheap variety preserved.** `recolor` / `swapRamp` / `recolorFrames` keep
   working on the index buffer exactly as today. No variety rework.
5. **Never break the build.** After each phase: `npm test` green, `npm run build`
   green, game boots and is playable. Migrate behind per-domain flags (§4).
6. **Preserve every contract.** The 44-frame sheet layout & indices, `flipX`
   mirroring, bust/battler derivation from `CharacterSpec`, all gameplay APIs.

---

## 1. Orientation — read these before writing anything

- **The style proof:** `tools/proto-snes.ts` — the canonical reference. It draws a
  32×48 Jay with the **real engine** at the target tier. Appendix A distils it.
- **Render core (already capable):** `src/spritegen/pixmap.ts`. Note especially the
  ADR-101 lit primitives that *already* produce this look: `litRect`, `litEllipse`,
  `sphere`, `softShade`, `rimLight`, `outlineLit`, `aaDiag` (selective pixel-AA, NOT
  soft blur), and `finish()`. Plus `recolor`/`swapRamp` (variety) and
  `drawTo`/`toCanvas` (consumption).
- **Palette / shading vocabulary:** `src/palette.ts` — the 16 ramps × **6 shades**
  (`SH.SHADOW…HILITE`, `pxr`). This is your shading toolkit; richer art = using more
  of the ramp, not new colours.
- **Characters & the contract:** `src/spritegen/characters.ts` — `CharacterSpec`,
  `metrics()` per `Build`, front/side/back part draws, **the 44-frame sheet
  contract** (0–15 walk · 16–23 run · 24–35 diag-walk · 36–43 diag-run · 44+ idle),
  diagonal stitching, the `detail` hook (runs pre-stitch), the `CAST` roster.
- **Derived from the same spec:** `busts.ts` (32×32), `battlers.ts`, `athletes.ts`,
  `golfers.ts`.
- **World & objects:** `enemies.ts`, `buildings.ts`, `vehicles.ts`, `tiles.ts`
  (`TILE=16`), `weapons.ts`, `flair.ts`, `arcade.ts`, `ch2.ts`.
- **UI/text:** `icons.ts`, `iconforge.ts`, `glyphforge.ts`, `font.ts`, `ui.ts`.
- **Export & tools:** `tools/png.ts`; the `art:*` scripts in `package.json`.
- **Consumption & scale coupling:** grep `addCanvas`/`toCanvas` in `src/scenes/`, and
  every constant tied to `TILE`/`FRAME_W`/`FRAME_H`/`BUST_*`.
- **Anchors:** `docs/DECISIONS.md` (re-grep for the next free ADR number);
  `docs/ART_LOOP.md`; `docs/GAME_BIBLE.md` art section.

**Deliverable for §1:** `docs/SNES_UPGRADE_NOTES.md` — per domain: the generator
entry points, the scene/tool consumers, and **every hardcoded pixel constant tied to
`TILE`/`FRAME_*`/`BUST_*`** (movement step, sprite anchor/offset, depth-sort math,
any pixel hitboxes, camera zoom, UI layout). This inventory drives §3 scale-safety.

---

## 2. Write the Style ADR first (single source of truth)

Author **ADR-1xx — "The SNES Pixel Upgrade"** in `docs/DECISIONS.md` (next free
number). Fix every global so no phase invents its own.

### 2.1 Resolution — one constant
`ART_SCALE` (default **2**). Native sizes = current × `ART_SCALE`:

| Domain | Current | New (`ART_SCALE=2`) |
|---|---|---|
| Tile | 16×16 | **32×32** |
| Hero / NPC frame | 24×32 | **48×64** |
| Bust | 32×32 | **64×64** |
| Icons / buildings / vehicles / glyphs | per module | × `ART_SCALE` |

Draw **at native resolution** — no supersampling. Crisp hard pixels are the look.
`tools/proto-snes.ts` is a 32×48 sample of the same style; the shipping hero size is
48×64 (more room for the detail). Express **every** pixel offset as `× ART_SCALE`.

### 2.2 Shading doctrine (reuse what exists)
- **One key light, upper-left** — the existing `LIGHT = {x:-1,y:-1}`.
- Build forms from the **6-stop lit primitives** (`litRect`/`litEllipse`/`sphere` for
  volume; `softShade`/`rimLight` for re-shading & catch-light; `finish()` =
  `outlineLit` + `aaDiag` for the selective lit outline and EB/CT-style pixel-AA).
- **No soft gradients, no blur.** Shading is discrete ramp bands; "anti-aliasing" is
  only `aaDiag`'s single intermediate-shade pixel on convex stair tips.
- Detail budget: enough shading to read as CT/Mother 3 at game zoom, **not** noisy.
  Define a per-domain "max distinct shades per material region" guideline.

### 2.3 Proportions
New `metrics()` per `Build` at 48×64 — slightly slimmer & less top-heavy than the
current chibi (CT/Mother 3 kid ≈ 1:3 head-to-body). Seed from the `proto-snes.ts`
layout (Appendix A): smaller head fraction, defined neck, waist taper, real hands &
shoes. Specify `kid`, `chub`, `adult` tables.

### 2.4 Palette
**Keep the 96-colour master palette.** Richer art comes from *using more of each
6-stop ramp*, not new hues. Adding a ramp is allowed **only** for a genuine gap
(e.g. dedicated stone/metal) and **must** extend `src/palette.ts` so ADR-020 still
passes. Prefer reuse.

### 2.5 Determinism & bounds
Seeded RNG only; every sprite renders fully within its native bounds (ADR-009 at the
new size). Both stay enforced by tests (§7).

---

## 3. Scale plumbing (the one structural change) — little/no visual change yet

This is the **riskiest structural step**, so do it first, with the game still
booting and looking ~the same:

- Introduce `ART_SCALE` in one config module. Route `FRAME_W`/`FRAME_H`, `TILE`,
  `BUST_*`, and every pixel constant from the §1 inventory through it.
- **Map logic is in tile *units* and must NOT change** — only *pixel* sizes/offsets
  scale. Audit camera zoom, per-frame movement step (px), sprite anchor/foot offset,
  depth-sort thresholds, any pixel hitboxes, and UI layout.
- Initially, generators may still emit the *old* art (upscaled or re-centred on the
  bigger canvas) so the game runs while domains are re-detailed behind flags.
- **Acceptance:** game boots; overworld/camera/collision/UI all correct at the new
  scale; tests green. (Looks almost the same — that's expected here.)

---

## 4. Compatibility bridge

Per-domain `HD_<domain>` flag. Each migrated generator keeps its public signature but
routes to the new detailed draw when its flag is on, else the legacy draw. Both end
at `toCanvas()`. Migrate one domain at a time; rollback = flip the flag.

---

## 5. Phases — each = "re-author this generator at 2× with richer 6-stop shading + better proportions"

For **every** phase: **(a)** scope files/generators · **(b)** implement behind the
domain flag · **(c)** verify with the art-review command (eyeball before/after in
`.shots/`, reuse the `cast-sheet`/`compare`/`proto-snes` harness) · **(d)** tests
green (palette-conformance, determinism, bounds, contract) · **(e)** acceptance ·
**(f)** rollback = flip flag.

- **A. Scale plumbing + proportions** (§3) + new `metrics()` tables. Low visual change.
- **B. Heroes** (`characters.ts`): re-detail all builds × 8 dirs × the full 44-frame
  sheet using the lit primitives; generalise the `proto-snes.ts` Jay; re-author every
  `CAST` look richer. Preserve indices, `flipX`, diagonal stitch, the `detail` hook
  (Pippa's cape etc. still propagate). `npm run art:castsheet` to review.
- **C. Busts + battlers** (→ 64×64) from the same specs; keep the rim-lit bust pass.
- **D. Enemies** (`enemies.ts` + forge faces): richer at 2×; **recolor variety
  unchanged**.
- **E. World: tiles, buildings, vehicles** ⚠️ highest-risk. `tiles.ts` 16→32 must
  **tessellate seamlessly** across all autotile masks; verify camera/depth/footing in
  `OverworldScene`. `art:buildings`, `art:vehicles` + an in-game screenshot.
- **F. Icons, glyphs, font, UI** — legibility first; font may stay crisp/thin-outline.
  `art:icons`, `art:glyphs` + every menu/HUD.
- **G. Minigames & misc** — `athletes.ts`, `golfers.ts`, `arcade.ts`, `flair.ts`,
  `ch2.ts`; verify `HoopsScene`/`LinksScene`/`ArcadeScene`.
- **H. Pipeline + performance** — `art:*` tools emit at new sizes; `render-appart.ts`
  (Android icons/splash). Pixels ~2× (≈4× area) — far lighter than the HD path;
  measure texture memory & gen time on a mid Android device, cache if needed, record
  ceilings in the ADR.
- **I. Cutover & cleanup** — flip all flags; full-game visual QA across **every
  scene**; remove flags & dead legacy draws; update `ART_LOOP.md`, the `GAME_BIBLE`
  art section, and the ADR.

---

## 6. PR hygiene
One PR per phase (E may split: tiles / buildings+vehicles / scale-safety). Each: green
tests, before/after contact sheets, ADR/docs touched, flag documented. No drive-by
refactors; match surrounding style; comment the *why* of non-obvious art constants.
Re-grep the ADR list before numbering. Leave git ops to the maintainer.

---

## 7. Tests & guardrails — minimal churn (the payoff of staying in-engine)
1. **Keep ADR-020 palette-only** for every domain (it already exists; extend coverage
   to new generators).
2. **Determinism** — same seed/spec → byte-identical output (already present; keep).
3. **Bounds** — nothing drawn outside the native frame.
4. **Contract** — 44-frame counts & indices, `flipX` symmetry, bust/battler
   derivation unchanged.
5. **All existing gameplay/data/engine tests stay green** throughout.

---

## 8. Performance
~2× linear (≈4× pixel area) vs today — modest. Keep runtime generation; measure
texture memory & cold-boot gen time on the Android target; add a small perf smoke
check; cache or pre-bake only if a measured ceiling is exceeded.

---

## 9. Definition of Done
- [ ] Every domain renders in the SNES-tier style with no flags (flags removed).
- [ ] Palette-conformance, determinism, bounds, and contract tests pass everywhere;
      full `npm test` + `npm run build` green.
- [ ] Performance within the ADR's ceilings on Android.
- [ ] Legacy low-res draws removed; no dead code.
- [ ] `DECISIONS.md` (the ADR), `ART_LOOP.md`, `GAME_BIBLE` art section updated.
- [ ] Full-game screenshot QA across all scenes attached and approved.

---

## Appendix A — The canonical recipe (from `tools/proto-snes.ts`)

The proto draws a 32×48 Jay with the real engine; scale the same approach to 48×64.

- **Build volume with lit primitives, then `finish()`:** `litEllipse` for head / cap
  dome / hands; `litRect` for torso / sleeves / forearms / overalls / legs;
  `litEllipse` for shoes. Then `pm.finish()` for the selective lit outline + `aaDiag`.
- **Draw order matters:** head → hair (sideburns) → **cap on top** (dome, hatband
  seam `SH.DARK`, brim `SH.LIT` over `SH.SHADOW` underside, plus a `SH.DARK` skin
  brow-shadow). (The first proto bug was drawing the cap *before* the head, which
  painted over it — order is part of the recipe.)
- **Face (EB/CT idiom):** tall almond eyes = a 2px-wide `SH.SHADOW` bar with a single
  `C.white` catchlight at the upper-left pixel; 1–2px nose shadow; a short `SH.DARK`
  mouth; optional 1px `SH.LIT` blush.
- **Materials = existing ramps:** cap `RED`, shirt `GOLD` + a `RED` ringer stripe,
  overalls `BLUE` (straps `SH.LIT`/`SH.BASE`, brass buttons `GOLD SH.HILITE`, inseam
  `SH.SHADOW`), shoes `EARTH`, hair `INK`, skin `SKIN`. Variety later = `recolor`.
- **Proportions seed (32×48 → ×1.5 for 48×64):** head ellipse `cx16 cy16 r6×8`;
  cap dome `cx16 cy9 r8×5` + brim spanning the head width; torso `litRect(10,25,12,8)`
  (waist within shoulders); arms tucked just outside the torso; split legs with a
  `SH.SHADOW` inseam; shoes as flat `litEllipse`. These become the kid `metrics()`.
- **No supersampling, no RGBA.** Crispness and palette-lock are the whole point.

> The proto is one static front pose. Generalising to all builds × 8 facings × 44
> frames, plus busts/battlers/enemies/world/UI, is the bulk of the work — but each
> piece is *re-detailing an existing generator at higher resolution*, not building a
> new renderer. Budget ~3–6 focused weeks.
