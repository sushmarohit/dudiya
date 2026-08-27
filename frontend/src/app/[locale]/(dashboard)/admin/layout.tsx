"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardLayout role="ADMIN">{children}</DashboardLayout>
    </AuthGuard>
  );
}
