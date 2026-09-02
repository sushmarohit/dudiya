"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Milk } from "lucide-react";
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
import type { LoginInput } from "@/lib/schemas";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { useLogin } from "@/hooks/use-auth";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { Link, useRouter } from "@/i18n/navigation";
import type { UserRole } from "@/types";

function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DISTRIBUTOR":
      return "/distributor/dashboard";
    case "CUSTOMER":
      return "/customer/profile";
    default:
      return "/";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const getApiErrorMessage = useApiErrorMessage();
  const login = useLogin();
  const schemas = useFormSchemas();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(schemas.loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await login.mutateAsync(data);
      router.push(getRoleRedirect(result.user.role));
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12 sm:py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-sand)]">
            <Milk className="h-6 w-6 text-[var(--brand-navy)]" />
          </div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{tc("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{tv("email")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{tc("password")}</Label>
              <PasswordInput id="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-red-600">{tv("required")}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? tc("loading") : t("button")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-600">
            <Link
              href="/forgot-password"
              className="text-[var(--brand-saffron-deep)] hover:underline"
            >
              {t("forgotPassword")}
            </Link>
            <span className="mx-2">·</span>
            <Link
              href="/register"
              className="text-[var(--brand-saffron-deep)] hover:underline"
            >
              {t("registerLink")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
