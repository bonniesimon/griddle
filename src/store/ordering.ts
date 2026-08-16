import type { EpochMillis, Post } from '@/types';

const byGridPositionAscending = (left: Post, right: Post) => left.gridPosition - right.gridPosition;

const byArchivedAtNewestFirst = (left: Post, right: Post) =>
  (right.archivedAt ?? right.createdAt) - (left.archivedAt ?? left.createdAt);

const belongsToAccount = (accountId: string) => (post: Post) => post.accountId === accountId;

const clampToRange = (value: number, lowestAllowed: number, highestAllowed: number) =>
  Math.min(Math.max(value, lowestAllowed), highestAllowed);

export const gridPostsInDisplayOrder = (posts: Post[], accountId: string) =>
  posts
    .filter(belongsToAccount(accountId))
    .filter((post) => !post.isArchived)
    .sort(byGridPositionAscending);

export const archivedPostsNewestFirst = (posts: Post[], accountId: string) =>
  posts
    .filter(belongsToAccount(accountId))
    .filter((post) => post.isArchived)
    .sort(byArchivedAtNewestFirst);

export const unarchivedPostCount = (posts: Post[], accountId: string) =>
  gridPostsInDisplayOrder(posts, accountId).length;

const withGridPositionsReassigned = (gridOrder: Post[]) =>
  gridOrder.map((post, index) =>
    post.gridPosition === index ? post : { ...post, gridPosition: index }
  );

const replacingPostsOf = (posts: Post[], accountId: string, replacementGridOrder: Post[]) => {
  const replacementsById = new Map(replacementGridOrder.map((post) => [post.id, post]));
  const untouched = posts.filter((post) => !replacementsById.has(post.id));
  return [...untouched, ...replacementGridOrder];
};

export const reindexGridPositions = (posts: Post[], accountId: string) =>
  replacingPostsOf(
    posts,
    accountId,
    withGridPositionsReassigned(gridPostsInDisplayOrder(posts, accountId))
  );

export const movePostToGridPosition = (posts: Post[], postId: string, targetPosition: number) => {
  const movingPost = posts.find((post) => post.id === postId);
  if (!movingPost || movingPost.isArchived) return posts;

  const gridOrder = gridPostsInDisplayOrder(posts, movingPost.accountId);
  const remaining = gridOrder.filter((post) => post.id !== postId);
  const insertionIndex = clampToRange(targetPosition, 0, remaining.length);
  remaining.splice(insertionIndex, 0, movingPost);

  return replacingPostsOf(posts, movingPost.accountId, withGridPositionsReassigned(remaining));
};

export const addPostToTopOfGrid = (posts: Post[], newPost: Post) => {
  const gridOrder = gridPostsInDisplayOrder(posts, newPost.accountId);
  const withNewPostFirst = [{ ...newPost, isArchived: false }, ...gridOrder];
  return replacingPostsOf(
    [...posts, newPost],
    newPost.accountId,
    withGridPositionsReassigned(withNewPostFirst)
  );
};

export const archivePost = (posts: Post[], postId: string, archivedAt: EpochMillis) => {
  const targetPost = posts.find((post) => post.id === postId);
  if (!targetPost || targetPost.isArchived) return posts;

  const withPostArchived = posts.map((post) =>
    post.id === postId ? { ...post, isArchived: true, archivedAt } : post
  );

  return reindexGridPositions(withPostArchived, targetPost.accountId);
};

export const restorePost = (posts: Post[], postId: string) => {
  const targetPost = posts.find((post) => post.id === postId);
  if (!targetPost || !targetPost.isArchived) return posts;

  const gridOrder = gridPostsInDisplayOrder(posts, targetPost.accountId);
  const restoredPost = { ...targetPost, isArchived: false, archivedAt: null };
  const insertionIndex = clampToRange(targetPost.gridPosition, 0, gridOrder.length);
  gridOrder.splice(insertionIndex, 0, restoredPost);

  const withoutTargetPost = posts.filter((post) => post.id !== postId);
  return replacingPostsOf(
    withoutTargetPost,
    targetPost.accountId,
    withGridPositionsReassigned(gridOrder)
  );
};

export const removePost = (posts: Post[], postId: string) => {
  const targetPost = posts.find((post) => post.id === postId);
  if (!targetPost) return posts;

  const withoutTargetPost = posts.filter((post) => post.id !== postId);
  return reindexGridPositions(withoutTargetPost, targetPost.accountId);
};

export const removePostsOfAccount = (posts: Post[], accountId: string) =>
  posts.filter((post) => post.accountId !== accountId);

export const moveMediaWithinPost = (post: Post, fromIndex: number, toIndex: number): Post => {
  const reordered = [...post.media];
  const [movingMedia] = reordered.splice(fromIndex, 1);
  if (!movingMedia) return post;
  reordered.splice(clampToRange(toIndex, 0, reordered.length), 0, movingMedia);

  const coverMedia = post.media[post.gridCoverIndex];
  const gridCoverIndex = coverMedia
    ? reordered.findIndex((media) => media.id === coverMedia.id)
    : 0;

  return { ...post, media: reordered, gridCoverIndex: Math.max(gridCoverIndex, 0) };
};
