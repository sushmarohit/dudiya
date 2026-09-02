"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCustomerProfile,
  useNearbyDistributors,
  useSearchDistributorsByName,
} from "@/hooks/use-customer";
import { useIdentityStatus } from "@/hooks/use-identity";
import type { NearbyDistributor } from "@/types";

const RADIUS_OPTIONS = [1, 3, 5, 10];

function DistributorResultCard({
  d,
  viewLabel,
  servesLabel,
}: {
  d: NearbyDistributor;
  viewLabel: string;
  servesLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{d.businessName}</CardTitle>
        <p className="text-sm text-slate-500">
          {d.distanceKm != null
            ? `${d.distanceKm.toFixed(1)} km away · `
            : ""}
          {d.city || "—"}
          {d.serviceRadiusKm
            ? ` · ${servesLabel} ${d.serviceRadiusKm} km`
            : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {d.productsSummary && (
          <p className="text-sm text-slate-600">{d.productsSummary}</p>
        )}
        <div className="flex gap-2">
          <Link href={`/customer/distributors/${d.id}`}>
            <Button size="sm" variant="outline">
              {viewLabel}
            </Button>
          </Link>
          <Link href={`/customer/subscribe/${d.id}`}>
            <Button size="sm">Subscribe</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FindDistributorPage() {
  const tCustomer = useTranslations("customer");
  const tIdentity = useTranslations("identity");
  const tEmpty = useTranslations("empty");
  const { data: profile } = useCustomerProfile();
  const { data: identityStatus, isLoading: identityLoading } =
    useIdentityStatus();

  const [mode, setMode] = useState<"nearby" | "name">("nearby");
  const [radiusKm, setRadiusKm] = useState(5);
  const [customRadius, setCustomRadius] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [submittedName, setSubmittedName] = useState("");

  const effectiveRadius = useMemo(() => {
    const custom = Number(customRadius);
    if (customRadius.trim() && Number.isFinite(custom) && custom >= 1) {
      return Math.min(50, Math.max(1, custom));
    }
    return radiusKm;
  }, [customRadius, radiusKm]);

  const lat = profile?.deliveryLat ?? 0;
  const lng = profile?.deliveryLng ?? 0;
  const identityVerified =
    identityStatus?.identityVerified ?? profile?.identityVerified;

  const { data: nearby, isLoading: nearbyLoading, error: nearbyError } =
    useNearbyDistributors({
      lat,
      lng,
      radiusKm: effectiveRadius,
      enabled:
        mode === "nearby" && !!identityVerified && lat !== 0 && lng !== 0,
    });

  const {
    data: named,
    isLoading: nameLoading,
    error: nameError,
  } = useSearchDistributorsByName({
    q: submittedName,
    enabled: mode === "name" && !!identityVerified && submittedName.length >= 2,
  });

  const hasAddress = lat !== 0 && lng !== 0;
  const distributors = mode === "nearby" ? nearby : named;
  const isLoading = mode === "nearby" ? nearbyLoading : nameLoading;
  const error = mode === "nearby" ? nearbyError : nameError;

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

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={mode === "nearby" ? "default" : "outline"}
          onClick={() => setMode("nearby")}
        >
          {tCustomer("findDistributor.nearMe")}
        </Button>
        <Button
          size="sm"
          variant={mode === "name" ? "default" : "outline"}
          onClick={() => setMode("name")}
        >
          {tCustomer("findDistributor.byName")}
        </Button>
      </div>

      {mode === "nearby" ? (
        <>
          {!hasAddress && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <p className="text-sm text-amber-800">
                  Please set your delivery address in{" "}
                  <Link
                    href="/customer/profile"
                    className="font-medium underline"
                  >
                    {tCustomer("profile.title")}
                  </Link>{" "}
                  to find nearby distributors.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={
                  !customRadius && radiusKm === r ? "default" : "outline"
                }
                onClick={() => {
                  setRadiusKm(r);
                  setCustomRadius("");
                }}
                className="min-w-[4.5rem]"
              >
                {r} km
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={50}
                className="w-24"
                placeholder={tCustomer("findDistributor.customRadius")}
                value={customRadius}
                onChange={(e) => setCustomRadius(e.target.value)}
              />
              <span className="text-sm text-slate-500">km</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">{tIdentity("radiusBothHint")}</p>
        </>
      ) : (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmittedName(nameQuery.trim());
          }}
        >
          <Input
            className="max-w-sm"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder={tCustomer("findDistributor.namePlaceholder")}
            minLength={2}
          />
          <Button type="submit" size="sm" disabled={nameQuery.trim().length < 2}>
            {tCustomer("findDistributor.search")}
          </Button>
        </form>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load distributors.
        </div>
      )}

      {isLoading && (mode === "name" || hasAddress) ? (
        <p className="text-slate-500">Searching...</p>
      ) : !distributors?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            {mode === "name" && !submittedName
              ? tCustomer("findDistributor.namePlaceholder")
              : mode === "nearby" && !hasAddress
                ? "Set your address to search"
                : tEmpty("noDistributors")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {distributors.map((d) => (
            <DistributorResultCard
              key={d.id}
              d={d}
              viewLabel={tCustomer("findDistributor.viewDistributor")}
              servesLabel={tIdentity("serves")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
