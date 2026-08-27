import { AddressType } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';
import { ApiErrorCode } from '../errors/api-error-code.enum';
import { throwApi } from '../errors/throw-api';

export interface AddressInput {
  addressType?: AddressType;
  flatOrHouseNo?: string | null;
  buildingOrSociety?: string | null;
  streetOrLane?: string | null;
  landmark?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  addressLine?: string | null;
  city?: string | null;
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface ResolvedAddress extends AddressInput {
  formattedAddress: string;
  lat: number;
  lng: number;
}

export function validateAddressInput(input: AddressInput): void {
  const type = input.addressType ?? AddressType.URBAN;
  const hasMapPin =
    input.lat != null &&
    input.lng != null &&
    !Number.isNaN(input.lat) &&
    !Number.isNaN(input.lng);

  if (type === AddressType.URBAN) {
    const hasLine =
      input.flatOrHouseNo?.trim() ||
      input.buildingOrSociety?.trim() ||
      input.streetOrLane?.trim() ||
      input.addressLine?.trim();
    if (!hasLine) {
      throwApi(ApiErrorCode.ADDRESS_URBAN_LINE_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    if (!input.city?.trim()) {
      throwApi(ApiErrorCode.ADDRESS_CITY_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    if (!hasMapPin && !input.pincode?.trim()) {
      throwApi(ApiErrorCode.ADDRESS_PINCODE_OR_MAP_REQUIRED, HttpStatus.BAD_REQUEST);
    }
  } else {
    if (!input.village?.trim()) {
      throwApi(ApiErrorCode.ADDRESS_VILLAGE_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    if (!input.district?.trim()) {
      throwApi(ApiErrorCode.ADDRESS_DISTRICT_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    if (!input.state?.trim()) {
      throwApi(ApiErrorCode.ADDRESS_STATE_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    if (!hasMapPin && !input.pincode?.trim() && !input.landmark?.trim()) {
      throwApi(ApiErrorCode.ADDRESS_RURAL_LOCATION_REQUIRED, HttpStatus.BAD_REQUEST);
    }
  }
}

export function buildFormattedAddress(input: AddressInput): string {
  const type = input.addressType ?? AddressType.URBAN;
  const parts: string[] = [];

  if (type === AddressType.URBAN) {
    if (input.flatOrHouseNo?.trim()) parts.push(input.flatOrHouseNo.trim());
    if (input.buildingOrSociety?.trim()) parts.push(input.buildingOrSociety.trim());
    if (input.streetOrLane?.trim()) parts.push(input.streetOrLane.trim());
    if (input.landmark?.trim()) parts.push(`Near ${input.landmark.trim()}`);
    if (input.addressLine?.trim() && !parts.length) parts.push(input.addressLine.trim());
    if (input.city?.trim()) parts.push(input.city.trim());
    if (input.state?.trim()) parts.push(input.state.trim());
    if (input.pincode?.trim()) parts.push(input.pincode.trim());
  } else {
    if (input.flatOrHouseNo?.trim()) parts.push(input.flatOrHouseNo.trim());
    if (input.village?.trim()) parts.push(input.village.trim());
    if (input.landmark?.trim()) parts.push(`Near ${input.landmark.trim()}`);
    if (input.addressLine?.trim()) parts.push(input.addressLine.trim());
    if (input.district?.trim()) parts.push(input.district.trim());
    if (input.state?.trim()) parts.push(input.state.trim());
    if (input.pincode?.trim()) parts.push(`PIN ${input.pincode.trim()}`);
  }

  return parts.filter(Boolean).join(', ');
}

export function buildGeocodeQuery(input: AddressInput): string {
  const formatted = buildFormattedAddress(input);
  if (formatted) return `${formatted}, India`;
  return [input.addressLine, input.city, input.pincode, 'India']
    .filter(Boolean)
    .join(', ');
}

export function addressFieldsFromInput(input: AddressInput) {
  const formattedAddress = buildFormattedAddress(input);
  return {
    addressType: input.addressType ?? AddressType.URBAN,
    flatOrHouseNo: input.flatOrHouseNo ?? null,
    buildingOrSociety: input.buildingOrSociety ?? null,
    streetOrLane: input.streetOrLane ?? null,
    landmark: input.landmark ?? null,
    village: input.village ?? null,
    district: input.district ?? null,
    state: input.state ?? null,
    addressLine: input.addressLine ?? formattedAddress,
    formattedAddress,
    city: input.city ?? null,
    pincode: input.pincode ?? null,
  };
}

export function toCustomerLocationData(resolved: ResolvedAddress) {
  const fields = addressFieldsFromInput(resolved);
  return {
    ...fields,
    deliveryLat: resolved.lat,
    deliveryLng: resolved.lng,
  };
}

export function toDistributorLocationData(resolved: ResolvedAddress) {
  const fields = addressFieldsFromInput(resolved);
  return {
    ...fields,
    serviceLat: resolved.lat,
    serviceLng: resolved.lng,
  };
}

export function mergeAddressInput(
  existing: AddressInput,
  dto: Partial<AddressInput>,
): AddressInput {
  return {
    addressType: dto.addressType ?? existing.addressType,
    flatOrHouseNo: dto.flatOrHouseNo ?? existing.flatOrHouseNo,
    buildingOrSociety: dto.buildingOrSociety ?? existing.buildingOrSociety,
    streetOrLane: dto.streetOrLane ?? existing.streetOrLane,
    landmark: dto.landmark ?? existing.landmark,
    village: dto.village ?? existing.village,
    district: dto.district ?? existing.district,
    state: dto.state ?? existing.state,
    addressLine: dto.addressLine ?? existing.addressLine,
    city: dto.city ?? existing.city,
    pincode: dto.pincode ?? existing.pincode,
    lat: dto.lat ?? existing.lat,
    lng: dto.lng ?? existing.lng,
  };
}
