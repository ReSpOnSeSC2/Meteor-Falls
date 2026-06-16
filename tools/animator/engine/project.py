"""
project.py — a Cadence project: one character, its source sheet, per-facing
rigs (editable) and motion params, plus create / segment / render / export.

Persisted on disk as ``<projects>/<id>/project.json`` (+ sliced cells and
rendered output). The UI edits joints and motion params through this object.
"""
from __future__ import annotations

import json
import os
import zipfile
from dataclasses import dataclass, field

from PIL import Image

from .motion import PRESETS, MotionParams
from .sheet import CANONICAL, CONTRACT, SheetRenderer, atlas, save_gif
from .skeleton import Skeleton, detect_skeleton
from .sourcesheet import DIRECTION_SOURCE, slice_source


@dataclass
class Project:
    id: str
    name: str
    root: str  # project directory
    source_path: str
    rigs: dict[str, Skeleton] = field(default_factory=dict)  # facing -> skeleton
    cells: dict[str, Image.Image] = field(default_factory=dict)  # facing -> RGBA cell
    params: dict[str, MotionParams] = field(default_factory=dict)

    # ---- lifecycle ----------------------------------------------------
    @classmethod
    def create(cls, pid: str, name: str, source_path: str, projects_dir: str) -> "Project":
        root = os.path.join(projects_dir, pid)
        os.makedirs(os.path.join(root, "cells"), exist_ok=True)
        os.makedirs(os.path.join(root, "out"), exist_ok=True)
        local_src = os.path.join(root, "source.png")
        Image.open(source_path).convert("RGBA").save(local_src)
        proj = cls(id=pid, name=name, root=root, source_path=local_src,
                   params={k: MotionParams.from_dict(v.to_dict()) for k, v in PRESETS.items()})
        proj.slice_and_segment()
        proj.save()
        return proj

    def slice_and_segment(self) -> None:
        sheet = slice_source(self.source_path)
        for facing in CANONICAL:
            compass, _ = DIRECTION_SOURCE[facing]
            if compass not in sheet.cells:
                continue
            cell = sheet.cells[compass].image
            self.cells[facing] = cell
            cell.save(os.path.join(self.root, "cells", f"{facing}.png"))
            self.rigs[facing] = detect_skeleton(cell, facing)

    # ---- editing ------------------------------------------------------
    def set_joint(self, facing: str, joint: str, x: float, y: float) -> None:
        sk = self.rigs[facing]
        sk.joints[joint] = [float(x), float(y)]
        from .skeleton import assign_parts
        sk.parts = assign_parts(self.cells[facing], sk)

    def reset_rig(self, facing: str) -> None:
        self.rigs[facing] = detect_skeleton(self.cells[facing], facing)

    def set_params(self, motion: str, params: MotionParams) -> None:
        self.params[motion] = params

    # ---- rendering ----------------------------------------------------
    def renderer(self) -> SheetRenderer:
        return SheetRenderer(self.rigs, self.cells)

    def render_sheet_png(self) -> str:
        img = self.renderer().render_sheet(self.params)
        path = os.path.join(self.root, "out", f"{self.id}_anim_46_4x.png")
        img.save(path)
        a = atlas(os.path.basename(path), img.width, img.height)
        with open(os.path.join(self.root, "out", f"{self.id}_anim_46.json"), "w") as f:
            json.dump(a, f, indent=2)
        return path

    def render_preview_gif(self, facing: str, motion: str) -> str:
        r = self.renderer()
        frames = r.render_anim(facing, motion, self.params)
        path = os.path.join(self.root, "out", f"preview_{facing}_{motion}.gif")
        save_gif(frames, path, self.params[motion].fps if motion in self.params else 9)
        return path

    def export_zip(self) -> str:
        sheet = self.render_sheet_png()
        out_dir = os.path.join(self.root, "out")
        zpath = os.path.join(self.root, f"{self.id}_export.zip")
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            z.write(sheet, os.path.basename(sheet))
            z.write(os.path.join(out_dir, f"{self.id}_anim_46.json"), f"{self.id}_anim_46.json")
        return zpath

    # ---- persistence --------------------------------------------------
    def save(self) -> None:
        data = {
            "id": self.id, "name": self.name, "source_path": self.source_path,
            "rigs": {k: v.to_dict() for k, v in self.rigs.items()},
            "params": {k: v.to_dict() for k, v in self.params.items()},
        }
        with open(os.path.join(self.root, "project.json"), "w") as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls, root: str) -> "Project":
        with open(os.path.join(root, "project.json")) as f:
            d = json.load(f)
        proj = cls(id=d["id"], name=d["name"], root=root, source_path=d["source_path"],
                   params={k: MotionParams.from_dict(v) for k, v in d["params"].items()})
        for facing, sd in d["rigs"].items():
            cell = Image.open(os.path.join(root, "cells", f"{facing}.png")).convert("RGBA")
            proj.cells[facing] = cell
            proj.rigs[facing] = Skeleton.from_dict(sd, cell)
        return proj
