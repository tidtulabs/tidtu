<script setup>
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
</script>
<template>
  <div class="flex min-h-screen flex-col bg-background relative">
    <header
      class="sticky z-40 top-0 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div class="container flex h-14 max-w-screen-2xl items-center">
        <Header />
      </div>
    </header>
    <div class="flex-1 bg-background">
      <main class="relative lg:gap-10">
        <slot />
      </main>
    </div>
  </div>
</template>
