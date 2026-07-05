# 🗺️ Meteor Falls — Visual Map Editor

A point-and-click editor for building game maps with the **real** Meteor Falls tiles,
props, and buildings. Paint a grid, drop trees/benches/buildings, mark doors and enemy
spawns, then **Export** a ready-to-paste `MapDef`. No hand-typing grid strings.

---

## Open it

1. Start the dev server (same one the game uses):
   ```
   npm run dev
   ```
2. Open the editor in your browser:
   ```
   http://localhost:3000/tools/mapeditor/
   ```
   (Port may differ — use whatever `npm run dev` prints.)

That's it. Your work **auto-saves** in the browser, and **💾 Save / Load** keeps a named copy.

---

## The tools (top bar)

| Tool | Key | What it does |
|------|-----|--------------|
| 🖌️ **Paint** | `B` | Pick a tile in the left palette, then click/drag on the map to paint it. |
| 🧽 **Erase** | `E` | Paint plain grass back over anything. |
| 🌳 **Place** | `P` | Pick a Prop or Building, then click the map to drop it. |
| ➤ **Select** | `V` | Click a placed object to select it — edit or drag it, `Del` to remove. |
| 🚪 **Door** | `D` | Drag a rectangle → a doorway that warps to another map (set the target in the Inspector). |
| 👾 **Spawn** | `S` | Drag a rectangle → an enemy encounter zone (list enemy ids + count in the Inspector). |
| 📖 **Sign** | | Click → a readable sign point (set its `dialogue` script id in the Inspector). |
| ✋ **Pan** | `H` | Drag to move the view. (Or middle-mouse-drag anytime. **Mouse wheel = zoom.**) |

**Left panel tabs:** **Tiles** · **Props** · **Build**ings · **NPCs** (townsfolk — pick one, then
**Place** it; edit its id / sprite / facing / dialogue / shop in the Inspector) · **Elev**ation.

**Left panel:** three tabs — **Tiles** (ground/roads/walls/water…), **Props** (trees, street
furniture, furniture…), **Buildings** (every shop/house/landmark facade). Props & Buildings
have a search box. A red dot on a tile means it's **solid** (blocks walking).

**Right panel:** the **Inspector** (edit the selected object) and the **Objects** list
(everything you've placed — click to select, ✕ to delete).

**Top-right toggles:** `grid` lines, and `solids` (tints every solid tile red so you can see
your walls).

---

## Build a map in 5 steps

1. **Set size** — type a `Name`, an `id` (lowercase, e.g. `willow_creek`), a `W`idth and
   `H`eight in tiles, then **Resize**.
2. **Paint the ground** — grass is already down. Paint roads, sidewalks, dirt, water, walls.
   Roads live under the **Tiles → paving** group (`R` road, `D` dashed centre, `=` sidewalk).
3. **Place props & buildings** — switch to **Place**, pick from Props/Buildings, click to drop.
   Selected objects show a size/solid box in the Inspector; drag them with the **Select** tool.
4. **Add doors & spawns** — draw a **Door** rectangle at an edge and set its `to` (the map id
   it leads to) + target tile; draw **Spawn** zones and list enemy ids.
5. **Export** — click **⬇ Export**, **📋 Copy** the TypeScript.

---

## Region skins — the other hi-res tilesets (Norway, Africa, China, Mars…)

The tile palette is the **shared base tileset**. Each region (Norway snow, Zanzibel sand, China
temple, Aurora ice, Mauna Lani, Mars, Minimus, Romania, Savanna, Laughing Ruins) is a separate
hi-res tileset applied as a **skin**: you paint the *same* base tiles (grass, road, wall, water…)
and the game repaints them in that region's art.

- Pick a region from the **Skin** dropdown (top bar) to preview your map in that tileset. Grass →
  snow/sand/regolith, roads → cobble/gravel/dust, walls → adobe/ice/masonry, etc.
- On **Export**, if a skin is selected, the code includes a note telling you to add your map's id
  to that region's `*_SKIN_MAPS` set in `src/scenes/OverworldScene.ts` — that's what assigns the
  region in-game. (The tile grid itself is identical; the skin is a render-time repaint.)

## Elevation — multiple terrace levels (the **Elevate** tab)

Maps can have stacked terraces with real walk-behind cliffs. Open the **Elevate** tab:

1. Pick a **level** (Ground 0, Level 1, 2, 3…) and **paint the raised area** — it tints by height,
   and the **levels** overlay (top bar) turns on so you can see it.
2. Wall the terrace's edge with the **cliff (K)** tile, and cut a **stairway (T)** through the
   cliff so the player can climb it. (`^` is an optional grassy cliff-lip trim for the top edge.)
3. The editor enforces the game's **"no invisible ledge" law** live: any edge where two walkable
   tiles of different height meet *without* a stair glows **red**. Fix every red edge (extend the
   terrace to a wall, or add a stair). **✓ Check ledges** counts them.

Rules the red-check encodes (same as `npm run validate`): different-height tiles must be separated
by a solid **K** cliff **or** joined by a **T** stair, and stairs step **one level at a time**.
On export, a non-flat map automatically includes the `elevation: { level: [...] }` plane.
The reference map is **`elev_spike`**; the full design notes are `docs/WILDERNESS_DESIGN_LANGUAGE.md § Elevation`.

---

## Get your map into the game

1. Paste the exported `export const …Map: MapDef = { … }` into **`src/data/maps.ts`**
   (or a chapter file).
2. Register it in the **`MAPS`** object near the bottom of that file:
   ```ts
   export const MAPS: Record<string, MapDef> = {
     …
     willow_creek: willowCreekMap,   // ← your id: your variable
   };
   ```
3. Check it: `npm run validate` (flags unreachable maps, bad door landings, etc.).
4. Play it: `npm run dev`, then in the browser console:
   ```js
   game.scene.start('overworld', { mapId: 'willow_creek', x: 5*64, y: 5*64 })
   ```

To edit a map again later, choose **JSON** in the Export dialog, copy it, and paste it back
into the box with **⬆ Import JSON** next time.

---

## Good to know

- **Coordinates are tiles.** A prop at `x: 5, y: 5` sits with its **top-left** on tile (5,5)
  and hangs down/right — exactly how the game draws it. The ghost preview shows where it lands.
- **Props get an auto collision box** (the red base rectangle) when "solid" is on — a sensible
  default you can leave as-is; toggle it off for flat decorations.
- **Buildings need no collision** — the game rebuilds it from the drawn facade automatically,
  so you only set position (and an approximate on-map size).
- **The palette is generated from the real game data.** If someone adds new tiles or props,
  re-run `npm run mapeditor:gen` to refresh `manifest.json`.
- Doors and spawners are optional, but a map with no way in will be flagged by `npm run validate`
  (add at least one Door back to a connected map).
