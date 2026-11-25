/** Bind an approved glTF AnimationClip later. Does not attach to the website. */
export function timeline(progress, duration, frames = 241) {
  if (![progress, duration, frames].every(Number.isFinite) || duration <= 0 || frames < 2) {
    throw new RangeError('Finite progress, positive duration and at least two frames required');
  }
  const p = Math.min(1, Math.max(0, progress));
  return { progress: p, seconds: p * duration, frame: 1 + p * (frames - 1) };
}

export function bindScrollClip(mixer, clip, loopOnce) {
  const action = mixer.clipAction(clip);
  action.setLoop(loopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  return (progress) => {
    const { seconds } = timeline(progress, clip.duration);
    // A finished LoopOnce action is paused; reset it before seeking in reverse.
    action.enabled = true;
    action.paused = false;
    mixer.setTime(seconds);
  };
}
