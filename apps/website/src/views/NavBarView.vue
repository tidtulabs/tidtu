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
</script>

<template>
  <div class="space-y-6">
    <div>
      <div class="space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group relative flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-300 ease-out"
          :class="
            isActive(item.to)
              ? 'bg-primary/10 text-primary font-semibold translate-x-0.5'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:translate-x-0.5'
          "
        >
          <component
            :is="item.icon"
            class="w-5 h-5 shrink-0 transition-colors duration-300 ease-out"
            :class="
              isActive(item.to)
                ? 'text-primary'
                : 'text-muted-foreground/80 group-hover:text-foreground'
            "
          />
          <span>{{ item.title }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
