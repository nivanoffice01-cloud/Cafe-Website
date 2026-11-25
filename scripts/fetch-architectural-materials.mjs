import fs from 'node:fs/promises'
const destination='public/materials/architectural'
await fs.mkdir(destination,{recursive:true})
for(const [name,id] of [['wood','wood_table_001'],['stone','stone_tiles_02']]){
  const metadata=await (await fetch(`https://api.polyhaven.com/files/${id}`)).json()
  for(const [kind,key] of [['color','Diffuse'],['normal','nor_gl'],['roughness','Rough']]){
    const source=metadata[key]['1k'].jpg.url
    const response=await fetch(source);if(!response.ok)throw Error(`${response.status} ${source}`)
    await fs.writeFile(`${destination}/${name}-${kind}.jpg`,Buffer.from(await response.arrayBuffer()))
    console.log(source)
  }
}
// Authored botanical mesh, with CC0 maps; no generated café imagery.
const plantId='calathea_orbifolia_01'
const metadata=await (await fetch(`https://api.polyhaven.com/files/${plantId}`)).json()
const model=metadata.gltf['1k'].gltf
for(const [name,file] of Object.entries({[`${plantId}.gltf`]:model,...model.include})){
  const path=`public/models/architectural/calathea/${name}`
  await fs.mkdir(path.slice(0,path.lastIndexOf('/')),{recursive:true})
  const response=await fetch(file.url);if(!response.ok)throw Error(`${response.status} ${file.url}`)
  await fs.writeFile(path,Buffer.from(await response.arrayBuffer()))
  console.log(file.url)
}
