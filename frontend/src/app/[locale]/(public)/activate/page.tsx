"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { useActivate } from "@/hooks/use-auth";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { useAuthStore } from "@/store/auth-store";
import { showToast } from "@/components/providers";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link, useRouter } from "@/i18n/navigation";

function ActivateForm() {
  const router = useRouter();
  const t = useTranslations("auth.activate");
  const tr = useTranslations("auth.reset");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const getApiErrorMessage = useApiErrorMessage();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const activate = useActivate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const schemas = useFormSchemas();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(schemas.activateSchema),
  });

  const onSubmit = async (data: { password: string }) => {
    if (!token) {
      showToast(t("invalidToken"), "error");
      return;
    }
    try {
      const result = await activate.mutateAsync({ token, password: data.password });
      setAuth(result.user, result.accessToken, result.refreshToken);
      showToast(t("success"), "success");
      router.push("/customer/profile");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        {t("invalidLink")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{tc("password")}</Label>
        <PasswordInput id="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-red-600">{tv("password")}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{tr("confirmPassword")}</Label>
        <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">
            {tv("passwordsMatch")}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? tc("activating") : t("button")}
      </Button>
    </form>
  );
}

export default function ActivatePage() {
  const t = useTranslations("auth.activate");
  const tc = useTranslations("common");

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<p className="text-sm text-slate-500">{tc("loading")}</p>}
          >
            <ActivateForm />
          </Suspense>
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link href="/login" className="text-emerald-600 hover:underline">
              {t("alreadyActivated")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
