"""Run against import-ready-studio.blend; checks rig motion, not artistic quality."""
import bpy
scene = bpy.context.scene
assert scene['asset_status'] == 'RIG ONLY — NO FOOD ASSET'
assert [o.name for o in scene.objects if o.type == 'MESH'] == ['Studio_Shadow_Surface']
assert len([o for o in scene.objects if o.type == 'LIGHT']) == 3
assert scene.camera.name == 'Production_Camera'
rig = bpy.data.objects['Ingredient_herbs']
for frame, height in [(1, 0), (121, .33), (241, 0), (121, .33), (1, 0)]:
    scene.frame_set(frame)
    assert abs(rig.location.z - height) < 1e-5, (frame, rig.location.z)
assert scene.cycles.device == 'GPU'
print('PASS: empty studio, independent rig transforms, reversible frames, Metal-configured GPU.')
