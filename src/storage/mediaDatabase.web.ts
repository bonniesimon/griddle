import type { RelativeMediaPath } from '@/types';

const DATABASE_NAME = 'grid-preview-media';
const DATABASE_VERSION = 1;
const BLOB_STORE_NAME = 'files';

const requestAsPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const openMediaDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    openRequest.onupgradeneeded = () => {
      if (!openRequest.result.objectStoreNames.contains(BLOB_STORE_NAME)) {
        openRequest.result.createObjectStore(BLOB_STORE_NAME);
      }
    };
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror = () => reject(openRequest.error);
  });

const withBlobStore = async <T>(
  mode: IDBTransactionMode,
  runAgainstStore: (store: IDBObjectStore) => IDBRequest<T>
) => {
  const database = await openMediaDatabase();
  try {
    const blobStore = database.transaction(BLOB_STORE_NAME, mode).objectStore(BLOB_STORE_NAME);
    return await requestAsPromise(runAgainstStore(blobStore));
  } finally {
    database.close();
  }
};

export const writeBlob = (relativePath: RelativeMediaPath, contents: Blob) =>
  withBlobStore('readwrite', (store) => store.put(contents, relativePath));

export const eraseBlob = (relativePath: RelativeMediaPath) =>
  withBlobStore('readwrite', (store) => store.delete(relativePath));

export const readAllBlobs = async () => {
  const storedPaths = await withBlobStore('readonly', (store) => store.getAllKeys());
  const storedBlobs = await withBlobStore('readonly', (store) => store.getAll());
  return storedPaths.map(
    (storedPath, index) => [String(storedPath), storedBlobs[index] as Blob] as const
  );
};
