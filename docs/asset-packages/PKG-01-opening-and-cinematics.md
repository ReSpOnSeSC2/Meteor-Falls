# PKG-01 — Opening, title & all cinematics

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
Glint's prophecy, the Titanic Tick reveal, the first Heartlight, the bug
zapper, Mom's payphone call.

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
