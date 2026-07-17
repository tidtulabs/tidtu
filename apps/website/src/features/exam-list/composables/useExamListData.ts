import { ref, watch } from "vue";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { HttpError } from "../api/httpError";
import { useExamListQuery, getExamList } from "../api/getExamList";
import { getExamDownloadLink } from "../api/getExamDownloadLink";
import { useUpdateStatusPoller } from "../composables/useUpdateStatusPoller";
import { useErrorToast } from "@/composables/useErrorToast";
import type { ExamItem } from "../types/exam";

export function useExamListData() {
  const errorToast = useErrorToast();
  const exams = ref<ExamItem[]>([]);
  const examsFrequency = ref<ExamItem[]>([]);
  const examsTotal = ref<ExamItem[]>([]);
  const fetchingFlag = ref({ isAuto: false, isFetching: false });
  const downloadingRows = ref<Set<number>>(new Set());

  const queryClient = useQueryClient();
  const poller = useUpdateStatusPoller();

  const query = useExamListQuery({
    queryConfig: {
      refetchOnWindowFocus: false,
      retry: (failureCount: number, err: unknown) => {
        if (err instanceof Error && "status" in err && (err as any).status === 429) {
          return false;
        }
        return failureCount < 3;
      },
    },
  });

  watch(
    () => query.data.value,
    (data) => {
      if (data?.success && data.data) {
        exams.value = data.data;
        examsFrequency.value = data.data;
        if (!data.meta.isUpdated) {
          poller.start();
        }
      }
    },
    { immediate: true },
  );

  const { isPending, isFetching, isError, error } = query;

  const fetchMoreMutation = useMutation({
    mutationFn: () => getExamList("all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-exam-list", "all"] });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async ({
      examRow,
      examDetailsUrl,
    }: {
      examRow: number;
      examDetailsUrl: string;
    }) => {
      const match = /ID=(\d+)/.exec(examDetailsUrl);
      if (!match) throw new Error("Không tìm thấy mã đề thi");
      const res = await getExamDownloadLink(match[1]);
      return { examRow, res };
    },
    onMutate: ({ examRow }) => {
      downloadingRows.value = new Set([...downloadingRows.value, examRow]);
    },
    onSuccess: ({ res }) => {
      const url = res?.data?.url;
      if (url && res?.success) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
    onError: (error) => {
      const desc =
        error instanceof HttpError
          ? error.typeError === "NOT_FOUND"
            ? "Không tìm thấy tệp tin tải xuống"
            : error.typeError === "TIMEOUT"
              ? "Kết nối bị timeout, vui lòng thử lại"
              : "Đã xảy ra lỗi khi tải xuống"
          : error?.message || "Đã xảy ra lỗi khi tải xuống";
      errorToast.show("Lỗi", desc);
    },
    onSettled: (_data, _error, { examRow }) => {
      const next = new Set(downloadingRows.value);
      next.delete(examRow);
      downloadingRows.value = next;
    },
  });

  async function fetchMore(isChecked: boolean) {
    if (isChecked) {
      if (examsTotal.value.length > 0) {
        exams.value = [...exams.value, ...examsTotal.value];
      } else {
        fetchingFlag.value.isFetching = true;
        try {
          const res = await fetchMoreMutation.mutateAsync();
          if (res?.data) {
            examsTotal.value = res.data;
            exams.value = [...exams.value, ...res.data];
          }
        } catch {
          errorToast.show("Lỗi", "Đã xảy ra lỗi khi tải thêm dữ liệu");
        } finally {
          fetchingFlag.value.isFetching = false;
        }
      }
    } else {
      exams.value = examsFrequency.value;
    }
  }

  function downloadFile(examRow: number, examDetailsUrl: string) {
    downloadMutation.mutate({ examRow, examDetailsUrl });
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
  };
}
