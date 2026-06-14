# PKG-06 — UI chrome, font, glyph banners & the Star Locket

Everything that frames the screen during gameplay.

## A. UI chrome (~12)
Source of truth: `src/spritegen/ui.ts`. Path `assets/art/ui/<name>.png`.
- Window/box skins — one per `WINDOW_FLAVORS` entry (9-slice; keep corner sizes).
- Touch d-pad (`drawDpad`), A/B round buttons (`drawRoundButton`), Start pill
  (`drawStartPill`), hand cursor (`drawHandCursor`).
- ATM rolling odometer strip (`drawOdometerStrip`).
- HUD icons: phone (`drawPhoneIcon`), sun (`drawSunIcon`), and misc.

## B. Font (1 sheet + 8 emoji)
- Full glyph sheet — match `FONT_CELL_W×FONT_CELL_H` and `FONT_CHARS` order in
  `src/spritegen/font.ts` exactly (UI layout is tuned to these metrics).
- 8 inline emoji glyphs (`EMOJI_GLYPH`).
- ⚠️ Highest-risk swap in the game — match cell size or text layout breaks.

## C. Area title banners — 15
Decorative per-region wordmark scripts (`src/spritegen/glyphforge.ts`):
`accent, barscript, colonial, cursive, deco, fraktur, frost, heraldic, hush,
ramp, runic, seal, slavonic, talavera, tiki`. Path `assets/art/ui/banners/<script>.png`.

## D. Star Locket / Homesong UI
The key-item pause screen (`GAME_BIBLE.md §A9`): the Locket showing Embers 0–10,
with one instrument layer per Ember. Path `assets/art/ui/locket/`. ~12 states
(empty → 10 Embers) + the pause-screen frame.

## Acceptance
Window skins, controls, font, 15 banners, and the Locket UI all present & wired.
