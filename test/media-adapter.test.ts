import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createSupabaseStorageMediaAdapter', () => {
  it('getUrl returns "" for an id never seen by list() or upload()', async () => {
    const { createSupabaseStorageMediaAdapter } =
      await import('../app/utils/media-adapter')

    const adapter = createSupabaseStorageMediaAdapter()

    expect(adapter.getUrl('never-cached')).toBe('')
  })

  it('list() calls /api/_pluto/storage/media with limit/offset/search and maps rows to PlutoMediaItem', async () => {
    const fetchMock = vi.fn(async () => ({
      data: [
        {
          id: 1,
          name: 'cover.png',
          alt: 'Cover',
          mime_type: 'image/png',
          size: 1234,
          url: 'https://cdn/cover.png',
        },
      ],
      total: 1,
    }))
    vi.stubGlobal('$fetch', fetchMock)

    const { createSupabaseStorageMediaAdapter } =
      await import('../app/utils/media-adapter')
    const adapter = createSupabaseStorageMediaAdapter()

    const result = await adapter.list({ limit: 10, offset: 0, search: 'cov' })

    expect(fetchMock).toHaveBeenCalledWith('/api/_pluto/storage/media', {
      query: { limit: 10, offset: 0, search: 'cov' },
    })

    expect(result.total).toBe(1)
    expect(result.data).toEqual([
      {
        id: '1',
        name: 'cover.png',
        url: 'https://cdn/cover.png',
        mimeType: 'image/png',
        size: 1234,
        alt: 'Cover',
      },
    ])

    // list() fills the getUrl() cache.
    expect(adapter.getUrl('1')).toBe('https://cdn/cover.png')
  })

  it('upload() posts a FormData with file/name/alt parts and maps the returned row', async () => {
    let capturedBody: unknown
    const fetchMock = vi.fn(async (_url: string, opts: { body: unknown }) => {
      capturedBody = opts.body
      return {
        data: {
          id: 2,
          name: 'logo.png',
          alt: 'Logo',
          mime_type: 'image/png',
          size: 500,
          url: 'https://cdn/logo.png',
        },
      }
    })
    vi.stubGlobal('$fetch', fetchMock)

    const { createSupabaseStorageMediaAdapter } =
      await import('../app/utils/media-adapter')
    const adapter = createSupabaseStorageMediaAdapter()

    const file = new File(['data'], 'logo.png', { type: 'image/png' })
    const item = await adapter.upload(file, { alt: 'Logo' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/_pluto/storage/media',
      expect.objectContaining({ method: 'POST' })
    )
    expect(capturedBody).toBeInstanceOf(FormData)

    const body = capturedBody as FormData
    expect(body.get('file')).toBe(file)
    expect(body.get('name')).toBe('logo.png')
    expect(body.get('alt')).toBe('Logo')

    expect(item).toEqual({
      id: '2',
      name: 'logo.png',
      url: 'https://cdn/logo.png',
      mimeType: 'image/png',
      size: 500,
      alt: 'Logo',
    })

    // upload() also fills the getUrl() cache.
    expect(adapter.getUrl('2')).toBe('https://cdn/logo.png')
  })

  it('remove() calls the delete route by id and drops the cache entry', async () => {
    const listFetch = vi.fn(async () => ({
      data: [
        {
          id: 3,
          name: 'x.png',
          alt: null,
          mime_type: 'image/png',
          size: 10,
          url: 'https://cdn/x.png',
        },
      ],
      total: 1,
    }))
    vi.stubGlobal('$fetch', listFetch)

    const { createSupabaseStorageMediaAdapter } =
      await import('../app/utils/media-adapter')
    const adapter = createSupabaseStorageMediaAdapter()

    await adapter.list({})
    expect(adapter.getUrl('3')).toBe('https://cdn/x.png')

    const deleteFetch = vi.fn(async () => undefined)
    vi.stubGlobal('$fetch', deleteFetch)

    await adapter.remove('3')

    expect(deleteFetch).toHaveBeenCalledWith('/api/_pluto/storage/media/3', {
      method: 'DELETE',
    })
    expect(adapter.getUrl('3')).toBe('')
  })
})
