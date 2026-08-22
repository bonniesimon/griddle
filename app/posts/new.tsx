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

import { importImageIntoAppStorage, type PickedImage } from '@/storage/mediaStore';
import { pickImagesFromDevice } from '@/storage/pickImagesFromDevice';
import { useAppStore } from '@/store/useAppStore';
import { spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import { MAX_MEDIA_PER_POST, type Media } from '@/types';

import { MediaStrip } from '@/components/MediaStrip';

const NewPostScreen = () => {
  const palette = usePalette();
  const router = useRouter();
  const createPostFromMedia = useAppStore((state) => state.createPostFromMedia);
  const [importedMedia, setImportedMedia] = useState<Media[]>([]);
  const [caption, setCaption] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const remainingMediaSlots = MAX_MEDIA_PER_POST - importedMedia.length;

  const pickAndImportImages = async () => {
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

    setIsImporting(true);
    try {
      const pickedImages: PickedImage[] = picker.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      }));
      const newMedia = await Promise.all(pickedImages.map(importImageIntoAppStorage));
      setImportedMedia((existing) => [...existing, ...newMedia].slice(0, MAX_MEDIA_PER_POST));
    } catch {
      Alert.alert('Could not import', 'Something went wrong copying those photos.');
    } finally {
      setIsImporting(false);
    }
  };

  const savePost = () => {
    const createdPost = createPostFromMedia(importedMedia, caption.trim());
    if (!createdPost) return;
    router.back();
  };

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <MediaStrip
        media={importedMedia}
        onRemoveMediaAt={(index) =>
          setImportedMedia((existing) => existing.filter((_, position) => position !== index))
        }
      />

      <Pressable
        style={[styles.pickButton, { borderColor: palette.separator }]}
        onPress={pickAndImportImages}
        disabled={isImporting || remainingMediaSlots === 0}
      >
        {isImporting ? (
          <ActivityIndicator color={palette.secondaryText} />
        ) : (
          <Text style={[styles.pickLabel, { color: palette.accent }]}>
            {importedMedia.length === 0
              ? 'Choose photos'
              : `Add more (${remainingMediaSlots} left)`}
          </Text>
        )}
      </Pressable>

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

      <Pressable
        style={[
          styles.saveButton,
          { backgroundColor: importedMedia.length > 0 ? palette.accent : palette.placeholder },
        ]}
        onPress={savePost}
        disabled={importedMedia.length === 0}
      >
        <Text
          style={[
            styles.saveLabel,
            { color: importedMedia.length > 0 ? '#FFFFFF' : palette.secondaryText },
          ]}
        >
          Add to grid
        </Text>
      </Pressable>

      <View style={styles.hintRow}>
        <Text style={[styles.hint, { color: palette.secondaryText }]}>
          The first photo becomes the grid cover. You can change it later.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.roomy,
    gap: spacing.roomy,
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
