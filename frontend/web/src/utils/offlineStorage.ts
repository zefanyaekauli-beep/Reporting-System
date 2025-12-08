// frontend/web/src/utils/offlineStorage.ts

/**
 * Offline storage using IndexedDB for event-based offline mode.
 * Stores events locally and syncs when online.
 */

const DB_NAME = "verolux_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "offline_events";

export interface OfflineEvent {
  local_id: string; // UUID
  type: string; // 'CLEANING_CHECK', 'GPS_UPDATE', 'PANIC', etc.
  event_time: string; // ISO string (jam X)
  payload: any;
  created_at_local: string; // ISO string
  synced: boolean;
  retry_count: number;
}

let db: IDBDatabase | null = null;

export async function initOfflineDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "local_id" });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("event_time", "event_time", { unique: false });
      }
    };
  });
}

export async function saveOfflineEvent(event: Omit<OfflineEvent, "local_id" | "created_at_local" | "synced" | "retry_count">): Promise<string> {
  if (!db) {
    await initOfflineDB();
  }

  const local_id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullEvent: OfflineEvent = {
    local_id,
    ...event,
    created_at_local: new Date().toISOString(),
    synced: false,
    retry_count: 0,
  };

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(fullEvent);

    request.onsuccess = () => resolve(local_id);
    request.onerror = () => reject(request.error);
  });
}

export async function getUnsyncedEvents(): Promise<OfflineEvent[]> {
  if (!db) {
    await initOfflineDB();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("synced");
    const request = index.getAll(false);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function markEventSynced(local_id: string): Promise<void> {
  if (!db) {
    await initOfflineDB();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(local_id);

    getRequest.onsuccess = () => {
      const event = getRequest.result;
      if (event) {
        event.synced = true;
        const putRequest = store.put(event);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function incrementRetryCount(local_id: string): Promise<void> {
  if (!db) {
    await initOfflineDB();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(local_id);

    getRequest.onsuccess = () => {
      const event = getRequest.result;
      if (event) {
        event.retry_count = (event.retry_count || 0) + 1;
        const putRequest = store.put(event);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteEvent(local_id: string): Promise<void> {
  if (!db) {
    await initOfflineDB();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(local_id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get device ID (persistent UUID stored in localStorage)
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem("verolux_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("verolux_device_id", deviceId);
  }
  return deviceId;
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Detect mock location (Android)
 * Note: This is a simplified check. Full implementation would need native code.
 */
export async function detectMockLocation(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false;
  }

  try {
    // Try to get position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
      });
    });

    // Check if accuracy is suspiciously good (mock locations often have perfect accuracy)
    // This is a heuristic - real implementation would check isFromMockProvider() on Android
    if (position.coords.accuracy === 0) {
      return true;
    }

    // Check if coordinates are at 0,0 (common mock location)
    if (
      Math.abs(position.coords.latitude) < 0.001 &&
      Math.abs(position.coords.longitude) < 0.001
    ) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get GPS coordinates with mock detection
 */
export async function getGPSWithDetection(): Promise<{
  latitude: string;
  longitude: string;
  accuracy: string;
  mock_location: boolean;
}> {
  const mockLocation = await detectMockLocation();

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          accuracy: (position.coords.accuracy || 0).toString(),
          mock_location: mockLocation,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

