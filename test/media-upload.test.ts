import { describe, expect, it } from 'vitest'
import {
  assertUploadSize,
  isAllowedUpload,
  resolveObjectKey,
  resolveStoragePath
} from '../shared/utils/media-upload'

const ALLOW_LIST = 'image/*,model/gltf-binary,application/octet-stream'

describe('isAllowedUpload', () => {
  it('allows any image/* subtype', () => {
    expect(isAllowedUpload('image/png', 'cover.png', ALLOW_LIST)).toBe(true)
    expect(isAllowedUpload('image/webp', 'cover.webp', ALLOW_LIST)).toBe(true)
  })

  it('allows model/gltf-binary', () => {
    expect(isAllowedUpload('model/gltf-binary', 'model.glb', ALLOW_LIST)).toBe(
      true
    )
  })

  it('allows application/octet-stream only when the filename ends in .glb', () => {
    expect(
      isAllowedUpload('application/octet-stream', 'model.glb', ALLOW_LIST)
    ).toBe(true)
    expect(
      isAllowedUpload('application/octet-stream', 'MODEL.GLB', ALLOW_LIST)
    ).toBe(true)
    expect(
      isAllowedUpload('application/octet-stream', 'archive.zip', ALLOW_LIST)
    ).toBe(false)
    expect(
      isAllowedUpload('application/octet-stream', 'document.pdf', ALLOW_LIST)
    ).toBe(false)
  })

  it('rejects application/octet-stream entirely when the allow list omits it', () => {
    expect(
      isAllowedUpload('application/octet-stream', 'model.glb', 'image/*')
    ).toBe(false)
  })

  it('rejects a disallowed type', () => {
    expect(isAllowedUpload('text/plain', 'notes.txt', ALLOW_LIST)).toBe(false)
    expect(isAllowedUpload('application/pdf', 'doc.pdf', ALLOW_LIST)).toBe(
      false
    )
  })

  it('accepts an array allow list, equivalent to the comma-separated string', () => {
    expect(isAllowedUpload('image/png', 'cover.png', ['image/*'])).toBe(true)
    expect(isAllowedUpload('image/png', 'cover.png', [])).toBe(false)
  })
})

describe('assertUploadSize', () => {
  it('does not throw when bytes is at or under the limit', () => {
    expect(() => assertUploadSize(1000, 1000)).not.toThrow()
    expect(() => assertUploadSize(500, 1000)).not.toThrow()
  })

  it('throws when bytes exceeds the limit', () => {
    expect(() => assertUploadSize(1001, 1000)).toThrow()
  })
})

describe('resolveStoragePath', () => {
  it('prefixes a filename with uploads/', () => {
    expect(resolveStoragePath('cover.png')).toBe('uploads/cover.png')
  })
})

describe('resolveObjectKey', () => {
  it('uses storage_path when set', () => {
    expect(
      resolveObjectKey({
        storage_path: 'uploads/cover-3f9a.png',
        name: 'cover.png',
      })
    ).toBe('uploads/cover-3f9a.png')
  })

  it('falls back to uploads/<name> when storage_path is null', () => {
    expect(resolveObjectKey({ storage_path: null, name: 'cover.png' })).toBe(
      'uploads/cover.png'
    )
  })
})
