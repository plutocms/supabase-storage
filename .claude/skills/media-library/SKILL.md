# Media library

This feature gives the whole app one shared media library. It stores files in Supabase Storage
and their metadata in the `media` table. It also gives every layer's content type a working
`media` field, through the generic content-field widget system in `@plutocms/pluto`.

It adds:

- `shared/utils/media-upload.ts` — pure helpers: `isAllowedUpload`, `assertUploadSize`,
  `resolveStoragePath`, `resolveObjectKey`.
- `server/api/media/new.post.ts` — upload route.
- `server/api/media/list.get.ts` — list route.
- `server/api/media/delete/[id].delete.ts` — delete route.
- `app/composables/media.ts` — `useMedia()`, with `getMediaUrl` and `removeMedia`.
- `app/utils/media-adapter.ts` — `createSupabaseStorageMediaAdapter()`, a real
  `PlutoMediaAdapter`.
- `app/components/PlutoMediaField.vue` — the `media` field widget.
- `app/components/UploadMedia.vue` (extended) — the picker modal, now with a `multiple` prop.
- `app/plugins/pluto-extension.ts` (extended) — registers the adapter and the widget.
- `db/migrations/004_media_backfill_storage_path.sql` — backfills `storage_path` on old rows.

## Routes

### `POST /api/media/new`

Uploads a file and inserts its `media` row in one call.

- Needs the `media:manage` capability.
- Reads the file part by its `filename`, and an optional `alt` part by name — not by array
  position.
- Checks the MIME type and size before it touches storage. A rejected type returns 415. An
  oversized file returns 413.
- Uploads with `upsert: false`. On a name collision, it retries once with a short random suffix
  added to the filename. It never overwrites an existing file, and it never hard-fails a normal
  upload over a plain name clash.
- Inserts `name`, `alt`, `storage_path`, `mime_type`, and `size`. If the insert fails after a
  successful upload, the route removes the just-uploaded storage object first, then re-throws
  the original insert error. A cleanup failure only logs a warning — it never hides the real
  error.
- Returns `{ data: { ...row, url } }`. The caller never has to build the public URL itself.

### `GET /api/media/list`

- Query params: `limit` (default 50), `offset`, `search` (matches `name`), and `ids`
  (comma-separated). `ids` is not part of the `PlutoMediaAdapter` contract — the adapter never
  sends it. The `media` field widget uses it to resolve a stored value's thumbnails directly by
  id, without depending on pagination.
- Orders by `created_at desc`.
- Returns `{ data, total }`. Each row in `data` carries a computed `url`.

### `DELETE /api/media/delete/:id`

- Needs the `media:delete` capability.
- Rejects a non-numeric id with 400, and a missing row with 404.
- Removes the storage object first, then deletes the row. This order heals itself on a retry: a
  missing storage key is a harmless no-op remove. Deleting the row first, instead, would leak an
  orphaned file forever if the storage removal later failed.
- Returns `{ id }`.

## Capability model

Two capabilities, declared in `app/plugins/pluto-extension.ts` and enforced by RLS
(`db/migrations/003_capability_policies.sql`):

- `media:manage` — upload, update.
- `media:delete` — delete.

Every server route's own `requireCapability` call is the real security boundary. A UI check
(`can('media:delete')`, used to show or hide a Delete button) is a convenience only — it never
replaces the server check.

## The adapter: `createSupabaseStorageMediaAdapter()`

Implements `PlutoMediaAdapter` from `@plutocms/pluto` (`list`, `upload`, `remove`, `getUrl`).
Registered client-side, through `mediaAdapters` on `definePlutoExtension` — unlike
`PlutoContentAdapter`, which registers server-side. Every method calls this layer's own
`/api/media/*` routes with `$fetch`. It never calls Supabase directly: `requireCapability` only
runs server-side, so a client-side Supabase call would have no real gate behind it.

Two friction points, both by design:

1. **`getUrl(id)` is synchronous, but a real URL only ever comes from an async call.**
   `list()` and `upload()` each fill a module-scope `Map<string, string>` (id → URL) as they
   resolve. `getUrl()` reads that cache. A miss (an id `list()`/`upload()` never saw this
   session) returns `''`. Treat `getUrl()` as a best-effort convenience only. The primary path
   for a URL is the `url` field `list()`/`upload()` already return on their own
   `PlutoMediaItem` — read that first, and reach for `getUrl()` only when you have nothing else.
2. **The id type changes at the adapter boundary.** The real `media` table's primary key is a
   Postgres `bigint`, which arrives in JavaScript as a `number`. `PlutoMediaItem.id` is a
   `string`, because `PlutoMediaAdapter` has to work for any backend, and not every backend
   uses a numeric key. The adapter converts in exactly one place: `String(row.id)` going out,
   `Number(id)` going in (for example, inside `remove(id)`).

## The widget: `PlutoMediaField.vue`

Registered under a bare `fieldType: 'media'`, not a named `widget:` string. This is deliberate.
`@plutocms/pluto` ships eight built-in field widgets but leaves `media` (and `richtext`) with no
core widget on purpose, exactly so one layer can become the app-wide default for that field
type. This layer is that default for `media`, the same way `@plutocms/supabase-blog` is the
default for `richtext`.

`@plutocms/supabase-shop` cannot be hijacked by this. It never extends this layer, and its own
`product.media` field sets an explicit `widget: 'product-media'`, which always wins over a
`fieldType` match — see "Resolution order" in the content-model skill.

The widget is the compact picker: one square thumbnail (or a placeholder) with Change/Clear
buttons in single mode, and a thumbnail strip with a trailing Add tile in multiple mode. This is
not the larger main-image-plus-strip layout `PlutoProductMediaField.vue` uses — that layout
suits a full product-editing page; this one suits a single field inside any generic form.

On mount, if the field already has a value, the widget resolves thumbnails through
`GET /api/media/list?ids=<ids>` — it skips this call when the value is empty. It never depends
on the adapter's `getUrl()` cache, since a page can load a saved value before any `list()` call
has ever run in that session.

## Stored value shape

- A plain field (`{ type: 'media' }`) stores one `media` row id, as a `number`.
- A `multiple: true` field (`{ type: 'media', multiple: true }`) stores an array of ids, as
  `number[]`.

## Known limit: persisting a `multiple: true` field

A content type's own table has no built-in place to store an array of media ids unless one of
two things is true:

1. The consumer's table has its own array/jsonb column for it, and the content type's field
   maps to that column directly (no special handling needed).
2. The consumer sets `virtual: true` on the field and reconciles the array into a separate
   table itself, through `hooks.afterCreate`/`afterUpdate`. `@plutocms/supabase-shop` already
   does this for `product.media` against its own `product_media` table — see the
   `shop-products` skill in that repo for the full write-up of the reconciliation rules. This
   skill does not repeat that pattern here; link to it instead of re-deriving it.

This layer's own `media` table stores each file once. Attaching many files to one content item,
in a `multiple: true` field, is always the consuming content type's own concern, not something
this layer's adapter or widget does for it.
