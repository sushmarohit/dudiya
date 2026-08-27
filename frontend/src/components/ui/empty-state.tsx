"use client";

import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateKey = "noCustomers" | "noDistributors" | "noSubscriptions" | "noResults";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  titleKey?: EmptyStateKey;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  titleKey,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const t = useTranslations("empty");
  const resolvedTitle = titleKey ? t(titleKey) : (title ?? t("noResults"));

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center ${className ?? ""}`}
      role="status"
    >
      {Icon && <Icon className="mb-3 h-10 w-10 text-slate-400" aria-hidden="true" />}
      <h3 className="text-base font-semibold text-slate-900">{resolvedTitle}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
