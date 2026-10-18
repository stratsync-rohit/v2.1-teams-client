import { apiClient } from "@/lib/api/client";
import { parseRisk, parseRiskList } from "./risk-parser";

export const riskApi = {
  list: async () => parseRiskList(await apiClient.getRaw<unknown>("/api/risks")),
  get: async (riskId: string) =>
    parseRisk(await apiClient.getRaw<unknown>(`/api/risks/${encodeURIComponent(riskId)}`)),
};
