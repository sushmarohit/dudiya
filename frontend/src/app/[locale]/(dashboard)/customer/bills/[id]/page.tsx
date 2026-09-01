"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/responsive-table";
import { downloadBillPdf, useCustomerBill } from "@/hooks/use-billing";
import { FeatureDisabledNotice } from "@/components/feature-disabled-notice";
import { isBillingEnabled } from "@/lib/feature-flags";

export default function CustomerBillDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const { data: bill, isLoading } = useCustomerBill(id);

  if (!isBillingEnabled()) {
    return (
      <FeatureDisabledNotice feature="billing" backHref="/customer/profile" />
    );
  }

  if (isLoading || !bill) {
    return <p className="text-slate-500">{tc("loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={bill.distributor?.businessName ?? t("billDetail")}
        description={`${bill.cycleStart.split("T")[0]} – ${bill.cycleEnd.split("T")[0]}`}
      />
      <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
        <p>{t("total")}: ₹{Number(bill.total).toFixed(2)}</p>
        <p>{t("paid")}: ₹{Number(bill.amountPaid).toFixed(2)}</p>
        <p>{tc("status")}: {bill.status}</p>
        <Button variant="outline" size="sm" onClick={() => downloadBillPdf("customer", id)}>
          {t("downloadPdf")}
        </Button>
      </div>
      {bill.lineItems?.map((line) => (
        <div key={line.id} className="text-sm border-b py-2">
          {line.deliveryDate.split("T")[0]} — {line.product?.name} — {line.quantity} × ₹
          {Number(line.unitPrice).toFixed(2)}
        </div>
      ))}
    </div>
  );
}
