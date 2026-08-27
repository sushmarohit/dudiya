"use client";

import { useTranslations } from "next-intl";
import { getErrorMessage } from "@/lib/i18n-errors";

export function useApiErrorMessage() {
  const t = useTranslations();

  return (error: unknown) =>
    getErrorMessage(error, (key, params) =>
      t(key as Parameters<typeof t>[0], params as Record<string, string>),
    );
}
