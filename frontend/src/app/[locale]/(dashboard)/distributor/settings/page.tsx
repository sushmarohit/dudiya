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
import {
  useDistributorProfile,
  useUpdateDistributorProfile,
} from "@/hooks/use-distributor";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { profileToAddressDefaults } from "@/lib/address";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";

export default function DistributorSettingsPage() {
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const { data: profile, isLoading } = useDistributorProfile();
  const updateProfile = useUpdateDistributorProfile();
  const schemas = useFormSchemas();

  const form = useForm({
    resolver: zodResolver(schemas.businessProfileSchema),
    defaultValues: { addressType: "URBAN" as const, serviceRadiusKm: 5 },
  });

  const { register, handleSubmit, reset, watch, setValue, formState } = form;
  const { isSubmitting, errors } = formState;

  useEffect(() => {
    if (profile) {
      reset({
        businessName: profile.businessName,
        ownerName: profile.ownerName || "",
        serviceRadiusKm: profile.serviceRadiusKm,
        ...profileToAddressDefaults(profile as unknown as Record<string, unknown>),
      });
    }
  }, [profile, reset]);

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
          {tDistributor("settings.title")}
        </h1>
        <p className="text-slate-600">{tDistributor("settings.description")}</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{tDistributor("settings.businessName")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-500">{tCommon("loading")}</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>{tDistributor("settings.businessName")}</Label>
                <Input {...register("businessName")} />
              </div>
              <div className="space-y-2">
                <Label>{tDistributor("settings.ownerName")}</Label>
                <Input {...register("ownerName")} />
              </div>
              <div className="space-y-2">
                <Label>Service radius (km)</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  {...register("serviceRadiusKm")}
                />
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
                {isSubmitting ? "Saving..." : tCommon("save")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
