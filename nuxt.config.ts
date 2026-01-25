export default defineNuxtConfig({
  $development: {
    extends: ['../../plutocms/utils/'],

    modules: ['@nuxtjs/supabase'],
  },

  $meta: {
    name: 'supabase-storage',
  },

  $production: {
    extends: ['github:plutocms/utils'],
  },
})
