"""Headless Blender: source format -> .glb.

Called by tools/convert.mjs. Not meant to be run by hand.

    blender -b --factory-startup --python tools/blender_export.py -- \
        --in assets/source/car.fbx --out assets/models/car.glb [--scale 0.01]

It is written defensively about operator names and export flags because Blender
renames both between majors, and a converter that dies on a rename is a converter
nobody runs twice.
"""

import sys
import os

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


src = arg("--in")
dst = arg("--out")
scale = float(arg("--scale", "1") or 1)
draco = "--no-draco" not in argv

if not src or not dst:
    print("blender_export: --in and --out are required")
    sys.exit(1)

ext = os.path.splitext(src)[1].lower()


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def call_first(candidates, **kwargs):
    """Runs the first operator that exists, so a rename between majors is survivable."""
    for path in candidates:
        op = bpy.ops
        try:
            for part in path.split("."):
                op = getattr(op, part)
            op(**kwargs)
            return path
        except AttributeError:
            continue
        except TypeError:
            # operator exists but does not take these kwargs — try it bare
            try:
                op(filepath=kwargs.get("filepath"))
                return path
            except Exception:
                continue
    raise RuntimeError("no importer available for " + ext)


if ext == ".blend":
    bpy.ops.wm.open_mainfile(filepath=src)
elif ext == ".fbx":
    clear_scene()
    call_first(["import_scene.fbx", "wm.fbx_import"], filepath=src)
elif ext == ".obj":
    clear_scene()
    call_first(["wm.obj_import", "import_scene.obj"], filepath=src)
elif ext in (".gltf", ".glb"):
    clear_scene()
    call_first(["import_scene.gltf"], filepath=src)
else:
    print("blender_export: unsupported input " + ext)
    sys.exit(1)

# ── scale, if the source was authored in centimetres ───────────────────────
if scale != 1.0:
    for obj in bpy.context.scene.objects:
        if obj.parent is None:
            obj.scale = [s * scale for s in obj.scale]

# ── export, with only the flags this Blender actually has ──────────────────
wanted = {
    "filepath": dst,
    "export_format": "GLB",
    "export_apply": True,            # apply modifiers
    "export_yup": True,
    "export_cameras": False,
    "export_lights": False,
    "export_draco_mesh_compression_enable": draco,
    "export_draco_mesh_compression_level": 6,
    "export_image_format": "AUTO",
    "export_texture_dir": "",
}

props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
kwargs = {k: v for k, v in wanted.items() if k in props or k == "filepath"}
dropped = sorted(set(wanted) - set(kwargs))
if dropped:
    print("blender_export: this Blender has no " + ", ".join(dropped))

os.makedirs(os.path.dirname(dst), exist_ok=True)
bpy.ops.export_scene.gltf(**kwargs)
print("blender_export: wrote " + dst)
