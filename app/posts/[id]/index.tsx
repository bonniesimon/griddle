import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Carousel } from '@/components/Carousel';
import { EmptyState } from '@/components/EmptyState';
import { resolveMediaUri } from '@/storage/mediaStore';
import { useAccount, usePost } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { avatarDiameter, spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import { formatHandle } from '@/types';

const DECORATIVE_ACTION_GLYPHS = ['♡', '💬', '↗'];

const PostDetailScreen = () => {
  const palette = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const account = useAccount(post?.accountId);
  const archivePost = useAppStore((state) => state.archivePost);
  const restorePost = useAppStore((state) => state.restorePost);
  const deletePost = useAppStore((state) => state.deletePost);

  if (!post || !account) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <EmptyState title="Post not found" message="It may have been deleted." />
      </View>
    );
  }

  const confirmDelete = () =>
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

  const archiveAndReturn = () => {
    archivePost(post.id);
    router.back();
  };

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.authorRow}>
        {account.avatarPath ? (
          <Image
            source={{ uri: resolveMediaUri(account.avatarPath) }}
            style={styles.authorAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.authorAvatar, { backgroundColor: palette.placeholder }]} />
        )}
        <Text style={[styles.authorHandle, { color: palette.primaryText }]}>
          {formatHandle(account.handleWithoutAtSign)}
        </Text>
      </View>

      <Carousel media={post.media} />

      <View style={styles.actionRow}>
        {DECORATIVE_ACTION_GLYPHS.map((glyph) => (
          <Text key={glyph} style={[styles.actionGlyph, { color: palette.primaryText }]}>
            {glyph}
          </Text>
        ))}
      </View>

      {post.caption.length > 0 ? (
        <Text style={[styles.caption, { color: palette.primaryText }]}>
          <Text style={styles.captionHandle}>{formatHandle(account.handleWithoutAtSign)} </Text>
          {post.caption}
        </Text>
      ) : null}

      <View style={styles.controlColumn}>
        <Pressable
          style={[styles.control, { backgroundColor: palette.placeholder }]}
          onPress={() => router.push(`/posts/${post.id}/edit`)}
        >
          <Text style={[styles.controlLabel, { color: palette.primaryText }]}>Edit post</Text>
        </Pressable>

        {post.isArchived ? (
          <Pressable
            style={[styles.control, { backgroundColor: palette.placeholder }]}
            onPress={() => restorePost(post.id)}
          >
            <Text style={[styles.controlLabel, { color: palette.primaryText }]}>
              Restore to grid
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.control, { backgroundColor: palette.placeholder }]}
            onPress={archiveAndReturn}
          >
            <Text style={[styles.controlLabel, { color: palette.primaryText }]}>Archive</Text>
          </Pressable>
        )}

        <Pressable style={styles.control} onPress={confirmDelete}>
          <Text style={[styles.controlLabel, { color: palette.destructive }]}>Delete post</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.section,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.snug,
    paddingHorizontal: spacing.regular,
    paddingVertical: spacing.snug,
  },
  authorAvatar: {
    width: avatarDiameter.postDetail,
    height: avatarDiameter.postDetail,
    borderRadius: avatarDiameter.postDetail / 2,
  },
  authorHandle: {
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.roomy,
    paddingHorizontal: spacing.regular,
    paddingTop: spacing.snug,
  },
  actionGlyph: {
    fontSize: typeScale.count,
  },
  caption: {
    paddingHorizontal: spacing.regular,
    paddingTop: spacing.snug,
    fontSize: typeScale.body,
    lineHeight: typeScale.body + 5,
  },
  captionHandle: {
    fontWeight: '600',
  },
  controlColumn: {
    paddingHorizontal: spacing.regular,
    paddingTop: spacing.loose,
    gap: spacing.snug,
  },
  control: {
    borderRadius: 10,
    paddingVertical: spacing.regular,
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: typeScale.emphasis,
    fontWeight: '600',
  },
});

export default PostDetailScreen;
