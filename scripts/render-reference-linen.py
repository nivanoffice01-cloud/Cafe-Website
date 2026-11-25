"""Original decorative cloth study. No reference-site assets or food geometry."""
import bpy, math
from pathlib import Path
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
n=180
verts=[]
for j in range(n+1):
 for i in range(n+1):
  x=i/n*4-2; y=j/n*4-2
  z=.045*math.sin(5*x+3*y)+.025*math.sin(12*x-9*y)+.011*math.sin(24*x+15*y)
  z+=.10*math.exp(-((x+.65*y-.4)/.17)**2)+.07*math.exp(-((y-.5*x+.5)/.22)**2)
  verts.append((x,y,z))
faces=[(j*(n+1)+i,j*(n+1)+i+1,(j+1)*(n+1)+i+1,(j+1)*(n+1)+i) for j in range(n) for i in range(n)]
m=bpy.data.meshes.new('Original cloth folds');m.from_pydata(verts,[],faces);m.update()
o=bpy.data.objects.new('Decorative linen',m);bpy.context.collection.objects.link(o)
for p in m.polygons:p.use_smooth=True
mat=bpy.data.materials.new('Graphite linen');mat.use_nodes=True;nodes=mat.node_tree.nodes;links=mat.node_tree.links
bs=nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.025,.032,.031,1);bs.inputs['Roughness'].default_value=.93
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=360;noise.inputs['Detail'].default_value=2
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.7;bump.inputs['Distance'].default_value=.018
links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal']);o.data.materials.append(mat)
ld=bpy.data.lights.new('Softbox','AREA');ld.energy=140;ld.size=.75;l=bpy.data.objects.new('Softbox',ld);bpy.context.collection.objects.link(l);l.location=(-1.5,1,2)
bpy.ops.object.camera_add(location=(0,0,5));camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=3.9
scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
scene.cycles.device='GPU';scene.world.color=(.07,.07,.07)
scene.render.resolution_x=1440;scene.render.resolution_y=1440;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=88
scene.render.filepath=str(Path('public/reference-experience/linen.jpg').resolve());bpy.ops.render.render(write_still=True)
