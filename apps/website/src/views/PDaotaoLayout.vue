<script setup lang="ts">
import { RouterView } from "vue-router";
import NavBarView from "./NavBarView.vue";
</script>
<template>
  <div
    class="mx-auto flex-1 w-full min-h-0 min-w-0 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]"
  >
    <aside class="hidden md:block border-r border-border/60">
      <div class="sticky top-[57px] py-6 lg:py-8">
        <NavBarView />
      </div>
    </aside>
    <main class="min-h-0 min-w-0 w-full">
      <div class="w-full min-h-0 min-w-0 py-1 flex flex-col">
        <RouterView />
      </div>
    </main>
  </div>
</template>
