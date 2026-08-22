import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createId } from '@/storage/createId';
import { deleteAvatarFile, deleteMediaFiles } from '@/storage/mediaStore';
import {
  PERSISTED_SCHEMA_VERSION,
  PERSISTED_STORE_KEY,
  migratePersistedState,
  persistedStorage,
} from '@/storage/persist';
import {
  MAX_MEDIA_PER_POST,
  type Account,
  type ImportMode,
  type Media,
  type Post,
} from '@/types';

import {
  addPostsToTopOfGrid as withPostsAddedToTopOfGrid,
  archivePost as withPostArchived,
  movePostToGridPosition as withPostMovedToGridPosition,
  moveMediaWithinPost as withMediaMovedWithinPost,
  removePost as withPostRemoved,
  removePostsOfAccount as withAccountPostsRemoved,
  restorePost as withPostRestored,
} from './ordering';

const DEFAULT_ACCOUNT_DISPLAY_NAME = 'My Account';
const DEFAULT_ACCOUNT_HANDLE = 'my.account';

export type AccountDraft = {
  displayName: string;
  handleWithoutAtSign: string;
  bio: string;
  avatarPath: string | null;
  displayedFollowerCount: number;
  displayedFollowingCount: number;
};

type AppState = {
  accounts: Account[];
  posts: Post[];
  activeAccountId: string | null;
  hasHydrated: boolean;
  createAccount: (draft: Partial<AccountDraft>) => Account;
  updateAccount: (accountId: string, changes: Partial<AccountDraft>) => void;
  deleteAccount: (accountId: string) => void;
  switchToAccount: (accountId: string) => void;
  ensureAtLeastOneAccountExists: () => void;
  createPostsFromImport: (media: Media[], caption: string, importMode: ImportMode | null) => Post[];
  updateCaption: (postId: string, caption: string) => void;
  setGridCoverIndex: (postId: string, gridCoverIndex: number) => void;
  moveMediaWithinPost: (postId: string, fromIndex: number, toIndex: number) => void;
  movePostToGridPosition: (postId: string, targetPosition: number) => void;
  archivePost: (postId: string) => void;
  restorePost: (postId: string) => void;
  deletePost: (postId: string) => void;
  replaceEverythingFromBackup: (accounts: Account[], posts: Post[]) => void;
};

const emptyAccountDraft = (): AccountDraft => ({
  displayName: DEFAULT_ACCOUNT_DISPLAY_NAME,
  handleWithoutAtSign: DEFAULT_ACCOUNT_HANDLE,
  bio: '',
  avatarPath: null,
  displayedFollowerCount: 0,
  displayedFollowingCount: 0,
});

const buildAccount = (draft: Partial<AccountDraft>): Account => ({
  ...emptyAccountDraft(),
  ...draft,
  id: createId(),
  createdAt: Date.now(),
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      accounts: [],
      posts: [],
      activeAccountId: null,
      hasHydrated: false,

      createAccount: (draft) => {
        const account = buildAccount(draft);
        set((state) => ({
          accounts: [...state.accounts, account],
          activeAccountId: state.activeAccountId ?? account.id,
        }));
        return account;
      },

      updateAccount: (accountId, changes) => {
        const replacedAccount = get().accounts.find((account) => account.id === accountId);
        const isReplacingAvatar =
          replacedAccount &&
          changes.avatarPath !== undefined &&
          changes.avatarPath !== replacedAccount.avatarPath;
        if (isReplacingAvatar) deleteAvatarFile(replacedAccount.avatarPath);

        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === accountId ? { ...account, ...changes } : account
          ),
        }));
      },

      deleteAccount: (accountId) => {
        const state = get();
        const removedAccount = state.accounts.find((account) => account.id === accountId);
        if (!removedAccount) return;

        state.posts
          .filter((post) => post.accountId === accountId)
          .forEach((post) => deleteMediaFiles(post.media));
        deleteAvatarFile(removedAccount.avatarPath);

        const remainingAccounts = state.accounts.filter((account) => account.id !== accountId);
        set({
          accounts: remainingAccounts,
          posts: withAccountPostsRemoved(state.posts, accountId),
          activeAccountId:
            state.activeAccountId === accountId
              ? (remainingAccounts[0]?.id ?? null)
              : state.activeAccountId,
        });
      },

      switchToAccount: (accountId) => set({ activeAccountId: accountId }),

      ensureAtLeastOneAccountExists: () => {
        const state = get();
        if (state.accounts.length > 0) {
          if (!state.accounts.some((account) => account.id === state.activeAccountId)) {
            set({ activeAccountId: state.accounts[0]?.id ?? null });
          }
          return;
        }
        state.createAccount({});
      },

      createPostsFromImport: (media, caption, importMode) => {
        const { activeAccountId } = get();
        if (!activeAccountId || media.length === 0) return [];

        const buildPost = (postMedia: Media[], postCaption: string, gridPosition: number): Post => ({
          id: createId(),
          accountId: activeAccountId,
          media: postMedia,
          gridCoverIndex: 0,
          caption: postCaption,
          gridPosition,
          isArchived: false,
          archivedAt: null,
          createdAt: Date.now(),
        });

        const posts =
          importMode === 'separatePosts'
            ? media.map((item, index) => buildPost([item], '', index))
            : [buildPost(media.slice(0, MAX_MEDIA_PER_POST), caption, 0)];

        set((state) => ({ posts: withPostsAddedToTopOfGrid(state.posts, posts) }));
        return posts;
      },

      updateCaption: (postId, caption) =>
        set((state) => ({
          posts: state.posts.map((post) => (post.id === postId ? { ...post, caption } : post)),
        })),

      setGridCoverIndex: (postId, gridCoverIndex) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId && gridCoverIndex >= 0 && gridCoverIndex < post.media.length
              ? { ...post, gridCoverIndex }
              : post
          ),
        })),

      moveMediaWithinPost: (postId, fromIndex, toIndex) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? withMediaMovedWithinPost(post, fromIndex, toIndex) : post
          ),
        })),

      movePostToGridPosition: (postId, targetPosition) =>
        set((state) => ({
          posts: withPostMovedToGridPosition(state.posts, postId, targetPosition),
        })),

      archivePost: (postId) =>
        set((state) => ({ posts: withPostArchived(state.posts, postId, Date.now()) })),

      restorePost: (postId) => set((state) => ({ posts: withPostRestored(state.posts, postId) })),

      deletePost: (postId) => {
        const state = get();
        const removedPost = state.posts.find((post) => post.id === postId);
        if (!removedPost) return;

        deleteMediaFiles(removedPost.media);
        set({ posts: withPostRemoved(state.posts, postId) });
      },

      replaceEverythingFromBackup: (accounts, posts) =>
        set({ accounts, posts, activeAccountId: accounts[0]?.id ?? null }),
    }),
    {
      name: PERSISTED_STORE_KEY,
      version: PERSISTED_SCHEMA_VERSION,
      storage: persistedStorage,
      migrate: migratePersistedState,
      partialize: (state) => ({
        accounts: state.accounts,
        posts: state.posts,
        activeAccountId: state.activeAccountId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.ensureAtLeastOneAccountExists();
        useAppStore.setState({ hasHydrated: true });
      },
    }
  )
);
