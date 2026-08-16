export const MAX_MEDIA_PER_POST = 10;
export const THUMBNAIL_MAX_EDGE_PX = 400;
export const GRID_COLUMN_COUNT = 3;

export type RelativeMediaPath = string;
export type EpochMillis = number;

export type Account = {
  id: string;
  displayName: string;
  handleWithoutAtSign: string;
  avatarPath: RelativeMediaPath | null;
  bio: string;
  displayedFollowerCount: number;
  displayedFollowingCount: number;
  createdAt: EpochMillis;
};

export type Media = {
  id: string;
  fullResolutionPath: RelativeMediaPath;
  thumbnailPath: RelativeMediaPath;
  width: number;
  height: number;
};

export type Post = {
  id: string;
  accountId: string;
  media: Media[];
  gridCoverIndex: number;
  caption: string;
  gridPosition: number;
  isArchived: boolean;
  archivedAt: EpochMillis | null;
  createdAt: EpochMillis;
};

export const formatHandle = (handleWithoutAtSign: string) => `@${handleWithoutAtSign}`;

export const coverMediaOf = (post: Post): Media | undefined =>
  post.media[post.gridCoverIndex] ?? post.media[0];

export const hasMultipleMedia = (post: Post) => post.media.length > 1;
