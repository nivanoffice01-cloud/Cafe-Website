import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// CC0 Calathea by Rico Cilliers / Rob Tuytel (Poly Haven).
// Shared geometry and texture maps; each plant has an independent transform.
export async function loadBotanicalAssets(planterMaterial:T.Material) {
  const {scene}=await new GLTFLoader().loadAsync('/models/architectural/calathea/calathea_orbifolia_01.gltf')
  scene.updateMatrixWorld(true)
  const placements=[[-6,.7,1],[-4,.7,1.1],[-2,.7,.9],[2,.7,1.05],[4,.7,.95],[6,.7,1.1],[-1.3,1.5,.95],[1.3,1.5,1.1],[-1.3,-1.5,.9],[1.3,-1.5,1.05]]
  const root=new T.Group();root.name='Instanced Calathea — CC0 botanical model'
  let variant=0
  scene.traverse(object=>{
    if(!(object instanceof T.Mesh))return
    // The source contains five separate plants laid out for inspection.
    // Use their local root coordinates, never the source display arrangement.
    const geometry=object.geometry.clone();geometry.computeBoundingBox()
    const bounds=geometry.boundingBox!,size=bounds.getSize(new T.Vector3())
    geometry.translate(0,-bounds.min.y,0)
    const selected=placements.filter((_,i)=>i%5===variant);variant++
    const mesh=new T.InstancedMesh(geometry,object.material,selected.length)
    selected.forEach(([x,z,height],i)=>{
      const scale=height/size.y
      mesh.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(x,.38,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),i*2.399),new T.Vector3(scale,scale,scale)))
    })
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;root.add(mesh)
    object.geometry.dispose()
  })
  const pots=new T.InstancedMesh(new T.CylinderGeometry(.28,.21,.42,32),planterMaterial,placements.length)
  placements.forEach(([x,z],i)=>pots.setMatrixAt(i,new T.Matrix4().makeTranslation(x,.21,z)))
  pots.castShadow=pots.receiveShadow=true;pots.instanceMatrix.needsUpdate=true;root.add(pots)
  return root
}
