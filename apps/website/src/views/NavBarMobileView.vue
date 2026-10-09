<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";

const route = useRoute();
const emit = defineEmits<{ "update:open": [value: boolean] }>();

function handleClick() {
  emit("update:open", false);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="space-y-1">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        @click="handleClick"
        :to="item.to"
        :class="
          cn(
            'flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
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
              'w-4 h-4 shrink-0 transition-colors duration-200',
              isNavItemActive(item, route.path) ? 'text-primary' : 'text-muted-foreground',
            )
          "
        />
        <span>{{ item.title }}</span>
      </RouterLink>
    </div>
  </div>
</template>
