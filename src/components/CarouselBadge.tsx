import { StyleSheet, View } from 'react-native';

const BADGE_SQUARE_SIZE = 11;
const BADGE_OFFSET = 3;

export const CarouselBadge = () => (
  <View style={styles.container} pointerEvents="none" testID="carousel-badge">
    <View style={[styles.square, styles.backSquare]} />
    <View style={[styles.square, styles.frontSquare]} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: BADGE_SQUARE_SIZE + BADGE_OFFSET,
    height: BADGE_SQUARE_SIZE + BADGE_OFFSET,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  square: {
    position: 'absolute',
    width: BADGE_SQUARE_SIZE,
    height: BADGE_SQUARE_SIZE,
    borderRadius: 3,
    borderWidth: 1.6,
    borderColor: '#FFFFFF',
  },
  backSquare: {
    top: 0,
    right: 0,
  },
  frontSquare: {
    bottom: 0,
    left: 0,
    backgroundColor: 'transparent',
  },
});
