"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useConfirmSubscriptionEnd,
  useRejectSubscriptionEnd,
  useRequestSubscriptionEnd,
  useSubscriptionEndStatus,
} from "@/hooks/use-subscription-end";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

type Party = "customer" | "distributor";

export function SubscriptionEndPanel({
  party,
  subscriptionId,
  status,
}: {
  party: Party;
  subscriptionId: string;
  status: string;
}) {
  const t = useTranslations("subscriptionEnd");
  const tc = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const [reason, setReason] = useState("");

  const { data, isLoading, refetch } = useSubscriptionEndStatus(
    party,
    subscriptionId,
  );
  const requestEnd = useRequestSubscriptionEnd(party);
  const confirmEnd = useConfirmSubscriptionEnd(party);
  const rejectEnd = useRejectSubscriptionEnd(party);

  const endRequest = data?.endRequest;
  const preview = data?.settlementPreview;
  const isPending = status === "PENDING_CANCEL" || endRequest?.status === "PENDING";
  const isCancelled = status === "CANCELLED";

  const iAmCustomer = party === "customer";
  const myConfirmed = iAmCustomer
    ? !!endRequest?.customerConfirmedAt
    : !!endRequest?.distributorConfirmedAt;
  const otherConfirmed = iAmCustomer
    ? !!endRequest?.distributorConfirmedAt
    : !!endRequest?.customerConfirmedAt;
  const iAmInitiator =
    !!endRequest &&
    ((iAmCustomer && endRequest.initiatedBy === "CUSTOMER") ||
      (!iAmCustomer && endRequest.initiatedBy === "DISTRIBUTOR"));

  const handleRequest = async () => {
    const ok = await confirm({
      title: t("requestTitle"),
      description: t("requestDescription"),
      confirmLabel: t("requestConfirm"),
    });
    if (!ok) return;
    try {
      await requestEnd.mutateAsync({
        id: subscriptionId,
        reason: reason.trim() || undefined,
      });
      showToast(t("requestSent"), "success");
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleConfirm = async () => {
    const ok = await confirm({
      title: t("confirmTitle"),
      description: t("confirmDescription"),
      confirmLabel: t("confirmAction"),
    });
    if (!ok) return;
    try {
      await confirmEnd.mutateAsync(subscriptionId);
      showToast(t("confirmed"), "success");
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleReject = async () => {
    const ok = await confirm({
      title: t("rejectTitle"),
      description: t("rejectDescription"),
      confirmLabel: t("rejectAction"),
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await rejectEnd.mutateAsync(subscriptionId);
      showToast(t("rejected"), "success");
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  if (isLoading) {
    return <p className="text-slate-500">{tc("loading")}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">{t("description")}</p>

        {preview && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
            <p className="font-medium">{t("settlementPreview")}</p>
            <p>
              {t("period")}: {formatDate(preview.periodStart)} –{" "}
              {formatDate(preview.periodEnd)}
            </p>
            <p>
              {t("deliveries")}: {preview.deliveryCount} · {t("total")}:{" "}
              {formatCurrency(preview.total)}
            </p>
            {preview.lines.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
                {preview.lines.map((line) => (
                  <li key={line.deliveryItemId}>
                    {formatDate(line.deliveryDate)} · {line.productName} ·{" "}
                    {line.quantity} × {formatCurrency(line.unitPrice)} ={" "}
                    {formatCurrency(line.lineTotal)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {status === "ACTIVE" && !isPending && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("reason")}</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
              />
            </div>
            <Button
              variant="destructive"
              onClick={() => void handleRequest()}
              disabled={requestEnd.isPending}
            >
              {t("requestEnd")}
            </Button>
          </div>
        )}

        {isPending && endRequest && (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">
              {t("pendingBanner")}
            </p>
            <p className="text-xs text-amber-800">
              {t("initiatedBy")}: {endRequest.initiatedBy}
              {endRequest.reason ? ` · ${endRequest.reason}` : ""}
            </p>
            <p className="text-xs text-amber-800">
              {t("yourConfirm")}: {myConfirmed ? t("yes") : t("no")} ·{" "}
              {t("otherConfirm")}: {otherConfirmed ? t("yes") : t("no")}
            </p>
            <div className="flex flex-wrap gap-2">
              {!myConfirmed && (
                <Button
                  onClick={() => void handleConfirm()}
                  disabled={confirmEnd.isPending}
                >
                  {t("confirmAction")}
                </Button>
              )}
              {!iAmInitiator && (
                <Button
                  variant="outline"
                  onClick={() => void handleReject()}
                  disabled={rejectEnd.isPending}
                >
                  {t("rejectAction")}
                </Button>
              )}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="space-y-3 text-sm">
            <p className="font-medium text-emerald-800">{t("ended")}</p>
            {party === "customer" ? (
              <p className="text-slate-600">{t("endedHint")}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {endRequest?.settlementBillId && (
                <Link
                  href={
                    party === "customer"
                      ? `/customer/bills/${endRequest.settlementBillId}`
                      : `/distributor/bills/${endRequest.settlementBillId}`
                  }
                >
                  <Button size="sm" variant="outline">
                    {t("viewSettlement")}
                  </Button>
                </Link>
              )}
              {!endRequest?.settlementBillId && (
                <p className="w-full text-slate-600">{t("noSettlementNeeded")}</p>
              )}
              {party === "customer" ? (
                <>
                  <Link href="/customer/find-distributor">
                    <Button size="sm">{t("startFresh")}</Button>
                  </Link>
                  <Link href="/customer/bills">
                    <Button size="sm" variant="ghost">
                      {t("viewBills")}
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
