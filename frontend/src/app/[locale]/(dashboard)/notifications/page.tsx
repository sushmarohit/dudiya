"use client";

import { useTranslations } from "next-intl";
import { Bell, CheckCheck } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/responsive-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { useAuthStore } from "@/store/auth-store";
import {
  getNotificationAction,
  notificationTypeLabelKey,
} from "@/lib/notification-actions";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

function relativeTime(iso: string, locale: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleString(locale);
}

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const handleOpen = async (n: Notification) => {
    const action = getNotificationAction(n, role);
    if (!n.readAt) {
      try {
        await markRead.mutateAsync(n.id);
      } catch {
        // still navigate
      }
    }
    if (action) {
      router.push(action.href);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={t("title")} description={t("description")} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || !data?.items.some((n) => !n.readAt)}
        >
          <CheckCheck className="mr-1.5 h-4 w-4" />
          {t("markAllRead")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-slate-500">{tc("loading")}</p>
      ) : !data?.items.length ? (
        <EmptyState
          icon={Bell}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <ul className="space-y-2">
          {data.items.map((n) => {
            const action = getNotificationAction(n, role);
            const unread = !n.readAt;
            return (
              <li
                key={n.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  unread
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => void handleOpen(n)}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t(notificationTypeLabelKey(n.type) as never)}
                    </p>
                    <p className="mt-0.5 font-medium text-slate-900">{n.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {relativeTime(n.createdAt, "en-IN")}
                      {unread ? ` · ${t("unread")}` : ""}
                    </p>
                  </button>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {action ? (
                      <Button
                        size="sm"
                        onClick={() => void handleOpen(n)}
                      >
                        {t(action.labelKey as never)}
                      </Button>
                    ) : null}
                    {unread ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markRead.mutate(n.id)}
                      >
                        {t("markRead")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {role === "CUSTOMER" ? (
        <p className="text-center text-xs text-slate-500">
          <Link href="/customer/find-distributor" className="underline">
            {t("findDistributorLink")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
