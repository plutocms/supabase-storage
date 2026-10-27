import { serverSupabaseClient } from '#supabase/server'

// GET /api/_pluto/storage/media: the media library of the admin. An internal route: a public
// site reads images through the URLs that the public API gives (see core's public API).

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

  const query = getQuery(event)

  const limit = query.limit ? Number(query.limit) : 50
  const offset = query.offset !== undefined ? Number(query.offset) : undefined
  const search = typeof query.search === 'string' ? query.search : undefined
  const ids =
    typeof query.ids === 'string'
      ? query.ids
          .split(',')
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : undefined

  let request = client
    .from('media')
    .select('id, created_at, name, alt, storage_path, mime_type, size', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })

  if (search) {
    request = request.ilike('name', `%${search}%`)
  }

  // Non-standard: lets the media-field widget resolve a stored value's
  // thumbnails directly by id, independent of pagination. The adapter
  // itself never sends this param — only the widget does.
  if (ids && ids.length > 0) {
    request = request.in('id', ids)
  }

  request =
    offset !== undefined
      ? request.range(offset, offset + limit - 1)
      : request.limit(limit)

  const { data, error, count } = await request

  if (error) {
    console.error('Failed to list media:', error)
    throw createPlutoError({
      statusCode: 500,
      message: 'The media list could not be read.',
      key: 'supabase-storage.errors.listFailed',
    })
  }

  const dataWithUrls = (data ?? []).map((row) => ({
    ...row,
    url: client.storage.from('media').getPublicUrl(resolveObjectKey(row)).data.publicUrl,
  }))

  return { data: dataWithUrls, total: count ?? undefined }
})
