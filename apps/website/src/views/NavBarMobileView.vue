<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { IconBook } from "@tabler/icons-vue";
const router = useRouter();

const navItems = [
  {
    title: "Danh sách thi",
    icon: IconBook,
    to: "/pdaotao/examlist",
    active: router.currentRoute.value.path === "/pdaotao/examlist",
  },
];

const emit = defineEmits(['update:open']);

const handleClick = () => {
  emit('update:open', false);
};
</script>
<template>
  <div class="flex flex-col" v-for="item in navItems">
    <RouterLink
       @click="handleClick"
      :to="item.to"
      class="group flex items-center lg:text-sm lg:leading-6 mb-4 font-semibold dark:text-sky-400 border-5 border-l-primary"
    >
      <component
        :is="item.icon"
        :class="{
          'bg-primary text-white': router.currentRoute.value.path === item.to,
          'bg-inherit text-gray-600':
            router.currentRoute.value.path !== item.to,
        }"
        class="w-6 h-6 mr-4 rounded-md ring-1 ring-slate-900/5 shadow-sm group-hover:bg-primary group-hover:text-white ease-in-out"
      />
      <h2
        class="text-base text-gray-600"
        :class="{
          'text-primary': router.currentRoute.value.path === item.to,
          'text-gray-600': router.currentRoute.value.path !== item.to,
        }"
      >
        {{ item.title }}
      </h2>
    </RouterLink>
  </div>
</template>
