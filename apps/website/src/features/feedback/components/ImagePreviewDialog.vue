<script setup lang="ts">
import { IconX } from "@tabler/icons-vue";
import { Button } from "@/components/ui/button";

defineProps<{ url: string | null }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div v-if="url" class="fixed inset-0 z-50 bg-black/80 flex flex-col" @click="emit('close')">
      <div class="flex items-center justify-center px-4 h-14 shrink-0">
        <Button
          variant="secondary"
          size="icon"
          class="absolute right-4 top-3"
          @click="emit('close')"
          aria-label="Đóng"
        >
          <IconX class="w-5 h-5" />
        </Button>
      </div>
      <div class="flex-1 flex items-center justify-center px-4 pb-4 min-h-0">
        <img
          :src="url"
          class="max-w-full max-h-full object-contain rounded-lg select-none cursor-pointer"
          alt="Xem trước ảnh"
          @click="emit('close')"
        />
      </div>
    </div>
  </Teleport>
</template>
