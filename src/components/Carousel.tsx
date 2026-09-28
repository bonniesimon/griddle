import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions, type ViewToken } from 'react-native';

import { resolveMediaUri } from '@/storage/mediaStore';
import type { Media } from '@/types';

import { CarouselDots } from './CarouselDots';
import { mediaHeightFor } from './feedItemLayout';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

type CarouselProps = {
  media: Media[];
  onActiveIndexChange?: (activeIndex: number) => void;
};

export const activeIndexFromViewableItems = (viewableItems: ViewToken[]) => {
  const firstVisibleItem = viewableItems.find((item) => item.isViewable && item.index != null);
  return firstVisibleItem?.index ?? null;
};

export const Carousel = ({ media, onActiveIndexChange }: CarouselProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const slideHeight = mediaHeightFor(media, screenWidth);

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
        style={{ width: screenWidth, height: slideHeight }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        recyclingKey={item.id}
      />
    ),
    [screenWidth, slideHeight]
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
