import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import type { Post } from '@/types';

type PostActionsSheetProps = {
  post: Post;
  onEdit: () => void;
  onArchiveOrRestore: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export const PostActionsSheet = ({
  post,
  onEdit,
  onArchiveOrRestore,
  onDelete,
  onCancel,
}: PostActionsSheetProps) => {
  const palette = usePalette();

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onCancel}>
      <View style={styles.screen}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={onCancel}
          testID="post-actions-backdrop"
        />
        <View style={[styles.sheet, { backgroundColor: palette.background }]}>
          <Pressable
            style={[styles.choice, { borderColor: palette.separator }]}
            onPress={onEdit}
            testID="post-actions-edit"
          >
            <Text style={[styles.choiceLabel, { color: palette.primaryText }]}>Edit post</Text>
          </Pressable>

          <Pressable
            style={[styles.choice, { borderColor: palette.separator }]}
            onPress={onArchiveOrRestore}
            testID="post-actions-archive"
          >
            <Text style={[styles.choiceLabel, { color: palette.primaryText }]}>
              {post.isArchived ? 'Restore to grid' : 'Archive'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.choice, { borderColor: palette.separator }]}
            onPress={onDelete}
            testID="post-actions-delete"
          >
            <Text style={[styles.choiceLabel, { color: palette.destructive }]}>Delete post</Text>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onCancel} testID="post-actions-cancel">
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
  choice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: spacing.regular,
    paddingHorizontal: spacing.roomy,
    alignItems: 'center',
  },
  choiceLabel: {
    fontSize: typeScale.emphasis,
    fontWeight: '600',
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
