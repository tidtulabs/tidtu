import { ref, onMounted, onUnmounted } from 'vue'
import type { VisibilityState } from '@tanstack/vue-table'

export function useExamListVisibility() {
  const columnVisibility = ref<VisibilityState>({
    examTitle: true,
    examDetailsUrl: true,
    uploadDate: true,
    isNew: false,
    page: true,
  })

  const showUploadDateOnMobile = ref(false)
  const showPageOnMobile = ref(false)

  function toggleUploadDate(checked: boolean) {
    showUploadDateOnMobile.value = checked
    columnVisibility.value = { ...columnVisibility.value, uploadDate: checked }
  }

  function togglePage(checked: boolean) {
    showPageOnMobile.value = checked
    columnVisibility.value = { ...columnVisibility.value, page: checked }
  }

  function updateColumnVisibility() {
    const isMd = window.matchMedia('(max-width: 768px)').matches
    if (isMd) {
      columnVisibility.value = {
        ...columnVisibility.value,
        uploadDate: showUploadDateOnMobile.value,
        page: showPageOnMobile.value,
      }
    } else {
      columnVisibility.value = {
        ...columnVisibility.value,
        uploadDate: true,
        page: true,
      }
    }
  }

  onMounted(() => {
    updateColumnVisibility()
    window.addEventListener('resize', updateColumnVisibility)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateColumnVisibility)
  })

  return {
    columnVisibility,
    showUploadDateOnMobile,
    showPageOnMobile,
    toggleUploadDate,
    togglePage,
  }
}
