# Instagram Grid Previewer — Implementation Plan

## Context

`/Users/bonstine/dev/indie/prejudice` is an empty directory. This is a greenfield build.

**The problem:** Instagram's grid is a composition. A photo that looks great alone can wreck the visual rhythm of
the 3-column grid it lands in, and once a post is published, the only way to fix the grid is to delete it. There is
no way inside Instagram to see what a batch of upcoming posts will look like together before committing.

**The outcome:** a local, offline mobile app that mimics the Instagram profile screen closely enough to be a real
planning surface. Add candidate posts, drag them around until the grid reads well, temporarily archive posts to test
the grid without them, and keep separate grids for separate Instagram accounts. Nothing publishes anywhere — this is
a private sandbox that mirrors what Instagram *would* look like.

**Decisions confirmed with the user:**

| Decision | Choice |
| --- | --- |
| Platform | React Native via Expo (iOS + Android) |
| Storage | Local-only, on-device. No backend, no network, no sync. |
| Accounts | Local profiles, no auth. An "account" is a named workspace. |
| Fidelity | IG-style profile page + tap-to-open post detail with working carousel |

**Assumption flagged:** the user selected "local-only, in-browser" alongside React Native. A native app has no
browser, so this is implemented as local-only *on-device*: image files in the app's document directory, metadata in
on-device key-value storage. Same privacy and zero-cost properties, no backend either way.

**Explicitly out of scope:** any Instagram API or login, publishing/scheduling real posts, cloud sync, multi-device,
image editing/filters, Reels or Stories or Tagged tabs.

---

## Scope

### In scope (the four requested features)

1. **Add an image** — pick from the device photo library, becomes a single-image post at the top of the grid.
2. **Carousel posts** — pick up to 10 images for one post; grid shows the cover with the IG multi-image badge; post
   detail swipes horizontally with dot indicators, exactly like Instagram.
3. **Switch accounts** — multiple named local profiles, each with a fully independent grid, avatar, handle, and bio.
4. **Archive** — pull a post out of the grid without deleting it, view archived posts separately, restore it back
   into its old slot.

### In scope by implication

**Drag-to-reorder the grid.** The stated goal is "plan my instagram uploads" — a preview you cannot rearrange is not
a planning tool, it is a slideshow. Reordering is treated as core, not an extra.

Also included because the features above are unusable without them: choosing which image in a carousel is the grid
cover, deleting a post permanently, and editing an account's profile details.


## Architecture

### Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Package manager | Yarn 4 via corepack, `nodeLinker: node-modules` | No npm; hoisted layout keeps Metro happy |
| Framework | Expo (latest SDK), TypeScript | Managed workflow; no native module wrangling here |
| Navigation | `expo-router` | File-based routing, Expo default, handles modal screens cleanly |
| Image picking | `expo-image-picker` | Native multi-select photo picker |
| File storage | `expo-file-system` | Copies picked images into app-owned storage |
| Thumbnails | `expo-image-manipulator` | Downscale to ~400px for grid cells |
| Image rendering | `expo-image` | Disk/memory caching; much better grid scroll than RN `Image` |
| Metadata | `@react-native-async-storage/async-storage` | Data is small and document-shaped; SQLite is overkill |
| State | `zustand` + `persist` middleware | Minimal boilerplate, persists straight to AsyncStorage |
| Reordering | `react-native-reorderable-list` | Maintained, Reanimated 3-native, supports grids |
| Gestures/animation | `react-native-gesture-handler`, `react-native-reanimated` | Peer deps of the above |
| Tests | `jest` + `jest-expo`, `@testing-library/react-native` | Expo's supported test setup |
| Lint | `eslint` + `eslint-config-expo`, Prettier | Mechanically enforces the `AGENTS.md` code style |

**Storage split:** image *files* live on the filesystem (never in AsyncStorage — it is not built for blobs and would
blow up). AsyncStorage holds only JSON metadata with **relative** paths. Paths must be relative because iOS changes
the app container UUID between installs; an absolute path stored today is a broken path after the next build.
Resolve to absolute at read time via a single `resolveMediaUri()` helper.

**Storage boundary:** all reads and writes go through `src/storage/`. Nothing else in the app touches AsyncStorage or
the filesystem directly. If this ever needs cloud sync, that directory is the only thing that changes.

### Data model

Per the no-comments rule in `AGENTS.md`, every constraint that would have been a trailing comment is carried by a
name, a named type, or a named constant instead.

```ts
// src/types.ts
export const MAX_MEDIA_PER_POST = 10;
export const THUMBNAIL_MAX_EDGE_PX = 400;

export type RelativeMediaPath = string;
export type EpochMillis = number;

export type Account = {
  id: string;
  displayName: string;
  handleWithoutAtSign: string;
  avatarPath: RelativeMediaPath | null;
  bio: string;
  displayedFollowerCount: number;
  displayedFollowingCount: number;
  createdAt: EpochMillis;
};

export type Media = {
  id: string;
  fullResolutionPath: RelativeMediaPath;
  thumbnailPath: RelativeMediaPath;
  width: number;
  height: number;
};

export type Post = {
  id: string;
  accountId: string;
  media: Media[];
  gridCoverIndex: number;
  caption: string;
  gridPosition: number;
  isArchived: boolean;
  archivedAt: EpochMillis | null;
  createdAt: EpochMillis;
};
```

`displayedFollowerCount` names itself as a vanity number, so nobody expects it to come from Instagram.
`gridCoverIndex` says it indexes `media` for grid display, which also makes clear that `media[0]` is not implicitly
the cover. `handleWithoutAtSign` puts the storage format in the name; a `formatHandle()` helper adds the `@` at
render time. The `1..10` bound becomes `MAX_MEDIA_PER_POST`, validated in the store rather than described in a
comment.

**Ordering.** `gridPosition` is a contiguous integer per account, `0` = top-left, matching Instagram's newest-first
layout. Reorder = splice the array and reassign `0..n-1`. With realistic post counts (tens to low hundreds) full
reindexing costs nothing, and it keeps the invariant trivially checkable — worth far more than the
micro-optimisation of fractional indexing.

**Archive/restore.** Archiving sets `isArchived = true` and **retains** `gridPosition`. The grid renders only
unarchived posts sorted by `gridPosition`, so gaps are invisible. Restoring flips the flag back and the post
reappears in its old relative slot. After either operation, reindex the account's *unarchived* posts to stay
contiguous, and reindex archived posts among themselves so restore order stays stable. Both are pure functions and
both get unit tests — this is the single place where subtle ordering bugs will hide.

**Deletion.** Deleting a post removes its metadata *and* unlinks its files from disk. Skipping the file cleanup
silently grows the app to gigabytes over months of use.

### File layout

Routes follow the DHH-style resourceful convention documented in `AGENTS.md` (symlinked to `CLAUDE.md`): plural
resource directories, at most the four screen actions `index`/`new`/`show`/`edit`, and a record's screens nested
under `[id]/`.

```
app/
  _layout.tsx                  # root: providers, gesture handler, theme
  index.tsx                    # profile grid — accounts#show for the active account
  posts/
    new.tsx                    # posts#new — add post (modal)
    [id]/
      index.tsx                # posts#show — carousel + actions
      edit.tsx                 # posts#edit — reorder media, set cover, caption
  archived-posts/
    index.tsx                  # archived_posts#index — archive grid
  accounts/
    index.tsx                  # accounts#index — list / switcher (modal)
    new.tsx                    # accounts#new
    [id]/
      edit.tsx                 # accounts#edit — profile details
src/
  types.ts
  store/
    useAppStore.ts             # zustand store, persisted
    selectors.ts               # activeAccount, gridPosts, archivedPosts
    ordering.ts                # PURE: reorder, reindex, archive, restore
  storage/
    mediaStore.ts              # copy-in, thumbnail, delete, resolveMediaUri
    persist.ts                 # AsyncStorage adapter + schema version
    backup.ts                  # export / import bundle
  components/
    ProfileHeader.tsx
    GridCell.tsx               # square cell + carousel badge
    PostGrid.tsx               # 3-col reorderable grid
    Carousel.tsx               # paged FlatList + dot indicators
    EmptyState.tsx
  theme/
    tokens.ts                  # IG-ish spacing, colors, light+dark
__tests__/
  ordering.test.ts
  mediaStore.test.ts
```

### Instagram fidelity details

These are the specifics that make it read as Instagram rather than "a grid of photos":

- **Grid:** 3 columns, square cells (`aspectRatio: 1`), ~1.5px gutters, images `contentFit="cover"` so the crop
  matches what Instagram actually shows.
- **Carousel badge:** the stacked-squares icon, top-right of the cell, white with a subtle shadow, shown only when
  `media.length > 1`.
- **Profile header:** circular avatar left, three stacked count/label columns right (posts is *computed* from
  unarchived post count; followers/following are user-set), then display name and bio below, then the grid/tagged
  tab row.
- **Post detail:** header row (small avatar + handle), full-width paged carousel at the media's aspect ratio, dot
  indicators below when multi-image, decorative action row (heart/comment/share — non-functional by design), then
  `handle + caption`.
- **Carousel behaviour:** horizontal `FlatList`, `pagingEnabled`, `snapToInterval` = screen width, dots track the
  active index via `onViewableItemsChanged`.

---

## Build order

Six milestones, each independently runnable so progress is visible on a device rather than only at the end.

**M1 — Scaffold.** In order: `corepack enable`, then
`yarn create expo-app . --template blank-typescript --no-install`, then `corepack use yarn@4` to write the
`packageManager` pin, then a `.yarnrc.yml` with `nodeLinker: node-modules`, then `yarn install`. Add dependencies
with `yarn expo install` so versions match the SDK. Configure `expo-router` and Reanimated's babel plugin, add theme
tokens and a blank profile screen. Set up ESLint with `func-style` and `prefer-arrow-callback` so the arrow-function
rule is enforced from the first commit rather than retrofitted. No comment-related lint rules — comments stay an
author judgment call. Confirm no `package-lock.json` was produced.
*Checkpoint: app boots on simulator; `yarn lint` and `yarn test` both pass; `yarn.lock` is the only lockfile.*

**M2 — Data layer + accounts.** `types.ts`, zustand store with persistence and a `schemaVersion` field, pure
`ordering.ts`, `mediaStore.ts`. Account list, create, edit, switch, delete. Auto-create a "My Account" profile on
first launch so the app is never in a zero-account dead end.
*Checkpoint: create two accounts, switch between them, kill and relaunch the app — the active account survives.*

**M3 — Add posts + grid.** Multi-select picker, copy files into app storage, generate thumbnails, write the post.
`PostGrid` + `GridCell` with the carousel badge. Profile header wired to real counts.
*Checkpoint: added posts render in an IG-looking grid and survive relaunch.*

**M4 — Post detail + carousel.** `Carousel.tsx`, post detail screen, edit screen for caption/cover/media order,
delete-with-file-cleanup.
*Checkpoint: multi-image posts swipe with correct dot tracking; changing the cover updates the grid cell.*

**M5 — Archive.** Archive action from post detail and long-press on a grid cell, the `archived-posts/index` screen,
restore-to-previous-position, permanent delete from archive.
*Checkpoint: archive a middle post, confirm the grid closes the gap; restore it and confirm it lands back in its
original slot.*

**M6 — Reorder + polish.** Drag-to-reorder with haptics, empty states, light/dark, export/import backup.
*Checkpoint: reorder, force-quit, relaunch — order persists.*

---

## Verification

**Automated** (`yarn lint && yarn test`):

`yarn lint` must be clean. It covers the arrow-function rule only; naming quality and the no-comments default are
review standards that lint cannot check, and comments are never blocked mechanically.


- `ordering.test.ts` — reorder produces contiguous `0..n-1`; archive preserves `gridPosition` and leaves the visible
  grid contiguous; restore returns a post to its original relative slot; archive-then-reorder-then-restore lands
  sensibly; posts never leak across accounts.
- `mediaStore.test.ts` — copy-in produces relative paths; delete unlinks every file including thumbnails;
  `resolveMediaUri` handles a changed document directory (the iOS reinstall case).
- Component smoke tests: `GridCell` shows the carousel badge only when `media.length > 1`; `Carousel` advances the
  active dot on scroll.

**Manual on device/simulator** (`yarn expo start`), the flows tests cannot cover:

1. Add a single image → appears top-left of the grid.
2. Add a 5-image carousel → badge shows; open it, swipe all five, dots track correctly.
3. Change the cover to image 3 → grid cell updates, carousel order unchanged.
4. Create a second account → its grid is empty; switch back → first grid intact.
5. Archive a middle post → grid closes the gap, post count decrements. Restore → returns to its original slot.
6. Drag a post from position 8 to position 1 → grid re-flows.
7. Force-quit and relaunch → accounts, order, archive state all intact.
8. Delete a post, then check the document directory → its files are gone.
9. Airplane mode → everything still works.
10. Toggle system dark mode → readable in both.

**Performance check:** load ~100 posts and scroll the grid. Should hold ~60fps. If it does not, the grid is
rendering full-resolution images instead of thumbnails — that is the first thing to check.

---

## Risks

- **iOS app container UUID changes between installs, breaking absolute paths.**
  Store relative paths only; resolve to absolute at read time in one helper.
- **Grid stutters on large libraries.**
  Thumbnails in the grid, full-res only in post detail; rely on `expo-image` caching.
- **A phone reset or app delete wipes all planning data.**
  Export/import backup bundle in M6. This is the real cost of local-only storage and the user should know it.
- **Persisted schema changes break existing data.**
  `schemaVersion` field plus a zustand `migrate` function, in place from the start rather than retrofitted.
- **Reorder library friction with the installed Reanimated version.**
  Verify at M1 with a throwaway list; fall back to `react-native-draggable-flatlist` if it fights the version.
- **Yarn's default PnP linker breaks Metro and native autolinking.**
  Set `nodeLinker: node-modules` in `.yarnrc.yml` as part of M1, before installing anything. Symptoms if missed are
  confusing module-resolution errors at bundle time rather than an obvious install failure.

