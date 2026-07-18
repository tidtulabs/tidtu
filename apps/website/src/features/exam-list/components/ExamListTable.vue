<script setup lang="ts">
import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { IconFileDownload, IconLoader3, IconSparkles } from "@tabler/icons-vue";
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
  download: [row: number, examDetailsUrl: string];
}>();

const isCompactTable = useMediaQuery("(max-width: 1023px)");

const allowCompactScroll = computed(() => {
  if (!isCompactTable.value) return false;
  return props.showUploadDateOnMobile === true || props.showPageOnMobile === true;
});

const rows = computed(() => props.table.getRowModel().rows);
</script>

<template>
  <div
    class="border-y border-x border-border rounded-lg bg-background flex flex-col md:flex-1 md:min-h-0 min-w-0"
    data-tour="exam-table"
  >
    <div class="min-w-0 flex-1 overflow-auto md:min-h-0">
      <Table
        :class="[
          allowCompactScroll ? 'min-w-max table-fixed lg:min-w-full' : 'min-w-full table-fixed',
        ]"
      >
        <TableHeader>
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
            <TableRow v-for="row in rows" :key="row.id" class="hover:bg-muted/50 transition-colors">
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
                    @click="emit('download', row.original.row, row.original.examDetailsUrl)"
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
                      class="w-4 h-4 text-yellow-500 animate-pulse stroke-1.5 shrink-0 mt-0.5"
                    />
                  </div>
                </template>
                <template v-else>
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                </template>
              </TableCell>
            </TableRow>

            <TableRow
              v-for="i in isFetchingAll ? 3 : 0"
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
</template>
