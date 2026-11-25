import * as T from 'three'
export function lightScene(scene:T.Scene,mobile:boolean) {
  scene.background=new T.Color('#111d20');scene.fog=new T.Fog('#111d20',30,80)
  scene.add(new T.HemisphereLight('#b2c8c9','#494535',.5))
  const key=new T.DirectionalLight('#ffdfb2',1.6);key.position.set(-4,9,8);key.castShadow=true
  key.shadow.mapSize.setScalar(mobile?1024:2048);Object.assign(key.shadow.camera,{left:-15,right:15,top:15,bottom:-24,near:.5,far:50});key.shadow.bias=-.0004;key.shadow.normalBias=.025;scene.add(key)
  for(const z of [-6,-10,-14])for(const x of [-3,3]){
    if(z===-6&&!mobile){
      const l=new T.SpotLight('#ffdeb0',22,8,Math.PI/2.8,.65,2);l.position.set(x,2.45,z);l.target.position.set(x,0,z)
      l.castShadow=true;l.shadow.mapSize.set(512,512);l.shadow.bias=-.0001;l.shadow.normalBias=.015;scene.add(l,l.target)
    }else{const l=new T.PointLight('#ffdeb0',12,7,2);l.position.set(x,2.45,z);scene.add(l)}
  }
  for(const z of [1,-2]){const l=new T.PointLight('#ffe0b0',7,5,2);l.position.set(0,2.7,z);scene.add(l)}
  const front=new T.PointLight('#ffce8a',12,12,2);front.position.set(0,4.3,2);scene.add(front)
}
