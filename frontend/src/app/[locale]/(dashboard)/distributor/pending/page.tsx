"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Admin approval removed — redirect legacy pending URL to setup. */
export default function DistributorPendingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/distributor/setup");
  }, [router]);
  return null;
}
