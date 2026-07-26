import { toast } from "vue-sonner";
import { useQuickBugReport } from "./useQuickBugReport";

export function useErrorToast() {
  const currentUrl = window.location.href;
  const { report: reportBug } = useQuickBugReport();

  function show(
    title: string,
    description: string,
    context?: string,
    options?: { hideReport?: boolean },
  ) {
    const toastOptions: any = {
      description,
    };
    if (!options?.hideReport) {
      toastOptions.action = {
        label: "Báo cáo lỗi",
        onClick: () => reportBug({ message: description, details: context, page: currentUrl }),
      };
    }
    toast.error(title, toastOptions);
  }

  return { show };
}
