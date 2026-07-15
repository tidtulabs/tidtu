<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { IconBook, IconMessageReport } from "@tabler/icons-vue";

const router = useRouter();

const navItems = [
  {
    title: "Danh sách thi",
    icon: IconBook,
    to: "/pdaotao/examlist",
  },
  {
    title: "Góp ý & Báo lỗi",
    icon: IconMessageReport,
    to: "/pdaotao/feedback",
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
          class="group flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200"
          :class="[
            router.currentRoute.value.path === item.to
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          ]"
        >
          <component
            :is="item.icon"
            class="w-5 h-5 shrink-0"
            :class="[
              router.currentRoute.value.path === item.to
                ? 'text-primary'
                : 'text-muted-foreground/80 group-hover:text-foreground'
            ]"
          />
          <span>{{ item.title }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
