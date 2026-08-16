import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PostGrid } from '@/components/PostGrid';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useActiveAccount, useGridPosts, useVisiblePostCount } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';

const ProfileScreen = () => {
  const palette = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const activeAccount = useActiveAccount();
  const gridPosts = useGridPosts();
  const visiblePostCount = useVisiblePostCount();

  if (!hasHydrated || !activeAccount) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.secondaryText} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      <Animated.ScrollView
        ref={scrollableRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.section }}
      >
        <PostGrid
          posts={gridPosts}
          scrollableRef={scrollableRef}
          ListHeaderComponent={
            <ProfileHeader account={activeAccount} visiblePostCount={visiblePostCount} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Plan your grid"
              message="Add the photos you are thinking of posting and drag them until the grid reads well."
              actionLabel="Add your first post"
              onPressAction={() => router.push('/posts/new')}
            />
          }
        />
      </Animated.ScrollView>

      <Pressable
        style={[
          styles.addButton,
          { backgroundColor: palette.accent, bottom: insets.bottom + spacing.loose },
        ]}
        onPress={() => router.push('/posts/new')}
      >
        <Text style={styles.addButtonGlyph}>+</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    right: spacing.loose,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  addButtonGlyph: {
    color: '#FFFFFF',
    fontSize: typeScale.count + 12,
    lineHeight: typeScale.count + 14,
    fontWeight: '400',
  },
});

export default ProfileScreen;
