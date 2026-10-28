import type { ZodType } from 'zod'

// Server-only validation helper. Wraps a zod schema and throws the same
// error shape `@plutocms/pluto`'s generic content routes use, so a client
// sees one consistent 400 body no matter which route rejects its input.
//
// This is h3-dependent (createPlutoError), unlike shared/utils/media-upload.ts,
// which stays framework-free. Keep it in server/utils for that reason.

/** One field-level validation failure. */
export interface FieldValidationError {
  field: string
  message: string
}

/**
 * Parses `input` against `schema`. Returns the parsed, typed value on
 * success. On failure, throws a 400 `createPlutoError` with `data.errors` shaped
 * as `{ field, message }[]` — the same shape `validateContentPayload`
 * produces for the generic content routes.
 */
export function validateFields<T>(input: unknown, schema: ZodType<T>): T {
  const result = schema.safeParse(input)

  if (!result.success) {
    const errors: FieldValidationError[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))

    throw createPlutoError({
      statusCode: 400,
      message: 'Validation failed.',
      key: 'pluto.errors.validationFailed',
      data: { errors },
    })
  }

  return result.data
}
