import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { Builder } from '../geometry/primitives'
import type { Materials } from '../materials/library'

function plant(x:number,z:number,m:Materials,height=1.7) {
  const b=new Builder();b.add(new T.CylinderGeometry(.29,.22,.46,24),m.planter,[x,.23,z])
  for(let i=0;i<11;i++){
    const angle=i*2.399, h=height*(.5+.5*((i%4)/3)),dx=Math.cos(angle),dz=Math.sin(angle)
    b.rod([x,.4,z],[x+dx*.32,h,z+dz*.32],.014,m.leaf)
    const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.2,.25,-.23,.58,0,.9);shape.bezierCurveTo(.23,.58,.2,.25,0,0)
    const geo=new T.ShapeGeometry(shape,8);const a=geo.attributes.position
    for(let k=0;k<a.count;k++){const y=a.getY(k);a.setZ(k,Math.sin(y*3.5)*.13)}geo.computeVertexNormals()
    b.add(geo,i%3?m.leaf:m.leafLight,[x+dx*.32,h,z+dz*.32],[-.8,angle,.2])
  }
  return b.finish('Tropical planter')
}
function chair(m:Materials) {
  const b=new Builder()
  b.add(new RoundedBoxGeometry(.48,.07,.48,3,.035),m.wood,[0,.47,0])
  b.add(new RoundedBoxGeometry(.43,.065,.43,3,.03),m.ceramic,[0,.53,0])
  for(const x of [-.2,.2]) for(const z of [-.2,.2]) b.rod([x,.04,z*1.15],[x,.47,z],.024,m.wood)
  for(const x of [-.24,.24]) {b.rod([x,.46,.21],[x,.96,.23],.025,m.wood);b.rod([x,.64,.2],[x,.64,-.21],.022,m.wood)}
  const arc=new T.TorusGeometry(.235,.025,8,24,Math.PI);b.add(arc,m.wood,[0,.89,.23])
  b.box([.42,.36,.024],[0,.8,.23],m.cane)
  b.rod([-.2,.2,-.2],[.2,.2,-.2],.016,m.wood)
  b.rod([-.24,.59,.23],[.24,.59,.23],.025,m.wood)
  return b.finish('Cane armchair')
}
function pendant(x:number,z:number,m:Materials) {
  const b=new Builder();b.rod([x,3.75,z],[x,3.15,z],.012,m.metal)
  for(const y of [2.48,2.54,3.05,3.1])b.add(new T.TorusGeometry(.39,.012,6,48),m.wood,[x,y,z],[Math.PI/2,0,0])
  for(let j=0;j<48;j++){const a=j/48*Math.PI*2;b.rod([x+Math.cos(a)*.39,2.5,z+Math.sin(a)*.39],[x+Math.cos(a)*.39,3.08,z+Math.sin(a)*.39],.007,m.cane)}
  for(let j=0;j<15;j++)b.add(new T.TorusGeometry(.388,.004,4,48),m.cane,[x,2.5+j*.04,z],[Math.PI/2,0,0])
  b.add(new T.SphereGeometry(.07,12,8),m.glow,[x,2.75,z]);return b.finish('Woven cylindrical pendant')
}
export function buildExterior(m:Materials) {
  const b=new Builder()
  b.box([22,.16,36],[0,-.12,-5],m.stone)
  // Raised café-level arrival deck; access from street is outside this interpretation.
  for(let i=0;i<58;i++)b.box([.235,1,.16],[-7+i*.245,3.8,0],m.darkWood)
  for(const x of [-7,-4.6,-2.3,2.3,4.6,7]){
    b.box([.15,3.3,.18],[x,1.65,0],m.metal)
    if(Math.abs(x)>2.5)b.add(new T.TorusGeometry(1.05,.055,8,32,Math.PI),m.wood,[x+(x<0?1.12:-1.12),2.18,-.1])
  }
  for(const x of [-4.5,4.5]) {
    b.box([5,1,.045],[x,.62,1],m.glass)
    b.box([5,.065,.065],[x,1.15,1],m.metal)
    for(let a=-2;a<=2;a++)b.box([.035,1.15,.045],[x+a,.58,1],m.metal)
  }
  b.box([14,.12,.5],[0,3.25,.1],m.wood)
  for(let x=-6;x<=6;x+=2) {
    b.add(new T.SphereGeometry(.035,8,6),m.glow,[x,3.17,.2])
    const g=new T.PlaneGeometry(1.9,3.2,12,16),p=g.attributes.position
    for(let i=0;i<p.count;i++)p.setZ(i,-.3*Math.sin((p.getY(i)+1.6)/3.2*Math.PI));g.computeVertexNormals()
    b.add(g,m.fabric,[x,4.65,1],[-Math.PI/2,0,0])
    b.box([.06,.08,3.5],[x-1,4.65,1],m.metal)
  }
  const root=b.finish('Arrival facade and canopy')
  for(const x of [-6,-4,-2,2,4,6]){root.add(plant(x,.7,m,1.35));const vine=plant(x,-.1,m,1);vine.position.y=3.85;vine.scale.set(.8,.55,.8);root.add(vine)}
  return root
}
export function buildInterior(m:Materials) {
  const b=new Builder()
  b.box([.2,.35,19],[-7,.175,-9.5],m.wall);b.box([.2,.35,19],[-7,3.65,-9.5],m.wall);b.box([.2,3.8,19],[7,1.9,-9.5],m.wall);b.box([14,3.8,.2],[0,1.9,-19],m.wall)
  // The entry vestibule is inferred; jambs and beams physically frame the path.
  for(const z of [2,-.5]){for(const x of [-1.7,1.7])b.box([.16,3.15,.16],[x,1.575,z],m.darkWood);b.box([3.55,.18,.18],[0,3.15,z],m.darkWood)}
  // Open central corridor x=-1.15..1.15; all furnishings remain outside it.
  for(let z=-1;z>-19;z-=1.2)for(let x=-6.4;x<7;x+=1.2)b.box([1.185,.025,1.185],[x,.005,z],m.stone)
  for(let z=-2;z>=-18;z-=4){
    b.box([14,.18,.14],[0,3.65,z],m.metal)
    for(const x of [-4.5,4.5]) b.box([.23,3.6,.23],[x,1.8,z],m.wood)
  }
  for(let x=-6;x<=6;x+=2){b.box([.13,.25,19],[x,3.65,-9.5],m.metal);b.box([1.9,.045,19],[x+.95,3.82,-9.5],m.metal)}
  for(let z=-2;z>-19;z-=4)for(let x=-6;x<7;x+=2){
    const panel=new T.PlaneGeometry(1.85,3.8,16,1),v=panel.attributes.position
    for(let i=0;i<v.count;i++)v.setZ(i,.16*Math.cos(v.getX(i)*1.65));panel.computeVertexNormals();b.add(panel,m.ceiling,[x+.95,3.67,z-1.8],[Math.PI/2,0,0])
  }
  for(let z=-1;z>=-18;z-=2){b.box([.07,3.1,.07],[-6.8,1.65,z],m.metal);b.box([.035,2.8,1.9],[-6.82,1.65,z-.95],m.glass);b.box([.07,.05,2],[-6.8,1,z-.95],m.metal);b.add(new T.TorusGeometry(.94,.035,6,24,Math.PI),m.metal,[-6.8,2.25,z-.95],[0,Math.PI/2,0])}
  for(const z of [-2,-6,-10,-14])for(const x of [-3,3]){
    b.add(new RoundedBoxGeometry(1.1,.09,2.6,3,.035),m.wood,[x,.77,z])
    for(const end of [-.9,.9]){b.rod([x-.45,.04,z+end],[x+.45,.73,z+end],.045,m.metal);b.rod([x+.45,.04,z+end],[x-.45,.73,z+end],.045,m.metal)}
    b.add(new T.CylinderGeometry(.1,.08,.15,20),m.ceramic,[x,.89,z]);b.add(new T.SphereGeometry(.045,10,8),m.glow,[x,1,z])
  }
  const root=b.finish('Main dining structure and tables'),chairModel=chair(m)
  for(const z of [-2,-6,-10,-14])for(const x of [-3,3]){
    for(const side of [-1,1])for(const offset of [-.75,.75]){const c=chairModel.clone();c.position.set(x+side*.95,0,z+offset);c.rotation.y=side===1?Math.PI/2:-Math.PI/2;root.add(c)}
    root.add(pendant(x,z,m))
  }
  for(const z of [-3,-8,-13,-18])for(const x of [-6.1,6.1])root.add(plant(x,z,m,1.65))
  for(const z of [-1,-4,-7,-10,-13,-16])root.add(plant(-8,z,m,2.3))
  return root
}
