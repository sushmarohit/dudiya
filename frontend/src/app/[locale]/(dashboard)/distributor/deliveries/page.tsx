"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";
import {
  useDeliverySlots,
  useDistributorCustomers,
} from "@/hooks/use-distributor";
import {
  downloadDeliveryExport,
  useBulkDeliveryStatus,
  useDistributorDeliveries,
  useGenerateDeliveries,
  useUpdateDeliveryItem,
  type DeliveryListFilters,
} from "@/hooks/use-delivery";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function currentMonthStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatItemDate(value: string | Date | undefined) {
  if (!value) return "—";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

type FilterMode = "day" | "month";

export default function DistributorDeliveriesPage() {
  const t = useTranslations("delivery");
  const tc = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();

  const [mode, setMode] = useState<FilterMode>("day");
  const [date, setDate] = useState(todayStr());
  const [month, setMonth] = useState(currentMonthStr());
  const [slotId, setSlotId] = useState("");
  const [customerId, setCustomerId] = useState("");

  const { data: slots } = useDeliverySlots();
  const { data: customers } = useDistributorCustomers();

  const filters: DeliveryListFilters = useMemo(() => {
    const base: DeliveryListFilters = {
      slotId: slotId || undefined,
      customerId: customerId || undefined,
    };
    if (mode === "month") {
      return { ...base, month };
    }
    return { ...base, date };
  }, [mode, date, month, slotId, customerId]);

  const { data, isLoading, error, refetch } = useDistributorDeliveries(filters);
  const generate = useGenerateDeliveries();
  const updateItem = useUpdateDeliveryItem();
  const bulkStatus = useBulkDeliveryStatus();

  const customerOptions = (customers || []) as unknown as Array<{
    id: string;
    user?: { name?: string; phone?: string | null };
  }>;

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync({ date, slotId: slotId || undefined });
      showToast(tc("created"), "success");
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleMarkAllDelivered = async () => {
    const ok = await confirm({
      title: tc("confirmMarkDeliveredTitle"),
      description: tc("confirmMarkDeliveredDescription"),
      confirmLabel: t("markAllDelivered"),
    });
    if (!ok) return;
    try {
      await bulkStatus.mutateAsync({
        date,
        slotId: slotId || undefined,
        status: "DELIVERED",
      });
      showToast(tc("updated"), "success");
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleExport = async () => {
    try {
      await downloadDeliveryExport(filters);
      showToast(t("exportReady"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={mode === "day" ? "default" : "outline"}
          onClick={() => setMode("day")}
        >
          {t("filterByDay")}
        </Button>
        <Button
          size="sm"
          variant={mode === "month" ? "default" : "outline"}
          onClick={() => setMode("month")}
        >
          {t("filterByMonth")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {mode === "day" ? (
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        ) : (
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-auto"
          />
        )}

        <select
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">{t("allCustomers")}</option>
          {customerOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.user?.name || c.id}
              {c.user?.phone ? ` · ${c.user.phone}` : ""}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
        >
          <option value="">{t("allSlots")}</option>
          {slots?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {mode === "day" && (
          <>
            <Button
              onClick={() => void handleGenerate()}
              disabled={generate.isPending}
            >
              {t("generate")}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleMarkAllDelivered()}
              disabled={bulkStatus.isPending}
            >
              {t("markAllDelivered")}
            </Button>
          </>
        )}

        <Button variant="outline" onClick={() => void handleExport()}>
          {t("exportCsv")}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("loadFailed")}
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">{tc("loading")}</p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            {mode === "day" ? t("empty") : t("emptyRange")}
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">{tc("date")}</th>
                <th className="px-4 py-3">{tc("name")}</th>
                <th className="px-4 py-3">{tc("product")}</th>
                <th className="px-4 py-3">{tc("quantity")}</th>
                <th className="px-4 py-3">{tc("status")}</th>
                <th className="px-4 py-3">{tc("phone")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((item) => (
                <tr key={item.id} className="bg-white">
                  <td className="px-4 py-3">
                    {formatItemDate(item.deliveryDate)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {item.customer?.user?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{item.product?.name}</td>
                  <td className="px-4 py-3">{item.plannedQty}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">
                    {item.customer?.user?.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {mode === "day" && item.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await updateItem.mutateAsync({
                              id: item.id,
                              status: "DELIVERED",
                              deliveredQty: item.plannedQty,
                              date,
                            });
                            showToast(tc("updated"), "success");
                          } catch (err) {
                            showToast(getApiErrorMessage(err), "error");
                          }
                        }}
                      >
                        {t("markDelivered")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
