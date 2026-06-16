from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
CHAR_DIR = ROOT / "assets/art/characters"
MASTER_DIR = ROOT / "assets/art/masters/characters/animation"
REVIEW_DIR = ROOT / "assets/art/review"
FRAME_REVIEW_DIR = ROOT / "_jay_anim_review/fullres_frames"

FW = 96
FH = 128
COLS = 4
TOTAL = 46

BASE_SHEET = CHAR_DIR / "jay_anim_46_4x_approved_wip.png"
OUT_SHEET = CHAR_DIR / "jay_anim_46_4x.png"
OUT_MASTER = MASTER_DIR / "jay_anim_46_4x_master.png"


try:
    LANCZOS = Image.Resampling.LANCZOS
except AttributeError:
    LANCZOS = Image.LANCZOS


FRAME_LABELS = [
    "walk_down_0", "walk_down_1", "walk_down_2", "walk_down_3",
    "walk_left_0", "walk_left_1", "walk_left_2", "walk_left_3",
    "walk_right_0", "walk_right_1", "walk_right_2", "walk_right_3",
    "walk_up_0", "walk_up_1", "walk_up_2", "walk_up_3",
    "run_down_0", "run_down_1",
    "run_left_0", "run_left_1",
    "run_right_0", "run_right_1",
    "run_up_0", "run_up_1",
    "walk_downright_0", "walk_downright_1", "walk_downright_2",
    "walk_downleft_0", "walk_downleft_1", "walk_downleft_2",
    "walk_upright_0", "walk_upright_1", "walk_upright_2",
    "walk_upleft_0", "walk_upleft_1", "walk_upleft_2",
    "run_downright_0", "run_downright_1",
    "run_downleft_0", "run_downleft_1",
    "run_upright_0", "run_upright_1",
    "run_upleft_0", "run_upleft_1",
    "idle_breathe", "idle_blink",
]


@dataclass(frozen=True)
class Fit:
    max_w: int = 88
    max_h: int = 120
    bottom: int = 126
    x_shift: int = 0
    y_shift: int = 0


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def alpha_bbox(img: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = np.array(img.getchannel("A"))
    ys, xs = np.where(alpha > threshold)
    if len(xs) == 0:
        raise RuntimeError("source frame is blank after keying")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def crop_content(img: Image.Image, threshold: int = 8) -> Image.Image:
    return img.crop(alpha_bbox(img, threshold))


def key_dark_background(img: Image.Image, threshold: int = 46) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    dark = (rgb[:, :, 0] < threshold) & (rgb[:, :, 1] < threshold) & (rgb[:, :, 2] < threshold)
    arr[dark, 3] = 0
    return Image.fromarray(arr, "RGBA")


def horizontal_segments(img: Image.Image, threshold: int = 5) -> list[tuple[int, int]]:
    alpha = np.array(img.getchannel("A")) > 8
    counts = alpha.sum(axis=0)
    segments: list[tuple[int, int]] = []
    start: int | None = None
    for x, count in enumerate(counts):
        on = count > threshold
        if on and start is None:
            start = x
        if start is not None and (not on or x == len(counts) - 1):
            end = x if not on else x + 1
            if end - start > 8:
                segments.append((start, end))
            start = None
    return segments


def recolor_large_upper_white_to_cap_red(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA")).copy()
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].astype(np.int16)
    yy, _ = np.indices((h, w))
    white = (
        (arr[:, :, 3] > 20)
        & (rgb[:, :, 0] > 205)
        & (rgb[:, :, 1] > 205)
        & (rgb[:, :, 2] > 195)
        & (yy < int(h * 0.45))
    )
    seen = np.zeros((h, w), dtype=bool)
    components: list[list[tuple[int, int]]] = []
    for y in range(h):
        for x in range(w):
            if not white[y, x] or seen[y, x]:
                continue
            stack = [(x, y)]
            seen[y, x] = True
            pixels: list[tuple[int, int]] = []
            while stack:
                cx, cy = stack.pop()
                pixels.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and white[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((nx, ny))
            components.append(pixels)

    for pixels in components:
        if len(pixels) < 450:
            continue
        ys = np.array([p[1] for p in pixels])
        if ys.mean() > h * 0.33:
            continue
        for x, y in pixels:
            lum = int((int(arr[y, x, 0]) + int(arr[y, x, 1]) + int(arr[y, x, 2])) / 3)
            t = max(0.0, min(1.0, (lum - 190) / 65))
            arr[y, x, 0] = int(185 + 55 * t)
            arr[y, x, 1] = int(24 + 42 * t)
            arr[y, x, 2] = int(24 + 24 * t)
    return Image.fromarray(arr, "RGBA")


def fit_cell(img: Image.Image, fit: Fit = Fit()) -> Image.Image:
    content = crop_content(img)
    scale = min(fit.max_w / content.width, fit.max_h / content.height)
    w = max(1, round(content.width * scale))
    h = max(1, round(content.height * scale))
    resized = content.resize((w, h), LANCZOS)
    cell = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    x = (FW - w) // 2 + fit.x_shift
    y = fit.bottom - h + fit.y_shift
    if x < 1 or x + w > FW - 1 or y < 0 or y + h > FH:
        raise RuntimeError(f"fitted frame clips cell: placed {(x, y, w, h)}")
    cell.alpha_composite(resized, (x, y))
    return cell


def paste_frame(sheet: Image.Image, index: int, frame: Image.Image) -> None:
    x = (index % COLS) * FW
    y = (index // COLS) * FH
    sheet.paste(Image.new("RGBA", (FW, FH), (0, 0, 0, 0)), (x, y))
    sheet.alpha_composite(frame, (x, y))


def frame(sheet: Image.Image, index: int) -> Image.Image:
    x = (index % COLS) * FW
    y = (index // COLS) * FH
    return sheet.crop((x, y, x + FW, y + FH))


def checker(size: tuple[int, int], cell: int = 8) -> Image.Image:
    img = Image.new("RGBA", size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            color = (174, 174, 174, 255) if (x // cell + y // cell) % 2 == 0 else (126, 126, 126, 255)
            draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=color)
    return img


def extract_sources() -> dict[int, Image.Image]:
    no_ponytail_right = load_rgba(CHAR_DIR / "jay_run_right_no_ponytail_transparent.png")
    no_ponytail_segments = horizontal_segments(no_ponytail_right, 20)
    if len(no_ponytail_segments) != 4:
        raise RuntimeError(f"expected 4 no-ponytail right-run frames, found {len(no_ponytail_segments)}")
    right_frames = [
        recolor_large_upper_white_to_cap_red(crop_content(no_ponytail_right.crop((x0, 0, x1, no_ponytail_right.height))))
        for x0, x1 in no_ponytail_segments
    ]

    back = load_rgba(CHAR_DIR / "jay_run_back_transparent.png")
    back_frames = [
        back.crop((362, 44, 778, 755)),
        back.crop((1164, 44, 1582, 755)),
    ]

    forward = key_dark_background(load_rgba(CHAR_DIR / "Jay_run_forward_both_legs.png"))
    down_frames = [
        forward.crop((46, 32, 134, 193)),
        forward.crop((186, 32, 282, 193)),
    ]

    diag_a = load_rgba(CHAR_DIR / "jay_anim_running_SE_SW_NE.png")
    diag_b = load_rgba(ROOT / "edited_images/running-boy-midstride-sheet.png")
    diagonal_frames = {
        "upleft_a": diag_a.crop((0, 0, 349, 518)),
        "upright_a": diag_a.crop((542, 0, 938, 518)),
        "downleft_a": diag_a.crop((0, 605, 349, 1105)),
        "downright_a": diag_a.crop((542, 605, 938, 1105)),
        "upleft_b": diag_b.crop((174, 44, 512, 581)),
        "upright_b": diag_b.crop((745, 44, 1090, 581)),
        "downleft_b": diag_b.crop((174, 649, 512, 1133)),
        "downright_b": diag_b.crop((745, 649, 1090, 1133)),
    }

    # These source poses are larger and more illustrative than the approved
    # walk/idle cells. The fit caps keep the run poses energetic without a
    # visible size pop when animation switches walk <-> run.
    side_fit = Fit(max_w=82, max_h=110, bottom=126)
    front_fit = Fit(max_w=66, max_h=110, bottom=126)
    back_fit = Fit(max_w=72, max_h=112, bottom=126)
    diag_fit = Fit(max_w=80, max_h=112, bottom=126)

    left_run_a = right_frames[0].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    left_run_b = right_frames[1].transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    return {
        16: fit_cell(down_frames[0], front_fit),
        17: fit_cell(down_frames[1], front_fit),
        18: fit_cell(left_run_a, side_fit),
        19: fit_cell(left_run_b, side_fit),
        20: fit_cell(right_frames[0], side_fit),
        21: fit_cell(right_frames[1], side_fit),
        22: fit_cell(back_frames[0], back_fit),
        23: fit_cell(back_frames[1], back_fit),
        36: fit_cell(diagonal_frames["downright_a"], diag_fit),
        37: fit_cell(diagonal_frames["downright_b"], diag_fit),
        38: fit_cell(diagonal_frames["downleft_a"], diag_fit),
        39: fit_cell(diagonal_frames["downleft_b"], diag_fit),
        40: fit_cell(diagonal_frames["upright_a"], diag_fit),
        41: fit_cell(diagonal_frames["upright_b"], diag_fit),
        42: fit_cell(diagonal_frames["upleft_a"], diag_fit),
        43: fit_cell(diagonal_frames["upleft_b"], diag_fit),
    }


def validate_sheet(sheet: Image.Image) -> None:
    if sheet.size != (FW * COLS, FH * 12):
        raise RuntimeError(f"bad sheet size {sheet.size}")
    problems: list[str] = []
    for i in range(TOTAL):
        cell = frame(sheet, i)
        alpha = np.array(cell.getchannel("A"))
        count = int((alpha > 8).sum())
        if count < 500:
            problems.append(f"frame {i:02d} has too little alpha ({count})")
            continue
        top = int((alpha[0, :] > 8).sum())
        left = int((alpha[:, 0] > 8).sum())
        right = int((alpha[:, FW - 1] > 8).sum())
        if top or left or right:
            problems.append(f"frame {i:02d} touches top/side border t/l/r={top}/{left}/{right}")
    if problems:
        raise RuntimeError("\n".join(problems))


def write_review(sheet: Image.Image, replaced: dict[int, Image.Image]) -> None:
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    FRAME_REVIEW_DIR.mkdir(parents=True, exist_ok=True)

    for i in range(TOTAL):
        frame(sheet, i).save(FRAME_REVIEW_DIR / f"jay_{i:02d}_{FRAME_LABELS[i]}.png")

    cols = 4
    tile_w = 132
    tile_h = 172
    rows = (TOTAL + cols - 1) // cols
    board = Image.new("RGBA", (cols * tile_w, rows * tile_h), (30, 30, 36, 255))
    draw = ImageDraw.Draw(board)
    bg = checker((FW, FH))
    for i in range(TOTAL):
        x = (i % cols) * tile_w + 18
        y = (i // cols) * tile_h + 18
        board.alpha_composite(bg, (x, y))
        board.alpha_composite(frame(sheet, i), (x, y))
        label = f"{i:02d} {FRAME_LABELS[i]}"
        color = (255, 238, 156, 255) if i in replaced else (238, 238, 238, 255)
        draw.text((x, y + FH + 6), label, fill=color)
    board.save(REVIEW_DIR / "jay_fullres_46_review.png")

    run_indices = [16, 17, 18, 19, 20, 21, 22, 23, 36, 37, 38, 39, 40, 41, 42, 43]
    run_board = Image.new("RGBA", (4 * tile_w, 4 * tile_h), (30, 30, 36, 255))
    draw = ImageDraw.Draw(run_board)
    for pos, i in enumerate(run_indices):
        x = (pos % 4) * tile_w + 18
        y = (pos // 4) * tile_h + 18
        run_board.alpha_composite(bg, (x, y))
        run_board.alpha_composite(frame(sheet, i), (x, y))
        draw.text((x, y + FH + 6), f"{i:02d} {FRAME_LABELS[i]}", fill=(255, 238, 156, 255))
    run_board.save(REVIEW_DIR / "jay_fullres_run_cells_review.png")

    gif_sets = {
        "down": [16, 17],
        "left": [18, 19],
        "right": [20, 21],
        "up": [22, 23],
        "downright": [36, 37],
        "downleft": [38, 39],
        "upright": [40, 41],
        "upleft": [42, 43],
    }
    for name, indices in gif_sets.items():
        frames = []
        for index in indices * 4:
            bg_frame = checker((FW, FH))
            bg_frame.alpha_composite(frame(sheet, index), (0, 0))
            frames.append(bg_frame.convert("RGB").resize((FW * 3, FH * 3), Image.Resampling.NEAREST))
        frames[0].save(
            REVIEW_DIR / f"jay_run_{name}_fullres.gif",
            save_all=True,
            append_images=frames[1:],
            duration=120,
            loop=0,
            disposal=2,
        )


def main() -> None:
    sheet = load_rgba(BASE_SHEET)
    replacements = extract_sources()
    for index, replacement in replacements.items():
        paste_frame(sheet, index, replacement)

    validate_sheet(sheet)

    OUT_SHEET.parent.mkdir(parents=True, exist_ok=True)
    OUT_MASTER.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT_SHEET)
    sheet.save(OUT_MASTER)
    write_review(sheet, replacements)

    print(f"wrote {OUT_SHEET}")
    print(f"wrote {OUT_MASTER}")
    print(f"wrote {REVIEW_DIR / 'jay_fullres_46_review.png'}")
    print(f"wrote {REVIEW_DIR / 'jay_fullres_run_cells_review.png'}")
    print(f"wrote {FRAME_REVIEW_DIR}")


if __name__ == "__main__":
    main()
