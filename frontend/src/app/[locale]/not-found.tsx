"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function NotFound() {
  const router = useRouter();
  const t = useTranslations("common");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{t("pageNotFound")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("pageNotFoundDescription")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}
