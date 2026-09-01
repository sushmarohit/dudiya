"use client";

import { useTranslations } from "next-intl";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";
import { useBillingDues } from "@/hooks/use-billing";
import { FeatureDisabledNotice } from "@/components/feature-disabled-notice";
import { isBillingEnabled } from "@/lib/feature-flags";

export default function BillingDuesPage() {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const { data, isLoading } = useBillingDues();

  if (!isBillingEnabled()) {
    return (
      <FeatureDisabledNotice
        feature="billing"
        backHref="/distributor/dashboard"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("duesTitle")} description={t("duesDescription")} />
      {isLoading ? (
        <p className="text-slate-500">{tc("loading")}</p>
      ) : (
        <ResponsiveTable>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">{tc("name")}</th>
                <th className="px-4 py-3">{tc("phone")}</th>
                <th className="px-4 py-3">{t("outstanding")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.map((row) => (
                <tr key={row.customerId} className="bg-white">
                  <td className="px-4 py-3">{row.customerName}</td>
                  <td className="px-4 py-3">{row.phone ?? "—"}</td>
                  <td className="px-4 py-3">₹{row.outstanding.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
