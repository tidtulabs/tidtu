<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps({
  error: Object as () => NuxtError,
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen text-center">
    <div>
      <h1
        class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary"
      >
        {{ error.statusCode }}
      </h1>
      <p class="mb-8 text-xl font-semibold text-gray-600 dark:text-gray-400">
        {{ error.message || "An error occurred" }}
      </p>
      <NuxtLink to="/">
        <Button> Back to home </Button>
      </NuxtLink>
    </div>
  </div>
</template>
