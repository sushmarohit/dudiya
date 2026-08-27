import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeliveryItem, DeliveryItemStatus } from "@/types";

export type DeliveryListFilters = {
  date?: string;
  month?: string;
  from?: string;
  to?: string;
  slotId?: string;
  customerId?: string;
};

export function useDistributorDeliveries(filters: DeliveryListFilters) {
  const enabled = !!(filters.date || filters.month || (filters.from && filters.to));
  return useQuery({
    queryKey: ["distributor", "deliveries", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.date) params.date = filters.date;
      if (filters.month) params.month = filters.month;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.slotId) params.slotId = filters.slotId;
      if (filters.customerId) params.customerId = filters.customerId;

      const res = await api.get<DeliveryItem[]>("/distributor/deliveries", {
        params,
      });
      return res.data;
    },
    enabled,
  });
}

export function useGenerateDeliveries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { date: string; slotId?: string }) => {
      const res = await api.post("/distributor/deliveries/generate", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "deliveries"] });
    },
  });
}

export function useUpdateDeliveryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: DeliveryItemStatus;
      deliveredQty?: number;
      notes?: string;
      date?: string;
    }) => {
      const res = await api.patch(`/distributor/delivery-items/${id}`, data);
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["distributor", "deliveries"] });
      if (vars.date) {
        qc.invalidateQueries({ queryKey: ["customer", "deliveries"] });
      }
    },
  });
}

export function useBulkDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      slotId?: string;
      status: DeliveryItemStatus;
      notes?: string;
    }) => {
      const res = await api.post("/distributor/deliveries/bulk-status", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "deliveries"] });
    },
  });
}

export function useCustomerDeliveries(from: string, to: string) {
  return useQuery({
    queryKey: ["customer", "deliveries", from, to],
    queryFn: async () => {
      const res = await api.get<DeliveryItem[]>("/customers/deliveries", {
        params: { from, to },
      });
      return res.data;
    },
    enabled: !!from && !!to,
  });
}

export async function downloadDeliveryExport(
  filters: DeliveryListFilters,
  format = "csv",
) {
  const params: Record<string, string> = { format };
  if (filters.date) params.date = filters.date;
  if (filters.month) params.month = filters.month;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.slotId) params.slotId = filters.slotId;
  if (filters.customerId) params.customerId = filters.customerId;

  const res = await api.get("/distributor/deliveries/export", {
    params,
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const scope =
    filters.date ||
    filters.month ||
    (filters.from && filters.to ? `${filters.from}_to_${filters.to}` : "export");
  link.download = `deliveries-${scope}${filters.customerId ? "-customer" : "-all"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
