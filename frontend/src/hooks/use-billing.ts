import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/lib/api";
import type {
  Bill,
  BillStatus,
  BillingSettings,
  DuesEntry,
  PaymentMethod,
} from "@/types";

export function useBillingSettings() {
  return useQuery({
    queryKey: ["distributor", "billing", "settings"],
    queryFn: async () => {
      const res = await api.get<BillingSettings>("/distributor/billing/settings");
      return res.data;
    },
  });
}

export function useUpdateBillingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BillingSettings>) => {
      const res = await api.patch<BillingSettings>(
        "/distributor/billing/settings",
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "billing", "settings"] });
    },
  });
}

export function useDistributorBills(filters?: {
  customerId?: string;
  status?: BillStatus;
}) {
  return useQuery({
    queryKey: ["distributor", "bills", filters],
    queryFn: async () => {
      const res = await api.get<Bill[]>("/distributor/bills", { params: filters });
      return res.data;
    },
  });
}

export function useDistributorBill(id: string) {
  return useQuery({
    queryKey: ["distributor", "bills", id],
    queryFn: async () => {
      const res = await api.get<Bill>(`/distributor/bills/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useRunBillingCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (referenceDate?: string) => {
      const res = await api.post("/distributor/billing/run-cycle", {
        referenceDate,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "bills"] });
      qc.invalidateQueries({ queryKey: ["distributor", "billing", "dues"] });
    },
  });
}

export function useRecordPayment(billId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      amount: number;
      method: PaymentMethod;
      reference?: string;
      paymentDate?: string;
    }) => {
      const res = await api.post(`/distributor/bills/${billId}/payments`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "bills", billId] });
      qc.invalidateQueries({ queryKey: ["distributor", "bills"] });
    },
  });
}

export function useBillingDues() {
  return useQuery({
    queryKey: ["distributor", "billing", "dues"],
    queryFn: async () => {
      const res = await api.get<DuesEntry[]>("/distributor/billing/dues");
      return res.data;
    },
  });
}

export function useCustomerBills() {
  return useQuery({
    queryKey: ["customer", "bills"],
    queryFn: async () => {
      const res = await api.get<Bill[]>("/customers/bills");
      return res.data;
    },
  });
}

export function useCustomerBill(id: string) {
  return useQuery({
    queryKey: ["customer", "bills", id],
    queryFn: async () => {
      const res = await api.get<Bill>(`/customers/bills/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

import { useAuthStore } from "@/store/auth-store";

export async function downloadBillPdf(role: "distributor" | "customer", billId: string) {
  const token = useAuthStore.getState().accessToken;
  const path =
    role === "distributor"
      ? `/distributor/bills/${billId}/pdf`
      : `/customers/bills/${billId}/pdf`;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to download PDF");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bill-${billId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openBillPdf(role: "distributor" | "customer", billId: string) {
  downloadBillPdf(role, billId);
}
