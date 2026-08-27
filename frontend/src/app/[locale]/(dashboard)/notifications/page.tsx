"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/responsive-table";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("title")} description={t("description")} />
        <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
          {t("markAllRead")}
        </Button>
      </div>
      {isLoading ? (
        <p className="text-slate-500">{tc("loading")}</p>
      ) : (
        <ul className="space-y-2">
          {data?.items.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border p-4 ${n.readAt ? "bg-slate-50" : "bg-white"}`}
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-slate-600">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.readAt && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markRead.mutate(n.id)}
                  >
                    {t("markRead")}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
