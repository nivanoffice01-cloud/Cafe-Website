/** Keep the supplied originals while serving a sharp, lighter rendition to phones. */
export function responsivePhotoSrcSet(src: string): string | undefined {
  const match = src.match(/mangosteen_original_([1-4])_8k\.jpg$/)
  if (!match) return undefined
  return `/images/mobile/mangosteen_original_${match[1]}_mobile.jpg 2400w, ${src} 7680w`
}
