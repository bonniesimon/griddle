import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';

const DOT_DIAMETER = 6;

export const CAROUSEL_DOTS_HEIGHT = DOT_DIAMETER + spacing.snug * 2;

type CarouselDotsProps = {
  dotCount: number;
  activeIndex: number;
};

export const CarouselDots = ({ dotCount, activeIndex }: CarouselDotsProps) => {
  const palette = usePalette();

  if (dotCount < 2) return null;

  return (
    <View style={styles.row} testID="carousel-dots">
      {Array.from({ length: dotCount }, (_, index) => (
        <View
          key={index}
          testID={index === activeIndex ? 'carousel-dot-active' : 'carousel-dot'}
          style={[
            styles.dot,
            { backgroundColor: index === activeIndex ? palette.accent : palette.separator },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    height: CAROUSEL_DOTS_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.tight,
  },
  dot: {
    width: DOT_DIAMETER,
    height: DOT_DIAMETER,
    borderRadius: DOT_DIAMETER / 2,
  },
});
