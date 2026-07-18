<script setup lang="ts">
import { ref } from "vue";
import { useColorMode } from "@vueuse/core";
import { RouterLink } from "vue-router";
import {
  IconSunHigh,
  IconBrandGithub,
  IconMoonStars,
  IconSunMoon,
  IconMenu2,
} from "@tabler/icons-vue";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Logo from "@/assets/icons/logo.svg";
import NavBarMobileView from "./NavBarMobileView.vue";

const colorMode = useColorMode({ emitAuto: true });

const toggleColorMode = () => {
  const mode = colorMode.store.value;
  colorMode.store.value = mode === "dark" ? "light" : mode === "light" ? "auto" : "dark";
};

const open = ref(false);
</script>
<template>
  <div class="flex w-full justify-between items-center">
    <RouterLink to="/" class="flex items-center gap-1">
      <div>
        <Logo />
      </div>
      <h1 class="font-bold md:text-2xl text-xl leading-none">TIDTU</h1>
    </RouterLink>
    <div class="flex gap-2 items-center">
      <h3
        class="text-xs sm:text-sm font-medium bg-clip-text text-transparent hidden sm:block bg-gradient-to-r from-rose-500 to-indigo-600"
      >
        ngtuonghy
      </h3>
      <a
        href="https://github.com/tidtulabs"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        class="rounded-md inline-flex items-center p-1.5 text-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors duration-200"
      >
        <IconBrandGithub class="w-6 h-6" />
      </a>
      <button
        class="rounded-md gap-x-1 p-1 text-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors duration-200"
        aria-label="Chuyển đổi giao diện"
        @click="toggleColorMode"
      >
        <IconSunMoon v-if="colorMode === 'auto'" class="w-6 h-6" />
        <IconSunHigh v-else-if="colorMode === 'light'" class="w-6 h-6 animate-spin-slow" />
        <IconMoonStars v-else class="w-6 h-6" />
      </button>

      <div class="md:hidden flex items-center">
        <Sheet v-model:open="open">
          <SheetTrigger aria-label="Mở menu">
            <IconMenu2 class="w-6 h-6 hover:text-primary" />
          </SheetTrigger>
          <SheetContent class="px-0 gap-0" side="right">
            <div class="flex items-center gap-2 px-4 h-14 border-b border-border">
              <Logo class="w-7 h-7" />
              <span class="font-bold text-base">TIDTU</span>
            </div>
            <div class="flex-1 px-3 pt-3">
              <NavBarMobileView :open="open" @update:open="open = $event" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </div>
</template>
