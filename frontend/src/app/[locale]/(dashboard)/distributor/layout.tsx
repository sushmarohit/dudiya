"use client";

import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tDistributor = useTranslations("distributor");

  return (
    <AuthGuard allowedRoles={["DISTRIBUTOR"]}>
      <DashboardLayout role="DISTRIBUTOR">
        <div aria-label={tDistributor("dashboard.title")}>{children}</div>
      </DashboardLayout>
    </AuthGuard>
  );
}
