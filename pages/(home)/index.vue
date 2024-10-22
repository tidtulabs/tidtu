<script setup lang="ts">
useHead({
  meta: [],
});
import { DocumentMagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import evaluation from "~/assets/icons/evaluation.svg";

const cards = ref([
  {
    title: DocumentMagnifyingGlassIcon,
    description: "Tìm Nhanh danh sách thi",
    content:
      "Một công cụ giúp bạn tìm kiếm, tải xuống danh sách thi nhanh chóng và dễ dàng",
    footer: "Truy cập ngay",
    href: "/pdaotao/examlist",
  },
  {
    title: evaluation,
    description: "Đánh giá nhanh DTU",
    content:
      "Một tiện ích mở rộng trên chrome giúp bạn đánh giá nhanh giảng viên trường DTU",
    footer: "Truy cập ngay",
    href: "https://chromewebstore.google.com/detail/%C4%91%C3%A1nh-gi%C3%A1-nhanh-dtu/cjdehokiceofnofkeelodgijlgjeimak",
  },
]);
</script>
<template>
  <div class="flex flex-col container">
    <div class="m-14">
      <h1
        class="lg:text-5xl md:text-4xl text-3xl text-primary text-center font-bold tracking-tight"
      >
        Tiện ích DTU
      </h1>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 xl:grid-cols-2">
      <Card
        class="flex-1 hover:border-primary border"
        v-for="(card, index) in cards"
        :key="index"
      >
        <CardHeader>
          <CardTitle>
            <component :is="card.title" class="w-10 h-10 text-primary" />
          </CardTitle>
          <CardDescription
            class="font-semibold text-lg text-black dark:text-white line-clamp-3"
            >{{ card.description }}</CardDescription
          >
        </CardHeader>
        <CardContent> {{ card.content }} </CardContent>
        <NuxtLink :to="card.href">
          <CardFooter>
            <Button>
              {{ card.footer }}
            </Button>
          </CardFooter>
        </NuxtLink>
      </Card>
    </div>
  </div>
</template>
