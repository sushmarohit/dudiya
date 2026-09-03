"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressFormFields } from "@/components/address/address-form-fields";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { useCreateDistributorCustomer } from "@/hooks/use-distributor";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { copyToClipboard } from "@/lib/utils";

export default function NewCustomerPage() {
  const router = useRouter();
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const createCustomer = useCreateDistributorCustomer();
  const schemas = useFormSchemas();
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm({
    resolver: zodResolver(schemas.createCustomerSchema),
    defaultValues: { addressType: "URBAN" },
  });

  const { register, handleSubmit, watch, setValue, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      const result = await createCustomer.mutateAsync(data);
      if (result.activationUrl) {
        setActivationUrl(result.activationUrl);
        setCopied(false);
        showToast(tDistributor("customers.new.createdShareLink"), "success");
      } else {
        showToast(tDistributor("customers.new.created"), "success");
        router.push("/distributor/customers");
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const copyLink = async () => {
    if (!activationUrl) return;
    const ok = await copyToClipboard(activationUrl);
    if (ok) {
      setCopied(true);
      showToast(tDistributor("customers.new.linkCopied"), "success");
      window.setTimeout(() => setCopied(false), 2500);
    } else {
      showToast(tDistributor("customers.new.linkCopyFailed"), "error");
    }
  };

  const shareWhatsApp = () => {
    if (!activationUrl) return;
    const message = tDistributor("customers.new.whatsappMessage", {
      link: activationUrl,
    });
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tDistributor("customers.new.title")}
        </h1>
        <p className="text-slate-600">
          {tDistributor("customers.new.description")}
        </p>
      </div>

      {activationUrl && (
        <Card className="border-[var(--brand-border)] bg-[var(--brand-sand)]">
          <CardContent className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--brand-navy)]">
                {tDistributor("customers.new.shareTitle")}
              </p>
              <p className="mt-1 text-sm text-[var(--brand-ink-muted)]">
                {tDistributor("customers.new.shareHint")}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2">
              <p className="break-all text-xs text-[var(--brand-ink)] sm:text-sm">
                {activationUrl}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={copyLink} className="sm:flex-1">
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied
                  ? tDistributor("customers.new.copied")
                  : tDistributor("customers.new.copyLink")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={shareWhatsApp}
                className="sm:flex-1"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {tDistributor("customers.new.shareWhatsApp")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/distributor/customers")}
              >
                {tDistributor("customers.new.done")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{tDistributor("customers.detail.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{tCommon("name")}</Label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-600">
                  {errors.name.message as string}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{tDistributor("customers.new.emailOptional")}</Label>
                <Input type="email" {...register("email")} />
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

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || !!activationUrl}>
                {isSubmitting
                  ? tDistributor("customers.new.creating")
                  : tDistributor("customers.new.inviteCustomer")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
