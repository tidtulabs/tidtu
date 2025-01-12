<script setup lang="ts">
import Logo from "~/assets/icons/logo.svg";
useHead({
  title: "TIDTU",
  link: [
    {
      rel: "icon",
      type: "image/x-icon",
      href: "../logo.ico",
    },
  ],
});

// Trạng thái lưu số giây còn lại
const countdown = ref(5);
const url = "https://tidtu.pages.dev";

onMounted(() => {
  const interval = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearInterval(interval);
      navigateTo("https://example.com");
    }
  }, 1000);
});
</script>

<template>
  <div class="mt-16 text-center">
    <div class="flex flex-col items-center justify-center gap-2 md:flex-row">
      <Logo class="w-14 h-14" />
      <h1 class="text-2xl">
        TIDTU thay đổi tên miền sang:
        <a :href="url" class="text-blue-500">
          <strong >{{ url }}</strong>
        </a>
      </h1>
    </div>
    <p>
      Bạn sẽ được chuyển hướng sau: <strong class="text-red-500">{{ countdown }}</strong> giây
    </p>
  </div>
</template>

<style scoped>


</style>
