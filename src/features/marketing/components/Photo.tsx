type Props = { name: string; alt: string; className?: string; priority?: boolean; sizes?: string }
const large = new Set(['arrival', 'dining', 'evening'])
export function Photo({ name, alt, className, priority = false, sizes = '100vw' }: Props) {
  return <img className={className} src={`/marketing/${name}-${name === 'chair' ? 640 : 1280}.webp`} srcSet={`/marketing/${name}-640.webp 640w${name !== 'chair' ? `, /marketing/${name}-1280.webp 1280w` : ''}${large.has(name) ? `, /marketing/${name}-1920.webp 1920w` : ''}`} sizes={sizes} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"/>
}
