import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, useWindowDimensions } from 'react-native';

import { anchorIndexInFeed } from '@/store/ordering';
import { useFeedPostsAlongside } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import type { Account, Post } from '@/types';

import { PostActionsSheet } from './PostActionsSheet';
import { PostFeedItem } from './PostFeedItem';
import { feedItemOffsets } from './feedItemLayout';

const POSTS_RENDERED_AHEAD = 2;
const SCREENFULS_KEPT_RENDERED = 3;

type PostFeedProps = {
  anchorPost: Post;
  account: Account;
};

export const PostFeed = ({ anchorPost, account }: PostFeedProps) => {
  const palette = usePalette();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const feedPosts = useFeedPostsAlongside(anchorPost);
  const archivePost = useAppStore((state) => state.archivePost);
  const restorePost = useAppStore((state) => state.restorePost);
  const deletePost = useAppStore((state) => state.deletePost);
  const [postAwaitingAction, setPostAwaitingAction] = useState<Post | null>(null);

  const { heights, starts } = useMemo(
    () => feedItemOffsets(feedPosts, screenWidth),
    [feedPosts, screenWidth]
  );

  const renderFeedPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostFeedItem
        post={item}
        account={account}
        onPressActions={() => setPostAwaitingAction(item)}
      />
    ),
    [account]
  );

  const dismissActionsSheet = () => setPostAwaitingAction(null);

  const openEditScreenFor = (post: Post) => {
    dismissActionsSheet();
    router.push(`/posts/${post.id}/edit`);
  };

  const archiveOrRestoreAndReturn = (post: Post) => {
    dismissActionsSheet();
    if (post.isArchived) {
      restorePost(post.id);
    } else {
      archivePost(post.id);
    }
    router.back();
  };

  const confirmDeleteOf = (post: Post) => {
    dismissActionsSheet();
    Alert.alert('Delete post?', 'This removes the photos from the app for good.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePost(post.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <FlatList
        testID="post-feed"
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: spacing.section }}
        data={feedPosts}
        keyExtractor={(post) => post.id}
        renderItem={renderFeedPost}
        initialScrollIndex={anchorIndexInFeed(feedPosts, anchorPost.id)}
        getItemLayout={(_, index) => ({
          length: heights[index] ?? 0,
          offset: starts[index] ?? 0,
          index,
        })}
        initialNumToRender={POSTS_RENDERED_AHEAD}
        maxToRenderPerBatch={POSTS_RENDERED_AHEAD}
        windowSize={SCREENFULS_KEPT_RENDERED}
        directionalLockEnabled
      />

      {postAwaitingAction ? (
        <PostActionsSheet
          post={postAwaitingAction}
          onEdit={() => openEditScreenFor(postAwaitingAction)}
          onArchiveOrRestore={() => archiveOrRestoreAndReturn(postAwaitingAction)}
          onDelete={() => confirmDeleteOf(postAwaitingAction)}
          onCancel={dismissActionsSheet}
        />
      ) : null}
    </>
  );
};
