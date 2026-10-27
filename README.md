# Supabase Storage Layer for Pluto

This layer provides media and file storage functionality for Pluto, built on Supabase Storage.

## Features

This layer provides:

- A media library admin page to upload, list, and delete files in Supabase Storage.
- Internal admin routes under `/api/_pluto/storage/media` (`GET` list, `POST` upload, `DELETE /:id`). A public site gets image URLs through the public API of Pluto (`/api/pluto/v1/content/<type>`, see https://pluto.vulmix.dev/core/public-api).
- A generic `media` content-field widget usable by any content layer to attach media to content types.

For the full feature list with detailed documentation, see [FEATURES.md](./FEATURES.md).

## Installation

1. Make sure you have a Supabase project set up with the required environment variables.

2. Install `@plutocms/supabase-storage` (`npm i @plutocms/supabase-storage`, or pnpm or Bun). Then add it via `extends` option in your `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [['@plutocms/supabase-storage', { install: true }]],
})
```

This layer depends on `@plutocms/supabase` and `@plutocms/pluto`. They are real dependencies, so npm, pnpm and Bun install them with the layer. The layer brings `@plutocms/supabase`, which brings `@plutocms/pluto`. List only `@plutocms/supabase-storage` in your app.
