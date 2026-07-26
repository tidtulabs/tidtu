<script setup lang="ts">
import { h, ref, shallowRef, computed, watch, nextTick } from "vue";
import { useDebounceFn, useMediaQuery, useLocalStorage } from "@vueuse/core";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
} from "@tanstack/vue-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import type { ColumnDef, ColumnFiltersState, VisibilityState, FilterFn } from "@tanstack/vue-table";
import { useExamListData } from "../composables/useExamListData";
import { useExamListVisibility } from "../composables/useExamListVisibility";
import { useExamListTour } from "../composables/useExamListTour";
import type { ExamItem } from "../types/exam";
import { HttpError } from "../api/httpError";
import ExamListLoading from "./ExamListLoading.vue";
import ExamListToolbar from "./ExamListToolbar.vue";
import ExamListTable from "./ExamListTable.vue";
import ExamListPagination from "./ExamListPagination.vue";
import QuickBugButton from "@/components/QuickBugButton.vue";
import { useQuickBugReport } from "@/composables/useQuickBugReport";
import { toast } from "vue-sonner";
import { IconAlertTriangle } from "@tabler/icons-vue";
import { useTurnstile } from "@/composables/useTurnstile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

declare module "@tanstack/vue-table" {
  interface FilterFns {
    fuzzy: FilterFn<unknown>;
  }
  interface FilterMeta {
    itemRank: ReturnType<typeof rankItem>;
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

const isDesktop = useMediaQuery("(min-width: 768px)");

const currentUrl = window.location.href;

const newPaginationSeen = useLocalStorage("examlist:newPaginationSeen", false);

const {
  exams,
  isPending,
  isFetching,
  isError,
  error,
  fetchingFlag,
  downloadingRows,
  fetchMore,
  downloadFile,
  canSync,
} = useExamListData();

const {
  columnVisibility,
  showUploadDateOnMobile,
  showPageOnMobile,
  showPagination,
  toggleUploadDate,
  togglePage,
  togglePagination,
} = useExamListVisibility();

const { startTour, highlightNewPagination, hasSeen } = useExamListTour();

const tourAutoStarted = shallowRef(false);
watch(
  [isPending, exams],
  ([pending, data]) => {
    if (tourAutoStarted.value || pending || data.length === 0) return;
    tourAutoStarted.value = true;
    if (!hasSeen) {
      setTimeout(() => startTour(), 500);
    } else if (!newPaginationSeen.value) {
      setTimeout(() => highlightNewPagination(), 500);
    }
  },
  { immediate: true },
);

function onTogglePagination(checked: boolean) {
  togglePagination(checked);
  newPaginationSeen.value = true;
}

const globalFilter = shallowRef("");
const searchInput = shallowRef("");
const debouncedSearch = useDebounceFn((value: string) => {
  globalFilter.value = value;
}, 200);

function onSearchInput(value: string) {
  searchInput.value = value;
  debouncedSearch(value);
  table.setPageIndex(0);
}

const columnFilters = shallowRef<ColumnFiltersState>([]);

const columns: ColumnDef<ExamItem>[] = [
  {
    accessorKey: "examTitle",
    header: "Tên Đề Thi / Môn Học",
    cell: ({ row }) => {
      const text = row.getValue("examTitle");
      return h("div", { class: "flex gap-2 items-start min-w-0" }, [
        h(
          "span",
          { class: "font-medium text-foreground break-words min-w-0 flex-1" },
          text as string,
        ),
      ]);
    },
  },
  {
    id: "page",
    accessorFn: (row) => `${row.pagination}:${row.row} `,
    header: "Số trang",
    cell: ({ row }) =>
      h("div", { class: "text-foreground text-sm" }, row.getValue("page") as string),
  },
  {
    accessorKey: "uploadDate",
    header: "Ngày tải lên",
    cell: ({ row }) =>
      h(
        "div",
        { class: "capitalize text-foreground text-sm" },
        row.getValue("uploadDate") as string,
      ),
  },
  {
    accessorKey: "isNew",
  },
  {
    accessorKey: "examDetailsUrl",
    header: () => [
      h("span", { class: "lg:hidden" }, "T.Xuống"),
      h("span", { class: "hidden lg:inline" }, "Tải xuống"),
    ],
    cell: () => null,
  },
];

function valueUpdater<T>(updaterOrValue: T | ((prev: T) => T), currentValue: T): T {
  return typeof updaterOrValue === "function"
    ? (updaterOrValue as (prev: T) => T)(currentValue)
    : updaterOrValue;
}

const table = useVueTable({
  data: exams,
  columns,
  filterFns: { fuzzy: fuzzyFilter },
  globalFilterFn: "fuzzy",
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: {
    pagination: { pageSize: 10 },
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value = valueUpdater(updaterOrValue, columnFilters.value);
  },
  onGlobalFilterChange: (updaterOrValue) => {
    globalFilter.value = valueUpdater(updaterOrValue, globalFilter.value);
  },
  onColumnVisibilityChange: (updaterOrValue) => {
    columnVisibility.value = valueUpdater(updaterOrValue, columnVisibility.value);
  },
  state: {
    get columnFilters() {
      return columnFilters.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
  },
});

const filteredRowCount = computed(() => table.getFilteredRowModel().rows.length);

watch(
  [isDesktop, filteredRowCount, exams, showPagination],
  () => {
    if (!showPagination.value) {
      table.setPageSize(exams.value.length || 10);
    } else {
      const current = table.getState().pagination.pageSize;
      table.setPageSize(current === exams.value.length ? 10 : current);
    }
  },
  { immediate: true },
);
const bugReportContext = computed(() => {
  if (!canSync.value) {
    return {
      message: "Không thể kết nối đến máy chủ Đào tạo (DTU)",
      details:
        "Người dùng báo lỗi do gặp cảnh báo gián đoạn kết nối tới máy chủ Đào tạo (https://pdaotao.duytan.edu.vn/EXAM_LIST). Hệ thống đã tự chuyển sang dùng dữ liệu dự phòng.",
      page: currentUrl,
    };
  }
  const err = error.value;
  if (!err) return { message: "Không xác định lỗi", page: currentUrl };

  const message =
    err instanceof HttpError
      ? err.message
      : (err as any).message || "Có lỗi xảy ra khi tải dữ liệu";
  const details =
    err instanceof HttpError
      ? JSON.stringify(
          { status: err.status, typeError: err.typeError, message: err.message },
          null,
          2,
        )
      : (err as any).stack || String(err);

  return {
    message,
    details,
    page: currentUrl,
  };
});

const { report: sendBugReport, isSending: isSendingBug } = useQuickBugReport();
const isReportDialogOpen = ref(false);
const {
  turnstileContainer,
  turnstileToken,
  render: renderTurnstile,
  reset: resetTurnstile,
  remove: removeTurnstile,
} = useTurnstile();
const lastReportTime = useLocalStorage("examlist:lastReportTime", 0);

async function handleReportBug() {
  const now = Date.now();
  const COOLDOWN = 3600000; // 1 hour in ms
  if (now - lastReportTime.value < COOLDOWN) {
    const waitMin = Math.ceil((COOLDOWN - (now - lastReportTime.value)) / 60000);
    toast.warning("Bạn đã gửi báo cáo này rồi", {
      description: `Vui lòng thử lại sau ${waitMin} phút.`,
    });
    return;
  }

  isReportDialogOpen.value = true;
  await nextTick();
  renderTurnstile();
}

async function submitBugWithVerification() {
  if (!turnstileToken.value) {
    toast.warning("Xác minh chưa hoàn thành", {
      description: "Vui lòng hoàn thành xác minh bảo mật.",
    });
    return;
  }

  try {
    const context = {
      ...bugReportContext.value,
      turnstileToken: turnstileToken.value,
    };
    const success = await sendBugReport(context);
    if (success) {
      lastReportTime.value = Date.now();
      isReportDialogOpen.value = false;
      removeTurnstile();
    } else {
      resetTurnstile();
    }
  } catch {
    resetTurnstile();
  }
}
</script>

<template>
  <div v-if="isPending">
    <ExamListLoading />
  </div>
  <div v-else-if="isError" class="flex-1 flex flex-col items-center justify-center gap-4">
    <template v-if="(error as any)?.status === 429">
      <p class="text-destructive text-3xl">Quá nhiều yêu cầu</p>
      <p class="text-muted-foreground text-sm">Vui lòng thử lại sau!</p>
    </template>
    <template v-else>
      <p class="text-destructive text-3xl">Có lỗi xảy ra</p>
      <p class="text-muted-foreground text-sm">Vui lòng thử lại sau!</p>
      <QuickBugButton :context="bugReportContext" />
    </template>
  </div>
  <div v-else class="md:flex-1 flex flex-col gap-0 w-full min-h-0 min-w-0">
    <div
      v-if="!canSync"
      class="mx-2 mt-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-start sm:items-center gap-3 animate-pulse-subtle shrink-0"
    >
      <IconAlertTriangle
        class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0"
      />
      <div class="flex-1 leading-normal text-xs sm:text-sm">
        <span class="font-semibold block sm:inline">Máy chủ Đào tạo gián đoạn:</span>
        <span class="opacity-90">
          Đang hiển thị dữ liệu dự phòng. Bạn có thể xem trực tiếp tại trang
        </span>
        <a
          href="https://pdaotao.duytan.edu.vn/EXAM_LIST"
          target="_blank"
          rel="noopener noreferrer"
          class="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 font-semibold transition-colors whitespace-nowrap"
          >Đào tạo Duy Tân</a
        >
        <span class="opacity-90"> hoặc </span>
        <button
          type="button"
          @click="handleReportBug"
          :disabled="isSendingBug"
          class="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 font-semibold transition-colors whitespace-nowrap cursor-pointer"
        >
          {{ isSendingBug ? "đang gửi..." : "báo lỗi hệ thống" }}
        </button>
        <span class="opacity-90"> nếu app gặp sự cố.</span>
      </div>
    </div>

    <ExamListToolbar
      class="shrink-0"
      :search="searchInput"
      :is-fetching-all="fetchingFlag.isFetching"
      :pagination-count="exams[exams.length - 1]?.pagination || 0"
      :show-upload-date="columnVisibility.uploadDate !== false"
      :show-page="columnVisibility.page !== false"
      :show-pagination="showPagination"
      @update:search="onSearchInput"
      @toggle:load-all="fetchMore"
      @toggle:upload-date="toggleUploadDate"
      @toggle:page="togglePage"
      @toggle:pagination="onTogglePagination"
      @tour="startTour"
    />

    <div
      class="flex flex-col gap-4 w-full min-w-0 md:min-h-0 md:flex-1 px-2 pt-4 md:pt-1 pb-4 md:pb-6"
    >
      <ExamListTable
        :table="table"
        :is-fetching-all="fetchingFlag.isFetching"
        :downloading-rows="downloadingRows"
        :show-upload-date-on-mobile="showUploadDateOnMobile"
        :show-page-on-mobile="showPageOnMobile"
        @download="downloadFile"
      />
    </div>

    <ExamListPagination
      v-if="showPagination"
      class="sticky bottom-0 z-10 bg-background/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 shrink-0"
      :table="table"
      :show-pagination="showPagination"
    />
  </div>

  <Dialog v-model:open="isReportDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Xác minh bảo mật</DialogTitle>
        <DialogDescription>
          Vui lòng hoàn thành xác minh Cloudflare Turnstile để gửi báo cáo lỗi.
        </DialogDescription>
      </DialogHeader>
      <div class="flex items-center justify-center py-4">
        <div ref="turnstileContainer"></div>
      </div>
      <DialogFooter class="sm:justify-end gap-2">
        <Button type="button" variant="outline" @click="isReportDialogOpen = false"> Hủy </Button>
        <Button
          type="button"
          :disabled="!turnstileToken || isSendingBug"
          @click="submitBugWithVerification"
        >
          {{ isSendingBug ? "Đang gửi..." : "Xác nhận gửi" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
