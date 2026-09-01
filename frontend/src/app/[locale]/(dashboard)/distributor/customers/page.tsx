"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useDistributorCustomers } from "@/hooks/use-distributor";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";

export default function DistributorCustomersPage() {
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const tEmpty = useTranslations("empty");
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useDistributorCustomers(search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={tDistributor("customers.list.title")}
          description={tDistributor("customers.list.description")}
        />
        <Link href="/distributor/customers/new" className="shrink-0">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {tDistributor("customers.list.addCustomer")}
          </Button>
        </Link>
      </div>

      <Input
        placeholder={tDistributor("customers.list.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm"
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load customers.
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">{tCommon("loading")}</p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            {tEmpty("noCustomers")}
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("name")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("phone")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("city")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Onboarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((customer) => (
                <tr key={customer.id} className="bg-white hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/distributor/customers/${customer.id}`}
                      className="text-emerald-700 hover:underline"
                    >
                      {customer.user?.name || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {customer.user?.phone || "—"}
                  </td>
                  <td className="px-4 py-3">{customer.city || "—"}</td>
                  <td className="px-4 py-3">{customer.onboardedVia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
