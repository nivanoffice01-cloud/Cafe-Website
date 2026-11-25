import * as T from 'three'
import { cameraPositions,cameraTargets } from '../config/layout'
const positions=new T.CatmullRomCurve3(cameraPositions.map(p=>new T.Vector3(...p)),false,'centripetal')
const targets=new T.CatmullRomCurve3(cameraTargets.map(p=>new T.Vector3(...p)),false,'centripetal')
export function directCamera(camera:T.PerspectiveCamera,progress:number,mobile:boolean) {
  const p=T.MathUtils.clamp(progress,0,1)
  camera.position.copy(positions.getPoint(p));if(mobile)camera.position.z+=(1-p)*2.5
  camera.lookAt(targets.getPoint(p));camera.updateMatrixWorld()
}
