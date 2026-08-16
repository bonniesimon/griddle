import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { MediaStrip } from '@/components/MediaStrip';
import { usePost } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';

const EditPostScreen = () => {
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const updateCaption = useAppStore((state) => state.updateCaption);
  const setGridCoverIndex = useAppStore((state) => state.setGridCoverIndex);
  const moveMediaWithinPost = useAppStore((state) => state.moveMediaWithinPost);
  const [draftCaption, setDraftCaption] = useState(post?.caption ?? '');

  if (!post) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <EmptyState title="Post not found" message="It may have been deleted." />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.sectionTitle, { color: palette.primaryText }]}>Grid cover</Text>
      <Text style={[styles.sectionHint, { color: palette.secondaryText }]}>
        Tap a photo to make it the one your grid shows.
      </Text>
      <MediaStrip
        media={post.media}
        coverIndex={post.gridCoverIndex}
        onSelectCoverAt={(index) => setGridCoverIndex(post.id, index)}
      />

      {post.media.length > 1 ? (
        <View style={styles.reorderColumn}>
          <Text style={[styles.sectionTitle, { color: palette.primaryText }]}>Photo order</Text>
          {post.media.map((media, index) => (
            <View key={media.id} style={[styles.reorderRow, { borderColor: palette.separator }]}>
              <Text style={[styles.reorderLabel, { color: palette.primaryText }]}>
                Photo {index + 1}
              </Text>
              <View style={styles.reorderControls}>
                <Pressable
                  style={styles.reorderButton}
                  disabled={index === 0}
                  onPress={() => moveMediaWithinPost(post.id, index, index - 1)}
                >
                  <Text
                    style={[
                      styles.reorderGlyph,
                      { color: index === 0 ? palette.separator : palette.accent },
                    ]}
                  >
                    ↑
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.reorderButton}
                  disabled={index === post.media.length - 1}
                  onPress={() => moveMediaWithinPost(post.id, index, index + 1)}
                >
                  <Text
                    style={[
                      styles.reorderGlyph,
                      {
                        color: index === post.media.length - 1 ? palette.separator : palette.accent,
                      },
                    ]}
                  >
                    ↓
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, { color: palette.primaryText }]}>Caption</Text>
      <TextInput
        style={[
          styles.captionInput,
          { color: palette.primaryText, borderColor: palette.separator },
        ]}
        value={draftCaption}
        onChangeText={setDraftCaption}
        onBlur={() => updateCaption(post.id, draftCaption.trim())}
        placeholder="Write a caption…"
        placeholderTextColor={palette.secondaryText}
        multiline
      />

      <Pressable
        style={[styles.saveButton, { backgroundColor: palette.accent }]}
        onPress={() => updateCaption(post.id, draftCaption.trim())}
      >
        <Text style={styles.saveLabel}>Save caption</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.roomy,
    gap: spacing.snug,
  },
  sectionTitle: {
    fontSize: typeScale.emphasis,
    fontWeight: '700',
    paddingTop: spacing.snug,
  },
  sectionHint: {
    fontSize: typeScale.caption,
  },
  reorderColumn: {
    gap: spacing.tight,
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: spacing.regular,
    paddingVertical: spacing.snug,
  },
  reorderLabel: {
    fontSize: typeScale.body,
  },
  reorderControls: {
    flexDirection: 'row',
    gap: spacing.regular,
  },
  reorderButton: {
    paddingHorizontal: spacing.snug,
  },
  reorderGlyph: {
    fontSize: typeScale.title,
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
    marginTop: spacing.snug,
  },
  saveLabel: {
    color: '#FFFFFF',
    fontSize: typeScale.emphasis,
    fontWeight: '700',
  },
});

export default EditPostScreen;
