import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PostFeed } from '@/components/PostFeed';
import { useAccount, usePost } from '@/store/selectors';
import { usePalette } from '@/theme/usePalette';

const PostDetailScreen = () => {
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const account = useAccount(post?.accountId);

  if (!post || !account) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <EmptyState title="Post not found" message="It may have been deleted." />
      </View>
    );
  }

  return <PostFeed anchorPost={post} account={account} />;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});

export default PostDetailScreen;
