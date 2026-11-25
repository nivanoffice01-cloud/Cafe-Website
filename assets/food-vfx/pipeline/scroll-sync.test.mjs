import test from 'node:test';
import assert from 'node:assert/strict';
import { AnimationMixer, AnimationClip, NumberKeyframeTrack, Object3D, LoopOnce } from 'three';
import { timeline, bindScrollClip } from './scroll-sync.mjs';

test('Blender frame endpoints and out-of-range scroll', () => {
  assert.deepEqual(timeline(-1, 8), { progress: 0, seconds: 0, frame: 1 });
  assert.deepEqual(timeline(2, 8), { progress: 1, seconds: 8, frame: 241 });
  assert.equal(timeline(0.5, 8).frame, 121);
  assert.throws(() => timeline(NaN, 8), RangeError);
});

test('actual Three.js mixer seeks forward, to endpoint, then backwards deterministically', () => {
  const object = new Object3D();
  const clip = new AnimationClip('qualification', 8, [new NumberKeyframeTrack('.position[z]', [0, 4, 8], [0, 1, 0])]);
  const seek = bindScrollClip(new AnimationMixer(object), clip, LoopOnce);
  for (const [p, expected] of [[0,0], [.25,.5], [.5,1], [1,0], [.5,1], [.25,.5], [0,0]]) {
    seek(p);
    assert.ok(Math.abs(object.position.z - expected) < 1e-6);
  }
});
