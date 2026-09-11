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
    expectTypeOf<MediaRow>().toHaveProperty('name').toEqualTypeOf<string | null>()
    expectTypeOf<MediaRow>().toHaveProperty('alt').toEqualTypeOf<string | null>()

    // media is generic and no longer has product_id — that association
    // moved out to @plutocms/supabase-shop's own product_media table. Not
    // asserted as `.not.toHaveProperty()` here: this repo's shared/types/
    // supabase.ts resolves through the installed @plutocms/supabase
    // package, and CI installs it from npm, not from this monorepo's local
    // sibling checkout — so the assertion would fail here until that
    // package's own type-snapshot fix is published.

    // `media` has no persisted url column (unlike supabase-shop's
    // product_media) — server/api/media/list.get.ts computes it manually
    // via client.storage.from('media').getPublicUrl(...).
    expectTypeOf<MediaRow>().not.toHaveProperty('url')
  })
})

describe('getMediaUrl', () => {
  it('builds a public storage URL from a filename', async () => {
    const { useMedia } = await import('../app/composables/media')

    // useRuntimeConfig is auto-imported by Nuxt at runtime; stub it here so
    // the composable is testable in isolation.
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { supabase: { url: 'https://project.supabase.co' } },
    }))
    vi.stubGlobal('useFetch', () => ({
      data: { value: undefined },
      refresh: async () => {},
      status: { value: 'idle' },
    }))

    const { getMediaUrl } = useMedia()

    expect(getMediaUrl('cover.png')).toBe(
      'https://project.supabase.co/storage/v1/object/public/media/uploads/cover.png'
    )
    expect(getMediaUrl(null)).toBe('')
    expect(getMediaUrl(undefined)).toBe('')

    vi.unstubAllGlobals()
  })
})
