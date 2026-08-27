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
import { useResetPassword } from "@/hooks/use-auth";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link, useRouter } from "@/i18n/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations("auth.reset");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const getApiErrorMessage = useApiErrorMessage();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const resetPassword = useResetPassword();
  const schemas = useFormSchemas();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(schemas.resetPasswordSchema),
  });

  const onSubmit = async (data: { password: string }) => {
    if (!token) {
      showToast(t("invalidToken"), "error");
      return;
    }
    try {
      await resetPassword.mutateAsync({ token, password: data.password });
      showToast(t("success"), "success");
      router.push("/login");
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
        <Label htmlFor="password">{t("newPassword")}</Label>
        <PasswordInput id="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-red-600">{tv("password")}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">
            {tv("passwordsMatch")}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? tc("resetting") : t("button")}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth.reset");
  const tf = useTranslations("auth.forgot");
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
            <ResetPasswordForm />
          </Suspense>
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link href="/login" className="text-emerald-600 hover:underline">
              {tf("backToLogin")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
