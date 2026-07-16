import { useMutation } from '@tanstack/vue-query'

export async function updateExamListCache(): Promise<void> {
  const res = await fetch(
    `${import.meta.env.VITE_CACHE_SERVICE}/api/v1/pdaotao/cache/exams`,
    { method: 'POST' },
  )
  if (!res.ok) {
    console.error('Failed to update exam list cache:', res.status)
  }
}

export function useExamListCacheMutation() {
  return useMutation({
    mutationFn: updateExamListCache,
  })
}
