<script setup lang="ts">
import { ref, provide } from "vue";
import { RouterView } from "vue-router";
import HeaderView from "@/views/HeaderView.vue";

const isHeaderVisible = ref(true);
provide("headerVisible", isHeaderVisible);
</script>

<template>
  <div 
    class="flex min-h-screen flex-col bg-background relative group/layout transition-all duration-300"
    :class="{ 'header-hidden': !isHeaderVisible }"
  >
    <header
      class="sticky z-40 top-0 bg-background border-b border-border"
      :style="{
        transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: isHeaderVisible
          ? 'transform 100ms ease-out'
          : 'transform 300ms ease-in-out',
      }"
    >
      <div class="container flex h-14 max-w-screen-2xl items-center px-4">
        <HeaderView />
      </div>
    </header>
    <div class="flex-1 bg-background flex flex-col">
      <main class="relative lg:gap-10 px-4 flex flex-col flex-1">
        <RouterView />
      </main>
    </div>
    <footer
      class="bg-background/80 h-12 backdrop-blur-lg border-t border-border"
    >
      <div class="container flex items-center justify-between h-full px-4">
        <p class="text-sm text-gray-400">© 2026 - ngtuonghy</p>
      </div>
    </footer>
  </div>
</template>
