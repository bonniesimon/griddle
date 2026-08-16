import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { THUMBNAIL_MAX_EDGE_PX, type Media, type RelativeMediaPath } from '@/types';

import { createId } from './createId';
import { eraseBlob, readAllBlobs, writeBlob } from './mediaDatabase.web';

const MEDIA_DIRECTORY_NAME = 'media';
const THUMBNAIL_COMPRESSION_QUALITY = 0.8;

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

const browserUrlByMediaPath = new Map<RelativeMediaPath, string>();

export const resolveMediaUri = (relativePath: RelativeMediaPath) =>
  browserUrlByMediaPath.get(relativePath) ?? '';

export const primeMediaCache = async () => {
  const storedFiles = await readAllBlobs();
  storedFiles.forEach(([relativePath, contents]) => {
    if (browserUrlByMediaPath.has(relativePath)) return;
    browserUrlByMediaPath.set(relativePath, URL.createObjectURL(contents));
  });
};

const mediaPathFor = (fileName: string): RelativeMediaPath => `${MEDIA_DIRECTORY_NAME}/${fileName}`;

const resizeToThumbnailEdge = (width: number, height: number) =>
  width >= height
    ? { width: Math.min(width, THUMBNAIL_MAX_EDGE_PX) }
    : { height: Math.min(height, THUMBNAIL_MAX_EDGE_PX) };

const extensionForMimeType = (mimeType: string) => {
  const subtype = mimeType.split('/')[1] ?? '';
  return /^[a-z0-9]{1,5}$/.test(subtype) ? subtype : 'jpg';
};

const storeBlobAsMedia = async (contents: Blob, fileNameStem: string) => {
  const relativePath = mediaPathFor(`${fileNameStem}.${extensionForMimeType(contents.type)}`);
  await writeBlob(relativePath, contents);
  browserUrlByMediaPath.set(relativePath, URL.createObjectURL(contents));
  return relativePath;
};

const blobFromUri = async (uri: string) => (await fetch(uri)).blob();

const writeDownscaledCopy = async (picked: PickedImage, fileNameStem: string) => {
  const rendered = await ImageManipulator.manipulate(picked.uri)
    .resize(resizeToThumbnailEdge(picked.width, picked.height))
    .renderAsync();
  const saved = await rendered.saveAsync({
    compress: THUMBNAIL_COMPRESSION_QUALITY,
    format: SaveFormat.JPEG,
  });
  return storeBlobAsMedia(await blobFromUri(saved.uri), fileNameStem);
};

export const importImageIntoAppStorage = async (picked: PickedImage): Promise<Media> => {
  const mediaId = createId();
  const fullResolutionPath = await storeBlobAsMedia(await blobFromUri(picked.uri), mediaId);
  const thumbnailPath = await writeDownscaledCopy(picked, `${mediaId}-thumbnail`);

  return {
    id: mediaId,
    fullResolutionPath,
    thumbnailPath,
    width: picked.width,
    height: picked.height,
  };
};

export const importAvatarIntoAppStorage = (picked: PickedImage) =>
  writeDownscaledCopy(picked, `avatar-${createId()}`);

const forgetMediaFile = (relativePath: RelativeMediaPath) => {
  const browserUrl = browserUrlByMediaPath.get(relativePath);
  if (browserUrl) URL.revokeObjectURL(browserUrl);
  browserUrlByMediaPath.delete(relativePath);
  void eraseBlob(relativePath);
};

export const deleteMediaFiles = (mediaItems: Media[]) => {
  mediaItems.forEach((media) => {
    forgetMediaFile(media.fullResolutionPath);
    forgetMediaFile(media.thumbnailPath);
  });
};

export const deleteAvatarFile = (avatarPath: RelativeMediaPath | null) => {
  if (avatarPath) forgetMediaFile(avatarPath);
};
