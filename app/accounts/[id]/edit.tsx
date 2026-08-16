import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AccountForm } from '@/components/AccountForm';
import { EmptyState } from '@/components/EmptyState';
import { useAccount } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { usePalette } from '@/theme/usePalette';

const EditAccountScreen = () => {
  const palette = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const account = useAccount(id);
  const updateAccount = useAppStore((state) => state.updateAccount);

  if (!account) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <EmptyState title="Account not found" message="It may have been deleted." />
      </View>
    );
  }

  return (
    <AccountForm
      submitLabel="Save profile"
      initialDraft={{
        displayName: account.displayName,
        handleWithoutAtSign: account.handleWithoutAtSign,
        bio: account.bio,
        avatarPath: account.avatarPath,
        displayedFollowerCount: account.displayedFollowerCount,
        displayedFollowingCount: account.displayedFollowingCount,
      }}
      onSubmit={(draft) => {
        updateAccount(account.id, draft);
        router.back();
      }}
    />
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});

export default EditAccountScreen;
