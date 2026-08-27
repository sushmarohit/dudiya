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
import type { RegisterDistributorInput } from "@/lib/schemas";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { useRegister } from "@/hooks/use-auth";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { useAuthStore } from "@/store/auth-store";
import { showToast } from "@/components/providers";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link, useRouter } from "@/i18n/navigation";

export default function RegisterDistributorPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.distributorRegistration");
  const tr = useTranslations("auth.register");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const getApiErrorMessage = useApiErrorMessage();
  const register = useRegister();
  const setAuth = useAuthStore((s) => s.setAuth);
  const schemas = useFormSchemas();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDistributorInput>({
    resolver: zodResolver(schemas.registerDistributorSchema),
  });

  const onSubmit = async (data: RegisterDistributorInput) => {
    try {
      const result = await register.mutateAsync({
        role: "distributor",
        ...data,
        preferredLocale: locale,
      });
      setAuth(result.user, result.accessToken, result.refreshToken);
      showToast(t("success"), "success");
      router.push("/distributor/setup");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">{tc("businessName")}</Label>
                  <Input id="businessName" {...formRegister("businessName")} />
                  {errors.businessName && (
                    <p className="text-sm text-red-600">
                      {tv("required")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">{tc("ownerName")}</Label>
                  <Input id="ownerName" {...formRegister("ownerName")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{tc("yourName")}</Label>
                <Input id="name" {...formRegister("name")} />
                {errors.name && (
                  <p className="text-sm text-red-600">{tv("required")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{tc("email")}</Label>
                <Input id="email" type="email" {...formRegister("email")} />
                {errors.email && (
                  <p className="text-sm text-red-600">{tv("email")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{tc("phone")}</Label>
                <Input id="phone" {...formRegister("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{tc("password")}</Label>
                <PasswordInput id="password" {...formRegister("password")} />
                {errors.password && (
                  <p className="text-sm text-red-600">{tv("password")}</p>
                )}
              </div>
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
