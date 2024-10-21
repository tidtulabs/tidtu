<script setup lang="ts">
defineProps({ isShowHeader: { type: Boolean, default: true } });
</script>
<template>
  <div class="flex-1 flex flex-col gap-5">
    <div v-if="isShowHeader" class="relative w-full max-w-xl m-auto">
      <Skeleton class="w-full h-10" />
    </div>
    <Skeleton v-if="isShowHeader" class="w-11 h-7" />
    <div v-for="index in 7" :key="index" class="mb-1">
      <Skeleton class="h-12 w-full" />
    </div>
  </div>
</template>
