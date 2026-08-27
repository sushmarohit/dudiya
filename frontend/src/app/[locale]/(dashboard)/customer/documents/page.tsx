"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdentityDocumentsPanel } from "@/components/identity/identity-documents-panel";
import { useIdentityStatus } from "@/hooks/use-identity";

export default function CustomerDocumentsPage() {
  const t = useTranslations("identity");
  const { data: status } = useIdentityStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("customerTitle")}</h1>
        <p className="text-slate-600">{t("customerDescription")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("uploadDocuments")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <IdentityDocumentsPanel />
          {status?.identityVerified ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/customer/find-distributor">
                <Button>{t("findDistributors")}</Button>
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
