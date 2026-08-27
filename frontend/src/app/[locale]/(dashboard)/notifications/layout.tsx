"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuthStore } from "@/store/auth-store";

function NotificationsShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)!;

  return <DashboardLayout role={user.role}>{children}</DashboardLayout>;
}

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <NotificationsShell>{children}</NotificationsShell>
    </AuthGuard>
  );
}
