import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Notification, NotificationType } from "@/types";

export type UnreadCountResponse = {
  count: number;
  latestCreatedAt?: string | null;
  latestTitle?: string | null;
  latestBody?: string | null;
};

/** Fallback poll while SSE is disconnected. */
export const UNREAD_COUNT_FALLBACK_POLL_MS = 60_000;

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

export function useUnreadNotificationCount(options?: {
  /** Poll interval in ms. Pass `false` to only read the shared cache (no polling). */
  pollMs?: number | false;
}) {
  const pollMs =
    options?.pollMs === false
      ? false
      : (options?.pollMs ?? UNREAD_COUNT_FALLBACK_POLL_MS);

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await api.get<UnreadCountResponse>(
        "/notifications/unread-count",
      );
      return res.data;
    },
    // Avoid refetch storms when multiple components mount/remount.
    staleTime: 30_000,
    // Only the dashboard watcher should poll; bell just shares this cache.
    refetchInterval: pollMs,
    // Stop network traffic when the browser tab is in the background.
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
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
