/* Debug registry for recent rigid body configs and global error logging */
import { debugLogger } from './debugLogger';

export type RecentConfig = {
  timestamp: number;
  componentName: string;
  config: unknown;
};

class RingBuffer<T> {
  private buf: Array<T | undefined>;
  private idx = 0;
  private filled = false;

  constructor(private capacity: number) {
    this.buf = new Array<T | undefined>(capacity);
  }

  push(item: T) {
    this.buf[this.idx] = item;
    this.idx = (this.idx + 1) % this.capacity;
    if (this.idx === 0) this.filled = true;
  }

  toArray(): T[] {
    if (!this.filled) return this.buf.slice(0, this.idx).filter(Boolean) as T[];
    return [...this.buf.slice(this.idx), ...this.buf.slice(0, this.idx)].filter(Boolean) as T[];
  }
}

const store = new RingBuffer<RecentConfig>(50);

export function addRecentRigidBodyConfig(componentName: string, config: unknown) {
  store.push({ timestamp: Date.now(), componentName, config });
}

export function getRecentRigidBodyConfigs(): RecentConfig[] {
  return store.toArray();
}

export function logRecentRigidBodyConfigs(label: string = "Recent RigidBody Configs") {
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[PHYSICS-DEBUG] ${label}`);
  for (const item of getRecentRigidBodyConfigs()) {
    // eslint-disable-next-line no-console
    console.log(new Date(item.timestamp).toISOString(), item.componentName, item.config);
  }
  // eslint-disable-next-line no-console
  console.groupEnd();
}

export function exportPhysicsDiagnostics(filename: string = `physics-diagnostics-${Date.now()}.json`) {
  if (typeof window === 'undefined') return;
  const payload = {
    exportedAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
    recentRigidBodyConfigs: getRecentRigidBodyConfigs(),
    debugLogs: debugLogger.getLogs(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let initialized = false;
export function setupGlobalPhysicsErrorLogging() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Expose a manual dump helper for the console
  try {
    // @ts-ignore
    (window as any).__dumpRigidBodies = (label?: string) => logRecentRigidBodyConfigs(label || 'Manual dump');
    // @ts-ignore
    (window as any).__exportPhysicsLogs = (filename?: string) => exportPhysicsDiagnostics(filename);
  } catch {}

  window.addEventListener('error', (ev) => {
    try {
      const msg = (ev?.error?.stack || ev?.message || '').toString();
      if (msg.includes('use-ammojs') || msg.includes('events-e3cb66e2')) {
        logRecentRigidBodyConfigs('Dump on window.error (use-ammojs related)');
      }
    } catch {}
  });

  window.addEventListener('unhandledrejection', (ev) => {
    try {
      const msg = (ev?.reason?.stack || ev?.reason || '').toString();
      if (msg.includes('use-ammojs') || msg.includes('events-e3cb66e2')) {
        logRecentRigidBodyConfigs('Dump on unhandledrejection (use-ammojs related)');
      }
    } catch {}
  });
}
