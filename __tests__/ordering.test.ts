import {
  addPostsToTopOfGrid,
  archivePost,
  archivedPostsNewestFirst,
  gridPostsInDisplayOrder,
  moveMediaWithinPost,
  movePostToGridPosition,
  reindexGridPositions,
  removePost,
  removePostsOfAccount,
  restorePost,
  unarchivedPostCount,
} from '@/store/ordering';
import type { Media, Post } from '@/types';

const ACCOUNT = 'account-primary';
const OTHER_ACCOUNT = 'account-secondary';

const buildPost = (overrides: Partial<Post> & Pick<Post, 'id' | 'gridPosition'>): Post => ({
  accountId: ACCOUNT,
  media: [],
  gridCoverIndex: 0,
  caption: '',
  isArchived: false,
  archivedAt: null,
  createdAt: 1_000,
  ...overrides,
});

const buildGrid = (postCount: number, accountId = ACCOUNT) =>
  Array.from({ length: postCount }, (_, index) =>
    buildPost({ id: `${accountId}-post-${index}`, gridPosition: index, accountId })
  );

const gridIdsInOrder = (posts: Post[], accountId = ACCOUNT) =>
  gridPostsInDisplayOrder(posts, accountId).map((post) => post.id);

const gridPositions = (posts: Post[], accountId = ACCOUNT) =>
  gridPostsInDisplayOrder(posts, accountId).map((post) => post.gridPosition);

describe('grid ordering', () => {
  it('reads the grid in ascending gridPosition regardless of array order', () => {
    const shuffled = [
      buildPost({ id: 'c', gridPosition: 2 }),
      buildPost({ id: 'a', gridPosition: 0 }),
      buildPost({ id: 'b', gridPosition: 1 }),
    ];

    expect(gridIdsInOrder(shuffled)).toEqual(['a', 'b', 'c']);
  });

  it('reindexes to a contiguous 0..n-1 range', () => {
    const withGaps = [
      buildPost({ id: 'a', gridPosition: 4 }),
      buildPost({ id: 'b', gridPosition: 9 }),
      buildPost({ id: 'c', gridPosition: 11 }),
    ];

    expect(gridPositions(reindexGridPositions(withGaps, ACCOUNT))).toEqual([0, 1, 2]);
  });

  it('adds a new post at the top-left and pushes the rest down', () => {
    const grid = buildGrid(3);
    const newPost = buildPost({ id: 'fresh', gridPosition: 0 });

    const withNewPost = addPostsToTopOfGrid(grid, [newPost]);

    expect(gridIdsInOrder(withNewPost)).toEqual([
      'fresh',
      'account-primary-post-0',
      'account-primary-post-1',
      'account-primary-post-2',
    ]);
    expect(gridPositions(withNewPost)).toEqual([0, 1, 2, 3]);
  });

  it('keeps a batch in pick order rather than reversing it', () => {
    const grid = buildGrid(2);
    const batch = ['first', 'second', 'third'].map((id) => buildPost({ id, gridPosition: 0 }));

    const withBatch = addPostsToTopOfGrid(grid, batch);

    expect(gridIdsInOrder(withBatch)).toEqual([
      'first',
      'second',
      'third',
      'account-primary-post-0',
      'account-primary-post-1',
    ]);
  });

  it('reindexes positions contiguously across the batch and the existing grid', () => {
    const batch = ['first', 'second'].map((id) => buildPost({ id, gridPosition: 0 }));

    const withBatch = addPostsToTopOfGrid(buildGrid(3), batch);

    expect(gridPositions(withBatch)).toEqual([0, 1, 2, 3, 4]);
  });

  it('leaves the grid untouched for an empty batch', () => {
    const grid = buildGrid(3);

    expect(addPostsToTopOfGrid(grid, [])).toBe(grid);
  });

  it('leaves other accounts and archived posts alone', () => {
    const grid = [
      ...buildGrid(2),
      ...buildGrid(2, OTHER_ACCOUNT),
      buildPost({ id: 'archived', gridPosition: 5, isArchived: true, archivedAt: 2_000 }),
    ];

    const withBatch = addPostsToTopOfGrid(grid, [buildPost({ id: 'fresh', gridPosition: 0 })]);

    expect(gridIdsInOrder(withBatch, OTHER_ACCOUNT)).toEqual([
      'account-secondary-post-0',
      'account-secondary-post-1',
    ]);
    expect(withBatch.find((post) => post.id === 'archived')?.gridPosition).toBe(5);
  });
});

describe('moving posts', () => {
  it('moves a post from the end to the start and stays contiguous', () => {
    const grid = buildGrid(9);

    const reordered = movePostToGridPosition(grid, 'account-primary-post-8', 0);

    expect(gridIdsInOrder(reordered)[0]).toBe('account-primary-post-8');
    expect(gridPositions(reordered)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('moves a post forward without leaving a duplicate position', () => {
    const grid = buildGrid(5);

    const reordered = movePostToGridPosition(grid, 'account-primary-post-1', 3);

    expect(gridIdsInOrder(reordered)).toEqual([
      'account-primary-post-0',
      'account-primary-post-2',
      'account-primary-post-3',
      'account-primary-post-1',
      'account-primary-post-4',
    ]);
    expect(gridPositions(reordered)).toEqual([0, 1, 2, 3, 4]);
  });

  it('clamps a target position past the end of the grid', () => {
    const grid = buildGrid(3);

    const reordered = movePostToGridPosition(grid, 'account-primary-post-0', 99);

    expect(gridIdsInOrder(reordered)).toEqual([
      'account-primary-post-1',
      'account-primary-post-2',
      'account-primary-post-0',
    ]);
  });

  it('leaves the grid untouched for an unknown post id', () => {
    const grid = buildGrid(3);

    expect(movePostToGridPosition(grid, 'does-not-exist', 0)).toEqual(grid);
  });
});

describe('archive and restore', () => {
  it('closes the gap in the grid but remembers the archived slot', () => {
    const grid = buildGrid(5);

    const afterArchive = archivePost(grid, 'account-primary-post-2', 5_000);

    expect(gridIdsInOrder(afterArchive)).toEqual([
      'account-primary-post-0',
      'account-primary-post-1',
      'account-primary-post-3',
      'account-primary-post-4',
    ]);
    expect(gridPositions(afterArchive)).toEqual([0, 1, 2, 3]);

    const archived = afterArchive.find((post) => post.id === 'account-primary-post-2');
    expect(archived?.isArchived).toBe(true);
    expect(archived?.gridPosition).toBe(2);
    expect(archived?.archivedAt).toBe(5_000);
  });

  it('restores a middle post back into its original slot', () => {
    const grid = buildGrid(5);

    const afterArchive = archivePost(grid, 'account-primary-post-2', 5_000);
    const afterRestore = restorePost(afterArchive, 'account-primary-post-2');

    expect(gridIdsInOrder(afterRestore)).toEqual([
      'account-primary-post-0',
      'account-primary-post-1',
      'account-primary-post-2',
      'account-primary-post-3',
      'account-primary-post-4',
    ]);
    expect(gridPositions(afterRestore)).toEqual([0, 1, 2, 3, 4]);
  });

  it('drops the archived post out of the visible post count', () => {
    const grid = buildGrid(4);

    expect(unarchivedPostCount(archivePost(grid, 'account-primary-post-0', 1), ACCOUNT)).toBe(3);
  });

  it('lands sensibly when the grid is reordered while a post is archived', () => {
    const grid = buildGrid(5);

    const afterArchive = archivePost(grid, 'account-primary-post-1', 5_000);
    const afterReorder = movePostToGridPosition(afterArchive, 'account-primary-post-4', 0);
    const afterRestore = restorePost(afterReorder, 'account-primary-post-1');

    expect(gridIdsInOrder(afterRestore)).toEqual([
      'account-primary-post-4',
      'account-primary-post-1',
      'account-primary-post-0',
      'account-primary-post-2',
      'account-primary-post-3',
    ]);
    expect(gridPositions(afterRestore)).toEqual([0, 1, 2, 3, 4]);
  });

  it('clamps a restore whose remembered slot is now past the end of the grid', () => {
    const grid = buildGrid(5);

    const afterArchive = archivePost(grid, 'account-primary-post-4', 5_000);
    const shrunk = removePost(
      removePost(afterArchive, 'account-primary-post-0'),
      'account-primary-post-1'
    );
    const afterRestore = restorePost(shrunk, 'account-primary-post-4');

    expect(gridIdsInOrder(afterRestore)).toEqual([
      'account-primary-post-2',
      'account-primary-post-3',
      'account-primary-post-4',
    ]);
    expect(gridPositions(afterRestore)).toEqual([0, 1, 2]);
  });

  it('lists archived posts newest first', () => {
    const grid = buildGrid(4);

    const afterArchives = archivePost(
      archivePost(archivePost(grid, 'account-primary-post-0', 100), 'account-primary-post-3', 300),
      'account-primary-post-1',
      200
    );

    expect(archivedPostsNewestFirst(afterArchives, ACCOUNT).map((post) => post.id)).toEqual([
      'account-primary-post-3',
      'account-primary-post-1',
      'account-primary-post-0',
    ]);
  });

  it('ignores archiving a post that is already archived', () => {
    const grid = buildGrid(3);
    const afterArchive = archivePost(grid, 'account-primary-post-0', 100);

    expect(archivePost(afterArchive, 'account-primary-post-0', 999)).toEqual(afterArchive);
  });

  it('ignores restoring a post that is not archived', () => {
    const grid = buildGrid(3);

    expect(restorePost(grid, 'account-primary-post-0')).toEqual(grid);
  });
});

describe('deletion', () => {
  it('reindexes the grid after removing a post', () => {
    const grid = buildGrid(4);

    const afterRemoval = removePost(grid, 'account-primary-post-1');

    expect(gridIdsInOrder(afterRemoval)).toEqual([
      'account-primary-post-0',
      'account-primary-post-2',
      'account-primary-post-3',
    ]);
    expect(gridPositions(afterRemoval)).toEqual([0, 1, 2]);
  });

  it('removes every post belonging to a deleted account and no others', () => {
    const posts = [...buildGrid(3), ...buildGrid(2, OTHER_ACCOUNT)];

    const remaining = removePostsOfAccount(posts, ACCOUNT);

    expect(remaining).toHaveLength(2);
    expect(remaining.every((post) => post.accountId === OTHER_ACCOUNT)).toBe(true);
  });
});

describe('account isolation', () => {
  it('never mixes posts from another account into the grid', () => {
    const posts = [...buildGrid(3), ...buildGrid(4, OTHER_ACCOUNT)];

    expect(gridIdsInOrder(posts)).toHaveLength(3);
    expect(gridIdsInOrder(posts, OTHER_ACCOUNT)).toHaveLength(4);
  });

  it('leaves the other account untouched when reordering', () => {
    const posts = [...buildGrid(3), ...buildGrid(3, OTHER_ACCOUNT)];

    const reordered = movePostToGridPosition(posts, 'account-primary-post-2', 0);

    expect(gridIdsInOrder(reordered, OTHER_ACCOUNT)).toEqual([
      'account-secondary-post-0',
      'account-secondary-post-1',
      'account-secondary-post-2',
    ]);
    expect(gridPositions(reordered, OTHER_ACCOUNT)).toEqual([0, 1, 2]);
  });

  it('leaves the other account untouched when archiving', () => {
    const posts = [...buildGrid(3), ...buildGrid(3, OTHER_ACCOUNT)];

    const afterArchive = archivePost(posts, 'account-primary-post-0', 100);

    expect(gridPositions(afterArchive, OTHER_ACCOUNT)).toEqual([0, 1, 2]);
    expect(archivedPostsNewestFirst(afterArchive, OTHER_ACCOUNT)).toHaveLength(0);
  });
});

describe('media ordering within a post', () => {
  const buildMedia = (id: string): Media => ({
    id,
    fullResolutionPath: `media/${id}.jpg`,
    thumbnailPath: `media/${id}-thumbnail.jpg`,
    width: 1080,
    height: 1080,
  });

  const postWithMedia = (gridCoverIndex: number) =>
    buildPost({
      id: 'carousel',
      gridPosition: 0,
      gridCoverIndex,
      media: [buildMedia('one'), buildMedia('two'), buildMedia('three')],
    });

  it('moves a photo and keeps the same photo as the cover', () => {
    const moved = moveMediaWithinPost(postWithMedia(0), 0, 2);

    expect(moved.media.map((media) => media.id)).toEqual(['two', 'three', 'one']);
    expect(moved.gridCoverIndex).toBe(2);
  });

  it('keeps a non-moving cover pointing at the same photo', () => {
    const moved = moveMediaWithinPost(postWithMedia(2), 0, 1);

    expect(moved.media.map((media) => media.id)).toEqual(['two', 'one', 'three']);
    expect(moved.gridCoverIndex).toBe(2);
  });

  it('leaves the post untouched when the source index is out of range', () => {
    const post = postWithMedia(0);

    expect(moveMediaWithinPost(post, 9, 0)).toEqual(post);
  });
});
