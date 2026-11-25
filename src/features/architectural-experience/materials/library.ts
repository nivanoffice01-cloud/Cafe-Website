import * as T from 'three'

// Local weave studies supplement licensed CC0 scanned wood and stone maps.
function surface(kind: 'wood' | 'stone' | 'weave') {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512
  const c = canvas.getContext('2d')!
  let seed = 71
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  c.fillStyle = kind === 'wood' ? '#86603b' : kind === 'stone' ? '#a5a398' : '#b59a69'; c.fillRect(0,0,512,512)
  for (let i=0;i<9000;i++) {
    const shade=rand(); c.strokeStyle=`rgba(${shade>.5?'235,215,175':'40,28,15'},${rand()*.14})`; c.lineWidth=rand()*2+.3
    const x=rand()*512,y=rand()*512; c.beginPath(); c.moveTo(x,y)
    if(kind==='wood') c.bezierCurveTo(x+rand()*10,y+20,x-6,y+55,x+3,y+140)
    else {c.lineTo(x+rand()*5,y+rand()*5)} c.stroke()
  }
  if(kind==='weave') for(let i=0;i<512;i+=12){c.fillStyle='#655334';c.fillRect(i,0,3,512);c.fillRect(0,i,512,3);c.fillStyle='#d1b681';c.fillRect(i+4,0,2,512)}
  const map = new T.CanvasTexture(canvas); map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4
  return map
}
export function createMaterials(onReady:()=>void = ()=>{}) {
  const wood=surface('wood'),stone=surface('stone'),weave=surface('weave')
  const linen=weave.clone();linen.repeat.set(14,20);linen.needsUpdate=true
  const loader=new T.TextureLoader()
  const load=(name:string,color=false)=>{const t=loader.load(`/materials/architectural/${name}.jpg`,onReady,undefined,onReady);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;return t}
  const woodColor=load('wood-color',true),woodNormal=load('wood-normal'),woodRoughness=load('wood-roughness')
  const stoneColor=load('stone-color',true),stoneNormal=load('stone-normal'),stoneRoughness=load('stone-roughness')
  return {
    wood:new T.MeshStandardMaterial({map:woodColor,color:'#b79870',roughnessMap:woodRoughness,normalMap:woodNormal,normalScale:new T.Vector2(.35,.35),roughness:.8}),
    darkWood:new T.MeshStandardMaterial({map:woodColor,color:'#664731',roughnessMap:woodRoughness,normalMap:woodNormal,normalScale:new T.Vector2(.45,.45),roughness:.9}),
    stone:new T.MeshStandardMaterial({map:stoneColor,color:'#a9a799',roughnessMap:stoneRoughness,normalMap:stoneNormal,normalScale:new T.Vector2(.35,.35),roughness:.85}),
    metal:new T.MeshStandardMaterial({color:'#30332e',metalness:.65,roughness:.42}),
    ceiling:new T.MeshStandardMaterial({color:'#969b95',metalness:.7,roughness:.48,bumpMap:weave,bumpScale:.008}),
    cane:new T.MeshStandardMaterial({map:weave,color:'#c4aa7d',roughness:.85,bumpMap:weave,bumpScale:.015,side:T.DoubleSide}),
    fabric:new T.MeshStandardMaterial({color:'#b5a17a',bumpMap:linen,bumpScale:.002,roughness:.95,side:T.DoubleSide}),
    wall:new T.MeshStandardMaterial({color:'#646454',roughness:.95}),
    leaf:new T.MeshStandardMaterial({color:'#28491d',roughness:.48,bumpMap:wood,bumpScale:.012,side:T.DoubleSide}),
    leafLight:new T.MeshStandardMaterial({color:'#3a5426',roughness:.68,side:T.DoubleSide}),
    planter:new T.MeshStandardMaterial({color:'#252923',roughness:.8,bumpMap:stone,bumpScale:.012}),
    glow:new T.MeshStandardMaterial({color:'#ffe0a3',emissive:'#ffc471',emissiveIntensity:2}),
    glass:new T.MeshPhysicalMaterial({color:'#a9b7ad',metalness:.05,roughness:.13,transparent:true,opacity:.14,depthWrite:false}),
    ceramic:new T.MeshStandardMaterial({color:'#e4d7be',roughness:.3}),
  }
}
export type Materials = ReturnType<typeof createMaterials>
