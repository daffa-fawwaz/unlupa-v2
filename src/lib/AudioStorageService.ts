export interface AudioRecord {
  itemId: string | number;
  audioBlob?: Blob; // Deprecated
  audioData?: ArrayBuffer;
  duration: number; // seconds
  createdAt: number; // ms timestamp
  mimeType: string;
}

const DB_NAME = "unlupa_audio_db";
const DB_VERSION = 2;
const STORE_NAME = "audio_recordings";

class AudioStorageServiceImpl {
  private blobUrlCache = new Map<string, string>();

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "itemId" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveAudio(
    itemId: string | number,
    blob: Blob,
    duration: number,
  ): Promise<void> {
    try {
      const db = await this.openDB();
      const now = Date.now();
      const standardizedId = String(itemId);

      const arrayBuffer = await blob.arrayBuffer();
      const storedMime = blob.type || "audio/webm";

      const record: AudioRecord = {
        itemId: standardizedId,
        audioData: arrayBuffer,
        duration: Math.max(1, Math.round(duration)),
        createdAt: now,
        mimeType: storedMime,
      };

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);

        req.onsuccess = () => {
          this.clearCachedBlobUrl(standardizedId);
          window.dispatchEvent(
            new CustomEvent("audio-updated", {
              detail: { itemId: standardizedId },
            }),
          );
          resolve();
        };

        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error("Failed to save audio", err);
    }
  }

  public async getAudio(
    itemId: string | number,
  ): Promise<(AudioRecord & { audioBlob: Blob }) | null> {
    try {
      const db = await this.openDB();
      const standardizedId = String(itemId);

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(standardizedId);

        req.onsuccess = () => {
          const record = req.result as AudioRecord | undefined;
          if (record) {
            const type = record.mimeType || "audio/webm";
            let finalBlob: Blob | null = null;

            if (record.audioData && record.audioData.byteLength > 0) {
              finalBlob = new Blob([record.audioData], { type });
            } else if (
              record.audioBlob &&
              (record.audioBlob as Blob).size > 0
            ) {
              finalBlob = record.audioBlob;
            }

            if (!finalBlob || finalBlob.size === 0) {
              resolve(null);
              return;
            }

            resolve({ ...record, audioBlob: finalBlob });
          } else {
            resolve(null);
          }
        };

        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error("Error getting audio:", err);
      return null;
    }
  }

  public async deleteAudio(itemId: string | number): Promise<void> {
    try {
      const db = await this.openDB();
      const standardizedId = String(itemId);

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(standardizedId);

        req.onsuccess = () => {
          this.clearCachedBlobUrl(standardizedId);
          window.dispatchEvent(
            new CustomEvent("audio-updated", {
              detail: { itemId: standardizedId },
            }),
          );
          resolve();
        };

        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error("Error deleting audio:", err);
    }
  }

  public async hasAudio(itemId: string | number): Promise<boolean> {
    const record = await this.getAudio(itemId);
    return record !== null;
  }

  public getCachedBlobUrl(itemId: string | number, blob?: Blob): string {
    const id = String(itemId);
    if (this.blobUrlCache.has(id)) {
      return this.blobUrlCache.get(id)!;
    }
    if (!blob) {
      return "";
    }
    const newUrl = URL.createObjectURL(blob);
    this.blobUrlCache.set(id, newUrl);
    return newUrl;
  }

  public clearCachedBlobUrl(itemId: string | number) {
    const id = String(itemId);
    const existing = this.blobUrlCache.get(id);
    if (existing) {
      this.blobUrlCache.delete(id);
      // Defer revoking to allow any active <audio> elements or components to transition smoothly
      setTimeout(() => {
        try {
          URL.revokeObjectURL(existing);
        } catch {
          // ignore
        }
      }, 5000);
    }
  }

  public formatAudioDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || isNaN(seconds) || seconds < 0)
      return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}

export const AudioStorageService = new AudioStorageServiceImpl();
