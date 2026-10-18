import { apiClient, isDemoFallbackEnabled } from "@/lib/api/client";
import { mockInstallations } from "@/lib/api/mock-data";
import type {
  Installation,
  NotificationListParams,
  NotificationRecord,
  NotificationReactionsData,
  ResolveDestinationInput,
  ResolvedDestination,
  SendNotificationInput,
  SendNotificationResult,
} from "@/lib/types";

export { riskApi } from "@/lib/api/risk";

async function withFallback<T>(request: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (isDemoFallbackEnabled) return fallback();
    throw error;
  }
}

export const installationApi = {
  list: () => withFallback(() => apiClient.get<Installation[]>("/api/installations"), () => mockInstallations),
};

export const destinationApi = {
  resolve: (input: ResolveDestinationInput) =>
    apiClient.post<ResolvedDestination, ResolveDestinationInput>("/api/destinations/resolve", input),
  disconnect: (destinationId: string) =>
    apiClient.delete<ResolvedDestination>(`/api/destinations/${encodeURIComponent(destinationId)}`),
};

function withQuery(path: string, params?: NotificationListParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export const notificationApi = {
  list: (params?: NotificationListParams) =>
    apiClient.get<NotificationRecord[]>(withQuery("/api/notifications", params)),
  get: (notificationId: string) =>
    apiClient.get<NotificationRecord>(`/api/notifications/${encodeURIComponent(notificationId)}`),
  getReactions: (notificationId: string, includeInactive = false) =>
    apiClient.get<NotificationReactionsData>(
      includeInactive
        ? `/api/notifications/${encodeURIComponent(notificationId)}/reactions?include_inactive=true`
        : `/api/notifications/${encodeURIComponent(notificationId)}/reactions`,
    ),
  send: (input: SendNotificationInput) =>
    apiClient.post<SendNotificationResult, SendNotificationInput>("/api/notifications/send", input),
};

export const systemApi = {
  health: () => withFallback(() => apiClient.getRaw<{ status: string }>("/health"), () => ({ status: "demo" })),
  ready: () => withFallback(
    () => apiClient.getRaw<{ status: string; mongodb: string }>("/ready"),
    () => ({ status: "demo", mongodb: "demo" }),
  ),
};
