import { useMutation } from '@tanstack/vue-query'
import { HttpError } from './httpError'

export async function getExamDownloadLink(id: string) {
  const response = await fetch(
    `${import.meta.env.VITE_GATEWAY_SERVICE}/api/v1/pdaotao/exams/${id}/download`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    let errMsg = 'Có lỗi xảy ra'
    try {
      const data = await response.json()
      if (response.status === 429) {
        errMsg = 'Yêu cầu quá thường xuyên'
      } else {
        errMsg = data.message || data.error || errMsg
      }
    } catch (_) { }
    throw new HttpError(errMsg, response.status)
  }
  return response.json()
}

export function useExamDownloadLinkMutation() {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => getExamDownloadLink(id),
  })
}
