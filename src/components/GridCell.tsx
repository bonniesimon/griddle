import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { resolveMediaUri } from '@/storage/mediaStore';
import { usePalette } from '@/theme/usePalette';
import { coverMediaOf, hasMultipleMedia, type Post } from '@/types';

import { CarouselBadge } from './CarouselBadge';

type GridCellProps = {
  post: Post;
  onPress?: () => void;
  onLongPress?: () => void;
  isDimmed?: boolean;
};

export const GridCell = ({ post, onPress, onLongPress, isDimmed = false }: GridCellProps) => {
  const palette = usePalette();
  const coverMedia = coverMediaOf(post);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.cell, { backgroundColor: palette.placeholder }]}
      testID={`grid-cell-${post.id}`}
    >
      {coverMedia ? (
        <Image
          testID="grid-cell-image"
          source={{ uri: resolveMediaUri(coverMedia.thumbnailPath) }}
          style={styles.image}
          contentFit="cover"
          transition={120}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.image} />
      )}
      {hasMultipleMedia(post) ? <CarouselBadge /> : null}
      {isDimmed ? <View style={[styles.dim, { backgroundColor: palette.overlay }]} /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
