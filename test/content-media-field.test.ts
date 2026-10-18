import { defineContentType } from '@plutocms/pluto/shared/utils/content'
import {
  mapColumnsToFields,
  mapFieldsToColumns
} from '@plutocms/pluto/shared/utils/content-map'
import { validateContentPayload } from '@plutocms/pluto/shared/utils/content-validate'
import { describe, expect, it } from 'vitest'

// A minimal, test-only content type with one plain `media` field (a single
// cover image, backed by a real column) and one `virtual: true`,
// `multiple: true` field (a gallery reconciled elsewhere — see the
// media-library skill's note on the virtual + hook-reconciliation pattern
// @plutocms/supabase-shop already uses for `product_media`).
//
// Calls `defineContentType` directly through its own import — this file
// needs no Nuxt build context, unlike a real layer's shared/content/*.ts,
// which relies on Nuxt's cross-layer auto-import for the same function.
const testType = defineContentType({
  name: 'gallery-item',
  label: 'Gallery item',
  labelPlural: 'Gallery items',
  source: 'gallery_items',
  titleField: 'cover',
  fields: [
    { name: 'cover', type: 'media', label: 'Cover', required: true },
    {
      name: 'gallery',
      type: 'media',
      label: 'Gallery',
      multiple: true,
      virtual: true,
    },
  ],
})

describe('mapFieldsToColumns', () => {
  it('keeps the column for the non-virtual media field, and drops the virtual one', () => {
    const columns = mapFieldsToColumns(testType, { cover: 5, gallery: [1, 2] })

    expect(columns).toEqual({ cover: 5 })
  })
})

describe('mapColumnsToFields', () => {
  it('reads back the non-virtual media field; the virtual one has no column to read', () => {
    const item = mapColumnsToFields(testType, { id: 1, cover: 5 })

    expect(item).toEqual({ id: 1, cover: 5 })
  })
})

describe('validateContentPayload', () => {
  it('enforces required on the non-virtual media field', () => {
    const errors = validateContentPayload(testType, { cover: '' })

    expect(errors).toEqual([
      { field: 'cover', message: '"Cover" is required.', code: 'required' },
    ])
  })

  it('passes once the required media field has a value, virtual field included', () => {
    const errors = validateContentPayload(testType, {
      cover: 5,
      gallery: [1, 2],
    })

    expect(errors).toEqual([])
  })
})
