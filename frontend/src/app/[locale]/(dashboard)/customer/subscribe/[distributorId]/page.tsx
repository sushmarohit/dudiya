"use client";

import { use, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliverySlotSelect } from "@/components/forms/delivery-slot-select";
import {
  useDistributorDetail,
  useCreateCustomerSubscription,
  useCustomerSubscriptions,
} from "@/hooks/use-customer";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import type { SubscriptionFrequency } from "@/types";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { formatCurrency } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { FeatureDisabledNotice } from "@/components/feature-disabled-notice";
import {
  isSubscriptionApprovalEnabled,
  isSubscriptionFlowEnabled,
} from "@/lib/feature-flags";

const FREQUENCY_MESSAGE_KEYS: Record<SubscriptionFrequency, string> = {
  DAILY: "daily",
  ALTERNATE_DAY: "alternateDay",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export default function SubscribePage({
  params,
}: {
  params: Promise<{ distributorId: string }>;
}) {
  const { distributorId } = use(params);
  const router = useRouter();
  const tCustomer = useTranslations("customer");
  const tCommon = useTranslations("common");
  const tSubscription = useTranslations("subscription");
  const getApiErrorMessage = useApiErrorMessage();
  const { data: distributor, isLoading } = useDistributorDetail(distributorId);
  const { data: mySubscriptions } = useCustomerSubscriptions();
  const createSubscription = useCreateCustomerSubscription();
  const schemas = useFormSchemas();

  const existingActive = useMemo(
    () =>
      mySubscriptions?.find(
        (s) =>
          s.distributorId === distributorId &&
          (s.status === "ACTIVE" ||
            s.status === "PENDING_CANCEL" ||
            s.status === "PENDING_APPROVAL"),
      ),
    [mySubscriptions, distributorId],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.customerSubscribeSchema),
    defaultValues: {
      startDate: new Date().toISOString().split("T")[0],
      pricingId: "",
      productId: "",
    },
  });

  const pricingOptions = useMemo(
    () => (distributor?.pricing || []).filter((p) => p.active !== false),
    [distributor?.pricing],
  );

  const selectedPricingId = watch("pricingId");
  const selectedPricing = pricingOptions.find((p) => p.id === selectedPricingId);

  useEffect(() => {
    if (!selectedPricing) return;
    setValue("productId", selectedPricing.productId, { shouldValidate: true });
  }, [selectedPricing, setValue]);

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      const pricing = pricingOptions.find((p) => p.id === data.pricingId);
      await createSubscription.mutateAsync({
        distributorId,
        productId: pricing?.productId ?? data.productId,
        pricingId: data.pricingId,
        quantity: data.quantity,
        frequency: data.frequency,
        deliverySlotId: data.deliverySlotId,
        startDate: data.startDate,
        // Fat comes from distributor pricing — do not send customer-entered value
      });
      showToast(
        isSubscriptionApprovalEnabled()
          ? tCustomer("subscribe.requestSent")
          : tCustomer("subscribe.subscriptionCreated"),
        "success",
      );
      router.push("/customer/subscriptions");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  if (isLoading) {
    return <p className="text-slate-500">{tCommon("loading")}</p>;
  }

  if (!isSubscriptionFlowEnabled()) {
    return (
      <FeatureDisabledNotice
        feature="subscription"
        backHref="/customer/find-distributor"
      />
    );
  }

  if (existingActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {tCustomer("subscribe.title")}
          </h1>
        </div>
        <Card className="max-w-lg border-amber-200 bg-amber-50">
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-amber-900">
              {existingActive.status === "PENDING_CANCEL"
                ? tCustomer("subscribe.endPending")
                : existingActive.status === "PENDING_APPROVAL"
                  ? tCustomer("subscribe.pendingApproval")
                  : tCustomer("subscribe.alreadyActive")}
            </p>
            <Link href={`/customer/subscriptions/${existingActive.id}`}>
              <Button>{tCustomer("subscribe.manageExisting")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slots = distributor?.deliverySlots?.filter((s) => s.active) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tCustomer("subscribe.title")}
        </h1>
        <p className="text-slate-600">
          {tCustomer("subscribe.description")}
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{tCustomer("subscribe.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{tCommon("product")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                {...register("pricingId")}
              >
                <option value="">{tCustomer("subscribe.chooseProduct")}</option>
                {pricingOptions.map((p) => {
                  const name = p.product?.name || p.productId;
                  const fat =
                    p.fatPercent != null && p.fatPercent > 0
                      ? ` · ${p.fatPercent}% fat`
                      : "";
                  return (
                    <option key={p.id} value={p.id}>
                      {name}
                      {fat} — {formatCurrency(p.pricePerUnit)}
                    </option>
                  );
                })}
              </select>
              {errors.pricingId && (
                <p className="text-sm text-red-600">
                  {errors.pricingId.message as string}
                </p>
              )}
              {selectedPricing && (
                <p className="text-xs text-slate-500">
                  {tCustomer("subscribe.fatFromDistributor", {
                    fat:
                      selectedPricing.fatPercent != null
                        ? String(selectedPricing.fatPercent)
                        : "—",
                    price: formatCurrency(selectedPricing.pricePerUnit),
                  })}
                </p>
              )}
              <input type="hidden" {...register("productId")} />
            </div>
            <div className="space-y-2">
              <Label>{tCommon("quantity")}</Label>
              <Input type="number" step="0.5" {...register("quantity")} />
            </div>
            <div className="space-y-2">
              <Label>{tCommon("frequency")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                {...register("frequency")}
              >
                {Object.entries(FREQUENCY_MESSAGE_KEYS).map(([value, key]) => (
                  <option key={value} value={value}>
                    {tSubscription(`frequencies.${key}`)}
                  </option>
                ))}
              </select>
            </div>
            <DeliverySlotSelect
              slots={slots}
              value={watch("deliverySlotId")}
              onChange={(v) =>
                setValue("deliverySlotId", v, { shouldValidate: true })
              }
              error={errors.deliverySlotId?.message as string}
            />
            <div className="space-y-2">
              <Label>{tCommon("startDate")}</Label>
              <Input type="date" {...register("startDate")} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Subscribing..."
                : tCustomer("subscribe.confirmSubscription")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
