export type AddressType = "URBAN" | "RURAL";

export function formatAddressPreview(
  data: Partial<{
    addressType?: AddressType;
    flatOrHouseNo?: string | null;
    buildingOrSociety?: string | null;
    streetOrLane?: string | null;
    landmark?: string | null;
    village?: string | null;
    district?: string | null;
    state?: string | null;
    city?: string | null;
    pincode?: string | null;
  }>,
): string {
  const parts: string[] = [];
  if (data.addressType === "RURAL") {
    if (data.flatOrHouseNo) parts.push(data.flatOrHouseNo);
    if (data.village) parts.push(data.village);
    if (data.landmark) parts.push(`Near ${data.landmark}`);
    if (data.district) parts.push(data.district);
    if (data.state) parts.push(data.state);
    if (data.pincode) parts.push(`PIN ${data.pincode}`);
  } else {
    if (data.flatOrHouseNo) parts.push(data.flatOrHouseNo);
    if (data.buildingOrSociety) parts.push(data.buildingOrSociety);
    if (data.streetOrLane) parts.push(data.streetOrLane);
    if (data.landmark) parts.push(`Near ${data.landmark}`);
    if (data.city) parts.push(data.city);
    if (data.state) parts.push(data.state);
    if (data.pincode) parts.push(data.pincode);
  }
  return parts.filter(Boolean).join(", ");
}

export type StructuredAddressInput = {
  addressType?: AddressType;
  flatOrHouseNo?: string;
  buildingOrSociety?: string;
  streetOrLane?: string;
  landmark?: string;
  village?: string;
  district?: string;
  state?: string;
  addressLine?: string;
  city?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
};

export function profileToAddressDefaults(profile?: Record<string, unknown>) {
  if (!profile) {
    return {
      addressType: "URBAN" as const,
      flatOrHouseNo: "",
      buildingOrSociety: "",
      streetOrLane: "",
      landmark: "",
      village: "",
      district: "",
      state: "",
      addressLine: "",
      city: "",
      pincode: "",
      lat: undefined as number | undefined,
      lng: undefined as number | undefined,
    };
  }
  return {
    addressType: (profile.addressType as AddressType) ?? "URBAN",
    flatOrHouseNo: (profile.flatOrHouseNo as string) ?? "",
    buildingOrSociety: (profile.buildingOrSociety as string) ?? "",
    streetOrLane: (profile.streetOrLane as string) ?? "",
    landmark: (profile.landmark as string) ?? "",
    village: (profile.village as string) ?? "",
    district: (profile.district as string) ?? "",
    state: (profile.state as string) ?? "",
    addressLine: (profile.addressLine as string) ?? "",
    city: (profile.city as string) ?? "",
    pincode: (profile.pincode as string) ?? "",
    lat:
      (profile.deliveryLat as number | undefined) ??
      (profile.serviceLat as number | undefined) ??
      (profile.lat as number | undefined),
    lng:
      (profile.deliveryLng as number | undefined) ??
      (profile.serviceLng as number | undefined) ??
      (profile.lng as number | undefined),
  };
}
