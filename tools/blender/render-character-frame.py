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
    parser.add_argument("--frame", required=True, type=int)
    parser.add_argument("--out", required=True)
    return parser.parse_args(argv)


def main():
    args = parse_args()
    scene = bpy.context.scene

    scene.frame_set(args.frame)
    scene.render.resolution_x = FRAME_W
    scene.render.resolution_y = FRAME_H
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"

    camera = bpy.data.objects.get("MF_Camera") or scene.camera
    if camera is None:
        raise RuntimeError("rig needs a camera named MF_Camera, or an active scene camera")
    scene.camera = camera

    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print(f"{args.char}: rendered frame {args.frame} -> {out}")


if __name__ == "__main__":
    main()
