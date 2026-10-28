<script setup lang="ts">
const { t } = usePlutoI18n()

useHead({
  title: () => t('supabase-storage.page.title'),
})

const { removeMedia } = useMedia()

// UI convenience only, not the real security boundary: the server-side
// requireCapability('media:delete') call in
// server/api/_pluto/storage/media/[id].delete.ts, backed by RLS, is what actually
// blocks a delete.
const { can } = usePlutoPermissions()
const canDeleteMedia = computed(() => can('media:delete'))

const selectedMedia = ref<number[]>([])

const {
  data: mediaList,
  refresh: refreshMediaList,
  status: mediaStatus,
} = useFetch('/api/_pluto/storage/media', {
  key: '/api/_pluto/storage/media',
})

function isSelected(id: number) {
  return selectedMedia.value.includes(id)
}

function selectMedia(id: number) {
  if (selectedMedia.value.includes(id)) {
    const index = selectedMedia.value.indexOf(id)

    selectedMedia.value.splice(index, 1)

    return
  }

  selectedMedia.value.push(id)
}

const toast = useToast()
const isDeleting = ref<number | null>(null)

async function deleteMedia(id: number) {
  isDeleting.value = id

  try {
    await removeMedia(id)

    selectedMedia.value = selectedMedia.value.filter(
      (selectedId) => selectedId !== id
    )

    await refreshMediaList()

    toast.add({
      title: t('supabase-storage.media.deleted'),
      description: t('supabase-storage.media.deletedDescription'),
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: t('supabase-storage.media.deleteFailed'),
      description: error instanceof Error ? error.message : t('supabase-storage.media.unknownError'),
      color: 'error',
    })
  } finally {
    isDeleting.value = null
  }
}
</script>

<template>
  <main>
    <AdminView>
      <div class="flex flex-col gap-y-4">
        <h1 class="text-4xl font-bold">{{ t('supabase-storage.page.title') }}</h1>

        <div class="flex items-end justify-between">
          <div>
            <span v-if="selectedMedia.length === 0">
              {{ t('supabase-storage.files.showing', mediaList?.data.length ?? 0) }}
            </span>

            <span v-else>
              {{
                t('supabase-storage.files.selected', {
                  selected: selectedMedia.length,
                  count: mediaList?.data.length ?? 0,
                })
              }}
            </span>
          </div>

          <div>
            <UButton
              :loading="mediaStatus === 'pending'"
              icon="lucide:refresh-cw"
              @click="refreshMediaList()"
            >
              {{ t('pluto.common.refresh') }}
            </UButton>
          </div>
        </div>

        <div class="grid grid-cols-5 gap-3">
          <div
            v-for="file in mediaList?.data"
            :key="file.id"
            class="group/image-select relative aspect-square overflow-hidden rounded-2xl bg-black select-none hover:ring-1 has-aria-checked:ring-2 has-aria-checked:ring-green-400"
          >
            <label
              class="absolute top-0 left-0 grid size-full items-start justify-end"
            >
              <div class="rounded-bl-2xl bg-black/80 p-2">
                <UCheckbox
                  :model-value="isSelected(file.id)"
                  @change="selectMedia(file.id)"
                />
              </div>
            </label>

            <img
              v-if="file.name"
              :src="file.url"
              :alt="file.alt || file.name"
              class="size-full object-contain"
            />

            <div v-if="canDeleteMedia" class="absolute right-0 bottom-0 p-2">
              <UButton
                :loading="isDeleting === file.id"
                :aria-label="t('supabase-storage.media.deleteNamed', { name: file.name ?? t('supabase-storage.media.fallbackName') })"
                color="error"
                variant="solid"
                icon="lucide:trash"
                size="xs"
                square
                @click="deleteMedia(file.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminView>
  </main>
</template>
