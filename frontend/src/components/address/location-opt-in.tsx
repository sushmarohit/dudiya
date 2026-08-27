"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationPreviewEmbed } from "@/components/address/location-preview-embed";
import {
  GeolocationError,
  getCurrentPosition,
  watchGeolocationPermission,
  type GeolocationErrorCode,
} from "@/lib/geolocation";
import { showToast } from "@/components/providers";
import { cn } from "@/lib/utils";

interface LocationOptInProps {
  lat?: number | null;
  lng?: number | null;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onCoordinatesClear: () => void;
  className?: string;
}

function hasValidCoordinates(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

function locationErrorMessage(
  ta: (key: string) => string,
  code: GeolocationErrorCode,
): string {
  switch (code) {
    case "denied":
      return ta("locationFetchDenied");
    case "timeout":
      return ta("locationFetchTimeout");
    case "unsupported":
      return ta("locationFetchUnsupported");
    case "insecure":
      return ta("locationFetchInsecure");
    default:
      return ta("locationFetchUnavailable");
  }
}

type OptInChoice = "yes" | "no";
type FetchState = "idle" | "loading" | "error";

export function LocationOptIn({
  lat,
  lng,
  onCoordinatesChange,
  onCoordinatesClear,
  className,
}: LocationOptInProps) {
  const ta = useTranslations("address");
  const hasCoords = hasValidCoordinates(lat, lng);

  // Signup/new forms: always start off. Existing coords (profile): keep Yes.
  const [choice, setChoice] = useState<OptInChoice>(() =>
    hasCoords ? "yes" : "no",
  );
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorCode, setErrorCode] = useState<GeolocationError["code"] | null>(
    null,
  );

  const onChangeRef = useRef(onCoordinatesChange);
  const onClearRef = useRef(onCoordinatesClear);
  const fetchInFlight = useRef(false);
  const choiceRef = useRef(choice);
  const hasCoordsRef = useRef(hasCoords);
  const userDismissedRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onCoordinatesChange;
    onClearRef.current = onCoordinatesClear;
  });

  useEffect(() => {
    choiceRef.current = choice;
  }, [choice]);

  useEffect(() => {
    hasCoordsRef.current = hasCoords;
  }, [hasCoords]);

  const fetchLocation = useCallback(async () => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    setFetchState("loading");
    setErrorCode(null);

    try {
      const position = await getCurrentPosition();
      onChangeRef.current(position.lat, position.lng);
      setFetchState("idle");
      showToast(ta("locationCaptured"), "success");
    } catch (error) {
      setFetchState("error");
      if (error instanceof GeolocationError) {
        setErrorCode(error.code);
        showToast(locationErrorMessage(ta, error.code), "error");
      } else {
        setErrorCode("unavailable");
        showToast(ta("locationFetchUnavailable"), "error");
      }
    } finally {
      fetchInFlight.current = false;
    }
  }, [ta]);

  // If the user grants permission in browser settings after a deny, retry.
  useEffect(() => {
    return watchGeolocationPermission((state) => {
      if (state !== "granted") return;
      if (choiceRef.current !== "yes") return;
      if (hasCoordsRef.current) return;
      if (fetchInFlight.current) return;
      void fetchLocation();
    });
  }, [fetchLocation]);

  // Profile edit: async form reset may deliver saved coordinates after mount
  useEffect(() => {
    if (!hasCoords || userDismissedRef.current || choice === "yes") return;
    setChoice("yes");
  }, [hasCoords, choice]);

  function handleYes() {
    userDismissedRef.current = false;
    setChoice("yes");
    setErrorCode(null);
    if (hasCoords && fetchState !== "error") return;
    void fetchLocation();
  }

  function handleNo() {
    userDismissedRef.current = true;
    setChoice("no");
    setFetchState("idle");
    setErrorCode(null);
    onClearRef.current();
  }

  const wantsLocation = choice === "yes";
  const showCoords =
    wantsLocation && hasCoords && fetchState !== "loading";

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">
          {ta("shareLocationQuestion")}
        </p>
        <p className="text-xs text-slate-500">{ta("shareLocationHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleNo}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            choice === "no"
              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          {ta("shareLocationNo")}
        </button>
        <button
          type="button"
          onClick={handleYes}
          disabled={fetchState === "loading"}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            choice === "yes"
              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          <MapPin className="h-4 w-4" aria-hidden />
          {ta("shareLocationYes")}
        </button>
      </div>

      {wantsLocation ? (
        <div className="space-y-3">
          {fetchState === "loading" ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
              <Loader2
                className="h-4 w-4 animate-spin text-emerald-600"
                aria-hidden
              />
              {ta("fetchingLocation")}
            </div>
          ) : null}

          {fetchState === "error" && errorCode ? (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3">
              <p className="text-sm text-red-700">
                {locationErrorMessage(ta, errorCode)}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void fetchLocation()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                {ta("retryLocation")}
              </Button>
            </div>
          ) : null}

          {showCoords ? (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-white px-3 py-3">
              <div className="flex items-start gap-2 text-sm text-emerald-800">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <div>
                  <p className="font-medium">{ta("locationCaptured")}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {ta("latitude")}: {lat!.toFixed(6)}, {ta("longitude")}:{" "}
                    {lng!.toFixed(6)}
                  </p>
                </div>
              </div>
              <LocationPreviewEmbed lat={lat!} lng={lng!} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void fetchLocation()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                {ta("updateLocation")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-slate-500">{ta("shareLocationSkipped")}</p>
      )}
    </div>
  );
}
