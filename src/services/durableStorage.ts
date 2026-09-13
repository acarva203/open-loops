import type { Engagement } from '../types';
import type { TimeblockEvent } from '../types/calendar';

const IDB_NAME = 'open_loops_durable_db';
const IDB_VERSION = 1;
const STORE_NAME = 'workspace_data';

// Open / initialize IndexedDB
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get from IndexedDB
export async function getLocalDurable<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Set into IndexedDB
export async function setLocalDurable(key: string, value: any): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Cloud sync debounce timer
let cloudSyncTimer: any = null;

/**
 * Saves data durably to IndexedDB immediately, and debounces sync to cloud database (/api/data).
 */
export async function saveDurableState(
  engagements: Engagement[],
  timeblocks: TimeblockEvent[]
): Promise<void> {
  // 1. Save immediately to client-side IndexedDB
  await setLocalDurable('engagements', engagements);
  await setLocalDurable('timeblocks', timeblocks);
  await setLocalDurable('last_saved_at', new Date().toISOString());

  // 2. Debounce cloud sync to serverless Postgres (/api/data)
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);

  cloudSyncTimer = setTimeout(async () => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagements,
          timeblocks,
        }),
      });
    } catch {
      // Offline or local development; IndexedDB has already persisted state
    }
  }, 1000);
}

/**
 * Loads durable state: checks cloud database (/api/data) first, falling back to IndexedDB / localStorage.
 */
export async function loadDurableState(): Promise<{
  engagements: Engagement[] | null;
  timeblocks: TimeblockEvent[] | null;
  source: 'database' | 'indexeddb' | 'none';
}> {
  // 1. Try to fetch from cloud database
  try {
    const res = await fetch('/api/data', { method: 'GET' });
    if (res.ok) {
      const json = await res.json();
      if (json.source === 'database' && json.found && json.data) {
        // Cache to local IndexedDB
        await setLocalDurable('engagements', json.data.engagements);
        await setLocalDurable('timeblocks', json.data.timeblocks);
        return {
          engagements: json.data.engagements,
          timeblocks: json.data.timeblocks,
          source: 'database',
        };
      }
    }
  } catch {
    // Network offline or server unreachable, fallback to local
  }

  // 2. Try IndexedDB
  try {
    const idbEngagements = await getLocalDurable<Engagement[]>('engagements');
    const idbTimeblocks = await getLocalDurable<TimeblockEvent[]>('timeblocks');

    if (idbEngagements && idbEngagements.length > 0) {
      return {
        engagements: idbEngagements,
        timeblocks: idbTimeblocks || [],
        source: 'indexeddb',
      };
    }
  } catch {}

  return { engagements: null, timeblocks: null, source: 'none' };
}
