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

/** Formats a byte count for people: "512 KB", "10 MB", "1.5 GB". */
export function formatBytes(bytes: number): string {
  const units = ['bytes', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const rounded = unit === 0 || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded} ${units[unit]}`
}

export interface UploadLimits {
  /** Same format as `isAllowedUpload`'s allow list. */
  allowedMimeTypes: string | string[]
  maxBytes: number
}

/**
 * Explains why a file cannot be uploaded, in words for the user, or returns
 * `null` when the file passes. It applies the same rules as the upload
 * route (`isAllowedUpload`, then the size limit), so the client can reject a
 * file before it sends it.
 */
export function describeUploadProblem(
  file: { name: string, type: string, size: number },
  limits: UploadLimits
): string | null {
  const mimeType = file.type || 'application/octet-stream'
  if (!isAllowedUpload(mimeType, file.name, limits.allowedMimeTypes)) {
    return `"${file.name}" is not a supported file type. Upload an image or a .glb 3D model.`
  }
  if (file.size > limits.maxBytes) {
    return `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(limits.maxBytes)}.`
  }
  return null
}
