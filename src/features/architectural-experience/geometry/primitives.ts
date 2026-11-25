import * as T from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export function batchStatic(group:T.Group) {
  group.updateMatrixWorld(true)
  const batches=new Map<T.Material,T.BufferGeometry[]>(),result=new T.Group();result.name=group.name
  group.traverse(object=>{if(object instanceof T.Mesh&&!Array.isArray(object.material)){
    const list=batches.get(object.material)||[];list.push(object.geometry.clone().applyMatrix4(object.matrixWorld));batches.set(object.material,list)
  }})
  for(const [material,list] of batches){const mesh=new T.Mesh(mergeGeometries(list.map(g=>g.index?g.toNonIndexed():g)),material);mesh.castShadow=mesh.receiveShadow=true;mesh.name=material.name||'Static architectural material batch';result.add(mesh);list.forEach(g=>g.dispose())}
  const old=new Set<T.BufferGeometry>();group.traverse(o=>{if(o instanceof T.Mesh)old.add(o.geometry)});old.forEach(g=>g.dispose())
  return result
}

// Batch repeated components by material while retaining named modular groups.
export class Builder {
  private batches = new Map<T.Material,T.BufferGeometry[]>()
  add(geometry:T.BufferGeometry, material:T.Material, position:number[], rotation:number[]=[0,0,0]) {
    const matrix=new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(1,1,1))
    geometry.applyMatrix4(matrix)
    const list=this.batches.get(material)||[];list.push(geometry);this.batches.set(material,list)
  }
  box(size:number[], p:number[], m:T.Material, r:number[]=[0,0,0]) {this.add(new T.BoxGeometry(...size),m,p,r)}
  rod(a:number[],b:number[],radius:number,m:T.Material) {
    const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av)
    const g=new T.CylinderGeometry(radius,radius,delta.length(),8)
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray())
    const list=this.batches.get(m)||[];list.push(g);this.batches.set(m,list)
  }
  finish(name:string) {
    const group=new T.Group();group.name=name
    for(const [material,list] of this.batches){const g=mergeGeometries(list.map(x=>x.toNonIndexed()));const mesh=new T.Mesh(g,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);list.forEach(x=>x.dispose())}
    return group
  }
}
