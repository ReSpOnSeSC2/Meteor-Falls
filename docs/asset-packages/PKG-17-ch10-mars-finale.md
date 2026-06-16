# PKG-17 — Chapter 10: Alaska → Hawaii → Mars (the finale)

The game's art centerpiece. Three regions, three bosses, and the ending
set-pieces. Canon: `CHAPTER_MANIFESTS['10']` (`src/data/chapters.ts`),
`GAME_BIBLE.md §A6 ch.10 + §A9`.

- **Settlements:** aurora_station (Alaska), mauna_lani (Hawaii)
- **Travel:** snowcat → Pemberton's rocket "The Long Shot"
- **Dungeon:** The Sea of Silence (Mars)

## Resolution target
The HD render is live: `ART_SCALE = 4` → **1600×900** framebuffer. Runtime cells
are **native × 4**; size source art to the 4× cell (a gentle reduction, not the
old 1× crush).

- Tiles: 16×16 native → **64×64** runtime cells.
- Characters: 24×32 native → **96×128** runtime cells, exactly the
  `*_4x_master` cell, so they are native at 4× with no downscale.
- Busts: 32×32 native → **128×128** runtime cells.
- Battlers: 28×36 native → **112×144** runtime cells.
- Athletes/golfers: 32×40 native → **128×160** runtime cells.

Full-screen art (cutscene panels, screen backgrounds) is authored at **1600×900**.

## 1. Three bosses (bespoke, large, ×3 wear each)
- **Frost Sentinel** (Alaska) — `assets/art/enemies/battle_frost_sentinel*.png`
- **Tiki Magma Golem** (Hawaii) — `assets/art/enemies/battle_tiki_magma_golem*.png`
- **The Hush** (Mars, 6000 HP) — the final boss, multi-phase —
  `assets/art/enemies/battle_the_hush*.png`

## 2. Three biomes (tilesets + backdrops)
- Alaska ice/aurora, Hawaii volcanic, **Mars / Sea of Silence**.
- New `TILESET` cells per biome + a battle backdrop each.
- The **rocket interior** (travel + cutscene set).

## 3. Enemy roster — 20 × 3 wear = 60
Same §A7 ecosystem as the other chapters, themed across the three legs
(frost / magma / silence). Ids scaffolded in `src/data/drafts/ch10/`.

## 4. NPC roster — ~10, 8-dir 96×128 runtime / 24×32 native
aurora_station + mauna_lani townsfolk.

## 5. THE CALLING — caller portraits (~30+)  ⭐ unique to the finale
In the final battle every side-quest NPC the party helped answers a ringing
phone and sends their Vibe. Each needs a **call-in portrait** (phone-frame
bust). Path `assets/art/callers/<id>.png`.
- **Base callers (always):** Mom, Dad, Buni, Pemberton, Chad Pickle.
- **+ one per completed side quest** across all 10 regions (pull the quest-NPC
  list from `src/data/quests.ts`). More callers = longer extended credits.
- This doubles as the **extended-credits art**.

## 6. Ending set-piece panels (~12, 1600×900)
Coordinate with PKG-01 (`assets/art/cutscenes/ch10/`): snowcat run, rocket
launch, Mars arrival, the phones ringing worldwide, **MIA PRAYS**, the
player-name confirm, the Homesong in full, the Hush undone, credits.

## 7. Star Locket — full (10/10 Embers)
The final Locket state with all ten instrument layers (the UI frame itself is
PKG-06; this is the complete-set art).

## Acceptance
3 bosses, 3 biomes + rocket interior, 20-enemy roster, ~10 NPCs, the full caller
portrait set, and the ending panels all authored and wired.
