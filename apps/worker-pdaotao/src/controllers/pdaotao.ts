import * as response from "utils/response";
import * as services from "services/pdaotao";
import { Context } from "hono";
import { BASE_URL } from "utils/base-url";

export const getExamList = async (c: Context) => {
  try {
    const data = await services.fetchExamList(c);
    if (!data) {
      return response.error(c, "Get exam list failed");
    }
    return response.success(c, data?.data, data.meta);
  } catch (err: any) {
    if (err.errorType === "TIMEOUT") {
      return response.timeout(c, err.message);
    }
    // console.log(err);
    return response.serverError(c, err.message);
    // return response.error(c, err.message);
  }
};

export const fetchExamDownloadLink = async (c: Context) => {
  try {
    const url = await services.resolveExamDownloadLink(c);
    if (url) {
      // console.log(url);
      return response.success(c, { url: `${BASE_URL}/${url}` });
    }
    return response.notFound(c, "Exam download link not found");
  } catch (err: any) {
    // console.log(err);
    if (err.errorType === "TIMEOUT") {
      return response.timeout(c, err.message);
    }
    return response.error(c, err.message);
  }
};

export const checkExamListUpdate = async (c: Context) => {
  try {
    const raw = await c.env.CACHE_TIDTU.get("cacheStatus");
    const status = raw ? JSON.parse(raw) : null;
    const now = Date.now();
    return response.success(c, {
      isUpdated: status?.status === "ready",
      status: status?.status || null,
      startedAt: status?.startedAt || null,
      elapsed: status?.startedAt ? now - status.startedAt : 0,
    });
  } catch {
    return response.success(c, { isUpdated: true, status: "ready", startedAt: null, elapsed: 0 });
  }
};
