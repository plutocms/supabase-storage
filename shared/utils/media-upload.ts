// Pure, framework-free helpers for the media upload route and the client
// widget. No Nuxt, no Vue, no Supabase — plain functions, unit-tested in
// isolation (see test/media-upload.test.ts).

import en from '../../i18n/locales/en.json'

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

/**
 * Formats a byte count for people: "512 KB", "10 MB", "1.5 GB".
 *
 * `locale` is optional. It sets the decimal mark of the number ("1,5 KB" in
 * pt-BR). Without it, the number is plain ("1.5 KB"). The units stay the same
 * in every language.
 */
export function formatBytes(bytes: number, locale?: string): string {
  const units = ['bytes', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const rounded = unit === 0 || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  const text = locale
    ? new Intl.NumberFormat(locale, { useGrouping: false }).format(rounded)
    : String(rounded)
  return `${text} ${units[unit]}`
}

export interface UploadLimits {
  /** Same format as `isAllowedUpload`'s allow list. */
  allowedMimeTypes: string | string[]
  maxBytes: number
}

/** A translation key with its values. The UI turns it into text with `t(key, params)`. */
export interface UploadProblem {
  key: 'supabase-storage.upload.problem.unsupportedType' | 'supabase-storage.upload.problem.tooLarge'
  params: Record<string, string>
}

/**
 * Finds why a file cannot be uploaded, as a translation key and its values,
 * or returns `null` when the file passes. It applies the same rules as the
 * upload route (`isAllowedUpload`, then the size limit), so the client can
 * reject a file before it sends it.
 *
 * `locale` sets the number format of the sizes in `params`.
 */
export function uploadProblem(
  file: { name: string, type: string, size: number },
  limits: UploadLimits,
  locale?: string
): UploadProblem | null {
  const mimeType = file.type || 'application/octet-stream'
  if (!isAllowedUpload(mimeType, file.name, limits.allowedMimeTypes)) {
    return {
      key: 'supabase-storage.upload.problem.unsupportedType',
      params: { name: file.name },
    }
  }
  if (file.size > limits.maxBytes) {
    return {
      key: 'supabase-storage.upload.problem.tooLarge',
      params: {
        name: file.name,
        size: formatBytes(file.size, locale),
        limit: formatBytes(limits.maxBytes, locale),
      },
    }
  }
  return null
}

/** Finds the English message of a key in `en.json`. */
function englishMessage(key: string): string {
  let node: unknown = en
  for (const part of key.split('.')) {
    node = (node as Record<string, unknown>)[part]
  }
  return node as string
}

/**
 * Explains why a file cannot be uploaded, in English words for the user, or
 * returns `null` when the file passes. It builds on `uploadProblem`. The
 * admin UI uses `uploadProblem` and translates the key instead.
 */
export function describeUploadProblem(
  file: { name: string, type: string, size: number },
  limits: UploadLimits
): string | null {
  const problem = uploadProblem(file, limits)
  if (!problem) {
    return null
  }
  return englishMessage(problem.key).replace(
    /\{(\w+)\}/g,
    (_match, name: string) => problem.params[name] ?? ''
  )
}
