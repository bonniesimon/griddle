import { render, screen } from '@testing-library/react-native';

import { GridCell } from '@/components/GridCell';
import type { Media, Post } from '@/types';

jest.mock('@/storage/mediaStore', () => ({
  resolveMediaUri: (relativePath: string) => `file:///documents/${relativePath}`,
}));

const buildMedia = (id: string): Media => ({
  id,
  fullResolutionPath: `media/${id}.jpg`,
  thumbnailPath: `media/${id}-thumbnail.jpg`,
  width: 1080,
  height: 1080,
});

const buildPost = (media: Media[], gridCoverIndex = 0): Post => ({
  id: 'post-1',
  accountId: 'account-1',
  media,
  gridCoverIndex,
  caption: '',
  gridPosition: 0,
  isArchived: false,
  archivedAt: null,
  createdAt: 1_000,
});

describe('GridCell', () => {
  it('hides the carousel badge for a single-image post', async () => {
    await render(<GridCell post={buildPost([buildMedia('one')])} />);

    expect(screen.queryByTestId('carousel-badge')).toBeNull();
  });

  it('shows the carousel badge once a post has more than one image', async () => {
    await render(<GridCell post={buildPost([buildMedia('one'), buildMedia('two')])} />);

    expect(screen.getByTestId('carousel-badge')).toBeTruthy();
  });

  it('renders the media chosen as the grid cover, not simply the first', async () => {
    await render(<GridCell post={buildPost([buildMedia('one'), buildMedia('two')], 1)} />);

    expect(screen.getByTestId('grid-cell-image').props.source).toEqual([
      { uri: 'file:///documents/media/two-thumbnail.jpg' },
    ]);
  });

  it('falls back to the first image when the cover index is out of range', async () => {
    await render(<GridCell post={buildPost([buildMedia('one')], 7)} />);

    expect(screen.getByTestId('grid-cell-image').props.source).toEqual([
      { uri: 'file:///documents/media/one-thumbnail.jpg' },
    ]);
  });
});
