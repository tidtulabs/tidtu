import { queryOptions, useQuery } from "@tanstack/vue-query";
import { HttpError } from "./httpError";
import type { QueryConfig } from "@/lib/query";
import type { FetchResponse } from "../types/exam";

export const getExamList = async (scope?: "frequency" | "all"): Promise<FetchResponse> => {
  const response = await fetch(
    `${import.meta.env.VITE_GATEWAY_SERVICE}/api/v1/pdaotao/exams${scope === "all" ? "?scope=all" : ""}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    let errMsg = "Có lỗi xảy ra";
    let typeError: string | null = null;
    try {
      const data = await response.json();
      typeError = data.typeError || null;
      if (response.status === 429) {
        errMsg = "Yêu cầu quá thường xuyên";
      } else {
        errMsg = data.message || errMsg;
      }
    } catch (_) {}
    throw new HttpError(errMsg, response.status, typeError);
  }
  return response.json();
};

export const getExamListQueryOptions = (scope?: "frequency" | "all") => {
  return queryOptions({
    queryKey: scope === "all" ? ["get-exam-list", "all"] : ["get-exam-list"],
    queryFn: () => getExamList(scope),
  });
};

type UseExamListOptions = {
  queryConfig?: QueryConfig<typeof getExamListQueryOptions>;
};

export function useExamListQuery({ queryConfig = {} }: UseExamListOptions = {}) {
  return useQuery({
    ...getExamListQueryOptions(),
    ...queryConfig,
  });
}

export type UpdateStatusResponse = {
  isUpdated: boolean;
  status: "updating" | "ready" | "failed" | null;
  startedAt: number | null;
  elapsed: number;
};

export const checkExamListUpdate = async (): Promise<UpdateStatusResponse> => {
  const response = await fetch(
    `${import.meta.env.VITE_GATEWAY_SERVICE}/api/v1/pdaotao/exams/status`,
    { credentials: "include" },
  );
  const json = await response.json();
  return json.data;
};
