import originals from './gallery-photos.json'

export type GalleryPhotoKey = keyof typeof originals

// Unlike the portrait storytelling derivatives, these retain the full source
// composition. Mobile sources match the landscape card and its height cap;
// desktop sources still account for the taller editorial composition.
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
    gallerySizes: `(min-width: 1024px) max(min(80vw, 1260px), ${Math.ceil(photo.width / photo.height * 66)}svh), min(94vw, max(192px, calc(159svh - 366px)))`,
  }
}
