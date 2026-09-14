# Changelog

## [0.5.1](https://github.com/plutocms/supabase-storage/compare/v0.5.0...v0.5.1) (2026-09-14)


### Bug Fixes

* **security:** validate the media alt field with zod ([#31](https://github.com/plutocms/supabase-storage/issues/31)) ([55ab87a](https://github.com/plutocms/supabase-storage/commit/55ab87a675ac02d5a365405ec5291911aac1b348))

## [0.5.0](https://github.com/plutocms/supabase-storage/compare/v0.4.1...v0.5.0) (2026-09-14)


### Features

* **media:** generic media field widget and PlutoMediaAdapter ([#29](https://github.com/plutocms/supabase-storage/issues/29)) ([a56b082](https://github.com/plutocms/supabase-storage/commit/a56b08289b3e943e6945a61e62a0a59d27939c88))

## [0.4.1](https://github.com/plutocms/supabase-storage/compare/v0.4.0...v0.4.1) (2026-09-13)


### Bug Fixes

* **deps:** bump supabase to ^0.8.0 ([#27](https://github.com/plutocms/supabase-storage/issues/27)) ([c6290d3](https://github.com/plutocms/supabase-storage/commit/c6290d3e1b70d22741490a57710ccf3a070674e5))

## [0.4.0](https://github.com/plutocms/supabase-storage/compare/v0.3.0...v0.4.0) (2026-09-12)


### Features

* **permissions:** gate media on named capabilities ([#25](https://github.com/plutocms/supabase-storage/issues/25)) ([5b4ef29](https://github.com/plutocms/supabase-storage/commit/5b4ef291ac86ddf16e37d6fb6a9f6b2c568a2b29))

## [0.3.0](https://github.com/plutocms/supabase-storage/compare/v0.2.0...v0.3.0) (2026-09-12)


### Features

* **registry:** migrate to definePlutoExtension ([#23](https://github.com/plutocms/supabase-storage/issues/23)) ([cec161c](https://github.com/plutocms/supabase-storage/commit/cec161c95a79a42f64f1c7ceaea51fe20f189b83))

## [0.2.0](https://github.com/plutocms/supabase-storage/compare/v0.1.4...v0.2.0) (2026-09-12)


### Features

* **migrations:** convert to versioned db/migrations layout ([#20](https://github.com/plutocms/supabase-storage/issues/20)) ([90a745f](https://github.com/plutocms/supabase-storage/commit/90a745f7330fb66e3101786f8b2f84ccc9e3b5f2))


### Bug Fixes

* **deps:** move @nuxtjs/supabase to dependencies ([#16](https://github.com/plutocms/supabase-storage/issues/16)) ([a054c6d](https://github.com/plutocms/supabase-storage/commit/a054c6d4d83d9606d9e8bb6ccac7118e2e26d1bf))
* **deps:** require @plutocms/supabase 0.4.1 ([#22](https://github.com/plutocms/supabase-storage/issues/22)) ([85d8e93](https://github.com/plutocms/supabase-storage/commit/85d8e93c782cf4b79bd3e81e9aa2a953df20f2e3))
* **media:** decouple generic media from products, fix schema idempotency ([#19](https://github.com/plutocms/supabase-storage/issues/19)) ([b58761f](https://github.com/plutocms/supabase-storage/commit/b58761f3bcb6acd6d58e4f2cfe2bd5c189b0e696))
* **media:** require admin for media uploads and mutations ([#18](https://github.com/plutocms/supabase-storage/issues/18)) ([5731a34](https://github.com/plutocms/supabase-storage/commit/5731a3405901648fba9b234f30a2c15cc69f8085))

## [0.1.4](https://github.com/plutocms/supabase-storage/compare/v0.1.3...v0.1.4) (2026-09-10)


### Bug Fixes

* **deps:** require supabase 0.3.0 ([683fbce](https://github.com/plutocms/supabase-storage/commit/683fbce31b0e8f5881f311d3aeff83c345ca47f0))

## [0.1.3](https://github.com/plutocms/supabase-storage/compare/v0.1.2...v0.1.3) (2026-09-10)


### Bug Fixes

* **deps:** require supabase 0.2.2 ([546c7b3](https://github.com/plutocms/supabase-storage/commit/546c7b3814d93c1fcc53286a8edf577f48a59431))

## [0.1.2](https://github.com/plutocms/supabase-storage/compare/v0.1.1...v0.1.2) (2026-09-09)


### Bug Fixes

* **styles:** isolate storage layer sources ([#12](https://github.com/plutocms/supabase-storage/issues/12)) ([5e35b48](https://github.com/plutocms/supabase-storage/commit/5e35b48c3ede64fb39455a4902c80dca3ba79ff7))

## [0.1.1](https://github.com/plutocms/supabase-storage/compare/v0.1.0...v0.1.1) (2026-09-03)


### Bug Fixes

* never ship the generated shared/types/supabase.ts placeholder ([a210a53](https://github.com/plutocms/supabase-storage/commit/a210a536c7e7c937da6ceee63c7c226f05e96caf))

## [0.1.0](https://github.com/plutocms/supabase-storage/compare/v0.0.1-alpha.9...v0.1.0) (2026-09-03)


### Features

* add @vueuse/nuxt dependency to devDependencies ([7c93766](https://github.com/plutocms/supabase-storage/commit/7c937665a66860d2ade95cfc6f603b02fd674b59))
* add runtimeConfig for Supabase URL and key ([72db294](https://github.com/plutocms/supabase-storage/commit/72db294e3df46662b01f868d0bbae475c97b6fec))
* added UploadMedia component ([511086d](https://github.com/plutocms/supabase-storage/commit/511086d0f7f0a7d8e22ec7a6104fd2b12c125e9e))
* allow overriding the supabase and utils layer paths via env vars ([d29a12d](https://github.com/plutocms/supabase-storage/commit/d29a12dda640ece05f3c171f730caa07b88103b2))


### Bug Fixes

* add @plutocms/pluto to trustedDependencies in bun.lock and package.json ([64bbc38](https://github.com/plutocms/supabase-storage/commit/64bbc38df82fafd6877e7546e603b70edebfd14e))
* bump @plutocms/supabase to ^0.1.1 and re-enable typecheck ([714020b](https://github.com/plutocms/supabase-storage/commit/714020b61fc06033c53c2d4109613152e57b6e73))
* bump stale @plutocms/supabase and @plutocms/utils dependency ranges ([ba3ffd3](https://github.com/plutocms/supabase-storage/commit/ba3ffd32429f2e85bf61aa8ff17969975e20eba1))
* bump version to 0.0.1-alpha.2 in package.json ([664d71b](https://github.com/plutocms/supabase-storage/commit/664d71bedcb8d5a43b95cc7bd3e0fd6ee24b97ba))
* bump version to 0.0.1-alpha.3 ([e84657b](https://github.com/plutocms/supabase-storage/commit/e84657be582110fa1917f6122d0a9018a753cc76))
* changed wrong version to 0.0.1-alpha.2 ([d8c325e](https://github.com/plutocms/supabase-storage/commit/d8c325e363b34ce557b2194749be6c5d333ab95b))
* extend utils layer from NPM ([a3a6801](https://github.com/plutocms/supabase-storage/commit/a3a6801e7fe265828f225b293df200114442fd12))
* update @plutocms/supabase dependency to version 0.0.1-alpha.2 ([ae18764](https://github.com/plutocms/supabase-storage/commit/ae18764a257f70b2ab1844b194abe5e94145426f))
* update @plutocms/supabase dependency version to 0.0.1-alpha.3 ([7aa256e](https://github.com/plutocms/supabase-storage/commit/7aa256eefa15f51bc07788d0d788980721c96dcc))
* update @plutocms/supabase dependency version to 0.0.1-alpha.4 ([320ab37](https://github.com/plutocms/supabase-storage/commit/320ab37d32eff71638c35ba67054cffa9dc83538))
* update @plutocms/supabase dependency version to 0.0.1-alpha.5 ([250d224](https://github.com/plutocms/supabase-storage/commit/250d2242be5ddd5c5214521d90b71b811a5ec3bd))
* update @plutocms/supabase dependency version to 0.0.1-alpha.6 ([7984016](https://github.com/plutocms/supabase-storage/commit/7984016db7e73228d2178b04e35b48b553e466f1))
* update @plutocms/supabase dependency version to 0.0.1-alpha.7 ([b4d608c](https://github.com/plutocms/supabase-storage/commit/b4d608c58bf1392f0c66399fe4929d2798ef1cef))
* update @plutocms/supabase dependency version to 0.0.1-alpha.8 ([879af80](https://github.com/plutocms/supabase-storage/commit/879af806af1dfe70a15e43e28b4bb028046b1db3))
* update @plutocms/supabase dependency version to 0.0.1-alpha.9 ([b10004f](https://github.com/plutocms/supabase-storage/commit/b10004f0d043a520c511a6a94e491d0e978c4f2e))
* update @plutocms/utils dependency to version 0.0.1-alpha.4 ([5e4647e](https://github.com/plutocms/supabase-storage/commit/5e4647eda472a76b475a853aecbeb308ed7968b0))
* update dependency path for fileNameToKebabCase in new.post.ts ([fabb3ae](https://github.com/plutocms/supabase-storage/commit/fabb3aec1350b53b2132d6b9bb1d1fd627aa890f))
* update extends array in nuxt.config.ts to include supabase ([db22d44](https://github.com/plutocms/supabase-storage/commit/db22d4432c478bdb1679b2d96d79fd316c355a9c))
* update extends path in nuxt.config.ts ([f49f512](https://github.com/plutocms/supabase-storage/commit/f49f51249c9b3ca5f898c72200765bdf261361a6))
* update Nuxt configuration and package dependencies ([bead0a3](https://github.com/plutocms/supabase-storage/commit/bead0a3f20036a583f7c736c48175b787119b0b4))


### Miscellaneous Chores

* **ci:** add CI and release-please automated release pipeline ([7b09679](https://github.com/plutocms/supabase-storage/commit/7b096799172d9ffe6be046beb52e26f1d890ffdc))
