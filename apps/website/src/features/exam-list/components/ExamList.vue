<script setup lang="ts">
import { h, shallowRef } from "vue";
import { useDebounceFn } from "@vueuse/core";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
} from "@tanstack/vue-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import type { ColumnDef, ColumnFiltersState, VisibilityState, FilterFn } from "@tanstack/vue-table";
import { useExamListData } from "../composables/useExamListData";
import { useExamListVisibility } from "../composables/useExamListVisibility";
import type { ExamItem } from "../types/exam";
import ExamListLoading from "./ExamListLoading.vue";
import ExamListToolbar from "./ExamListToolbar.vue";
import ExamListTable from "./ExamListTable.vue";
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

const currentUrl = window.location.href;

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

const { columnVisibility, showUploadDateOnMobile, showPageOnMobile, toggleUploadDate, togglePage } =
  useExamListVisibility();

const globalFilter = shallowRef("");
const searchInput = shallowRef("");
const debouncedSearch = useDebounceFn((value: string) => {
  globalFilter.value = value;
}, 200);

function onSearchInput(value: string) {
  searchInput.value = value;
  debouncedSearch(value);
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
      h("span", { class: "md:hidden" }, "T.Xuống"),
      h("span", { class: "hidden md:inline" }, "Tải xuống"),
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
  <div v-else class="flex-1 flex flex-col gap-0 -mt-6 lg:-mt-8">
    <ExamListToolbar
      :search="searchInput"
      :is-fetching-all="fetchingFlag.isFetching"
      :pagination-count="exams[exams.length - 1]?.pagination || 0"
      :show-upload-date="columnVisibility.uploadDate !== false"
      :show-page="columnVisibility.page !== false"
      @update:search="onSearchInput"
      @toggle:load-all="fetchMore"
      @toggle:upload-date="toggleUploadDate"
      @toggle:page="togglePage"
    />

    <div class="pt-4 pb-4 md:pb-6 flex flex-col gap-6 w-full flex-1">
      <ExamListTable
        :table="table"
        :is-fetching-all="fetchingFlag.isFetching"
        :downloading-rows="downloadingRows"
        :show-upload-date-on-mobile="columnVisibility.uploadDate !== false"
        :show-page-on-mobile="columnVisibility.page !== false"
        @download="downloadFile"
      />
    </div>
  </div>
</template>
