<script setup lang="ts">
import { h, shallowRef, computed, watch } from "vue";
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
import ExamListLoading from "./ExamListLoading.vue";
import ExamListToolbar from "./ExamListToolbar.vue";
import ExamListTable from "./ExamListTable.vue";
import ExamListPagination from "./ExamListPagination.vue";
import QuickBugButton from "@/components/QuickBugButton.vue";

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
      <QuickBugButton
        :context="{
          message: (error as any)?.message || 'Có lỗi xảy ra khi tải dữ liệu',
          page: currentUrl,
        }"
      />
    </template>
  </div>
  <div v-else class="md:flex-1 flex flex-col gap-0 w-full min-h-0 min-w-0">
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
</template>
