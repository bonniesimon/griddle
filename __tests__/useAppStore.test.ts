import { gridPostsInDisplayOrder } from '@/store/ordering';
import { useAppStore } from '@/store/useAppStore';
import type { Media } from '@/types';

jest.mock('@/storage/mediaStore', () => ({
  deleteAvatarFile: jest.fn(),
  deleteMediaFiles: jest.fn(),
}));

const buildMedia = (id: string): Media => ({
  id,
  fullResolutionPath: `media/${id}.jpg`,
  thumbnailPath: `media/${id}-thumbnail.jpg`,
  width: 1080,
  height: 1080,
});

const activeAccountId = () => useAppStore.getState().activeAccountId ?? '';

const gridMediaIdsInOrder = () =>
  gridPostsInDisplayOrder(useAppStore.getState().posts, activeAccountId()).map((post) =>
    post.media.map((media) => media.id)
  );

beforeEach(() => {
  useAppStore.setState({ accounts: [], posts: [], activeAccountId: null });
  useAppStore.getState().ensureAtLeastOneAccountExists();
});

describe('creating posts from an import', () => {
  it('creates one post per photo in separate-posts mode', () => {
    const media = [buildMedia('one'), buildMedia('two'), buildMedia('three')];

    const created = useAppStore.getState().createPostsFromImport(media, 'ignored', 'separatePosts');

    expect(created).toHaveLength(3);
    expect(created.every((post) => post.media.length === 1)).toBe(true);
  });

  it('leaves separate posts captionless even when a caption was typed', () => {
    const media = [buildMedia('one'), buildMedia('two')];

    const created = useAppStore.getState().createPostsFromImport(media, 'typed', 'separatePosts');

    expect(created.map((post) => post.caption)).toEqual(['', '']);
  });

  it('lands a separate-posts batch in pick order, first photo top-left', () => {
    const media = [buildMedia('one'), buildMedia('two'), buildMedia('three')];

    useAppStore.getState().createPostsFromImport(media, '', 'separatePosts');

    expect(gridMediaIdsInOrder()).toEqual([['one'], ['two'], ['three']]);
  });

  it('puts a new batch above everything already in the grid', () => {
    useAppStore.getState().createPostsFromImport([buildMedia('old')], '', 'separatePosts');
    useAppStore
      .getState()
      .createPostsFromImport([buildMedia('new-one'), buildMedia('new-two')], '', 'separatePosts');

    expect(gridMediaIdsInOrder()).toEqual([['new-one'], ['new-two'], ['old']]);
  });

  it('creates one carousel post carrying the caption in carousel mode', () => {
    const media = [buildMedia('one'), buildMedia('two'), buildMedia('three')];

    const created = useAppStore.getState().createPostsFromImport(media, 'a caption', 'oneCarousel');

    expect(created).toHaveLength(1);
    expect(created[0]?.media.map((item) => item.id)).toEqual(['one', 'two', 'three']);
    expect(created[0]?.caption).toBe('a caption');
    expect(created[0]?.gridCoverIndex).toBe(0);
  });

  it('treats an unset mode as a single post, as before', () => {
    const created = useAppStore.getState().createPostsFromImport([buildMedia('only')], 'hi', null);

    expect(created).toHaveLength(1);
    expect(created[0]?.caption).toBe('hi');
  });

  it('assigns every created post to the active account and leaves it unarchived', () => {
    const created = useAppStore
      .getState()
      .createPostsFromImport([buildMedia('one'), buildMedia('two')], '', 'separatePosts');

    expect(created.every((post) => post.accountId === activeAccountId())).toBe(true);
    expect(created.every((post) => !post.isArchived)).toBe(true);
    expect(created.map((post) => post.gridPosition)).toEqual([0, 1]);
  });

  it('creates nothing without an active account', () => {
    useAppStore.setState({ activeAccountId: null });

    const created = useAppStore.getState().createPostsFromImport([buildMedia('one')], '', null);

    expect(created).toEqual([]);
    expect(useAppStore.getState().posts).toEqual([]);
  });

  it('creates nothing from an empty selection', () => {
    expect(useAppStore.getState().createPostsFromImport([], '', 'separatePosts')).toEqual([]);
  });
});
