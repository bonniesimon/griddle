# Scrollable post feed: tap a cell, keep scrolling

Part one is the product plan; part two is the implementation plan that follows from it.

## Context

Griddle exists to answer one question: *what will my grid look like after I post these?* The grid answers it at a
glance. The post detail screen is where you go when a glance is not enough — when you want to see the photo at full
width, read the caption, check the carousel.

Today that screen is a dead end. `app/posts/[id]/index.tsx` renders exactly one post: author row, carousel, caption,
and a column of Edit / Archive / Delete buttons. To look at the post next to it you press back, find the next cell,
and tap again. Comparing three posts at full size costs six navigations.

That is not how the app it imitates works. On an Instagram profile, tapping a grid cell opens the feed *scrolled to
that post*, and you keep scrolling — post after post, in grid order. The grid is the map; the feed is the walk.
Griddle has the map and is missing the walk.

**The outcome:** tapping a grid cell opens a vertically scrolling feed of the account's posts, anchored at the tapped
post, in grid order. Scrolling down shows the next post, then the one after it. Scrolling up shows the ones above it
in the grid.

## Who this is for

Someone who has already dragged the grid into roughly the right shape and is now checking their work. The grid tells
them the composition reads well at thumbnail size. The feed tells them whether the photos hold up full-width and
whether the sequence has rhythm — three near-identical shots in a row are invisible in a 3-column grid and obvious
when you scroll past them one at a time.

This is a review pass, not an editing pass. The feed's job is to be scrolled through quickly.

## Decisions

| Question | Decision |
| --- | --- |
| What the feed contains | Every post in the same list as the tapped post, in that list's order |
| Anchor | The tapped post, positioned at the top of the viewport on open |
| Direction | Both. Scroll up to earlier posts, down to later ones |
| Per-post controls | Moved off the page into a `⋯` action sheet in each post's author row |
| Captions in the feed | Clamped to two lines |
| Archive / restore / delete | Still return to the grid, as they do today |
| URL as you scroll | Unchanged. The route param is the entry anchor, not a cursor |

### Why the feed follows the list you came from

There are two ways into the detail screen and they come from two different lists. The profile grid pushes an
unarchived post; the archive screen long-presses into an archived one. A feed that always showed the grid would open
on an archived post that is not in its own feed.

So the rule is: the feed is the list the post belongs to. An unarchived post scrolls through
`gridPostsInDisplayOrder` — the same order the grid shows, which is the whole point. An archived post scrolls through
`archivedPostsNewestFirst`. Neither list ever mixes with the other, which matches how the two screens already behave.

### Why the controls move into a sheet

A three-button control column between every post would be most of the screen. Scrolling from post 4 to post 5 would
mean scrolling past Edit, Archive, and Delete, and the buttons would be a permanent invitation to mutate a grid the
user came here to *look* at.

Instagram puts per-post actions behind a `⋯` at the right of the author row, and that is the right shape here for a
concrete reason beyond imitation: it keeps the actions attached to a specific post. A toolbar acting on "whatever is
currently on screen" has to define what "currently" means mid-scroll, and gets it wrong at exactly the moment a
destructive action is tapped. A `⋯` in post 5's author row can only ever mean post 5.

The sheet holds the same three actions the control column holds today — Edit post, Archive (or Restore to grid), and
Delete post — with no additions.

### Why captions are clamped to two lines

Two reasons point the same way. Product: the feed is a review pass over photos, and a fifteen-line caption pushes the
next photo off the screen. Instagram clamps for the same reason.

Implementation: a feed that can jump straight to post 40 has to know how tall posts 0–39 are without rendering them,
and a caption of unknown length makes that unknowable. Clamping makes every post's height computable in advance,
which is what makes the anchor land exactly. The two-line clamp is not a compromise forced by the code — it is the
right product answer that happens to also be the tractable one.

The full caption is one tap away on the post's edit screen.

### Why mutations still pop back to the grid

Archiving a post removes it from the grid list; restoring removes it from the archive list; deleting removes it from
both. If the feed stayed put, the list would shrink underneath the reader and the scroll position would jump to some
other post — a bad thing to happen immediately after a destructive tap.

Today all three of those actions call `router.back()`, and that stays. The grid is where the consequence of an
archive is legible anyway. Editing is different: it changes a post in place without changing list membership, so the
edit screen pushes on top of the feed and returns to it with the scroll position intact.

## Flows

### Reviewing the grid from a cell

1. User taps the fifth cell on the profile screen.
2. The feed opens with post 5 at the top of the viewport — not post 1 scrolled down, and not an animated scroll the
   user watches; it is simply where the feed starts.
3. Scrolling down reveals post 6, then 7, in grid order.
4. Scrolling up reveals posts 4, 3, 2, 1. The feed starts at the anchor but is not truncated at it.
5. Back returns to the profile screen with the grid unchanged.

### Acting on a post mid-scroll

1. While looking at post 7, the user taps `⋯` in its author row.
2. The sheet names the actions for that post: Edit post, Archive, Delete post, Cancel.
3. *Edit post* pushes the edit screen for post 7; saving returns to the feed, still at post 7, with the new caption.
4. *Archive* and *Delete post* return to the profile grid, as they do today. Delete keeps its confirmation.

### From the archive

Long-pressing an archived post opens a feed of archived posts, newest first, anchored at that one. Its sheet offers
*Restore to grid* in place of *Archive*, matching the control column today.

### Edge cases

- **A single-post account.** The feed renders one post and does not scroll. No empty state, no change in behaviour.
- **The last post.** Scrolling stops. There is no loop back to the top and no "you're all caught up" marker.
- **A deleted or missing post id.** The existing *Post not found* empty state, unchanged.
- **Rotation.** Post heights depend on screen width, so they are recomputed on rotate. Keeping the anchored post
  pinned across a rotation is not a goal.

## Rules the result has to obey

- **Feed order is grid order.** Post *n* in the grid is followed by post *n+1* in the feed. A feed that reads in a
  different order than the grid it was opened from is a bug, not a detail.
- **The anchor is exact.** Tapping cell 40 of 60 lands on post 40 with its author row at the top of the viewport —
  not near it, and not after a visible scroll animation.
- **Scrolling never loads the whole grid at once.** Only posts near the viewport hold full-resolution images in
  memory; a 200-post grid opens as fast as a 10-post one.
- **Carousels still swipe.** A horizontal swipe inside a multi-photo post pages that carousel and does not scroll
  the feed; a vertical drag scrolls the feed and does not page the carousel. The dots keep tracking the active photo.
- **The tapped post is unchanged by looking at it.** No mutation happens without a tap in the actions sheet.
- **Nothing about the grid, archive, drag ordering, import, or backup changes.**

## Success criteria

1. Tapping any cell opens the feed at that post, and the next post is one scroll away instead of two navigations.
2. Scrolling up from a mid-grid post reaches the first post; scrolling down reaches the last.
3. The feed's order matches the grid's order, including immediately after a drag-reorder.
4. Every action available on the detail screen today is still available, on the right post.
5. Opening the feed on a large grid is not visibly slower than opening it on a small one.

There are no analytics in this app and none are being added; success is judged by the flows above being walkable on
device.

## Out of scope

- **Expandable captions** — a *more* affordance that reveals the full text. It changes a post's height after layout,
  which is exactly what the exact-anchor rule cannot tolerate without measuring and caching heights. Worth revisiting
  as its own change if two lines proves too tight in daily use.
- **A standalone feed screen** reachable without going through a cell. The feed is a way of looking at *a post*;
  a feed with no anchor is a different product idea.
- **Full-screen or pinch-to-zoom photo viewing.** Separate feature, separate surface.
- **Mixing archived and unarchived posts** in one feed.
- **Scrolling between accounts.** The feed is one account's, like the grid.
- **Syncing the URL to the scrolled post.** It would rewrite history on every scroll and make back unpredictable.
- **Double-tap to like, or any other decorative interaction.** The heart, comment, and share glyphs stay decorative.

---

# Implementation plan

## Questions the product plan left open

| Question | Answer |
| --- | --- |
| A new route, or the existing `posts/[id]/index.tsx`? | The existing one |
| How does the anchor land exactly? | `initialScrollIndex` + an exact `getItemLayout` |
| How can heights be exact before render? | Every part of a post's height is computable; the caption is clamped |
| `Alert` or a component for the actions sheet? | A component, for the reason plan 001 gives |

**The route does not change.** `GET /posts/:id` shows post `:id`, and it still does — the post is at the top of the
viewport when the screen opens. That the screen also renders the post's neighbours is presentation, not a different
resource, in the same way that a Rails `show` template is free to render related records. A new `feed/` resource
would have to answer "a feed of what, anchored where" in its own path, and the answer is already `posts/:id`.

**The anchor cannot be an animated `scrollToIndex`.** Mounting at post 0 and animating to post 40 is a visible scroll
past 39 posts, and it decodes every image it flies past. `initialScrollIndex` starts the list at the right offset,
but a `FlatList` can only honour it when `getItemLayout` can state where item 40 begins without having rendered items
0–39. So exact heights are not an optimisation here; they are the feature.

## Current shape

`app/posts/[id]/index.tsx` is a `ScrollView` holding one post: author row, `<Carousel media={post.media} />`, a
decorative action row, an optional caption, and a control column of three `Pressable`s. It reads `post` and `account`
through `usePost` / `useAccount` and calls `archivePost`, `restorePost`, `deletePost` from the store.

`Carousel` is a horizontal paging `FlatList` that derives its own aspect ratio from `media[0]` through the exported
`aspectRatioClampedToPortraitLimit`, and renders `CarouselDots` beneath itself.

Two screens push this route: `PostGrid`'s cell press, and the archive screen's cell long-press.

Nothing about the `Post` type or the store changes. **No persisted schema change, so `PERSISTED_SCHEMA_VERSION` stays
where it is** and `migratePersistedState` is untouched.

## Files

| File | Change |
| --- | --- |
| `src/store/ordering.ts` | New: `feedPostsAlongside`, `anchorIndexInFeed` |
| `src/store/selectors.ts` | New: `useFeedPostsAlongside` |
| `src/components/feedItemLayout.ts` | New: the pure height and offset math, and the aspect-ratio clamp |
| `src/components/CarouselDots.tsx` | Exports `CAROUSEL_DOTS_HEIGHT` and pins the row to it |
| `src/components/Carousel.tsx` | Explicit slide height from the shared math; `recyclingKey` |
| `src/components/PostFeedItem.tsx` | New: one post as a feed row, extracted from the screen |
| `src/components/PostActionsSheet.tsx` | New: the per-post `⋯` sheet |
| `src/components/PostFeed.tsx` | New: the feed `FlatList`, its offsets, and the sheet wiring |
| `app/posts/[id]/index.tsx` | Resolves the anchor post, guards, renders `PostFeed` |
| `app/_layout.tsx` | Screen title `Post` → `Posts` |
| `__tests__/ordering.test.ts` | Feed selection and anchor cases |
| `__tests__/feedItemLayout.test.ts` | New: aspect ratio, heights, offsets |
| `__tests__/PostActionsSheet.test.tsx` | New: sheet rendering and callbacks |
| `__tests__/PostFeed.test.tsx` | New: anchoring, virtualisation, sheet wiring |
| `__tests__/Carousel.test.tsx` | Aspect-ratio cases move out to `feedItemLayout.test.ts` |

## Ordering — `src/store/ordering.ts`

The two list-order functions already live here and the feed needs to pick between them, so the choice belongs here
too rather than in a hook.

```ts
export const feedPostsAlongside = (posts: Post[], anchorPost: Post) =>
  anchorPost.isArchived
    ? archivedPostsNewestFirst(posts, anchorPost.accountId)
    : gridPostsInDisplayOrder(posts, anchorPost.accountId);

export const anchorIndexInFeed = (feedPosts: Post[], anchorPostId: string) =>
  Math.max(feedPosts.findIndex((post) => post.id === anchorPostId), 0);
```

`anchorIndexInFeed` clamping a miss to `0` rather than `-1` is deliberate: a post that is somehow absent from its own
list opens the feed at the top instead of crashing `initialScrollIndex`.

## Selector — `src/store/selectors.ts`

```ts
export const useFeedPostsAlongside = (anchorPost: Post | undefined) =>
  useAppStore((state) => (anchorPost ? feedPostsAlongside(state.posts, anchorPost) : []));
```

It follows the file's existing pattern of reading `state.posts` and running an ordering function over it, so a
drag-reorder or an archive re-renders the feed in the new order for free.

## Layout math — `src/components/feedItemLayout.ts`

This is the part that makes the anchor exact. Every contribution to a post's height is either a constant derived from
the theme tokens or a function of the post's own data:

```ts
export const CAPTION_LINE_LIMIT = 2;

export const mediaHeightFor = (media: Media[], screenWidth: number) =>
  Math.round(screenWidth / aspectRatioClampedToPortraitLimit(media));

export const captionBlockHeight = (caption: string) => ...   // 0 when empty, otherwise a fixed two-line block
export const feedItemHeight = (post: Post, screenWidth: number) => ...
export const feedItemOffsets = (posts: Post[], screenWidth: number) => ...
```

`feedItemHeight` sums the author row, the media, the dot row when `hasMultipleMedia(post)`, the decorative action
row, the caption block, and the trailing separator space. Each of those is a named constant in this module, derived
from `spacing`, `typeScale`, and `avatarDiameter` rather than duplicating numbers — if the author row's padding
changes in the theme, the height follows.

`feedItemOffsets` returns the prefix sums once per `(posts, screenWidth)` pair, memoised on the screen, so
`getItemLayout` is an array lookup rather than an O(n) walk on every call.

**`mediaHeightFor` is the single source of truth for how tall a photo renders.** `Carousel` currently sets
`{ width: screenWidth, aspectRatio }` and lets the layout engine divide; the feed cannot afford a half-pixel
disagreement accumulating over forty posts, so `Carousel` switches to `{ width: screenWidth, height:
mediaHeightFor(media, screenWidth) }` using the same rounded function. `aspectRatioClampedToPortraitLimit` stays
exported from `Carousel` and is imported here, keeping the clamp rule in one place.

The caption block being fixed at two lines whether the caption wraps to one line or ten is what the product decision
above buys: a one-line caption leaves a line of space before the separator, which reads as padding.

## Feed row — `src/components/PostFeedItem.tsx`

```ts
type PostFeedItemProps = {
  post: Post;
  account: Account;
  onPressActions: () => void;
};
```

This is the current screen's body — author row, carousel, action glyph row, caption — lifted out verbatim except for
three changes: the author row gains a `⋯` `Pressable` pushed to its right edge, the caption gets
`numberOfLines={CAPTION_LINE_LIMIT}`, and the control column is gone. The account comes in as a prop because every
post in a feed shares one account and looking it up per row would be a store read per row.

Each row must render at exactly `feedItemHeight(post, screenWidth)`. The styles that produce that height and the
constants that predict it are in the same pair of files, and the test below pins them together.

## Actions sheet — `src/components/PostActionsSheet.tsx`

```ts
type PostActionsSheetProps = {
  post: Post;
  onEdit: () => void;
  onArchiveOrRestore: () => void;
  onDelete: () => void;
  onCancel: () => void;
};
```

Same construction as `ImportModeSheet` from plan 001 — a `Modal` with `transparent` and `animationType="slide"`, a
`palette.overlay` backdrop that cancels on press, Android hardware back routed to `onCancel` — and for the same
reason: `react-native-web` does not implement `Alert`, and this app runs on web.

It shows *Restore to grid* when `post.isArchived` and *Archive* otherwise, mirroring the control column it replaces.
*Delete post* uses `palette.destructive` and keeps the existing `Alert.alert` confirmation, which is unchanged
pre-existing behaviour. Controls get `testID`s: `post-actions-edit`, `post-actions-archive`, `post-actions-delete`,
`post-actions-cancel`.

## The screen — `app/posts/[id]/index.tsx`

```tsx
const feedPosts = useFeedPostsAlongside(post);
const anchorIndex = anchorIndexInFeed(feedPosts, id);
const offsets = useMemo(() => feedItemOffsets(feedPosts, screenWidth), [feedPosts, screenWidth]);
```

The `!post || !account` guard and its *Post not found* empty state stay exactly as they are, before any of this.

```tsx
<FlatList
  data={feedPosts}
  keyExtractor={(feedPost) => feedPost.id}
  renderItem={renderFeedPost}
  initialScrollIndex={anchorIndex}
  getItemLayout={(_, index) => ({ length: offsets.heights[index], offset: offsets.starts[index], index })}
  initialNumToRender={1}
  maxToRenderPerBatch={2}
  windowSize={3}
  removeClippedSubviews
/>
```

The windowing numbers are the "never loads the whole grid at once" rule made concrete: at most a screenful either
side of the viewport holds decoded full-resolution images.

`postAwaitingAction: Post | null` is the only new state. The `⋯` sets it, which renders the sheet; each sheet
callback clears it and then does what the control column does today — `router.push('/posts/{id}/edit')`, or
`archivePost` / `restorePost` / `deletePost` followed by `router.back()`.

Two details that are easy to get wrong:

- **`renderFeedPost` must be a stable `useCallback`**, or every scroll re-renders every row and the windowing above
  buys nothing.
- **The carousel gesture.** A horizontal `FlatList` nested in a vertical one works, but the outer list can claim an
  ambiguous diagonal drag. `directionalLockEnabled` on the outer list keeps a mostly-horizontal drag out of the
  vertical scroll, which is the fix if the carousel feels sticky on device.

`Carousel` also gains `recyclingKey={item.id}` on its `Image`. Without it, a recycled row briefly shows the previous
post's photo at the new post's size while the new source decodes — invisible on a one-post screen, obvious when
flinging through a feed.

## Header — `app/_layout.tsx`

`<Stack.Screen name="posts/[id]/index" options={{ title: 'Posts' }} />`. The screen shows more than one post now, and
each post already carries its own handle in its author row.

## Tests

Following the repo's split — pure functions tested directly, components tested through `testID`s, no screen tests.

**`__tests__/ordering.test.ts`** — added to the existing file:

- an unarchived anchor yields the grid list in grid order; an archived anchor yields the archive list, newest first;
- neither feed contains a post from the other list, or from another account;
- `anchorIndexInFeed` finds a mid-list post, the first, the last, and returns `0` for an id that is absent.

**`__tests__/feedItemLayout.test.ts`** — new:

- a square post and a 4:5 post get different media heights at the same screen width, and both are integers;
- a wide panorama clamps to the same ratio `Carousel` uses, so the two agree;
- `captionBlockHeight('')` is `0` and a one-line and a ten-line caption produce the same non-zero height;
- a multi-photo post is exactly one dot-row taller than the same post with one photo;
- `feedItemOffsets` starts at `0`, and each start equals the sum of all preceding heights, which is the property
  `initialScrollIndex` depends on;
- an empty post list produces empty arrays rather than throwing.

**`__tests__/PostActionsSheet.test.tsx`** — new: an unarchived post shows *Archive* and an archived one shows
*Restore to grid*; each press fires the matching callback; backdrop press cancels.

**`__tests__/Carousel.test.tsx`** — the slide `Image` carries the explicit height from `mediaHeightFor` rather than an
`aspectRatio`, which is the assertion that keeps the feed's arithmetic and the carousel's rendering from drifting
apart.

## Work order

1. **M1 — ordering.** `feedPostsAlongside`, `anchorIndexInFeed`, and their cases in `ordering.test.ts`. Nothing calls
   them yet, so this lands green on its own.
2. **M2 — layout math.** `feedItemLayout.ts` and its test, plus the `Carousel` switch to an explicit height. The
   detail screen still renders one post; the only visible change is that the photo's height is rounded.
3. **M3 — the row.** Extract `PostFeedItem` and render the existing single-post screen through it, control column
   still below. Nothing changes on screen except the `⋯`, which is inert.
4. **M4 — the sheet.** `PostActionsSheet` and its test, wired to the `⋯`; delete the control column.
5. **M5 — the feed.** Swap the `ScrollView` for the `FlatList`, wire `initialScrollIndex`, `getItemLayout`, and the
   windowing props. This is the milestone where the feature appears.
6. **M6 — verification.** `yarn lint`, `yarn typecheck`, `yarn test`, then the device pass below.

## Verification

Automated, all three must pass: `yarn lint`, `yarn typecheck`, `yarn test`.

On device, because none of the above exercises real scrolling or real images:

- with 12+ posts in the grid, tap cell 8 → post 8's author row sits at the top with no visible scroll animation;
- scroll down → posts 9, 10, 11 in grid order; scroll up → posts 7 back to 1;
- drag-reorder the grid, then reopen the feed → the new order is what scrolls;
- a mixed grid of square, portrait, and panorama posts scrolls with no gap or overlap between posts, and tapping the
  last cell lands on the last post rather than short of it — the check that the height math is exact rather than
  close;
- a multi-photo post swipes horizontally through its photos with the dots tracking, and a vertical drag on top of a
  carousel scrolls the feed;
- `⋯` on post 5 → Edit → change the caption → save → back on the feed at post 5 with the new caption, clamped at two
  lines;
- `⋯` → Archive → back on the grid, post gone from it; `⋯` → Delete → confirmation, then back on the grid;
- long-press an archived post → an archive-only feed, newest first, whose sheet offers *Restore to grid*;
- an account with one post → one post, no scroll, nothing broken;
- fling from post 1 to post 40 and back repeatedly → no blank rows that never fill, and no photo appearing at the
  wrong size before settling;
- rotate mid-feed → posts re-lay out at the new width with no overlap;
- `yarn web` → the feed scrolls and the actions sheet opens, which is the check `Alert` would have failed.


## Corrections made during implementation

The plan above was reviewed against the code before any of it was written. Six things in the first draft were wrong
or risky, and the built version differs from them.

**The selector cannot compute inside the store selector.** The draft had
`useAppStore((state) => feedPostsAlongside(state.posts, anchorPost))`. `feedPostsAlongside` builds a new array on
every call, so the selector would return a new reference on every store read and zustand would never see a stable
snapshot. The existing `useGridPosts` already shows the right shape: select the raw `state.posts`, which is stable,
and order it outside the selector. `useFeedPostsAlongside` does that, and adds a `useMemo` on `[posts, anchorPost]`
so the array identity is stable across local-state re-renders too — it feeds a virtualised list's `data` and the
offsets cache, and a fresh array on every render would throw both away.

**Importing the aspect-ratio clamp from `Carousel` would have been a cycle.** The draft kept
`aspectRatioClampedToPortraitLimit` in `Carousel.tsx` and had `feedItemLayout.ts` import it, while `Carousel.tsx`
imported `mediaHeightFor` back. The clamp moved into `feedItemLayout.ts` instead and `Carousel` imports from there,
so the dependency runs one way. Its tests moved with it.

**Exact heights come from explicit heights, not from predicting intrinsic ones.** The draft described deriving each
row's height from the theme tokens, which only works if the rendered row happens to agree — and a `Text` row's
height depends on the platform's font metrics, which no constant can predict. Every block in `PostFeedItem` now
carries an explicit `height` taken from the same constant the arithmetic uses, so the two agree by construction
rather than by estimate. `CarouselDots` pins its row the same way.

**`removeClippedSubviews` is not used.** It is a known source of blank content on iOS, and this feed nests a
horizontal list inside a vertical one — exactly the arrangement it misbehaves in. `windowSize` bounds memory on its
own. `initialNumToRender` also went from 1 to 2, since one row does not fill a tall screen.

**The feed is a component, not the screen.** `renderFeedPost` needs the account, and the account is only known after
the *Post not found* guard, so keeping the list in the screen meant either a conditional hook or a null check inside
`renderItem`. `PostFeed` takes an already-resolved `anchorPost` and `account` as props, which keeps every hook
unconditional and mirrors how `app/index.tsx` already delegates to `PostGrid`.

**No separator line between posts.** A `StyleSheet.hairlineWidth` border is sub-pixel and would put the arithmetic
and the layout out of step. Posts are separated by the trailing space alone, as they are on Instagram.

Two smaller notes. The draft promised a `Carousel` render test asserting the slide height; that became
`__tests__/PostFeed.test.tsx` instead, which covers anchoring and virtualisation — the parts that can actually
break — while the carousel and the feed cannot disagree about height because they call one function. And
*Restore to grid* now returns to the previous screen, which the old control column did not do; the plan's rule that
a membership change pops back applies to restore exactly as it does to archive.

## Risks

**Exact heights are a standing invariant, not a one-time calculation.** Any future change to `PostFeedItem`'s padding
that does not also change `feedItemLayout.ts` will misplace the anchor, and the symptom — the feed opening slightly
above or below the tapped post — is subtle enough to ship. The `feedItemOffsets` test and the `Carousel` height test
are the guard; keeping the two files next to each other and derived from the same tokens is the other half.

**Nested horizontal lists inside a vertical list can feel sticky.** `directionalLockEnabled` is the first fix. If a
diagonal flick still pages a carousel when the user meant to scroll, the next step is a gesture-handler
`simultaneousHandlers` wiring rather than tuning thresholds.

**Memory on very large grids.** The windowing props bound what is decoded, but a grid of several hundred posts still
holds a long `feedPosts` array and a long offsets array. Both are cheap; the images are what matter, and those are
already bounded. No action now, worth remembering if someone imports a thousand photos.

**Two-line captions may prove too tight** for anyone using Griddle to draft real captions. That is a product question
the device pass will answer, and the out-of-scope note above records the path if the answer is yes.
