import { HttpError } from "./HttpError";

export const getExamList = async (total: boolean = false) => {
  const response = await fetch(
    `${import.meta.env.VITE_EXAMLIST_SERVICE}/api/v1/pdaotao/scraping/examlist${total ? `?total=${total}` : ""}`,
    {
      credentials: "include",
    }
  );
  if (!response.ok) {
    let errMsg = "Có lỗi xảy ra";
    try {
      const data = await response.json();
      if (response.status === 429) {
        errMsg = "Yêu cầu quá thường xuyên";
      } else {
        errMsg = data.message || data.error || errMsg;
      }
    } catch (_) { }
    throw new HttpError(errMsg, response.status);
  }
  return response.json();
}


