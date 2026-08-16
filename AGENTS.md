# Project conventions

## Resourceful routes (DHH style)

Routes are named after **resources**, not actions. Follow Rails' `resources :posts` shape: a plural resource
directory containing at most the four screen actions — `index`, `new`, `show`, `edit`.

| Rails route | Rails action | `expo-router` file |
| --- | --- | --- |
| `GET /posts` | `index` | `app/posts/index.tsx` |
| `GET /posts/new` | `new` | `app/posts/new.tsx` |
| `GET /posts/:id` | `show` | `app/posts/[id]/index.tsx` |
| `GET /posts/:id/edit` | `edit` | `app/posts/[id]/edit.tsx` |

Rules:

- **Resource directories are plural.** `posts/`, `accounts/` — never `post/`, `account/`.
- **A record's screens nest under `[id]/`.** Use `posts/[id]/index.tsx` + `posts/[id]/edit.tsx`, not
  `posts/[id].tsx` + `posts/edit/[id].tsx`. The edit screen belongs to the record, so it lives inside the record's
  directory.
- **Prefer a new resource over a custom action.** When a screen does not fit `index/new/show/edit`, that is a signal
  it is really a different resource. Archived posts are their own `archived-posts/` resource rather than a
  `posts/archived.tsx` custom collection action.
- **Mutations are not routes.** Archiving, restoring, reordering, and setting a carousel cover are store actions
  invoked from a screen, not screens of their own. Only add a route when there is something to *look at*.
- **Kebab-case multi-word segments.** `archived-posts/`, not `archivedPosts/` or `archived_posts/`.

Note on `expo-router` precedence: static segments beat dynamic ones at the same level, so a `posts/new.tsx` is
matched before `posts/[id]/index.tsx` and an id can never shadow it.

## Package manager

**Yarn 4, pinned via corepack. Never npm.**

- The `packageManager` field in `package.json` pins the exact Yarn version; `corepack enable` makes it authoritative.
- `.yarnrc.yml` sets `nodeLinker: node-modules`. This is not optional — React Native's Metro bundler and native
  module autolinking expect a flat, hoisted `node_modules`, and Yarn's default PnP linker breaks both.
- Only `yarn.lock` is committed. If a `package-lock.json` ever appears, something ran npm: delete it.

Command equivalents — there is a `yarn` form for everything, so `npm` and `npx` should never be typed:

| Instead of | Use |
| --- | --- |
| `npm install` | `yarn install` |
| `npm install <pkg>` | `yarn add <pkg>` |
| `npx expo start` | `yarn expo start` |
| `npx jest` | `yarn test` |
| `npx create-expo-app` | `yarn create expo-app` |
| `npx <one-off-tool>` | `yarn dlx <one-off-tool>` |

**Install Expo SDK packages with `yarn expo install <pkg>`, not `yarn add <pkg>.`** `expo install` resolves the
version compatible with the project's Expo SDK; `yarn add` grabs latest and will silently install a package built
against a different SDK.

## Code style

These four rules compound: comments are banned *because* names and structure are expected to carry the meaning. Do
not treat them separately.

### Arrow functions always

Use `const fn = () => {}`. No `function` declarations unless there is a concrete reason — a generator, or a place
that genuinely needs `this` or hoisting. If you reach for `function`, the reason belongs in the commit message.

```ts
const buildThumbnail = async (source: MediaSource) => { ... }   // yes
function buildThumbnail(source: MediaSource) { ... }            // no
```

### Names do the explaining

A name should make the body predictable before you read it.

- **Verbs for actions, nouns for values.** `reindexGridPositions()`, not `positions()` or `handlePositions()`.
- **Predicates read as assertions.** `isArchived`, `hasMultipleMedia`, `canRestore` — never `flag`, `check`, `x`.
- **No abbreviations.** `thumbnail` not `thumb`, `position` not `pos`, `account` not `acct`. The one exception is
  `id`.
- **Say what is returned, not how.** `archivedPostsNewestFirst()` beats `sortPosts()`.
- **No `handle*` catch-alls.** `handlePress` says nothing; `archiveSelectedPost` says everything.

### Never write comments

Do not write explanatory comments. A comment is a signal that the code failed to explain itself, and the fix is
always to change the code:

- Comment explains *what* a block does → extract it into a named function.
- Comment explains *why* a value is what it is → hoist it to a named constant (`MAX_MEDIA_PER_POST = 10`).
- Comment explains a field's meaning or units → rename the field, or give it a named type.
- Comment explains a non-obvious tradeoff or a bug worked around → that belongs in the commit message or in
  `docs/plans/`, where it is versioned and searchable, not stranded next to a line that will move.

Type annotations, named constants, and small named functions are the documentation. Also: no commented-out code, no
`TODO`/`FIXME` (open an issue), no JSDoc blocks, and no section-divider banners.

Machine-directed annotations are not comments in this sense — `// eslint-disable-next-line`, `// @ts-expect-error`
are directives the tooling reads. Each one still needs a justification, which goes in the commit message.

This rule is **not** lint-enforced, deliberately. It is the default an agent should follow, not a mechanical ban:
a human author may add a comment where they judge it earns its place. Agents should still exhaust rename-and-extract
first, and should not remove comments a human has written.

### Readability wins

When readability and cleverness conflict, readability wins, and it is not close. Prefer an early return to a nested
conditional; prefer three obvious lines to one dense one; prefer an explicit intermediate variable with a good name
over a long chained expression. Optimise only what the performance checkpoints in the plan actually flag.

Enforced where possible by `yarn lint`: `func-style` and `prefer-arrow-callback` cover the arrow rule. Naming
quality and the comment rule are review standards, not lint rules — lint cannot tell a good name from a bad one, and
comments are a judgment call the author gets to make.

## Markdown

Hard-wrap markdown at **120 characters**. If a table cannot fit within 120 columns, convert it to a bulleted list
rather than letting rows overflow. Verify with `awk 'length > 120' FILE`.

## Plans

Implementation plans live in the repo at `docs/plans/NNN-name.md`, using a zero-padded sequential prefix. They are
durable, reviewable artifacts — not throwaway scratch files.
