<script setup lang="ts">
import { RouterView } from "vue-router";
import NavBarView from "./NavBarView.vue";
</script>
<template>
  <div
    class="container flex-1 md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 mx-auto"
  >
    <aside class="hidden md:block border-r border-border/60">
      <div class="sticky top-[57px] py-6 lg:py-8 pr-5">
        <NavBarView />
      </div>
    </aside>
    <main class="min-w-0">
      <div class="w-full lg:py-8 py-6 pb-2">
        <RouterView />
      </div>
    </main>
  </div>
</template>
