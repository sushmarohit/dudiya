"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import type { DeliverySlot } from "@/types";

interface DeliverySlotSelectProps {
  id?: string;
  label?: string;
  slots: DeliverySlot[];
  value?: string;
  error?: string;
  disabled?: boolean;
  onChange: (slotId: string) => void;
}

export function DeliverySlotSelect({
  id = "deliverySlotId",
  label,
  slots,
  value,
  error,
  disabled,
  onChange,
}: DeliverySlotSelectProps) {
  const tc = useTranslations("common");
  const tf = useTranslations("forms");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label ?? tc("deliverySlot")}</Label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{tf("selectSlot")}</option>
        {slots.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label} ({s.startTime}–{s.endTime})
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
