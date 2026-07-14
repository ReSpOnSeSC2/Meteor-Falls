from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("assets/art/masters/generated/ch1-expanded")
MASTER_WORLD = Path("assets/art/masters/world")
MASTER_CHARS = Path("assets/art/masters/characters")
MASTER_ANIM = MASTER_CHARS / "animation"
MASTER_BATTLERS = Path("assets/art/masters/battlers")
MASTER_BUSTS = Path("assets/art/masters/busts")
MASTER_VEHICLES = Path("assets/art/masters/vehicles")

WORLD_PROPS = Path("assets/art/world/props")
WORLD_FACADES = Path("assets/art/world/facades")
WORLD_ROOT = Path("assets/art/world")
CHARACTERS = Path("assets/art/characters")
ENEMIES = Path("assets/art/enemies")
BUSTS = Path("assets/art/busts")
VEHICLES = Path("assets/art/vehicles")
REVIEW = Path("assets/art/review")

for d in [
    MASTER_WORLD,
    MASTER_CHARS,
    MASTER_ANIM,
    MASTER_BATTLERS,
    MASTER_BUSTS,
    MASTER_VEHICLES,
    WORLD_PROPS,
    WORLD_FACADES,
    WORLD_ROOT,
    CHARACTERS,
    ENEMIES,
    BUSTS,
    VEHICLES,
    REVIEW,
]:
    d.mkdir(parents=True, exist_ok=True)


def load(name: str) -> Image.Image:
    return Image.open(ROOT / name).convert("RGBA")


def keyish(r: int, g: int, b: int, key: str) -> bool:
    if key == "green":
        return g >= 170 and r <= 125 and b <= 125 and g > r * 1.35 and g > b * 1.35
    if key == "magenta":
        return r >= 145 and b >= 135 and g <= 145 and r > g * 1.25 and b > g * 1.2
    raise ValueError(key)


def remove_connected_key(im: Image.Image, key: str) -> Image.Image:
    im = im.convert("RGBA")
    pix = im.load()
    w, h = im.size
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def add(x: int, y: int) -> None:
        i = y * w + x
        if seen[i]:
            return
        r, g, b, a = pix[x, y]
        if a == 0 or keyish(r, g, b, key):
            seen[i] = 1
            q.append((x, y))

    for x in range(w):
        add(x, 0)
        add(x, h - 1)
    for y in range(h):
        add(0, y)
        add(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                add(nx, ny)

    out = im.copy()
    op = out.load()
    for y in range(h):
        for x in range(w):
            if seen[y * w + x]:
                op[x, y] = (0, 0, 0, 0)
    return out


def remove_all_key(im: Image.Image, key: str) -> Image.Image:
    out = im.convert("RGBA")
    pix = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pix[x, y]
            if a and keyish(r, g, b, key):
                pix[x, y] = (0, 0, 0, 0)
    return out


def bbox(im: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = im.getchannel("A")
    box = alpha.point(lambda a: 255 if a > threshold else 0).getbbox()
    if not box:
        raise ValueError("empty image")
    return box


def crop_alpha(im: Image.Image, pad: int = 0) -> Image.Image:
    x0, y0, x1, y1 = bbox(im)
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def contain(im: Image.Image, size: tuple[int, int], pad: int = 0, resample=Image.Resampling.LANCZOS) -> Image.Image:
    im = crop_alpha(im)
    tw, th = size
    scale = min((tw - pad * 2) / im.width, (th - pad * 2) / im.height)
    nw = max(1, round(im.width * scale))
    nh = max(1, round(im.height * scale))
    resized = im.resize((nw, nh), resample)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.alpha_composite(resized, ((tw - nw) // 2, th - pad - nh))
    return out


def save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)


def alpha_column_runs(im: Image.Image, threshold: int = 8) -> list[tuple[int, int]]:
    alpha = im.getchannel("A")
    runs: list[tuple[int, int]] = []
    start: int | None = None
    for x in range(im.width):
        occupied = any(alpha.getpixel((x, y)) > threshold for y in range(im.height))
        if occupied and start is None:
            start = x
        elif not occupied and start is not None:
            runs.append((start, x))
            start = None
    if start is not None:
        runs.append((start, im.width))
    return runs


def split_spaced(im: Image.Image, count: int, key: str) -> list[Image.Image]:
    clean = remove_connected_key(im, key)
    runs = alpha_column_runs(clean)
    if len(runs) >= count:
        gaps = [(runs[i + 1][0] - runs[i][1], i) for i in range(len(runs) - 1)]
        boundaries = sorted(i for _, i in sorted(gaps, reverse=True)[: count - 1])
        groups: list[list[tuple[int, int]]] = []
        start = 0
        for boundary in boundaries:
            groups.append(runs[start:boundary + 1])
            start = boundary + 1
        groups.append(runs[start:])
        if len(groups) == count and all(group for group in groups):
            return [crop_alpha(clean.crop((group[0][0], 0, group[-1][1], clean.height)), pad=2) for group in groups]

    out: list[Image.Image] = []
    for i in range(count):
        x0 = round(i * clean.width / count)
        x1 = round((i + 1) * clean.width / count)
        out.append(crop_alpha(clean.crop((x0, 0, x1, clean.height)), pad=2))
    return out


def single_world(name: str, src_name: str, key: str, target: tuple[int, int], *, all_key: bool = False) -> None:
    clean = remove_all_key(load(src_name), key) if all_key else remove_connected_key(load(src_name), key)
    save(clean, MASTER_WORLD / f"{name}-transparent.png")
    runtime = contain(clean, target, pad=2)
    if all_key:
        runtime = remove_all_key(runtime, key)
    save(runtime, WORLD_PROPS / f"{name}.png")


def fit_facade(tight: Image.Image, width: int, pad: int = 4) -> Image.Image:
    scale = (width - pad * 2) / tight.width
    body_w = max(1, round(tight.width * scale))
    body_h = max(1, round(tight.height * scale))
    body = tight.resize((body_w, body_h), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (width, body_h + pad * 2), (0, 0, 0, 0))
    out.alpha_composite(body, ((width - body_w) // 2, pad))
    return out


def facade(name: str, src_name: str, key: str, width: int) -> None:
    clean = remove_connected_key(load(src_name), key)
    tight = crop_alpha(clean, pad=0)
    out = fit_facade(tight, width)
    save(clean, MASTER_WORLD / f"{name}-transparent.png")
    save(out, WORLD_FACADES / f"{name}.png")


# These accepted outputs have dimensions and cleanup that the broad legacy
# package processor cannot reproduce. Keep their slots in each source sheet so
# splitting stays aligned, but rebuild/verify the files only through
# tools/repair-ch1-raster-assets.ts and its retained accepted masters.
ACCEPTED_RETAINED_PROP_OUTPUTS = {
    "prop_waiting_bench",
    "prop_wardbed",
}


def prop_sheet(sheet_name: str, src_name: str, key: str, specs: list[tuple[str, tuple[int, int]]]) -> None:
    clean = remove_connected_key(load(src_name), key)
    save(clean, MASTER_WORLD / f"{sheet_name}-transparent.png")
    parts = split_spaced(load(src_name), len(specs), key)
    for part, (name, target) in zip(parts, specs):
        if name in ACCEPTED_RETAINED_PROP_OUTPUTS:
            continue
        save(contain(part, target, pad=2), WORLD_PROPS / f"{name}.png")


def hickory_tiles() -> None:
    clean = remove_connected_key(load("tile_hickory_dirt-source.png"), "magenta")
    save(clean, MASTER_WORLD / "tile_hickory_dirt-transparent.png")
    pieces: list[Image.Image] = []
    for r in range(4):
        for c in range(4):
            cell = clean.crop(
                (
                    round(c * clean.width / 4),
                    round(r * clean.height / 4),
                    round((c + 1) * clean.width / 4),
                    round((r + 1) * clean.height / 4),
                )
            )
            pieces.append(contain(cell, (64, 64), pad=0, resample=Image.Resampling.BICUBIC))

    strip = Image.new("RGBA", (32 * 64, 64), (0, 0, 0, 0))
    for i in range(32):
        strip.alpha_composite(pieces[i % 16], (i * 64, 0))
    save(strip, WORLD_ROOT / "tile_hickory_dirt.png")


NPCS = {
    "npc_hodgkin": "npc_hodgkin-8dir-source.png",
    "npc_clerk": "npc_clerk-8dir-source.png",
    "npc_depot_clerk": "npc_depot_clerk-8dir-source.png",
    "npc_bert": "npc_bert-8dir-source.png",
}

# Borden, the realtor, and the waitress now have genuinely authored walk cycles
# (stand / step A / step B for five facings). They are intentionally absent from
# NPCS: running this broad package processor must never replace those cycles with
# the old single-pose, nudge-only synthesis. Rebuild them with the named
# `ch1:npc:*` scripts, which route through assemble-ch1-walk-atlas.ts.

FRAME_W = 96
FRAME_H = 128
TOTAL_FRAMES = 46


def make_8dir_strip(src_name: str, out_master: Path) -> Image.Image:
    parts = split_spaced(load(src_name), 8, "magenta")
    cells = [contain(part, (FRAME_W, FRAME_H), pad=6) for part in parts]
    strip = Image.new("RGBA", (8 * FRAME_W, FRAME_H), (0, 0, 0, 0))
    for i, cell in enumerate(cells):
        strip.alpha_composite(cell, (i * FRAME_W, 0))
    save(strip, out_master)
    return strip


def synth_46(strip: Image.Image) -> Image.Image:
    cols = 4
    rows = (TOTAL_FRAMES + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * FRAME_W, rows * FRAME_H), (0, 0, 0, 0))
    source_by = {
        "down": 0,
        "downleft": 1,
        "left": 2,
        "upleft": 3,
        "up": 4,
        "upright": 5,
        "right": 6,
        "downright": 7,
    }

    def nudge(idx: int) -> tuple[int, int]:
        if idx == source_by["left"]:
            return (-1, 0)
        if idx == source_by["right"]:
            return (1, 0)
        if idx == source_by["up"]:
            return (0, -1)
        if idx == source_by["downleft"]:
            return (-1, 1)
        if idx == source_by["downright"]:
            return (1, 1)
        if idx == source_by["upleft"]:
            return (-1, -1)
        if idx == source_by["upright"]:
            return (1, -1)
        return (0, 1)

    def draw(frame: int, idx: int, pose: str) -> None:
        dx = (frame % cols) * FRAME_W
        dy = (frame // cols) * FRAME_H
        cell = strip.crop((idx * FRAME_W, 0, (idx + 1) * FRAME_W, FRAME_H))
        nx, ny = nudge(idx)
        step = -1 if pose in ("walkA", "runA") else 1 if pose in ("walkB", "runB") else 0
        bob = 1 if pose in ("walkA", "walkB") else 2 if pose in ("runA", "runB") else -1 if pose == "idleBreath" else 0
        lean = 1 if pose in ("runA", "runB") else 0
        ox = max(-2, min(2, step + nx * lean))
        oy = max(-2, min(2, bob + ny * lean))
        sheet.alpha_composite(cell, (dx + ox, dy + oy))
        if pose == "idleBlink":
            d = ImageDraw.Draw(sheet)
            d.rectangle((dx + 28, dy + 52, dx + 67, dy + 55), fill=(18, 16, 25, 220))

    walk = [source_by["down"], source_by["left"], source_by["right"], source_by["up"]]
    for dir_i, idx in enumerate(walk):
        base = dir_i * 4
        draw(base, idx, "stand")
        draw(base + 1, idx, "walkA")
        draw(base + 2, idx, "stand")
        draw(base + 3, idx, "walkB")
    for dir_i, idx in enumerate(walk):
        base = 16 + dir_i * 2
        draw(base, idx, "runA")
        draw(base + 1, idx, "runB")
    for dir_i, idx in enumerate([source_by["downright"], source_by["downleft"], source_by["upright"], source_by["upleft"]]):
        base = 24 + dir_i * 3
        draw(base, idx, "stand")
        draw(base + 1, idx, "walkA")
        draw(base + 2, idx, "walkB")
    for dir_i, idx in enumerate([source_by["downright"], source_by["downleft"], source_by["upright"], source_by["upleft"]]):
        base = 36 + dir_i * 2
        draw(base, idx, "runA")
        draw(base + 1, idx, "runB")
    draw(44, source_by["down"], "idleBreath")
    draw(45, source_by["down"], "idleBlink")
    return sheet


def npcs() -> None:
    for npc_id, src_name in NPCS.items():
        strip = make_8dir_strip(src_name, MASTER_CHARS / f"{npc_id}-8dir-transparent.png")
        sheet = synth_46(strip)
        save(sheet, MASTER_ANIM / f"{npc_id}_anim_46_4x_master.png")
        save(sheet, CHARACTERS / f"{npc_id}_anim_46_4x.png")


def borden_battle() -> None:
    battler = remove_connected_key(load("npc_borden-battler-source.png"), "magenta")
    bust = remove_connected_key(load("npc_borden-bust-source.png"), "magenta")
    save(battler, MASTER_BATTLERS / "npc_borden-battler-transparent.png")
    save(contain(battler, (192, 256), pad=6), ENEMIES / "battle_constable_borden.png")
    save(bust, MASTER_BUSTS / "npc_borden-bust-transparent.png")
    save(contain(bust, (128, 128), pad=0), BUSTS / "npc_borden_bust_128.png")


def vehicle() -> None:
    clean = remove_connected_key(load("vehicle_clunker-source.png"), "magenta")
    save(clean, MASTER_VEHICLES / "vehicle_clunker-transparent.png")
    tight = crop_alpha(clean, pad=2)
    out = contain(tight, (160, 96), pad=2)
    # package tests require vehicle widths on a 4px grid; keep both axes stable.
    save(out, VEHICLES / "vehicle_clunker.png")


def contact(paths: list[Path], out_path: Path, label: str) -> None:
    thumbs: list[tuple[Path, Image.Image]] = []
    for path in paths:
        im = Image.open(path).convert("RGBA")
        bg = Image.new("RGBA", im.size, (24, 24, 30, 255))
        bg.alpha_composite(im)
        bg.thumbnail((220, 150), Image.Resampling.LANCZOS)
        thumbs.append((path, bg))
    cols = 4
    rows = (len(thumbs) + cols - 1) // cols
    out = Image.new("RGB", (cols * 230, rows * 190 + 28), (24, 24, 30))
    d = ImageDraw.Draw(out)
    try:
        font = ImageFont.truetype("arial.ttf", 11)
        title = ImageFont.truetype("arial.ttf", 15)
    except Exception:
        font = title = ImageFont.load_default()
    d.text((8, 6), label, fill=(235, 235, 235), font=title)
    for i, (path, im) in enumerate(thumbs):
        x = (i % cols) * 230 + (230 - im.width) // 2
        y = 28 + (i // cols) * 190 + 4
        out.paste(im.convert("RGB"), (x, y))
        d.text(((i % cols) * 230 + 6, y + 154), f"{path.name} {Image.open(path).size}", fill=(210, 210, 210), font=font)
    save(out.convert("RGBA"), out_path)


def validate_guardrail() -> None:
    im = Image.open(WORLD_PROPS / "prop_guardrail.png").convert("RGBA")
    a = im.getchannel("A")
    corners = [a.getpixel((0, 0)), a.getpixel((im.width - 1, 0)), a.getpixel((0, im.height - 1)), a.getpixel((im.width - 1, im.height - 1))]
    if any(v != 0 for v in corners):
        raise RuntimeError(f"prop_guardrail has opaque corners: {corners}")
    pix = im.load()
    black_bg = 0
    keyed = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, alpha = pix[x, y]
            if alpha > 0 and keyish(r, g, b, "green"):
                keyed += 1
            if alpha > 0 and r < 4 and g < 4 and b < 4:
                black_bg += 1
    if keyed:
        raise RuntimeError(f"prop_guardrail still has {keyed} opaque green-key pixels")
    mid_transparent = 0
    mid_total = 0
    for y in range(im.height // 3, (im.height * 2) // 3):
        for x in range(im.width // 8, (im.width * 7) // 8):
            mid_total += 1
            if a.getpixel((x, y)) == 0:
                mid_transparent += 1
    if mid_transparent < mid_total * 0.18:
        raise RuntimeError(f"prop_guardrail middle is not transparent enough: {mid_transparent}/{mid_total}")
    # A few true outline pixels are fine; a black filled rectangle is not.
    if black_bg > im.width * im.height * 0.08:
        raise RuntimeError(f"prop_guardrail has too many black opaque pixels: {black_bg}")
    print(f"guardrail alpha ok; middle transparent {mid_transparent}/{mid_total}; opaque black pixels {black_bg}")


def validate_edge_padding(paths: list[Path]) -> None:
    for path in paths:
        im = Image.open(path).convert("RGBA")
        a = im.getchannel("A")
        edge: list[int] = []
        for x in range(im.width):
            edge.append(a.getpixel((x, 0)))
            edge.append(a.getpixel((x, im.height - 1)))
        for y in range(im.height):
            edge.append(a.getpixel((0, y)))
            edge.append(a.getpixel((im.width - 1, y)))
        opaque = sum(1 for value in edge if value > 8)
        if opaque:
            raise RuntimeError(f"{path} touches the crop edge with {opaque} opaque border pixels")


def main() -> None:
    hickory_tiles()
    single_world("prop_trail_marker", "prop_trail_marker-source.png", "green", (96, 128))
    single_world("prop_guardrail", "prop_guardrail-source.png", "green", (224, 88), all_key=True)
    single_world("prop_culvert", "prop_culvert-source.png", "magenta", (160, 128))

    pine_parts = split_spaced(load("prop_pine_whisperwood-source.png"), 3, "magenta")
    pine_sheet = remove_connected_key(load("prop_pine_whisperwood-source.png"), "magenta")
    save(pine_sheet, MASTER_WORLD / "prop_pine_whisperwood-transparent.png")
    for part, name in zip(pine_parts, ["prop_pine_whisperwood", "prop_pine_whisperwood_b", "prop_pine_whisperwood_c"]):
        save(contain(part, (128, 192), pad=2), WORLD_PROPS / f"{name}.png")

    facade("facade_hardware", "facade_hardware-source.png", "magenta", 340)
    facade("facade_diner", "facade_diner-source.png", "magenta", 340)
    facade("facade_busdepot", "facade_busdepot-source.png", "magenta", 340)
    facade("facade_busdepot_open", "facade_busdepot_open-source.png", "magenta", 340)
    facade("facade_fillshop", "facade_fillshop-source.png", "magenta", 330)

    pair = split_spaced(load("facade_realty_autolot-source.png"), 2, "magenta")
    pair_clean = remove_connected_key(load("facade_realty_autolot-source.png"), "magenta")
    save(pair_clean, MASTER_WORLD / "facade_realty_autolot-transparent.png")
    for part, name, width in [(pair[0], "facade_realty", 300), (pair[1], "facade_autolot", 330)]:
        tight = crop_alpha(part, pad=0)
        save(fit_facade(tight, width), WORLD_FACADES / f"{name}.png")

    prop_sheet(
        "props_hardware_interior",
        "props_hardware_interior-source.png",
        "magenta",
        [
            ("prop_pegboard_wall", (184, 120)),
            ("prop_tool_shelf", (144, 120)),
            ("prop_lockbox_counter", (184, 96)),
        ],
    )
    prop_sheet(
        "props_diner_interior",
        "props_diner_interior-source.png",
        "magenta",
        [
            ("prop_counter_stools", (200, 88)),
            ("prop_booth", (136, 120)),
            ("prop_pie_case", (120, 88)),
            ("prop_jukebox", (88, 136)),
        ],
    )
    prop_sheet(
        "props_busdepot_interior",
        "props_busdepot_interior-source.png",
        "magenta",
        [
            ("prop_ticket_window", (136, 128)),
            ("prop_waiting_bench", (136, 64)),
            ("prop_schedule_board", (128, 96)),
        ],
    )
    prop_sheet(
        "props_clinic_interior",
        "props_clinic_interior-source.png",
        "magenta",
        [
            ("prop_frontdesk", (168, 112)),
            ("prop_waitingchairs", (168, 88)),
            ("prop_wardbed", (144, 136)),
            ("prop_vending", (88, 136)),
        ],
    )
    npcs()
    borden_battle()
    vehicle()
    validate_guardrail()
    validate_edge_padding(
        [
            WORLD_PROPS / f"{name}.png"
            for name in [
                "prop_pine_whisperwood", "prop_pine_whisperwood_b", "prop_pine_whisperwood_c",
                "prop_trail_marker", "prop_guardrail", "prop_culvert",
                "prop_pegboard_wall", "prop_tool_shelf", "prop_lockbox_counter",
                "prop_counter_stools", "prop_booth", "prop_pie_case", "prop_jukebox",
                "prop_ticket_window", "prop_waiting_bench", "prop_schedule_board",
                "prop_frontdesk", "prop_waitingchairs", "prop_wardbed", "prop_vending",
            ]
        ]
        + [
            WORLD_FACADES / f"{name}.png"
            for name in [
                "facade_hardware", "facade_diner", "facade_busdepot", "facade_busdepot_open",
                "facade_fillshop", "facade_realty", "facade_autolot",
            ]
        ]
    )

    contact(sorted(WORLD_PROPS.glob("prop_*.png"))[-22:], REVIEW / "ch1_expanded_props_runtime_contact.png", "Chapter 1 Expanded Props Runtime")
    contact(sorted(WORLD_FACADES.glob("facade_*.png")), REVIEW / "ch1_expanded_facades_runtime_contact.png", "Chapter 1 Expanded Facades Runtime")
    contact([CHARACTERS / f"{npc}_anim_46_4x.png" for npc in NPCS], REVIEW / "ch1_expanded_npcs_runtime_contact.png", "Chapter 1 Expanded NPC Runtime Sheets")
    print("processed Chapter 1 expanded art")


if __name__ == "__main__":
    main()
