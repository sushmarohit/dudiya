"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

export function NotificationBell({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { data: count = 0 } = useUnreadNotificationCount();

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100",
        className,
      )}
      aria-label={t("notifications")}
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-medium text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
