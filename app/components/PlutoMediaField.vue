<script setup lang="ts">
// The generic `media` content-field widget (see the media-library skill).
// Registered under bare `fieldType: 'media'` — core ships no widget for
// this field type on purpose, so this layer becomes the app-wide default.
//
// Stored value shape: a single field holds one media row id (`number`);
// a `multiple: true` field holds an array of ids (`number[]`).
//
// This is the compact picker: one square thumbnail (or a placeholder) with
// Change/Clear buttons in single mode, a thumbnail strip with a trailing
// Add tile in multiple mode — not the larger main-image-plus-strip layout
// `PlutoProductMediaField.vue` (in @plutocms/supabase-shop) uses.

/** One media row shape UploadMedia.vue's `insert` event and the `?ids=` list lookup both carry. */
interface MediaThumb {
  id: number
  name?: string | null
  alt?: string | null
  url: string
}

const props = defineProps<{
  field: PlutoMediaField
  modelValue: unknown
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | null]
}>()

const { t } = usePlutoI18n()

const isOpen = ref(false)

// Keyed by media id. Filled by the `?ids=` lookup on mount and by every
// insert, so a thumbnail renders immediately without waiting on a refetch.
const thumbs = ref<Map<number, MediaThumb>>(new Map())

const singleId = computed<number | null>(() => {
  if (props.field.multiple) {
    return null
  }
  return typeof props.modelValue === 'number' ? props.modelValue : null
})

const multipleIds = computed<number[]>(() => {
  if (!props.field.multiple) {
    return []
  }
  return Array.isArray(props.modelValue)
    ? props.modelValue.filter((id): id is number => typeof id === 'number')
    : []
})

async function resolveThumbnails(ids: number[]) {
  const missing = ids.filter((id) => !thumbs.value.has(id))

  if (missing.length === 0) {
    return
  }

  const { data } = await $fetch<{ data: MediaThumb[] }>('/api/media/list', {
    query: { ids: missing.join(',') },
  })

  for (const row of data) {
    thumbs.value.set(row.id, row)
  }
}

onMounted(() => {
  const ids = props.field.multiple
    ? multipleIds.value
    : singleId.value !== null
      ? [singleId.value]
      : []

  if (ids.length > 0) {
    resolveThumbnails(ids)
  }
})

function openPicker() {
  if (props.disabled) {
    return
  }
  isOpen.value = true
}

function handleInsert(value: unknown) {
  const rows = (
    Array.isArray(value) ? value : value ? [value] : []
  ) as MediaThumb[]

  for (const row of rows) {
    thumbs.value.set(row.id, row)
  }

  if (props.field.multiple) {
    emit('update:modelValue', [
      ...multipleIds.value,
      ...rows.map((row) => row.id),
    ])
  } else {
    emit('update:modelValue', rows[0]?.id ?? null)
  }

  isOpen.value = false
}

function clearSingle() {
  emit('update:modelValue', null)
}

function removeAt(id: number) {
  emit(
    'update:modelValue',
    multipleIds.value.filter((existing) => existing !== id)
  )
}
</script>

<template>
  <UFormField
    :label="field.label"
    :description="field.description"
    :required="field.required"
  >
    <div v-if="!field.multiple" class="flex items-center gap-3">
      <div
        class="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black/10"
      >
        <img
          v-if="singleId !== null && thumbs.get(singleId)?.url"
          :src="thumbs.get(singleId)!.url"
          :alt="thumbs.get(singleId)?.alt ?? ''"
          class="h-full w-full object-cover"
        />
        <div
          v-else
          class="grid h-full w-full place-items-center px-2 text-center text-xs text-gray-500"
        >
          {{ t('supabase-storage.field.selectMedia') }}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <UButton :disabled="disabled" size="sm" @click="openPicker">
          {{ singleId !== null ? t('supabase-storage.field.change') : t('supabase-storage.field.selectMedia') }}
        </UButton>

        <UButton
          v-if="singleId !== null"
          :disabled="disabled"
          size="sm"
          color="error"
          variant="outline"
          @click="clearSingle"
        >
          {{ t('supabase-storage.field.clear') }}
        </UButton>
      </div>
    </div>

    <div v-else class="flex flex-wrap items-center gap-2">
      <div
        v-for="id in multipleIds"
        :key="id"
        class="relative h-20 w-20 overflow-hidden rounded-xl bg-black/10"
      >
        <img
          v-if="thumbs.get(id)?.url"
          :src="thumbs.get(id)!.url"
          :alt="thumbs.get(id)?.alt ?? ''"
          class="h-full w-full object-cover"
        />

        <UButton
          :disabled="disabled"
          :aria-label="t('supabase-storage.field.removeMedia', { id })"
          class="absolute top-1 right-1"
          size="xs"
          color="error"
          variant="solid"
          icon="lucide:x"
          square
          @click="removeAt(id)"
        />
      </div>

      <button
        :disabled="disabled"
        :aria-label="t('supabase-storage.field.addMedia')"
        type="button"
        class="grid h-20 w-20 place-items-center rounded-xl bg-black/10 hover:bg-black/20"
        @click="openPicker"
      >
        <Icon name="lucide:plus" class="text-2xl" />
      </button>
    </div>

    <UploadMedia
      v-model="isOpen"
      :multiple="field.multiple"
      @insert="handleInsert"
    />
  </UFormField>
</template>
