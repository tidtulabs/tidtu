import { ref } from "vue"
import { toast } from "vue-sonner"
import { useQuickBugReportMutation, type BugReportContext } from "@/features/feedback/api/quickBugReport"

const COOLDOWN_MS = 10_000

export function useQuickBugReport() {
  const lastSent = ref(0)
  const { isPending: isSending, mutateAsync } = useQuickBugReportMutation()

  async function report(context: BugReportContext): Promise<boolean> {
    const now = Date.now()
    if (now - lastSent.value < COOLDOWN_MS) {
      toast.info("Đã gửi báo lỗi gần đây", {
        description: "Vui lòng đợi một chút trước khi gửi lại.",
      })
      return false
    }

    try {
      await mutateAsync(context)
      lastSent.value = Date.now()
      toast.success("Đã gửi báo lỗi", {
        description: "Cảm ơn bạn! Chúng tôi sẽ xem xét và khắc phục sớm.",
      })
      return true
    } catch {
      toast.error("Gửi báo lỗi thất bại", {
        description: "Vui lòng thử lại sau.",
      })
      return false
    }
  }

  return { report, isSending }
}
