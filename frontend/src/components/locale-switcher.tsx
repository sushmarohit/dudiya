"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { PreferredLocale } from "@/types";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  async function switchLocale(nextLocale: AppLocale) {
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
    <div
      className={cn(
        "inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium",
        className,
      )}
      role="group"
      aria-label={t("localeEn")}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            locale === loc
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100",
          )}
          aria-pressed={locale === loc}
        >
          {loc === "en" ? t("localeEn") : t("localeHi")}
        </button>
      ))}
    </div>
  );
}
