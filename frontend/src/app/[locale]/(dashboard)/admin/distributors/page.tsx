"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAdminDistributors,
  useSuspendDistributor,
} from "@/hooks/use-admin";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";

function StatusBadge({ label, status }: { label: string; status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-slate-100 text-slate-800"}`}
    >
      {label}
    </span>
  );
}

export default function AdminDistributorsPage() {
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useAdminDistributors({ search });
  const suspend = useSuspendDistributor();
  const approvalStatusLabels: Record<string, string> = {
    PENDING: tAdmin("verification.pending"),
    APPROVED: tAdmin("verification.approved"),
    REJECTED: tAdmin("verification.rejected"),
  };

  const handleSuspend = async (id: string, suspendFlag: boolean) => {
    const ok = await confirm({
      title: tCommon("confirmSuspendTitle"),
      description: tCommon("confirmSuspendDescription"),
      confirmLabel: tCommon("statuses.suspended"),
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await suspend.mutateAsync({ id, suspend: suspendFlag });
      showToast(
        suspendFlag ? tCommon("statuses.suspended") : tCommon("statuses.active"),
        "success",
      );
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tAdmin("distributors.title")}
        description={tAdmin("distributors.description")}
      />

      <Input
        placeholder={tAdmin("distributors.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm"
      />

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
            {tAdmin("distributors.title")}
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable minWidth="720px">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tAdmin("distributors.businessName")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("status")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tAdmin("distributors.identity")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Setup</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("city")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((d) => (
                <tr key={d.id} className="bg-white">
                  <td className="px-4 py-3 font-medium">{d.businessName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={approvalStatusLabels[d.approvalStatus] || d.approvalStatus}
                      status={d.approvalStatus}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={
                        d.identityVerified
                          ? tAdmin("verification.identityVerified")
                          : tAdmin("verification.identityUnverified")
                      }
                      status={d.identityVerified ? "APPROVED" : "PENDING"}
                    />
                  </td>
                  <td className="px-4 py-3">{d.setupStatus}</td>
                  <td className="px-4 py-3">{d.city || "—"}</td>
                  <td className="px-4 py-3">
                    {(d.approvalStatus === "APPROVED" ||
                      d.user?.status === "ACTIVE") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleSuspend(
                            d.id,
                            d.user?.status !== "SUSPENDED",
                          )
                        }
                      >
                        {d.user?.status === "SUSPENDED"
                          ? tCommon("statuses.active")
                          : tCommon("statuses.suspended")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
