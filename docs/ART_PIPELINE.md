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

> **Scale note (ADR-110).** The runtime framebuffer is **1600×900** (`ART_SCALE = 4`
> in `src/spritegen/scale.ts`). The runtime frame sizes in the table below are the
> **×1 base** — the actual runtime export is **native × 4** (tile 16→**64**, char
> 24×32→**96×128**, bust 32×32→**128×128**, battler 28×36→**112×144**, sport
> 32×40→**128×160**). Export each runtime sheet at that ×4 size for crisp art; a legacy
> ×1 sheet still renders (auto-upscaled, chunky) via the transition fallback until you
> replace it. Full-screen screen PNGs (title/boot/name-entry/save-slots backgrounds)
> should be authored at **1600×900**.

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

## Walk/run feet — the mirror shortcut (half-authored sheets)

imagegen won't reliably draw a clean *alternating-feet* walk cycle, and you can't
control which foot it puts forward. You don't have to. A horizontal flip of a
single front/back stepping pose **is** the other foot, by construction — so you
can author **one** step per facing and let the slicer generate the opposite-foot
frame.

- Author the **down** and **up** walk with a single clear step (either foot —
  whichever imagegen drew). Leave the `walkB`/`runB` cells as a copy of the
  step (or blank); they get overwritten.
- Set `mirrorFeet: true` on that character's entry in `HERO_ART` /
  `NPC_CHARACTER_ART` (`src/spritegen/authored.ts`). At slice time
  `makeCharacterCanvas` fills the down/up `walkB`/`runB` cells with a horizontal
  flip of `walkA`/`runA` (frame pairs `1→3`, `13→15`, `16→17`, `22→23`).
- **Default is off** — it's strictly opt-in, so hand-authored second-foot frames
  on the existing cast are never clobbered.

Scope: only **down/up** get the foot mirror. Flipping a **profile** (left/right)
pose changes the *facing*, not the foot, so author those normally (or mirror the
left column to the right column by hand). Note a flip also mirrors any asymmetry
(hair part, bag, logo) — usually invisible at 24×32, but check.

## Character 46-frame walk sheets — the ChatGPT reference-paste pipeline (canonical)

**The game ALWAYS generates its source images with ChatGPT** (chatgpt.com image
generation — *not* procedural code, *not* another model). This is the proven,
canonical way to author or repair any character/NPC `<id>_anim_46_4x.png` walk
sheet. Validated across the full Ch.1–Ch.6 NPC cast, 2026-06-18.

### Sheet format
- `<id>_anim_46_4x.png` — **384×1536**, **96×128 per frame**, 4 cols × 12 rows, **46 frames**.
- Runtime: `assets/art/characters/<id>_anim_46_4x.png`. Master (source of truth):
  `assets/art/masters/characters/animation/<id>_anim_46_4x_master.png`. Wired via
  `NPC_CHARACTER_ART` / `HERO_ART` in `src/spritegen/authored.ts`.
- **Frame map.** Cardinals `DIRS=[down,left,right,up]`: down 0–3, left 4–7, right 8–11,
  up 12–15 — each plays **[0,1,2,3] = stand, stepA, stand, stepB**. Diagonals
  `DIAG=[down-right,down-left,up-right,up-left]`: dr 24–26, dl 27–29, ur 30–32, ul 33–35
  (play [stepA,stepB], de-glided). Frames 16–23 & 36–43 are walk-copies (never play).
  Idle = 44–45 (copy of frame 0).

### The walk = a 2-STEP GROUNDED stride (match jay — user was firm, twice)
The cardinal anim reads **STAND → STEP → STAND → STEP-with-other-foot**. Per facing you
generate a **3-pose strip = [neutral stand, grounded stepA, grounded stepB]**:
- **STAND** — both feet flat together, still, NOT walking.
- **STEP** — a small natural step: legs stay **CLOSE together**, one foot planted, the
  other takes a **short LOW step**, knee only gently bent, **feet staying on/near the
  ground**. ❌ NOT a high raised-knee march. ❌ NOT a wide flat-footed lunge. Both
  extremes were explicitly rejected — copy jay's compact grounded step
  (`assets/art/characters/jay_anim_46_4x.png`), which is a **2-step** walk (stand + two
  grounded steps), not a 3-pose lift.

### Reference image — feed ChatGPT the ORIGINAL sprite (keeps the EarthBound house style)
Always attach the **original in-game sprite** as the reference so the regen keeps the
established design **and the EarthBound/Mother look** (chunky proportions, bold outlines,
like jay) instead of drifting to generic pixel-anime:
1. Crop frame 0 of the original sheet (96×128) and upscale 4× → `ref_<id>.png`.
2. **Bust** originals (waist-up, no legs): add to the prompt "draw the COMPLETE FULL
   BODY head-to-feet" + invent plausible legs/shoes that fit the character.

### Generate — ChatGPT, RE-ATTACH the real character on EVERY facing
On chatgpt.com, **one conversation per NPC**. **Paste the actual current character art
(the example) into EVERY facing request — not just the first.** Pull frame 0 of the
character's OWN sheet from the characters section (`assets/art/characters/<id>_anim_46_4x.png`
or, for unwired NPCs, the master) as the reference, and re-paste it with each prompt so
ChatGPT always has the canonical design in view.

> ⚠️ **Do NOT generate the angles as text-only follow-ups.** If you attach the reference
> once and then ask for the other facings in words, ChatGPT **drifts off both the design
> and the angle** — once the image scrolls out of immediate view it reinvents the
> character (LEFT comes out front, backs show the face, clothes/props wander). Re-attaching
> the real sprite on every facing is the fix that keeps each one on-model.

Generate the **5 unique facings**:
**DOWN** (front, face visible) → **LEFT** (strict side profile) → **UP** (from behind,
NO face) → **DOWN-LEFT** (3/4 front-left) → **UP-LEFT** (3/4 back-left). Right /
down-right / up-right are produced by **mirroring** at assemble time.

Prompt skeleton (chroma-green so the slicer can key it out):
> Pixel-art overworld sprite sheet — use the attached image as the EXACT character
> reference, keep its EarthBound look. ONE solid FLAT chroma-green (#00FF00) background,
> no shadow/ground/text. A horizontal strip of THREE FULL-BODY poses (head to feet) with
> wide green gaps, **[facing spec]**. STAND + 2-STEP grounded walk: Pose 1 = STAND (feet
> together, still); Pose 2 = STEP (legs close, one foot steps forward LOW, feet near the
> ground, slight knee bend — NOT a high march, NOT a wide lunge); Pose 3 = STEP (other foot).

Facing specs (the strict-profile / from-behind emphasis fixes the two most common
failures — profiles that come out front, and backs that show the face):
- **DOWN** — "ALL facing the CAMERA, front, face visible."
- **LEFT** — "STRICT LEFT SIDE PROFILE: rotate 90° to face LEFT, one eye & one ear, nose
  pointing left, chest NOT toward the camera."
- **UP** — "a TRUE view FROM BEHIND (walking AWAY): only the back of the head/body, NO
  face, NO eyes."
- **DOWN-LEFT** — "3/4 FRONT angled toward the lower-LEFT, face partly visible."
- **UP-LEFT** — "3/4 BACK angled toward the upper-LEFT, no face."

### Browser mechanics (automation)
- **Attach the reference by clipboard paste — do this for EVERY facing, not just the
  first:** put the PNG on the OS clipboard (PowerShell STA `[Windows.Forms.Clipboard]::SetImage`),
  then a **REAL mouse-click into the composer, then Ctrl+V** — a JS `.focus()` alone does
  NOT make the paste carry the image. Then JS-inject the prompt text (paste-FIRST-then-type)
  and click `button[data-testid="send-button"]`. **Verify the thumbnail shows the right
  character before sending** (the clipboard is shared with whatever else is running, so it
  gets clobbered — re-`SetImage` and re-paste until correct). The post-navigate **first
  paste reliably misses**; prime with a throwaway click+Ctrl+V, then paste again.
- **When the clipboard is actively contended** (e.g. another app/session copying), a one-shot
  `SetImage` loses the race. Run a **background loop that re-asserts the image every ~120ms for
  ~15s** (`run_in_background`), then paste inside that window — the reference wins. Verify the
  attach by JS (`[...form.querySelectorAll('img')].map(i=>i.naturalWidth)` → `[384]`), not a
  screenshot. `upload_image`, synthetic drag/drop events, and page `fetch` of a local ref are all
  dead ends (retrieval error / untrusted-event rejection / CSP) — real clipboard paste only.
- **Re-attach on EVERY facing:** the image generator only sees the CURRENT turn's attachment, so
  paste the reference again before each facing's prompt. Generate **DOWN → DOWN-LEFT → LEFT → UP →
  UP-LEFT** (face-views first, backs last) — a down-left generated after the back views drifts to
  a back; if it does, redo it in a fresh chat. Mind throttling ("making requests too quickly").
- **Clipboard recovery:** `SetImage` can wedge — `OpenClipboard` returns Win32 err **5
  (ACCESS_DENIED)** even though it looks free (the Windows clipboard-history service,
  `cbdhsvc`). Recovery: click the page to focus it + `navigator.clipboard.writeText(...)`
  to cycle clipboard ownership, then retry; or have the page draw the ref onto a `<canvas>`
  and `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])` (canvas blobs
  decode; raw-byte blobs may not), then Ctrl+V. `file_upload` rejects project/Downloads
  paths (only session-shared folders). If the service stays wedged it needs an admin
  `Restart-Service cbdhsvc*` or a re-login.
- **Capture:** newest generated `<img>` → force `img.decode()` (background tabs report
  `naturalWidth 0`) → canvas → `toBlob` → `<a download>` with a **unique** filename.

### Slice → assemble → verify → sync (`tools/`)
1. **Slice** each facing strip: `node tools/slice-chroma-strip.js <src> .shots/<id>_<facing>
   --expect=3 --h=108 --foot=16`.
2. **Assemble** (cp the existing sheet → `<id>_build.png`, then place/copy/mirror):
   ```
   node tools/assemble-char-sheet.js .shots/<id>_build.png .shots/<id>_build.png \
    --place=0:_down_0 --place=1:_down_1 --copy=2:0 --place=3:_down_2 \
    --place=4:_left_0 --place=5:_left_1 --copy=6:4 --place=7:_left_2 \
    --place=12:_up_0 --place=13:_up_1 --copy=14:12 --place=15:_up_2 \
    --mirror=8:4 --mirror=9:5 --mirror=10:6 --mirror=11:7 \
    --place=27:_downleft_0..2 --place=33:_upleft_0..2 \
    --mirror=24:27 --mirror=25:28 --mirror=26:29 --mirror=30:33 --mirror=31:34 --mirror=32:35 \
    --copy=16:1 …(walk copies)… --copy=44:0 --copy=45:0
   ```
   (right = mirror of left; down-right/up-right = mirror of down-left/up-left; 16–23 & 36–43
   = walk copies; 44–45 = idle.)
3. **Verify offline** (cold-boot preview stalls): `node tools/extract-char-frames.js
   .shots/<id>_build.png .shots/<id>_review.png 0 1 2 3 4 …` and eyeball the montage — rows
   must read stand-step-stand-step; left = profile; up = back.
4. **Sync:** `cp .shots/<id>_build.png assets/art/characters/<id>_anim_46_4x.png` (runtime)
   **and** `…/masters/characters/animation/<id>_anim_46_4x_master.png` (master). Unwired
   Ch.4–6 NPCs are master-only — sync the master only until their chapter wires them.

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

## Chapter 3 world-prop bank (production example, 2026-07-12)

Chapter 3 is the canonical example for adding **bespoke landmarks and set
pieces without extending the frozen procedural generator or moving tile
indices**. Two original, retained magenta-key source banks live at:

- `assets/art/masters/world/ch3-outdoor-landmarks-source.png`
- `assets/art/masters/world/ch3-machinery-stones-source.png`

They slice with `tools/slice-prop-strip.cjs` into sixteen transparent runtime
PNGs under `assets/art/world/props/`:

`ch3_viaduct_arch`, `ch3_roman_culvert`, `ch3_greenhouse_wreck`,
`ch3_cricket_pavilion`, `ch3_school_gate`, `ch3_porter_lodge`,
`ch3_telegraph_pole`, `ch3_lucille_cockpit`, `ch3_lucille_window`,
`ch3_cargo_net`, `ch3_fog_engine`, `ch3_valve_manifold`, `ch3_menhir`,
`ch3_trilithon`, `ch3_spring`, and `ch3_academy_main`.

The reproducibility contract is:

1. Keep the source banks; runtime slices are derivatives, not the only copy.
2. Key magenta to alpha and inspect every slice for transparent corners,
   fringe contamination, accidental clipping, and a grounded foot/base.
3. Register every semantic key in `WORLD_PROP_ART` and its native display
   dimensions in `AUTHORED_WORLD_PROP_DISPLAY_SIZE` (`authored.ts`). Do not
   resize a runtime PNG independently of that entry: depth, collision and map
   composition were reviewed against the registered dimensions.
4. Author collision beside each placement in `maps_ch3.ts`. The PNG's opaque
   silhouette is not a collision source; ordinary bases use `solid`, while the
   viaduct and trilithons use map-editor-supported `solidParts` for separate
   pillars so their transparent openings remain genuinely walkable. Windows,
   machinery, stones, and the academy block require different intentional footprints.
5. Run strict visual audit, content validation, the Chapter 3 map tests, a
   schematic `render-map` pass, and live screenshots. Source-bank cleanliness
   alone does not prove scale, depth, walk-behind, or interaction readability.

The two banks contain original shipped art and no bundled third-party
reference image. The exact source/runtime inventory is also recorded in
`IMAGE_ASSET_MANIFEST.md`; keep both documents in sync if a prop is added,
renamed, or retired.
