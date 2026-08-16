import { useAppStore } from './useAppStore';
import { archivedPostsNewestFirst, gridPostsInDisplayOrder, unarchivedPostCount } from './ordering';

export const useActiveAccount = () =>
  useAppStore((state) => state.accounts.find((account) => account.id === state.activeAccountId));

export const useAccounts = () => useAppStore((state) => state.accounts);

export const useGridPosts = () => {
  const activeAccountId = useAppStore((state) => state.activeAccountId);
  const posts = useAppStore((state) => state.posts);
  return activeAccountId ? gridPostsInDisplayOrder(posts, activeAccountId) : [];
};

export const useArchivedPosts = () => {
  const activeAccountId = useAppStore((state) => state.activeAccountId);
  const posts = useAppStore((state) => state.posts);
  return activeAccountId ? archivedPostsNewestFirst(posts, activeAccountId) : [];
};

export const useVisiblePostCount = () => {
  const activeAccountId = useAppStore((state) => state.activeAccountId);
  const posts = useAppStore((state) => state.posts);
  return activeAccountId ? unarchivedPostCount(posts, activeAccountId) : 0;
};

export const usePost = (postId: string | undefined) =>
  useAppStore((state) => state.posts.find((post) => post.id === postId));

export const useAccount = (accountId: string | undefined) =>
  useAppStore((state) => state.accounts.find((account) => account.id === accountId));

export const usePostCountForAccount = (accountId: string) =>
  useAppStore((state) => unarchivedPostCount(state.posts, accountId));
