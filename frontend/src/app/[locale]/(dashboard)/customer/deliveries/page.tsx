"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";
import { useCustomerDeliveries } from "@/hooks/use-delivery";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export default function CustomerDeliveriesPage() {
  const t = useTranslations("delivery");
  const tc = useTranslations("common");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const { data, isLoading } = useCustomerDeliveries(from, to);

  return (
    <div className="space-y-6">
      <PageHeader title={t("historyTitle")} description={t("historyDescription")} />
      <div className="flex gap-3">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
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
                <th className="px-4 py-3">{tc("date")}</th>
                <th className="px-4 py-3">{tc("product")}</th>
                <th className="px-4 py-3">{t("planned")}</th>
                <th className="px-4 py-3">{t("delivered")}</th>
                <th className="px-4 py-3">{tc("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((item) => (
                <tr key={item.id} className="bg-white">
                  <td className="px-4 py-3">{item.deliveryDate.split("T")[0]}</td>
                  <td className="px-4 py-3">{item.product?.name}</td>
                  <td className="px-4 py-3">{item.plannedQty}</td>
                  <td className="px-4 py-3">{item.deliveredQty ?? "—"}</td>
                  <td className="px-4 py-3">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
