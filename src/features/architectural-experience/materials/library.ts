import * as T from 'three'

// Deterministic material studies, authored locally; no external texture licences.
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
export function createMaterials() {
  const wood=surface('wood'),stone=surface('stone'),weave=surface('weave')
  return {
    wood:new T.MeshStandardMaterial({map:wood,color:'#9c744f',roughness:.55,bumpMap:wood,bumpScale:.025}),
    darkWood:new T.MeshStandardMaterial({map:wood,color:'#473224',roughness:.7,bumpMap:wood,bumpScale:.02}),
    stone:new T.MeshStandardMaterial({map:stone,roughness:.84,bumpMap:stone,bumpScale:.018}),
    metal:new T.MeshStandardMaterial({color:'#30332e',metalness:.65,roughness:.42}),
    ceiling:new T.MeshStandardMaterial({color:'#969b95',metalness:.78,roughness:.44}),
    cane:new T.MeshStandardMaterial({map:weave,color:'#c4aa7d',roughness:.85,bumpMap:weave,bumpScale:.015,side:T.DoubleSide}),
    fabric:new T.MeshStandardMaterial({map:stone,color:'#d5bd8e',roughness:.95,side:T.DoubleSide}),
    wall:new T.MeshStandardMaterial({color:'#b6b4a0',roughness:.95}),
    leaf:new T.MeshStandardMaterial({color:'#355b2a',roughness:.68,side:T.DoubleSide}),
    leafLight:new T.MeshStandardMaterial({color:'#69803b',roughness:.68,side:T.DoubleSide}),
    planter:new T.MeshStandardMaterial({color:'#333a32',roughness:.9}),
    glow:new T.MeshStandardMaterial({color:'#ffe0a3',emissive:'#ffc471',emissiveIntensity:2}),
    glass:new T.MeshPhysicalMaterial({color:'#a9b7ad',metalness:.05,roughness:.13,transparent:true,opacity:.14,depthWrite:false}),
    ceramic:new T.MeshStandardMaterial({color:'#e4d7be',roughness:.3}),
  }
}
export type Materials = ReturnType<typeof createMaterials>
