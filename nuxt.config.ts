export default defineNuxtConfig({
  extends: ['@plutocms/supabase', '@plutocms/utils'],

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
