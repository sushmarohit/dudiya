"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FeatureDisabledNoticeProps = {
  feature: "subscription" | "billing";
  backHref?: string;
};

export function FeatureDisabledNotice({
  feature,
  backHref = "/",
}: FeatureDisabledNoticeProps) {
  const t = useTranslations("features");

  return (
    <Card className="border-slate-200 bg-slate-50">
      <CardContent className="space-y-4 py-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          {feature === "subscription"
            ? t("subscriptionDisabledTitle")
            : t("billingDisabledTitle")}
        </h2>
        <p className="mx-auto max-w-md text-sm text-slate-600">
          {feature === "subscription"
            ? t("subscriptionDisabledDescription")
            : t("billingDisabledDescription")}
        </p>
        <Link href={backHref}>
          <Button variant="outline">{t("backToDashboard")}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
