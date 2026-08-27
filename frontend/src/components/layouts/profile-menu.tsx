"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types";

function getProfileHref(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/settings";
    case "DISTRIBUTOR":
      return "/distributor/settings";
    case "CUSTOMER":
      return "/customer/profile";
    default:
      return "/";
  }
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function ProfileMenu({
  role,
  userName,
  userEmail,
  onSignOut,
  className,
}: {
  role: UserRole;
  userName?: string | null;
  userEmail?: string | null;
  onSignOut: () => void;
  className?: string;
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileHref = getProfileHref(role);
  const profileLabel =
    role === "CUSTOMER" ? t("customerNav.profile") : t(`${role === "ADMIN" ? "adminNav" : "distributorNav"}.settings`);
  const ProfileIcon = role === "CUSTOMER" ? UserCircle : Settings;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-9 max-w-[12rem] items-center gap-2 rounded-lg border border-transparent px-1.5 py-1 text-left transition-colors hover:bg-slate-100 sm:max-w-none sm:px-2",
          open && "border-slate-200 bg-slate-50",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("profileMenu")}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
          {getInitials(userName)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-slate-900">
            {userName ?? userEmail?.split("@")[0] ?? tc("loading")}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {userEmail}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 shrink-0 text-slate-400 transition-transform sm:block",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3 sm:hidden">
            <p className="truncate text-sm font-medium text-slate-900">
              {userName}
            </p>
            <p className="truncate text-xs text-slate-500">{userEmail}</p>
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <ProfileIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            {profileLabel}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            {tc("signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
