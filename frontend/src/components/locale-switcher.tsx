"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { PreferredLocale } from "@/types";

const LOCALE_LABELS: Record<AppLocale, "localeEn" | "localeHi"> = {
  en: "localeEn",
  hi: "localeHi",
};

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  async function switchLocale(nextLocale: AppLocale) {
    setOpen(false);
    if (nextLocale === locale) return;

    if (accessToken) {
      try {
        await api.patch("/auth/locale", { preferredLocale: nextLocale });
        if (user) {
          updateUser({ preferredLocale: nextLocale as PreferredLocale });
        }
      } catch {
        // Locale UI still switches if API is unavailable
      }
    }

    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-[var(--brand-navy)] transition-colors hover:bg-[var(--brand-sand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-saffron)]",
          open && "bg-[var(--brand-sand)]",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("language")}
      >
        <Globe className="h-5 w-5 shrink-0" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {locale}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-[var(--brand-border)] bg-[var(--brand-milk)] py-1 shadow-lg"
        >
          {routing.locales.map((loc) => {
            const selected = locale === loc;
            return (
              <button
                key={loc}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => switchLocale(loc)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                  selected
                    ? "bg-[var(--brand-sand)] font-medium text-[var(--brand-navy)]"
                    : "text-[var(--brand-ink)] hover:bg-[var(--brand-sand)]",
                )}
              >
                <span>{t(LOCALE_LABELS[loc])}</span>
                {selected ? (
                  <Check
                    className="h-4 w-4 shrink-0 text-[var(--brand-saffron-deep)]"
                    aria-hidden
                  />
                ) : (
                  <span className="h-4 w-4 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
