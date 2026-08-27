"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDistributorSubscriptions } from "@/hooks/use-distributor";
import { SubscriptionEndPanel } from "@/components/subscription/subscription-end-panel";
import { formatDate } from "@/lib/utils";

export default function DistributorSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const { data, isLoading, error } = useDistributorSubscriptions();
  const subscription = data?.find((s) => s.id === id);

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
            {subscription.status}
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

      <SubscriptionEndPanel
        party="distributor"
        subscriptionId={id}
        status={subscription.status}
      />
    </div>
  );
}
