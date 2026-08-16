import { useRouter } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GridCell } from '@/components/GridCell';
import { useArchivedPosts } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { GRID_GUTTER_PX, spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import { GRID_COLUMN_COUNT, type Post } from '@/types';

const ArchivedPostsScreen = () => {
  const palette = usePalette();
  const router = useRouter();
  const archivedPosts = useArchivedPosts();
  const restorePost = useAppStore((state) => state.restorePost);
  const deletePost = useAppStore((state) => state.deletePost);

  const offerRestoreOrDelete = (post: Post) =>
    Alert.alert('Archived post', 'Put it back in the grid, or remove it for good.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', onPress: () => restorePost(post.id) },
      { text: 'Delete', style: 'destructive', onPress: () => deletePost(post.id) },
    ]);

  if (archivedPosts.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <EmptyState
          title="Nothing archived"
          message="Long-press a post in your grid to pull it out without deleting it."
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Text style={[styles.hint, { color: palette.secondaryText }]}>
        Tap a post to restore it to its old slot, or delete it for good.
      </Text>
      <FlatList
        data={archivedPosts}
        keyExtractor={(post) => post.id}
        numColumns={GRID_COLUMN_COUNT}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <GridCell
            post={item}
            isDimmed
            onPress={() => offerRestoreOrDelete(item)}
            onLongPress={() => router.push(`/posts/${item.id}`)}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hint: {
    fontSize: typeScale.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.roomy,
    paddingVertical: spacing.regular,
  },
  columnWrapper: {
    gap: GRID_GUTTER_PX,
  },
  gridContent: {
    gap: GRID_GUTTER_PX,
  },
});

export default ArchivedPostsScreen;
