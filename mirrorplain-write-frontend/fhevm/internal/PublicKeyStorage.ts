/**
 * Public Key Storage using IndexedDB
 */

import { openDB, DBSchema } from "idb";

interface PublicKeyDB extends DBSchema {
  publicKeys: {
    key: string; // aclAddress
    value: {
      publicKey: string;
      publicParams: string;
      timestamp: number;
    };
  };
}

const DB_NAME = "fhevm-public-keys";
const STORE_NAME = "publicKeys";
const DB_VERSION = 1;

async function getDB() {
  return openDB<PublicKeyDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function publicKeyStorageGet(aclAddress: string): Promise<{
  publicKey: string;
  publicParams: string;
}> {
  try {
    const db = await getDB();
    const cached = await db.get(STORE_NAME, aclAddress);
    
    if (cached) {
      console.log("[PublicKeyStorage] Found cached key for", aclAddress);
      return {
        publicKey: cached.publicKey,
        publicParams: cached.publicParams,
      };
    }
  } catch (e) {
    console.warn("[PublicKeyStorage] Failed to get from cache:", e);
  }

  // Return empty strings if not found (will be fetched from network)
  return {
    publicKey: "",
    publicParams: "",
  };
}

export async function publicKeyStorageSet(
  aclAddress: string,
  publicKey: string,
  publicParams: string
): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, {
      publicKey,
      publicParams,
      timestamp: Date.now(),
    }, aclAddress);
    console.log("[PublicKeyStorage] Cached key for", aclAddress);
  } catch (e) {
    console.warn("[PublicKeyStorage] Failed to cache:", e);
  }
}

