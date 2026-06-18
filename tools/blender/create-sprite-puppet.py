import argparse
import json
import math
import os
import sys

import bpy


def parse_args():
    raw = sys.argv
    argv = raw[raw.index("--") + 1 :] if "--" in raw else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True)
    parser.add_argument("--out", required=True)
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def make_material(name, image_path):
    image = bpy.data.images.load(image_path)
    image.alpha_mode = "STRAIGHT"
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    mat.show_transparent_back = True
    nodes = mat.node_tree.nodes
    for node in list(nodes):
        nodes.remove(node)
    output = nodes.new("ShaderNodeOutputMaterial")
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.interpolation = "Closest"
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 1.0
    mix = nodes.new("ShaderNodeMixShader")
    mat.node_tree.links.new(tex.outputs["Color"], emission.inputs["Color"])
    mat.node_tree.links.new(tex.outputs["Alpha"], mix.inputs["Fac"])
    mat.node_tree.links.new(transparent.outputs["BSDF"], mix.inputs[1])
    mat.node_tree.links.new(emission.outputs["Emission"], mix.inputs[2])
    mat.node_tree.links.new(mix.outputs["Shader"], output.inputs["Surface"])
    return mat


def make_piece(piece, frame_h):
    pivot_x = piece["pivotX"]
    pivot_y = piece["pivotY"]
    x = piece["x"]
    y = piece["y"]
    w = piece["w"]
    h = piece["h"]
    left = x - pivot_x
    right = x + w - pivot_x
    top = pivot_y - y
    bottom = pivot_y - y - h

    mesh = bpy.data.meshes.new(piece["name"] + "_mesh")
    mesh.from_pydata(
        [(left, bottom, 0), (right, bottom, 0), (right, top, 0), (left, top, 0)],
        [],
        [(0, 1, 2, 3)],
    )
    mesh.update()
    uv = mesh.uv_layers.new(name="UVMap")
    uv.data[0].uv = (0, 0)
    uv.data[1].uv = (1, 0)
    uv.data[2].uv = (1, 1)
    uv.data[3].uv = (0, 1)

    obj = bpy.data.objects.new(piece["name"], mesh)
    obj.location = (pivot_x, frame_h - pivot_y, piece["layer"] * 0.01)
    obj.data.materials.append(make_material(piece["name"] + "_mat", piece["image"]))
    bpy.context.collection.objects.link(obj)
    return obj


def key(obj, frame, dx=0, dy=0, rot=0):
    base = obj["base_location"]
    obj.location = (base[0] + dx, base[1] - dy, base[2])
    obj.rotation_euler = (0, 0, math.radians(rot))
    obj.keyframe_insert(data_path="location", frame=frame)
    obj.keyframe_insert(data_path="rotation_euler", frame=frame)


def constant_interpolation():
    for obj in bpy.context.scene.objects:
        if not obj.animation_data or not obj.animation_data.action:
            continue
        curves = getattr(obj.animation_data.action, "fcurves", [])
        for curve in curves:
            for point in curve.keyframe_points:
                point.interpolation = "CONSTANT"


def animate(objects):
    for obj in objects.values():
        obj["base_location"] = tuple(obj.location)
        for frame in range(46):
            key(obj, frame)

    # Shared Meteor Falls motion template. Positive dy moves down in frame space.
    poses = {
        16: {
            "head": (0, -1, 0),
            "torso": (0, -1, 0),
            "arm_l": (-1, -3, -6),
            "arm_r": (1, 3, 6),
            "leg_l": (-3, 4, -7),
            "leg_r": (2, -2, 5),
        },
        17: {
            "head": (0, 0, 0),
            "torso": (0, 0, 0),
            "arm_l": (-1, 3, 6),
            "arm_r": (1, -3, -6),
            "leg_l": (-2, -2, 5),
            "leg_r": (3, 4, -7),
        },
        22: {
            "head": (0, -1, 0),
            "torso": (0, -1, 0),
            "arm_l": (1, -3, 6),
            "arm_r": (-1, 3, -6),
            "leg_l": (2, -2, 5),
            "leg_r": (-3, 4, -7),
        },
        23: {
            "head": (0, 0, 0),
            "torso": (0, 0, 0),
            "arm_l": (1, 3, -6),
            "arm_r": (-1, -3, 6),
            "leg_l": (3, 4, -7),
            "leg_r": (-2, -2, 5),
        },
    }
    for frame, pose in poses.items():
        for name, values in pose.items():
            if name in objects:
                key(objects[name], frame, *values)

    constant_interpolation()


def setup_camera(frame_w, frame_h):
    camera_data = bpy.data.cameras.new("MF_Camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = frame_h
    camera = bpy.data.objects.new("MF_Camera", camera_data)
    camera.location = (frame_w / 2, frame_h / 2, 200)
    camera.rotation_euler = (0, 0, 0)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera


def setup_render(frame_w, frame_h):
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end = 45
    scene.render.resolution_x = frame_w
    scene.render.resolution_y = frame_h
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1


def main():
    args = parse_args()
    with open(args.spec, "r", encoding="utf-8") as f:
        spec = json.load(f)

    frame_w = spec["frameW"]
    frame_h = spec["frameH"]
    clear_scene()
    setup_render(frame_w, frame_h)
    setup_camera(frame_w, frame_h)

    objects = {}
    for piece in spec["pieces"]:
        objects[piece["name"]] = make_piece(piece, frame_h)
    animate(objects)

    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print(f"{spec['id']}: saved sprite puppet rig {out}")


if __name__ == "__main__":
    main()
