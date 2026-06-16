"""
motion.py — the motion library + per-frame pose generator.

Maps the game's 46-frame contract onto FramePoses. Two locomotion models:

  * step  (front / back, ``down`` / ``up``): the feet alternately LIFT (knee
    tuck) so it reads as walking toward/away from camera, not a sideways waddle.
  * stride (profiles, ``left`` / ``right``): legs scissor about the hips in the
    sagittal plane, the torso leans into the walk. Z-order swaps so the forward
    leg reads in front.

Diagonals are a half-stride blend. Run = larger amplitude + lean + crouch.

Arms are kept RIGID (no elbow bend: ``forearm`` defaults to 0) and swing gently —
on a chibi sprite an articulated forearm detaches and tears, so the whole arm
swings as one piece about the shoulder.

All amplitudes live in ``MotionParams`` so the UI can tune them live.
"""
from __future__ import annotations

from dataclasses import dataclass

from .rig import FramePose

# pose -> swing phase. Walk is a 4-pose cycle (contact, passL, contact, passR);
# the two extremes (1, 3) are where a leg is raised/forward (bob up).
WALK_PHASE = {0: 0.0, 1: 1.0, 2: 0.0, 3: -1.0}
WALK_BOB = {0: 0.0, 1: 1.0, 2: 0.0, 3: 1.0}  # rise on the stepped frames


@dataclass
class MotionParams:
    leg_swing: float  # deg thigh rotation amplitude
    knee_bend: float  # deg shin bend on the trailing leg
    arm_swing: float  # deg upper-arm counter-swing
    forearm: float  # deg forearm follow (0 = rigid arm)
    bob: float  # px vertical body bob
    lean: float  # deg constant torso forward lean (run / stride)
    torso_twist: float  # deg torso counter-rotation
    head_bob: float  # px head settle
    crouch: float  # px constant lower (run)
    fps: int

    def to_dict(self) -> dict:
        return self.__dict__.copy()

    @classmethod
    def from_dict(cls, d: dict) -> "MotionParams":
        f = {k: d[k] for k in cls.__dataclass_fields__ if k in d}
        return cls(**f)


# --- shipped presets (tuned against the Jay fixture) ----------------------- #
PRESETS: dict[str, MotionParams] = {
    "walk": MotionParams(
        leg_swing=16, knee_bend=15, arm_swing=11, forearm=0,
        bob=2.2, lean=0, torso_twist=3, head_bob=0.6, crouch=0, fps=9,
    ),
    "run": MotionParams(
        leg_swing=28, knee_bend=26, arm_swing=16, forearm=0,
        bob=3.6, lean=12, torso_twist=4, head_bob=1.0, crouch=2.0, fps=13,
    ),
}

# side-view legs rotate far more than the front-view lift
SIDE_LEG_FACTOR = 1.6
SIDE_ARM_FACTOR = 0.9
DIAG_FACTOR = 1.45


def model_for(facing: str) -> str:
    if facing in ("left", "right"):
        return "side"
    if facing in ("down", "up"):
        return "step"
    return "diag"


# --------------------------------------------------------------------------- #
# Pose builders
# --------------------------------------------------------------------------- #
def _step_pose(p: MotionParams, phase: float, bob_up: float, *, run: bool, facing_up: bool) -> FramePose:
    # FORWARD (toward / away from camera) walk. The feet alternately LIFT via a
    # knee tuck — almost no sideways thigh splay — so it reads as walking forward,
    # not a sideways waddle. pose 1 lifts the right foot, pose 3 lifts the left.
    liftR = max(0.0, phase)
    liftL = max(0.0, -phase)
    thighR = 4.0 * liftR  # a touch of knee-rise on the stepping leg
    thighL = 4.0 * liftL
    shinR = -liftR * p.knee_bend * 1.6  # tuck the lifting foot up
    shinL = -liftL * p.knee_bend * 1.6
    armR = -phase * p.arm_swing * 0.4  # gentle counter-swing
    armL = phase * p.arm_swing * 0.4
    angles = {
        "torso": phase * p.torso_twist * 0.5,
        "head": 0.0,
        "thighR": thighR, "thighL": thighL,
        "shinR": shinR, "shinL": shinL,
        "armR": armR, "armL": armL,
        "forearmR": -phase * p.forearm * 0.35, "forearmL": phase * p.forearm * 0.35,
    }
    dy = -bob_up * p.bob + (p.crouch if run else 0)
    z = [
        "thighL", "shinL", "thighR", "shinR",
        "torso", "upperArmL", "lowerArmL", "upperArmR", "lowerArmR", "head",
    ]
    if facing_up:  # arms behind the back read better tucked under torso
        z = ["upperArmL", "lowerArmL", "upperArmR", "lowerArmR",
             "thighL", "shinL", "thighR", "shinR", "torso", "head"]
    return FramePose(angles=angles, root=(0.0, dy), zorder=z)


def _stride_pose(p: MotionParams, phase: float, bob_up: float, *, run: bool) -> FramePose:
    sgn = 1.0  # right-facing; left is produced by mirroring the whole frame
    swing = phase * p.leg_swing * SIDE_LEG_FACTOR
    thighR = sgn * swing  # near leg
    thighL = -sgn * swing  # far leg
    # the rearward leg bends at the knee as it lifts off
    shinR = -max(0.0, -phase) * p.knee_bend * 1.3
    shinL = -max(0.0, phase) * p.knee_bend * 1.3
    armSwing = phase * p.arm_swing * SIDE_ARM_FACTOR
    torso_lean = p.lean * 0.45 + (p.lean * 0.3 if run else 0)
    angles = {
        "torso": torso_lean,
        "head": -torso_lean * 0.7,  # counter the lean so the head stays level
        "thighR": thighR, "thighL": thighL,
        "shinR": shinR, "shinL": shinL,
        "armR": -armSwing, "armL": armSwing,
        "forearmR": -armSwing * 0.5 * (p.forearm > 0), "forearmL": armSwing * 0.5 * (p.forearm > 0),
    }
    dy = -bob_up * p.bob + (p.crouch if run else 0)
    # whichever leg is forward (phase>0 -> near/right fwd) reads in front
    near_front = phase >= 0
    if near_front:
        z = ["upperArmL", "lowerArmL", "thighL", "shinL", "torso", "head",
             "thighR", "shinR", "upperArmR", "lowerArmR"]
    else:
        z = ["upperArmL", "lowerArmL", "thighR", "shinR", "torso", "head",
             "thighL", "shinL", "upperArmR", "lowerArmR"]
    return FramePose(angles=angles, root=(0.0, dy), zorder=z)


def _diag_pose(p: MotionParams, phase: float, bob_up: float, *, run: bool, facing_up: bool) -> FramePose:
    # 3/4 view: a HALF-stride — legs swing fore/aft in-plane (less than a full
    # profile) plus a knee tuck on the rear leg and a slight lean into the walk.
    swing = phase * p.leg_swing * DIAG_FACTOR
    thighR = swing
    thighL = -swing
    shinR = -max(0.0, -phase) * p.knee_bend
    shinL = -max(0.0, phase) * p.knee_bend
    armSwing = phase * p.arm_swing
    lean = (p.lean * 0.35) * (-1 if facing_up else 1)
    angles = {
        "torso": lean + phase * p.torso_twist * 0.4,
        "head": -lean * 0.5,
        "thighR": thighR, "thighL": thighL,
        "shinR": shinR, "shinL": shinL,
        "armR": -armSwing, "armL": armSwing,
        "forearmR": -armSwing * 0.5 * (p.forearm > 0), "forearmL": armSwing * 0.5 * (p.forearm > 0),
    }
    dy = -bob_up * p.bob + (p.crouch if run else 0)
    near_front = phase >= 0
    if near_front:
        z = ["thighL", "shinL", "upperArmL", "lowerArmL", "torso", "head",
             "thighR", "shinR", "upperArmR", "lowerArmR"]
    else:
        z = ["thighR", "shinR", "upperArmL", "lowerArmL", "torso", "head",
             "thighL", "shinL", "upperArmR", "lowerArmR"]
    if facing_up:
        z = ["upperArmL", "lowerArmL", "upperArmR", "lowerArmR"] + z[:6]
    return FramePose(angles=angles, root=(0.0, dy), zorder=z)


def frame_pose(facing: str, motion: str, pose: int, params: MotionParams) -> FramePose:
    """The FramePose for one cell of the sheet contract."""
    model = model_for(facing)
    run = motion == "run"
    phase = WALK_PHASE[pose]
    bob_up = WALK_BOB[pose]
    facing_up = facing in ("up", "upright", "upleft")
    if model == "step":
        return _step_pose(params, phase, bob_up, run=run, facing_up=facing_up)
    if model == "side":
        return _stride_pose(params, phase, bob_up, run=run)
    return _diag_pose(params, phase, bob_up, run=run, facing_up=facing_up)


def idle_pose(variant: str, params: MotionParams) -> FramePose:
    """Down-facing idle: breath = a gentle 1px upper-body rise; blink = rest."""
    if variant == "breath":
        return FramePose(angles={"torso": 0.0, "head": 0.0}, root=(0.0, -1.0),
                         zorder=None)
    return FramePose(angles={}, root=(0.0, 0.0), zorder=None)
