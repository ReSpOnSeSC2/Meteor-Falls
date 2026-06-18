"""
cli.py — Cadence batch command-line interface.

Cadence turns an 8-angle character turnaround into the game's exact 46-frame
runtime sheet (``<name>_anim_46_4x.png``, 384x1536) — fully offline (Pillow +
numpy). This module is a thin batch wrapper over ``engine``.

Drop-in workflow (any character, not just the heroes)
-----------------------------------------------------
    1. Put the 8-angle turnaround in the game as
       ``assets/art/masters/characters/<name>-8angle-transparent.png``
       (a single row of 8 facings: S SW W NW N NE E SE).
    2. Generate + install the movement straight into the game:
           python cli.py install <name>
       -> writes ``assets/art/characters/<name>_anim_46_4x.png`` (drop-in for
          src/spritegen/authored.ts), backing up any existing sheet first.
    3. Do them all at once:
           python cli.py install-all

Other commands
--------------
    render <source.png> --name jay [--out DIR]   one sheet -> a scratch dir
    all [--masters DIR] [--out DIR]              render every master -> scratch
    slice <source.png>                           debug: sliced facings + sizes
"""
from __future__ import annotations

import argparse
import glob
import os
import shutil
import sys
import tempfile
import time

from PIL import Image

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if _THIS_DIR not in sys.path:
    sys.path.insert(0, _THIS_DIR)  # run from anywhere

# Engine is the single source of truth; we only import from it.
from engine.project import Project  # noqa: E402
from engine.sheet import CANONICAL  # noqa: E402
from engine.sourcesheet import slice_source  # noqa: E402

_MASTER_GLOB = "*-8angle-transparent.png"


# --------------------------------------------------------------------------- #
# Repo layout discovery (works no matter where the animator folder lives)
# --------------------------------------------------------------------------- #
def find_repo_root(start: str | None = None) -> str:
    """Walk up until we find the dir that holds ``assets/art/characters``."""
    d = os.path.abspath(start or _THIS_DIR)
    while True:
        if os.path.isdir(os.path.join(d, "assets", "art", "characters")):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            # fall back to two levels up from the engine (legacy layout)
            return os.path.normpath(os.path.join(_THIS_DIR, ".."))
        d = parent


def masters_dir(root: str) -> str:
    return os.path.join(root, "assets", "art", "masters", "characters")


def characters_dir(root: str) -> str:
    return os.path.join(root, "assets", "art", "characters")


# candidate filename patterns for a character's 8-angle source, best first
def _source_candidates(root: str, name: str) -> list[str]:
    md = masters_dir(root)
    cd = characters_dir(root)
    dr = os.path.join(root, "assets", "art", "drafts")
    pats = [
        os.path.join(md, f"{name}-8angle-transparent.png"),
        os.path.join(md, f"{name}-8angle-source.png"),
        os.path.join(cd, f"{name}-8angle-transparent.png"),
        os.path.join(cd, f"{name}_8angle*.png"),
        os.path.join(dr, f"{name}-8angle-transparent.png"),
        os.path.join(md, f"{name}*8angle*transparent*.png"),
        os.path.join(md, f"{name}*8angle*.png"),
    ]
    hits: list[str] = []
    for p in pats:
        for g in sorted(glob.glob(p)):
            if g not in hits:
                hits.append(g)
    return hits


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _sanitize_id(name: str) -> str:
    keep = [c if (c.isalnum() or c in "-_") else "_" for c in name.strip().lower()]
    return "".join(keep).strip("_") or "character"


def _name_from_master(path: str) -> str:
    base = os.path.basename(path)
    for suffix in ("-8angle-transparent.png", "-8angle-transparent.PNG"):
        if base.endswith(suffix):
            return base[: -len(suffix)]
    return os.path.splitext(base)[0]


def _safe_install(tmp_png: str, dst: str, *, attempts: int = 5) -> None:
    """Copy ``tmp_png`` -> ``dst``, robust to a flaky overwrite.

    Some mounts refuse to truncate an existing file in place; delete-then-write
    (a fresh inode) succeeds where an in-place overwrite fails.
    """
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    last: Exception | None = None
    for i in range(attempts):
        try:
            if os.path.exists(dst):
                try:
                    os.remove(dst)
                except FileNotFoundError:
                    pass
            shutil.copyfile(tmp_png, dst)
            # verify it actually landed at the right size
            with Image.open(dst) as im:
                im.load()
            return
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(0.4)
    raise RuntimeError(f"could not install {dst}: {last}")


def _backup_once(dst: str, root: str) -> str | None:
    """Preserve the *original* sheet the first time we touch it."""
    if not os.path.exists(dst):
        return None
    bk_dir = os.path.join(characters_dir(root), "_cadence_backup")
    os.makedirs(bk_dir, exist_ok=True)
    bk = os.path.join(bk_dir, os.path.basename(dst))
    if os.path.exists(bk):
        return bk  # original already preserved; don't clobber it
    for _ in range(5):
        try:
            shutil.copyfile(dst, bk)
            return bk
        except Exception:  # noqa: BLE001
            time.sleep(0.4)
    return None


def render_character(source_path: str, name: str, out_dir: str) -> dict[str, object]:
    """Render the 46-frame sheet + atlas + preview gifs into ``out_dir``."""
    if not os.path.isfile(source_path):
        raise FileNotFoundError(f"source sheet not found: {source_path}")
    pid = _sanitize_id(name)
    os.makedirs(out_dir, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="cadence_") as projects_dir:
        proj = Project.create(pid, name, source_path, projects_dir)
        sheet_src = proj.render_sheet_png()
        atlas_src = os.path.join(proj.root, "out", f"{pid}_anim_46.json")
        with Image.open(sheet_src) as im:
            size = (im.width, im.height)
        sheet_dst = os.path.join(out_dir, f"{pid}_anim_46_4x.png")
        atlas_dst = os.path.join(out_dir, f"{pid}_anim_46.json")
        shutil.copyfile(sheet_src, sheet_dst)
        if os.path.isfile(atlas_src):
            shutil.copyfile(atlas_src, atlas_dst)
        gifs: list[str] = []
        gif_errors: list[str] = []
        for facing in CANONICAL:
            if facing not in proj.rigs:
                continue
            for motion in ("walk", "run"):
                try:
                    gif_src = proj.render_preview_gif(facing, motion)
                    gif_dst = os.path.join(out_dir, f"preview_{facing}_{motion}.gif")
                    shutil.copyfile(gif_src, gif_dst)
                    gifs.append(gif_dst)
                except Exception as exc:  # noqa: BLE001
                    gif_errors.append(f"{facing}/{motion}: {exc}")
    return {"name": name, "id": pid, "sheet": sheet_dst, "size": size,
            "atlas": atlas_dst, "gifs": gifs, "gif_errors": gif_errors}


def install_character(source_path: str, name: str, root: str) -> dict[str, object]:
    """Render and install ``<name>_anim_46_4x.png`` into assets/art/characters."""
    pid = _sanitize_id(name)
    with tempfile.TemporaryDirectory(prefix="cadence_") as projects_dir:
        proj = Project.create(pid, name, source_path, projects_dir)
        sheet_src = proj.render_sheet_png()
        with Image.open(sheet_src) as im:
            size = (im.width, im.height)
        dst = os.path.join(characters_dir(root), f"{pid}_anim_46_4x.png")
        backup = _backup_once(dst, root)
        _safe_install(sheet_src, dst)
    return {"name": name, "id": pid, "installed": dst, "size": size, "backup": backup,
            "source": source_path}


def _print_result(result: dict[str, object]) -> None:
    for key, value in result.items():
        if isinstance(value, list):
            print(f"{key}:")
            for item in value:
                print(f"  {item}")
        else:
            print(f"{key}: {value}")


def main(argv: list[str] | None = None) -> int:
    root = find_repo_root()
    parser = argparse.ArgumentParser(description="Render Cadence 46-frame character sheets.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    render = sub.add_parser("render", help="render one 8-angle source into a scratch directory")
    render.add_argument("source")
    render.add_argument("--name", required=True)
    render.add_argument("--out", default=os.path.join(root, "assets", "art", "review", "cadence"))

    install = sub.add_parser("install", help="render and install one named master")
    install.add_argument("name")

    all_cmd = sub.add_parser("all", help="render every 8-angle master into a scratch directory")
    all_cmd.add_argument("--masters", default=masters_dir(root))
    all_cmd.add_argument("--out", default=os.path.join(root, "assets", "art", "review", "cadence"))

    install_all = sub.add_parser("install-all", help="render and install every 8-angle master")
    install_all.add_argument("--masters", default=masters_dir(root))

    slice_cmd = sub.add_parser("slice", help="print source slicing diagnostics")
    slice_cmd.add_argument("source")

    args = parser.parse_args(argv)

    if args.cmd == "render":
        _print_result(render_character(args.source, args.name, args.out))
        return 0

    if args.cmd == "install":
        hits = _source_candidates(root, args.name)
        if not hits:
            raise FileNotFoundError(f"no 8-angle source found for {args.name}")
        _print_result(install_character(hits[0], args.name, root))
        return 0

    if args.cmd == "all":
        masters = sorted(glob.glob(os.path.join(args.masters, _MASTER_GLOB)))
        if not masters:
            raise FileNotFoundError(f"no masters found in {args.masters}")
        for source in masters:
            name = _name_from_master(source)
            result = render_character(source, name, os.path.join(args.out, name))
            print(f"rendered {name}: {result['sheet']}")
        return 0

    if args.cmd == "install-all":
        masters = sorted(glob.glob(os.path.join(args.masters, _MASTER_GLOB)))
        if not masters:
            raise FileNotFoundError(f"no masters found in {args.masters}")
        for source in masters:
            name = _name_from_master(source)
            result = install_character(source, name, root)
            print(f"installed {name}: {result['installed']}")
        return 0

    if args.cmd == "slice":
        sheet = slice_source(args.source)
        print(f"source: {args.source}")
        print(f"size: {sheet.size[0]}x{sheet.size[1]}")
        for compass, cell in sheet.cells.items():
            print(f"{compass}: x[{cell.src_x0}..{cell.src_x1}) {cell.width}x{cell.height}")
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
