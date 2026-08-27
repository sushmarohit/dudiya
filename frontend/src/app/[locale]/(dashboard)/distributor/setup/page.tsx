"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressFormFields } from "@/components/address/address-form-fields";
import { IdentityDocumentsPanel } from "@/components/identity/identity-documents-panel";
import {
  useDistributorProfile,
  useUpdateDistributorProfile,
  useCompleteSetupStep,
  useGoLive,
  useDistributorProducts,
  useUpdateDistributorProducts,
  useDistributorPricing,
  useCreatePricing,
  useDeliverySlots,
  useCreateDeliverySlot,
} from "@/hooks/use-distributor";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { profileToAddressDefaults } from "@/lib/address";
import { SETUP_STEPS, SETUP_STEP_LABELS } from "@/types";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "@/lib/utils";

export default function DistributorSetupPage() {
  const [step, setStep] = useState(0);
  const tDistributor = useTranslations("distributor");
  const tIdentity = useTranslations("identity");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const { data: profile } = useDistributorProfile();
  const updateProfile = useUpdateDistributorProfile();
  const completeStep = useCompleteSetupStep();
  const goLive = useGoLive();
  const { data: products } = useDistributorProducts();
  const updateProducts = useUpdateDistributorProducts();
  const { data: pricing } = useDistributorPricing();
  const createPricing = useCreatePricing();
  const { data: slots } = useDeliverySlots();
  const createSlot = useCreateDeliverySlot();
  const schemas = useFormSchemas();

  const profileForm = useForm({
    resolver: zodResolver(schemas.businessProfileSchema),
    defaultValues: {
      addressType: "URBAN" as const,
      serviceRadiusKm: 5,
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        businessName: profile.businessName,
        ownerName: profile.ownerName ?? "",
        serviceRadiusKm: profile.serviceRadiusKm,
        ...profileToAddressDefaults(profile as unknown as Record<string, unknown>),
      });
    }
  }, [profile, profileForm]);

  const slotForm = useForm({
    resolver: zodResolver(schemas.deliverySlotSchema),
  });

  const pricingForm = useForm({
    resolver: zodResolver(schemas.pricingSchema),
  });

  const currentStepKey = SETUP_STEPS[step];
  const completedSteps = profile?.setupSteps || [];

  const markStepComplete = async (stepKey: string) => {
    try {
      await completeStep.mutateAsync(stepKey);
      showToast("Step completed", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleProfileSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateProfile.mutateAsync(data);
      await markStepComplete("business_profile");
      setStep(1);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleDocumentsContinue = async () => {
    await markStepComplete("identity_documents");
    setStep(2);
  };

  const handleProductsComplete = async () => {
    await markStepComplete("products");
    setStep(3);
  };

  const handlePricingSubmit = async (data: {
    productId: string;
    fatPercent?: number;
    pricePerUnit: number;
  }) => {
    try {
      await createPricing.mutateAsync(data);
      pricingForm.reset();
      showToast("Pricing added", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handlePricingComplete = async () => {
    await markStepComplete("pricing");
    setStep(4);
  };

  const handleSlotSubmit = async (data: {
    label: string;
    startTime: string;
    endTime: string;
  }) => {
    try {
      await createSlot.mutateAsync(data);
      slotForm.reset();
      showToast("Slot added", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleSlotsComplete = async () => {
    await markStepComplete("delivery_slots");
    setStep(5);
  };

  const handleGoLive = async () => {
    const ok = await confirm({
      title: tCommon("confirmGoLiveTitle"),
      description: tCommon("confirmGoLiveDescription"),
      confirmLabel: "Go Live",
    });
    if (!ok) return;
    try {
      await goLive.mutateAsync();
      await markStepComplete("readiness");
      showToast("You are now live!", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tDistributor("setup.title")}
        </h1>
        <p className="text-slate-600">{tDistributor("setup.description")}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SETUP_STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              i === step
                ? "bg-emerald-600 text-white"
                : completedSteps.includes(s)
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {SETUP_STEP_LABELS[s]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{SETUP_STEP_LABELS[currentStepKey]}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <form
              onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
              className="space-y-4 max-w-2xl"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business name</Label>
                  <Input {...profileForm.register("businessName")} />
                </div>
                <div className="space-y-2">
                  <Label>Owner name</Label>
                  <Input {...profileForm.register("ownerName")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{tIdentity("serviceRadius")}</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  {...profileForm.register("serviceRadiusKm")}
                />
                <p className="text-xs text-slate-500">{tIdentity("serviceRadiusHint")}</p>
              </div>

              <AddressFormFields
                register={profileForm.register}
                watch={profileForm.watch}
                setValue={profileForm.setValue}
                errors={profileForm.formState.errors}
                locationOptIn
              />

              <Button type="submit">Save & continue</Button>
            </form>
          )}

          {step === 1 && (
            <IdentityDocumentsPanel
              showContinue
              onVerifiedContinue={handleDocumentsContinue}
            />
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Enable products you want to sell
              </p>
              <div className="space-y-2">
                {products?.filter((p) => !p.isCustom).map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={p.enabled ?? false}
                      onChange={async (e) => {
                        try {
                          await updateProducts.mutateAsync([
                            { productId: p.id, enabled: e.target.checked },
                          ]);
                        } catch (err) {
                          showToast(getApiErrorMessage(err), "error");
                        }
                      }}
                    />
                    <span className="font-medium">{p.name}</span>
                    <span className="text-sm text-slate-500">{p.category}</span>
                  </label>
                ))}
              </div>
              <Button onClick={handleProductsComplete}>Continue</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <form
                onSubmit={pricingForm.handleSubmit(handlePricingSubmit)}
                className="grid gap-4 sm:grid-cols-4 max-w-2xl"
              >
                <div className="space-y-2">
                  <Label>{tCommon("product")}</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    {...pricingForm.register("productId")}
                  >
                    <option value="">Select</option>
                    {products?.filter((p) => p.enabled).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Fat %</Label>
                  <Input type="number" step="0.1" {...pricingForm.register("fatPercent")} />
                </div>
                <div className="space-y-2">
                  <Label>Price/unit</Label>
                  <Input type="number" step="0.01" {...pricingForm.register("pricePerUnit")} />
                </div>
                <div className="flex items-end">
                  <Button type="submit">Add</Button>
                </div>
              </form>
              {pricing?.length ? (
                <ul className="space-y-1 text-sm">
                  {pricing.map((p) => (
                    <li key={p.id}>
                      {p.product?.name || p.productId}
                      {p.fatPercent ? ` (${p.fatPercent}%)` : ""} —{" "}
                      {formatCurrency(p.pricePerUnit)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button onClick={handlePricingComplete}>Continue</Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <form
                onSubmit={slotForm.handleSubmit(handleSlotSubmit)}
                className="grid gap-4 sm:grid-cols-4 max-w-2xl"
              >
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input placeholder="Morning" {...slotForm.register("label")} />
                </div>
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input type="time" {...slotForm.register("startTime")} />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input type="time" {...slotForm.register("endTime")} />
                </div>
                <div className="flex items-end">
                  <Button type="submit">Add slot</Button>
                </div>
              </form>
              {slots?.length ? (
                <ul className="space-y-1 text-sm">
                  {slots.map((s) => (
                    <li key={s.id}>
                      {s.label}: {s.startTime} – {s.endTime}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button onClick={handleSlotsComplete}>Continue</Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <ul className="space-y-2 text-sm">
                {SETUP_STEPS.slice(0, 5).map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    {completedSteps.includes(s) ||
                    (s === "identity_documents" && profile?.identityVerified)
                      ? "✓"
                      : "○"}{" "}
                    {SETUP_STEP_LABELS[s]}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-600">
                Pricing: {pricing?.length || 0} entries · Slots: {slots?.length || 0}
                {profile?.identityVerified ? " · Identity verified" : " · Identity pending"}
              </p>
              <Button
                onClick={handleGoLive}
                disabled={
                  goLive.isPending ||
                  profile?.setupStatus === "GO_LIVE" ||
                  !profile?.identityVerified
                }
              >
                {profile?.setupStatus === "GO_LIVE" ? "Already live" : "Go Live"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
