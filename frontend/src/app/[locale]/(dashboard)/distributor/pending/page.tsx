"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DistributorPendingPage() {
  const tDistributor = useTranslations("distributor");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Clock className="mx-auto h-12 w-12 text-amber-500" />
          <CardTitle>{tDistributor("pending.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            {tDistributor("pending.description")}
          </p>
          <Link href="/distributor/dashboard">
            <Button variant="outline">{tDistributor("dashboard.title")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
