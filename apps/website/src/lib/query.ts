import type { UseQueryOptions } from "@tanstack/vue-query";

export type QueryConfig<T extends (...args: any) => any> = Partial<
  Omit<ReturnType<T>, "queryKey" | "queryFn">
>;
