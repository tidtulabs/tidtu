<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import type { Table } from "@tanstack/vue-table";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-vue";
import type { ExamItem } from "../types/exam";

const props = defineProps<{
  table: Table<ExamItem>;
  showPagination?: boolean;
}>();

const isDesktop = useMediaQuery("(min-width: 768px)");

const pageIndex = computed(() => props.table.getState().pagination.pageIndex);
const pageCount = computed(() => Math.max(props.table.getPageCount(), 1));
const currentPage = computed(() => pageIndex.value + 1);

const inputValue = ref("");

watch(pageIndex, () => {
  inputValue.value = "";
});

function onInput(e: Event) {
  inputValue.value = (e.target as HTMLInputElement).value;
}

function goToPage() {
  const page = parseInt(inputValue.value, 10);
  if (page >= 1) {
    props.table.setPageIndex(Math.min(page, pageCount.value) - 1);
  }
  inputValue.value = "";
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    (e.target as HTMLInputElement).blur();
    goToPage();
  }
}

type PageEntry = { type: "page"; value: number; label: string } | { type: "ellipsis"; key: string };

const pages = computed<PageEntry[]>(() => {
  const total = pageCount.value;
  const current = currentPage.value;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      type: "page" as const,
      value: i + 1,
      label: String(i + 1),
    }));
  }

  const entries: PageEntry[] = [];
  const addPage = (value: number) => entries.push({ type: "page", value, label: String(value) });

  const left = Math.max(current - 1, 1);
  const right = Math.min(current + 1, total);

  addPage(1);
  if (left > 2) entries.push({ type: "ellipsis", key: "start" });
  for (let i = left; i <= right; i++) {
    if (i !== 1 && i !== total) addPage(i);
  }
  if (right < total - 1) entries.push({ type: "ellipsis", key: "end" });
  addPage(total);

  return entries;
});

function goTo(value: number) {
  props.table.setPageIndex(value - 1);
}
</script>

<template>
  <div
    v-if="showPagination && pageCount > 1"
    class="flex flex-wrap items-center justify-center gap-3 py-2 px-1"
  >
    <!-- Mobile: prev/next + editable page input -->
    <div class="flex md:hidden items-center justify-between w-full gap-0">
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-border text-foreground transition-colors hover:bg-muted active:bg-muted disabled:pointer-events-none disabled:border-muted disabled:text-muted-foreground/40 shrink-0 px-2.5"
        :disabled="currentPage <= 1"
        aria-label="Trang trước"
        @click="goTo(currentPage - 1)"
      >
        <IconChevronLeft class="h-4 w-4" />
        <span class="text-xs font-medium">Trước</span>
      </button>

      <div class="flex items-center gap-1 text-sm select-none">
        <input
          type="number"
          inputmode="numeric"
          min="1"
          :max="pageCount"
          :value="inputValue"
          :placeholder="String(currentPage)"
          aria-label="Nhập số trang"
          class="w-10 h-9 rounded-lg border border-border bg-background text-center text-sm font-semibold text-foreground tabular-nums outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          @input="onInput"
          @keydown="onKeydown"
          @blur="goToPage"
        />
        <span class="text-muted-foreground">/ {{ pageCount }}</span>
      </div>

      <button
        type="button"
        class="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-border text-foreground transition-colors hover:bg-muted active:bg-muted disabled:pointer-events-none disabled:border-muted disabled:text-muted-foreground/40 shrink-0 px-2.5"
        :disabled="currentPage >= pageCount"
        aria-label="Trang sau"
        @click="goTo(currentPage + 1)"
      >
        <span class="text-xs font-medium">Sau</span>
        <IconChevronRight class="h-4 w-4" />
      </button>
    </div>

    <!-- Desktop: full page numbers -->
    <div class="hidden md:flex items-center gap-1">
      <button
        type="button"
        class="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        :disabled="currentPage <= 1"
        aria-label="Trước"
        @click="goTo(currentPage - 1)"
      >
        <IconChevronLeft class="h-4 w-4" />
        <span class="hidden sm:inline">Trước</span>
      </button>

      <template v-for="(entry, idx) in pages" :key="idx">
        <span
          v-if="entry.type === 'ellipsis'"
          class="flex h-9 min-w-9 items-center justify-center px-1 text-sm text-muted-foreground"
          aria-hidden="true"
        >
          &#8230;
        </span>
        <button
          v-else
          type="button"
          class="inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors"
          :class="
            entry.value === currentPage
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground hover:bg-muted'
          "
          :aria-current="entry.value === currentPage ? 'page' : undefined"
          @click="goTo(entry.value)"
        >
          {{ entry.label }}
        </button>
      </template>

      <button
        type="button"
        class="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        :disabled="currentPage >= pageCount"
        aria-label="Sau"
        @click="goTo(currentPage + 1)"
      >
        <span class="hidden sm:inline">Sau</span>
        <IconChevronRight class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
