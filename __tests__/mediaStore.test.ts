import {
  deleteAvatarFile,
  deleteMediaFiles,
  importAvatarIntoAppStorage,
  importImageIntoAppStorage,
  resolveMediaUri,
} from '@/storage/mediaStore';
import type { Media } from '@/types';

import {
  createdDirectories,
  fakeFileSystem,
  resetFakeFileSystem,
  setDocumentDirectoryUri,
} from './support/fakeFileSystem';

jest.mock('expo-file-system', () => require('./support/fakeFileSystem').expoFileSystemMock);

jest.mock('expo-image-manipulator', () => require('./support/fakeFileSystem').imageManipulatorMock);

const ORIGINAL_CONTAINER = 'file:///var/mobile/Containers/Data/Application/AAAA/Documents';
const REINSTALLED_CONTAINER = 'file:///var/mobile/Containers/Data/Application/BBBB/Documents';

beforeEach(() => {
  resetFakeFileSystem();
  setDocumentDirectoryUri(ORIGINAL_CONTAINER);
});

const importSamplePhoto = () =>
  importImageIntoAppStorage({
    uri: 'file:///tmp/picked/IMG_0001.HEIC',
    width: 1600,
    height: 1200,
  });

describe('importing a picked image', () => {
  it('stores relative paths, never absolute container paths', async () => {
    const media = await importSamplePhoto();

    expect(media.fullResolutionPath).toMatch(/^media\/[^/]+\.heic$/);
    expect(media.thumbnailPath).toMatch(/^media\/[^/]+-thumbnail\.jpg$/);
    expect(media.fullResolutionPath).not.toContain(ORIGINAL_CONTAINER);
    expect(media.thumbnailPath).not.toContain('file://');
  });

  it('creates the media directory and writes both files into it', async () => {
    const media = await importSamplePhoto();

    expect(createdDirectories()).toContain(`${ORIGINAL_CONTAINER}/media`);
    expect(fakeFileSystem.has(resolveMediaUri(media.fullResolutionPath))).toBe(true);
    expect(fakeFileSystem.has(resolveMediaUri(media.thumbnailPath))).toBe(true);
  });

  it('carries the picked dimensions onto the media record', async () => {
    const media = await importSamplePhoto();

    expect(media.width).toBe(1600);
    expect(media.height).toBe(1200);
  });

  it('gives each imported photo its own id and paths', async () => {
    const first = await importSamplePhoto();
    const second = await importSamplePhoto();

    expect(first.id).not.toBe(second.id);
    expect(first.fullResolutionPath).not.toBe(second.fullResolutionPath);
  });
});

describe('resolveMediaUri', () => {
  it('resolves a relative path against the current document directory', () => {
    expect(resolveMediaUri('media/photo.jpg')).toBe(`${ORIGINAL_CONTAINER}/media/photo.jpg`);
  });

  it('follows the document directory when iOS changes the container on reinstall', async () => {
    const media = await importSamplePhoto();
    const uriBeforeReinstall = resolveMediaUri(media.fullResolutionPath);

    setDocumentDirectoryUri(REINSTALLED_CONTAINER);
    const uriAfterReinstall = resolveMediaUri(media.fullResolutionPath);

    expect(uriBeforeReinstall).toContain('AAAA');
    expect(uriAfterReinstall).toContain('BBBB');
    expect(uriAfterReinstall).toBe(`${REINSTALLED_CONTAINER}/${media.fullResolutionPath}`);
  });

  it('does not double up the separator when the document directory ends in a slash', () => {
    setDocumentDirectoryUri(`${ORIGINAL_CONTAINER}/`);

    expect(resolveMediaUri('media/photo.jpg')).toBe(`${ORIGINAL_CONTAINER}/media/photo.jpg`);
  });
});

describe('importing an avatar', () => {
  const importSampleAvatar = () =>
    importAvatarIntoAppStorage({
      uri: 'file:///tmp/picked/AVATAR.HEIC',
      width: 1200,
      height: 1200,
    });

  it('stores a single downscaled file, leaving no full resolution copy behind', async () => {
    const avatarPath = await importSampleAvatar();

    expect(avatarPath).toMatch(/^media\/avatar-[^/]+\.jpg$/);
    expect(fakeFileSystem.size).toBe(1);
  });

  it('unlinks the avatar file when the account goes away', async () => {
    const avatarPath = await importSampleAvatar();

    deleteAvatarFile(avatarPath);

    expect(fakeFileSystem.size).toBe(0);
  });

  it('does nothing when an account never had an avatar', () => {
    expect(() => deleteAvatarFile(null)).not.toThrow();
  });
});

describe('deleting media', () => {
  it('unlinks the full resolution file and the thumbnail', async () => {
    const media = await importSamplePhoto();

    deleteMediaFiles([media]);

    expect(fakeFileSystem.has(resolveMediaUri(media.fullResolutionPath))).toBe(false);
    expect(fakeFileSystem.has(resolveMediaUri(media.thumbnailPath))).toBe(false);
  });

  it('unlinks every file of a multi-photo post', async () => {
    const carouselMedia = [await importSamplePhoto(), await importSamplePhoto()];

    deleteMediaFiles(carouselMedia);

    expect(fakeFileSystem.size).toBe(0);
  });

  it('ignores media whose files are already gone', async () => {
    const missingMedia: Media = {
      id: 'ghost',
      fullResolutionPath: 'media/ghost.jpg',
      thumbnailPath: 'media/ghost-thumbnail.jpg',
      width: 10,
      height: 10,
    };

    expect(() => deleteMediaFiles([missingMedia])).not.toThrow();
  });
});
