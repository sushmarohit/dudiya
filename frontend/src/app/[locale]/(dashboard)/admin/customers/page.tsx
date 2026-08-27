"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAdminCustomers, useAdminCustomer } from "@/hooks/use-admin";
import { AdminCustomerDrawer } from "@/components/admin/admin-customer-drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";

export default function AdminCustomersPage() {
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { data, isLoading, error } = useAdminCustomers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: selectedCustomer } = useAdminCustomer(selectedId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tAdmin("customers.title")}
        description={tAdmin("customers.description")}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {tCommon("somethingWrong")}
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">{tCommon("loading")}</p>
      ) : !data?.length ? (
        <EmptyState
          icon={Users}
          title={tAdmin("customers.title")}
          description={tAdmin("customers.description")}
        />
      ) : (
        <ResponsiveTable>
          <table className="w-full text-sm">
            <caption className="sr-only">{tAdmin("customers.description")}</caption>
            <thead className="bg-slate-50 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("name")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("email")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("city")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("pincode")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer bg-white hover:bg-slate-50"
                  onClick={() => setSelectedId(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(c.id);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`${tAdmin("customers.title")}: ${c.user?.name || tCommon("name")}`}
                >
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {c.user?.name || "—"}
                  </td>
                  <td className="px-4 py-3">{c.user?.email || "—"}</td>
                  <td className="px-4 py-3">{c.city || "—"}</td>
                  <td className="px-4 py-3">{c.pincode || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}

      <AdminCustomerDrawer
        customer={selectedCustomer ?? null}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
