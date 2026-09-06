"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { formatDate, formatDateKey, dayFromDateKey } from "@/lib/utils";
import type { SubscriptionFrequency } from "@/types";
import { cn } from "@/lib/utils";
import type { SchedulePreviewResponse } from "@/types";

interface DeliverySchedulePreviewProps {
  subscriptionId?: string;
  role?: "customer" | "distributor";
  scheduleParams?: {
    frequency: SubscriptionFrequency;
    startDate: string;
  };
  days?: number;
  className?: string;
}

function defaultRange(days: number, startDate?: string) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  let fromKey = formatDateKey(from);
  if (startDate && startDate > fromKey) {
    fromKey = startDate;
  }
  const to = new Date(
    Number(fromKey.slice(0, 4)),
    Number(fromKey.slice(5, 7)) - 1,
    Number(fromKey.slice(8, 10)),
  );
  to.setDate(to.getDate() + days);
  return {
    from: fromKey,
    to: formatDateKey(to),
  };
}

export function DeliverySchedulePreview({
  subscriptionId,
  role = "customer",
  scheduleParams,
  days = 30,
  className,
}: DeliverySchedulePreviewProps) {
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const ts = useTranslations("subscription");
  const range = useMemo(
    () => defaultRange(days, scheduleParams?.startDate),
    [days, scheduleParams?.startDate],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "schedule-preview",
      subscriptionId,
      role,
      scheduleParams,
      range.from,
      range.to,
    ],
    queryFn: async () => {
      // Prefer draft params so frequency/startDate edits update the preview immediately
      if (scheduleParams?.frequency && scheduleParams.startDate) {
        const res = await api.post<SchedulePreviewResponse>(
          "/subscriptions/preview-schedule",
          {
            ...scheduleParams,
            ...range,
          },
        );
        return res.data;
      }
      if (subscriptionId) {
        const base =
          role === "customer"
            ? `/customers/subscriptions/${subscriptionId}/preview`
            : `/distributor/subscriptions/${subscriptionId}/preview`;
        const res = await api.get<SchedulePreviewResponse>(base, {
          params: range,
        });
        return res.data;
      }
      return null;
    },
    enabled: Boolean(
      subscriptionId || (scheduleParams?.frequency && scheduleParams.startDate),
    ),
  });

  if (!subscriptionId && !scheduleParams?.frequency) {
    return null;
  }

  if (isLoading) {
    return (
      <p className={cn("text-sm text-slate-500", className)}>
        {tc("loading")} {ts("schedulePreview")}
      </p>
    );
  }

  if (error || !data) {
    return (
      <p className={cn("text-sm text-red-600", className)}>
        {te("GENERIC")}
      </p>
    );
  }

  const pausedSet = new Set(data.pausedDates ?? []);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          {ts("schedulePreview")} ({days} {tc("date")}: {formatDate(data.from)} –{" "}
          {formatDate(data.to)})
        </span>
        <span>{ts("deliveriesCount", { count: data.dates.length })}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {data.dates.map((date: string) => {
          const paused = pausedSet.has(date);
          return (
            <div
              key={date}
              title={paused ? ts("pausedHint") : ts("schedulePreview")}
              className={cn(
                "rounded-md border px-1 py-2 text-center text-xs sm:text-sm",
                paused
                  ? "border-amber-200 bg-amber-50 text-amber-800 line-through"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800",
              )}
            >
              {dayFromDateKey(date)}
            </div>
          );
        })}
      </div>
      {pausedSet.size > 0 && (
        <p className="text-xs text-amber-700">
          {ts("pausedHint")}
        </p>
      )}
    </div>
  );
}
