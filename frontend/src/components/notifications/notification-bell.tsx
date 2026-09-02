"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

export function NotificationBell({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { data } = useUnreadNotificationCount({ pollMs: 15_000 });
  const count = data?.count ?? 0;

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
        className,
      )}
      aria-label={
        count > 0
          ? `${t("notifications")} (${count} unread)`
          : t("notifications")
      }
    >
      <Bell className="h-5 w-5" aria-hidden />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
