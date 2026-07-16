import { ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { useExamListQuery, getExamList } from '../api/getExamList'
import { getExamDownloadLink } from '../api/getExamDownloadLink'
import { useExamListCacheMutation } from '../api/updateExamListCache'
import type { ExamItem } from '../types/exam'

export function useExamListData() {
  const exams = ref<ExamItem[]>([])
  const examsFrequency = ref<ExamItem[]>([])
  const examsTotal = ref<ExamItem[]>([])
  const fetchingFlag = ref({ isAuto: false, isFetching: false })
  const downloadingRows = ref<Set<number>>(new Set())

  const queryClient = useQueryClient()

  const query = useExamListQuery({
    queryConfig: {
      refetchOnWindowFocus: false,
      retry: (failureCount: number, err: unknown) => {
        if (err instanceof Error && 'status' in err && (err as any).status === 429) {
          return false
        }
        return failureCount < 3
      },
    },
  })

  const cacheMutation = useExamListCacheMutation()

  watch(() => query.data.value, (data) => {
    if (data?.success && data.response.data) {
      exams.value = data.response.data
      examsFrequency.value = data.response.data
      if (data.meta.shouldUpdate) {
        cacheMutation.mutate()
      }
    }
  }, { immediate: true })

  const { isPending, isFetching, isError, error } = query

  const fetchMoreMutation = useMutation({
    mutationFn: () => getExamList('all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get-exam-list', 'all'] })
    },
  })

  const downloadMutation = useMutation({
    mutationFn: async ({ examRow, examDetailsUrl }: { examRow: number; examDetailsUrl: string }) => {
      const match = /ID=(\d+)/.exec(examDetailsUrl)
      const id = match ? match[1] : '000000'
      const res = await getExamDownloadLink(id)
      return { examRow, res }
    },
    onMutate: ({ examRow }) => {
      downloadingRows.value = new Set([...downloadingRows.value, examRow])
    },
    onSuccess: ({ res }) => {
      const url = res?.response?.data?.url
      if (url && res?.success) {
        const a = document.createElement('a')
        a.href = url
        a.download = ''
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else if (res.typeError === 'NOT_FOUND') {
        toast.error('Lỗi', { description: 'Không tìm thấy tệp tin tải xuống' })
      } else if (res.typeError === 'SERVER_ERROR') {
        toast.error('Lỗi', { description: 'Lỗi server, vui lòng thử lại sau' })
      }
    },
    onError: () => {
      toast.error('Lỗi', { description: 'Đã xảy ra lỗi khi tải xuống' })
    },
    onSettled: (_data, _error, { examRow }) => {
      const next = new Set(downloadingRows.value)
      next.delete(examRow)
      downloadingRows.value = next
    },
  })

  async function fetchMore(isChecked: boolean) {
    if (isChecked) {
      if (examsTotal.value.length > 0) {
        exams.value = [...exams.value, ...examsTotal.value]
      } else {
        fetchingFlag.value.isFetching = true
        try {
          const res = await fetchMoreMutation.mutateAsync()
          if (res?.response?.data) {
            examsTotal.value = res.response.data
            exams.value = [...exams.value, ...res.response.data]
          }
        } catch {
          toast.error('Lỗi', {
            description: 'Đã xảy ra lỗi khi tải thêm dữ liệu',
          })
        } finally {
          fetchingFlag.value.isFetching = false
        }
      }
    } else {
      exams.value = examsFrequency.value
    }
  }

  function downloadFile(examRow: number, examDetailsUrl: string) {
    downloadMutation.mutate({ examRow, examDetailsUrl })
  }

  return {
    exams,
    isPending,
    isFetching,
    isError,
    error,
    fetchingFlag,
    downloadingRows,
    fetchMore,
    downloadFile,
  }
}
