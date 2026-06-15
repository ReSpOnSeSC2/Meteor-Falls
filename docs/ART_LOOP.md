# The hero-art loop (ADR-104, Prompt 8)

> ⚠️ **HISTORICAL — superseded by ADR-109.** This procedural hero-art loop is no
> longer the workflow. Art is now **authored as PNGs** (ChatGPT/imagegen → PNG at
> the `assets/art/masters` resolution); the `npm run art:castsheet` command below
> was removed and its tool is parked in `dormant/sprite-tools/`. See
> [ART_PIPELINE.md](ART_PIPELINE.md). Kept for reference / if the generators are
> ever revived in a separate program.

Iterate on the procedural hero sprites **by eye** — no drawing, no binary assets.
Everything is generated from `CharacterSpec` data by `src/spritegen/characters.ts`.

## One command

```
npm run art:castsheet
```

renders the cast through the **real sprite engine**, headless, into `.shots/`:

| file | what it shows |
|------|----------------|
| `.shots/cast_angles.png` | every hero, all **8 compass facings** (down · downright · right · upright · up · upleft · left · downleft) — check every angle at once |
| `.shots/cast_anim.png` | the five leads' down-facing **life strip**: idle-breath · stand · walk-A · walk-B · blink — the frames the overworld plays |
| `.shots/cast_busts.png` | the five leads' **battle busts** (the rim-lit portrait pass) |
| `.shots/cast_angles_prev.png` | the **previous** `cast_angles.png`, copied aside before each run — open it beside the new one to judge a change (before/after) |

## The loop

1. `npm run art:castsheet`
2. Open the PNG(s) in `.shots/`.
3. Describe the next tweak in plain language — e.g.
   - "rounder cheeks on Mia"
   - "warmer shadow on Jay's jacket"
   - "stronger rim light on the hair"
   - "bigger catchlight in the eyes"
4. The change lands in `src/spritegen/characters.ts` (form, shading, face) or
   `src/spritegen/pixmap.ts` (the shared helpers: `softShade`, `rimLight`,
   `aaEdge`, `dither2`, `outlineLit`, `litEllipse`). Repeat.

It is deterministic: the same specs always render the same bytes, so a diff in
the PNG is a diff you made.

## Where the look lives

- **Palette depth** — `src/palette.ts` (6 shades/ramp; `pxr(ramp,0..5)`, `SH.*`).
- **Lighting / outline / AA / recolor helpers** — `src/spritegen/pixmap.ts`
  (`finish()`, `outlineLit()`, `aaDiag()`/`aaEdge()`, `softShade()`, `rimLight()`,
  `dither2()`, `litEllipse()`/`sphere()`/`litRect()`, `swapRamp()`/`recolor()`).
- **Hero form, shading, faces, idle** — `src/spritegen/characters.ts`.
- **Battle busts / battlers** — `src/spritegen/busts.ts`, `src/spritegen/battlers.ts`.

If you ever want one hero hand-perfected beyond the generators, author that hero
as palette-indexed pixmap span data (the codebase already does this for weapon
span tables) — still zero binary files.
