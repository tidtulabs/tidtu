<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useTurnstile } from "@/composables/useTurnstile";
import { IconX, IconPhotoPlus } from "@tabler/icons-vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "vue-sonner";

const CONTENT_MAX = 500;
const MAX_IMAGES = 3;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const feedbackType = ref<"feedback" | "bug">("bug");
const title = ref("");
const content = ref("");
const isSubmitting = ref(false);
const submitted = ref(false);
const contentError = ref("");
const titleError = ref("");
const turnstileReady = ref(false);
const imageError = ref("");

interface SelectedImage {
  file: File;
  url: string;
}

const images = ref<SelectedImage[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);

const contentLength = computed(() => content.value.length);
const contentOverLimit = computed(() => contentLength.value > CONTENT_MAX);
const hasFormData = computed(
  () =>
    content.value.trim().length > 0 ||
    title.value.trim().length > 0 ||
    images.value.length > 0
);

const showLeaveAlert = ref(false);
let resolveLeave: ((leave: boolean) => void) | null = null;

onBeforeRouteLeave((to, from, next) => {
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

const { turnstileContainer, turnstileToken, render, reset, remove } = useTurnstile();

onMounted(() => {
  setTimeout(() => {
    render();
    turnstileReady.value = true;
  }, 100);
});

watch(previewUrl, (url) => {
  document.body.style.overflow = url ? "hidden" : "";
});

onUnmounted(() => {
  remove();
  document.body.style.overflow = "";
  for (const img of images.value) {
    URL.revokeObjectURL(img.url);
  }
});

function openFilePicker() {
  fileInput.value?.click();
}

function handleFileSelect(e: Event) {
  imageError.value = "";
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) return;

  const remaining = MAX_IMAGES - images.value.length;
  const newFiles = Array.from(target.files).slice(0, remaining);

  for (const file of newFiles) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      imageError.value = "Chỉ chấp nhận ảnh PNG, JPEG, WebP hoặc GIF.";
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      imageError.value = `"${file.name}" vượt quá 10MB.`;
      continue;
    }
    images.value.push({ file, url: URL.createObjectURL(file) });
  }

  target.value = "";
}

function removeImage(idx: number) {
  const img = images.value[idx];
  URL.revokeObjectURL(img.url);
  images.value.splice(idx, 1);
  imageError.value = "";
}

function openImagePreview(url: string) {
  previewUrl.value = url;
}

function closeImagePreview() {
  previewUrl.value = null;
}

async function handleFeedbackSubmit() {
  contentError.value = "";

  titleError.value = "";

  if (!title.value.trim() && feedbackType.value === "bug") {
    titleError.value = "Vui lòng nhập tiêu đề tóm tắt lỗi.";
    return;
  }
  if (!content.value.trim()) {
    contentError.value = "Vui lòng nhập nội dung trước khi gửi.";
    return;
  }
  if (contentOverLimit.value) {
    contentError.value = `Nội dung không được vượt quá ${CONTENT_MAX} ký tự.`;
    return;
  }
  if (!turnstileToken.value) {
    toast.error("Lỗi bảo mật", {
      description: "Vui lòng hoàn thành xác thực bảo mật.",
    });
    return;
  }

  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append("type", feedbackType.value);
    formData.append("content", content.value.trim());
    formData.append("turnstileToken", turnstileToken.value);
    if (title.value.trim()) {
      formData.append("title", title.value.trim());
    }
    for (let i = 0; i < images.value.length; i++) {
      formData.append(`image${i}`, images.value[i].file);
    }

    const res = await fetch(
      `${import.meta.env.VITE_GATEWAY_SERVICE}/api/v1/feedback`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || `Lỗi ${res.status}`);
    }

    submitted.value = true;
  } catch (err: any) {
    toast.error("Gửi thất bại", {
      description: err.message || "Đã có lỗi xảy ra, vui lòng thử lại.",
    });
    reset();
  } finally {
    isSubmitting.value = false;
  }
}

function handleSendAnother() {
  submitted.value = false;
  title.value = "";
  content.value = "";
  feedbackType.value = "bug";
  contentError.value = "";
  titleError.value = "";
  imageError.value = "";
  for (const img of images.value) {
    URL.revokeObjectURL(img.url);
  }
  images.value = [];
  reset();
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

    <div
      v-if="submitted"
      class="max-w-lg flex flex-col items-start gap-4 py-8"
    >
      <div class="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500/10 shrink-0">
        <svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
            Cảm ơn bạn đã dành thời gian đóng góp. Chúng tôi sẽ xem xét và cải thiện hệ thống sớm nhất có thể.
          </template>
        </p>
      </div>
      <Button variant="outline" size="sm" @click="handleSendAnother" class="mt-1">
        Gửi thêm
      </Button>
    </div>

    <form
      v-else
      @submit.prevent="handleFeedbackSubmit"
      class="max-w-lg space-y-5"
    >
      <div class="space-y-2">
        <Label class="text-sm font-medium text-foreground">Loại góp ý</Label>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="[
              feedbackType === 'bug'
                ? 'border-foreground/20 bg-muted text-foreground font-semibold ring-1 ring-foreground/10'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40'
            ]"
            @click="feedbackType = 'bug'"
          >
            <span>🐞</span>
            <span>Báo lỗi</span>
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="[
              feedbackType === 'feedback'
                ? 'border-foreground/20 bg-muted text-foreground font-semibold ring-1 ring-foreground/10'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40'
            ]"
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
          :placeholder="feedbackType === 'bug'
            ? 'Tóm tắt lỗi bạn gặp phải...'
            : 'Tóm tắt ý kiến của bạn...'"
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
          :placeholder="feedbackType === 'bug'
            ? 'Mô tả lỗi bạn gặp phải, bao gồm các bước tái hiện nếu có...'
            : 'Nhập ý kiến đóng góp của bạn...'"
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
          <span class="text-muted-foreground font-normal ml-1">(Không bắt buộc, tối đa {{ MAX_IMAGES }} ảnh)</span>
        </Label>

        <div class="flex flex-wrap items-start gap-3">
          <div
            v-for="(img, idx) in images"
            :key="idx"
            class="relative w-[88px] h-[88px] rounded-lg overflow-hidden border border-border shrink-0 cursor-pointer"
            @click="openImagePreview(img.url)"
          >
            <img
              :src="img.url"
              class="w-full h-full object-cover"
              alt="Ảnh đính kèm"
            />
            <button
              type="button"
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-border text-muted-foreground flex items-center justify-center hover:text-foreground hover:border-foreground/50 transition-colors shadow-sm"
              @click="removeImage(idx)"
              aria-label="Xoá ảnh"
            >
              <IconX class="w-3 h-3" />
            </button>
          </div>

          <Button
            v-if="images.length < MAX_IMAGES"
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
          multiple
          class="hidden"
          @change="handleFileSelect"
        />

        <p v-if="imageError" class="text-xs text-destructive">{{ imageError }}</p>
      </div>

      <div class="py-1">
        <div
          v-if="!turnstileReady"
          class="h-[65px] w-[300px] rounded-md bg-muted animate-pulse"
        />
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
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

    <teleport to="body">
      <div
        v-if="previewUrl"
        class="fixed inset-0 z-50 bg-black/80 flex flex-col"
        @click="closeImagePreview"
      >
        <div class="flex items-center justify-end px-4 h-12 shrink-0">
          <Button
            variant="outline"
            size="icon"
            @click="closeImagePreview"
            aria-label="Đóng"
          >
            <IconX class="w-5 h-5" />
          </Button>
        </div>
        <div class="flex-1 flex items-center justify-center px-4 pb-4 min-h-0">
          <img
            :src="previewUrl"
            class="max-w-full max-h-full object-contain rounded-lg select-none"
            alt="Xem trước ảnh"
            @click.stop
          />
        </div>
      </div>
    </teleport>

    <AlertDialog :open="showLeaveAlert">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận rời đi</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn rời đi? Nội dung đã nhập sẽ bị mất.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelLeave">Ở lại</AlertDialogCancel>
          <AlertDialogAction @click="confirmLeave">Rời đi</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
