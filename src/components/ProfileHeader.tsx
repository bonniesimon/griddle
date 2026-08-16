import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveMediaUri } from '@/storage/mediaStore';
import { avatarDiameter, spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import { formatHandle, type Account } from '@/types';

type ProfileHeaderProps = {
  account: Account;
  visiblePostCount: number;
};

type CountColumnProps = {
  count: number;
  label: string;
};

const CountColumn = ({ count, label }: CountColumnProps) => {
  const palette = usePalette();
  return (
    <View style={styles.countColumn}>
      <Text style={[styles.countValue, { color: palette.primaryText }]}>{count}</Text>
      <Text style={[styles.countLabel, { color: palette.primaryText }]}>{label}</Text>
    </View>
  );
};

export const ProfileHeader = ({ account, visiblePostCount }: ProfileHeaderProps) => {
  const palette = usePalette();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.handleRow} onPress={() => router.push('/accounts')}>
        <Text style={[styles.handle, { color: palette.primaryText }]}>
          {formatHandle(account.handleWithoutAtSign)}
        </Text>
        <Text style={[styles.switcherChevron, { color: palette.primaryText }]}>⌄</Text>
      </Pressable>

      <View style={styles.identityRow}>
        {account.avatarPath ? (
          <Image
            source={{ uri: resolveMediaUri(account.avatarPath) }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: palette.placeholder }]} />
        )}

        <View style={styles.countRow}>
          <CountColumn count={visiblePostCount} label="posts" />
          <CountColumn count={account.displayedFollowerCount} label="followers" />
          <CountColumn count={account.displayedFollowingCount} label="following" />
        </View>
      </View>

      <Text style={[styles.displayName, { color: palette.primaryText }]}>
        {account.displayName}
      </Text>
      {account.bio.length > 0 ? (
        <Text style={[styles.bio, { color: palette.primaryText }]}>{account.bio}</Text>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: palette.placeholder }]}
          onPress={() => router.push(`/accounts/${account.id}/edit`)}
        >
          <Text style={[styles.actionLabel, { color: palette.primaryText }]}>Edit profile</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: palette.placeholder }]}
          onPress={() => router.push('/archived-posts')}
        >
          <Text style={[styles.actionLabel, { color: palette.primaryText }]}>Archive</Text>
        </Pressable>
      </View>

      <View style={[styles.tabRow, { borderTopColor: palette.separator }]}>
        <View style={[styles.tab, styles.activeTab, { borderBottomColor: palette.primaryText }]}>
          <Text style={[styles.tabGlyph, { color: palette.primaryText }]}>▦</Text>
        </View>
        <View style={styles.tab}>
          <Text style={[styles.tabGlyph, { color: palette.secondaryText }]}>☺</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.snug,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.tight,
    paddingHorizontal: spacing.roomy,
    paddingBottom: spacing.regular,
  },
  handle: {
    fontSize: typeScale.title,
    fontWeight: '700',
  },
  switcherChevron: {
    fontSize: typeScale.title,
    marginTop: -6,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.roomy,
    gap: spacing.loose,
  },
  avatar: {
    width: avatarDiameter.profileHeader,
    height: avatarDiameter.profileHeader,
    borderRadius: avatarDiameter.profileHeader / 2,
  },
  countRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  countColumn: {
    alignItems: 'center',
  },
  countValue: {
    fontSize: typeScale.count,
    fontWeight: '700',
  },
  countLabel: {
    fontSize: typeScale.body,
  },
  displayName: {
    paddingHorizontal: spacing.roomy,
    paddingTop: spacing.regular,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  bio: {
    paddingHorizontal: spacing.roomy,
    paddingTop: spacing.hair,
    fontSize: typeScale.body,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.snug,
    paddingHorizontal: spacing.roomy,
    paddingTop: spacing.roomy,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: spacing.snug,
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: spacing.loose,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.snug,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 1,
  },
  tabGlyph: {
    fontSize: typeScale.title,
  },
});
