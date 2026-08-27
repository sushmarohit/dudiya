"use client";

import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tCustomer = useTranslations("customer");

  return (
    <AuthGuard allowedRoles={["CUSTOMER"]}>
      <DashboardLayout role="CUSTOMER">
        <div aria-label={tCustomer("profile.title")}>{children}</div>
      </DashboardLayout>
    </AuthGuard>
  );
}
