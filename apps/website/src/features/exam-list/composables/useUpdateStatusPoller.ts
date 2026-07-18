import { onUnmounted } from "vue";
import { toast } from "vue-sonner";
import { checkExamListUpdate } from "../api/getExamList";
import { submitQuickBugReport } from "@/features/feedback/api/quickBugReport";

const MAX_POLLS = 5;
const INTERVAL = 60000;

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let pollCount = 0;

async function poll() {
  pollCount++;
  if (pollCount > MAX_POLLS) {
    pollTimer = null;
    return;
  }
  try {
    const res = await checkExamListUpdate();
    if (res.status === "ready") {
      pollTimer = null;
      toast.success("Có dữ liệu mới", {
        description: "Tải lại trang để sử dụng dữ liệu mới nhất.",
        duration: Infinity,
        action: {
          label: "Tải lại",
          onClick: () => location.reload(),
        },
      });
    } else if (res.status === "failed") {
      pollTimer = null;
      const id = toast.error("Đồng bộ thất bại", {
        description: "Có lỗi xảy ra khi đồng bộ dữ liệu, vui lòng thử lại sau.",
        action: {
          label: "Báo lỗi",
          onClick: () => {
            submitQuickBugReport({
              message: "Đồng bộ dữ liệu kỳ thi thất bại",
              page: window.location.href,
              details: JSON.stringify(res),
            }).catch(() => {});
          },
        },
      });
      setTimeout(() => toast.dismiss(id), 30000);
    } else {
      pollTimer = setTimeout(poll, INTERVAL);
    }
  } catch {
    pollTimer = setTimeout(poll, INTERVAL);
  }
}

export function useUpdateStatusPoller() {
  function start() {
    if (pollTimer) return;
    console.log("Đã phát hiện dữ liệu mới, đang đồng bộ...");
    pollTimer = setTimeout(poll, INTERVAL);
  }

  onUnmounted(() => {
    if (pollTimer) clearTimeout(pollTimer);
  });

  return { start };
}
