"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/providers";
import {
  UNREAD_COUNT_FALLBACK_POLL_MS,
  useUnreadNotificationCount,
  type UnreadCountResponse,
} from "@/hooks/use-notifications";
import { openNotificationStream } from "@/lib/notification-sse";
import { useAuthStore } from "@/store/auth-store";

/**
 * Prefers SSE for live badge/toast updates.
 * Falls back to unread-count polling when the stream is down.
 * Mount once in the dashboard shell.
 */
export function NotificationArrivalWatcher() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [sseLive, setSseLive] = useState(false);
  const { data } = useUnreadNotificationCount({
    pollMs: sseLive ? false : UNREAD_COUNT_FALLBACK_POLL_MS,
  });
  const prevLatestRef = useRef<string | null>(null);
  const primedRef = useRef(false);

  useEffect(() => {
    if (!accessToken) return;

    const abort = new AbortController();
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const applyPayload = (payload: UnreadCountResponse, toastOnNew: boolean) => {
      queryClient.setQueryData<UnreadCountResponse>(
        ["notifications", "unread-count"],
        payload,
      );

      const latest = payload.latestCreatedAt ?? null;
      if (!primedRef.current) {
        primedRef.current = true;
        prevLatestRef.current = latest;
        return;
      }

      if (!toastOnNew) {
        if (latest) prevLatestRef.current = latest;
        return;
      }

      if (latest && latest !== prevLatestRef.current) {
        prevLatestRef.current = latest;
        if ((payload.count ?? 0) > 0) {
          const message =
            payload.latestTitle ||
            payload.latestBody ||
            "You have a new notification";
          showToast(message, "info");
        }
      } else if (latest) {
        prevLatestRef.current = latest;
      }
    };

    const connect = () => {
      if (cancelled) return;
      void openNotificationStream(
        {
          onConnected: () => {
            attempt = 0;
            setSseLive(true);
          },
          onDisconnected: () => {
            setSseLive(false);
          },
          onNotification: (payload) => {
            const wasPrimed = primedRef.current;
            applyPayload(payload, true);
            // Refresh list pages only for live arrivals, not the connect snapshot.
            if (wasPrimed) {
              void queryClient.invalidateQueries({
                queryKey: ["notifications"],
                predicate: (q) => q.queryKey[1] !== "unread-count",
              });
            }
          },
        },
        abort.signal,
      )
        .catch(() => {
          // connection ended or failed
        })
        .finally(() => {
          if (cancelled || abort.signal.aborted) return;
          setSseLive(false);
          attempt += 1;
          const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
          retryTimer = setTimeout(connect, delay);
        });
    };

    connect();

    return () => {
      cancelled = true;
      abort.abort();
      if (retryTimer) clearTimeout(retryTimer);
      setSseLive(false);
    };
  }, [accessToken, queryClient]);

  // Polling fallback toast path (when SSE is down).
  useEffect(() => {
    if (sseLive || !data) return;

    const latest = data.latestCreatedAt ?? null;
    if (!primedRef.current) {
      primedRef.current = true;
      prevLatestRef.current = latest;
      return;
    }

    if (latest && latest !== prevLatestRef.current) {
      prevLatestRef.current = latest;
      if (data.count > 0) {
        const message =
          data.latestTitle ||
          data.latestBody ||
          "You have a new notification";
        showToast(message, "info");
      }
    } else if (latest) {
      prevLatestRef.current = latest;
    }
  }, [data, sseLive]);

  return null;
}
