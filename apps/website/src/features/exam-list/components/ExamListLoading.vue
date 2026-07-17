<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
</script>
<template>
  <div class="flex-1 flex flex-col">
    <div
      class="sticky top-[56px] z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 px-0 w-full border-b border-border/60"
    >
      <Skeleton class="w-full md:max-w-md h-9" />
      <div class="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
        <div class="flex items-center gap-3">
          <Skeleton class="w-7 h-4" />
          <Skeleton class="w-20 h-3" />
          <Skeleton class="w-14 h-7 rounded-full" />
        </div>
        <Skeleton class="w-9 h-9 rounded-md" />
      </div>
    </div>
    <div class="pt-4 pb-4 md:pb-6 flex flex-col gap-6 w-full flex-1">
      <div v-for="index in 7" :key="index" class="mb-1">
        <Skeleton class="h-12 w-full" />
      </div>
    </div>
  </div>
</template>
