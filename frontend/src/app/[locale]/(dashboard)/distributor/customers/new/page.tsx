"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressFormFields } from "@/components/address/address-form-fields";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { useCreateDistributorCustomer } from "@/hooks/use-distributor";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";

export default function NewCustomerPage() {
  const router = useRouter();
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const createCustomer = useCreateDistributorCustomer();
  const schemas = useFormSchemas();
  const [activationUrl, setActivationUrl] = useState<string | null>(null);

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
        showToast("Customer created — share activation link", "success");
      } else {
        showToast("Customer created", "success");
        router.push("/distributor/customers");
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const copyLink = async () => {
    if (activationUrl) {
      await navigator.clipboard.writeText(activationUrl);
      showToast("Activation link copied", "success");
    }
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
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-emerald-900">
                Share this activation link with the customer:
              </p>
              <p className="truncate text-xs text-emerald-800">{activationUrl}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
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
                <p className="text-sm text-red-600">{errors.name.message as string}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label>{tCommon("phone")}</Label>
                <Input {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message as string}</p>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : tDistributor("customers.new.inviteCustomer")}
              </Button>
              {activationUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/distributor/customers")}
                >
                  Done
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
