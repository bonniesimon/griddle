import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  deleteMediaFiles,
  importImageIntoAppStorage,
  type PickedImage,
} from '@/storage/mediaStore';
import { pickImagesFromDevice } from '@/storage/pickImagesFromDevice';
import { useAppStore } from '@/store/useAppStore';
import { spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import {
  describeChosenMode,
  describeImportOutcome,
  photoCapacityFor,
  type ImportMode,
  type Media,
} from '@/types';

import { ImportModeSheet } from '@/components/ImportModeSheet';
import { MediaStrip } from '@/components/MediaStrip';

type ImportProgress = {
  finishedCount: number;
  totalCount: number;
};

const describeImportProgress = ({ finishedCount, totalCount }: ImportProgress) =>
  `Importing ${Math.min(finishedCount + 1, totalCount)} of ${totalCount}`;

const NewPostScreen = () => {
  const palette = usePalette();
  const router = useRouter();
  const createPostsFromImport = useAppStore((state) => state.createPostsFromImport);
  const [importedMedia, setImportedMedia] = useState<Media[]>([]);
  const [importMode, setImportMode] = useState<ImportMode | null>(null);
  const [photosAwaitingModeChoice, setPhotosAwaitingModeChoice] = useState<PickedImage[] | null>(
    null
  );
  const [caption, setCaption] = useState('');
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  const remainingMediaSlots = photoCapacityFor(importMode) - importedMedia.length;
  const isBuildingSeparatePosts = importMode === 'separatePosts';
  const canChangeMode = importMode !== null && importedMedia.length > 1;
  const isImporting = importProgress !== null;

  const importPickedPhotosInOrder = async (pickedImages: PickedImage[]) => {
    if (pickedImages.length === 0) return;

    setImportProgress({ finishedCount: 0, totalCount: pickedImages.length });
    const newMedia: Media[] = [];

    try {
      for (const picked of pickedImages) {
        newMedia.push(await importImageIntoAppStorage(picked));
        setImportProgress({ finishedCount: newMedia.length, totalCount: pickedImages.length });
      }
      setImportedMedia((existing) => [...existing, ...newMedia]);
    } catch {
      deleteMediaFiles(newMedia);
      Alert.alert('Could not import', 'Something went wrong copying those photos.');
    } finally {
      setImportProgress(null);
    }
  };

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to add posts to your grid.');
      return;
    }

    const picker = await pickImagesFromDevice({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingMediaSlots,
      orderedSelection: true,
      quality: 1,
    });
    if (picker.canceled) return;

    const pickedImages: PickedImage[] = picker.assets.map((asset) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    }));

    const needsModeChoice = importMode === null && importedMedia.length + pickedImages.length > 1;
    if (needsModeChoice) {
      setPhotosAwaitingModeChoice(pickedImages);
      return;
    }

    await importPickedPhotosInOrder(pickedImages);
  };

  const applyChosenMode = async (chosenMode: ImportMode) => {
    const pickedImages = photosAwaitingModeChoice ?? [];
    setImportMode(chosenMode);
    setPhotosAwaitingModeChoice(null);
    await importPickedPhotosInOrder(pickedImages);
  };

  const removePhotoAt = (removedIndex: number) => {
    const remainingMedia = importedMedia.filter((_, index) => index !== removedIndex);
    setImportedMedia(remainingMedia);
    if (remainingMedia.length === 0) setImportMode(null);
  };

  const savePosts = () => {
    const createdPosts = createPostsFromImport(importedMedia, caption.trim(), importMode);
    if (createdPosts.length === 0) return;
    router.back();
  };

  const pickLabel =
    importedMedia.length === 0 ? 'Choose photos' : `Add more (${remainingMediaSlots} left)`;

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <MediaStrip media={importedMedia} onRemoveMediaAt={removePhotoAt} />

      {canChangeMode ? (
        <View style={[styles.modeRow, { borderColor: palette.separator }]}>
          <Text style={[styles.modeLabel, { color: palette.primaryText }]}>
            {describeChosenMode(importMode, importedMedia.length)}
          </Text>
          <Pressable onPress={() => setPhotosAwaitingModeChoice([])} testID="change-import-mode">
            <Text style={[styles.modeAction, { color: palette.accent }]}>Change</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={[styles.pickButton, { borderColor: palette.separator }]}
        onPress={pickPhotos}
        disabled={isImporting || remainingMediaSlots === 0}
      >
        {importProgress ? (
          <View style={styles.importingRow}>
            <ActivityIndicator color={palette.secondaryText} />
            {importProgress.totalCount > 1 ? (
              <Text style={[styles.hint, { color: palette.secondaryText }]}>
                {describeImportProgress(importProgress)}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.pickLabel, { color: palette.accent }]}>{pickLabel}</Text>
        )}
      </Pressable>

      {isBuildingSeparatePosts ? null : (
        <TextInput
          style={[
            styles.captionInput,
            { color: palette.primaryText, borderColor: palette.separator },
          ]}
          placeholder="Write a caption…"
          placeholderTextColor={palette.secondaryText}
          value={caption}
          onChangeText={setCaption}
          multiline
        />
      )}

      <Pressable
        style={[
          styles.saveButton,
          { backgroundColor: importedMedia.length > 0 ? palette.accent : palette.placeholder },
        ]}
        onPress={savePosts}
        disabled={importedMedia.length === 0}
      >
        <Text
          style={[
            styles.saveLabel,
            { color: importedMedia.length > 0 ? '#FFFFFF' : palette.secondaryText },
          ]}
        >
          {describeImportOutcome(importMode, importedMedia.length)}
        </Text>
      </Pressable>

      <View style={styles.hintRow}>
        <Text style={[styles.hint, { color: palette.secondaryText }]}>
          {isBuildingSeparatePosts
            ? 'Each photo becomes its own post. You can caption them separately later.'
            : 'The first photo becomes the grid cover. You can change it later.'}
        </Text>
      </View>

      {photosAwaitingModeChoice ? (
        <ImportModeSheet
          photoCount={importedMedia.length + photosAwaitingModeChoice.length}
          onChooseMode={applyChosenMode}
          onCancel={() => setPhotosAwaitingModeChoice(null)}
        />
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.roomy,
    gap: spacing.roomy,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: spacing.regular,
    paddingVertical: spacing.snug,
  },
  modeLabel: {
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  modeAction: {
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  pickButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: spacing.regular,
    alignItems: 'center',
  },
  pickLabel: {
    fontSize: typeScale.emphasis,
    fontWeight: '600',
  },
  importingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.snug,
  },
  captionInput: {
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: spacing.regular,
    fontSize: typeScale.body,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 10,
    paddingVertical: spacing.regular,
    alignItems: 'center',
  },
  saveLabel: {
    fontSize: typeScale.emphasis,
    fontWeight: '700',
  },
  hintRow: {
    alignItems: 'center',
  },
  hint: {
    fontSize: typeScale.caption,
    textAlign: 'center',
  },
});

export default NewPostScreen;
