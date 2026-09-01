"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";
import { useDistributorBills, useRunBillingCycle } from "@/hooks/use-billing";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FeatureDisabledNotice } from "@/components/feature-disabled-notice";
import { isBillingEnabled } from "@/lib/feature-flags";

export default function DistributorBillingPage() {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const { data, isLoading } = useDistributorBills();
  const runCycle = useRunBillingCycle();

  if (!isBillingEnabled()) {
    return (
      <FeatureDisabledNotice
        feature="billing"
        backHref="/distributor/dashboard"
      />
    );
  }

  const handleRunCycle = async () => {
    const ok = await confirm({
      title: tc("confirmRunBillingTitle"),
      description: tc("confirmRunBillingDescription"),
      confirmLabel: t("runCycle"),
    });
    if (!ok) return;
    try {
      await runCycle.mutateAsync(undefined);
      showToast(tc("created"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} description={t("description")} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleRunCycle()} disabled={runCycle.isPending}>
            {t("runCycle")}
          </Button>
          <Link href="/distributor/billing/settings">
            <Button variant="outline">{t("settings")}</Button>
          </Link>
          <Link href="/distributor/billing/dues">
            <Button variant="outline">{t("dues")}</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500">{tc("loading")}</p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">{tc("name")}</th>
                <th className="px-4 py-3">{t("cycle")}</th>
                <th className="px-4 py-3">{t("total")}</th>
                <th className="px-4 py-3">{t("paid")}</th>
                <th className="px-4 py-3">{tc("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((bill) => (
                <tr key={bill.id} className="bg-white hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/distributor/bills/${bill.id}`} className="text-emerald-700 hover:underline">
                      {bill.customer?.user?.name ?? bill.customerId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {bill.cycleStart.split("T")[0]} – {bill.cycleEnd.split("T")[0]}
                  </td>
                  <td className="px-4 py-3">₹{Number(bill.total).toFixed(2)}</td>
                  <td className="px-4 py-3">₹{Number(bill.amountPaid).toFixed(2)}</td>
                  <td className="px-4 py-3">{bill.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
