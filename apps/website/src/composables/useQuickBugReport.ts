import { ref } from "vue";
import { toast } from "vue-sonner";

export interface BugReportContext {
  message: string;
  page?: string;
  details?: string;
}

const COOLDOWN_MS = 10_000;

export function useQuickBugReport() {
  const isSending = ref(false);
  const lastSent = ref(0);

  async function report(context: BugReportContext): Promise<boolean> {
    const now = Date.now();
    if (now - lastSent.value < COOLDOWN_MS) {
      toast.info("Đã gửi báo lỗi gần đây", {
        description: "Vui lòng đợi một chút trước khi gửi lại.",
      });
      return false;
    }

    isSending.value = true;

    try {
      const formData = new FormData();
      formData.append("type", "bug");
      formData.append("quick", "true");
      formData.append(
        "title",
        `[Tự động] ${context.message.slice(0, 80)}`
      );
      formData.append(
        "content",
        [
          `Trang: ${context.page || window.location.href}`,
          `Lỗi: ${context.message}`,
          context.details ? `Chi tiết: ${context.details}` : "",
          `Trình duyệt: ${navigator.userAgent.slice(0, 200)}`,
          `Thời gian: ${new Date().toLocaleString("vi-VN")}`,
        ]
          .filter(Boolean)
          .join("\n")
      );

      const gatewayUrl = import.meta.env.VITE_GATEWAY_SERVICE;
      if (!gatewayUrl) {
        throw new Error("VITE_GATEWAY_SERVICE not configured");
      }

      const res = await fetch(`${gatewayUrl}/api/v1/feedback`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Lỗi ${res.status}`);
      }

      lastSent.value = Date.now();

      toast.success("Đã gửi báo lỗi", {
        description: "Cảm ơn bạn! Chúng tôi sẽ xem xét và khắc phục sớm.",
      });

      return true;
    } catch (err: any) {
      toast.error("Gửi báo lỗi thất bại", {
        description: err.message || "Vui lòng thử lại sau.",
      });
      return false;
    } finally {
      isSending.value = false;
    }
  }

  return { report, isSending };
}
