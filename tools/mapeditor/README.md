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

### Twoton structural source

Twoton's large-scale layout is reproducible: `npm run mapeditor:twoton` rebuilds both
`tools/mapeditor/twoton.json` and `src/data/maps_twoton.ts` from
`tools/mapeditor/author-twoton.ts`. Use the visual editor to review or hand-tune the result,
then fold durable structural edits back into that authoring source so the editor document and
runtime map cannot drift apart. Run `npm run mapeditor:gen` afterward to refresh the shipped map
picker.

---

## The tools (top bar)

| Tool | Key | What it does |
|------|-----|--------------|
| 🖌️ **Paint** | `B` | Pick a tile in the left palette, then click/drag on the map to paint it. **Shift-drag = fill a rectangle.** |
| 🪣 **Fill** | `F` | Bucket-fill the contiguous same-tile region under the cursor with the selected tile. |
| 🧽 **Erase** | `E` | Paint plain grass back over anything. (Shift-drag = erase a rectangle.) |
| 🌳 **Place** | `P` | Pick a Prop or Building, then click the map to drop it. |
| ➤ **Select** | `V` | Click a placed object, **or drag a box over several**, to select — then drag or arrow-key them to move together, `Ctrl+D` duplicate, `Del` remove. |
| 🚪 **Door** | `D` | Drag a rectangle → a map-level doorway that warps to another map. For a building, select its facade and use **Add embedded entrance** so the doorway also cuts the facade collision open. |
| 👾 **Spawn** | `S` | Drag a rectangle → an enemy encounter zone (list enemy ids + count in the Inspector). |
| 📖 **Sign** | | Click → a readable sign point (set its `dialogue` script id in the Inspector). |
| ⚡ **Trigger** | `T` | Drag a rectangle → an event zone (give it an `id`; toggle `once`). |
| ☎️ **Phone** | | Click → a save point. |
| 🏧 **ATM** | | Click → an ATM (withdraw/deposit) point. |
| 🥾 **Patrol** | | Click to drop patrol waypoints in order (a sight-line enemy walks the route); `Esc` finishes. Set the `enemy` id in the Inspector. |
| 🪞 **Reflect** | | Drag a rectangle over water → a reflection zone. |
| ✋ **Pan** | `H` | Drag to move the view. (Or middle-mouse-drag anytime. **Mouse wheel = zoom.**) |

**Edit anywhere:** `Ctrl+Z` undo · `Ctrl+Y` / `Ctrl+Shift+Z` redo (a whole brush stroke or drag is one step) · `Ctrl+D` duplicate — or use the **↶ Undo / ↷ Redo** toolbar buttons. Select an object and nudge it with the **arrow keys** (`Shift`+arrow = half-tile). Each tool button shows its shortcut key; the **? Help** button lists them all.

**Move a group:** with the **Select** tool, drag a box across the map to grab every object inside it (props, NPCs, doors, spawns…), then **drag or arrow-key** them to move as one, `Ctrl+D` to duplicate the group, or `Del` to remove it.

**Rotate a prop:** select a prop and press **`R`** (or the **⟳** button in the Inspector) to rotate it 90° — face a fence, path, or directional decoration any of the four ways. Its in-game collision rotates with it. (Buildings resize with their handles instead of rotating.)

**View:** mouse wheel zooms, or use the **− / + / ⤢ Fit** buttons (the % readout is live). The **Brush** control (`1 / 3 / 5 / 7`, or `[` `]`) sets paint width for wide winding trails and fast plaza fills.

**Story phase preview:** the **Phase** selector shows **Initial**, **The Hush**, or **Restored** state using the same `ifFlag` / `unlessFlag` rules as gameplay. Conditional props, NPCs, signs, doors, and encounter zones no longer stack mutually exclusive versions on top of one another; hidden entries remain dimmed in the Objects list for editing.

**Flag gates:** NPCs, signs, and spawners have optional `ifFlag` / `unlessFlag` fields in the Inspector — set `ifFlag` to make the object appear only after a story flag is set, or `unlessFlag` to hide it once a flag is set (how quest-gated content works). NPCs also carry `dialogueDay` (a script spoken in daytime) and `stationary` (opt out of free-roam). Leave them blank for normal content.

**Left panel tabs:** **Tiles** · **Props** · **Build**ings · **NPCs** (townsfolk — pick one, then
**Place** it; edit its id / sprite / facing / dialogue / shop in the Inspector) · **Elev**ation.

**Left panel:** three tabs — **Tiles** (ground/roads/walls/water…), **Props** (trees, street
furniture, furniture…), **Buildings** (every shop/house/landmark facade). Props & Buildings
have a search box. A red dot on a tile means it's **solid** (blocks walking).

**Right panel:** the **Inspector** (edit the selected object) and the **Objects** list
(everything you've placed — click to select, ✕ to delete).

**Top-right toggles:** `grid` lines; `solids` (tints every solid tile red); `levels`; and
`overlays`. Turn **overlays off** for a clean art preview with interaction glyphs, encounter boxes,
trigger labels, door rectangles, selection handles, and patrol routes hidden.

---

## Build a map in 5 steps

1. **Set size** — type a `Name`, an `id` (lowercase, e.g. `willow_creek`), a `W`idth and
   `H`eight in tiles, then **Resize**.
2. **Paint the ground** — grass is already down. Paint roads, sidewalks, dirt, water, walls.
   Roads live under the **Tiles → paving** group (`R` road, `D` dashed centre, `=` sidewalk).
3. **Place props & buildings** — switch to **Place**, pick from Props/Buildings, click to drop
   (or **drag to lay a line** of props — tree lines, forests). Selected objects show a size/solid
   box in the Inspector; drag them with the **Select** tool. A selected **building** shows a **corner
   resize handle** — drag it to size the building live (or type a **size ×** in the Inspector); as
   large or small as you like, and its in-game collision scales with it.
4. **Add doors & spawns** — draw a **Door** rectangle at an edge and set its `to` (the map id
   it leads to) + target tile. For an enterable facade, select the building and add/edit its
   **embedded entrance** instead; this is the `PropDef.door` that travels with the building and
   creates a walkable opening through its collision. Draw **Spawn** zones and list enemy ids.
5. **Export** — click **⬇ Export**, **📋 Copy** the TypeScript.

---

## ⚙ Map settings

Click **⚙ Settings** for the map-wide fields (all optional — only the ones you change are written on export):

- **music** — the background track (from the game's `TRACKS`; leave empty for `null` / silence).
- **night** — dark night tint. **interior** — mark it an indoor map (muffles music, no weather).
- **settlement** — `city` / `town` / `village` (a `city` must additionally pass the ADR-012 city rules).
- **area** — the `CANON_AREAS` banner id that draws the region glyph script under the place name.
- **ambience** — an ambient sound bed layered under the music (rain, wind, waves, birds, cave…).
- **muffle** — override the music-muffle level (0 open · 1 veil · 2 deep). **atmosphere** — `fog` for the foggybottom sinking-fog veil.

## ✓ Check map

Click **✓ Check** for a quick pre-flight (the same checks `npm run validate` runs, plus editor-only ones):
unreachable NPCs / signs / phones / ATMs / triggers, doors that open onto or land on a wall, doors pointing at a
map that doesn't exist, dialogue ids that aren't in `dialogue.ts`, empty spawner/patrol ids, reflection zones that
miss the water, illegal elevation ledges, and grid characters that have no real manifest/atlas render entry. Fix the ❌ errors before pasting into the game; ⚠️ warnings are advisory.

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

1. Pick a **level** (Ground 0 through Level 9) and **paint the raised area** — it tints by height,
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

The TypeScript exporter preserves the complete current `MapDef` authoring surface, including
embedded prop doors and NPC scale/movement/idle/emote/dog fields. JSON remains the editor working
document format (`w`/`h`/`level`) and is intended for re-import rather than direct schema parsing.

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
- `npm run mapeditor:gen` also refreshes `maps.json` and the standalone **generated**
  `otterbrook.json` snapshot from the live `MAPS.otterbrook`. Do not hand-edit that snapshot as a
  source of truth. `npm run mapeditor:check` is a non-writing drift check, and normal validation/builds
  run it automatically.
- If a browser autosave has the same id as a shipped map, startup shows the **current shipped map**
  and asks explicitly whether to open that version or continue the older working copy. The working
  copy remains preserved until you choose it or begin editing the current map, so stale editor state
  can no longer masquerade as unchanged game content.
- Doors and spawners are optional, but a map with no way in will be flagged by `npm run validate`
  (add at least one Door back to a connected map).
