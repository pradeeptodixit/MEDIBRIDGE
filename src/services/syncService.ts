/**
 * MediBridge AI — Offline Sync Queue & Simulation Service
 *
 * Provides honest, transparent offline operation for rural healthcare workers:
 * Records are saved locally in browser storage when disconnected, queued for sync,
 * and marked as simulated-synced upon reconnection.
 */

export interface SyncQueueItem {
  id: string;
  type: 'household_survey' | 'referral' | 'status_update';
  title: string;
  data: unknown;
  timestamp: string;
  status: 'pending' | 'synced';
}

const SYNC_QUEUE_KEY = 'mb_sync_queue';
const SYNC_EVENT = 'medibridge:sync_updated';

export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncQueueItem[];
  } catch {
    return [];
  }
}

export function saveSyncQueue(items: SyncQueueItem[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: items }));
    }
  } catch {
    // LocalStorage quota or access error
  }
}

let syncSeq = 0;
export function addToSyncQueue(
  type: SyncQueueItem['type'],
  title: string,
  data: unknown
): SyncQueueItem {
  syncSeq += 1;
  const item: SyncQueueItem = {
    id: `sync-${Date.now().toString(36)}-${syncSeq}`,
    type,
    title,
    data,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  const current = getSyncQueue();
  saveSyncQueue([item, ...current]);
  return item;
}

export function getPendingSyncCount(): number {
  return getSyncQueue().filter(i => i.status === 'pending').length;
}

export function simulateSyncAll(): { syncedCount: number } {
  const current = getSyncQueue();
  const pending = current.filter(i => i.status === 'pending');
  const updated = current.map(item => ({
    ...item,
    status: 'synced' as const,
  }));
  saveSyncQueue(updated);
  return { syncedCount: pending.length };
}

export function clearSyncQueue(): void {
  saveSyncQueue([]);
}
