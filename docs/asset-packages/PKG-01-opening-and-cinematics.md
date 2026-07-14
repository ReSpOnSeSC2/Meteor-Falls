# PKG-01 — Opening, title & all cinematics

> **Chapter 1 production amendment (ADR-145, 2026-07-14):** at the pass
> baseline, only `meteor_2am_4x` and `hickory_hill_4x` were proven in ordinary
> play; registration and preload were not counted as display. The Titanic Tick
> reveal follows the mandatory Pemberton -> Hodgkin -> mower -> Trail Key ->
> shed -> `oak_roots` -> `oak_hollow` -> `oak_heart` -> Titanic Tick route and
> belongs on the deepest-cave meteor mound, never at the outdoor Heart Oak/Pond Park.
> First Heartlight follows Mom's Brickton payphone call with Jay and Mia after
> the Manager. New cave Tick, Mom-call, and First Heartlight runtime panels and
> retained generated sources now exist, have ordinary-play consumers, and have
> accepted native and exact-viewport crop contacts. This current evidence
> supersedes the approximate shot-list wording below.

Everything the player sees on a framing/non-gameplay screen: boot, title,
name entry, save slots, the Android app icon/splash, and **every cutscene panel
in the game** (Ch.1–10 story beats + travel set-pieces).

## A. Framing screens (~9)

| File | Where | Size |
|---|---|---|
| `assets/art/screens/boot_splash.png` | BootScene | 1600×900 |
| `assets/art/screens/title_bg.png` | TitleScene background | 1600×900 |
| `assets/art/screens/title_logo.png` | wordmark over title | ~1200×480 |
| `assets/art/screens/name_entry_bg.png` | NameEntryScene | 1600×900 |
| `assets/art/screens/save_slots_bg.png` | SaveSlotsScene | 1600×900 |
| `assets/art/screens/links_bg.png` | LinksScene | 1600×900 |
| `assets/art/icons/app_icon.png` | Android launcher | 512×512 |
| `assets/art/screens/splash_art.png` | Android splash | 1080×1920 |
| `assets/art/screens/game_over.png` | wipeout / wake-at-save | 1600×900 |

Replaces `drawTitleArt`/`drawLogo`/`drawAppIcon` in `src/spritegen/ui.ts`.

## B. Cinematic panels — full-frame 1600×900, one PNG per beat

Story beats are scripted in the scenes; canon shot list lives in
`docs/GAME_BIBLE.md §A6`. Number multi-panel beats `_01`, `_02`, …
Path: `assets/art/cutscenes/<chapter>/<beat>_NN.png`.

**Ch.1 (USA) — ~8:** the 2 AM meteor, Otterbrook at night, Hickory Hill,
Glint's prophecy, the `oak_heart` cave-arena Titanic Tick reveal, the
post-Manager Mom-payphone/First Heartlight sequence, and the bug zapper.

**Ch.2–9 — ~7 each:** each chapter's §A6 beats + its travel-in set-piece
(banana boat, biplane "Lucille", night train, riverboat, Orient Less-Express…).
Pull the exact beats per chapter from `GAME_BIBLE.md §A6`.

**Ch.10 finale — ~12:** the snowcat run, the rocket launch ("The Long Shot"),
Mars / Sea of Silence arrival, THE CALLING (phones ringing worldwide), MIA
PRAYS, the player-name confirm, the Homesong, the Hush undone, extended credits.

> Caller portraits and the Star Locket/Homesong UI itself are **PKG-17** and
> **PKG-06** respectively — this package is the cinematic panels only.

## Acceptance
All framing screens swapped; every §A6 beat for all 10 chapters has at least one
panel; files land under `assets/art/screens|cutscenes|icons` with the names above.
