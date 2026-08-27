"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

interface LocationPreviewEmbedProps {
  lat: number;
  lng: number;
  height?: string;
  className?: string;
}

/**
 * Read-only Google Maps embed for a lat/lng pin.
 * Uses the classic maps embed URL (no Maps JS SDK required).
 */
export function LocationPreviewEmbed({
  lat,
  lng,
  height = "240px",
  className,
}: LocationPreviewEmbedProps) {
  const ta = useTranslations("address");

  const { src, openUrl } = useMemo(() => {
    const q = `${lat},${lng}`;
    return {
      src: `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=18&output=embed`,
      openUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    };
  }, [lat, lng]);

  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
        style={{ height }}
      >
        <iframe
          title={ta("locationPreviewTitle")}
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 underline-offset-2 hover:underline"
        >
          {ta("openInMaps")}
        </a>
      </p>
    </div>
  );
}
