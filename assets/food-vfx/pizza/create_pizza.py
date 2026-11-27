"""UNAPPROVED qualification study. Failed the advertising-quality gate.

Original Blender food concept, not a scan or verified Mangosteen dish.
Do not integrate this geometry as the finished /food-vfx-lab asset.
"""
import bpy, math, random
from pathlib import Path
from mathutils import Vector, noise
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/food-vfx-lab';OUT.mkdir(parents=True,exist_ok=True)
random.seed(410)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES'
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
scene.cycles.device='GPU';scene.cycles.samples=64;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.045,.025,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22
food=bpy.data.collections.new('Pizza — independent ingredient meshes');scene.collection.children.link(food)

def colour(h):
    values=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in values)+(1,)

def material(name,colours,roughness=.45,sss=0,scale=7,bump=.00015):
    m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF')
    bs.inputs['Roughness'].default_value=roughness;bs.inputs['Subsurface Weight'].default_value=sss
    bs.inputs['Subsurface Radius'].default_value=(1,.5,.25);bs.inputs['Subsurface Scale'].default_value=.002
    coords=n.new('ShaderNodeTexCoord')
    tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale*12;tex.inputs['Detail'].default_value=4;tex.inputs['Roughness'].default_value=.72
    l.new(coords.outputs['Object'],tex.inputs['Vector'])
    ramp=n.new('ShaderNodeValToRGB')
    for i,(p,value) in enumerate(colours):
        e=ramp.color_ramp.elements[i] if i<2 else ramp.color_ramp.elements.new(p);e.position=p;e.color=colour(value)
    l.new(tex.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs['Color'],bs.inputs['Base Color'])
    fine=n.new('ShaderNodeTexNoise');fine.inputs['Scale'].default_value=3200;fine.inputs['Detail'].default_value=3
    l.new(coords.outputs['Object'],fine.inputs['Vector'])
    relief=n.new('ShaderNodeBump');relief.inputs['Strength'].default_value=.32;relief.inputs['Distance'].default_value=bump
    l.new(fine.outputs['Fac'],relief.inputs['Height']);l.new(relief.outputs[0],bs.inputs['Normal']);return m

crust=material('Dough | baked blisters',[(.2,'21120a'),(.34,'5f2c10'),(.45,'b76b2b'),(.58,'dfad69'),(.74,'f4d9a2')],.63,.09,10,.00024)
sauce=material('Sauce | tomato pulp',[(.18,'59150b'),(.4,'942315'),(.66,'c84321'),(.88,'de682b')],.34,.06,18,.00018)
cheese=material('Mozzarella | browned milk curd',[(.24,'f9edbd'),(.5,'f4e2a9'),(.58,'e4c273'),(.66,'a6571c'),(.72,'57250c')],.33,.1,8,.00007)
tomato=material('Tomato | roasted flesh',[(.2,'81220e'),(.45,'c23915'),(.72,'ed652a')],.29,.18,6,.00005)
pepper=material('Pepper | blistered skin',[(.2,'17290a'),(.45,'395a15'),(.7,'809237')],.3,.06,9,.00005)
olive=material('Olive | wrinkled skin',[(.2,'15150c'),(.5,'30351a'),(.8,'575331')],.32,.01,14,.00007)
basil=material('Basil | leaf tissue',[(.15,'18390c'),(.45,'3c751d'),(.78,'84a544')],.44,.09,9,.000045)
vein=material('Basil | raised veins',[(.2,'37621a'),(.8,'74983c')],.5,.08,12,.00002)
seedmat=material('Tomato | seeds',[(.2,'c19538'),(.8,'e7cf78')],.35,.1,5,.00002)

def mesh(name,vertices,faces,mat,uv=None):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);food.objects.link(obj);data.materials.append(mat)
    for poly in data.polygons:poly.use_smooth=True
    layer=data.uv_layers.new(name='SurfaceUV')
    for poly in data.polygons:
        for index in poly.loop_indices:
            vertex=data.loops[index].vertex_index;layer.data[index].uv=uv[vertex] if uv else (vertices[vertex][0]/.34+.5,vertices[vertex][1]/.34+.5)
    return obj

def disk(name,radius,base,thickness,mat,rings=30,segments=96,rim=False,phase=0):
    verts=[(0,0,base+thickness)];uv=[(.5,.5)];faces=[]
    for j in range(1,rings+1):
        t=j/rings
        for i in range(segments):
            a=i*math.tau/segments;edge=1+.017*math.sin(7*a+phase)+.011*math.sin(13*a+1.5)
            if not rim:edge+=.055*math.sin(5*a+phase)
            r=radius*t*edge;x=r*math.cos(a);y=r*math.sin(a);n=noise.noise_vector(Vector((x*115+phase,y*115,3))).z
            if rim:z=base+thickness+.017*math.exp(-((t-.9)/.075)**2)*(1+.12*math.sin(9*a)+.12*n)+.00065*n
            else:z=base+thickness*math.sqrt(max(0,1-t**6))+.0003*n
            verts.append((x,y,z));uv.append((.5+.49*t*math.cos(a),.5+.49*t*math.sin(a)))
    for i in range(segments):faces.append((0,1+i,1+(i+1)%segments))
    for j in range(rings-1):
        start=1+j*segments
        for i in range(segments):faces.append((start+i,start+segments+i,start+segments+(i+1)%segments,start+(i+1)%segments))
    bottom=len(verts);verts.append((0,0,base));uv.append((.5,.5));start=1+(rings-1)*segments
    for i in range(segments):
        x,y,_=verts[start+i];verts.append((x,y,base+.0002*math.sin(i)));uv.append(uv[start+i])
    for i in range(segments):
        faces.append((start+i,bottom+1+i,bottom+1+(i+1)%segments,start+(i+1)%segments));faces.append((bottom,bottom+1+(i+1)%segments,bottom+1+i))
    return mesh(name,verts,faces,mat,uv)

disk('Pizza_Dough',.16,.003,.004,crust,84,256,True)
disk('Pizza_Sauce',.137,.0075,.0015,sauce,40,160,False,1.4)
for i in range(27):
    a=i*2.399;r=.114*math.sqrt(i/27)
    obj=disk(f'Pizza_Mozzarella_{i:02}',random.uniform(.020,.032),0,random.uniform(.002,.004),cheese,20,64,False,i*.81)
    obj.location=(r*math.cos(a),r*math.sin(a),.009);obj.rotation_euler.z=random.random()*math.tau;obj.scale=(1,random.uniform(.65,1),1)

# Fuse touching curds into a genuine melted surface with irregular gaps.
bpy.ops.object.select_all(action='DESELECT')
curds=[o for o in food.objects if 'Mozzarella' in o.name]
for o in curds:o.select_set(True)
bpy.context.view_layer.objects.active=curds[0];bpy.ops.object.join()
molten=bpy.context.object;molten.name='Pizza_Mozzarella_Melted';bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
molten.data.remesh_voxel_size=.00065;bpy.ops.object.voxel_remesh()
smooth=molten.modifiers.new('Curd surface tension','SMOOTH');smooth.factor=1.1;smooth.iterations=4
bpy.ops.object.modifier_apply(modifier=smooth.name)
for polygon in molten.data.polygons:polygon.use_smooth=True
molten.select_set(False)

def curve(name,points,radius,mat):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=12;data.bevel_depth=radius;data.bevel_resolution=3
    spline=data.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points):p.co=co;p.handle_left_type=p.handle_right_type='AUTO'
    obj=bpy.data.objects.new(name,data);food.objects.link(obj);data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj.select_set(False);return obj

for i in range(11):
    a=i*2.399+.8;r=.105*math.sqrt((i+.5)/11);cx=r*math.cos(a);cy=r*math.sin(a)
    obj=disk(f'Pizza_Vegetable_Tomato_{i:02}',random.uniform(.012,.019),0,.0022,tomato,16,64,False,i)
    obj.location=(cx,cy,.014);obj.rotation_euler=(random.uniform(-.12,.12),random.uniform(-.12,.12),a)
    for j in range(3):
        ang=j*math.tau/3;seed=disk(f'Pizza_Vegetable_TomatoSeed_{i:02}_{j}',.0011,0,.0003,seedmat,4,12)
        seed.location=(cx+math.cos(ang)*.006,cy+math.sin(ang)*.006,.0165);seed.scale.y=.55
for i in range(12):
    a=i*2.399;r=.112*math.sqrt((i+.3)/12);cx=r*math.cos(a);cy=r*math.sin(a);points=[]
    for j in range(13):
        t=j/12;angle=(t*1.55-.2)*math.pi;points.append((cx+math.cos(angle+a)*.015,cy+math.sin(angle+a)*.010,.015+math.sin(t*math.pi)*.002))
    curve(f'Pizza_Vegetable_Pepper_{i:02}',points,.0015,pepper)
for i in range(16):
    a=i*2.399+.4;r=.116*math.sqrt((i+.5)/16);vertices=[];faces=[];uv=[]
    for j in range(48):
        t=j*math.tau/48
        for k in range(16):
            p=k*math.tau/16;rr=.004+.0015*math.cos(p)+.0002*math.sin(t*7)
            vertices.append((rr*math.cos(t),rr*math.sin(t)*.83,.0017*math.sin(p)+.0001*math.cos(t*11)));uv.append((j/48,k/16))
    for j in range(48):
        for k in range(16):faces.append((j*16+k,((j+1)%48)*16+k,((j+1)%48)*16+(k+1)%16,j*16+(k+1)%16))
    obj=mesh(f'Pizza_Vegetable_Olive_{i:02}',vertices,faces,olive,uv);obj.location=(r*math.cos(a),r*math.sin(a),.016);obj.rotation_euler=(.2,random.uniform(-.3,.3),a)
for i in range(8):
    a=i*2.399;r=.103*math.sqrt(i/8);length=random.uniform(.025,.035);vertices=[];faces=[];uv=[]
    for j in range(33):
        t=j/32;width=length*.31*math.sin(math.pi*t)**.8
        for k in range(17):
            u=k/8-1;z=.003*math.sin(t*math.pi)+.0009*abs(u)+.00025*math.sin(t*math.pi*16)*abs(u)
            vertices.append((width*u,t*length,z));uv.append(((u+1)/2,t))
    for j in range(32):
        for k in range(16):n=j*17+k;faces.append((n,n+1,n+18,n+17))
    obj=mesh(f'Pizza_Herb_Basil_{i:02}',vertices,faces,basil,uv);obj.location=(r*math.cos(a),r*math.sin(a),.02);obj.rotation_euler=(.1,-.1,a)
    obj.modifiers.new('Leaf tissue thickness','SOLIDIFY').thickness=.00012
    center=curve(f'Pizza_Herb_Vein_{i:02}',[(0,t*length,.003*math.sin(t*math.pi)+.00012) for t in [0,.2,.4,.6,.8,1]],.00009,vein)
    center.location=obj.location;center.rotation_euler=obj.rotation_euler
    for j in range(1,8):
        t=j/9
        for side in [-1,1]:
            v=curve(f'Pizza_Herb_Vein_{i:02}_{j}_{side}',[(0,t*length,.003*math.sin(t*math.pi)+.0001),(side*.22*length*math.sin(t*math.pi),(t+.11)*length,.003*math.sin((t+.11)*math.pi)+.0007)],.000045,vein)
            v.location=obj.location;v.rotation_euler=obj.rotation_euler
for obj in food.objects:
    origin=obj.location.copy();obj['ingredient']=obj.name.split('_')[1];obj['assembled_position']=list(origin)
    amount=0 if 'Dough' in obj.name else .045 if 'Sauce' in obj.name else .09 if 'Mozzarella' in obj.name else .19 if 'Herb' in obj.name else .14
    obj['explode_height']=amount;obj.keyframe_insert(data_path='location',frame=1);obj.location.z+=amount;obj.keyframe_insert(data_path='location',frame=100);obj.location=origin;obj.keyframe_insert(data_path='location',frame=200)
scene.frame_end=200;scene.frame_set(1)
ground=material('Studio | deep forest',[(.2,'0b160e'),(.8,'0b160e')],.6,0,1,0)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.001));bpy.context.object.name='Studio backdrop';bpy.context.object.data.materials.append(ground)
def area(name,position,power,size,tint):
    data=bpy.data.lights.new(name,'AREA');data.energy=power*.125;data.shape='DISK';data.size=size;data.color=tint
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=position;obj.rotation_euler=(-obj.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(-.25,-.18,.45),28,.35,(1,.89,.74));area('Cool fill',(.3,-.05,.25),8,.28,(.82,.91,1));area('Rim softbox',(.05,.3,.25),35,.22,(1,.83,.61))
bpy.ops.object.camera_add(location=(.28,-.37,.38));camera=bpy.context.object;camera.name='Pizza advertising camera';scene.camera=camera
camera.rotation_euler=(Vector((0,0,.014))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=48
camera.data.dof.use_dof=True;camera.data.dof.focus_distance=(camera.location-Vector((0,0,.014))).length;camera.data.dof.aperture_fstop=8
bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).with_name('pizza-study-unapproved.blend')))
scene.render.filepath=str(OUT/'qualification-assembled.png');bpy.ops.render.render(write_still=True)
print('QUALIFICATION_RENDER_COMPLETE',flush=True)
