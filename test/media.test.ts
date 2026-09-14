import type { Database } from '../shared/types/supabase'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'

// Guards the schema/type-generation drift that broke this repo's typecheck:
// server/api/media/* query a `media` table that the shared Database types
// didn't declare, and the type only exists once the CLI-generated snapshot
// (shared/types/supabase.ts, gitignored, regenerated per environment) is
// in place. This asserts the shape that snapshot must have, not the live
// database.
describe('media table shape', () => {
  it('declares the columns server/api/media/*.ts and UploadMedia.vue depend on', () => {
    type MediaRow = Database['public']['Tables']['media']['Row']

    expectTypeOf<MediaRow>().toHaveProperty('id').toEqualTypeOf<number>()
    expectTypeOf<MediaRow>()
      .toHaveProperty('name')
      .toEqualTypeOf<string | null>()
    expectTypeOf<MediaRow>()
      .toHaveProperty('alt')
      .toEqualTypeOf<string | null>()
    expectTypeOf<MediaRow>()
      .toHaveProperty('storage_path')
      .toEqualTypeOf<string | null>()
    expectTypeOf<MediaRow>()
      .toHaveProperty('mime_type')
      .toEqualTypeOf<string | null>()
    expectTypeOf<MediaRow>()
      .toHaveProperty('size')
      .toEqualTypeOf<number | null>()

    // media is generic and no longer has product_id — that association
    // moved out to @plutocms/supabase-shop's own product_media table. Not
    // asserted as `.not.toHaveProperty()` here: this repo's shared/types/
    // supabase.ts resolves through the installed @plutocms/supabase
    // package, and CI installs it from npm, not from this monorepo's local
    // sibling checkout — so the assertion would fail here until that
    // package's own type-snapshot fix is published.

    // `media` has no persisted url column (unlike supabase-shop's
    // product_media) — server/api/media/list.get.ts computes it per row
    // via client.storage.from('media').getPublicUrl(...).
    expectTypeOf<MediaRow>().not.toHaveProperty('url')
  })
})

describe('getMediaUrl', () => {
  it('builds a public storage URL through getPublicUrl, for a bare filename or a full storage_path', async () => {
    const { useMedia } = await import('../app/composables/media')

    const getPublicUrl = vi.fn((path: string) => ({
      data: {
        publicUrl: `https://project.supabase.co/storage/v1/object/public/media/${path}`,
      },
    }))

    vi.stubGlobal('useSupabaseClient', () => ({
      storage: { from: () => ({ getPublicUrl }) },
    }))
    vi.stubGlobal('useFetch', () => ({
      data: { value: undefined },
      refresh: async () => {},
      status: { value: 'idle' },
    }))

    const { getMediaUrl } = useMedia()

    // A bare filename (the historical calling convention) is prefixed with
    // 'uploads/'.
    expect(getMediaUrl('cover.png')).toBe(
      'https://project.supabase.co/storage/v1/object/public/media/uploads/cover.png'
    )
    expect(getPublicUrl).toHaveBeenCalledWith('uploads/cover.png')

    // A full storage_path (already has a '/') is used as-is.
    expect(getMediaUrl('gallery/2024/cover.png')).toBe(
      'https://project.supabase.co/storage/v1/object/public/media/gallery/2024/cover.png'
    )
    expect(getPublicUrl).toHaveBeenCalledWith('gallery/2024/cover.png')

    expect(getMediaUrl(null)).toBe('')
    expect(getMediaUrl(undefined)).toBe('')

    vi.unstubAllGlobals()
  })
})

describe('removeMedia', () => {
  it('deletes the media delete route by id', async () => {
    const { useMedia } = await import('../app/composables/media')

    const fetchMock = vi.fn(async () => undefined)

    vi.stubGlobal('useSupabaseClient', () => ({
      storage: {
        from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }),
      },
    }))
    vi.stubGlobal('useFetch', () => ({
      data: { value: undefined },
      refresh: async () => {},
      status: { value: 'idle' },
    }))
    vi.stubGlobal('$fetch', fetchMock)

    const { removeMedia } = useMedia()

    await removeMedia(42)

    expect(fetchMock).toHaveBeenCalledWith('/api/media/delete/42', {
      method: 'DELETE',
    })

    vi.unstubAllGlobals()
  })
})
