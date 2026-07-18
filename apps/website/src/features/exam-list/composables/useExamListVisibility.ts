import { ref, onMounted, onUnmounted } from "vue";
import { useLocalStorage, useMediaQuery } from "@vueuse/core";
import type { VisibilityState } from "@tanstack/vue-table";

const COMPACT_TABLE_QUERY = "(max-width: 1023px)";

export function useExamListVisibility() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const columnVisibility = ref<VisibilityState>({
    examTitle: true,
    examDetailsUrl: true,
    uploadDate: true,
    isNew: false,
    page: true,
  });

  const showUploadDateOnMobile = useLocalStorage(
    "examlist:showUploadDateOnMobile",
    isDesktop.value,
  );
  const showPageOnMobile = useLocalStorage("examlist:showPageOnMobile", isDesktop.value);
  const showPagination = useLocalStorage("examlist:showPagination", isDesktop.value);

  function toggleUploadDate(checked: boolean) {
    showUploadDateOnMobile.value = checked;
    columnVisibility.value = { ...columnVisibility.value, uploadDate: checked };
  }

  function togglePage(checked: boolean) {
    showPageOnMobile.value = checked;
    columnVisibility.value = { ...columnVisibility.value, page: checked };
  }

  function togglePagination(checked: boolean) {
    showPagination.value = checked;
  }

  function updateColumnVisibility() {
    const isCompact = window.matchMedia(COMPACT_TABLE_QUERY).matches;
    if (isCompact) {
      columnVisibility.value = {
        ...columnVisibility.value,
        uploadDate: showUploadDateOnMobile.value,
        page: showPageOnMobile.value,
      };
    } else {
      columnVisibility.value = {
        ...columnVisibility.value,
        uploadDate: true,
        page: true,
      };
    }
  }

  onMounted(() => {
    updateColumnVisibility();
    window.addEventListener("resize", updateColumnVisibility);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", updateColumnVisibility);
  });

  return {
    columnVisibility,
    showUploadDateOnMobile,
    showPageOnMobile,
    showPagination,
    toggleUploadDate,
    togglePage,
    togglePagination,
  };
}
