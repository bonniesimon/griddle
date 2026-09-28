import { fireEvent, render, screen } from '@testing-library/react-native';

import { PostActionsSheet } from '@/components/PostActionsSheet';
import type { Post } from '@/types';

const buildPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  accountId: 'account-primary',
  media: [],
  gridCoverIndex: 0,
  caption: '',
  gridPosition: 0,
  isArchived: false,
  archivedAt: null,
  createdAt: 1_000,
  ...overrides,
});

const renderSheet = async (post: Post) => {
  const callbacks = {
    onEdit: jest.fn(),
    onArchiveOrRestore: jest.fn(),
    onDelete: jest.fn(),
    onCancel: jest.fn(),
  };

  await render(<PostActionsSheet post={post} {...callbacks} />);

  return callbacks;
};

describe('PostActionsSheet', () => {
  it('offers to archive a post that is in the grid', async () => {
    await renderSheet(buildPost());

    expect(screen.getByText('Archive')).toBeTruthy();
    expect(screen.queryByText('Restore to grid')).toBeNull();
  });

  it('offers to restore a post that is already archived', async () => {
    await renderSheet(buildPost({ isArchived: true, archivedAt: 2_000 }));

    expect(screen.getByText('Restore to grid')).toBeTruthy();
    expect(screen.queryByText('Archive')).toBeNull();
  });

  it('edits from the edit control', async () => {
    const { onEdit } = await renderSheet(buildPost());

    fireEvent.press(screen.getByTestId('post-actions-edit'));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('archives from the archive control', async () => {
    const { onArchiveOrRestore } = await renderSheet(buildPost());

    fireEvent.press(screen.getByTestId('post-actions-archive'));

    expect(onArchiveOrRestore).toHaveBeenCalledTimes(1);
  });

  it('restores from the same control on an archived post', async () => {
    const { onArchiveOrRestore } = await renderSheet(
      buildPost({ isArchived: true, archivedAt: 2_000 })
    );

    fireEvent.press(screen.getByTestId('post-actions-archive'));

    expect(onArchiveOrRestore).toHaveBeenCalledTimes(1);
  });

  it('deletes from the delete control', async () => {
    const { onDelete } = await renderSheet(buildPost());

    fireEvent.press(screen.getByTestId('post-actions-delete'));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('cancels from the cancel control', async () => {
    const { onCancel } = await renderSheet(buildPost());

    fireEvent.press(screen.getByTestId('post-actions-cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels from a tap on the backdrop', async () => {
    const { onCancel } = await renderSheet(buildPost());

    fireEvent.press(screen.getByTestId('post-actions-backdrop'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
