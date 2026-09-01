"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliverySchedulePreview } from "@/components/subscription/delivery-schedule-preview";
import { ProductSelect } from "@/components/forms/product-select";
import { DeliverySlotSelect } from "@/components/forms/delivery-slot-select";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import {
  useDistributorCustomers,
  useDistributorProducts,
  useDeliverySlots,
  useCreateDistributorSubscription,
} from "@/hooks/use-distributor";
import type { SubscriptionFrequency } from "@/types";
import { todayDateKey } from "@/lib/utils";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";

const FREQUENCY_MESSAGE_KEYS: Record<SubscriptionFrequency, string> = {
  DAILY: "daily",
  ALTERNATE_DAY: "alternateDay",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const tSubscription = useTranslations("subscription");
  const getApiErrorMessage = useApiErrorMessage();
  const { data: customers } = useDistributorCustomers();
  const { data: products } = useDistributorProducts();
  const { data: slots } = useDeliverySlots();
  const createSubscription = useCreateDistributorSubscription();
  const schemas = useFormSchemas();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.createSubscriptionSchema),
    defaultValues: {
      startDate: todayDateKey(),
      frequency: "DAILY" as SubscriptionFrequency,
    },
  });

  const frequency = watch("frequency") as SubscriptionFrequency | undefined;
  const startDate = watch("startDate");

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await createSubscription.mutateAsync(data);
      showToast("Subscription created", "success");
      router.push("/distributor/subscriptions");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tDistributor("subscriptions.createSubscription")}
        </h1>
        <p className="text-slate-600">
          {tDistributor("subscriptions.description")}
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{tDistributor("subscriptions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{tCommon("name")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                {...register("customerId")}
              >
                <option value="">{tDistributor("customers.list.title")}</option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.user?.name || customer.id}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-sm text-red-600">
                  {errors.customerId.message as string}
                </p>
              )}
            </div>
            <ProductSelect
              products={products?.filter((p) => p.enabled) ?? []}
              value={watch("productId")}
              onChange={(v) => setValue("productId", v, { shouldValidate: true })}
              error={errors.productId?.message as string}
            />
            <div className="space-y-2">
              <Label>{tCommon("fatPercent")}</Label>
              <Input type="number" step="0.1" {...register("fatPercent")} />
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
              slots={slots ?? []}
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
                ? "Creating..."
                : tDistributor("subscriptions.createSubscription")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {frequency && startDate && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>{tSubscription("schedulePreview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliverySchedulePreview
              scheduleParams={{ frequency, startDate }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
