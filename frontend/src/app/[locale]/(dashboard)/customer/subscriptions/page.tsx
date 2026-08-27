"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomerSubscriptions } from "@/hooks/use-customer";
import type { SubscriptionFrequency } from "@/types";
import { formatDate } from "@/lib/utils";

const FREQUENCY_MESSAGE_KEYS: Record<SubscriptionFrequency, string> = {
  DAILY: "daily",
  ALTERNATE_DAY: "alternateDay",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export default function CustomerSubscriptionsPage() {
  const tCustomer = useTranslations("customer");
  const tCommon = useTranslations("common");
  const tSubscription = useTranslations("subscription");
  const tEmpty = useTranslations("empty");
  const { data, isLoading, error } = useCustomerSubscriptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {tCustomer("subscriptions.list.title")}
          </h1>
          <p className="text-slate-600">
            {tCustomer("subscriptions.list.description")}
          </p>
        </div>
        <Link href="/customer/find-distributor">
          <Button variant="outline">
            {tCustomer("findDistributor.title")}
          </Button>
        </Link>
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
            {tEmpty("noSubscriptions")}{" "}
            <Link href="/customer/find-distributor" className="text-emerald-600 underline">
              {tCustomer("findDistributor.title")}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {s.product?.name || s.productId}
                  </p>
                  <p className="text-sm text-slate-500">
                    {s.distributor?.businessName || tCustomer("findDistributor.title")} ·{" "}
                    {tSubscription(
                      `frequencies.${FREQUENCY_MESSAGE_KEYS[s.frequency]}`,
                    )}{" "}
                    · {tCommon("quantity")} {s.quantity}
                  </p>
                  <p className="text-xs text-slate-400">
                    Started {formatDate(s.startDate)} · {s.status}
                  </p>
                </div>
                <Link href={`/customer/subscriptions/${s.id}`}>
                  <Button size="sm" variant="outline">
                    {tCommon("edit")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
