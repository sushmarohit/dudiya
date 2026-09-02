"use client";

import { use, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductSelect } from "@/components/forms/product-select";
import { DeliverySlotSelect } from "@/components/forms/delivery-slot-select";
import {
  useCustomerSubscription,
  useDistributorDetail,
  usePauseSubscription,
  useExtraSubscription,
  useUpdateCustomerSubscription,
} from "@/hooks/use-customer";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import type { SubscriptionFrequency } from "@/types";
import { formatDate } from "@/lib/utils";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { DeliverySchedulePreview } from "@/components/subscription/delivery-schedule-preview";
import { SubscriptionEndPanel } from "@/components/subscription/subscription-end-panel";

const FREQUENCY_MESSAGE_KEYS: Record<SubscriptionFrequency, string> = {
  DAILY: "daily",
  ALTERNATE_DAY: "alternateDay",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tCustomer = useTranslations("customer");
  const tCommon = useTranslations("common");
  const tSubscription = useTranslations("subscription");
  const getApiErrorMessage = useApiErrorMessage();
  const { data: subscription, isLoading, error } = useCustomerSubscription(id);
  const distributorId = subscription?.distributorId ?? "";
  const { data: distributor } = useDistributorDetail(distributorId);
  const updateSubscription = useUpdateCustomerSubscription();
  const pauseSubscription = usePauseSubscription();
  const extraSubscription = useExtraSubscription();
  const schemas = useFormSchemas();

  const editForm = useForm({
    resolver: zodResolver(schemas.updateSubscriptionSchema),
  });

  const pauseForm = useForm({
    resolver: zodResolver(schemas.pauseRequestSchema),
  });

  const skipForm = useForm({
    defaultValues: { date: "" },
  });

  const extraForm = useForm({
    resolver: zodResolver(schemas.extraRequestSchema),
  });

  useEffect(() => {
    if (subscription) {
      editForm.reset({
        productId: subscription.productId,
        deliverySlotId: subscription.deliverySlotId,
        fatPercent: subscription.fatPercent ?? undefined,
        quantity: subscription.quantity,
        frequency: subscription.frequency,
      });
    }
  }, [subscription, editForm]);

  const onEditSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateSubscription.mutateAsync({ id, ...data });
      showToast("Subscription updated", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const onPauseSubmit = async (data: { startDate: string; endDate: string }) => {
    try {
      await pauseSubscription.mutateAsync({ id, ...data });
      showToast("Pause request submitted", "success");
      pauseForm.reset();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const onSkipSubmit = async (data: { date: string }) => {
    try {
      await pauseSubscription.mutateAsync({
        id,
        startDate: data.date,
        endDate: data.date,
      });
      showToast(tCustomer("subscriptions.detail.skipSuccess"), "success");
      skipForm.reset();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const onExtraSubmit = async (data: { date: string; extraQuantity: number }) => {
    try {
      await extraSubscription.mutateAsync({ id, ...data });
      showToast("Extra milk request submitted", "success");
      extraForm.reset();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  if (isLoading) {
    return <p className="text-slate-500">{tCommon("loading")}</p>;
  }

  if (error || !subscription) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        Failed to load subscription.
      </div>
    );
  }

  const products = distributor?.products?.filter((p) => p.enabled) ?? [];
  const slots = distributor?.deliverySlots ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tCustomer("subscriptions.detail.title")}
        </h1>
        <p className="text-slate-600">
          {subscription.product?.name} from{" "}
          {subscription.distributor?.businessName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tCustomer("subscriptions.detail.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-slate-500">{tCommon("status")}:</span>{" "}
            {subscription.status}
          </p>
          <p>
            <span className="text-slate-500">{tCommon("startDate")}:</span>{" "}
            {formatDate(subscription.startDate)}
          </p>
        </CardContent>
      </Card>

      <SubscriptionEndPanel
        party="customer"
        subscriptionId={id}
        status={subscription.status}
      />

      {subscription.status === "ACTIVE" && (
        <Card>
          <CardHeader>
            <CardTitle>{tCustomer("subscriptions.detail.edit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <ProductSelect
                products={products}
                value={editForm.watch("productId")}
                onChange={(v) => editForm.setValue("productId", v)}
                error={editForm.formState.errors.productId?.message as string}
              />
              <div className="space-y-2">
                <Label htmlFor="fatPercent">{tCommon("fatPercent")}</Label>
                <Input
                  id="fatPercent"
                  type="number"
                  step="0.1"
                  {...editForm.register("fatPercent")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">{tCommon("quantity")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.5"
                  {...editForm.register("quantity")}
                />
                {editForm.formState.errors.quantity && (
                  <p className="text-sm text-red-600" role="alert">
                    {editForm.formState.errors.quantity.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">{tCommon("frequency")}</Label>
                <select
                  id="frequency"
                  className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  {...editForm.register("frequency")}
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
                value={editForm.watch("deliverySlotId")}
                onChange={(v) => editForm.setValue("deliverySlotId", v)}
                error={
                  editForm.formState.errors.deliverySlotId?.message as string
                }
              />
              <Button type="submit" disabled={updateSubscription.isPending}>
                {updateSubscription.isPending ? "Saving..." : tCommon("save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tSubscription("schedulePreview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliverySchedulePreview subscriptionId={id} role="customer" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tCustomer("subscriptions.detail.skip")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              {tCustomer("subscriptions.detail.skipHint")}
            </p>
            <form
              onSubmit={skipForm.handleSubmit(onSkipSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="skipDate">{tCommon("date")}</Label>
                <Input
                  id="skipDate"
                  type="date"
                  {...skipForm.register("date", { required: true })}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={pauseSubscription.isPending}
              >
                {tCustomer("subscriptions.detail.skipSubmit")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCustomer("subscriptions.detail.pause")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={pauseForm.handleSubmit(onPauseSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="pauseStart">{tCommon("startDate")}</Label>
                <Input id="pauseStart" type="date" {...pauseForm.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pauseEnd">{tCommon("endDate")}</Label>
                <Input id="pauseEnd" type="date" {...pauseForm.register("endDate")} />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={pauseSubscription.isPending}
              >
                Submit pause request
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{tCustomer("subscriptions.detail.extra")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={extraForm.handleSubmit(onExtraSubmit)}
              className="grid max-w-xl gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="extraDate">{tCommon("date")}</Label>
                <Input id="extraDate" type="date" {...extraForm.register("date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extraQty">{tCommon("quantity")}</Label>
                <Input
                  id="extraQty"
                  type="number"
                  step="0.5"
                  {...extraForm.register("extraQuantity")}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={extraSubscription.isPending}
                className="sm:col-span-2"
              >
                Submit extra request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
