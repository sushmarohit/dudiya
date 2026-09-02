"use client";

import { useEffect, useRef } from "react";
import { showToast } from "@/components/providers";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

/**
 * Polls unread notifications and toasts when a newer notification arrives.
 * Mount once in the dashboard shell.
 */
export function NotificationArrivalWatcher() {
  const { data } = useUnreadNotificationCount({ pollMs: 15_000 });
  const prevLatestRef = useRef<string | null>(null);
  const primedRef = useRef(false);

  useEffect(() => {
    if (!data) return;

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
  }, [data]);

  return null;
}
