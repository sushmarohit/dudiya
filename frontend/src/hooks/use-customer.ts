import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type {
  CustomerProfile,
  NearbyDistributor,
  NearbyDistributorsResponse,
  DistributorDetail,
  Subscription,
  SchedulePreviewResponse,
} from "@/types";

export function useCustomerProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["customer", "profile"],
    queryFn: async () => {
      const res = await api.get<CustomerProfile>("/customers/profile");
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateCustomerProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.patch<CustomerProfile>("/customers/profile", data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["customer", "profile"] });
      if (data.user) {
        updateUser({
          name: data.user.name,
          phone: data.user.phone ?? undefined,
        });
      }
    },
  });
}

export function useNearbyDistributors(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  page?: number;
  enabled?: boolean;
}) {
  const { enabled, ...queryParams } = params;
  return useQuery({
    queryKey: ["customer", "distributors", "nearby", queryParams],
    queryFn: async () => {
      const res = await api.get<NearbyDistributorsResponse>(
        "/customers/distributors/nearby",
        { params: queryParams },
      );
      return res.data.items;
    },
    enabled:
      (enabled ?? true) && queryParams.lat !== 0 && queryParams.lng !== 0,
  });
}

export function useSearchDistributorsByName(params: {
  q: string;
  page?: number;
  enabled?: boolean;
}) {
  const { enabled, q, page } = params;
  return useQuery({
    queryKey: ["customer", "distributors", "search", q, page],
    queryFn: async () => {
      const res = await api.get<NearbyDistributorsResponse>(
        "/customers/distributors/search",
        { params: { q, page } },
      );
      return res.data.items;
    },
    enabled: (enabled ?? true) && q.trim().length >= 2,
  });
}

export function useDistributorDetail(id: string) {
  return useQuery({
    queryKey: ["customer", "distributors", id],
    queryFn: async () => {
      const res = await api.get<DistributorDetail>(
        `/customers/distributors/${id}`,
      );
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCustomerSubscriptions() {
  return useQuery({
    queryKey: ["customer", "subscriptions"],
    queryFn: async () => {
      const res = await api.get<Subscription[]>("/customers/subscriptions");
      return res.data;
    },
  });
}

export function useCustomerSubscription(id: string) {
  return useQuery({
    queryKey: ["customer", "subscriptions", id],
    queryFn: async () => {
      const res = await api.get<Subscription>(`/customers/subscriptions/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomerSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post<Subscription>("/customers/subscriptions", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer", "subscriptions"] });
    },
  });
}

export function usePauseSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      startDate,
      endDate,
    }: {
      id: string;
      startDate: string;
      endDate: string;
    }) => {
      const res = await api.post(`/customers/subscriptions/${id}/pause`, {
        startDate,
        endDate,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["schedule-preview"] });
    },
  });
}

export function useSubscriptionPreview(
  id: string,
  role: "customer" | "distributor" = "customer",
  days = 30,
) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + days);

  return useQuery({
    queryKey: ["schedule-preview", role, id, days],
    queryFn: async () => {
      const base =
        role === "customer"
          ? `/customers/subscriptions/${id}/preview`
          : `/distributor/subscriptions/${id}/preview`;
      const res = await api.get<SchedulePreviewResponse>(base, {
        params: {
          from: from.toISOString().split("T")[0],
          to: to.toISOString().split("T")[0],
        },
      });
      return res.data;
    },
    enabled: !!id,
  });
}

export function useUpdateCustomerSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) => {
      const res = await api.patch<Subscription>(
        `/customers/subscriptions/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["customer", "subscriptions"] });
      qc.invalidateQueries({
        queryKey: ["customer", "subscriptions", variables.id],
      });
      qc.invalidateQueries({ queryKey: ["schedule-preview"] });
    },
  });
}

export function useExtraSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      date,
      extraQuantity,
    }: {
      id: string;
      date: string;
      extraQuantity: number;
    }) => {
      const res = await api.post(`/customers/subscriptions/${id}/extra`, {
        date,
        extraQuantity,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["schedule-preview"] });
    },
  });
}
