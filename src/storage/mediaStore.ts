import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { THUMBNAIL_MAX_EDGE_PX, type Media, type RelativeMediaPath } from '@/types';

import { createId } from './createId';

const MEDIA_DIRECTORY_NAME = 'media';
const THUMBNAIL_COMPRESSION_QUALITY = 0.8;

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

const withoutTrailingSlash = (uri: string) => (uri.endsWith('/') ? uri.slice(0, -1) : uri);

export const resolveMediaUri = (relativePath: RelativeMediaPath) =>
  `${withoutTrailingSlash(Paths.document.uri)}/${relativePath}`;

export const primeMediaCache = async () => {};

const ensureMediaDirectoryExists = () => {
  const mediaDirectory = new Directory(Paths.document, MEDIA_DIRECTORY_NAME);
  if (!mediaDirectory.exists) {
    mediaDirectory.create({ intermediates: true, idempotent: true });
  }
  return mediaDirectory;
};

const mediaPathFor = (fileName: string): RelativeMediaPath => `${MEDIA_DIRECTORY_NAME}/${fileName}`;

const resizeToThumbnailEdge = (width: number, height: number) =>
  width >= height
    ? { width: Math.min(width, THUMBNAIL_MAX_EDGE_PX) }
    : { height: Math.min(height, THUMBNAIL_MAX_EDGE_PX) };

const copyIntoMediaDirectory = (sourceUri: string, relativePath: RelativeMediaPath) => {
  const destination = new File(resolveMediaUri(relativePath));
  if (destination.exists) destination.delete();
  new File(sourceUri).copySync(destination);
  return relativePath;
};

const writeDownscaledCopy = async (picked: PickedImage, fileNameStem: string) => {
  const rendered = await ImageManipulator.manipulate(picked.uri)
    .resize(resizeToThumbnailEdge(picked.width, picked.height))
    .renderAsync();
  const saved = await rendered.saveAsync({
    compress: THUMBNAIL_COMPRESSION_QUALITY,
    format: SaveFormat.JPEG,
  });
  return copyIntoMediaDirectory(saved.uri, mediaPathFor(`${fileNameStem}.jpg`));
};

const extensionOf = (uri: string) => {
  const withoutQuery = uri.split('?')[0] ?? uri;
  const lastDotIndex = withoutQuery.lastIndexOf('.');
  const extension = lastDotIndex === -1 ? '' : withoutQuery.slice(lastDotIndex + 1).toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(extension) ? extension : 'jpg';
};

export const importImageIntoAppStorage = async (picked: PickedImage): Promise<Media> => {
  ensureMediaDirectoryExists();
  const mediaId = createId();
  const fullResolutionPath = copyIntoMediaDirectory(
    picked.uri,
    mediaPathFor(`${mediaId}.${extensionOf(picked.uri)}`)
  );
  const thumbnailPath = await writeDownscaledCopy(picked, `${mediaId}-thumbnail`);

  return {
    id: mediaId,
    fullResolutionPath,
    thumbnailPath,
    width: picked.width,
    height: picked.height,
  };
};

export const importAvatarIntoAppStorage = async (picked: PickedImage) => {
  ensureMediaDirectoryExists();
  return writeDownscaledCopy(picked, `avatar-${createId()}`);
};

const deleteFileIfPresent = (relativePath: RelativeMediaPath) => {
  const file = new File(resolveMediaUri(relativePath));
  if (file.exists) file.delete();
};

export const deleteMediaFiles = (mediaItems: Media[]) => {
  mediaItems.forEach((media) => {
    deleteFileIfPresent(media.fullResolutionPath);
    deleteFileIfPresent(media.thumbnailPath);
  });
};

export const deleteAvatarFile = (avatarPath: RelativeMediaPath | null) => {
  if (avatarPath) deleteFileIfPresent(avatarPath);
};
