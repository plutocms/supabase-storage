import { beforeAll, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { validateFields } from '../server/utils/validate'
import { createPlutoErrorStub } from './fixtures/i18n-stub'

// createPlutoError is a Nitro auto-import, so the test stubs it.
beforeAll(() => {
  vi.stubGlobal('createPlutoError', createPlutoErrorStub)
})

const schema = z.object({
  alt: z.string().max(5, { message: '"alt" must be at most 5 characters.' }).optional(),
})

describe('validateFields', () => {
  it('returns the parsed value when input is valid', () => {
    expect(validateFields({ alt: 'ok' }, schema)).toEqual({ alt: 'ok' })
  })

  it('allows an optional field to be omitted', () => {
    expect(validateFields({ alt: undefined }, schema)).toEqual({
      alt: undefined,
    })
  })

  it('throws a 400 with a field/message error list on failure', () => {
    try {
      validateFields({ alt: 'too long' }, schema)
      expect.unreachable('validateFields should have thrown')
    } catch (error) {
      const h3Error = error as {
        statusCode: number
        statusMessage: string
        data: { errors: { field: string, message: string }[] }
      }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Validation failed.')
      expect(h3Error.data.errors).toEqual([
        { field: 'alt', message: '"alt" must be at most 5 characters.' },
      ])
    }
  })

  it('joins a nested field path with a dot', () => {
    const nested = z.object({ a: z.object({ b: z.string() }) })

    try {
      validateFields({ a: { b: 1 } }, nested)
      expect.unreachable('validateFields should have thrown')
    } catch (error) {
      const h3Error = error as { data: { errors: { field: string }[] } }
      expect(h3Error.data.errors[0]?.field).toBe('a.b')
    }
  })
})
