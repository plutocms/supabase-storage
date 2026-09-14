# Supabase Storage Layer for Pluto CMS

This layer provides media and file storage functionality for Pluto CMS, built on Supabase Storage.

## Features

This layer provides:

- A media library admin page to upload, list, and delete files in Supabase Storage.
- API routes for media management (upload, list, delete).
- A generic `media` content-field widget usable by any content layer to attach media to content types.

For the full feature list with detailed documentation, see [FEATURES.md](./FEATURES.md).

## Installation

1. Make sure you have a Supabase project set up with the required environment variables.

2. Add the `@plutocms/supabase-storage` layer via `extends` option in your `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [['github:plutocms/supabase-storage', { install: true }]],
})
```

This layer requires `@plutocms/supabase` and `@plutocms/pluto` as peer dependencies.
