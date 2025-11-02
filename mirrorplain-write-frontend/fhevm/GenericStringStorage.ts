/**
 * Generic String Storage Interface
 */

export interface GenericStringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * LocalStorage Adapter
 */
export class LocalStorageAdapter implements GenericStringStorage {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.removeItem(key);
  }
}

