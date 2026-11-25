import * as T from 'three'
export function lightScene(scene:T.Scene,mobile:boolean) {
  scene.background=new T.Color('#344445');scene.fog=new T.Fog('#344445',30,80)
  scene.add(new T.HemisphereLight('#b2c8c9','#494535',1.3))
  const key=new T.DirectionalLight('#ffddad',3);key.position.set(-4,9,8);key.castShadow=true
  key.shadow.mapSize.setScalar(mobile?1024:2048);Object.assign(key.shadow.camera,{left:-15,right:15,top:15,bottom:-24,near:.5,far:50});key.shadow.bias=-.0004;key.shadow.normalBias=.025;scene.add(key)
  for(const z of [-2,-7,-12,-17]) {const l=new T.PointLight('#ffd294',26,11,2);l.position.set(0,2.4,z);scene.add(l)}
  const front=new T.PointLight('#ffce8a',45,16,2);front.position.set(0,4,2);scene.add(front)
}
