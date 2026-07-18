<script setup lang="ts">
import { useHead } from "@unhead/vue";
import ExamList from "../components/ExamList.vue";

useHead({
  title: "Danh sách thi | TIDTU",
  meta: [
    { name: "description", content: "Tra cứu danh sách thi đại học Duy Tân (DTU)" },
    { property: "og:title", content: "Danh sách thi | TIDTU" },
    { property: "og:description", content: "Tra cứu danh sách thi đại học Duy Tân (DTU)" },
    { property: "og:url", content: "https://tidtu.pages.dev/pdaotao/examlist" },
  ],
  link: [{ rel: "canonical", href: "https://tidtu.pages.dev/pdaotao/examlist" }],
});
</script>
<template>
  <div class="flex md:flex-1 md:min-h-0 w-full flex-col md:overflow-hidden">
    <h1 class="sr-only">Danh sách thi</h1>
    <ExamList />
  </div>
</template>
