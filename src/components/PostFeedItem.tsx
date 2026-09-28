import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveMediaUri } from '@/storage/mediaStore';
import { avatarDiameter, spacing, typeScale } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';
import { formatHandle, type Account, type Post } from '@/types';

import { Carousel } from './Carousel';
import {
  CAPTION_LINE_HEIGHT,
  CAPTION_LINE_LIMIT,
  FEED_ACTION_ROW_HEIGHT,
  FEED_AUTHOR_ROW_HEIGHT,
  FEED_CAPTION_BLOCK_HEIGHT,
  FEED_ITEM_TRAILING_SPACE,
} from './feedItemLayout';

const DECORATIVE_ACTION_GLYPHS = ['♡', '💬', '↗'];
const POST_ACTIONS_GLYPH = '⋯';

type PostFeedItemProps = {
  post: Post;
  account: Account;
  onPressActions: () => void;
};

export const PostFeedItem = ({ post, account, onPressActions }: PostFeedItemProps) => {
  const palette = usePalette();
  const handle = formatHandle(account.handleWithoutAtSign);

  return (
    <View testID={`post-feed-item-${post.id}`}>
      <View style={styles.authorRow}>
        {account.avatarPath ? (
          <Image
            source={{ uri: resolveMediaUri(account.avatarPath) }}
            style={styles.authorAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.authorAvatar, { backgroundColor: palette.placeholder }]} />
        )}
        <Text style={[styles.authorHandle, { color: palette.primaryText }]}>{handle}</Text>
        <Pressable
          style={styles.actionsButton}
          onPress={onPressActions}
          testID={`open-post-actions-${post.id}`}
        >
          <Text style={[styles.actionsGlyph, { color: palette.primaryText }]}>
            {POST_ACTIONS_GLYPH}
          </Text>
        </Pressable>
      </View>

      <Carousel media={post.media} />

      <View style={styles.actionRow}>
        {DECORATIVE_ACTION_GLYPHS.map((glyph) => (
          <Text key={glyph} style={[styles.actionGlyph, { color: palette.primaryText }]}>
            {glyph}
          </Text>
        ))}
      </View>

      {post.caption.length > 0 ? (
        <Text
          style={[styles.caption, { color: palette.primaryText }]}
          numberOfLines={CAPTION_LINE_LIMIT}
        >
          <Text style={styles.captionHandle}>{handle} </Text>
          {post.caption}
        </Text>
      ) : null}

      <View style={styles.trailingSpace} />
    </View>
  );
};

const styles = StyleSheet.create({
  authorRow: {
    height: FEED_AUTHOR_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.snug,
    paddingHorizontal: spacing.regular,
  },
  authorAvatar: {
    width: avatarDiameter.postDetail,
    height: avatarDiameter.postDetail,
    borderRadius: avatarDiameter.postDetail / 2,
  },
  authorHandle: {
    flex: 1,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  actionsButton: {
    paddingHorizontal: spacing.snug,
    paddingVertical: spacing.tight,
  },
  actionsGlyph: {
    fontSize: typeScale.count,
    fontWeight: '600',
  },
  actionRow: {
    height: FEED_ACTION_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.loose,
    paddingHorizontal: spacing.regular,
  },
  actionGlyph: {
    fontSize: typeScale.count,
  },
  caption: {
    height: FEED_CAPTION_BLOCK_HEIGHT,
    paddingHorizontal: spacing.regular,
    paddingTop: spacing.snug,
    fontSize: typeScale.body,
    lineHeight: CAPTION_LINE_HEIGHT,
  },
  captionHandle: {
    fontWeight: '600',
  },
  trailingSpace: {
    height: FEED_ITEM_TRAILING_SPACE,
  },
});
