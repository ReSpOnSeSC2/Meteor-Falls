# ☄️ METEOR FALLS

An EarthBound-hearted RPG. Four kids, eight Embers, one planet at the end of
the road. Canon lives in [docs/GAME_BIBLE.md](docs/GAME_BIBLE.md); decisions in
[docs/DECISIONS.md](docs/DECISIONS.md).

**This build:** the Chapter 1 opening slice — the 2 AM meteor, Otterbrook,
Hickory Hill, Glint's prophecy, THE TITANIC TICK, the first Heartlight, the
bug zapper, and a phone call to Dad — plus the **Sprite Lab**, the live front
end of the procedural sprite engine that draws every pixel in the game at boot
(zero binary assets).

## Play it

```bash
npm install
npm run dev
```

- **On this PC:** open the printed `http://localhost:5173`.
- **On your phone:** make sure the phone is on the same Wi-Fi, then open the
  `http://192.168.x.x:5173` address Vite prints (the `--host` flag is already
  on). Landscape; tap once for fullscreen. Touch D-pad appears automatically.
- **Controller:** pair any Bluetooth/USB controller (standard mapping). The
  touch controls hide themselves and a toast confirms the hot-swap. Works on
  PC and Android. A = confirm, B = cancel/run, Start = menu.
- **Keyboard:** arrows/WASD move · Z/Space = A · X/Shift = B · Enter = menu.

Saving: find a phone and **call Dad**. (He worries.)

## Verify

```bash
npm test         # battle math, the rolling odometer, PRAY distribution, saves
npm run build    # strict typecheck + production bundle
```

## Layout

- `src/palette.ts` — the 64-color master palette (every sprite must use it)
- `src/spritegen/` — the sprite design engine: characters, enemies, tiles, UI, font
- `src/engine/` — input (touch/pad/keys), game state, WebAudio synth
- `src/battle/` — odometer model + formulas (unit-tested)
- `src/data/` — canon content: heroes, abilities, enemies, items, maps, dialogue
- `src/scenes/` — Boot, Title, Overworld, Battle, SpriteLab, UI overlay
- `tools/` — dev utilities (screenshot receiver for the QA driver)

Built per the Bible's Part C plan; next prompts continue at Phase 2 (full data
layer + Zod) and Prompt 27 (the rest of Chapter 1: the bus, Brickton City, and
the Department of Smiles).
