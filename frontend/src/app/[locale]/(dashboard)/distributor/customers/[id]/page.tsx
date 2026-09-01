"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressFormFields } from "@/components/address/address-form-fields";
import {
  profileToAddressDefaults,
  formatAddressPreview,
} from "@/lib/address";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import {
  useDistributorCustomer,
  useUpdateDistributorCustomer,
} from "@/hooks/use-distributor";
import type { SubscriptionFrequency } from "@/types";
import { formatDate } from "@/lib/utils";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { isSubscriptionFlowEnabled } from "@/lib/feature-flags";

const FREQUENCY_MESSAGE_KEYS: Record<SubscriptionFrequency, string> = {
  DAILY: "daily",
  ALTERNATE_DAY: "alternateDay",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export default function DistributorCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const tSubscription = useTranslations("subscription");
  const tEmpty = useTranslations("empty");
  const getApiErrorMessage = useApiErrorMessage();
  const { data: customer, isLoading, error } = useDistributorCustomer(id);
  const updateCustomer = useUpdateDistributorCustomer();
  const schemas = useFormSchemas();

  const form = useForm({
    resolver: zodResolver(schemas.updateCustomerSchema),
    values: customer
      ? {
          name: customer.user?.name ?? "",
          phone: customer.user?.phone ?? "",
          ...profileToAddressDefaults(customer as unknown as Record<string, unknown>),
        }
      : undefined,
  });

  const { register, handleSubmit, watch, setValue, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateCustomer.mutateAsync({ id, ...data });
      showToast("Customer updated", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  if (isLoading) {
    return <p className="text-slate-500">{tCommon("loading")}</p>;
  }

  if (error || !customer) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Customer not found.
      </div>
    );
  }

  const addressPreview = formatAddressPreview(
    customer as Parameters<typeof formatAddressPreview>[0],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/distributor/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {tCommon("back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {customer.user?.name || tDistributor("customers.detail.title")}
          </h1>
          <p className="text-slate-600">
            {customer.user?.email || "—"} · {customer.user?.phone || "—"}
          </p>
          <p className="text-sm text-slate-500">
            {tCommon("status")}: {customer.user?.status || "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tDistributor("customers.detail.addressInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            {addressPreview && (
              <p className="mb-4 text-sm text-slate-600">{addressPreview}</p>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tCommon("name")}</Label>
                  <Input {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-red-600">
                      {errors.name.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{tCommon("phone")}</Label>
                  <Input {...register("phone")} />
                  {errors.phone && (
                    <p className="text-sm text-red-600">
                      {errors.phone.message as string}
                    </p>
                  )}
                </div>
              </div>
              <AddressFormFields
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tDistributor("customers.detail.subscriptionHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!customer.subscriptions?.length ? (
              <p className="text-sm text-slate-500">
                {tEmpty("noSubscriptions")}
                {isSubscriptionFlowEnabled() ? (
                  <>
                    {" "}
                    <Link
                      href="/distributor/subscriptions/create"
                      className="font-medium text-emerald-700 underline"
                    >
                      Create one
                    </Link>
                  </>
                ) : null}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {customer.subscriptions.map((sub) => (
                  <li key={sub.id} className="py-3 text-sm">
                    <p className="font-medium">{sub.product?.name}</p>
                    <p className="text-slate-600">
                      {sub.quantity} ·{" "}
                      {tSubscription(
                        `frequencies.${FREQUENCY_MESSAGE_KEYS[sub.frequency]}`,
                      )}{" "}
                      ·{" "}
                      {sub.deliverySlot?.label}
                    </p>
                    <p className="text-slate-500">
                      Since {formatDate(sub.startDate)} · {sub.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
