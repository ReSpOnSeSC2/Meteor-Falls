# Asset checklists

Literal id lists backing [`../IMAGE_ASSET_MANIFEST.md`](../IMAGE_ASSET_MANIFEST.md).
Each line is one engine id; use these as production checklists.

| File | Count | What |
|---|---:|---|
| `characters_8dir.txt` | 48 | overworld 8-direction sprites (5 heroes + 42 NPCs + Glint special) |
| `otterbrook_npcs_46.txt` | 18 | live Otterbrook 46-frame NPC/special targets, including Chad and Glint |
| `enemy_families.txt` | 35 | enemy families (× 3 wear variants each) |
| `ability_icons.txt` | 92 | ability / skill icons |
| `item_icons.txt` | 469 | inventory items |
| `unbuilt_chapters.txt` | 7 | Ch.4–10 art bundles (regions, bosses, rosters) |

Regenerate from the live registries (`src/data/*`, `src/spritegen/authored.ts`)
if these drift. These are extracted snapshots, not the source of truth — the
code is.
