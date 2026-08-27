"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  usePlatformSettings,
  useUpdatePlatformSettings,
} from "@/hooks/use-admin";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";

export default function AdminSettingsPage() {
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const { data, isLoading } = usePlatformSettings();
  const update = useUpdatePlatformSettings();
  const schemas = useFormSchemas();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.platformSettingsSchema),
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = async (formData: {
    pauseCutoffHour: number;
    pauseCutoffMinute: number;
    defaultRadiusKm: number;
  }) => {
    try {
      await update.mutateAsync(formData);
      showToast(tAdmin("settings.title"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tAdmin("settings.title")}
        </h1>
        <p className="text-slate-600">{tAdmin("settings.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin("settings.cutoffTime")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-500">{tCommon("loading")}</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pauseCutoffHour">
                    {tAdmin("settings.cutoffTime")}
                  </Label>
                  <Input
                    id="pauseCutoffHour"
                    type="number"
                    {...register("pauseCutoffHour")}
                  />
                  {errors.pauseCutoffHour && (
                    <p className="text-sm text-red-600">
                      {errors.pauseCutoffHour.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pauseCutoffMinute">
                    {tAdmin("settings.cutoffTime")}
                  </Label>
                  <Input
                    id="pauseCutoffMinute"
                    type="number"
                    {...register("pauseCutoffMinute")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultRadiusKm">
                  {tAdmin("settings.description")}
                </Label>
                <Input
                  id="defaultRadiusKm"
                  type="number"
                  step="0.5"
                  {...register("defaultRadiusKm")}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tCommon("loading") : tCommon("save")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
