/** Keep the supplied originals while serving a sharp, lighter rendition to phones. */
export function responsivePhotoSrcSet(src: string): string | undefined {
  if (src.endsWith('mangosteen-arrival-enhanced.jpg')) {
    return `/images/mobile/mangosteen-arrival-mobile.jpg 1100w, ${src} 1673w`
  }
  if (src.endsWith('mangosteen-table-enhanced.jpg')) {
    return `/images/mobile/mangosteen-table-mobile.jpg 1000w, ${src} 1537w`
  }
  if (src.endsWith('mangosteen-interior-enhanced.jpg')) {
    return `/images/mobile/mangosteen-interior-mobile.jpg 1100w, ${src} 1448w`
  }
  const match = src.match(/mangosteen_original_([1-4])_8k\.jpg$/)
  if (!match) return undefined
  return `/images/mobile/mangosteen_original_${match[1]}_mobile.jpg 2400w, ${src} 7680w`
}
