export default defineNuxtConfig({
  extends: ['github:plutocms/utils'],

  $development: {
    modules: ['@nuxtjs/supabase'],
  },

  $meta: {
    name: 'supabase-storage',
  },
})
