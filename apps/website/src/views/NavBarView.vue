<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";

const route = useRoute();
</script>

<template>
  <nav class="flex flex-col gap-1.5 px-2">
    <RouterLink
      v-for="item in NAV_ITEMS"
      :key="item.to"
      :to="item.to"
      :class="
        cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors duration-200 w-full',
          isNavItemActive(item, route.path)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )
      "
    >
      <component
        :is="item.icon"
        :class="
          cn(
            'w-5 h-5 shrink-0 transition-colors duration-200',
            isNavItemActive(item, route.path)
              ? 'text-primary'
              : 'text-muted-foreground/80 group-hover:text-foreground',
          )
        "
      />
      <span>{{ item.title }}</span>
    </RouterLink>
  </nav>
</template>
