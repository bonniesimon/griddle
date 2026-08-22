import { fireEvent, render, screen } from '@testing-library/react-native';

import { ImportModeSheet } from '@/components/ImportModeSheet';
import { MAX_MEDIA_PER_POST } from '@/types';

const renderSheet = async (photoCount: number) => {
  const onChooseMode = jest.fn();
  const onCancel = jest.fn();
  await render(
    <ImportModeSheet photoCount={photoCount} onChooseMode={onChooseMode} onCancel={onCancel} />
  );
  return { onChooseMode, onCancel };
};

describe('ImportModeSheet', () => {
  it('names the count in the title and in the separate-posts option', async () => {
    await renderSheet(4);

    expect(screen.getByText('4 photos selected')).toBeTruthy();
    expect(screen.getByText('Add as 4 separate posts')).toBeTruthy();
  });

  it('offers the carousel at exactly the carousel limit', async () => {
    const { onChooseMode } = await renderSheet(MAX_MEDIA_PER_POST);

    fireEvent.press(screen.getByTestId('import-mode-carousel'));

    expect(onChooseMode).toHaveBeenCalledWith('oneCarousel');
  });

  it('disables the carousel past the limit and says why', async () => {
    const { onChooseMode } = await renderSheet(MAX_MEDIA_PER_POST + 1);

    fireEvent.press(screen.getByTestId('import-mode-carousel'));

    expect(onChooseMode).not.toHaveBeenCalled();
    expect(screen.getByText(`A carousel holds ${MAX_MEDIA_PER_POST} photos.`)).toBeTruthy();
  });

  it('still offers separate posts past the carousel limit', async () => {
    const { onChooseMode } = await renderSheet(MAX_MEDIA_PER_POST + 5);

    fireEvent.press(screen.getByTestId('import-mode-separate'));

    expect(onChooseMode).toHaveBeenCalledWith('separatePosts');
  });

  it('cancels from the cancel button', async () => {
    const { onCancel } = await renderSheet(4);

    fireEvent.press(screen.getByTestId('import-mode-cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels from a tap on the backdrop', async () => {
    const { onCancel } = await renderSheet(4);

    fireEvent.press(screen.getByTestId('import-mode-backdrop'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
