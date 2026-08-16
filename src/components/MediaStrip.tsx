import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveMediaUri } from '@/storage/mediaStore';
import { spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import type { Media } from '@/types';

const STRIP_THUMBNAIL_SIZE = 84;

type MediaStripProps = {
  media: Media[];
  coverIndex?: number;
  onRemoveMediaAt?: (index: number) => void;
  onSelectCoverAt?: (index: number) => void;
};

export const MediaStrip = ({
  media,
  coverIndex,
  onRemoveMediaAt,
  onSelectCoverAt,
}: MediaStripProps) => {
  const palette = usePalette();

  if (media.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {media.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={() => onSelectCoverAt?.(index)}
          style={[
            styles.thumbnailFrame,
            {
              borderColor: index === coverIndex ? palette.accent : 'transparent',
            },
          ]}
          testID={`media-strip-item-${index}`}
        >
          <Image
            source={{ uri: resolveMediaUri(item.thumbnailPath) }}
            style={styles.thumbnail}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          {index === coverIndex ? (
            <View style={[styles.coverTag, { backgroundColor: palette.accent }]}>
              <Text style={styles.coverTagLabel}>Cover</Text>
            </View>
          ) : null}
          {onRemoveMediaAt ? (
            <Pressable
              style={[styles.removeButton, { backgroundColor: palette.overlay }]}
              onPress={() => onRemoveMediaAt(index)}
              testID={`media-strip-remove-${index}`}
            >
              <Text style={[styles.removeGlyph, { color: palette.onOverlay }]}>×</Text>
            </Pressable>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: spacing.snug,
    paddingVertical: spacing.tight,
  },
  thumbnailFrame: {
    width: STRIP_THUMBNAIL_SIZE,
    height: STRIP_THUMBNAIL_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  coverTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: spacing.hair,
  },
  coverTagLabel: {
    color: '#FFFFFF',
    fontSize: typeScale.caption - 2,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeGlyph: {
    fontSize: typeScale.body,
    lineHeight: typeScale.body + 2,
    fontWeight: '700',
  },
});
