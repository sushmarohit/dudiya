"use client";

import { Building2, Users, Package, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminKpis } from "@/hooks/use-admin";

export default function AdminDashboardPage() {
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { data, isLoading, error } = useAdminKpis();

  const kpis = [
    {
      label: tAdmin("dashboard.kpis.totalDistributors"),
      value: data?.totalDistributors ?? 0,
      icon: Building2,
    },
    {
      label: tAdmin("dashboard.kpis.totalCustomers"),
      value: data?.totalCustomers ?? 0,
      icon: Users,
    },
    {
      label: tAdmin("dashboard.kpis.activeSubscriptions"),
      value: data?.activeSubscriptions ?? 0,
      icon: Package,
    },
    {
      label: tAdmin("dashboard.kpis.pendingVerifications"),
      value: data?.pendingVerifications ?? 0,
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tAdmin("dashboard.title")}
        </h1>
        <p className="text-slate-600">{tAdmin("dashboard.description")}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {tCommon("somethingWrong")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {kpi.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoading ? "—" : kpi.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
