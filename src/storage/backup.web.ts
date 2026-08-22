import type { Account, Post, RelativeMediaPath } from '@/types';

import { PERSISTED_SCHEMA_VERSION } from './persist';
import { primeMediaCache, resolveMediaUri } from './mediaStore.web';
import { writeBlob } from './mediaDatabase.web';

const BACKUP_FILE_NAME = 'griddle-backup.json';

export type BackupBundle = {
  schemaVersion: number;
  exportedAt: number;
  accounts: Account[];
  posts: Post[];
  mediaFilesAsBase64: Record<RelativeMediaPath, string>;
};

const mediaPathsReferencedBy = (accounts: Account[], posts: Post[]) => {
  const referencedPaths = new Set<RelativeMediaPath>();
  accounts.forEach((account) => {
    if (account.avatarPath) referencedPaths.add(account.avatarPath);
  });
  posts.forEach((post) =>
    post.media.forEach((media) => {
      referencedPaths.add(media.fullResolutionPath);
      referencedPaths.add(media.thumbnailPath);
    })
  );
  return [...referencedPaths];
};

const base64FromBlob = (contents: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(contents);
  });

const readMediaFilesAsBase64 = async (relativePaths: RelativeMediaPath[]) => {
  const entries = await Promise.all(
    relativePaths.map(async (relativePath) => {
      const browserUrl = resolveMediaUri(relativePath);
      if (!browserUrl) return null;
      const contents = await (await fetch(browserUrl)).blob();
      return [relativePath, await base64FromBlob(contents)] as const;
    })
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
};

export const buildBackupBundle = async (
  accounts: Account[],
  posts: Post[]
): Promise<BackupBundle> => ({
  schemaVersion: PERSISTED_SCHEMA_VERSION,
  exportedAt: Date.now(),
  accounts,
  posts,
  mediaFilesAsBase64: await readMediaFilesAsBase64(mediaPathsReferencedBy(accounts, posts)),
});

export const exportBackupToSharedFile = async (accounts: Account[], posts: Post[]) => {
  const bundle = await buildBackupBundle(accounts, posts);
  const downloadUrl = URL.createObjectURL(
    new Blob([JSON.stringify(bundle)], { type: 'application/json' })
  );

  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = BACKUP_FILE_NAME;
  downloadLink.click();
  URL.revokeObjectURL(downloadUrl);

  return downloadUrl;
};

export const isBackupBundle = (candidate: unknown): candidate is BackupBundle => {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const bundle = candidate as Partial<BackupBundle>;
  return (
    Array.isArray(bundle.accounts) &&
    Array.isArray(bundle.posts) &&
    typeof bundle.mediaFilesAsBase64 === 'object' &&
    bundle.mediaFilesAsBase64 !== null
  );
};

const restoreMediaFiles = async (mediaFilesAsBase64: Record<RelativeMediaPath, string>) => {
  await Promise.all(
    Object.entries(mediaFilesAsBase64).map(async ([relativePath, base64Contents]) => {
      const contents = await (
        await fetch(`data:application/octet-stream;base64,${base64Contents}`)
      ).blob();
      await writeBlob(relativePath, contents);
    })
  );
};

const chooseJsonFile = () =>
  new Promise<File | null>((resolve) => {
    const filePicker = document.createElement('input');
    filePicker.type = 'file';
    filePicker.accept = 'application/json';
    filePicker.onchange = () => resolve(filePicker.files?.[0] ?? null);
    filePicker.oncancel = () => resolve(null);
    filePicker.click();
  });

export const readBackupFromPickedFile = async () => {
  const chosenFile = await chooseJsonFile();
  if (!chosenFile) return null;

  const parsedBundle: unknown = JSON.parse(await chosenFile.text());
  if (!isBackupBundle(parsedBundle)) return null;

  await restoreMediaFiles(parsedBundle.mediaFilesAsBase64);
  await primeMediaCache();
  return { accounts: parsedBundle.accounts, posts: parsedBundle.posts };
};
