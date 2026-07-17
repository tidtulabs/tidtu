<script setup lang="ts">
import { useHead } from "@unhead/vue";
import { ref, onMounted, onUnmounted, nextTick, useTemplateRef } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { toast } from "vue-sonner";
import { useTurnstile } from "@/composables/useTurnstile";
import { useFeedbackForm, CONTENT_MAX } from "../composables/useFeedbackForm";
import { useFeedbackImages } from "../composables/useFeedbackImages";
import { IconX, IconPhotoPlus } from "@tabler/icons-vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImagePreviewDialog from "./ImagePreviewDialog.vue";
import LeaveConfirmDialog from "./LeaveConfirmDialog.vue";

useHead({
  title: "Góp ý & Báo lỗi | TIDTU",
  meta: [
    { name: "description", content: "Góp ý và báo lỗi cho TIDTU" },
    { property: "og:title", content: "Góp ý & Báo lỗi | TIDTU" },
    { property: "og:description", content: "Góp ý và báo lỗi cho TIDTU" },
    { property: "og:url", content: "https://tidtu.pages.dev/pdaotao/feedback" },
  ],
  link: [{ rel: "canonical", href: "https://tidtu.pages.dev/pdaotao/feedback" }],
});

const {
  feedbackType,
  title,
  content,
  isSubmitting,
  submitted,
  contentError,
  titleError,
  contentLength,
  contentOverLimit,
  hasFormData,
  handleSubmit,
  resetForm,
} = useFeedbackForm();

const {
  images,
  previewUrl,
  imageError,
  addFiles,
  removeImage,
  openPreview,
  closePreview,
  revokeAll,
} = useFeedbackImages();

const { turnstileContainer, turnstileToken, render, reset, remove } = useTurnstile();

const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
const showLeaveAlert = ref(false);
let resolveLeave: ((leave: boolean) => void) | null = null;

onBeforeRouteLeave((_to, _from, next) => {
  if (hasFormData.value && !submitted.value) {
    showLeaveAlert.value = true;
    resolveLeave = (leave: boolean) => {
      if (leave) next();
      else next(false);
      showLeaveAlert.value = false;
    };
  } else {
    next();
  }
});

function confirmLeave() {
  resolveLeave?.(true);
}
function cancelLeave() {
  resolveLeave?.(false);
}

onMounted(() => {
  requestAnimationFrame(() => render());
});

onUnmounted(() => {
  remove();
  revokeAll();
});

function openFilePicker() {
  fileInput.value?.click();
}

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) {
    addFiles(target.files);
  }
  target.value = "";
}

async function onSubmit() {
  if (!turnstileToken.value) {
    toast.error("Lỗi bảo mật", {
      description: "Vui lòng hoàn thành xác thực bảo mật.",
    });
    return;
  }
  const imageFiles = images.value.map((i) => i.file);
  try {
    await handleSubmit(turnstileToken.value, imageFiles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.";
    toast.error("Gửi thất bại", { description: message });
    reset();
  }
}

async function handleSendAnother() {
  resetForm();
  revokeAll();
  images.value = [];
  await nextTick();
  render();
}
</script>

<template>
  <div class="max-w-5xl w-full">
    <div class="mb-8">
      <h2 class="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
        <span v-if="feedbackType === 'bug'">🐞 Báo lỗi</span>
        <span v-else>💡 Góp ý</span>
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        <template v-if="feedbackType === 'bug'">
          Mô tả chi tiết lỗi bạn gặp phải để chúng tôi khắc phục nhanh nhất.
        </template>
        <template v-else>
          TIDTU luôn lắng nghe ý kiến của bạn để hoàn thiện hệ thống tốt hơn.
        </template>
      </p>
    </div>

    <div v-if="submitted" class="max-w-lg flex flex-col items-start gap-4 py-8">
      <div
        class="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500/10 shrink-0"
      >
        <svg
          class="w-5 h-5 text-emerald-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div>
        <p class="text-base font-semibold text-foreground">
          <template v-if="feedbackType === 'bug'">Đã nhận báo lỗi của bạn!</template>
          <template v-else>Đã nhận ý kiến của bạn!</template>
        </p>
        <p class="mt-1 text-sm text-muted-foreground max-w-sm">
          <template v-if="feedbackType === 'bug'">
            Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và khắc phục sớm nhất có thể.
          </template>
          <template v-else>
            Cảm ơn bạn đã dành thời gian đóng góp. Chúng tôi sẽ xem xét và cải thiện hệ thống sớm
            nhất có thể.
          </template>
        </p>
      </div>
      <Button variant="outline" @click="handleSendAnother" class="mt-2"> Gửi thêm </Button>
    </div>

    <form v-else @submit.prevent="onSubmit" class="max-w-lg space-y-5">
      <div class="space-y-2">
        <Label class="text-sm font-medium text-foreground">Loại góp ý</Label>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="
              feedbackType === 'bug'
                ? 'border-foreground/20 bg-muted text-foreground font-semibold ring-1 ring-foreground/10'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40'
            "
            @click="feedbackType = 'bug'"
          >
            <span>🐞</span>
            <span>Báo lỗi</span>
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="
              feedbackType === 'feedback'
                ? 'border-foreground/20 bg-muted text-foreground font-semibold ring-1 ring-foreground/10'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40'
            "
            @click="feedbackType = 'feedback'"
          >
            <span>💡</span>
            <span>Góp ý</span>
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="feedback-title" class="text-sm font-medium text-foreground">
          <template v-if="feedbackType === 'bug'">Tiêu đề lỗi</template>
          <template v-else>Tiêu đề góp ý</template>
        </Label>
        <Input
          id="feedback-title"
          type="text"
          :placeholder="
            feedbackType === 'bug' ? 'Tóm tắt lỗi bạn gặp phải...' : 'Tóm tắt ý kiến của bạn...'
          "
          v-model="title"
          class="h-9 text-sm"
          :class="titleError ? 'border-destructive focus-visible:ring-destructive/30' : ''"
          @input="titleError = ''"
        />
        <p v-if="titleError" class="text-xs text-destructive">{{ titleError }}</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label for="feedback-content" class="text-sm font-medium text-foreground">
            Nội dung chi tiết
          </Label>
          <span
            class="text-xs tabular-nums transition-colors"
            :class="contentOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'"
          >
            {{ contentLength }}/{{ CONTENT_MAX }}
          </span>
        </div>
        <Textarea
          id="feedback-content"
          :placeholder="
            feedbackType === 'bug'
              ? 'Mô tả lỗi bạn gặp phải, bao gồm các bước tái hiện nếu có...'
              : 'Nhập ý kiến đóng góp của bạn...'
          "
          v-model="content"
          class="min-h-[120px] resize-none text-sm"
          :class="contentError ? 'border-destructive focus-visible:ring-destructive/30' : ''"
          @input="contentError = ''"
        />
        <p v-if="contentError" class="text-xs text-destructive">{{ contentError }}</p>
      </div>

      <div class="space-y-3">
        <Label class="text-sm font-medium text-foreground">
          Ảnh đính kèm
          <span class="text-muted-foreground font-normal ml-1">(Không bắt buộc)</span>
        </Label>
        <div class="flex flex-wrap items-start gap-3">
          <div
            v-for="(img, idx) in images"
            :key="idx"
            class="relative w-[88px] h-[88px] shrink-0 cursor-pointer"
            @click="openPreview(img.url)"
          >
            <div class="w-full h-full rounded-lg overflow-hidden border border-border">
              <img :src="img.url" class="w-full h-full object-cover" alt="Ảnh đính kèm" />
            </div>
            <button
              type="button"
              class="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-background border border-border text-muted-foreground flex items-center justify-center hover:text-foreground hover:border-foreground/50 transition-colors shadow-sm z-10"
              @click.stop="removeImage(idx)"
              aria-label="Xoá ảnh"
            >
              <IconX class="w-4 h-4" />
            </button>
          </div>
          <Button
            v-if="images.length < 1"
            type="button"
            variant="outline"
            size="sm"
            @click="openFilePicker"
            class="w-[88px] h-[88px] rounded-lg border-dashed flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <IconPhotoPlus class="w-5 h-5" />
            Thêm ảnh
          </Button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          class="hidden"
          @change="onFileSelect"
        />
        <p v-if="imageError" class="text-xs text-destructive">{{ imageError }}</p>
      </div>

      <div class="py-1">
        <div ref="turnstileContainer" />
      </div>

      <div class="pt-1">
        <Button
          type="submit"
          class="min-w-[140px] h-9 text-sm font-medium"
          :disabled="isSubmitting || contentOverLimit"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Đang gửi...
          </span>
          <span v-else>
            <template v-if="feedbackType === 'bug'">Gửi báo lỗi</template>
            <template v-else>Gửi góp ý</template>
          </span>
        </Button>
      </div>
    </form>

    <ImagePreviewDialog :url="previewUrl" @close="closePreview" />
    <LeaveConfirmDialog :open="showLeaveAlert" @confirm="confirmLeave" @cancel="cancelLeave" />
  </div>
</template>
