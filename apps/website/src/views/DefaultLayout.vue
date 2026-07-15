<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import HeaderView from "@/views/HeaderView.vue";

const isHeaderVisible = ref(true);
let lastScrollTop = 0;

const handleScroll = () => {
  // Only auto-hide header on mobile/tablet viewports (< 768px)
  if (window.innerWidth >= 768) {
    isHeaderVisible.value = true;
    return;
  }

  const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
  
  if (currentScrollTop > lastScrollTop && currentScrollTop > 80) {
    // Scrolling down & scrolled past header height
    isHeaderVisible.value = false;
  } else if (currentScrollTop < lastScrollTop) {
    // Scrolling up
    isHeaderVisible.value = true;
  }
  
  lastScrollTop = Math.max(0, currentScrollTop);
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div 
    class="flex min-h-screen flex-col bg-background relative group/layout transition-all duration-300"
    :class="{ 'header-hidden': !isHeaderVisible }"
  >
    <header
      class="sticky z-40 top-0 bg-background border-b border-border transition-transform duration-300 ease-in-out"
      :class="isHeaderVisible ? 'translate-y-0' : '-translate-y-full'"
    >
      <div class="container flex h-14 max-w-screen-2xl items-center px-4">
        <HeaderView />
      </div>
    </header>
    <div class="flex-1 bg-background">
      <main class="relative lg:gap-10 px-4">
        <RouterView />
      </main>
    </div>
    <footer
      class="bg-background/80 h-12 backdrop-blur-lg border-t border-border"
    >
      <div class="container flex items-center justify-between h-full px-4">
        <p class="text-sm text-gray-400">© 2026 - ngtuonghy</p>
      </div>
    </footer>
  </div>
</template>
