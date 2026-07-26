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
    mutationFn: async ({ exam }: { exam: ExamItem }) => {
      const match = /ID=(\d+)/.exec(exam.examDetailsUrl);
      if (!match) throw new Error("Không tìm thấy mã đề thi");
      const res = await getExamDownloadLink(match[1]);
      return { examRow: exam.row, res };
    },
    onMutate: ({ exam }) => {
      downloadingRows.value = new Set([...downloadingRows.value, exam.row]);
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
    onError: (error, variables) => {
      const isRateLimit = error instanceof HttpError && error.status === 429;
      const desc =
        error instanceof HttpError
          ? error.status === 429
            ? "Quá nhiều yêu cầu, vui lòng thử lại sau"
            : error.typeError === "NOT_FOUND"
              ? "Không tìm thấy tệp tin tải xuống"
              : error.typeError === "TIMEOUT"
                ? "Kết nối bị timeout, vui lòng thử lại"
                : error.message || "Đã xảy ra lỗi khi tải xuống"
          : error?.message || "Đã xảy ra lỗi khi tải xuống";

      const context = JSON.stringify(
        {
          error:
            error instanceof HttpError
              ? { status: error.status, typeError: error.typeError, message: error.message }
              : error?.message || String(error),
          exam: variables?.exam,
        },
        null,
        2,
      );

      errorToast.show("Lỗi", desc, context, { hideReport: isRateLimit });
    },
    onSettled: (_data, _error, { exam }) => {
      const next = new Set(downloadingRows.value);
      next.delete(exam.row);
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

  function downloadFile(exam: ExamItem) {
    downloadMutation.mutate({ exam });
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
