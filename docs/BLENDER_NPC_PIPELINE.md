# Blender NPC animation pipeline (OFF-CANON, opt-in)

**Status:** Experimental / off-canon as of 2026-06-18. This pipeline
**deliberately departs** from the authored-PNG art rule of
[ADR-109](DECISIONS.md) / [`docs/ART_PIPELINE.md`](ART_PIPELINE.md). It was built
on explicit request to evaluate a "one standing image → all angles + animations"
workflow via Blender. It does **not** replace the canon pipeline and nothing it
produces is wired into the game.

## What it does

`tools/blender/npc_blender_anim.py` (run with the pip `bpy` module) :

1. **Samples a palette** (hair / skin / shirt / pants / shoe) from a single
   standing sprite — the front cell of an `*-8dir-transparent.png` master, or any
   front-facing PNG.
2. **Builds a rigged low-poly humanoid** (object-FK articulated rig: torso, head,
   arms+forearms, thighs+shins+feet) tinted with that palette.
3. **Animates** idle (breath) / walk / run via a pose library, mirroring the
   opposite foot for the B-frames.
4. **Renders 8 facings** (down, downleft, left, upleft, up, upright, right,
   downright — counter-clockwise, matching `sourceByFacing` in
   `src/spritegen/authored.ts`) with an orthographic ~25° JRPG 3/4 camera.
5. **Bakes** the frames into the engine's exact **46-frame, 384×1536** character
   sheet layout (the contract in `makeCharacterCanvas`), plus a gray-bg preview
   and an optional reusable `.blend`.

Render is **Cycles on CPU** — it needs no OpenGL/EGL context, so it runs on a
GPU-less headless box (~12s for a full 46-frame sheet). Workbench/EEVEE were
tried first and fail headless with `libEGL.so.1: cannot open`.

## The honest ceiling (read before using)

A single flat PNG contains **no 3D geometry** — no back, no sides, no hair/cloth
shape. So the standing image can only drive **colour and rough proportion**, not
likeness. The output is a **posed mannequin in the NPC's colours**, and a
3D-shaded render — even at 24×32 — reads as a different art style than the
hand-authored pixel cast. See `assets/art/review/blender/_compare_borden.png`
for the side-by-side: it works mechanically, but the look clashes. This is
exactly the reason ADR-109 mandated authored pixel art.

**Bottom line:** use this for previz / placeholder / experimentation only. For
shippable, on-style NPC animation use the canon path (author the 8-dir + walk/run
pixel poses, slice into the 46-frame sheet, `mirrorFeet` for the B feet).

## Usage

```bash
pip install bpy==4.5.0          # one-time; matches Python 3.11
python3 tools/blender/npc_blender_anim.py \
  --input   assets/art/masters/characters/npc_borden-8dir-transparent.png \
  --name    npc_borden \
  --out-sheet   assets/art/review/blender/npc_borden_anim_46_4x.png \
  --out-preview assets/art/review/blender/npc_borden_preview.png \
  --blend       tools/blender/npc_rig.blend     # optional reusable rig
```

Output sheets land in `assets/art/review/blender/` **on purpose** — they are NOT
loaded by the game and never overwrite the authored `assets/art/characters/`
sprites. Wiring one in would mean copying it over a real sheet in
`NPC_CHARACTER_ART` (`src/spritegen/authored.ts`), which is intentionally a
manual, eyes-open step.

## Tuning knobs

- **Poses** — `POSES` / `_WALK_A` / `_RUN_A` (limb angles in degrees).
- **Proportions / colours** — `build_rig()` part dimensions and palette mapping.
- **Camera angle** — `setup_render()` (`cam.location`, `ortho_scale`).
- **Frame map** — `build_frame_plan()` mirrors `makeCharacterCanvas`; do not
  change one without the other.
