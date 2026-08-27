"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { createFormSchemas } from "@/lib/form-schemas";

export function useFormSchemas() {
  const v = useTranslations("validation");

  return useMemo(
    () => createFormSchemas((key) => v(key as Parameters<typeof v>[0])),
    [v],
  );
}
