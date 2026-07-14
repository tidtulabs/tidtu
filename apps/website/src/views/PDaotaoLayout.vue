<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBarView from './NavBarView.vue';

</script>
<template>
  <div
    class="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10"
  >
    <aside
      class="fixed top-14 z-30 -ml-2 hidden w-full shrink-0 md:sticky md:block overflow-y-auto border-r border-border lg:py-8 py-6 h-[calc(100vh-3.6rem)]"
    >
      <div class="relative overflow-hidden h-full">
        <NavBarView />
      </div>
    </aside>
    <main>
      <div class="mx-auto w-full min-w-0 lg:py-8 py-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>
