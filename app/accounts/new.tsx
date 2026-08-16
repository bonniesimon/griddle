import { useRouter } from 'expo-router';

import { AccountForm } from '@/components/AccountForm';
import { useAppStore } from '@/store/useAppStore';

const NewAccountScreen = () => {
  const router = useRouter();
  const createAccount = useAppStore((state) => state.createAccount);
  const switchToAccount = useAppStore((state) => state.switchToAccount);

  return (
    <AccountForm
      submitLabel="Create account"
      initialDraft={{
        displayName: '',
        handleWithoutAtSign: '',
        bio: '',
        avatarPath: null,
        displayedFollowerCount: 0,
        displayedFollowingCount: 0,
      }}
      onSubmit={(draft) => {
        const account = createAccount(draft);
        switchToAccount(account.id);
        router.dismissAll();
      }}
    />
  );
};

export default NewAccountScreen;
