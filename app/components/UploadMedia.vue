<script setup lang="ts">
const { multiple = true } = defineProps<{
  /** Allow more than one selection in the Gallery tab. Default true. */
  multiple?: boolean
}>()

const emit = defineEmits<{
  insert: [value: EmitValue | EmitValue[] | null]
}>()

const isMediaModalOpen = defineModel<boolean>({
  default: false,
})

const { t, locale } = usePlutoI18n()
// Read at setup, while the Nuxt context exists.
const errorText = usePlutoErrorText()

const { mediaList, refreshMediaList, mediaStatus, getMediaUrl } = useMedia()

// UI convenience only, not the real security boundary: the server-side
// requireCapability('media:manage') call in server/api/_pluto/storage/media/index.post.ts,
// backed by RLS, is what actually blocks an upload.
const { can } = usePlutoPermissions()
const canManageMedia = computed(() => can('media:manage'))

const imageList = computed(() => {
  return mediaList.value?.data.filter((item) => !item.name?.endsWith('.glb'))
})

const threeDModelList = computed(() => {
  return mediaList.value?.data.filter((item) => item.name?.endsWith('.glb'))
})

function closeMediaModal() {
  isMediaModalOpen.value = false
}

const currentTab = ref<'0' | '1' | '2'>('0')

watch(currentTab, () => {
  resetAll()

  if (currentTab.value === '0') {
    refreshMediaList()
  }
})

const tabs = computed(() => [
  {
    label: t('supabase-storage.upload.tabs.gallery'),
    icon: 'lucide:blocks',
    slot: 'gallery',
  },
  {
    label: t('supabase-storage.upload.tabs.models'),
    icon: 'lucide:rotate-3d',
    slot: 'three-dimensional',
  },
  {
    label: t('supabase-storage.upload.tabs.upload'),
    icon: 'lucide:upload',
    slot: 'upload',
  },
])

interface Form {
  alt: string
}

const form = ref<Form>({
  alt: '',
})

// The same limits the upload route applies (server/api/_pluto/storage/media/index.post.ts),
// from the same runtime config, so the client rejects a file before it
// sends it, with the same rules.
const config = useRuntimeConfig()
const uploadLimits = computed<UploadLimits>(() => ({
  allowedMimeTypes:
    config.public.plutoStorage?.allowedMimeTypes ??
    'image/*,model/gltf-binary,application/octet-stream',
  maxBytes: config.public.plutoStorage?.maxUploadBytes ?? 10_485_760,
}))
const UPLOAD_ACCEPT = 'image/*,.glb'

const selectedFile = ref<File | null>(null)
/** Why the last file could not be uploaded, for the user. */
const uploadError = ref<string | null>(null)

/** The text of a file problem, in the admin language. */
function problemText(file: File): string | null {
  const problem = uploadProblem(file, uploadLimits.value, locale.value)
  return problem ? t(problem.key, problem.params) : null
}

watch(selectedFile, (file) => {
  if (!file) {
    return
  }
  const problem = problemText(file)
  uploadError.value = problem
  if (problem) {
    selectedFile.value = null
  }
})

// UFileUpload emits `reject` for dropped files that do not match `accept`.
function onReject(rejected: File[]) {
  uploadError.value = rejected
    .map(
      (file) =>
        problemText(file) ??
        t('supabase-storage.upload.problem.unsupportedType', {
          name: file.name,
        })
    )
    .join(' ')
}

/** The upload route's own message (413, 415, ...), in words for the user. */
function uploadErrorMessage(error: unknown): string {
  const failure = error as { statusCode?: number }
  if (failure?.statusCode === 403) {
    return t('supabase-storage.errors.noUploadPermission')
  }
  return errorText(error, 'supabase-storage.errors.uploadFailed')
}

const isUploaded = ref<boolean>(false)
const isUploading = ref<boolean>(false)

const uploadedMedia = ref<EmitValue | null>(null)

async function uploadMedia() {
  let response
  const file = selectedFile.value

  const formData = new FormData()

  if (!file) {
    return
  }

  formData.append('media_file', file)
  formData.append('name', file.name)
  formData.append('alt', form.value.alt)

  try {
    isUploading.value = true
    uploadError.value = null

    response = await $fetch('/api/_pluto/storage/media', {
      method: 'POST',
      body: formData,
    })

    if (response) {
      isUploaded.value = true

      uploadedMedia.value = response.data
    }
  } catch (error) {
    uploadError.value = uploadErrorMessage(error)
  } finally {
    isUploading.value = false
  }
}

function removeImage() {
  selectedFile.value = null
  uploadError.value = null
}

const selectedMedia = ref<number[]>([])

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

function selectSingleMedia(id: number) {
  selectedMedia.value = [id]
}

const transformedSelectedMedia = computed<EmitValue[]>(() => {
  const value = selectedMedia.value
    ?.map((item) => {
      if (!mediaList.value) {
        return undefined
      }

      return mediaList.value.data.find((dataItem) => item === dataItem.id)
    })
    .filter((item): item is EmitValue => item !== undefined)

  return value
})

// The list and upload routes now attach a computed public `url` to every
// row they return (see the media-library skill) — this type reflects that
// real response shape, not the bare table row.
type EmitValue = Database['public']['Tables']['media']['Row'] & { url: string }

function insertMedia() {
  if (currentTab.value === '0' || currentTab.value === '1') {
    if (!transformedSelectedMedia.value) {
      return
    }

    emit('insert', transformedSelectedMedia.value)
  } else {
    if (!uploadedMedia.value) {
      return
    }

    emit('insert', uploadedMedia.value)
  }

  resetAll()
}

function resetAll() {
  removeImage()
  isUploaded.value = false
  uploadedMedia.value = null

  selectedMedia.value = []
}

const isInsertButtonDisabled = computed(
  () =>
    (currentTab.value === '0' && selectedMedia.value.length === 0) ||
    (currentTab.value === '1' && selectedMedia.value.length === 0) ||
    (currentTab.value === '2' && isUploaded.value === false)
)
</script>

<template>
  <Modal v-model="isMediaModalOpen" :custom-size="1200" prevent-click-outside>
    <ModalHeader @close="closeMediaModal">
      {{ t('supabase-storage.upload.title') }}
    </ModalHeader>

    <ModalContent>
      <div>
        <UTabs v-model="currentTab" :items="tabs" class="w-full">
          <template #gallery>
            <div class="@container flex flex-col gap-y-6 pt-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-x-4">
                  <div>
                    <span v-if="selectedMedia.length === 0">
                      {{
                        t(
                          'supabase-storage.files.showing',
                          imageList?.length ?? 0
                        )
                      }}
                    </span>

                    <span v-else>
                      {{
                        t('supabase-storage.files.selected', {
                          selected: selectedMedia.length,
                          count: imageList?.length ?? 0,
                        })
                      }}
                    </span>
                  </div>

                  <div v-if="selectedMedia.length > 0">
                    <UButton
                      color="error"
                      variant="outline"
                      icon="lucide:x"
                      @click="selectedMedia = []"
                    >
                      {{ t('supabase-storage.upload.cancelSelection') }}
                    </UButton>
                  </div>
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

              <div
                class="grid grid-cols-2 gap-3 @sm:grid-cols-3 @md:grid-cols-4 @lg:grid-cols-5"
              >
                <div
                  v-for="file in imageList"
                  :key="file.id"
                  class="group/image-select relative aspect-square overflow-hidden rounded-2xl bg-elevated select-none hover:ring-1 hover:ring-accented has-aria-checked:ring-2 has-aria-checked:ring-primary"
                >
                  <label
                    class="absolute top-0 left-0 grid size-full items-start justify-end"
                  >
                    <div class="rounded-bl-2xl bg-default/80 p-2">
                      <UCheckbox
                        :model-value="isSelected(file.id)"
                        @change="
                          multiple
                            ? selectMedia(file.id)
                            : selectSingleMedia(file.id)
                        "
                      />
                    </div>
                  </label>

                  <img
                    v-if="file.name"
                    :src="getMediaUrl(file.name)"
                    :alt="file.alt || file.name"
                    class="size-full object-contain"
                  />
                </div>
              </div>
            </div>
          </template>

          <template #three-dimensional>
            <div class="@container flex flex-col gap-y-6 pt-6">
              <div class="flex items-center justify-between">
                <div>{{ t('supabase-storage.upload.threeDHint') }}</div>

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

              <div
                class="grid grid-cols-2 gap-3 @sm:grid-cols-3 @md:grid-cols-4 @lg:grid-cols-5"
              >
                <div
                  v-for="file in threeDModelList"
                  :key="file.id"
                  class="group/image-select relative aspect-square overflow-hidden rounded-2xl bg-elevated select-none hover:ring-1 hover:ring-accented has-aria-checked:ring-2 has-aria-checked:ring-primary"
                >
                  <label
                    class="absolute top-0 left-0 grid size-full items-start justify-end"
                  >
                    <div class="rounded-bl-2xl bg-default/80 p-2">
                      <UCheckbox
                        :model-value="isSelected(file.id)"
                        @change="selectSingleMedia(file.id)"
                      />
                    </div>
                  </label>

                  <div
                    class="pointer-events-none grid size-full place-items-center"
                  >
                    <div class="flex flex-col items-center gap-y-2">
                      <Icon
                        name="lucide:rotate-3d"
                        class="text-5xl opacity-20 transition-opacity group-hover/image-select:opacity-100"
                      />

                      <div class="text-muted text-sm">{{ file.name }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template #upload>
            <div class="flex flex-col gap-4 pt-6 lg:flex-row">
              <UFileUpload
                v-model="selectedFile"
                :accept="UPLOAD_ACCEPT"
                :disabled="isUploading || isUploaded"
                :description="
                  t('supabase-storage.upload.dropDescription', {
                    size: formatBytes(uploadLimits.maxBytes, locale),
                  })
                "
                :ui="{
                  fileLeadingAvatar:
                    'size-full rounded-lg bg-elevated [&>img]:object-contain',
                }"
                :label="t('supabase-storage.upload.dropLabel')"
                icon="lucide:image-up"
                class="min-h-72 grow"
                @reject="onReject"
              />

              <div class="flex w-full shrink-0 flex-col gap-y-4 lg:w-75">
                <UAlert
                  v-if="uploadError"
                  :description="uploadError"
                  :title="t('supabase-storage.upload.problemTitle')"
                  color="error"
                  variant="subtle"
                  icon="lucide:circle-alert"
                  close
                  @update:open="uploadError = null"
                />

                <div v-if="selectedFile" class="wrap-break-word">
                  {{ selectedFile.name }}
                </div>

                <div v-if="isUploaded && uploadedMedia" class="truncate">
                  <ULink :href="uploadedMedia.url" target="_blank">
                    {{ uploadedMedia.url }}
                  </ULink>
                </div>

                <div v-if="!isUploaded && selectedFile">
                  <UFormField :label="t('supabase-storage.upload.altLabel')">
                    <UInput
                      v-model="form.alt"
                      :placeholder="t('supabase-storage.upload.altPlaceholder')"
                    />
                  </UFormField>
                </div>

                <div class="flex items-center gap-x-2">
                  <UButton
                    v-if="!isUploaded && selectedFile"
                    color="error"
                    variant="outline"
                    icon="lucide:x"
                    @click="removeImage"
                  >
                    {{ t('pluto.common.cancel') }}
                  </UButton>

                  <UButton
                    v-if="!isUploaded && selectedFile && canManageMedia"
                    :loading="isUploading"
                    icon="lucide:upload"
                    loading-icon="lucide:loader-circle"
                    @click="uploadMedia"
                  >
                    {{
                      isUploading
                        ? t('supabase-storage.upload.uploading')
                        : t('supabase-storage.upload.upload')
                    }}
                  </UButton>
                </div>
              </div>
            </div>
          </template>
        </UTabs>
      </div>
    </ModalContent>

    <ModalFooter>
      <div class="flex items-center gap-x-3">
        <UButton variant="ghost" icon="lucide:x" @click="closeMediaModal">
          {{ t('pluto.common.close') }}
        </UButton>

        <UButton
          :disabled="isInsertButtonDisabled"
          variant="solid"
          icon="lucide:check"
          @click="insertMedia"
        >
          {{ t('supabase-storage.upload.insert') }}
          <span v-show="selectedMedia.length > 0">
            {{
              t('supabase-storage.upload.insertSelected', selectedMedia.length)
            }}
          </span>
        </UButton>
      </div>
    </ModalFooter>
  </Modal>
</template>
