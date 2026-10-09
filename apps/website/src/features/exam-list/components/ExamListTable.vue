<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import {
  IconChevronRight,
  IconClock,
  IconFileDescription,
  IconFileDownload,
  IconLoader3,
  IconSparkles,
} from "@tabler/icons-vue";
import { FlexRender } from "@tanstack/vue-table";
import type { Table as TableType } from "@tanstack/vue-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExamItem } from "../types/exam";

const props = defineProps<{
  table: TableType<ExamItem>;
  isFetchingAll: boolean;
  downloadingRows: Set<number>;
  showUploadDateOnMobile?: boolean;
  showPageOnMobile?: boolean;
}>();

const emit = defineEmits<{
  download: [exam: ExamItem];
}>();

const isCompactTable = useMediaQuery("(max-width: 1023px)");

const allowCompactScroll = computed(() => {
  if (!isCompactTable.value) return false;
  return props.showUploadDateOnMobile === true || props.showPageOnMobile === true;
});

const rows = computed(() => props.table.getRowModel().rows);

const expandedRows = ref<Set<string>>(new Set());

function toggleRowExpand(rowId: string) {
  const next = new Set(expandedRows.value);
  if (next.has(rowId)) {
    next.delete(rowId);
  } else {
    next.add(rowId);
  }
  expandedRows.value = next;
}

function hasOutsideDetails(row: any) {
  const showDate = props.showUploadDateOnMobile === true && !!row.original.uploadDate;
  const showPage = props.showPageOnMobile === true && !!row.original.pagination;
  return showDate || showPage;
}

function hasHiddenDetails(row: any) {
  const hasHiddenDate = props.showUploadDateOnMobile !== true && !!row.original.uploadDate;
  const hasHiddenPage = props.showPageOnMobile !== true && !!row.original.pagination;
  return hasHiddenDate || hasHiddenPage;
}

function isRowExpanded(row: any) {
  return hasHiddenDetails(row) && expandedRows.value.has(row.id);
}

watch(
  () => [props.showUploadDateOnMobile, props.showPageOnMobile],
  () => {
    expandedRows.value.clear();
  },
);
</script>

<template>
  <div class="w-full flex flex-col md:flex-1 md:min-h-0 min-w-0" data-tour="exam-table">
    <div class="md:hidden flex flex-col w-full divide-y divide-border/60">
      <template v-if="rows.length || isFetchingAll">
        <div
          v-for="row in rows"
          :key="row.id"
          :class="[
            'py-2.5 px-2 flex flex-col gap-1 transition-colors select-none',
            isRowExpanded(row) ? 'bg-muted/20' : '',
            hasHiddenDetails(row) ? 'cursor-pointer hover:bg-muted/30' : '',
          ]"
          @click="hasHiddenDetails(row) && toggleRowExpand(row.id)"
        >
          <div class="flex items-center justify-between gap-3 min-w-0 w-full">
            <span
              class="font-medium text-foreground text-sm leading-snug break-words flex-1 min-w-0"
              :title="row.original.examTitle"
            >
              {{ row.original.examTitle }}
            </span>

            <div class="flex items-center gap-2 shrink-0">
              <div class="w-5 flex justify-center shrink-0">
                <IconSparkles
                  v-if="row.original.isNew"
                  class="w-4 h-4 text-amber-500 stroke-1.5 animate-pulse"
                  title="Bài thi mới cập nhật"
                />
              </div>

              <div
                role="button"
                :aria-label="`Tải xuống ${row.original.examTitle}`"
                title="Tải xuống đề thi"
                @click.stop="emit('download', row.original)"
                class="p-1 rounded-md text-primary/80 hover:text-primary transition-colors cursor-pointer shrink-0"
              >
                <IconLoader3
                  v-if="downloadingRows.has(row.original.row)"
                  class="w-6 h-6 mx-auto text-primary/80 animate-spin-fast pointer-events-none"
                />
                <IconFileDownload
                  v-else
                  class="w-6 h-6 stroke-[1.25] cursor-pointer text-primary/80 hover:text-primary hover:scale-110 transition-transform ease-in-out"
                />
              </div>

              <div
                v-if="hasHiddenDetails(row)"
                class="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0"
              >
                <IconChevronRight
                  class="w-4 h-4 transition-transform duration-200"
                  :class="{ 'rotate-90': isRowExpanded(row) }"
                />
              </div>
            </div>
          </div>

          <div
            v-if="hasOutsideDetails(row) && !isRowExpanded(row)"
            class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground font-medium pt-0.5"
          >
            <div
              v-if="showUploadDateOnMobile === true && row.original.uploadDate"
              class="inline-flex items-center gap-1.5 leading-none"
            >
              <IconClock class="w-3.5 h-3.5 text-primary/85 shrink-0" />
              <span class="leading-none text-muted-foreground">{{ row.original.uploadDate }}</span>
            </div>

            <div
              v-if="
                showUploadDateOnMobile === true &&
                showPageOnMobile === true &&
                row.original.uploadDate &&
                row.original.pagination
              "
              class="h-3 w-px bg-border/70 shrink-0 self-center"
            ></div>

            <div
              v-if="showPageOnMobile === true && row.original.pagination"
              class="inline-flex items-center gap-1.5 leading-none"
            >
              <IconFileDescription class="w-3.5 h-3.5 text-primary/85 shrink-0" />
              <span class="leading-none text-muted-foreground"
                >Trang {{ row.original.pagination }}:{{ row.original.row }}</span
              >
            </div>
          </div>

          <div
            v-if="isRowExpanded(row)"
            class="w-full mt-1.5 p-2.5 rounded-xl bg-muted/40 border border-border/50 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs transition-all duration-200"
          >
            <div v-if="row.original.uploadDate" class="flex items-center gap-2 min-w-0">
              <div
                class="w-6.5 h-6.5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
              >
                <IconClock class="w-3.5 h-3.5 text-primary" />
              </div>
              <div class="flex flex-col leading-none justify-center">
                <span class="text-[10px] text-muted-foreground font-normal">Ngày tải lên</span>
                <span class="font-medium text-foreground text-xs mt-1">{{
                  row.original.uploadDate
                }}</span>
              </div>
            </div>

            <div
              v-if="row.original.uploadDate && row.original.pagination"
              class="h-6 w-px bg-border/60 hidden sm:block"
            ></div>

            <div v-if="row.original.pagination" class="flex items-center gap-2 min-w-0">
              <div
                class="w-6.5 h-6.5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
              >
                <IconFileDescription class="w-3.5 h-3.5 text-primary" />
              </div>
              <div class="flex flex-col leading-none justify-center">
                <span class="text-[10px] text-muted-foreground font-normal">Số trang</span>
                <span class="font-medium text-foreground text-xs mt-1"
                  >Trang {{ row.original.pagination }}:{{ row.original.row }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <template v-if="isFetchingAll">
          <div
            v-for="i in 3"
            :key="'skeleton-mobile-' + i"
            class="py-3 px-1 flex items-center justify-between gap-2.5"
          >
            <Skeleton class="h-4 w-3/4 rounded" />
            <Skeleton class="h-6 w-12 rounded" />
          </div>
        </template>
      </template>

      <template v-else>
        <div class="p-8 text-center text-muted-foreground text-sm">Không có dữ liệu đề thi</div>
      </template>
    </div>

    <div
      class="hidden md:flex border-y border-x border-border rounded-lg bg-background flex-col w-full min-w-0"
    >
      <div class="min-w-0 w-full">
        <Table
          :class="[
            allowCompactScroll ? 'min-w-max table-fixed lg:min-w-full' : 'min-w-full table-fixed',
          ]"
        >
          <TableHeader class="border-b border-border/60 bg-muted/30">
            <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <TableHead
                v-for="header in headerGroup.headers"
                :key="header.id"
                :class="[
                  'font-bold text-primary py-2.5 px-2 sm:px-4 text-xs sm:text-sm uppercase tracking-wide',
                  header.column.id === 'examDetailsUrl'
                    ? 'text-center w-20 md:w-24 whitespace-nowrap'
                    : header.column.id === 'examTitle'
                      ? allowCompactScroll
                        ? 'text-left min-w-0 whitespace-normal lg:min-w-0 lg:w-full'
                        : 'text-left w-full min-w-0 whitespace-normal'
                      : header.column.id === 'page'
                        ? 'text-left w-20 lg:w-28 whitespace-nowrap'
                        : header.column.id === 'uploadDate'
                          ? 'text-left w-28 lg:w-36 whitespace-nowrap'
                          : 'text-left whitespace-nowrap',
                ]"
              >
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody class="text-sm sm:text-base">
            <template v-if="rows.length || isFetchingAll">
              <TableRow
                v-for="row in rows"
                :key="row.id"
                class="hover:bg-muted/50 transition-colors"
              >
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :class="[
                    'py-2 px-2 sm:px-4 min-w-0 font-medium text-foreground',
                    cell.column.id === 'examTitle'
                      ? allowCompactScroll
                        ? 'min-w-0 whitespace-normal break-words lg:min-w-0 lg:w-full'
                        : 'w-full min-w-0 whitespace-normal break-words'
                      : '',
                    cell.column.id === 'page' ? 'w-20 lg:w-28 whitespace-nowrap' : '',
                    cell.column.id === 'uploadDate' ? 'w-28 lg:w-36 whitespace-nowrap' : '',
                    cell.column.id === 'examDetailsUrl' ? 'w-20 md:w-24 text-center' : '',
                  ]"
                >
                  <template v-if="cell.column.id === 'examDetailsUrl'">
                    <div
                      role="button"
                      :aria-label="`Tải xuống ${row.original.examTitle}`"
                      title="Tải xuống đề thi"
                      @click="emit('download', row.original)"
                    >
                      <IconLoader3
                        v-if="downloadingRows.has(row.original.row)"
                        class="w-7 h-7 mx-auto text-primary/80 animate-spin-fast pointer-events-none"
                      />
                      <IconFileDownload
                        v-else
                        class="w-7 h-7 stroke-[1.25] cursor-pointer mx-auto text-primary/80 hover:text-primary hover:scale-110 transition-transform ease-in-out"
                      />
                    </div>
                  </template>
                  <template v-else-if="cell.column.id === 'examTitle'">
                    <div class="flex gap-2 items-start min-w-0">
                      <span
                        class="font-medium text-foreground break-words md:truncate min-w-0 flex-1"
                        :title="cell.getValue() as string"
                      >
                        {{ cell.getValue() as string }}
                      </span>
                      <IconSparkles
                        v-if="row.original.isNew"
                        class="w-4 h-4 text-amber-500 stroke-1.5 animate-pulse shrink-0 mt-0.5"
                        title="Bài thi mới cập nhật"
                      />
                    </div>
                  </template>
                  <template v-else>
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                  </template>
                </TableCell>
              </TableRow>

              <TableRow
                v-if="isFetchingAll"
                v-for="i in 3"
                :key="'skeleton-' + i"
                class="hover:bg-transparent"
              >
                <TableCell
                  v-for="column in table.getVisibleFlatColumns()"
                  :key="column.id"
                  :class="[
                    'py-2.5 px-2 sm:px-4 min-w-0',
                    column.id === 'examTitle'
                      ? allowCompactScroll
                        ? 'min-w-0 lg:min-w-0 lg:w-full'
                        : 'w-full min-w-0'
                      : '',
                    column.id === 'page' ? 'w-20 lg:w-28 whitespace-nowrap' : '',
                    column.id === 'uploadDate' ? 'w-28 lg:w-36 whitespace-nowrap' : '',
                    column.id === 'examDetailsUrl' ? 'w-20 md:w-24 text-center' : '',
                  ]"
                >
                  <Skeleton
                    :class="[
                      'h-4 animate-pulse',
                      column.id === 'examTitle' ? 'w-3/4' : 'w-12',
                      column.id === 'examDetailsUrl' ? 'h-8 w-8 rounded-md mx-auto' : 'rounded',
                    ]"
                  />
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow>
                <TableCell
                  :colspan="table.getVisibleFlatColumns().length || table.getAllColumns().length"
                  class="h-32 text-center text-muted-foreground"
                >
                  Không có dữ liệu đề thi
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
