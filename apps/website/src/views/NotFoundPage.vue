<script setup lang="ts">
import { useHead } from "@unhead/vue";
import { Button } from "@/components/ui/button";
import { RouterLink } from "vue-router";

useHead({
  title: "404 | TIDTU",
  meta: [
    { name: "description", content: "Không tìm thấy trang này" },
    { name: "robots", content: "noindex" },
  ],
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen text-center">
    <div>
      <h1
        class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary"
      >
        404
      </h1>
      <p class="mb-8 text-xl font-semibold text-gray-600 dark:text-gray-400">
        Không tìm thấy trang này
      </p>
      <RouterLink to="/">
        <Button> Quay lại trang chủ </Button>
      </RouterLink>
    </div>
  </div>
</template>
