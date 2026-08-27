"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerProfile, useNearbyDistributors } from "@/hooks/use-customer";
import { useIdentityStatus } from "@/hooks/use-identity";

const RADIUS_OPTIONS = [1, 3, 5, 10];

export default function FindDistributorPage() {
  const tCustomer = useTranslations("customer");
  const tIdentity = useTranslations("identity");
  const tEmpty = useTranslations("empty");
  const { data: profile } = useCustomerProfile();
  const { data: identityStatus, isLoading: identityLoading } = useIdentityStatus();
  const [radiusKm, setRadiusKm] = useState(5);

  const lat = profile?.deliveryLat ?? 0;
  const lng = profile?.deliveryLng ?? 0;
  const identityVerified = identityStatus?.identityVerified ?? profile?.identityVerified;

  const { data: distributors, isLoading, error } = useNearbyDistributors({
    lat,
    lng,
    radiusKm,
    enabled: !!identityVerified && lat !== 0 && lng !== 0,
  });

  const hasAddress = lat !== 0 && lng !== 0;

  if (identityLoading) {
    return <p className="text-slate-500">…</p>;
  }

  if (!identityVerified) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {tCustomer("findDistributor.title")}
          </h1>
          <p className="text-slate-600">
            {tCustomer("findDistributor.description")}
          </p>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-amber-900">{tIdentity("customerGate")}</p>
            <Link href="/customer/documents">
              <Button>{tIdentity("uploadDocuments")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tCustomer("findDistributor.title")}
        </h1>
        <p className="text-slate-600">
          {tCustomer("findDistributor.description")}
        </p>
      </div>

      {!hasAddress && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              Please set your delivery address in{" "}
              <Link href="/customer/profile" className="font-medium underline">
                {tCustomer("profile.title")}
              </Link>{" "}
              to find nearby distributors.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {RADIUS_OPTIONS.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={radiusKm === r ? "default" : "outline"}
            onClick={() => setRadiusKm(r)}
            className="min-w-[4.5rem]"
          >
            {r} km
          </Button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{tIdentity("radiusBothHint")}</p>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load distributors. Ensure your address is geocoded.
        </div>
      )}

      {isLoading && hasAddress ? (
        <p className="text-slate-500">Searching...</p>
      ) : !distributors?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            {hasAddress
              ? tEmpty("noDistributors")
              : "Set your address to search"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {distributors.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle>{d.businessName}</CardTitle>
                <p className="text-sm text-slate-500">
                  {d.distanceKm.toFixed(1)} km away · {d.city || "—"} ·{" "}
                  {tIdentity("serves")} {d.serviceRadiusKm} km
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.productsSummary && (
                  <p className="text-sm text-slate-600">{d.productsSummary}</p>
                )}
                <div className="flex gap-2">
                  <Link href={`/customer/distributors/${d.id}`}>
                    <Button size="sm" variant="outline">
                      {tCustomer("findDistributor.viewDistributor")}
                    </Button>
                  </Link>
                  <Link href={`/customer/subscribe/${d.id}`}>
                    <Button size="sm">Subscribe</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
