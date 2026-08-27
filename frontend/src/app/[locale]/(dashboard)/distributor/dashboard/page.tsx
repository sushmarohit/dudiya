"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDistributorProfile } from "@/hooks/use-distributor";
import { SETUP_STEPS, SETUP_STEP_LABELS } from "@/types";

export default function DistributorDashboardPage() {
  const tDistributor = useTranslations("distributor");
  const tIdentity = useTranslations("identity");
  const tCommon = useTranslations("common");
  const { data: profile, isLoading } = useDistributorProfile();

  const completedSteps = profile?.setupSteps || [];
  const progress = Math.round(
    (completedSteps.length / SETUP_STEPS.length) * 100,
  );
  const isLive = profile?.setupStatus === "GO_LIVE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tDistributor("dashboard.title")}
        </h1>
        <p className="text-slate-600">
          {profile?.businessName || tDistributor("settings.businessName")} overview
        </p>
      </div>

      {isLoading ? (
        <p className="text-slate-500">{tCommon("loading")}</p>
      ) : (
        <>
          {!profile?.identityVerified && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <p className="font-medium text-amber-900">
                    {tIdentity("distributorGate")}
                  </p>
                </div>
                <Link href="/distributor/setup">
                  <Button size="sm">{tIdentity("uploadDocuments")}</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {isLive ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="font-medium text-emerald-800">
                  You&apos;re live! Customers can discover and subscribe to your
                  products.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  {tDistributor("setup.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">
                  {completedSteps.length} of {SETUP_STEPS.length} steps complete
                </p>
                <ul className="space-y-2 text-sm">
                  {SETUP_STEPS.map((step) => (
                    <li key={step} className="flex items-center gap-2">
                      {completedSteps.includes(step) ||
                      (step === "identity_documents" &&
                        profile?.identityVerified) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-slate-300" />
                      )}
                      {SETUP_STEP_LABELS[step]}
                    </li>
                  ))}
                </ul>
                <Link href="/distributor/setup">
                  <Button>{tDistributor("setup.title")}</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-600">
                  {tIdentity("statusLabel")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {profile?.identityVerified
                    ? tIdentity("verified")
                    : tIdentity("unverified")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-600">Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{profile?.setupStatus}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-600">
                  Service radius
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {profile?.serviceRadiusKm} km
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
