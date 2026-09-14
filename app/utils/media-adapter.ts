// The real `PlutoMediaAdapter` implementation for this layer. Registered
// client-side (see app/plugins/pluto-extension.ts) — every method calls
// this layer's own /api/media/* routes with $fetch, never Supabase
// directly, since requireCapability only runs server-side and is the real
// security boundary.

/** One row as this layer's server routes return it — before the id/URL are reshaped into `PlutoMediaItem`. */
interface MediaRow {
  id: number
  name: string | null
  alt?: string | null
  mime_type?: string | null
  size?: number | null
  url: string
}

// PlutoMediaAdapter.getUrl(id) is synchronous, but the real URL only ever
// comes back from an async call (list/upload). This module-scope cache
// bridges that gap: every list() and upload() call fills it, and getUrl()
// reads it. It is a best-effort convenience only — the primary path is the
// `url` a caller already gets back from list()/upload() directly. A miss
// (an id never seen by list() or upload() in this session) returns ''.
const urlCache = new Map<string, string>()

/** `media` table's primary key is `bigint` (a JS `number`); `PlutoMediaItem.id` is `string`. This is the one place that conversion happens. */
function toMediaItem(row: MediaRow): PlutoMediaItem {
  const item: PlutoMediaItem = {
    id: String(row.id),
    name: row.name ?? '',
    url: row.url,
    mimeType: row.mime_type ?? undefined,
    size: row.size ?? undefined,
    alt: row.alt ?? undefined,
  }

  urlCache.set(item.id, item.url)

  return item
}

export function createSupabaseStorageMediaAdapter(): PlutoMediaAdapter {
  return {
    id: 'supabase-storage',

    async list(options) {
      const { data, total } = await $fetch<{
        data: MediaRow[]
        total?: number
      }>('/api/media/list', {
        query: {
          limit: options.limit,
          offset: options.offset,
          search: options.search,
        },
      })

      return { data: data.map(toMediaItem), total }
    },

    async upload(file, meta) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      if (meta?.alt) {
        formData.append('alt', meta.alt)
      }

      const { data } = await $fetch<{ data: MediaRow }>('/api/media/new', {
        method: 'POST',
        body: formData,
      })

      return toMediaItem(data)
    },

    async remove(id) {
      await $fetch(`/api/media/delete/${id}`, { method: 'DELETE' })
      urlCache.delete(id)
    },

    getUrl(id) {
      return urlCache.get(id) ?? ''
    },
  }
}
