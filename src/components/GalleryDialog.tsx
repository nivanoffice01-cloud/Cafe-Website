import { useEffect, useRef, useState } from 'react'
import { galleryPhotos } from '../data/gallery'

export function GalleryDialog({ initialIndex = 0, onClose }: { initialIndex?: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % galleryPhotos.length)
      if (event.key === 'ArrowLeft') setIndex((current) => (current + galleryPhotos.length - 1) % galleryPhotos.length)
      if (event.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('.gallery-dialog')
        const focusable = dialog?.querySelectorAll<HTMLElement>('button')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  const photo = galleryPhotos[index]
  const go = (step: number) => setIndex((current) => (current + step + galleryPhotos.length) % galleryPhotos.length)

  return (
    <div className="gallery-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="gallery-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-dialog-title">
        <header className="gallery-dialog-topline">
          <div><p className="section-index">MANGOSTEEN · INDORE</p><h2 id="gallery-dialog-title">Around the <em>table.</em></h2></div>
          <button ref={closeRef} className="gallery-close" type="button" onClick={onClose} aria-label="Close photo gallery">Close <span aria-hidden="true">×</span></button>
        </header>
        <figure className="gallery-dialog-image">
          <img src={photo.src} alt={photo.alt} />
          <figcaption><span>{photo.caption}</span><span>{String(index + 1).padStart(2, '0')} / {String(galleryPhotos.length).padStart(2, '0')}</span></figcaption>
        </figure>
        <div className="gallery-controls">
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo">←</button>
          <p aria-live="polite">Use the arrows to explore the cafe</p>
          <button type="button" onClick={() => go(1)} aria-label="Next photo">→</button>
        </div>
      </section>
    </div>
  )
}
