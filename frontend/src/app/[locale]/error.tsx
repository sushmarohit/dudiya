"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div
        className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm"
        role="alert"
      >
        <h1 className="text-xl font-bold text-slate-900">{t("somethingWrong")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("errorDescription")}</p>
        <Button className="mt-6" onClick={reset}>
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
