import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import type Animated from 'react-native-reanimated';
import type { AnimatedRef } from 'react-native-reanimated';
import Sortable, { type SortableGridRenderItemInfo } from 'react-native-sortables';

import { useAppStore } from '@/store/useAppStore';
import { GRID_GUTTER_PX } from '@/theme/tokens';
import { GRID_COLUMN_COUNT, type Post } from '@/types';

import { GridCell } from './GridCell';

type PostGridProps = {
  posts: Post[];
  scrollableRef?: AnimatedRef<Animated.ScrollView>;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
};

const postIdOf = (post: Post) => post.id;

export const PostGrid = ({
  posts,
  scrollableRef,
  ListHeaderComponent,
  ListEmptyComponent,
}: PostGridProps) => {
  const router = useRouter();
  const movePostToGridPosition = useAppStore((state) => state.movePostToGridPosition);

  const renderGridCell = useCallback(
    ({ item }: SortableGridRenderItemInfo<Post>) => (
      <GridCell post={item} onPress={() => router.push(`/posts/${item.id}`)} />
    ),
    [router]
  );

  return (
    <View>
      {ListHeaderComponent}
      {posts.length === 0 ? (
        ListEmptyComponent
      ) : (
        <Sortable.Grid
          columns={GRID_COLUMN_COUNT}
          data={posts}
          keyExtractor={postIdOf}
          renderItem={renderGridCell}
          rowGap={GRID_GUTTER_PX}
          columnGap={GRID_GUTTER_PX}
          hapticsEnabled
          scrollableRef={scrollableRef}
          onDragEnd={({ key, toIndex }) => movePostToGridPosition(key, toIndex)}
        />
      )}
    </View>
  );
};
