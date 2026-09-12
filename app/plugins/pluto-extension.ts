export default defineNuxtPlugin(() => {
  definePlutoExtension({
    id: 'supabase-storage',
    nav: [
      {
        id: 'media',
        order: 400,
        label: 'Media Library',
        icon: 'lucide:images',
        to: '/admin/media',
      },
    ],
    pages: [
      { id: 'media', path: '/admin/media', title: 'Media Library', icon: 'lucide:images' },
    ],
    capabilities: [
      { id: 'media-manage', key: 'media:manage', label: 'Upload and edit media' },
      { id: 'media-delete', key: 'media:delete', label: 'Delete media' },
    ],
  })
})
