"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressFormFields } from "@/components/address/address-form-fields";
import { useCustomerProfile, useUpdateCustomerProfile } from "@/hooks/use-customer";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { profileToAddressDefaults } from "@/lib/address";
import { useAuthStore } from "@/store/auth-store";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";

export default function CustomerProfilePage() {
  const tCustomer = useTranslations("customer");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();
  const schemas = useFormSchemas();

  const form = useForm({
    resolver: zodResolver(schemas.customerProfileSchema),
    defaultValues: {
      addressType: "URBAN" as const,
      name: "",
      phone: "",
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState } = form;
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    if (profile || user) {
      reset({
        name: profile?.user?.name || user?.name || "",
        phone: profile?.user?.phone || user?.phone || "",
        ...profileToAddressDefaults(profile as unknown as Record<string, unknown>),
      });
    }
  }, [profile, user, reset]);

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateProfile.mutateAsync(data);
      showToast("Profile updated", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tCustomer("profile.title")}
        </h1>
        <p className="text-slate-600">
          {tCustomer("profile.description")}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{tCustomer("profile.deliveryAddress")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-500">{tCommon("loading")}</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>{tCommon("email")}</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tCommon("name")}</Label>
                  <Input {...register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>{tCommon("phone")}</Label>
                  <Input {...register("phone")} />
                </div>
              </div>

              <AddressFormFields
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                locationOptIn
              />

              {profile?.formattedAddress && (
                <p className="text-xs text-slate-500">
                  Saved: {profile.formattedAddress}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : tCustomer("profile.updateProfile")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
