<script setup lang="ts">
import EvaluationIcon from "@/assets/icons/evaluation.svg";
import FindExamListIcon from "@/assets/icons/find-exam-list.svg";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RouterLink } from "vue-router";
import { Button } from "@/components/ui/button";

const cards = [
  {
    title: FindExamListIcon,
    description: "Tìm Nhanh danh sách thi đại học Duy Tân (DTU)",
    content:
      "Một công cụ giúp bạn tìm kiếm, tải xuống danh sách thi phòng đào tạo đại học Duy Tân nhanh chóng và dễ dàng",
    footer: "Truy cập ngay",
    href: "/pdaotao/examlist",
  },
  {
    title: EvaluationIcon,
    description: "Đánh giá nhanh giảng viên đại học Duy Tân (DTU)",
    content:
      "Một tiện ích mở rộng trên chrome giúp bạn đánh giá nhanh chóng, dễ dàng giảng viên đại học Duy Tân (DTU)",
    footer: "Truy cập ngay",
    href: "https://chromewebstore.google.com/detail/%C4%91%C3%A1nh-gi%C3%A1-nhanh-dtu/cjdehokiceofnofkeelodgijlgjeimak",
  },
];
</script>

<template>
  <div class="flex flex-col container lg:py-8 py-6">
    <div>
      <h1
        class="lg:text-5xl md:text-4xl text-3xl text-primary text-center font-bold tracking-tight"
      >
        Tiện ích DTU
      </h1>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 xl:grid-cols-2 lg:pt-8 pt-6">
      <Card
        class="flex-1  border hover:border-primary transition-transform duration-300 group"
        v-for="(card, index) in cards"
        :key="index"
      >
        <CardHeader>
          <CardTitle>
            <component :is="card.title" class="w-10 h-10 text-primary group-hover:scale-125 transition-transform duration-300" />
          </CardTitle>
          <CardDescription
            class="font-semibold text-lg text-black dark:text-white line-clamp-3"
          >
            {{ card.description }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {{ card.content }}
        </CardContent>
        <component
          :is="card.href.startsWith('http') ? 'a' : RouterLink"
          :target="card.href.startsWith('http') ? '_blank' : '_self'"
          :href="card.href"
          :to="card.href"
          rel="noopener noreferrer"
        >
          <CardFooter>
            <Button>
              {{ card.footer }}
            </Button>
          </CardFooter>
        </component>
      </Card>
    </div>
  </div>
</template>
