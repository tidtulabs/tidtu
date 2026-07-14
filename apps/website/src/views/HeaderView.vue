<script setup lang="ts">
import Logo from "@/assets/icons/logo.svg";
import {
  IconSunHigh,
  IconBrandGithub,
  IconMoonStars,
  IconSunMoon,
  IconMenu2,
} from "@tabler/icons-vue";
import { useColorMode } from "@vueuse/core";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { RouterLink } from "vue-router";
import NavBarMobileView from "./NavBarMobileView.vue";
import { ref } from "vue";
const colorMode = useColorMode({
  emitAuto: true,
});

const toggleColorMode = () => {
  colorMode.store.value = colorMode.store.value === "dark" ? "light" : colorMode.store.value === "light" ? "auto" : "dark";
};

const open = ref(false);

</script>
<template>
  <div class="flex w-full justify-between items-center">
    <RouterLink to="/" class="flex items-center gap-1">
      <Logo />
      <h1 class="font-bold md:text-2xl text-xl">TIDTU</h1>
    </RouterLink>
    <div class="flex gap-2 items-center">
      <h3
        class="text-sm font-medium bg-clip-text text-transparent hidden sm:block bg-gradient-to-r from-rose-500 to-indigo-600"
      >
        by ngtuonghy
      </h3>
      <a href="https://github.com/tidtulabs" target="_blank">
        <button
          class="rounded-md gap-x-1.5 p-1.5 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <!--   <githubIcon class="w-6 h-6" /> -->
          <IconBrandGithub class="w-6 h-6" />
        </button>
      </a>
      <button
        class="rounded-md gap-x-1 p-1 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <IconSunMoon
          v-if="colorMode === 'auto'"
          class="w-6 h-6"
          @click="toggleColorMode"
        />

        <IconSunHigh
          v-if="colorMode === 'light'"
          class="w-6 h-6 animate-spin-slow"
          @click="toggleColorMode"
        />
        <IconMoonStars
          v-if="colorMode === 'dark'"
          class="w-6 h-6"
          @click="toggleColorMode"
        />
      </button>

      <div class="md:hidden flex items-center">
        <Sheet v-model:open="open">
          <SheetTrigger>
            <IconMenu2 class="w-6 h-6 hover:text-primary"
          /></SheetTrigger>
          <SheetContent>
            <!-- <SheetHeader> -->
            <!-- <SheetTitle>Are you absolutely sure?</SheetTitle> -->
            <!-- <SheetDescription> -->
            <!--   This action cannot be undone. This will permanently delete your -->
            <!--   account and remove your data from our servers. -->
            <!-- </SheetDescription> -->
            <NavBarMobileView :open="open" @update:open="open = $event" />
            <!-- </SheetHeader> -->
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </div>
</template>
