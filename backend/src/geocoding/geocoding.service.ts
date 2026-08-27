import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AddressInput,
  buildGeocodeQuery,
  ResolvedAddress,
  validateAddressInput,
  addressFieldsFromInput,
} from '../common/address/address.util';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private config: ConfigService) {}

  /** @deprecated Use resolveAddress instead */
  geocode(
    pincode?: string | null,
    city?: string | null,
    addressLine?: string | null,
  ): GeoCoordinates {
    return this.mockGeocode(`${pincode ?? ''}|${city ?? ''}|${addressLine ?? ''}`);
  }

  async resolveAddress(input: AddressInput): Promise<ResolvedAddress> {
    validateAddressInput(input);
    const fields = addressFieldsFromInput(input);

    if (input.lat != null && input.lng != null) {
      let formatted = fields.formattedAddress;
      if (!formatted || formatted.length < 5) {
        formatted =
          (await this.reverseGeocode(input.lat, input.lng)) ??
          fields.formattedAddress;
      }
      return {
        ...input,
        ...fields,
        formattedAddress: formatted,
        lat: input.lat,
        lng: input.lng,
      };
    }

    const query = buildGeocodeQuery(input);
    const coords = await this.forwardGeocode(query);
    return {
      ...input,
      ...fields,
      formattedAddress: fields.formattedAddress,
      lat: coords.lat,
      lng: coords.lng,
    };
  }

  async forwardGeocode(query: string): Promise<GeoCoordinates> {
    const googleKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (googleKey) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('address', query);
        url.searchParams.set('key', googleKey);
        url.searchParams.set('region', 'in');
        const res = await fetch(url.toString());
        const data = (await res.json()) as {
          results?: { geometry: { location: { lat: number; lng: number } } }[];
          status?: string;
        };
        if (data.results?.[0]) {
          const { lat, lng } = data.results[0].geometry.location;
          return { lat, lng };
        }
        this.logger.warn(`Google geocode failed: ${data.status} for ${query}`);
      } catch (err) {
        this.logger.warn(`Google geocode error: ${err}`);
      }
    }

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'in');
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'MilkDistributionSaaS/1.0' },
      });
      const data = (await res.json()) as { lat: string; lon: string }[];
      if (data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (err) {
      this.logger.warn(`Nominatim geocode error: ${err}`);
    }

    return this.mockGeocode(query);
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const googleKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (googleKey) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('latlng', `${lat},${lng}`);
        url.searchParams.set('key', googleKey);
        const res = await fetch(url.toString());
        const data = (await res.json()) as {
          results?: { formatted_address: string }[];
        };
        if (data.results?.[0]?.formatted_address) {
          return data.results[0].formatted_address;
        }
      } catch (err) {
        this.logger.warn(`Google reverse geocode error: ${err}`);
      }
    }

    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lng));
      url.searchParams.set('format', 'json');
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'MilkDistributionSaaS/1.0' },
      });
      const data = (await res.json()) as { display_name?: string };
      return data.display_name ?? null;
    } catch (err) {
      this.logger.warn(`Nominatim reverse geocode error: ${err}`);
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  private mockGeocode(input: string): GeoCoordinates {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    const lat = 8 + (hash % 2500000) / 100000;
    const lng = 68 + ((hash >> 8) % 2800000) / 100000;
    return {
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
    };
  }
}
