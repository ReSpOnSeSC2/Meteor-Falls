# Cadence

**Cadence** turns one **8-angle character turnaround** into the game's exact
**46-frame runtime sheet** (`<id>_anim_46_4x.png`, **384×1536**) — the file the
game loads at `assets/art/characters/<id>_anim_46_4x.png` via
`src/spritegen/authored.ts`.

It is **fully offline**: just **Pillow + numpy**. No generative AI, no cloud, no
paid APIs. Cadence reads the character's *own pixels*, builds an anatomical
skeleton, and poses that skeleton into every frame the contract needs.

```
masters/characters/<name>-8angle-transparent.png   ──►   <id>_anim_46_4x.png  (384×1536)
        (S SW W NW N NE E SE turnaround)                  + <id>_anim_46.json atlas
                                                          + per-facing preview GIFs
```

---

## Run it (the app)

A browser tool with a skeleton editor + motion tuner + live preview.

- **Windows (primary):** double-click **`start.bat`**
- **macOS / Linux:** `./start.sh`

The launcher installs dependencies (`pip install -r requirements.txt`), starts
the backend on **http://localhost:8000**, and opens your browser. It also prints
a **LAN URL** (e.g. `http://192.168.1.20:8000`) so you can open the editor on
your **phone** on the same Wi-Fi.

### UI workflow

1. **Load source** — drop in a `*-8angle-transparent.png` turnaround. Cadence
   slices the 8 facings and auto-detects a 16-joint skeleton on each.
2. **Fix joints** — review/adjust the rig on the **5 canonical facings**
   (`down, up, right, downright, upright`). The 3 left facings are mirrored
   automatically, so you never rig them by hand. Dragging a joint re-derives the
   limb masks live.
3. **Tune walk / run** — sliders for leg swing, knee bend, arm swing, bob, lean,
   crouch, fps. The preview GIF updates as you tune.
4. **Export** — writes `<id>_anim_46_4x.png` + atlas json, ready for the game.

---

## Drop-in workflow (any character)

The fastest path — works for **every** character, not just the heroes. Cadence
auto-locates the repo root, so you can run it from anywhere.

```bash
# 1. put the 8-angle turnaround in the game:
#       assets/art/masters/characters/<name>-8angle-transparent.png
# 2. generate the movement AND install it into the game in one step:
python cli.py install <name>
#    → writes assets/art/characters/<name>_anim_46_4x.png   (drop-in)
#      (the previous sheet, if any, is moved to assets/art/characters/_cadence_backup/)

# do every character at once:
python cli.py install-all
```

## CLI (other commands)

```bash
# render one character to a scratch dir (sheet + atlas + preview gifs)
python cli.py render <source-8angle.png> --name jay [--out DIR]

# render every *-8angle-transparent.png under masters → a scratch dir
python cli.py all

# debug: report how many facings were sliced and their sizes
python cli.py slice <source-8angle.png>
```

---

## Dropping output into the game

`cli.py install` writes it for you. (Manual equivalent: copy the rendered
`<id>_anim_46_4x.png` to `assets/art/characters/<id>_anim_46_4x.png`.)

It's loaded by **`src/spritegen/authored.ts`**, which overrides the boot
textures. The sheet is byte-for-byte the layout the runtime expects: **4 columns
× 12 rows of 96×128 cells = 384×1536**, mirrors derived exactly as the game
derives them (`left = flipX(right)`), every cell sharing one scale + foot-line
anchor so the sprite never jitters in-engine.

> Per the project art rules, the PNG is **authored** output, not procedurally
> generated at runtime — Cadence is the authoring tool that produces it.

---

## The 46-frame contract

4 columns wide; each cell is 96×128 px. Left / up-left / down-left are horizontal
mirrors of their right twin.

| Frames | Motion     | Facings                                  | Poses        |
|-------:|------------|------------------------------------------|--------------|
|  0–15  | walk       | down, left, right, up (×4 each)          | 0, 1, 2, 3   |
| 16–23  | run        | down, left, right, up (×2 each)          | 1, 3         |
| 24–35  | walk (diag)| downright, downleft, upright, upleft (×3)| 0, 1, 3      |
| 36–43  | run  (diag)| downright, downleft, upright, upleft (×2)| 1, 3         |
|   44   | idle       | down — breath                            | —            |
|   45   | idle       | down — blink                             | —            |

Cells 46–47 (the last row's tail) are intentionally empty padding.

---

## Develop / test

```bash
pip install -r requirements.txt          # fastapi, uvicorn, pillow, numpy, pytest
python -m pytest tests/ -q               # runs against the real Jay fixture
```

The tests are no-mock: they slice, rig, and render the actual
`assets/art/masters/characters/jay-8angle-transparent.png` and assert the
anatomy (pelvis in the lower body, feet planted at the cell bottom), the exact
384×1536 / 46-filled-cell sheet, left=flipX(right) mirroring, foot-line
anchoring, and a project create→load joint round-trip.

---

## Layout

Lives at **`tools/animator/`**.

```
tools/animator/
  engine/        rig engine (slice → skeleton → pose → 46-frame sheet)   [do not edit]
  server/        FastAPI backend wrapping the engine
  web/           browser UI (skeleton editor + motion tuner + preview)
  cli.py         batch CLI (install / install-all / render / all / slice)
  projects/      saved per-character rigs (all heroes pre-loaded for editing)
  tests/         pytest suite against the real Jay fixture
  start.bat      Windows launcher
  start.sh       macOS / Linux launcher
  requirements.txt
```

All five heroes (jay, mia, milo, pippa, dorin) are pre-loaded as projects, so the
editor's project dropdown lets you tweak any of them the same way as Jay.
