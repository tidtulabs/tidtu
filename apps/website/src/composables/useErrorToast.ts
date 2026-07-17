import { toast } from "vue-sonner";
import { useQuickBugReport } from "./useQuickBugReport";

export function useErrorToast() {
  const currentUrl = window.location.href;
  const { report: reportBug } = useQuickBugReport();

  function show(title: string, description: string, context?: string) {
    toast.error(title, {
      description,
      action: {
        label: "Báo cáo lỗi",
        onClick: () => reportBug({ message: context || description, page: currentUrl }),
      },
    });
  }

  return { show };
}
