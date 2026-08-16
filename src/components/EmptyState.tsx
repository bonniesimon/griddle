import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export const EmptyState = ({ title, message, actionLabel, onPressAction }: EmptyStateProps) => {
  const palette = usePalette();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.primaryText }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.secondaryText }]}>{message}</Text>
      {actionLabel && onPressAction ? (
        <Pressable style={styles.action} onPress={onPressAction}>
          <Text style={[styles.actionLabel, { color: palette.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.section,
    paddingVertical: spacing.section * 2,
    gap: spacing.snug,
  },
  title: {
    fontSize: typeScale.title,
    fontWeight: '700',
  },
  message: {
    fontSize: typeScale.body,
    textAlign: 'center',
  },
  action: {
    paddingTop: spacing.snug,
  },
  actionLabel: {
    fontSize: typeScale.emphasis,
    fontWeight: '600',
  },
});
