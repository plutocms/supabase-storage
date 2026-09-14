import PlutoMediaField from '../components/PlutoMediaField.vue'

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
      {
        id: 'media',
        path: '/admin/media',
        title: 'Media Library',
        icon: 'lucide:images',
      },
    ],
    capabilities: [
      {
        id: 'media-manage',
        key: 'media:manage',
        label: 'Upload and edit media',
      },
      { id: 'media-delete', key: 'media:delete', label: 'Delete media' },
    ],
    // Bare `fieldType: 'media'` on purpose: core ships no widget for this
    // field type, leaving the slot open for exactly one storage layer to
    // fill app-wide. See the media-library skill.
    mediaAdapters: [
      { id: 'supabase-storage', adapter: createSupabaseStorageMediaAdapter() },
    ],
    contentFieldWidgets: [
      { id: 'media', fieldType: 'media', component: PlutoMediaField },
    ],
  })
})
