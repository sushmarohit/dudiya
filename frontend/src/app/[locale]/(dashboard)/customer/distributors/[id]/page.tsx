"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDistributorDetail } from "@/hooks/use-customer";
import { formatCurrency } from "@/lib/utils";
import { isSubscriptionFlowEnabled } from "@/lib/feature-flags";

export default function DistributorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tCustomer = useTranslations("customer");
  const tCommon = useTranslations("common");
  const tEmpty = useTranslations("empty");
  const { data, isLoading, error } = useDistributorDetail(id);

  if (isLoading) {
    return <p className="text-slate-500">{tCommon("loading")}</p>;
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load distributor details.
      </div>
    );
  }

  const isLive = data.setupStatus === "GO_LIVE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{data.businessName}</h1>
        <p className="text-slate-600">
          {data.city || "—"} · {data.serviceRadiusKm} km
        </p>
      </div>

      {!isLive && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-800">
            This distributor is not currently accepting subscriptions.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tCommon("product")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.pricing?.length ? (
            <p className="text-slate-500">{tEmpty("noResults")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.pricing.filter((p) => p.active).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    {p.product?.name || p.productId}
                    {p.fatPercent ? ` (${p.fatPercent}% fat)` : ""}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(p.pricePerUnit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tCommon("deliverySlot")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.deliverySlots?.length ? (
            <p className="text-slate-500">{tEmpty("noResults")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.deliverySlots.filter((s) => s.active).map((s) => (
                <li key={s.id}>
                  {s.label}: {s.startTime} – {s.endTime}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isLive && isSubscriptionFlowEnabled() && (
        <Link href={`/customer/subscribe/${id}`}>
          <Button>{tCustomer("subscribe.confirmSubscription")}</Button>
        </Link>
      )}
    </div>
  );
}
