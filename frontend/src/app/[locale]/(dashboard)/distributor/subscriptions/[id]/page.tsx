"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useApproveSubscription,
  useDistributorSubscriptions,
  useRejectSubscription,
} from "@/hooks/use-distributor";
import { SubscriptionEndPanel } from "@/components/subscription/subscription-end-panel";
import { formatDate } from "@/lib/utils";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { isSubscriptionApprovalEnabled } from "@/lib/feature-flags";
import { subscriptionStatusMessageKey } from "@/lib/subscription-status";

export default function DistributorSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const tApproval = useTranslations("subscriptionApproval");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const [rejectReason, setRejectReason] = useState("");
  const { data, isLoading, error, refetch } = useDistributorSubscriptions();
  const approve = useApproveSubscription();
  const reject = useRejectSubscription();
  const subscription = data?.find((s) => s.id === id);
  const pendingApproval =
    isSubscriptionApprovalEnabled() &&
    subscription?.status === "PENDING_APPROVAL";

  const handleApprove = async () => {
    const ok = await confirm({
      title: tApproval("approveTitle"),
      description: tApproval("approveDescription"),
      confirmLabel: tApproval("approve"),
    });
    if (!ok) return;
    try {
      await approve.mutateAsync(id);
      showToast(tApproval("approved"), "success");
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleReject = async () => {
    const ok = await confirm({
      title: tApproval("rejectTitle"),
      description: tApproval("rejectDescription"),
      confirmLabel: tApproval("reject"),
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await reject.mutateAsync({
        id,
        reason: rejectReason.trim() || undefined,
      });
      showToast(tApproval("rejected"), "success");
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  if (isLoading) {
    return <p className="text-slate-500">{tCommon("loading")}</p>;
  }

  if (error || !subscription) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load subscription.
        </div>
        <Link href="/distributor/subscriptions">
          <Button variant="outline">{tCommon("back")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {tDistributor("subscriptions.detailTitle")}
          </h1>
          <p className="text-slate-600">
            {subscription.product?.name} ·{" "}
            {subscription.customer?.user?.name || subscription.customerId}
          </p>
        </div>
        <Link href="/distributor/subscriptions">
          <Button variant="outline">{tCommon("back")}</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tCommon("status")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-slate-500">{tCommon("status")}:</span>{" "}
            {tCommon(subscriptionStatusMessageKey(subscription.status))}
          </p>
          <p>
            <span className="text-slate-500">{tCommon("quantity")}:</span>{" "}
            {subscription.quantity}
          </p>
          <p>
            <span className="text-slate-500">{tCommon("startDate")}:</span>{" "}
            {formatDate(subscription.startDate)}
          </p>
        </CardContent>
      </Card>

      {pendingApproval ? (
        <Card>
          <CardHeader>
            <CardTitle>{tApproval("distributorTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {tApproval("distributorDescription")}
            </p>
            <div className="space-y-2">
              <Label>{tApproval("rejectReason")}</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={tApproval("rejectReasonPlaceholder")}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void handleApprove()}
                disabled={approve.isPending || reject.isPending}
              >
                {tApproval("approve")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleReject()}
                disabled={approve.isPending || reject.isPending}
              >
                {tApproval("reject")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <SubscriptionEndPanel
          party="distributor"
          subscriptionId={id}
          status={subscription.status}
        />
      )}
    </div>
  );
}
