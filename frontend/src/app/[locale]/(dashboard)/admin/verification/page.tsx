"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminVerificationPage() {
  const tAdmin = useTranslations("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tAdmin("verification.title")}
        </h1>
        <p className="text-slate-600">{tAdmin("verification.description")}</p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="text-emerald-900">
            {tAdmin("verification.deprecatedNotice")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-emerald-800">
            {tAdmin("verification.pending")}
          </p>
          <Link href="/admin/distributors">
            <Button>{tAdmin("verification.goToDistributors")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
