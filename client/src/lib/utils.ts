import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import superjson from "superjson";
import type { StateStorage } from "zustand/middleware";

export function logger(item: unknown, isError?: boolean) {
  const { log, error } = console;
  if (import.meta.env.DEV) {
    if (isError) {
      error(item);
      return;
    }
    log(item);
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const check = indexedDB.open(dbName);

    check.onsuccess = () => {
      const db = check.result;
      if (db.objectStoreNames.contains(storeName)) {
        resolve(db);
      } else {
        const newVersion = db.version + 1;
        db.close();

        const upgrade = indexedDB.open(dbName, newVersion);
        upgrade.onupgradeneeded = () => {
          const newDb = upgrade.result;
          if (!newDb.objectStoreNames.contains(storeName)) {
            newDb.createObjectStore(storeName);
          }
        };
        upgrade.onsuccess = () => resolve(upgrade.result);
        upgrade.onerror = () => reject(upgrade.error);
      }
    };

    check.onerror = () => reject(check.error);
  });
}

export async function idbGet<T>(key: string, dbName: string, storeName: string): Promise<T | null> {
  try {
    const db = await openDB(dbName, storeName);
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result != null) {
          resolve(superjson.parse(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    logger(error);
    return null;
  }
}

export async function idbSet(key: string, value: unknown, dbName: string, storeName: string) {
  try {
    const db = await openDB(dbName, storeName);
    const safeValue = superjson.stringify(value);
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(safeValue, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    logger(error);
    return null;
  }
}

export async function idbRemove(key: string, dbName: string, storeName: string) {
  try {
    const db = await openDB(dbName, storeName);
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    logger(error);
    return null;
  }
}

const IDB_NAME = "fast-visual-image-store";
const IDB_STORE = "zustand";

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const data = await idbGet<string>(name, IDB_NAME, IDB_STORE);
    return data;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value, IDB_NAME, IDB_STORE);
  },

  removeItem: async (name: string): Promise<void> => {
    await idbRemove(name, IDB_NAME, IDB_STORE);
  },
};