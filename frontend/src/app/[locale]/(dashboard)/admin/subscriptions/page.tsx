"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminSubscriptions } from "@/hooks/use-admin";
import { FREQUENCY_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";

export default function AdminSubscriptionsPage() {
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [status, setStatus] = useState<string>("");
  const { data, isLoading, error } = useAdminSubscriptions(
    status ? { status } : undefined,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={tAdmin("subscriptions.title")}
        description={tAdmin("subscriptions.description")}
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">{tCommon("status")}</option>
        <option value="ACTIVE">{tCommon("statuses.active")}</option>
        <option value="PAUSED">Paused</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {tCommon("somethingWrong")}
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">{tCommon("loading")}</p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            {tAdmin("subscriptions.title")}
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable minWidth="720px">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("product")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("quantity")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("frequency")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("status")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("startDate")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((s) => (
                <tr key={s.id} className="bg-white">
                  <td className="px-4 py-3 font-medium">
                    {s.product?.name || s.productId}
                  </td>
                  <td className="px-4 py-3">{s.quantity}</td>
                  <td className="px-4 py-3">
                    {FREQUENCY_LABELS[s.frequency]}
                  </td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3">{formatDate(s.startDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
