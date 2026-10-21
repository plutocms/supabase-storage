import { defineAsyncComponent } from 'vue'

// The field widget loads on demand and stays out of the entry chunk. Core
// shows a skeleton while the chunk loads.
const PlutoMediaField = defineAsyncComponent(
  () => import('../components/PlutoMediaField.vue')
)

export default defineNuxtPlugin(() => {
  definePlutoExtension({
    id: 'supabase-storage',
    nav: [
      {
        id: 'media',
        order: 400,
        label: 'supabase-storage.nav.mediaLibrary',
        icon: 'lucide:images',
        to: '/admin/media',
      },
    ],
    pages: [
      {
        id: 'media',
        path: '/admin/media',
        title: 'supabase-storage.nav.mediaLibrary',
        icon: 'lucide:images',
      },
    ],
    capabilities: [
      {
        id: 'media-manage',
        key: 'media:manage',
        label: 'supabase-storage.capabilities.manage',
      },
      { id: 'media-delete', key: 'media:delete', label: 'supabase-storage.capabilities.delete' },
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
