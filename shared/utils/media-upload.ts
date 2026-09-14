// Pure, framework-free helpers for the media upload route and the client
// widget. No Nuxt, no Vue, no Supabase — plain functions, unit-tested in
// isolation (see test/media-upload.test.ts).

/**
 * Checks a file's MIME type against an allow list.
 *
 * `allowList` is a comma-separated string (or an array) of entries. An
 * entry ending in `/*` matches any subtype (`image/*` matches `image/png`).
 *
 * `application/octet-stream` gets one special case: browsers often mislabel
 * a `.glb` file's MIME type as `application/octet-stream`, since many OSes
 * have no association for it. This type is only accepted when the filename
 * itself ends in `.glb` — accepting it unconditionally would open the
 * upload to any file type, since `application/octet-stream` is a generic
 * fallback MIME type browsers use for unrecognized files in general.
 */
export function isAllowedUpload(
  mimeType: string,
  fileName: string,
  allowList: string | string[]
): boolean {
  const allowed = Array.isArray(allowList)
    ? allowList
    : allowList
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)

  if (mimeType === 'application/octet-stream') {
    return (
      allowed.includes('application/octet-stream') &&
      fileName.toLowerCase().endsWith('.glb')
    )
  }

  return allowed.some((entry) => {
    if (entry === mimeType) {
      return true
    }
    if (entry.endsWith('/*')) {
      return mimeType.startsWith(entry.slice(0, -1))
    }
    return false
  })
}

/** Throws when `bytes` exceeds `max`. Both are byte counts. */
export function assertUploadSize(bytes: number, max: number): void {
  if (bytes > max) {
    throw new Error(`File is ${bytes} bytes. The limit is ${max} bytes.`)
  }
}

/** The storage key a fresh upload of `fileName` is saved under. */
export function resolveStoragePath(fileName: string): string {
  return `uploads/${fileName}`
}

/**
 * The storage key an existing media row's file lives at. Falls back to
 * `uploads/<name>` when `storage_path` is null — for a row created before
 * `storage_path` was populated on insert (see the 004 backfill migration,
 * which sets it for every row this fallback would otherwise apply to, but a
 * caller should still not assume every row has been backfilled).
 */
export function resolveObjectKey(row: {
  storage_path?: string | null
  name?: string | null
}): string {
  return row.storage_path ?? `uploads/${row.name ?? ''}`
}
