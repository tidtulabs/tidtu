import { ref, shallowRef } from 'vue'
import type { SelectedImage } from '../types/feedback'

export const MAX_IMAGES = 1
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export function useFeedbackImages() {
  const images = ref<SelectedImage[]>([])
  const previewUrl = shallowRef<string | null>(null)
  const imageError = shallowRef('')

  function addFiles(fileList: FileList) {
    imageError.value = ''
    const remaining = MAX_IMAGES - images.value.length
    const newFiles = Array.from(fileList).slice(0, remaining)

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        imageError.value = 'Chỉ chấp nhận ảnh PNG, JPEG, WebP hoặc GIF.'
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        imageError.value = `"${file.name}" vượt quá 10MB.`
        continue
      }
      images.value.push({ file, url: URL.createObjectURL(file) })
    }
  }

  function removeImage(index: number) {
    const img = images.value[index]
    URL.revokeObjectURL(img.url)
    images.value.splice(index, 1)
    imageError.value = ''
  }

  function openPreview(url: string) {
    previewUrl.value = url
  }

  function closePreview() {
    previewUrl.value = null
  }

  function revokeAll() {
    for (const img of images.value) {
      URL.revokeObjectURL(img.url)
    }
  }

  return {
    images,
    previewUrl,
    imageError,
    addFiles,
    removeImage,
    openPreview,
    closePreview,
    revokeAll,
  }
}
