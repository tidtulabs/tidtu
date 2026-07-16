import { useMutation } from '@tanstack/vue-query'

export interface BugReportContext {
  message: string
  page?: string
  details?: string
}

export async function submitQuickBugReport(context: BugReportContext): Promise<void> {
  const formData = new FormData()
  formData.append('type', 'bug')
  formData.append('quick', 'true')
  formData.append('title', `[Tự động] ${context.message.slice(0, 80)}`)
  formData.append(
    'content',
    [
      `Trang: ${context.page || window.location.href}`,
      `Lỗi: ${context.message}`,
      context.details ? `Chi tiết: ${context.details}` : '',
      `Trình duyệt: ${navigator.userAgent.slice(0, 200)}`,
      `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
    ]
      .filter(Boolean)
      .join('\n'),
  )

  const gatewayUrl = import.meta.env.VITE_GATEWAY_SERVICE
  if (!gatewayUrl) {
    throw new Error('VITE_GATEWAY_SERVICE not configured')
  }

  const res = await fetch(`${gatewayUrl}/api/v1/feedback`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || `Lỗi ${res.status}`)
  }
}

export function useQuickBugReportMutation() {
  return useMutation({
    mutationFn: (context: BugReportContext) => submitQuickBugReport(context),
  })
}
