import { ref, computed, shallowRef } from "vue";
import { useFeedbackSubmitMutation } from "../api/submitFeedback";
import type { FeedbackType } from "../types/feedback";

export const CONTENT_MAX = 500;

export function useFeedbackForm() {
  const feedbackType = shallowRef<FeedbackType>("bug");
  const title = shallowRef("");
  const content = shallowRef("");
  const submitted = shallowRef(false);
  const contentError = shallowRef("");
  const titleError = shallowRef("");

  const contentLength = computed(() => content.value.length);
  const contentOverLimit = computed(() => contentLength.value > CONTENT_MAX);
  const hasFormData = computed(
    () => content.value.trim().length > 0 || title.value.trim().length > 0,
  );

  const { isPending: isSubmitting, mutateAsync } = useFeedbackSubmitMutation();

  async function handleSubmit(turnstileToken: string, imageFiles?: File[]) {
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

    await mutateAsync({
      turnstileToken,
      imageFiles,
      title: title.value.trim(),
      content: content.value.trim(),
      feedbackType: feedbackType.value,
    });
    submitted.value = true;
  }

  function resetForm() {
    feedbackType.value = "bug";
    title.value = "";
    content.value = "";
    contentError.value = "";
    titleError.value = "";
    submitted.value = false;
  }

  return {
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
  };
}
