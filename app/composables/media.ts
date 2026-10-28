export function useMedia() {
  const {
    data: mediaList,
    refresh: refreshMediaList,
    status: mediaStatus,
  } = useFetch('/api/_pluto/storage/media', {
    key: '/api/_pluto/storage/media',
  })

  /**
   * Builds a public storage URL. Accepts either a bare filename (prefixed
   * with `uploads/`, the historical calling convention) or a full
   * `storage_path` (already has a `/`, used as-is) — so both an old caller
   * passing a filename and a new one passing a row's `storage_path` work.
   */
  function getMediaUrl(fileNameOrPath: string | null | undefined): string {
    if (!fileNameOrPath) {
      return ''
    }

    const path = fileNameOrPath.includes('/')
      ? fileNameOrPath
      : `uploads/${fileNameOrPath}`

    return useSupabaseClient().storage.from('media').getPublicUrl(path).data
      .publicUrl
  }

  async function removeMedia(id: number): Promise<void> {
    await $fetch(`/api/_pluto/storage/media/${id}`, { method: 'DELETE' })
  }

  return { mediaList, refreshMediaList, mediaStatus, getMediaUrl, removeMedia }
}
