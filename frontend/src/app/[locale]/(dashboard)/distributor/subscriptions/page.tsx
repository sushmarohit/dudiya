"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDistributorSubscriptions } from "@/hooks/use-distributor";
import type { SubscriptionFrequency } from "@/types";
import { formatDate } from "@/lib/utils";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";
import { isSubscriptionFlowEnabled } from "@/lib/feature-flags";

const FREQUENCY_MESSAGE_KEYS: Record<SubscriptionFrequency, string> = {
  DAILY: "daily",
  ALTERNATE_DAY: "alternateDay",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export default function DistributorSubscriptionsPage() {
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const tSubscription = useTranslations("subscription");
  const tEmpty = useTranslations("empty");
  const { data, isLoading, error } = useDistributorSubscriptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={tDistributor("subscriptions.title")}
          description={tDistributor("subscriptions.description")}
        />
        {isSubscriptionFlowEnabled() ? (
          <Link href="/distributor/subscriptions/create" className="shrink-0">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              {tDistributor("subscriptions.createSubscription")}
            </Button>
          </Link>
        ) : null}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load subscriptions.
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">{tCommon("loading")}</p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            {tEmpty("noSubscriptions")}
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable minWidth="760px">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("name")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("product")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Qty</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("frequency")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  {tCommon("status")}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Start</th>
                <th className="px-4 py-3 font-medium text-slate-600" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((s) => (
                <tr key={s.id} className="bg-white">
                  <td className="px-4 py-3">
                    {s.customer?.user?.name || s.customerId}
                  </td>
                  <td className="px-4 py-3">{s.product?.name || s.productId}</td>
                  <td className="px-4 py-3">{s.quantity}</td>
                  <td className="px-4 py-3">
                    {tSubscription(
                      `frequencies.${FREQUENCY_MESSAGE_KEYS[s.frequency]}`,
                    )}
                  </td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3">{formatDate(s.startDate)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/distributor/subscriptions/${s.id}`}>
                      <Button size="sm" variant="outline">
                        {tCommon("view")}
                      </Button>
                    </Link>
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
