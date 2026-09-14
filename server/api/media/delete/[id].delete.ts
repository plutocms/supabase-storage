import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireCapability(event, 'media:delete')

  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!idParam || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid media id.' })
  }

  const client = await serverSupabaseClient<Database>(event)

  const { data: row, error: fetchError } = await client
    .from('media')
    .select('id, name, storage_path')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    throw createError({ statusCode: 500, statusMessage: fetchError.message })
  }

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Media not found.' })
  }

  const objectKey = resolveObjectKey(row)

  // Remove the storage object first, then the table row. On a retry after
  // a partial failure, a missing storage key is a harmless no-op — this
  // ordering never leaves an orphan file behind, the way row-first would.
  const { error: storageError } = await client.storage
    .from('media')
    .remove([objectKey])

  if (storageError) {
    console.warn(
      `Failed to remove storage object "${objectKey}" for media ${id}:`,
      storageError.message
    )
  }

  const { error: deleteError } = await client
    .from('media')
    .delete()
    .eq('id', id)

  if (storageError && deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to remove storage object (${storageError.message}) and failed to delete row (${deleteError.message}).`,
    })
  }

  if (deleteError) {
    throw createError({ statusCode: 500, statusMessage: deleteError.message })
  }

  return { id }
})
