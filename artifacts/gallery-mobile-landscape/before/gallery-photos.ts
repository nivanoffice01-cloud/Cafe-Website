import originals from './gallery-photos.json'

export type GalleryPhotoKey = keyof typeof originals

// Unlike the portrait storytelling derivatives, these retain the full source
// composition. Account for object-fit:cover's height, not only the CSS width,
// when choosing a source for tall, high-density mobile gallery frames.
export function galleryPhoto(key: GalleryPhotoKey) {
  const photo = originals[key]
  return {
    alt: `${photo.enhanced ? 'AI-enhanced version of a Mangosteen photograph: ' : ''}${photo.alt}`,
    enhanced: photo.enhanced,
    originalSrc: photo.original.replace(/^public/, ''),
    fullSrc: photo.files.at(-1)!.src,
    src: (photo.files.find(file => file.width >= 1280) ?? photo.files.at(-1)!).src,
    srcSet: photo.files.map(file => `${file.src} ${file.width}w`).join(', '),
    width: photo.width,
    height: photo.height,
    gallerySizes: `(min-width: 1024px) max(min(80vw, 1260px), ${Math.ceil(photo.width / photo.height * 66)}svh), max(94vw, ${Math.ceil(photo.width / photo.height * 70)}svh)`,
  }
}
