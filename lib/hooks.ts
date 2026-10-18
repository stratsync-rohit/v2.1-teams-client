"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { destinationApi, installationApi, notificationApi, riskApi, systemApi } from "@/lib/api";
import { mockDestinations } from "@/lib/api/mock-data";
import type { NotificationListParams } from "@/lib/types";

export const queryKeys = {
  risks: ["risks"] as const,
  risk: (id: string) => ["risks", id] as const,
  installations: ["installations"] as const,
  destinations: ["legacy-demo-destinations"] as const,
  notifications: (filters?: NotificationListParams) => ["notifications", filters ?? {}] as const,
  notification: (id: string) => ["notification", id] as const,
  reactions: (id: string, includeInactive = false) => ["notification-reactions", id, includeInactive] as const,
  health: ["health"] as const,
};

export function useRisks() { return useQuery({ queryKey: queryKeys.risks, queryFn: riskApi.list }); }
export function useRisk(id: string) { return useQuery({ queryKey: queryKeys.risk(id), queryFn: () => riskApi.get(id), enabled: Boolean(id) }); }
export function useDestinations() { return useQuery({ queryKey: queryKeys.destinations, queryFn: async () => mockDestinations }); }
export function useNotifications(filters?: NotificationListParams) { return useQuery({ queryKey: queryKeys.notifications(filters), queryFn: () => notificationApi.list(filters), refetchInterval: 15_000 }); }
export function useNotification(id: string) { return useQuery({ queryKey: queryKeys.notification(id), queryFn: () => notificationApi.get(id), enabled: Boolean(id) }); }
export function useNotificationReactions(id: string, { includeInactive = false } = {}) { return useQuery({ queryKey: queryKeys.reactions(id, includeInactive), queryFn: () => notificationApi.getReactions(id, includeInactive), enabled: Boolean(id), refetchInterval: 10_000 }); }

export function useInstallations() {
  return useQuery({ queryKey: queryKeys.installations, queryFn: installationApi.list });
}

export function useResolveDestination() {
  return useMutation({ mutationFn: destinationApi.resolve });
}

export function useDisconnectDestination() {
  return useMutation({ mutationFn: destinationApi.disconnect });
}

export function useSendNotification() {
  return useMutation({ mutationFn: notificationApi.send });
}

export function useHealth() { return useQuery({ queryKey: queryKeys.health, queryFn: systemApi.health, refetchInterval: 30_000, retry: 1 }); }
