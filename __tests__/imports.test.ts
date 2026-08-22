import {
  MAX_MEDIA_PER_IMPORT,
  MAX_MEDIA_PER_POST,
  canGroupIntoOneCarousel,
  describeChosenMode,
  describeImportOutcome,
  describeSelectedPhotos,
  photoCapacityFor,
} from '@/types';

describe('photo capacity per import mode', () => {
  it('caps a carousel at the Instagram limit', () => {
    expect(photoCapacityFor('oneCarousel')).toBe(MAX_MEDIA_PER_POST);
  });

  it('lets a batch of separate posts run to the import limit', () => {
    expect(photoCapacityFor('separatePosts')).toBe(MAX_MEDIA_PER_IMPORT);
  });

  it('allows the full batch before a mode is chosen', () => {
    expect(photoCapacityFor(null)).toBe(MAX_MEDIA_PER_IMPORT);
  });
});

describe('carousel availability', () => {
  it('allows exactly the carousel limit', () => {
    expect(canGroupIntoOneCarousel(MAX_MEDIA_PER_POST)).toBe(true);
  });

  it('refuses one photo past the carousel limit', () => {
    expect(canGroupIntoOneCarousel(MAX_MEDIA_PER_POST + 1)).toBe(false);
  });
});

describe('describing what saving will create', () => {
  it('keeps the original label for a single photo', () => {
    expect(describeImportOutcome(null, 1)).toBe('Add to grid');
    expect(describeImportOutcome('separatePosts', 1)).toBe('Add to grid');
  });

  it('counts the posts a separate-posts batch will create', () => {
    expect(describeImportOutcome('separatePosts', 2)).toBe('Add 2 posts');
    expect(describeImportOutcome('separatePosts', 12)).toBe('Add 12 posts');
  });

  it('names one post and its photo count for a carousel', () => {
    expect(describeImportOutcome('oneCarousel', 4)).toBe('Add 1 post · 4 photos');
  });
});

describe('describing the chosen mode and the selection', () => {
  it('counts separate posts and names the carousel', () => {
    expect(describeChosenMode('separatePosts', 12)).toBe('12 separate posts');
    expect(describeChosenMode('oneCarousel', 4)).toBe('One carousel');
  });

  it('pluralises the selected photo count', () => {
    expect(describeSelectedPhotos(1)).toBe('1 photo selected');
    expect(describeSelectedPhotos(4)).toBe('4 photos selected');
  });
});
