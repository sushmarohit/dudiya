"use client";

import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddressFormFields } from "@/components/address/address-form-fields";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { useRegister } from "@/hooks/use-auth";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { useAuthStore } from "@/store/auth-store";
import { showToast } from "@/components/providers";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link, useRouter } from "@/i18n/navigation";

export default function RegisterCustomerPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.customerRegistration");
  const tr = useTranslations("auth.register");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const getApiErrorMessage = useApiErrorMessage();
  const registerUser = useRegister();
  const setAuth = useAuthStore((s) => s.setAuth);
  const schemas = useFormSchemas();

  const form = useForm({
    resolver: zodResolver(schemas.registerCustomerSchema),
    defaultValues: {
      addressType: "URBAN" as const,
      email: "",
      name: "",
      password: "",
      phone: "",
      flatOrHouseNo: "",
      buildingOrSociety: "",
      streetOrLane: "",
      landmark: "",
      village: "",
      district: "",
      state: "",
      addressLine: "",
      city: "",
      pincode: "",
      lat: undefined as number | undefined,
      lng: undefined as number | undefined,
    },
  });

  const { register, handleSubmit, watch, setValue, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      const result = await registerUser.mutateAsync({
        role: "customer",
        ...data,
        preferredLocale: locale,
      });
      setAuth(result.user, result.accessToken, result.refreshToken);
      showToast(tc("created"), "success");
      router.push("/customer/documents");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{tc("fullName")}</Label>
                <Input {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-600">{tv("required")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{tc("phone")}</Label>
                <Input {...register("phone")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tc("email")}</Label>
              <Input type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-600">{tv("email")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{tc("password")}</Label>
              <PasswordInput {...register("password")} />
              {errors.password && (
                <p className="text-sm text-red-600">{tv("password")}</p>
              )}
            </div>

            <AddressFormFields
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              locationOptIn
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? tc("creatingAccount") : tc("createAccount")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link href="/register" className="text-emerald-600 hover:underline">
              ← {tr("backToRoleSelection")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
