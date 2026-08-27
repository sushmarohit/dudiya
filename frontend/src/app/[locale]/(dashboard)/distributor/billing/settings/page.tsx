"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/responsive-table";
import {
  useBillingSettings,
  useUpdateBillingSettings,
} from "@/hooks/use-billing";

export default function BillingSettingsPage() {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const { data, isLoading } = useBillingSettings();
  const update = useUpdateBillingSettings();

  if (isLoading || !data) {
    return <p className="text-slate-500">{tc("loading")}</p>;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title={t("settingsTitle")} description={t("settingsDescription")} />
      <div className="space-y-4 rounded-lg border bg-white p-4">
        <div>
          <Label>{t("billingCycle")}</Label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={data.billingCycle}
            onChange={(e) =>
              update.mutate({
                billingCycle: e.target.value as "WEEKLY" | "BI_WEEKLY" | "MONTHLY",
              })
            }
          >
            <option value="WEEKLY">Weekly</option>
            <option value="BI_WEEKLY">Bi-weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
        <div>
          <Label>{t("dueDays")}</Label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={data.billingDueDays}
            onChange={(e) =>
              update.mutate({ billingDueDays: parseInt(e.target.value, 10) })
            }
          />
        </div>
        <Button disabled={update.isPending}>{tc("save")}</Button>
      </div>
    </div>
  );
}
