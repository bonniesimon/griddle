import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions, type ViewToken } from 'react-native';

import { resolveMediaUri } from '@/storage/mediaStore';
import type { Media } from '@/types';

import { CarouselDots } from './CarouselDots';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };
const TALLEST_ALLOWED_ASPECT_RATIO = 4 / 5;

type CarouselProps = {
  media: Media[];
  onActiveIndexChange?: (activeIndex: number) => void;
};

export const aspectRatioClampedToPortraitLimit = (media: Media[]) => {
  const firstMedia = media[0];
  if (!firstMedia || firstMedia.height === 0) return 1;
  return Math.max(firstMedia.width / firstMedia.height, TALLEST_ALLOWED_ASPECT_RATIO);
};

export const activeIndexFromViewableItems = (viewableItems: ViewToken[]) => {
  const firstVisibleItem = viewableItems.find((item) => item.isViewable && item.index != null);
  return firstVisibleItem?.index ?? null;
};

export const Carousel = ({ media, onActiveIndexChange }: CarouselProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const aspectRatio = aspectRatioClampedToPortraitLimit(media);

  const onActiveIndexChangeRef = useRef(onActiveIndexChange);

  useEffect(() => {
    onActiveIndexChangeRef.current = onActiveIndexChange;
  }, [onActiveIndexChange]);

  const trackActiveIndex = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const nextActiveIndex = activeIndexFromViewableItems(viewableItems);
    if (nextActiveIndex === null) return;
    setActiveIndex(nextActiveIndex);
    onActiveIndexChangeRef.current?.(nextActiveIndex);
  }, []);

  const renderSlide = useCallback(
    ({ item }: { item: Media }) => (
      <Image
        source={{ uri: resolveMediaUri(item.fullResolutionPath) }}
        style={{ width: screenWidth, aspectRatio }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
    ),
    [screenWidth, aspectRatio]
  );

  return (
    <View testID="carousel">
      <FlatList
        data={media}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        snapToInterval={screenWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onViewableItemsChanged={trackActiveIndex}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
      <CarouselDots dotCount={media.length} activeIndex={activeIndex} />
    </View>
  );
};
