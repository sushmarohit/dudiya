import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  DistributorProfile,
  Product,
  Pricing,
  DeliverySlot,
  DistributorCustomer,
  Subscription,
  CustomerWithSubscriptions,
} from "@/types";

export function useDistributorProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["distributor", "profile"],
    queryFn: async () => {
      const res = await api.get<DistributorProfile>("/distributor/profile");
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateDistributorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DistributorProfile>) => {
      const res = await api.patch<DistributorProfile>("/distributor/profile", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "profile"] });
    },
  });
}

export function useCompleteSetupStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (step: string) => {
      const res = await api.post("/distributor/setup/complete-step", { step });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "profile"] });
    },
  });
}

export function useGoLive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/distributor/go-live");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "profile"] });
    },
  });
}

export function useDistributorProducts() {
  return useQuery({
    queryKey: ["distributor", "products"],
    queryFn: async () => {
      const res = await api.get<Product[]>("/distributor/products");
      return res.data;
    },
  });
}

export function useUpdateDistributorProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (products: { productId: string; enabled: boolean }[]) => {
      const enabledIds = products.filter((p) => p.enabled).map((p) => p.productId);
      const disabledIds = products.filter((p) => !p.enabled).map((p) => p.productId);
      let result;

      if (enabledIds.length > 0) {
        const res = await api.patch("/distributor/products", {
          enabledProductIds: enabledIds,
          enabled: true,
        });
        result = res.data;
      }

      if (disabledIds.length > 0) {
        const res = await api.patch("/distributor/products", {
          enabledProductIds: disabledIds,
          enabled: false,
        });
        result = res.data;
      }

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "products"] });
    },
  });
}

export function useCreateCustomProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      category: string;
      unit?: string;
      fatPercent?: number;
      pricePerUnit?: number;
    }) => {
      const res = await api.post<Product>("/distributor/products/custom", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "products"] });
      qc.invalidateQueries({ queryKey: ["distributor", "pricing"] });
    },
  });
}

export function useUpdateCustomProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      category?: string;
      unit?: string;
    }) => {
      const res = await api.patch<Product>(`/distributor/products/custom/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "products"] });
    },
  });
}

export function useDeactivateCustomProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<Product>(`/distributor/products/custom/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "products"] });
      qc.invalidateQueries({ queryKey: ["distributor", "pricing"] });
    },
  });
}

export function useRequestProductPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<Product>(
        `/distributor/products/custom/${id}/request-promotion`,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "products"] });
    },
  });
}

export function useDistributorPricing() {
  return useQuery({
    queryKey: ["distributor", "pricing"],
    queryFn: async () => {
      const res = await api.get<Pricing[]>("/distributor/pricing");
      return res.data;
    },
  });
}

export function useCreatePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      productId: string;
      fatPercent?: number;
      pricePerUnit: number;
    }) => {
      const res = await api.post<Pricing>("/distributor/pricing", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "pricing"] });
    },
  });
}

export function useUpdatePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string; pricePerUnit?: number; active?: boolean }) => {
      const res = await api.patch<Pricing>(`/distributor/pricing/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "pricing"] });
    },
  });
}

export function useDeliverySlots() {
  return useQuery({
    queryKey: ["distributor", "delivery-slots"],
    queryFn: async () => {
      const res = await api.get<DeliverySlot[]>("/distributor/delivery-slots");
      return res.data;
    },
  });
}

export function useCreateDeliverySlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      label: string;
      startTime: string;
      endTime: string;
    }) => {
      const res = await api.post<DeliverySlot>("/distributor/delivery-slots", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "delivery-slots"] });
    },
  });
}

export function useUpdateDeliverySlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<DeliverySlot> & { id: string }) => {
      const res = await api.patch<DeliverySlot>(
        `/distributor/delivery-slots/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "delivery-slots"] });
    },
  });
}

export function useDeleteDeliverySlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/distributor/delivery-slots/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "delivery-slots"] });
    },
  });
}

export function useDistributorCustomers(search?: string) {
  return useQuery({
    queryKey: ["distributor", "customers", search],
    queryFn: async () => {
      const res = await api.get<DistributorCustomer[]>("/distributor/customers", {
        params: search ? { search } : undefined,
      });
      return res.data;
    },
  });
}

export function useDistributorCustomer(customerId: string) {
  return useQuery({
    queryKey: ["distributor", "customers", customerId],
    queryFn: async () => {
      const res = await api.get<CustomerWithSubscriptions>(
        `/distributor/customers/${customerId}`,
      );
      return res.data;
    },
    enabled: !!customerId,
  });
}

export function useUpdateDistributorCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) => {
      const res = await api.patch<CustomerWithSubscriptions>(
        `/distributor/customers/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["distributor", "customers"] });
      qc.invalidateQueries({
        queryKey: ["distributor", "customers", variables.id],
      });
    },
  });
}

export function useCreateDistributorCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post("/distributor/customers", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "customers"] });
    },
  });
}

export function useDistributorSubscriptions() {
  return useQuery({
    queryKey: ["distributor", "subscriptions"],
    queryFn: async () => {
      const res = await api.get<Subscription[]>("/distributor/subscriptions");
      return res.data;
    },
  });
}

export function useCreateDistributorSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post<Subscription>("/distributor/subscriptions", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "subscriptions"] });
    },
  });
}

export function useUpdateDistributorSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Subscription> & { id: string }) => {
      const res = await api.patch<Subscription>(
        `/distributor/subscriptions/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributor", "subscriptions"] });
    },
  });
}
