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

  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_KEY || '',
      },
    },
  },
})
