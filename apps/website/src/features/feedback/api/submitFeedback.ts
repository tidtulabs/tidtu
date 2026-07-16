import { useMutation } from '@tanstack/vue-query'
import type { FeedbackType } from '../types/feedback'

export async function submitFeedback(
  feedbackType: FeedbackType,
  content: string,
  turnstileToken: string,
  options?: { title?: string; images?: File[] },
): Promise<void> {
  const formData = new FormData()
  formData.append('type', feedbackType)
  formData.append('content', content)
  formData.append('turnstileToken', turnstileToken)
  if (options?.title) {
    formData.append('title', options.title)
  }
  if (options?.images) {
    for (let i = 0; i < options.images.length; i++) {
      formData.append(`image${i}`, options.images[i])
    }
  }

  const res = await fetch(
    `${import.meta.env.VITE_GATEWAY_SERVICE}/api/v1/feedback`,
    { method: 'POST', body: formData },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || `Lỗi ${res.status}`)
  }
}

export function useFeedbackSubmitMutation() {
  return useMutation({
    mutationFn: (params: { turnstileToken: string; imageFiles?: File[]; title: string; content: string; feedbackType: FeedbackType }) =>
      submitFeedback(
        params.feedbackType,
        params.content,
        params.turnstileToken,
        { title: params.title || undefined, images: params.imageFiles },
      ),
  })
}
