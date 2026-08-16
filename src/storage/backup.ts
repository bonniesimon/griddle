import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Account, Post, RelativeMediaPath } from '@/types';

import { PERSISTED_SCHEMA_VERSION } from './persist';
import { resolveMediaUri } from './mediaStore';

const BACKUP_FILE_NAME = 'grid-preview-backup.json';
const MEDIA_DIRECTORY_NAME = 'media';

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

const readMediaFilesAsBase64 = async (relativePaths: RelativeMediaPath[]) => {
  const entries = await Promise.all(
    relativePaths.map(async (relativePath) => {
      const file = new File(resolveMediaUri(relativePath));
      if (!file.exists) return null;
      return [relativePath, await file.base64()] as const;
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
  const backupFile = new File(Paths.cache, BACKUP_FILE_NAME);
  if (backupFile.exists) backupFile.delete();
  backupFile.create();
  backupFile.write(JSON.stringify(bundle));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(backupFile.uri, { mimeType: 'application/json' });
  }
  return backupFile.uri;
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

const restoreMediaFiles = (mediaFilesAsBase64: Record<RelativeMediaPath, string>) => {
  const mediaDirectory = new Directory(Paths.document, MEDIA_DIRECTORY_NAME);
  if (!mediaDirectory.exists) mediaDirectory.create({ intermediates: true, idempotent: true });

  Object.entries(mediaFilesAsBase64).forEach(([relativePath, base64Contents]) => {
    const file = new File(resolveMediaUri(relativePath));
    if (file.exists) file.delete();
    file.create();
    file.write(Uint8Array.from(atob(base64Contents), (character) => character.charCodeAt(0)));
  });
};

export const readBackupFromPickedFile = async () => {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json'] });
  if (picked.canceled) return null;

  const parsedBundle: unknown = JSON.parse(await picked.result.text());
  if (!isBackupBundle(parsedBundle)) return null;

  restoreMediaFiles(parsedBundle.mediaFilesAsBase64);
  return { accounts: parsedBundle.accounts, posts: parsedBundle.posts };
};
