import { onUnmounted } from "vue";
import { toast } from "vue-sonner";
import { checkExamListUpdate } from "../api/getExamList";

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
    if (res.isUpdated) {
      pollTimer = null;
      toast.success("Có dữ liệu mới", {
        description: "Tải lại trang để sử dụng dữ liệu mới nhất.",
        duration: Infinity,
        action: {
          label: "Tải lại",
          onClick: () => location.reload(),
        },
      });
    } else {
      pollTimer = setTimeout(poll, INTERVAL);
    }
  } catch {
    pollTimer = setTimeout(poll, INTERVAL);
  }
}

export function useUpdateStatusPoller() {
  function start() {
    const id = toast.loading("Đã phát hiện dữ liệu mới, đang đồng bộ...");
    setTimeout(() => toast.dismiss(id), 5000);
    if (pollTimer) return;
    pollTimer = setTimeout(poll, INTERVAL);
  }

  onUnmounted(() => {
    if (pollTimer) clearTimeout(pollTimer);
  });

  return { start };
}
