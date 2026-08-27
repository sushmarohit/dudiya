"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/responsive-table";

export default function AdminOperationsPage() {
  const t = useTranslations("admin.operations");
  const tc = useTranslations("common");

  const deliveries = useQuery({
    queryKey: ["admin", "operations", "deliveries"],
    queryFn: async () => {
      const res = await api.get("/admin/operations/deliveries");
      return res.data;
    },
  });

  const billing = useQuery({
    queryKey: ["admin", "operations", "billing"],
    queryFn: async () => {
      const res = await api.get("/admin/operations/billing");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      {deliveries.isLoading || billing.isLoading ? (
        <p className="text-slate-500">{tc("loading")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-medium">{t("deliveryStats")}</h3>
            <p className="mt-2 text-sm">Total: {deliveries.data?.total}</p>
            <p className="text-sm">Success rate: {(deliveries.data?.successRate * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-medium">{t("billingStats")}</h3>
            <p className="mt-2 text-sm">Billed: ₹{billing.data?.billed?.toFixed(2)}</p>
            <p className="text-sm">Collected: ₹{billing.data?.collected?.toFixed(2)}</p>
            <p className="text-sm">Outstanding: ₹{billing.data?.outstanding?.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
