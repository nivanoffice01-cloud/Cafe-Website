type Bounds = readonly number[]
type Transform = { s: number; tx: number; ty: number }

// Preserve the approved opening/closing composition. Landscape coordinates are
// local to the existing right-hand artwork panel.
export function mobilePosterFrame(bounds: Bounds, width: number, height: number, landscape: boolean): Transform {
  const top = landscape ? 0 : height * (height <= 700 ? .44 : .34)
  const bottom = landscape ? height : height * (height <= 700 ? .8 : .78)
  const availableHeight = bottom - top
  const scale = Math.min(.68 * width, .86 * availableHeight) / (bounds[2] - bounds[0])
  return { s: scale, tx: width / 2 - (bounds[0] + bounds[2]) / 2 * scale, ty: (top + bottom) / 2 - (bounds[1] + bounds[3]) / 2 * scale }
}

// Fit the actual displayed frame, not the union of every ingredient's position
// across every clip. A short neighbourhood prevents abrupt changes of framing
// when a single edge pixel or floating ingredient changes the tight bounds.
export function mobileSequenceFrame(frames: readonly Bounds[], index: number, width: number, height: number, landscape: boolean): Transform {
  const nearby = frames.slice(Math.max(0, index - 2), Math.min(frames.length, index + 3))
  const bounds = nearby.reduce((box, frame) => [Math.min(box[0], frame[0]), Math.min(box[1], frame[1]), Math.max(box[2], frame[2]), Math.max(box[3], frame[3])], [Infinity, Infinity, -Infinity, -Infinity])
  const top = landscape ? 8 : Math.max(96, height * .125)
  const bottom = landscape ? height - 8 : height - (height <= 700 ? 200 : 230)
  const scale = Math.min(width * .9 / Math.max(1, bounds[2] - bounds[0]), (bottom - top) * 1.08 / Math.max(1, bounds[3] - bounds[1]))
  return { s: scale, tx: width / 2 - (bounds[0] + bounds[2]) / 2 * scale, ty: (top + bottom) / 2 - (bounds[1] + bounds[3]) / 2 * scale }
}
