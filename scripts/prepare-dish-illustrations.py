"""Create responsive web derivatives and an exact-ID map from selected AI outputs."""
import hashlib, json, re, sys, fcntl
from pathlib import Path
from PIL import Image, ImageOps
root=Path(__file__).resolve().parents[1]
# Serialise registrations when several images finish together.
lock=open('/private/tmp/mangosteen-dish-illustrations.lock','w')
fcntl.flock(lock,fcntl.LOCK_EX)
def atomic_write(path,content):
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(content)
    temporary.replace(path)
manifest=root/'assets/menu-illustrations/source-manifest.json'
entries=json.loads(manifest.read_text()) if manifest.exists() else []
if len(sys.argv)>1:
    entry=json.loads(sys.argv[1])
    entries=[item for item in entries if (item['category'],item['name'])!=(entry['category'],entry['name'])]+[entry]
    atomic_write(manifest,json.dumps(entries,indent=2,ensure_ascii=False)+'\n')
photos={}
for entry in entries:
    key=f"{entry['category']}|{entry['name']}"
    stem=re.sub(r'[^a-z0-9]+','-',entry['name'].lower()).strip('-')+'-'+hashlib.sha256(key.encode()).hexdigest()[:8]
    if entry.get('revision'): stem += '-v'+str(entry['revision'])
    target=root/'public/images/menu-dishes'
    missing=[size for size in (320,800) if not (target/f'{stem}-{size}.webp').exists()]
    if missing:
        with Image.open(entry['source']) as original:
            original=ImageOps.exif_transpose(original).convert('RGB')
            for size in missing:
                output=target/f'{stem}-{size}.webp'
                image=ImageOps.fit(original,(size,size),method=Image.Resampling.LANCZOS)
                image.save(output,'WEBP',quality=82,method=6)
    photos[key]={'src':f'/images/menu-dishes/{stem}-800.webp','srcSet':f'/images/menu-dishes/{stem}-320.webp 320w, /images/menu-dishes/{stem}-800.webp 800w','alt':f'AI-generated illustration of {entry["name"]}; not a photograph of Mangosteen’s actual serving','kind':'generated','position':'50% 50%'}
atomic_write(root/'src/features/digital-menu/generated-dish-photos.json',json.dumps(photos,indent=2,ensure_ascii=False)+'\n')
print(f'Prepared {len(photos)} distinct dish illustrations with 320px/800px WebP sources')
