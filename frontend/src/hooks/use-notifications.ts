import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Notification, NotificationType } from "@/types";

export type UnreadCountResponse = {
  count: number;
  latestCreatedAt?: string | null;
  latestTitle?: string | null;
  latestBody?: string | null;
};

export function useNotifications(page = 1, type?: NotificationType) {
  return useQuery({
    queryKey: ["notifications", page, type],
    queryFn: async () => {
      const res = await api.get<{
        items: Notification[];
        total: number;
        page: number;
        limit: number;
      }>("/notifications", { params: { page, type } });
      return res.data;
    },
  });
}

export function useUnreadNotificationCount(options?: { pollMs?: number }) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await api.get<UnreadCountResponse>(
        "/notifications/unread-count",
      );
      return res.data;
    },
    refetchInterval: options?.pollMs ?? 15_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/notifications/mark-all-read");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
