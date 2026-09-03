"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LocationOptIn } from "@/components/address/location-opt-in";
import { formatAddressPreview } from "@/lib/address";
import { cn } from "@/lib/utils";

interface AddressFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  /** Show GPS location capture (no map). */
  showLocation?: boolean;
  /** @deprecated Use showLocation. Kept for call-site compatibility. */
  showMap?: boolean;
  /** @deprecated Location opt-in is always used when showLocation is true. */
  locationOptIn?: boolean;
  /** Tighter multi-column layout for wide desktop forms. */
  dense?: boolean;
  className?: string;
}

export function AddressFormFields({
  register,
  watch,
  setValue,
  errors,
  showLocation,
  showMap = true,
  dense = false,
  className,
}: AddressFormFieldsProps) {
  const ta = useTranslations("address");
  const tc = useTranslations("common");
  const addressType = (watch("addressType") as string) || "URBAN";
  const lat = watch("lat") as number | undefined;
  const lng = watch("lng") as number | undefined;
  const preview = formatAddressPreview(
    watch() as Parameters<typeof formatAddressPreview>[0],
  );
  const shouldShowLocation = showLocation ?? showMap;

  const handleCoordinatesChange = useCallback(
    (newLat: number, newLng: number) => {
      setValue("lat", newLat, { shouldValidate: true, shouldDirty: true });
      setValue("lng", newLng, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const handleCoordinatesClear = useCallback(() => {
    setValue("lat", null, { shouldValidate: true, shouldDirty: true });
    setValue("lng", null, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label>{ta("type")}</Label>
        <div className="flex flex-wrap gap-2">
          {(["URBAN", "RURAL"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                setValue("addressType", type, { shouldValidate: true })
              }
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                addressType === type
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {type === "URBAN" ? ta("urban") : ta("rural")}
            </button>
          ))}
        </div>
      </div>

      {addressType === "URBAN" ? (
        <div
          className={cn(
            "grid gap-4",
            dense
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "sm:grid-cols-2",
          )}
        >
          <div className="space-y-2">
            <Label>{ta("flat")}</Label>
            <Input placeholder={ta("flat")} {...register("flatOrHouseNo")} />
          </div>
          <div className="space-y-2">
            <Label>{ta("building")}</Label>
            <Input
              placeholder={ta("building")}
              {...register("buildingOrSociety")}
            />
          </div>
          <div className={cn("space-y-2", dense && "lg:col-span-1", !dense && "sm:col-span-2")}>
            <Label>{ta("street")}</Label>
            <Input placeholder={ta("area")} {...register("streetOrLane")} />
          </div>
          <div className="space-y-2">
            <Label>{tc("city")} *</Label>
            <Input {...register("city")} />
            {errors.city && (
              <p className="text-sm text-red-600">
                {errors.city.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{ta("state")}</Label>
            <Input placeholder={ta("state")} {...register("state")} />
          </div>
          <div className="space-y-2">
            <Label>{tc("pincode")}</Label>
            <Input {...register("pincode")} />
            {errors.pincode && (
              <p className="text-sm text-red-600">
                {errors.pincode.message as string}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            dense ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
          )}
        >
          <div className="space-y-2">
            <Label>{ta("flat")}</Label>
            <Input placeholder={ta("flat")} {...register("flatOrHouseNo")} />
          </div>
          <div className="space-y-2">
            <Label>{ta("village")} *</Label>
            <Input {...register("village")} />
            {errors.village && (
              <p className="text-sm text-red-600">
                {errors.village.message as string}
              </p>
            )}
          </div>
          <div className={cn("space-y-2", !dense && "sm:col-span-2")}>
            <Label>{ta("landmark")}</Label>
            <Input placeholder={ta("landmark")} {...register("landmark")} />
            {errors.landmark && (
              <p className="text-sm text-red-600">
                {errors.landmark.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{ta("district")} *</Label>
            <Input {...register("district")} />
            {errors.district && (
              <p className="text-sm text-red-600">
                {errors.district.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{ta("state")} *</Label>
            <Input {...register("state")} />
            {errors.state && (
              <p className="text-sm text-red-600">
                {errors.state.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{tc("pincode")}</Label>
            <Input {...register("pincode")} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>{ta("line2")}</Label>
        <Input placeholder={ta("line2")} {...register("addressLine")} />
      </div>

      {shouldShowLocation ? (
        <LocationOptIn
          lat={lat}
          lng={lng}
          onCoordinatesChange={handleCoordinatesChange}
          onCoordinatesClear={handleCoordinatesClear}
        />
      ) : null}

      {preview ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="font-medium text-slate-500">
            {ta("addressPreview")}:{" "}
          </span>
          {preview}
        </div>
      ) : null}
    </div>
  );
}
