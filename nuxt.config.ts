// Point these at a local checkout (e.g. `../supabase`, `../utils`) to test
// unpublished changes; unset, they resolve to the published npm packages.
const supabaseLayer = process.env.PLUTO_SUPABASE_PATH || '@plutocms/supabase'
const utilsLayer = process.env.PLUTO_UTILS_PATH || '@plutocms/utils'

export default defineNuxtConfig({
  extends: [supabaseLayer, utilsLayer],

  modules: ['@nuxtjs/supabase'],

  $meta: {
    name: 'supabase-storage',
  },

  // No `css` entry: the app owns the one Tailwind build, and Nuxt UI scans
  // this layer's app/ dir. See the single-tailwind-build skill in pluto.

  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_KEY || '',
      },
      // Mirrors the server-side upload limits, so the widget can
      // pre-validate a file with the same numbers the server enforces.
      plutoStorage: {
        maxUploadBytes: Number(process.env.PLUTO_MEDIA_MAX_BYTES) || 10_485_760,
        allowedMimeTypes: 'image/*,model/gltf-binary,application/octet-stream',
      },
    },
  },
})
