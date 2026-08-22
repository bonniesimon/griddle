# Multi-photo import: one post or many

Part one is the product plan; part two is the implementation plan that follows from it.

## Context

Griddle exists to answer one question: *what will my grid look like after I post these?* Everything else — accounts,
archive, drag-to-reorder — is in service of that.

Today, picking photos can only answer that question for a carousel. `app/posts/new.tsx` launches the library picker
with `allowsMultipleSelection`, and every asset that comes back becomes **one post** with a carousel. Ten photos
produce a single grid cell.

That is the wrong default for the app's main job. Someone planning a week of uploads picks the seven photos they
intend to post as seven posts, and Griddle collapses them into one cell showing a single cover. The only way to get
seven cells today is to open the picker seven times, choosing one photo each time, and tap through the compose
screen seven times. The feature the app is named after — seeing a batch of upcoming posts *as a grid* — is the
slowest path in the product.

**The outcome:** picking several photos leads to an explicit choice — *N separate posts* or *one carousel* — made
once, immediately, in plain language, before anything is written to disk.

## Who this is for

The grid planner mid-batch. They have just come back from a shoot or a trip with a folder of candidates, they know
roughly which ones are going up, and they want them all in the grid so they can start dragging. They are not
thinking about carousels at that moment. When they *are* thinking about carousels, they are thinking about one
specific post, and they know it before they open the picker.

Both of those users pick multiple photos. Nothing about the selection itself distinguishes them, which is why the
app has to ask rather than guess.

## Decisions

| Question | Decision |
| --- | --- |
| How the choice is surfaced | An action sheet fires the moment the picker closes, before any import work |
| Default mode | None. Neither option is preselected; the sheet must be answered |
| Caption in separate-posts mode | Hidden. Posts are created captionless and captioned individually later |
| Photos per carousel | Unchanged at 10 (`MAX_MEDIA_PER_POST`) |
| Photos per import batch | 30 |
| Mixed grouping in one import | Out of scope for this release |

### Why an action sheet and not a default

A default is a guess, and a wrong guess here is expensive in both directions. Defaulting to carousel keeps today's
bad batch experience. Defaulting to separate posts silently changes what the picker does for anyone who has been
using it to build carousels, and they find out by looking at their grid afterwards.

The sheet costs one tap and removes the guess. It fires **before** photos are copied and thumbnailed, so *Cancel*
is genuinely free — no files written, no spinner, nothing to clean up. The two options name the actual outcome with
the real count, so the consequence is visible at the moment of choosing:

```
                4 photos selected

        [ Add as 4 separate posts ]
        [ Add as one carousel     ]
        [ Cancel                  ]
```

### Why captions are hidden for separate posts

One caption box above twelve thumbnails has no honest meaning. Applying its text to all twelve is a footgun, and a
box per photo turns a quick batch import into a twelve-field form — the opposite of the job. Captions are not what
the grid preview shows anyway; the grid shows covers. So separate-posts mode drops straight to the point: import,
show what will be created, create it. Each post's caption is one tap away on its own edit screen afterwards.

Carousel mode keeps the caption field exactly as it is today.

### Why 30 photos per batch, and 10 per carousel

The two caps answer different questions and should not be the same number. Ten per carousel is Instagram's limit and
is what the app is imitating — it stays. Thirty per batch is a device-protection limit: every imported photo is
copied and downscaled to a thumbnail on the main import pass, so an unbounded batch turns into a long opaque spinner
and, at a few hundred photos, a memory problem. Thirty comfortably covers a month of planning.

## Flows

### Multiple photos picked, mode not yet chosen

1. User taps **+** on the profile screen, lands on the compose screen, taps **Choose photos**.
2. System photo picker opens, limited to 30 selections.
3. User selects 4 photos and confirms. Picker closes.
4. The mode sheet appears immediately, naming the count: *Add as 4 separate posts* / *Add as one carousel* / *Cancel*.
5. User chooses. Only now does the import spinner appear and photos get copied and thumbnailed.
6. The compose screen reflects the chosen mode and states exactly what will be created.
7. User taps the save button. Posts appear in the grid; the app returns to the profile screen.

### One photo picked

No sheet — there is nothing to choose. The compose screen behaves exactly as it does today: one photo, caption
field, *Add to grid*. The session's mode stays unset, so if the user then adds more photos and the total passes one,
the sheet appears at that point.

### Adding more photos to an in-progress import

The sheet asks once per compose session. After the mode is set, **Add more** appends to the existing batch under
that mode's cap — up to 10 in carousel mode, up to 30 in separate-posts mode — with no second sheet.

### Changing the mode after choosing

The compose screen shows the current mode as a labelled row with a **Change** affordance that reopens the sheet.
Already-imported photos are kept; only the grouping changes. Switching to carousel is unavailable while more than 10
photos are in the batch, and the row says why rather than silently failing.

### Cancelling

- *Cancel* in the sheet: nothing is imported, no files are written, and the compose screen is left as it was.
- Removing a thumbnail before saving: unchanged from today — the × on each thumbnail drops that photo from the batch.
- Backing out of the compose screen entirely: no posts are created, as today.

## What the compose screen says

The screen must never leave the user guessing how many grid cells they are about to create. Both the mode row and
the save button carry the count.

| State | Mode row | Save button |
| --- | --- | --- |
| 1 photo | *(hidden)* | Add to grid |
| 4 photos, separate | 4 separate posts · Change | Add 4 posts |
| 4 photos, carousel | One carousel · Change | Add 1 post · 4 photos |
| 12 photos, separate | 12 separate posts · Change | Add 12 posts |
| 12 photos, separate, carousel unavailable | 12 separate posts · a carousel holds 10 photos | Add 12 posts |

In separate-posts mode the thumbnail strip reads as posts rather than as one post's contents: each thumbnail is one
future grid cell, and the strip's helper text says so. The "first photo becomes the grid cover" hint is carousel-only
and does not apply in separate-posts mode — every post is its own cover.

## Rules the result has to obey

- **Pick order is grid order.** After a separate-posts import, the first photo picked sits top-left, the second to
  its right, and so on, with the whole batch above everything that was already in the grid. A batch that lands
  reversed is a bug, not a detail.
- **The batch lands as a block.** The imported posts are contiguous at the top of the grid; nothing pre-existing is
  interleaved into them.
- **Each separate post is a normal post.** Single media item, its own id, no carousel badge, editable, archivable,
  draggable, deletable — indistinguishable from a post added one at a time.
- **Carousel mode is unchanged.** Same 10-photo cap, same cover-is-first-photo behaviour, same caption field, same
  badge on the grid cell.
- **All posts go to the active account** and count toward its visible post count.
- **A failed import creates nothing.** If copying or thumbnailing fails partway through a batch, no posts are
  created and no orphaned files are left behind. The user sees one error and their picked selection is not silently
  half-applied.

## Success criteria

1. Seven photos picked in one pass become seven grid cells in pick order, in one trip through the picker.
2. The same seven photos can instead become one carousel, and the path to that is no longer than it is today.
3. Neither outcome can happen by accident: the sheet has no default and names the count in both options.
4. *Cancel* leaves zero files on disk and zero posts in the store.
5. A single-photo pick is untouched — same taps, same screen, no new prompt.
6. Nothing about existing posts, the archive, drag ordering, or backup changes.

There are no analytics in this app and none are being added; success is judged by the flows above being walkable on
device.

## Out of scope

- **Mixed grouping in one import** — selecting 12 photos and grouping 3 of them into a carousel while the other 9
  become separate posts. Real, but it needs a grouping UI that is a much larger feature than this one, and the
  workaround (two imports) is cheap.
- **Batch undo after saving.** Removing an unwanted post from a saved batch uses the existing per-post delete. A
  single "undo this import" action is a reasonable follow-up if batches turn out to be mis-tapped often.
- **Remembering the last chosen mode** across compose sessions. That is a default by another name, and this plan
  deliberately has no default. Worth revisiting only if the sheet proves annoying in daily use.
- **Batch caption, batch archive, or batch reorder** of a freshly imported group.
- **Splitting an existing carousel** into separate posts, or merging existing posts into a carousel.
- **Raising the 10-photo carousel limit.** It mirrors Instagram and should keep mirroring it.


---

# Implementation plan

## Questions the product plan left open

| Question | Answer |
| --- | --- |
| `Alert.alert` or a component for the sheet? | A component. `Alert` is a no-op on `react-native-web` |
| Progress feedback for a 30-photo batch? | Yes — a photo counter, and the import runs sequentially |
| One batch store action or N calls? | One batch action. N calls to `addPostToTopOfGrid` reverses the batch |

**The sheet cannot be `Alert.alert`.** `react-native-web` does not implement `Alert`, and this app genuinely runs on
web — `mediaStore.web.ts` and `backup.web.ts` exist and `yarn web` is a script. An `Alert`-based sheet would leave
the web build importing photos with no way to choose a mode. `ActionSheetIOS` is iOS-only for the same reason. So
the sheet is a plain component built from `Modal` + `Pressable`, which also makes it directly testable with
`@testing-library/react-native` — the same route `CarouselDots` took.

**The import runs one photo at a time, not `Promise.all`.** Thirty parallel `ImageManipulator` passes is thirty
full-resolution decodes in flight on a phone. Sequential import bounds memory, makes the "Importing 7 of 30" counter
trivial, and makes cleanup after a failure exact. A batch is a background chore the user is watching a spinner for;
predictable beats fast.

## Current shape

The compose screen at `app/posts/new.tsx` holds `importedMedia: Media[]` and a caption, calls
`pickImagesFromDevice` with `selectionLimit: MAX_MEDIA_PER_POST - importedMedia.length`, imports every returned
asset with `Promise.all(pickedImages.map(importImageIntoAppStorage))`, and on save calls the store's
`createPostFromMedia(media, caption)` — which builds one `Post` and hands it to `addPostToTopOfGrid`.

`createPostFromMedia` has exactly one caller (that screen), so it can be replaced rather than supplemented.

Nothing about the `Post` type changes: a separate-posts import produces ordinary single-media posts. **No persisted
schema change, so `PERSISTED_SCHEMA_VERSION` stays at 1** and `migratePersistedState` is untouched.

## Files

| File | Change |
| --- | --- |
| `src/types.ts` | New: `MAX_MEDIA_PER_IMPORT`, `ImportMode`, capacity + label helpers |
| `src/store/ordering.ts` | New: `addPostsToTopOfGrid` batch insert |
| `src/store/useAppStore.ts` | `createPostFromMedia` → `createPostsFromImport` |
| `src/components/ImportModeSheet.tsx` | New: the choice sheet |
| `src/components/MediaStrip.tsx` | Cover tag stays carousel-only; no structural change |
| `app/posts/new.tsx` | Mode state, sheet wiring, per-mode picker limits, sequential import |
| `__tests__/ordering.test.ts` | Batch-insert cases |
| `__tests__/imports.test.ts` | New: capacity and label helpers |
| `__tests__/ImportModeSheet.test.tsx` | New: sheet rendering and callbacks |
| `__tests__/useAppStore.test.ts` | New: both modes through the store |

## Domain layer — `src/types.ts`

`types.ts` already holds pure display helpers next to the domain types (`formatHandle`, `coverMediaOf`,
`hasMultipleMedia`), so the import vocabulary belongs there rather than in a new directory.

```ts
export const MAX_MEDIA_PER_IMPORT = 30;

export type ImportMode = 'separatePosts' | 'oneCarousel';

export const photoCapacityFor = (importMode: ImportMode | null) =>
  importMode === 'oneCarousel' ? MAX_MEDIA_PER_POST : MAX_MEDIA_PER_IMPORT;

export const canGroupIntoOneCarousel = (photoCount: number) => photoCount <= MAX_MEDIA_PER_POST;

export const describeImportOutcome = (importMode: ImportMode | null, photoCount: number) => ...
export const describeChosenMode = (importMode: ImportMode, photoCount: number) => ...
```

`describeImportOutcome` returns the save-button label from the product plan's table — `Add to grid`, `Add 4 posts`,
`Add 1 post · 4 photos` — and is pure, so the copy is pinned by tests rather than by reading the screen. Singular
cases matter: two photos as separate posts is `Add 2 posts`, one photo is `Add to grid`.

## Ordering — `src/store/ordering.ts`

The pick-order rule is the whole reason this is a batch operation. Calling the existing `addPostToTopOfGrid` in a
loop puts each successive post above the previous one, so a batch picked 1-2-3 lands in the grid as 3-2-1.

```ts
export const addPostsToTopOfGrid = (posts: Post[], newPosts: Post[]) => { ... }
```

It mirrors `addPostToTopOfGrid`: take the account's current grid order, prepend the batch **in the order given**,
reassign positions with the existing `withGridPositionsReassigned`, and splice back through `replacingPostsOf`. An
empty batch returns `posts` untouched. All posts in a batch share one `accountId` — the active one — so it takes the
account from `newPosts[0]`.

`addPostToTopOfGrid` then becomes a one-element call to it, or is dropped if nothing else uses it.

## Store — `src/store/useAppStore.ts`

```ts
createPostsFromImport: (media: Media[], caption: string, importMode: ImportMode | null) => Post[];
```

Replaces `createPostFromMedia`. Returns the created posts (empty array when there is no active account or no media,
which is what the old `null` meant).

- `separatePosts` → one post per media item, `media: [item]`, `caption: ''`, `gridCoverIndex: 0`.
- `oneCarousel`, or a null mode with a single photo → one post holding `media.slice(0, MAX_MEDIA_PER_POST)` with the
  typed caption, exactly as today.

Every created post is otherwise a normal post: fresh `createId()`, active `accountId`, `isArchived: false`,
`archivedAt: null`, `createdAt: Date.now()`. Positions come from `addPostsToTopOfGrid`, so nothing sets
`gridPosition` by hand.

## The sheet — `src/components/ImportModeSheet.tsx`

```ts
type ImportModeSheetProps = {
  photoCount: number;
  onChooseMode: (importMode: ImportMode) => void;
  onCancel: () => void;
};
```

Rendered inside a `Modal` with `transparent` and `animationType="slide"`, dimmed backdrop from `palette.overlay`,
sheet surface from the existing theme tokens. Content:

- a title carrying the count — `4 photos selected`;
- `Add as 4 separate posts`, always enabled;
- `Add as one carousel`, disabled when `!canGroupIntoOneCarousel(photoCount)`, and when disabled showing
  `A carousel holds 10 photos` underneath rather than just greying out;
- `Cancel`.

No option is visually primary — the product decision is that there is no default, and styling one as primary would
reintroduce one. Backdrop press and Android hardware back both route to `onCancel`, so dismissing is never
ambiguous. Every control gets a `testID` (`import-mode-separate`, `import-mode-carousel`, `import-mode-cancel`).

## Compose screen — `app/posts/new.tsx`

New state beside the existing `importedMedia`, `caption`, `isImporting`:

```ts
const [importMode, setImportMode] = useState<ImportMode | null>(null);
const [assetsAwaitingModeChoice, setAssetsAwaitingModeChoice] = useState<PickedImage[] | null>(null);
const [importedPhotoCount, setImportedPhotoCount] = useState(0);
```

**Picking.** `remainingMediaSlots` becomes `photoCapacityFor(importMode) - importedMedia.length` and feeds
`selectionLimit`, so an unset or separate-posts session can pick up to 30 and a carousel session stays at 10.

**Deciding.** After the picker returns, the screen asks whether a choice is needed — `importMode === null &&
importedMedia.length + picked.length > 1`. If so it parks the assets in `assetsAwaitingModeChoice`, which renders
the sheet, and imports nothing. Otherwise it imports straight away. This is the step that makes *Cancel* free: the
sheet sits **before** `importImageIntoAppStorage`, so cancelling clears the parked assets and touches no disk.

A single-photo pick leaves `importMode` at `null` — matching the product rule that the mode stays unset until a
session actually has more than one photo.

**Importing.** A named `importPickedPhotosInOrder` replaces the inline `Promise.all`:

- iterates the picked assets in order, awaiting one `importImageIntoAppStorage` at a time;
- bumps `importedPhotoCount` after each so the spinner row can read `Importing 7 of 30`;
- on any failure, deletes the media already written in this pass via `deleteMediaFiles`, restores the previous
  `importedMedia`, and shows the existing `Could not import` alert.

That cleanup is what makes the product plan's "a failed import creates nothing" rule true rather than aspirational —
without it a batch that dies on photo 22 leaves 21 orphaned pairs of files in the media directory forever.

**Changing the mode.** When `importMode` is set and more than one photo is imported, a row above the picker shows
`describeChosenMode(...)` and a `Change` pressable that re-opens the sheet with the current photo count. Choosing
from that sheet only calls `setImportMode` — the photos are already imported and are kept. Carousel is disabled
there by the same `canGroupIntoOneCarousel` check, which is how a 12-photo batch explains itself instead of failing.

**Saving.** `createPostsFromImport(importedMedia, caption.trim(), importMode)`; return early if it comes back empty;
`router.back()`.

**Conditional copy.** The caption `TextInput` and the "The first photo becomes the grid cover" hint render only when
`importMode !== 'separatePosts'`. In separate-posts mode the hint is replaced with one that says each photo becomes
its own post. The save button label is `describeImportOutcome(importMode, importedMedia.length)`.

## Tests

Following the repo's existing split — pure functions tested directly, components tested through `testID`s, no screen
tests.

**`__tests__/ordering.test.ts`** — added to the existing file:

- a three-post batch lands in the grid in pick order, not reversed;
- the batch sits above every pre-existing post, contiguously;
- `gridPosition` is reindexed `0..n-1` across batch and existing posts;
- an empty batch is a no-op;
- another account's posts and archived posts are untouched.

**`__tests__/imports.test.ts`** — `photoCapacityFor` for each mode and for `null`; `canGroupIntoOneCarousel` at 10
and at 11; `describeImportOutcome` for one photo, two separate posts, twelve separate posts, and a four-photo
carousel.

**`__tests__/ImportModeSheet.test.tsx`** — the count appears in the separate-posts option; the carousel option is
disabled and shows its reason at 11 photos and is enabled at 10; each press calls the right callback with the right
mode; backdrop press cancels.

**`__tests__/useAppStore.test.ts`** — new file, using the AsyncStorage mock already registered in `jest.setup.ts`:

- separate mode with four media creates four posts, one media each, all captionless;
- carousel mode with four media creates one post with four media and the typed caption;
- the created grid reads in pick order through `gridPostsInDisplayOrder`;
- no active account creates nothing.

## Work order

1. **M1 — domain.** Constants and pure helpers in `types.ts`, `__tests__/imports.test.ts`. Nothing else compiles
   against them yet, so this lands green on its own.
2. **M2 — ordering and store.** `addPostsToTopOfGrid`, `createPostsFromImport`, their tests. The screen still calls
   the old action until this point, so M2 ends with updating that one call site.
3. **M3 — the sheet.** `ImportModeSheet` and its test, rendered nowhere yet.
4. **M4 — the screen.** Mode state, sheet wiring, per-mode `selectionLimit`, sequential import with counter and
   failure cleanup, conditional caption and hints, labels.
5. **M5 — verification.** `yarn lint`, `yarn typecheck`, `yarn test`, then the device pass below.

## Verification

Automated, all three must pass: `yarn lint`, `yarn typecheck`, `yarn test`.

On device, because none of the above exercises the real photo picker:

- pick 4 photos → sheet shows `4 photos selected` → separate posts → 4 cells, first picked top-left, no carousel
  badge, post count up by 4;
- same 4 photos → one carousel → 1 cell with the badge, caption saved, cover is the first photo;
- pick 1 photo → no sheet, unchanged flow;
- pick 1, then **Add more** with 3 → sheet appears at that point;
- pick 12 → carousel option disabled with its reason → separate posts → 12 cells;
- pick 15, **Cancel** in the sheet → no posts, and the media directory has no new files;
- kill the app mid-import → relaunch shows no half-imported posts;
- **Change** from separate posts to carousel with 4 photos keeps all 4 and switches the labels;
- a separate-posts post drags, archives, restores, and deletes like any other;
- `yarn web` — the sheet renders and both modes work, which is the check `Alert` would have failed.

## Risks

**`orderedSelection` is iOS-only.** The picker option is already set, but Android returns assets in library order
rather than tap order, so "pick order is grid order" means *returned* order there. This is pre-existing behaviour
for carousels and the fix — dragging — is the app's core interaction. Worth stating in the release note, not worth
blocking on.

**Thirty sequential imports is a long wait.** Each photo is a full-resolution copy plus a downscale. The counter
makes the wait legible; if it proves too slow, a small fixed concurrency (three or four at a time) is the next step,
not unbounded `Promise.all`.

**Twelve posts is a big, unbatched grid change.** There is no undo after saving, by product decision. The mitigation
in this release is that the count is visible in the save button before the tap.
