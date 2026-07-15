<script setup lang="ts">
import { RouterView } from "vue-router";
import HeaderView from "@/views/HeaderView.vue";
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background">
    <header class="sticky z-40 top-0 bg-background border-b border-border">
      <div class="container flex h-14 max-w-screen-2xl items-center px-4">
        <HeaderView />
      </div>
    </header>
    <div class="flex-1 bg-background flex flex-col">
      <main class="relative lg:gap-10 px-4 flex flex-col flex-1">
        <RouterView />
      </main>
    </div>
    <footer class="bg-background/80 h-12 backdrop-blur-lg border-t border-border">
      <div class="container flex items-center justify-between h-full px-4">
        <p class="text-sm text-gray-400">© 2026 - ngtuonghy</p>
      </div>
    </footer>
  </div>
</template>
