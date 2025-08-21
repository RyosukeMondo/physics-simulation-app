// Spawn queue utility: batch spawns to the next animation frame
// Ensures at most one spawn batch per frame to avoid transient inconsistencies
// Usage:
//   import { queueSpawn } from '../utils/spawnQueue';
//   queueSpawn(() => addBall());
//   queueSpawn(() => addGLB(url));
//   // All queued callbacks run together on the next rAF tick

let scheduled = false;
let queue: Array<() => void> = [];

export function queueSpawn(cb: () => void) {
  queue.push(cb);
  if (!scheduled) {
    scheduled = true;
    if (typeof window !== 'undefined') {
      requestAnimationFrame(flush);
    } else {
      // Fallback for non-DOM envs
      setTimeout(flush, 0);
    }
  }
}

export function flush() {
  const toRun = queue;
  queue = [];
  scheduled = false;
  for (const cb of toRun) {
    try {
      cb();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[PHYSICS-DEBUG] spawnQueue callback error', e);
    }
  }
}

export function isScheduled() {
  return scheduled;
}
