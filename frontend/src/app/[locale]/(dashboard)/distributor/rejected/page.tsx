"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDistributorProfile } from "@/hooks/use-distributor";

export default function DistributorRejectedPage() {
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const { data } = useDistributorProfile();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <CardTitle>{tDistributor("rejected.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            {tDistributor("rejected.description")}
          </p>
          {data?.rejectionReason && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Reason:</strong> {data.rejectionReason}
            </div>
          )}
          <p className="text-sm text-slate-500">
            Contact support at support@milkflow.app for assistance.
          </p>
          <Link href="/">
            <Button variant="outline">{tCommon("back")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
