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

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export function compressImage(file: File, options: CompressImageOptions = {}): Promise<string> {
  const { maxWidth = 256, maxHeight = 256, quality = 0.8, maxSizeKB = 400 } = options;

  return new Promise((resolve, reject) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error("Invalid image type. Supported: JPEG, PNG, GIF, WebP"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compress = (q: number): string => {
          return canvas.toDataURL("image/webp", q);
        };

        let currentQuality = quality;
        let result = compress(currentQuality);

        while (result.length > maxSizeKB * 1024 * 1.37 && currentQuality > 0.1) {
          currentQuality -= 0.1;
          result = compress(currentQuality);
        }

        resolve(result);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
