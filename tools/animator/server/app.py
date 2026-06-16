"""
app.py — Cadence FastAPI backend.

Wraps the (frozen, validated) ``engine`` package: one character source sheet ->
editable per-facing rigs + motion params -> the game's 46-frame runtime sheet,
live posed frames, preview gifs and a zip export. All data is REAL engine output
on real character fixtures; there are no stubs or mocks anywhere in this server.

Dependencies (owned/installed by the CLI/packaging agent, listed here for
reference only): fastapi, uvicorn, pillow, numpy, python-multipart.

Run with ``python -m server.run`` (or ``uvicorn server.app:app``) from the
``animator/`` directory.
"""
from __future__ import annotations

import io
import os
import re
import tempfile
import time
import uuid
from typing import Any

import numpy as np
import PIL
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

import engine
from engine.motion import MotionParams
from engine.project import Project
from engine.sheet import CONTRACT, Slot
from engine.skeleton import overlay
from engine.sourcesheet import ALL_DIRS

# --------------------------------------------------------------------------- #
# Paths & app setup
# --------------------------------------------------------------------------- #
HERE = os.path.dirname(os.path.abspath(__file__))          # animator/server
ANIMATOR_DIR = os.path.dirname(HERE)                        # animator/
PROJECTS_DIR = os.path.join(ANIMATOR_DIR, "projects")
WEB_DIR = os.path.join(ANIMATOR_DIR, "web")

os.makedirs(PROJECTS_DIR, exist_ok=True)
os.makedirs(WEB_DIR, exist_ok=True)

# Ensure mounting the frontend never crashes even if the web/ agent hasn't run.
_index = os.path.join(WEB_DIR, "index.html")
if not os.path.exists(_index):
    with open(_index, "w", encoding="utf-8") as _f:
        _f.write(
            "<!doctype html><meta charset=utf-8>"
            "<title>Cadence</title>"
            "<body style='font-family:system-ui;background:#16161a;color:#eee;"
            "display:grid;place-items:center;height:100vh;margin:0'>"
            "<main><h1>Cadence</h1><p>UI loading…</p></main></body>"
        )

app = FastAPI(title="Cadence", version=engine.__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
# In-memory project cache
# --------------------------------------------------------------------------- #
_CACHE: dict[str, Project] = {}


def _project_root(pid: str) -> str:
    return os.path.join(PROJECTS_DIR, pid)


def _get_project(pid: str) -> Project:
    """Return a loaded Project, hitting the cache or loading from disk."""
    proj = _CACHE.get(pid)
    if proj is not None:
        return proj
    root = _project_root(pid)
    if not os.path.isdir(root) or not os.path.exists(os.path.join(root, "project.json")):
        raise HTTPException(status_code=404, detail=f"project '{pid}' not found")
    proj = Project.load(root)
    _CACHE[pid] = proj
    return proj


_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slug(name: str) -> str:
    s = _SLUG_RE.sub("-", name.strip().lower()).strip("-")
    return s or "project"


def _new_pid(name: str) -> str:
    return f"{_slug(name)}-{uuid.uuid4().hex[:8]}"


def _resolve_source_path(source_path: str) -> str:
    """Resolve a client-supplied server-side source path.

    Absolute paths are used as-is; relative paths resolve against the animator
    directory (so ``../assets/...`` points at the repo's masters, matching how a
    user runs the tool from ``animator/``).
    """
    p = source_path if os.path.isabs(source_path) else os.path.join(ANIMATOR_DIR, source_path)
    p = os.path.normpath(p)
    if not os.path.exists(p):
        raise HTTPException(status_code=400, detail=f"source_path not found: {source_path}")
    return p


# --------------------------------------------------------------------------- #
# Serialization helpers — the canonical JSON shapes the frontend relies on
# --------------------------------------------------------------------------- #
def _facing_state(proj: Project, facing: str) -> dict[str, Any]:
    """Compact per-facing rig state (used by rig edit/reset responses)."""
    sk = proj.rigs[facing]
    return {
        "facing": sk.facing,
        "model": sk.model,
        "bbox": list(sk.bbox),
        "joints": {k: [float(v[0]), float(v[1])] for k, v in sk.joints.items()},
    }


def _facing_full(proj: Project, facing: str) -> dict[str, Any]:
    """Full per-facing block for ``GET /api/projects/{id}``."""
    sk = proj.rigs[facing]
    return {
        "facing": sk.facing,
        "model": sk.model,
        "size": [int(sk.size[0]), int(sk.size[1])],
        "bbox": list(sk.bbox),
        "joints": {k: [float(v[0]), float(v[1])] for k, v in sk.joints.items()},
        "cell_url": f"/api/projects/{proj.id}/cell/{facing}.png",
        "overlay_url": f"/api/projects/{proj.id}/overlay/{facing}.png",
    }


def _project_state(proj: Project) -> dict[str, Any]:
    facings = [_facing_full(proj, f) for f in proj.rigs.keys()]
    params = {motion: mp.to_dict() for motion, mp in proj.params.items()}
    return {
        "id": proj.id,
        "name": proj.name,
        "facings": facings,
        "params": params,
        "sheet_url": f"/api/projects/{proj.id}/sheet.png",
    }


def _png_response(img: Image.Image, *, no_cache: bool = True) -> Response:
    buf = io.BytesIO()
    img.convert("RGBA").save(buf, format="PNG")
    buf.seek(0)
    headers = {"Cache-Control": "no-store, max-age=0"} if no_cache else {}
    return Response(content=buf.getvalue(), media_type="image/png", headers=headers)


def _no_cache_file(path: str, media_type: str, *, filename: str | None = None,
                   attachment: bool = False) -> FileResponse:
    headers = {"Cache-Control": "no-store, max-age=0"}
    if attachment and filename:
        headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return FileResponse(path, media_type=media_type, filename=filename if attachment else None,
                        headers=headers)


# --------------------------------------------------------------------------- #
# Request bodies
# --------------------------------------------------------------------------- #
class CreateProjectJSON(BaseModel):
    name: str
    source_path: str


class RigUpdate(BaseModel):
    joints: dict[str, list[float]]


# --------------------------------------------------------------------------- #
# API: health & listing
# --------------------------------------------------------------------------- #
@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "engine_version": engine.__version__,
        "pillow_version": PIL.__version__,
        "numpy_version": np.__version__,
    }


@app.get("/api/projects")
def list_projects() -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    if not os.path.isdir(PROJECTS_DIR):
        return out
    for entry in sorted(os.listdir(PROJECTS_DIR)):
        root = os.path.join(PROJECTS_DIR, entry)
        meta = os.path.join(root, "project.json")
        if not os.path.isdir(root) or not os.path.exists(meta):
            continue
        try:
            import json
            with open(meta, encoding="utf-8") as f:
                d = json.load(f)
            out.append({"id": d.get("id", entry), "name": d.get("name", entry)})
        except Exception:
            continue
    return out


# --------------------------------------------------------------------------- #
# API: create project
# --------------------------------------------------------------------------- #
@app.post("/api/projects")
async def create_project(
    request: Request,
    file: UploadFile | None = File(default=None),
    name: str | None = Form(default=None),
) -> dict[str, Any]:
    """Create a project from either a multipart upload OR a JSON server-side path.

    multipart: ``file`` (PNG) + ``name``.
    json:      ``{"name": ..., "source_path": ...}`` (server-side path such as
               the Jay fixture under assets/art/masters).
    """
    content_type = request.headers.get("content-type", "")

    # ----- JSON server-side path branch -----
    if "application/json" in content_type:
        body = await request.json()
        try:
            payload = CreateProjectJSON(**body)
        except Exception as e:  # pragma: no cover - validation message passthrough
            raise HTTPException(status_code=422, detail=str(e))
        src = _resolve_source_path(payload.source_path)
        pid = _new_pid(payload.name)
        proj = Project.create(pid, payload.name, src, PROJECTS_DIR)
        _CACHE[pid] = proj
        return _project_state(proj)

    # ----- multipart upload branch -----
    if file is None or name is None:
        raise HTTPException(
            status_code=422,
            detail="provide multipart 'file'+'name', or JSON {name, source_path}",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="uploaded file is empty")
    # Save the upload to a temp PNG first (engine re-encodes it into the project).
    fd, tmp = tempfile.mkstemp(suffix=".png")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        # Validate it is a real image before handing to the engine.
        try:
            Image.open(tmp).convert("RGBA")
        except Exception:
            raise HTTPException(status_code=400, detail="uploaded file is not a valid image")
        pid = _new_pid(name)
        proj = Project.create(pid, name, tmp, PROJECTS_DIR)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    _CACHE[pid] = proj
    return _project_state(proj)


# --------------------------------------------------------------------------- #
# API: read project state
# --------------------------------------------------------------------------- #
@app.get("/api/projects/{pid}")
def get_project(pid: str) -> dict[str, Any]:
    return _project_state(_get_project(pid))


@app.get("/api/projects/{pid}/cell/{facing}.png")
def get_cell(pid: str, facing: str) -> Response:
    proj = _get_project(pid)
    cell = proj.cells.get(facing)
    if cell is None:
        raise HTTPException(status_code=404, detail=f"facing '{facing}' not in project")
    return _png_response(cell)


@app.get("/api/projects/{pid}/overlay/{facing}.png")
def get_overlay(pid: str, facing: str) -> Response:
    proj = _get_project(pid)
    cell = proj.cells.get(facing)
    sk = proj.rigs.get(facing)
    if cell is None or sk is None:
        raise HTTPException(status_code=404, detail=f"facing '{facing}' not in project")
    return _png_response(overlay(cell, sk))


# --------------------------------------------------------------------------- #
# API: edit rig
# --------------------------------------------------------------------------- #
@app.put("/api/projects/{pid}/rig/{facing}")
def update_rig(pid: str, facing: str, body: RigUpdate) -> dict[str, Any]:
    proj = _get_project(pid)
    if facing not in proj.rigs:
        raise HTTPException(status_code=404, detail=f"facing '{facing}' not in project")
    valid = set(proj.rigs[facing].joints.keys())
    for joint, xy in body.joints.items():
        if joint not in valid:
            raise HTTPException(status_code=400, detail=f"unknown joint '{joint}'")
        if len(xy) != 2:
            raise HTTPException(status_code=400, detail=f"joint '{joint}' needs [x, y]")
        proj.set_joint(facing, joint, float(xy[0]), float(xy[1]))
    proj.save()
    return _facing_state(proj, facing)


@app.post("/api/projects/{pid}/rig/{facing}/reset")
def reset_rig(pid: str, facing: str) -> dict[str, Any]:
    proj = _get_project(pid)
    if facing not in proj.rigs:
        raise HTTPException(status_code=404, detail=f"facing '{facing}' not in project")
    proj.reset_rig(facing)
    proj.save()
    return _facing_state(proj, facing)


# --------------------------------------------------------------------------- #
# API: edit motion params
# --------------------------------------------------------------------------- #
@app.put("/api/projects/{pid}/params/{motion}")
async def update_params(pid: str, motion: str, request: Request) -> dict[str, Any]:
    proj = _get_project(pid)
    if motion not in ("walk", "run"):
        raise HTTPException(status_code=400, detail="motion must be 'walk' or 'run'")
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="body must be a JSON object of MotionParams fields")
    # Merge onto existing params so partial updates are allowed.
    base = proj.params.get(motion)
    merged = base.to_dict() if base is not None else {}
    merged.update(body)
    try:
        params = MotionParams.from_dict(merged)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"invalid MotionParams: {e}")
    proj.set_params(motion, params)
    proj.save()
    return params.to_dict()


# --------------------------------------------------------------------------- #
# API: render
# --------------------------------------------------------------------------- #
@app.post("/api/projects/{pid}/render")
def render(pid: str) -> dict[str, str]:
    proj = _get_project(pid)
    proj.render_sheet_png()
    v = int(time.time())
    return {"sheet_url": f"/api/projects/{pid}/sheet.png?v={v}"}


@app.get("/api/projects/{pid}/sheet.png")
def get_sheet(pid: str) -> FileResponse:
    proj = _get_project(pid)
    path = os.path.join(proj.root, "out", f"{proj.id}_anim_46_4x.png")
    if not os.path.exists(path):
        # Render on first request so the URL is always valid.
        path = proj.render_sheet_png()
    return _no_cache_file(path, "image/png")


def _find_slot(facing: str, motion: str, pose: int) -> Slot:
    for s in CONTRACT:
        if s.facing == facing and s.motion == motion and s.pose == pose:
            return s
    raise HTTPException(
        status_code=404,
        detail=f"no contract slot for facing={facing} motion={motion} pose={pose}",
    )


@app.get("/api/projects/{pid}/frame/{facing}/{motion}/{pose}.png")
def get_frame(pid: str, facing: str, motion: str, pose: int) -> Response:
    """Render one posed contract cell live (powers the scrubber)."""
    proj = _get_project(pid)
    slot = _find_slot(facing, motion, pose)
    img = proj.renderer().render_cell(slot, proj.params)
    return _png_response(img)


@app.get("/api/projects/{pid}/preview/{facing}/{motion}.gif")
def get_preview(pid: str, facing: str, motion: str) -> FileResponse:
    proj = _get_project(pid)
    if facing not in ALL_DIRS:
        raise HTTPException(status_code=400, detail=f"unknown facing '{facing}'")
    if motion not in ("walk", "run"):
        raise HTTPException(status_code=400, detail="motion must be 'walk' or 'run'")
    path = proj.render_preview_gif(facing, motion)
    return _no_cache_file(path, "image/gif")


@app.get("/api/projects/{pid}/export.zip")
def export_zip(pid: str) -> FileResponse:
    proj = _get_project(pid)
    path = proj.export_zip()
    return _no_cache_file(path, "application/zip",
                          filename=f"{proj.id}_export.zip", attachment=True)


# --------------------------------------------------------------------------- #
# Static frontend mount (LAST so it never shadows /api/*)
# --------------------------------------------------------------------------- #
app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
