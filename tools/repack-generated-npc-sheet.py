from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


CELL_W = 96
CELL_H = 128
COLS = 4
ROWS = 12
FRAMES = 46


def is_key(pixel: tuple[int, int, int, int], key: str) -> bool:
    r, g, b, a = pixel
    if a < 8:
        return True
    if key == "magenta":
        return r >= 100 and b >= 100 and r - g >= 35 and b - g >= 35
    return g >= 100 and g - r >= 35 and g - b >= 25


def foreground_mask(img: Image.Image, key: str) -> list[bytearray]:
    pix = img.load()
    w, h = img.size
    mask = [bytearray(w) for _ in range(h)]
    for y in range(h):
        row = mask[y]
        for x in range(w):
            row[x] = 0 if is_key(pix[x, y], key) else 1
    return mask


def components(mask: list[bytearray], min_area: int) -> list[tuple[int, int, int, int, int]]:
    h = len(mask)
    w = len(mask[0])
    seen = [bytearray(w) for _ in range(h)]
    out: list[tuple[int, int, int, int, int]] = []

    for y0 in range(h):
        for x0 in range(w):
            if not mask[y0][x0] or seen[y0][x0]:
                continue
            q: deque[tuple[int, int]] = deque([(x0, y0)])
            seen[y0][x0] = 1
            min_x = max_x = x0
            min_y = max_y = y0
            area = 0
            while q:
                x, y = q.popleft()
                area += 1
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = 1
                        q.append((nx, ny))
            if area >= min_area:
                out.append((min_x, min_y, max_x + 1, max_y + 1, area))
    return out


def merge_nearby_boxes(
    boxes: list[tuple[int, int, int, int, int]],
    x_gap: int = 16,
    y_gap: int = 18,
) -> list[tuple[int, int, int, int, int]]:
    merged = True
    current = boxes[:]
    while merged:
        merged = False
        next_boxes: list[tuple[int, int, int, int, int]] = []
        used = [False] * len(current)
        for i, box in enumerate(current):
            if used[i]:
                continue
            ax0, ay0, ax1, ay1, aa = box
            used[i] = True
            changed = True
            while changed:
                changed = False
                for j, other in enumerate(current):
                    if used[j]:
                        continue
                    bx0, by0, bx1, by1, ba = other
                    separated_x = bx0 > ax1 + x_gap or ax0 > bx1 + x_gap
                    separated_y = by0 > ay1 + y_gap or ay0 > by1 + y_gap
                    if not separated_x and not separated_y:
                        ax0 = min(ax0, bx0)
                        ay0 = min(ay0, by0)
                        ax1 = max(ax1, bx1)
                        ay1 = max(ay1, by1)
                        aa += ba
                        used[j] = True
                        changed = True
                        merged = True
            next_boxes.append((ax0, ay0, ax1, ay1, aa))
        current = next_boxes
    return current


def clean_sprite(img: Image.Image, box: tuple[int, int, int, int, int], key: str, pad: int = 3) -> Image.Image:
    x0, y0, x1, y1, _area = box
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    crop = img.crop((x0, y0, x1, y1)).convert("RGBA")
    pix = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = pix[x, y]
            if is_key((r, g, b, a), key):
                pix[x, y] = (0, 0, 0, 0)
            else:
                if key == "green" and g > max(r, b) + 18:
                    g = max(r, b) + 18
                elif key == "magenta" and r > g + 18 and b > g + 18:
                    spill = min(r, b) - g
                    r = max(g + 18, r - spill // 2)
                    b = max(g + 18, b - spill // 2)
                pix[x, y] = (r, g, b, a)
    return crop


def place_sprite(sheet: Image.Image, sprite: Image.Image, frame: int) -> None:
    max_w = 82
    max_h = 112
    scale = min(max_w / sprite.width, max_h / sprite.height, 1.0)
    if scale < 1.0:
        sprite = sprite.resize((max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))), Image.Resampling.LANCZOS)
    cell_x = (frame % COLS) * CELL_W
    cell_y = (frame // COLS) * CELL_H
    x = cell_x + (CELL_W - sprite.width) // 2
    y = cell_y + 114 - sprite.height
    y = max(cell_y, min(cell_y + CELL_H - sprite.height, y))
    sheet.alpha_composite(sprite, (x, y))


def alpha_count(img: Image.Image, frame: int) -> int:
    cell_x = (frame % COLS) * CELL_W
    cell_y = (frame // COLS) * CELL_H
    crop = img.crop((cell_x, cell_y, cell_x + CELL_W, cell_y + CELL_H))
    return sum(1 for _r, _g, _b, a in crop.getdata() if a > 0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--master", required=True)
    parser.add_argument("--min-area", type=int, default=900)
    parser.add_argument("--min-alpha", type=int, default=1500)
    parser.add_argument("--idle-min-height", type=int, default=90)
    parser.add_argument("--key", choices=("green", "magenta"), default="green")
    args = parser.parse_args()

    src = Image.open(args.input).convert("RGBA")
    mask = foreground_mask(src, args.key)
    boxes = components(mask, args.min_area)
    boxes = [box for box in boxes if box[2] - box[0] >= 20 and box[3] - box[1] >= 30]
    boxes.sort(key=lambda b: (b[1], b[0]))
    if len(boxes) < FRAMES:
        raise SystemExit(f"only found {len(boxes)} source poses; need {FRAMES}")

    selected = boxes[:FRAMES]
    if len(boxes) > FRAMES:
        idle_candidates = [
            box for box in boxes[44:]
            if box[3] - box[1] >= args.idle_min_height and box[2] - box[0] >= 30
        ]
        if len(idle_candidates) < 2:
            idle_candidates = boxes[44:]
        selected = boxes[:44] + idle_candidates[-2:]
    sprites = [clean_sprite(src, box, args.key) for box in selected]
    sheet = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    for i, sprite in enumerate(sprites):
        place_sprite(sheet, sprite, i)

    low = [i for i in range(FRAMES) if alpha_count(sheet, i) <= args.min_alpha]
    if low:
        raise SystemExit(f"low-alpha frames after repack: {low}")

    out = Path(args.out)
    master = Path(args.master)
    out.parent.mkdir(parents=True, exist_ok=True)
    master.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    sheet.save(master)
    print(f"wrote {out} and {master} from {len(boxes)} detected poses")


if __name__ == "__main__":
    main()
