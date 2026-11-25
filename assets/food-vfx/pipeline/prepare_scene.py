"""Asset-independent studio. No procedural food and no public-site changes.

Blender --background --factory-startup --python prepare_scene.py -- --output studio.blend
Add --config approved.json to import licensed food; --rig-only prepares the empty rig.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--config', type=Path, default=Path(__file__).with_name('production.json'))
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--rig-only', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
config = json.loads(args.config.read_text())
required = {'dough', 'sauce', 'mozzarella', 'vegetables', 'herbs'}
if set(config['roles']) != required or config['frames'] < 2 or config['fps'] <= 0:
    raise ValueError('Provide five ingredient roles and a positive timeline.')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'CYCLES'
scene.cycles.samples = config['samples']
scene.cycles.use_denoising = True
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type == 'METAL'
scene.cycles.device = 'GPU' if any(d.type == 'METAL' for d in prefs.devices) else 'CPU'
scene.render.resolution_x, scene.render.resolution_y = config['resolution']
scene.render.resolution_percentage = 100
scene.render.fps = config['fps']
scene.frame_end = config['frames']
scene.view_settings.view_transform = 'AgX'
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.008, 0.016, 0.007, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.2

def empty(name):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    return obj

def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()

def light(name, position, watts, size, color):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.shape, data.size, data.color = watts, 'DISK', size, color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    aim(obj, (0, 0, 0.10))

# Stage dimensions assume a roughly 32 cm pizza, assembled at Z=0.
# These are studio geometry, never substitute food meshes.
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.025))
floor = bpy.context.object
floor.name = 'Studio_Shadow_Surface'
material = bpy.data.materials.new('Studio_Forest_Green')
material.use_nodes = True
bsdf = material.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.006, 0.014, 0.005, 1)
bsdf.inputs['Roughness'].default_value = 0.75
floor.data.materials.append(material)
light('Key_Softbox', (-0.5, -0.4, 0.85), 65, 0.65, (1, 0.84, 0.65))
light('Fill_Softbox', (0.6, -0.1, 0.5), 18, 0.8, (0.78, 0.88, 1))
light('Rim_Softbox', (0.15, 0.5, 0.7), 85, 0.45, (1, 0.73, 0.43))

imported = []
if not args.rig_only:
    if not config.get('asset') or not config.get('licenseEvidence'):
        raise ValueError('Approved asset path and licence evidence required. Use --rig-only for preparation.')
    source = (args.config.parent / config['asset']).resolve()
    evidence = (args.config.parent / config['licenseEvidence']).resolve()
    if not source.is_file() or not evidence.is_file():
        raise ValueError('Asset and licence evidence must exist locally.')
    before = set(bpy.data.objects)
    if source.suffix.lower() == '.blend':
        with bpy.data.libraries.load(str(source), link=False) as (src, dst):
            dst.objects = src.objects
        for obj in dst.objects:
            if obj is not None:
                scene.collection.objects.link(obj)
    elif source.suffix.lower() in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=str(source))
    elif source.suffix.lower() == '.fbx':
        bpy.ops.import_scene.fbx(filepath=str(source))
    else:
        raise ValueError('Use .blend, .glb, .gltf or .fbx; preserve vendor material sources.')
    imported = list(set(bpy.data.objects) - before)
    mapped = [name for role in config['roles'].values() for name in role['objects']]
    if len(mapped) != len(set(mapped)):
        raise ValueError('An ingredient object cannot belong to multiple roles.')
    by_name = {obj.name: obj for obj in imported}
    for role, settings in config['roles'].items():
        if not settings['objects']:
            raise ValueError(f'Missing independently selectable meshes: {role}')
        for name in settings['objects']:
            obj = by_name.get(name)
            if obj is None or obj.type != 'MESH' or not obj.data.uv_layers or not obj.data.materials:
                raise ValueError(f'{name}: requires imported mesh, UVs and materials.')
            if obj.animation_data or obj.constraints:
                raise ValueError(f'{name}: bake vendor animation/constraints before binding.')
    unmapped = [o.name for o in imported if o.type == 'MESH' and o.name not in mapped]
    if unmapped:
        raise ValueError(f'Remove props or explicitly map all food meshes before import: {unmapped}')
    # No shader replacement: native textures/shaders stay intact for qualification.
    for obj in imported:
        if obj.type in ('LIGHT', 'CAMERA'):
            obj.hide_render = True
    for image in bpy.data.images:
        if image.source == 'FILE' and not image.packed_file and not Path(bpy.path.abspath(image.filepath)).is_file():
            raise ValueError(f'Missing vendor texture: {image.filepath}')

rigs = {}
for role, settings in config['roles'].items():
    rig = rigs[role] = empty('Ingredient_' + role)
    for name in settings['objects'] if not args.rig_only else []:
        obj = bpy.data.objects[name]
        world = obj.matrix_world.copy()
        obj.parent = rig
        obj.matrix_world = world

camera_data = bpy.data.cameras.new('Production_Camera')
camera = bpy.data.objects.new('Production_Camera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.lens = 48
focus = empty('Focus_Target')
camera_data.dof.use_dof = True
camera_data.dof.focus_object = focus
camera_data.dof.aperture_fstop = 8

def smooth(value):
    v = max(0, min(1, value))
    return v * v * (3 - 2 * v)

# Assembled -> exploded -> assembled. Sampled frames avoid interpolation overshoot.
for frame in range(1, config['frames'] + 1):
    progress = (frame - 1) / (config['frames'] - 1)
    lift = smooth(progress / 0.4) * (1 - smooth((progress - 0.6) / 0.4))
    for role, rig in rigs.items():
        settings = config['roles'][role]
        rig.location = Vector(settings['offset']) * lift
        rig.rotation_euler.z = settings['twist'] * lift
        rig.keyframe_insert('location', frame=frame)
        rig.keyframe_insert('rotation_euler', frame=frame)
    angle = math.radians(-18 + 36 * smooth(progress))
    camera.location = (0.72 * math.sin(angle), -0.72 * math.cos(angle), 0.48 + 0.10 * lift)
    focus.location = (0, 0, 0.02 + 0.15 * lift)
    aim(camera, focus.location)
    for obj in (camera, focus):
        obj.keyframe_insert('location', frame=frame)
    camera.keyframe_insert('rotation_euler', frame=frame)

scene['asset_status'] = 'RIG ONLY — NO FOOD ASSET' if args.rig_only else 'IMPORTED — VISUAL QUALIFICATION REQUIRED'
scene['scroll_viewports'] = config['scrollViewports']
scene.frame_set(1)
args.output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()))
print(json.dumps({'status': scene['asset_status'], 'device': scene.cycles.device,
                  'imported_objects': len(imported), 'frames': scene.frame_end,
                  'output': str(args.output)}))
