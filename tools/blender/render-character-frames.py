import argparse
import os
import sys

import bpy


FRAME_W = 96
FRAME_H = 128


def parse_args():
    raw = sys.argv
    argv = raw[raw.index("--") + 1 :] if "--" in raw else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--char", required=True)
    parser.add_argument("--frames", required=True)
    parser.add_argument("--out-dir", required=True)
    return parser.parse_args(argv)


def parse_frames(value):
    out = []
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = [int(n) for n in part.split("-", 1)]
            step = 1 if a <= b else -1
            out.extend(range(a, b + step, step))
        else:
            out.append(int(part))
    return out


def setup_render(scene):
    scene.render.resolution_x = FRAME_W
    scene.render.resolution_y = FRAME_H
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"


def main():
    args = parse_args()
    frames = parse_frames(args.frames)
    scene = bpy.context.scene
    setup_render(scene)

    camera = bpy.data.objects.get("MF_Camera") or scene.camera
    if camera is None:
        raise RuntimeError("rig needs a camera named MF_Camera, or an active scene camera")
    scene.camera = camera

    out_dir = os.path.abspath(args.out_dir)
    os.makedirs(out_dir, exist_ok=True)

    for frame in frames:
        scene.frame_set(frame)
        out = os.path.join(out_dir, f"{args.char}_frame_{frame}_blender.png")
        scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print(f"{args.char}: rendered frame {frame} -> {out}")


if __name__ == "__main__":
    main()
