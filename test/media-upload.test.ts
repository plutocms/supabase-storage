import { describe, expect, it } from 'vitest'
import {
  assertUploadSize,
  describeUploadProblem,
  formatBytes,
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

describe('formatBytes', () => {
  it('formats bytes, KB, MB, and GB', () => {
    expect(formatBytes(512)).toBe('512 bytes')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(10_485_760)).toBe('10 MB')
    expect(formatBytes(14_890_000)).toBe('14 MB')
    expect(formatBytes(2 * 1024 ** 3)).toBe('2 GB')
  })
})

describe('describeUploadProblem', () => {
  const limits = { allowedMimeTypes: ALLOW_LIST, maxBytes: 10_485_760 }

  it('passes an allowed file within the limit', () => {
    expect(describeUploadProblem({ name: 'dog.png', type: 'image/png', size: 2048 }, limits)).toBeNull()
  })

  it('passes a .glb that the browser labels as octet-stream', () => {
    expect(describeUploadProblem({ name: 'model.glb', type: '', size: 2048 }, limits)).toBeNull()
  })

  it('explains a file type that is not allowed', () => {
    expect(describeUploadProblem({ name: 'notes.pdf', type: 'application/pdf', size: 2048 }, limits))
      .toBe('"notes.pdf" is not a supported file type. Upload an image or a .glb 3D model.')
  })

  it('explains a file that is too large', () => {
    expect(describeUploadProblem({ name: 'big.png', type: 'image/png', size: 15 * 1024 * 1024 }, limits))
      .toBe('"big.png" is 15 MB. The limit is 10 MB.')
  })
})
