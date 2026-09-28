import { render, screen } from '@testing-library/react-native';
import type { ViewToken } from 'react-native';

import { activeIndexFromViewableItems } from '@/components/Carousel';
import { CarouselDots } from '@/components/CarouselDots';
import type { Media } from '@/types';

jest.mock('@/storage/mediaStore', () => ({
  resolveMediaUri: (relativePath: string) => `file:///documents/${relativePath}`,
}));

const buildMedia = (id: string, width = 1080, height = 1080): Media => ({
  id,
  fullResolutionPath: `media/${id}.jpg`,
  thumbnailPath: `media/${id}-thumbnail.jpg`,
  width,
  height,
});

const viewableItemAt = (index: number): ViewToken => ({
  index,
  isViewable: true,
  item: buildMedia(`slide-${index}`),
  key: `slide-${index}`,
});

describe('tracking the active slide', () => {
  it('takes the first viewable slide as the active one', () => {
    expect(activeIndexFromViewableItems([viewableItemAt(2), viewableItemAt(3)])).toBe(2);
  });

  it('ignores slides that have scrolled out of view', () => {
    const partlyVisible: ViewToken[] = [
      { ...viewableItemAt(1), isViewable: false },
      viewableItemAt(4),
    ];

    expect(activeIndexFromViewableItems(partlyVisible)).toBe(4);
  });

  it('keeps the current slide when nothing is viewable yet', () => {
    expect(activeIndexFromViewableItems([])).toBeNull();
  });
});

describe('CarouselDots', () => {
  it('renders no dots for a single-image post', async () => {
    await render(<CarouselDots dotCount={1} activeIndex={0} />);

    expect(screen.queryByTestId('carousel-dots')).toBeNull();
  });

  it('renders one dot per image with the first active to start', async () => {
    await render(<CarouselDots dotCount={3} activeIndex={0} />);

    expect(screen.getAllByTestId('carousel-dot-active')).toHaveLength(1);
    expect(screen.getAllByTestId('carousel-dot')).toHaveLength(2);
  });

  it('advances the active dot as the carousel scrolls', async () => {
    const scrolledToLastSlide = activeIndexFromViewableItems([viewableItemAt(2)]);
    await render(<CarouselDots dotCount={3} activeIndex={scrolledToLastSlide ?? 0} />);

    const dots = screen.getByTestId('carousel-dots').children;
    expect(dots).toHaveLength(3);
    expect(screen.getAllByTestId('carousel-dot-active')).toHaveLength(1);
    expect(screen.getAllByTestId('carousel-dot')).toHaveLength(2);
  });
});
