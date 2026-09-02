"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Admin approval removed — redirect legacy rejected URL to setup. */
export default function DistributorRejectedPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/distributor/setup");
  }, [router]);
  return null;
}
