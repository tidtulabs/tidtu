<script setup lang="ts">
import { useHead } from "@unhead/vue";
import DefaultLayout from "@/views/DefaultLayout.vue";
import { Toaster } from "./components/ui/sonner";

useHead({
  title: "TIDTU",
  htmlAttrs: { lang: "vi" },
  meta: [
    { name: "description", content: "Tra cứu và tải đề thi từ hệ thống P. Đào Tạo" },
    { name: "robots", content: "index, follow" },
    { property: "og:locale", content: "vi_VN" },
    { property: "og:site_name", content: "TIDTU" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://tidtu.pages.dev" },
    { property: "og:image", content: "https://tidtu.pages.dev/og-image.png" },
    { property: "og:image:width", content: "200" },
    { property: "og:image:height", content: "200" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:image", content: "https://tidtu.pages.dev/og-image.png" },
  ],
  link: [
    { rel: "icon", href: "/favicon.ico", sizes: "any" },
    { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    { rel: "icon", href: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    { rel: "canonical", href: "https://tidtu.pages.dev" },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "TIDTU",
        url: "https://tidtu.pages.dev",
        description: "Tra cứu và tải đề thi từ hệ thống P. Đào Tạo",
        inLanguage: "vi",
      }),
    },
  ],
})
</script>
<template>
  <DefaultLayout />
  <Toaster />
</template>
