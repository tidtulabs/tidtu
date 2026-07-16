<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { computed } from "vue";
import { IconBook, IconMessageReport } from "@tabler/icons-vue";

const router = useRouter();
const currentPath = computed(() => router.currentRoute.value.path);

function isActive(path: string): boolean {
  return currentPath.value === path;
}

const navItems = [
  {
    title: "Danh sách thi",
    icon: IconBook,
    to: "/pdaotao/danh-sach-thi",
  },
  {
    title: "Góp ý & Báo lỗi",
    icon: IconMessageReport,
    to: "/pdaotao/gop-y-bao-loi",
  },
];

const emit = defineEmits<{ 'update:open': [value: boolean] }>();

function handleClick() {
  emit('update:open', false);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        @click="handleClick"
        :to="item.to"
        class="flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
        :class="isActive(item.to) ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'"
      >
        <component
          :is="item.icon"
          class="w-4 h-4 shrink-0"
          :class="isActive(item.to) ? 'text-primary' : 'text-muted-foreground'"
        />
        <span>{{ item.title }}</span>
      </RouterLink>
    </div>
  </div>
</template>
