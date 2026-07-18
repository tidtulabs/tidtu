<script setup lang="ts">
import { RouterView } from "vue-router";
import HeaderView from "./HeaderView.vue";
import FooterView from "./FooterView.vue";
</script>

<template>
  <div class="flex min-h-dvh w-full min-w-0 flex-col bg-background">
    <div class="mx-auto w-full max-w-screen-2xl flex flex-col min-h-0 flex-1">
      <header class="sticky z-40 top-0 bg-background border-b border-border">
        <div class="flex h-14 w-full items-center px-2">
          <HeaderView />
        </div>
      </header>
      <div class="md:flex-1 md:min-h-0 min-w-0 flex flex-col">
        <main class="relative flex flex-col md:flex-1 md:min-h-0 min-w-0 w-full">
          <RouterView />
        </main>
      </div>
      <FooterView />
    </div>
  </div>
</template>
