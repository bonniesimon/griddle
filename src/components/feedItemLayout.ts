import { avatarDiameter, spacing, typeScale } from '@/theme/tokens';
import { hasMultipleMedia, type Media, type Post } from '@/types';

import { CAROUSEL_DOTS_HEIGHT } from './CarouselDots';

const TALLEST_ALLOWED_ASPECT_RATIO = 4 / 5;

export const CAPTION_LINE_LIMIT = 2;
export const CAPTION_LINE_HEIGHT = typeScale.body + 5;

export const FEED_AUTHOR_ROW_HEIGHT = avatarDiameter.postDetail + spacing.snug * 2;
export const FEED_ACTION_ROW_HEIGHT = typeScale.count + spacing.snug * 2;
export const FEED_CAPTION_BLOCK_HEIGHT = CAPTION_LINE_HEIGHT * CAPTION_LINE_LIMIT + spacing.snug;
export const FEED_ITEM_TRAILING_SPACE = spacing.regular;

export const aspectRatioClampedToPortraitLimit = (media: Media[]) => {
  const firstMedia = media[0];
  if (!firstMedia || firstMedia.height === 0) return 1;
  return Math.max(firstMedia.width / firstMedia.height, TALLEST_ALLOWED_ASPECT_RATIO);
};

export const mediaHeightFor = (media: Media[], screenWidth: number) =>
  Math.round(screenWidth / aspectRatioClampedToPortraitLimit(media));

export const captionBlockHeight = (caption: string) =>
  caption.length > 0 ? FEED_CAPTION_BLOCK_HEIGHT : 0;

export const feedItemHeight = (post: Post, screenWidth: number) =>
  FEED_AUTHOR_ROW_HEIGHT +
  mediaHeightFor(post.media, screenWidth) +
  (hasMultipleMedia(post) ? CAROUSEL_DOTS_HEIGHT : 0) +
  FEED_ACTION_ROW_HEIGHT +
  captionBlockHeight(post.caption) +
  FEED_ITEM_TRAILING_SPACE;

export const feedItemOffsets = (posts: Post[], screenWidth: number) => {
  const heights = posts.map((post) => feedItemHeight(post, screenWidth));
  const starts: number[] = [];
  let nextStart = 0;

  for (const height of heights) {
    starts.push(nextStart);
    nextStart += height;
  }

  return { heights, starts };
};
