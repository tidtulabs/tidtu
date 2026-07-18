import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./driver-theme.css";

const TOUR_DISMISSED = "examlist:tourDismissed";
const NEW_PAGINATION_SEEN = "examlist:newPaginationSeen";

export function useExamListTour() {
  const hasSeen = localStorage.getItem(TOUR_DISMISSED) === "true";
  const newPaginationSeen = localStorage.getItem(NEW_PAGINATION_SEEN) === "true";

  const isDark =
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const overlayColor = isDark ? "rgb(51 65 85)" : "rgb(17 17 24)";

  const driverObj = driver({
    animate: true,
    overlayColor,
    overlayOpacity: 0.55,
    allowClose: true,
    smoothScroll: true,
    stagePadding: 4,
    stageRadius: 0,
    showProgress: true,
    popoverClass: "driverjs-theme",
    nextBtnText: "Tiếp theo",
    prevBtnText: "Quay lại",
    doneBtnText: "Hoàn thành",
    progressText: "{{current}} / {{total}}",
    steps: [
      {
        element: '[data-tour="search-input"]',
        popover: {
          title: "Tìm kiếm",
          description: "Nhập mã thi hoặc tên môn học để tìm nhanh trong danh sách",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="load-all-toggle"]',
        popover: {
          title: "Tải tất cả",
          description: "Bật để tải đề thi từ tất cả các trang từ hệ thống trường",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="pagination-badge"]',
        popover: {
          title: "Trang đã đồng bộ",
          description: "Số trang đề thi đã được đồng bộ từ hệ thống, được cập nhật liên tục",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="pagination-toggle"]',
        popover: {
          title: "Bật/tắt phân trang",
          description: "Hiển thị tất cả kết quả trên cùng một trang hoặc chia theo trang",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="display-config"]',
        popover: {
          title: "Cấu hình hiển thị",
          description: 'Tùy chỉnh ẩn/hiện cột "Ngày tải lên" và "Số trang"',
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="exam-table"]',
        popover: {
          title: "Danh sách đề thi",
          description: "Bấm icon tải xuống để lưu đề thi về máy. Đề thi mới có icon ✨",
          side: "top",
          align: "start",
        },
      },
    ],
    onDestroyed: () => {
      localStorage.setItem(TOUR_DISMISSED, "true");
      localStorage.setItem("examlist:newPaginationSeen", "true");
    },
  });

  function startTour() {
    driverObj.drive();
  }

  function highlightNewPagination() {
    driverObj.highlight({
      element: '[data-tour="pagination-toggle"]',
      popover: {
        title: "Mới: Chế độ phân trang",
        description:
          "Bấm để chuyển giữa xem tất cả đề thi trên một trang hoặc chia thành từng trang. Bấm ? bất lúc nào để mở hướng dẫn.",
        side: "bottom",
        align: "start",
        showButtons: ["close"],
      },
    });
  }

  return { startTour, highlightNewPagination, hasSeen, newPaginationSeen };
}
