import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import {
  MAX_MEDIA_PER_POST,
  canGroupIntoOneCarousel,
  describeSelectedPhotos,
  type ImportMode,
} from '@/types';

type ImportModeSheetProps = {
  photoCount: number;
  onChooseMode: (importMode: ImportMode) => void;
  onCancel: () => void;
};

export const ImportModeSheet = ({ photoCount, onChooseMode, onCancel }: ImportModeSheetProps) => {
  const palette = usePalette();
  const isCarouselAvailable = canGroupIntoOneCarousel(photoCount);

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onCancel}>
      <View style={styles.screen}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={onCancel}
          testID="import-mode-backdrop"
        />
        <View style={[styles.sheet, { backgroundColor: palette.background }]}>
          <Text style={[styles.title, { color: palette.primaryText }]}>
            {describeSelectedPhotos(photoCount)}
          </Text>

          <Pressable
            style={[styles.choice, { borderColor: palette.separator }]}
            onPress={() => onChooseMode('separatePosts')}
            testID="import-mode-separate"
          >
            <Text style={[styles.choiceLabel, { color: palette.primaryText }]}>
              Add as {photoCount} separate posts
            </Text>
            <Text style={[styles.choiceHint, { color: palette.secondaryText }]}>
              Each photo becomes its own post in the grid.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.choice, { borderColor: palette.separator }]}
            onPress={() => onChooseMode('oneCarousel')}
            disabled={!isCarouselAvailable}
            testID="import-mode-carousel"
          >
            <Text
              style={[
                styles.choiceLabel,
                { color: isCarouselAvailable ? palette.primaryText : palette.secondaryText },
              ]}
            >
              Add as one carousel
            </Text>
            <Text style={[styles.choiceHint, { color: palette.secondaryText }]}>
              {isCarouselAvailable
                ? 'One grid cell you can swipe through.'
                : `A carousel holds ${MAX_MEDIA_PER_POST} photos.`}
            </Text>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onCancel} testID="import-mode-cancel">
            <Text style={[styles.cancelLabel, { color: palette.accent }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.roomy,
    gap: spacing.regular,
  },
  title: {
    fontSize: typeScale.title,
    fontWeight: '700',
    textAlign: 'center',
    paddingBottom: spacing.tight,
  },
  choice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: spacing.regular,
    paddingHorizontal: spacing.roomy,
    gap: spacing.hair,
  },
  choiceLabel: {
    fontSize: typeScale.emphasis,
    fontWeight: '600',
  },
  choiceHint: {
    fontSize: typeScale.caption,
  },
  cancel: {
    paddingVertical: spacing.regular,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: typeScale.emphasis,
    fontWeight: '600',
  },
});
