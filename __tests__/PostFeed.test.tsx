import { fireEvent, render, screen } from '@testing-library/react-native';

import { PostFeed } from '@/components/PostFeed';
import { useAppStore } from '@/store/useAppStore';
import type { Account, Media, Post } from '@/types';

jest.mock('@/storage/mediaStore', () => ({
  resolveMediaUri: (relativePath: string) => `file:///documents/${relativePath}`,
  deleteMediaFiles: jest.fn(),
  deleteAvatarFile: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

const ACCOUNT: Account = {
  id: 'account-primary',
  displayName: 'Planner',
  handleWithoutAtSign: 'planner',
  avatarPath: null,
  bio: '',
  displayedFollowerCount: 0,
  displayedFollowingCount: 0,
  createdAt: 1,
};

const buildMedia = (id: string): Media => ({
  id,
  fullResolutionPath: `media/${id}.jpg`,
  thumbnailPath: `media/${id}-thumbnail.jpg`,
  width: 1080,
  height: 1080,
});

const buildPost = (overrides: Partial<Post> & Pick<Post, 'id' | 'gridPosition'>): Post => ({
  accountId: ACCOUNT.id,
  media: [buildMedia(`${overrides.id}-photo`)],
  gridCoverIndex: 0,
  caption: '',
  isArchived: false,
  archivedAt: null,
  createdAt: 1,
  ...overrides,
});

const buildGrid = (postCount: number) =>
  Array.from({ length: postCount }, (_, index) =>
    buildPost({ id: `post-${index}`, gridPosition: index })
  );

const showFeedAnchoredAt = async (anchorPost: Post, posts: Post[]) => {
  useAppStore.setState({ accounts: [ACCOUNT], posts, activeAccountId: ACCOUNT.id });
  await render(<PostFeed anchorPost={anchorPost} account={ACCOUNT} />);
};

describe('PostFeed', () => {
  it('opens on the tapped post rather than at the top of the grid', async () => {
    const posts = buildGrid(12);
    const anchorPost = buildPost({ id: 'anchor', gridPosition: 5 });

    await showFeedAnchoredAt(anchorPost, [...posts, anchorPost]);

    expect(screen.getByTestId('post-feed-item-anchor')).toBeTruthy();
  });

  it('leaves posts far from the anchor unrendered', async () => {
    const posts = buildGrid(12);
    const anchorPost = buildPost({ id: 'anchor', gridPosition: 5 });

    await showFeedAnchoredAt(anchorPost, [...posts, anchorPost]);

    expect(screen.queryByTestId('post-feed-item-post-0')).toBeNull();
    expect(screen.queryByTestId('post-feed-item-post-11')).toBeNull();
  });

  it('shows the caption of a post it renders', async () => {
    const anchorPost = buildPost({ id: 'anchor', gridPosition: 0, caption: 'Morning light' });

    await showFeedAnchoredAt(anchorPost, [anchorPost]);

    expect(screen.getByText(/Morning light/)).toBeTruthy();
  });

  it('shows carousel dots on a multi-photo post', async () => {
    const anchorPost = buildPost({
      id: 'anchor',
      gridPosition: 0,
      media: [buildMedia('a'), buildMedia('b')],
    });

    await showFeedAnchoredAt(anchorPost, [anchorPost]);

    expect(screen.getByTestId('carousel-dots')).toBeTruthy();
  });

  it('keeps the actions sheet closed until the post asks for it', async () => {
    const anchorPost = buildPost({ id: 'anchor', gridPosition: 0 });

    await showFeedAnchoredAt(anchorPost, [anchorPost]);

    expect(screen.queryByTestId('post-actions-edit')).toBeNull();
  });

  it('opens the actions sheet for the post whose control was tapped', async () => {
    const anchorPost = buildPost({ id: 'anchor', gridPosition: 0 });

    await showFeedAnchoredAt(anchorPost, [anchorPost]);
    fireEvent.press(screen.getByTestId('open-post-actions-anchor'));

    expect(await screen.findByTestId('post-actions-edit')).toBeTruthy();
    expect(screen.getByText('Archive')).toBeTruthy();
  });

  it('offers restore instead of archive when the feed is the archive', async () => {
    const anchorPost = buildPost({
      id: 'anchor',
      gridPosition: 0,
      isArchived: true,
      archivedAt: 5_000,
    });

    await showFeedAnchoredAt(anchorPost, [anchorPost]);
    fireEvent.press(screen.getByTestId('open-post-actions-anchor'));

    expect(await screen.findByText('Restore to grid')).toBeTruthy();
  });
});
