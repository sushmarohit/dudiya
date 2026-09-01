"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";
import { useCustomerBills } from "@/hooks/use-billing";
import { FeatureDisabledNotice } from "@/components/feature-disabled-notice";
import { isBillingEnabled } from "@/lib/feature-flags";

export default function CustomerBillsPage() {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const { data, isLoading } = useCustomerBills();

  if (!isBillingEnabled()) {
    return (
      <FeatureDisabledNotice feature="billing" backHref="/customer/profile" />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("customerTitle")} description={t("customerDescription")} />
      {isLoading ? (
        <p className="text-slate-500">{tc("loading")}</p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">{t("empty")}</CardContent>
        </Card>
      ) : (
        <ResponsiveTable>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">{t("distributor")}</th>
                <th className="px-4 py-3">{t("cycle")}</th>
                <th className="px-4 py-3">{t("total")}</th>
                <th className="px-4 py-3">{tc("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((bill) => (
                <tr key={bill.id} className="bg-white">
                  <td className="px-4 py-3">
                    <Link href={`/customer/bills/${bill.id}`} className="text-emerald-700 hover:underline">
                      {bill.distributor?.businessName ?? "Bill"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {bill.cycleStart.split("T")[0]} – {bill.cycleEnd.split("T")[0]}
                  </td>
                  <td className="px-4 py-3">₹{Number(bill.total).toFixed(2)}</td>
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
