import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminKpis,
  DistributorProfile,
  CustomerProfile,
  CustomerWithSubscriptions,
  Subscription,
  PlatformSettings,
  PaginatedResponse,
  Product,
} from "@/types";

export function useAdminKpis() {
  return useQuery({
    queryKey: ["admin", "kpis"],
    queryFn: async () => {
      const res = await api.get<AdminKpis>("/admin/dashboard/kpis");
      return res.data;
    },
  });
}

export function usePendingDistributors() {
  return useQuery({
    queryKey: ["admin", "distributors", "pending"],
    queryFn: async () => {
      const res = await api.get<DistributorProfile[]>(
        "/admin/distributors/pending",
      );
      return res.data;
    },
  });
}

export function useAdminDistributors(params?: { search?: string }) {
  return useQuery({
    queryKey: ["admin", "distributors", params],
    queryFn: async () => {
      const res = await api.get<DistributorProfile[] | PaginatedResponse<DistributorProfile>>(
        "/admin/distributors",
        { params },
      );
      const data = res.data;
      return Array.isArray(data) ? data : data.data;
    },
  });
}

export function useSuspendDistributor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, suspend }: { id: string; suspend: boolean }) => {
      const res = await api.patch(`/admin/distributors/${id}/suspend`, { suspend });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "distributors"] });
    },
  });
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const res = await api.get<CustomerWithSubscriptions[] | PaginatedResponse<CustomerWithSubscriptions>>(
        "/admin/customers",
      );
      const data = res.data;
      return Array.isArray(data) ? data : data.data;
    },
  });
}

export function useAdminCustomer(id: string | null) {
  return useQuery({
    queryKey: ["admin", "customers", id],
    queryFn: async () => {
      const res = await api.get<CustomerWithSubscriptions>(`/admin/customers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useAdminSubscriptions(params?: { status?: string }) {
  return useQuery({
    queryKey: ["admin", "subscriptions", params],
    queryFn: async () => {
      const res = await api.get<Subscription[] | PaginatedResponse<Subscription>>(
        "/admin/subscriptions",
        { params },
      );
      const data = res.data;
      return Array.isArray(data) ? data : data.data;
    },
  });
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await api.get<PlatformSettings>("/admin/settings");
      return res.data;
    },
  });
}

export function useUpdatePlatformSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PlatformSettings) => {
      const res = await api.patch<PlatformSettings>("/admin/settings", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}

export function useAdminProducts(includeInactive = false) {
  return useQuery({
    queryKey: ["admin", "products", { includeInactive }],
    queryFn: async () => {
      const res = await api.get<Product[]>("/admin/products", {
        params: includeInactive ? { includeInactive: "true" } : undefined,
      });
      return res.data;
    },
  });
}

export function useAdminProductSubmissions() {
  return useQuery({
    queryKey: ["admin", "products", "submissions"],
    queryFn: async () => {
      const res = await api.get<Product[]>("/admin/products/distributor-submissions");
      return res.data;
    },
  });
}

export function useCreateAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const res = await api.post<Product>("/admin/products", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useUpdateAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const res = await api.patch<Product>(`/admin/products/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useDeactivateAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<Product>(`/admin/products/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function usePromoteAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<Product>(`/admin/products/${id}/promote`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useRejectAdminProductPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<Product>(`/admin/products/${id}/reject-promotion`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useKeepPrivateAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<Product>(`/admin/products/${id}/keep-private`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}
