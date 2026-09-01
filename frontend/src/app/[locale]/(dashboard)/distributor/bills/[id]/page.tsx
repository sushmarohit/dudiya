"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/responsive-table";
import {
  downloadBillPdf,
  useDistributorBill,
  useRecordPayment,
} from "@/hooks/use-billing";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { isBillingEnabled } from "@/lib/feature-flags";

export default function DistributorBillDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const { data: bill, isLoading } = useDistributorBill(id);
  const recordPayment = useRecordPayment(id);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "UPI" | "BANK" | "OTHER">("CASH");

  if (isLoading || !bill) {
    return <p className="text-slate-500">{tc("loading")}</p>;
  }

  const balance = Number(bill.total) - Number(bill.amountPaid);

  const handleRecordPayment = async () => {
    try {
      await recordPayment.mutateAsync({ amount: parseFloat(amount), method });
      setAmount("");
      showToast(tc("saved"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("billDetail")} description={bill.id} />
      <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
        <p>{t("total")}: ₹{Number(bill.total).toFixed(2)}</p>
        <p>{t("paid")}: ₹{Number(bill.amountPaid).toFixed(2)}</p>
        <p>{t("balance")}: ₹{balance.toFixed(2)}</p>
        <p>{tc("status")}: {bill.status}</p>
        <Button variant="outline" size="sm" onClick={() => downloadBillPdf("distributor", id)}>
          {t("downloadPdf")}
        </Button>
      </div>

      {bill.lineItems?.length ? (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2">{tc("date")}</th>
                <th className="px-4 py-2">{tc("product")}</th>
                <th className="px-4 py-2">{tc("quantity")}</th>
                <th className="px-4 py-2">{t("lineTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {bill.lineItems.map((line) => (
                <tr key={line.id} className="border-t">
                  <td className="px-4 py-2">{line.deliveryDate.split("T")[0]}</td>
                  <td className="px-4 py-2">{line.product?.name}</td>
                  <td className="px-4 py-2">{line.quantity}</td>
                  <td className="px-4 py-2">₹{Number(line.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {balance > 0 && bill.status !== "VOID" && isBillingEnabled() && (
        <div className="rounded-lg border bg-white p-4 space-y-3 max-w-md">
          <h3 className="font-medium">{t("recordPayment")}</h3>
          <div>
            <Label>{t("amount")}</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          </div>
          <div>
            <Label>{t("method")}</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <Button
            onClick={() => void handleRecordPayment()}
            disabled={!amount || recordPayment.isPending}
          >
            {t("recordPayment")}
          </Button>
        </div>
      )}
    </div>
  );
}
