export type GeolocationErrorCode =
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported"
  | "insecure";

export class GeolocationError extends Error {
  code: GeolocationErrorCode;

  constructor(code: GeolocationErrorCode) {
    super(code);
    this.code = code;
    this.name = "GeolocationError";
  }
}

function mapPositionError(error: GeolocationPositionError): GeolocationError {
  if (error.code === error.PERMISSION_DENIED) {
    return new GeolocationError("denied");
  }
  if (error.code === error.TIMEOUT) {
    return new GeolocationError("timeout");
  }
  return new GeolocationError("unavailable");
}

function assertGeolocationAvailable(): void {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    // Geolocation is blocked on http://LAN-IP — only localhost / HTTPS work.
    throw new GeolocationError("insecure");
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new GeolocationError("unsupported");
  }
}

function requestPosition(
  options: PositionOptions,
): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    try {
      assertGeolocationAvailable();
    } catch (error) {
      reject(error);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => reject(mapPositionError(error)),
      options,
    );
  });
}

/**
 * Prefer a fast network/Wi‑Fi fix first (works on most desktops), then try to
 * refine with high-accuracy GPS when available.
 */
export async function getCurrentPosition(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
}> {
  assertGeolocationAvailable();

  try {
    return await requestPosition({
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 60_000,
    });
  } catch (error) {
    if (
      error instanceof GeolocationError &&
      (error.code === "denied" ||
        error.code === "unsupported" ||
        error.code === "insecure")
    ) {
      throw error;
    }
  }

  // Second attempt: GPS / high accuracy (phones), longer wait.
  try {
    return await requestPosition({
      enableHighAccuracy: true,
      timeout: 25_000,
      maximumAge: 0,
    });
  } catch (error) {
    if (error instanceof GeolocationError) throw error;
    throw new GeolocationError("unavailable");
  }
}

/** Subscribe to geolocation permission flips (e.g. user allows in browser UI). */
export function watchGeolocationPermission(
  onChange: (state: PermissionState) => void,
): () => void {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return () => undefined;
  }

  let status: PermissionStatus | null = null;
  let cancelled = false;

  const handleChange = () => {
    if (status) onChange(status.state);
  };

  void navigator.permissions
    .query({ name: "geolocation" })
    .then((result) => {
      if (cancelled) return;
      status = result;
      result.addEventListener("change", handleChange);
    })
    .catch(() => {
      // Permissions API not available for geolocation in some browsers.
    });

  return () => {
    cancelled = true;
    status?.removeEventListener("change", handleChange);
  };
}
