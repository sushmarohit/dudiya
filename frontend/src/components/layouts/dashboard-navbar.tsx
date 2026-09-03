"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ProfileMenu } from "@/components/layouts/profile-menu";
import { DudiyaMark } from "@/components/brand/dudiya-mark";
import type { UserRole } from "@/types";

function getPortalTitleKey(role: UserRole): "admin" | "distributor" | "customer" {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "DISTRIBUTOR":
      return "distributor";
    case "CUSTOMER":
      return "customer";
    default:
      return "admin";
  }
}

export function DashboardNavbar({
  role,
  userName,
  userEmail,
  onSignOut,
  onOpenMenu,
  showMenuButton = false,
  className,
}: {
  role: UserRole;
  userName?: string | null;
  userEmail?: string | null;
  onSignOut: () => void;
  onOpenMenu?: () => void;
  showMenuButton?: boolean;
  className?: string;
}) {
  const tc = useTranslations("common");
  const tPortal = useTranslations("nav.portalTitles");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 shadow-sm sm:h-16 sm:gap-4 sm:px-4 lg:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showMenuButton && onOpenMenu ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 lg:hidden"
            onClick={onOpenMenu}
            aria-label={tc("openMenu")}
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}

        <Link
          href={
            role === "ADMIN"
              ? "/admin/dashboard"
              : role === "DISTRIBUTOR"
                ? "/distributor/dashboard"
                : "/customer/profile"
          }
          className="flex min-w-0 items-center gap-2.5"
        >
          <DudiyaMark className="h-9 w-9" decorative />
          <span className="min-w-0">
            <span className="block truncate font-[family-name:var(--font-display)] text-sm font-semibold text-slate-900 sm:text-base">
              {tc("appName")}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {tPortal(getPortalTitleKey(role))}
            </span>
          </span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <LocaleSwitcher />
        <div className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
        <NotificationBell />
        <div className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
        <ProfileMenu
          role={role}
          userName={userName}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />
      </div>
    </header>
  );
}
