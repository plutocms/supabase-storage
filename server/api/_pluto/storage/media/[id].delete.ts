import { serverSupabaseClient } from '#supabase/server'

// DELETE /api/_pluto/storage/media/:id: removes the file and its row. Needs `media:delete`.

function deleteFailed() {
  return createPlutoError({
    statusCode: 500,
    message: 'The media file could not be deleted.',
    key: 'supabase-storage.errors.deleteFailed',
  })
}

export default defineEventHandler(async (event) => {
  await requireCapability(event, 'media:delete')

  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!idParam || Number.isNaN(id)) {
    throw createPlutoError({
      statusCode: 400,
      message: 'Invalid media id.',
      key: 'supabase-storage.errors.invalidId',
    })
  }

  const client = await serverSupabaseClient<Database>(event)

  const { data: row, error: fetchError } = await client
    .from('media')
    .select('id, name, storage_path')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error(`Failed to read media ${id}:`, fetchError.message)
    throw deleteFailed()
  }

  if (!row) {
    throw createPlutoError({
      statusCode: 404,
      message: 'Media not found.',
      key: 'supabase-storage.errors.notFound',
    })
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

  if (deleteError) {
    console.error(`Failed to delete the row of media ${id}:`, deleteError.message)
    throw deleteFailed()
  }

  return { id }
})
