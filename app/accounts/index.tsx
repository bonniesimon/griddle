import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { exportBackupToSharedFile, readBackupFromPickedFile } from '@/storage/backup';
import { resolveMediaUri } from '@/storage/mediaStore';
import { unarchivedPostCount } from '@/store/ordering';
import { useAppStore } from '@/store/useAppStore';
import { avatarDiameter, spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import { formatHandle, type Account } from '@/types';

const AccountsScreen = () => {
  const palette = usePalette();
  const router = useRouter();
  const accounts = useAppStore((state) => state.accounts);
  const posts = useAppStore((state) => state.posts);
  const activeAccountId = useAppStore((state) => state.activeAccountId);
  const switchToAccount = useAppStore((state) => state.switchToAccount);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const replaceEverythingFromBackup = useAppStore((state) => state.replaceEverythingFromBackup);

  const exportBackup = async () => {
    try {
      await exportBackupToSharedFile(accounts, posts);
    } catch {
      Alert.alert('Export failed', 'Could not write the backup file.');
    }
  };

  const confirmImportBackup = () =>
    Alert.alert('Restore from backup?', 'This replaces every account and grid on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          try {
            const restored = await readBackupFromPickedFile();
            if (!restored) {
              Alert.alert('Nothing restored', 'That file is not a Griddle backup.');
              return;
            }
            replaceEverythingFromBackup(restored.accounts, restored.posts);
            router.back();
          } catch {
            Alert.alert('Restore failed', 'Could not read that backup file.');
          }
        },
      },
    ]);

  const confirmDelete = (account: Account) =>
    Alert.alert(
      `Delete ${account.displayName}?`,
      'Its grid, archive and photos are removed from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAccount(account.id) },
      ]
    );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <FlatList
        data={accounts}
        keyExtractor={(account) => account.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.accountRow}
            onPress={() => {
              switchToAccount(item.id);
              router.back();
            }}
            onLongPress={() => confirmDelete(item)}
          >
            {item.avatarPath ? (
              <Image
                source={{ uri: resolveMediaUri(item.avatarPath) }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: palette.placeholder }]} />
            )}

            <View style={styles.accountText}>
              <Text style={[styles.handle, { color: palette.primaryText }]}>
                {formatHandle(item.handleWithoutAtSign)}
              </Text>
              <Text style={[styles.summary, { color: palette.secondaryText }]}>
                {item.displayName} · {unarchivedPostCount(posts, item.id)} posts
              </Text>
            </View>

            {item.id === activeAccountId ? (
              <Text style={[styles.activeMark, { color: palette.accent }]}>✓</Text>
            ) : null}
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            <Pressable style={styles.addRow} onPress={() => router.push('/accounts/new')}>
              <Text style={[styles.addLabel, { color: palette.accent }]}>Add account</Text>
            </Pressable>
            <View style={[styles.backupSection, { borderTopColor: palette.separator }]}>
              <Pressable style={styles.addRow} onPress={exportBackup}>
                <Text style={[styles.addLabel, { color: palette.accent }]}>Export backup</Text>
              </Pressable>
              <Pressable style={styles.addRow} onPress={confirmImportBackup}>
                <Text style={[styles.addLabel, { color: palette.accent }]}>
                  Restore from backup
                </Text>
              </Pressable>
            </View>
          </View>
        }
      />
      <Text style={[styles.hint, { color: palette.secondaryText }]}>
        Long-press an account to delete it.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.snug,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.regular,
    paddingHorizontal: spacing.roomy,
    paddingVertical: spacing.regular,
  },
  avatar: {
    width: avatarDiameter.accountRow,
    height: avatarDiameter.accountRow,
    borderRadius: avatarDiameter.accountRow / 2,
  },
  accountText: {
    flex: 1,
  },
  handle: {
    fontSize: typeScale.emphasis,
    fontWeight: '600',
  },
  summary: {
    fontSize: typeScale.caption,
  },
  activeMark: {
    fontSize: typeScale.title,
    fontWeight: '700',
  },
  addRow: {
    paddingHorizontal: spacing.roomy,
    paddingVertical: spacing.regular,
  },
  addLabel: {
    fontSize: typeScale.emphasis,
    fontWeight: '600',
  },
  backupSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.snug,
    paddingTop: spacing.snug,
  },
  hint: {
    fontSize: typeScale.caption,
    textAlign: 'center',
    paddingBottom: spacing.loose,
  },
});

export default AccountsScreen;
