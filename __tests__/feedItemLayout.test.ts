import { CAROUSEL_DOTS_HEIGHT } from '@/components/CarouselDots';
import {
  aspectRatioClampedToPortraitLimit,
  captionBlockHeight,
  feedItemHeight,
  feedItemOffsets,
  mediaHeightFor,
} from '@/components/feedItemLayout';
import type { Media, Post } from '@/types';

const SCREEN_WIDTH = 390;

const buildMedia = (id: string, width = 1080, height = 1080): Media => ({
  id,
  fullResolutionPath: `media/${id}.jpg`,
  thumbnailPath: `media/${id}-thumbnail.jpg`,
  width,
  height,
});

const buildPost = (overrides: Partial<Post> & Pick<Post, 'id'>): Post => ({
  accountId: 'account-primary',
  media: [buildMedia('only')],
  gridCoverIndex: 0,
  caption: '',
  gridPosition: 0,
  isArchived: false,
  archivedAt: null,
  createdAt: 1_000,
  ...overrides,
});

describe('carousel aspect ratio', () => {
  it('shows a square photo square', () => {
    expect(aspectRatioClampedToPortraitLimit([buildMedia('square', 1080, 1080)])).toBe(1);
  });

  it('clamps a very tall photo to the Instagram portrait limit', () => {
    expect(aspectRatioClampedToPortraitLimit([buildMedia('tall', 1080, 2400)])).toBe(4 / 5);
  });

  it('leaves a landscape photo at its own ratio', () => {
    expect(aspectRatioClampedToPortraitLimit([buildMedia('wide', 1600, 900)])).toBeCloseTo(1.778);
  });

  it('falls back to square when there is no media', () => {
    expect(aspectRatioClampedToPortraitLimit([])).toBe(1);
  });
});

describe('media height', () => {
  it('gives a square photo the full screen width as its height', () => {
    expect(mediaHeightFor([buildMedia('square', 1080, 1080)], SCREEN_WIDTH)).toBe(SCREEN_WIDTH);
  });

  it('gives a portrait photo more height than a square one', () => {
    const portraitHeight = mediaHeightFor([buildMedia('portrait', 1080, 1350)], SCREEN_WIDTH);

    expect(portraitHeight).toBeGreaterThan(SCREEN_WIDTH);
  });

  it('rounds to whole pixels so offsets cannot drift', () => {
    const height = mediaHeightFor([buildMedia('wide', 1600, 900)], 393);

    expect(Number.isInteger(height)).toBe(true);
  });
});

describe('caption block height', () => {
  it('takes no room when there is no caption', () => {
    expect(captionBlockHeight('')).toBe(0);
  });

  it('reserves the same two lines whatever the caption length', () => {
    const shortCaption = captionBlockHeight('Morning light');
    const longCaption = captionBlockHeight('Morning light '.repeat(40));

    expect(shortCaption).toBe(longCaption);
    expect(shortCaption).toBeGreaterThan(0);
  });
});

describe('feed item height', () => {
  it('adds a caption block when the post has a caption', () => {
    const withoutCaption = buildPost({ id: 'plain' });
    const withCaption = buildPost({ id: 'captioned', caption: 'Morning light' });

    expect(feedItemHeight(withCaption, SCREEN_WIDTH) - feedItemHeight(withoutCaption, SCREEN_WIDTH))
      .toBe(captionBlockHeight('Morning light'));
  });

  it('is exactly one dot row taller for a carousel than for a single photo', () => {
    const singlePhoto = buildPost({ id: 'single', media: [buildMedia('a')] });
    const carousel = buildPost({ id: 'carousel', media: [buildMedia('a'), buildMedia('b')] });

    expect(feedItemHeight(carousel, SCREEN_WIDTH) - feedItemHeight(singlePhoto, SCREEN_WIDTH)).toBe(
      CAROUSEL_DOTS_HEIGHT
    );
  });

  it('grows with the screen width', () => {
    const post = buildPost({ id: 'square' });

    expect(feedItemHeight(post, 800)).toBeGreaterThan(feedItemHeight(post, 390));
  });
});

describe('feed item offsets', () => {
  const feedPosts = [
    buildPost({ id: 'first', media: [buildMedia('a', 1080, 1080)] }),
    buildPost({ id: 'second', media: [buildMedia('b', 1080, 1350)], caption: 'Second' }),
    buildPost({ id: 'third', media: [buildMedia('c', 1600, 900), buildMedia('d')] }),
  ];

  it('starts the first post at the top of the list', () => {
    expect(feedItemOffsets(feedPosts, SCREEN_WIDTH).starts[0]).toBe(0);
  });

  it('starts each post at the sum of every height before it', () => {
    const { heights, starts } = feedItemOffsets(feedPosts, SCREEN_WIDTH);

    starts.forEach((start, index) => {
      const heightAbove = heights.slice(0, index).reduce((total, height) => total + height, 0);
      expect(start).toBe(heightAbove);
    });
  });

  it('measures every post in the feed', () => {
    const { heights } = feedItemOffsets(feedPosts, SCREEN_WIDTH);

    expect(heights).toHaveLength(feedPosts.length);
    expect(heights).toEqual(feedPosts.map((post) => feedItemHeight(post, SCREEN_WIDTH)));
  });

  it('measures an empty feed without throwing', () => {
    expect(feedItemOffsets([], SCREEN_WIDTH)).toEqual({ heights: [], starts: [] });
  });
});
