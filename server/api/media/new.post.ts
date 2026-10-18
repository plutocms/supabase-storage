import { z } from 'zod'
import { serverSupabaseClient } from '#supabase/server'

const DEFAULT_MAX_BYTES = 10_485_760
const DEFAULT_ALLOWED_MIME_TYPES =
  'image/*,model/gltf-binary,application/octet-stream'

const ALT_MAX_LENGTH = 500

/** Schema for the plain-text multipart fields (everything but the file itself). */
const newMediaFieldsSchema = z.object({
  alt: z
    .string()
    .max(ALT_MAX_LENGTH, {
      message: `"alt" must be at most ${ALT_MAX_LENGTH} characters.`,
    })
    .optional(),
})

/** True when a Supabase Storage upload error means "an object already exists at this path". */
function isStorageCollisionError(error: {
  statusCode?: string | number
  message?: string
}): boolean {
  return (
    String(error.statusCode) === '409' ||
    Boolean(error.message?.toLowerCase().includes('already exists'))
  )
}

/** Appends a short random suffix to a filename, before its extension. */
function addSuffixToFileName(fileName: string): string {
  const suffix = Math.random().toString(36).slice(2, 6)
  const match = fileName.match(/^(.*)(\.[^./]+)$/)

  if (!match) {
    return `${fileName}-${suffix}`
  }

  const [, stem, extension] = match
  return `${stem}-${suffix}${extension}`
}

export default defineEventHandler(async (event) => {
  await requireCapability(event, 'media:manage')

  const config = useRuntimeConfig(event)
  const maxBytes =
    config.public.plutoStorage?.maxUploadBytes ?? DEFAULT_MAX_BYTES
  const allowedMimeTypes =
    config.public.plutoStorage?.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES

  const client = await serverSupabaseClient<Database>(event)

  const formData = await readMultipartFormData(event)

  const filePart = formData?.find((part) => part.filename)
  const altPart = formData?.find((part) => part.name === 'alt')

  if (!filePart?.filename) {
    throw createPlutoError({
      statusCode: 400,
      message: 'No file sent.',
      key: 'supabase-storage.errors.noFile',
    })
  }

  const mimeType = filePart.type ?? 'application/octet-stream'

  if (!isAllowedUpload(mimeType, filePart.filename, allowedMimeTypes)) {
    throw createPlutoError({
      statusCode: 415,
      message: `File type "${mimeType}" is not allowed.`,
      key: 'supabase-storage.errors.typeNotAllowed',
      params: { type: mimeType },
    })
  }

  try {
    assertUploadSize(filePart.data.length, maxBytes)
  } catch (error) {
    throw createPlutoError({
      statusCode: 413,
      message: error instanceof Error ? error.message : 'File is too large.',
      key: 'supabase-storage.errors.tooLarge',
      params: { bytes: filePart.data.length, max: maxBytes },
    })
  }

  const fileName = fileNameToKebabCase(filePart.filename)

  const { alt } = validateFields(
    { alt: altPart?.data.toString('utf-8') },
    newMediaFieldsSchema
  )

  let storagePath = resolveStoragePath(fileName)

  let uploadResult = await client.storage
    .from('media')
    .upload(storagePath, filePart.data, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadResult.error && isStorageCollisionError(uploadResult.error)) {
    // Never silently overwrite, never hard-fail a normal upload on a plain
    // name collision — retry once with a short random suffix.
    storagePath = resolveStoragePath(addSuffixToFileName(fileName))

    uploadResult = await client.storage
      .from('media')
      .upload(storagePath, filePart.data, {
        contentType: mimeType,
        upsert: false,
      })
  }

  if (uploadResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: uploadResult.error.message,
    })
  }

  const insertName = storagePath.replace(/^uploads\//, '')

  const { data, error } = await client
    .from('media')
    .insert({
      name: insertName,
      alt,
      storage_path: storagePath,
      mime_type: mimeType,
      size: filePart.data.length,
    })
    .select()
    .single()

  if (error) {
    // The storage object uploaded fine but the row failed. Remove the
    // orphaned object so a retry does not accumulate dead files. Log any
    // cleanup failure but never let it mask the real insert error below.
    const { error: cleanupError } = await client.storage
      .from('media')
      .remove([storagePath])

    if (cleanupError) {
      console.warn(
        `Failed to remove orphaned storage object "${storagePath}":`,
        cleanupError.message
      )
    }

    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const { data: urlData } = client.storage
    .from('media')
    .getPublicUrl(storagePath)

  return { data: { ...data, url: urlData.publicUrl } }
})
