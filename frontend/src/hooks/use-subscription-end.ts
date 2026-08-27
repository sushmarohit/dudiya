import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SubscriptionEndStatus } from "@/types";

type Party = "customer" | "distributor";

function basePath(party: Party, id: string) {
  return party === "customer"
    ? `/customers/subscriptions/${id}`
    : `/distributor/subscriptions/${id}`;
}

export function useSubscriptionEndStatus(party: Party, id: string) {
  return useQuery({
    queryKey: [party, "subscriptions", id, "end-status"],
    queryFn: async () => {
      const res = await api.get<SubscriptionEndStatus>(
        `${basePath(party, id)}/end-status`,
      );
      return res.data;
    },
    enabled: !!id,
  });
}

export function useRequestSubscriptionEnd(party: Party) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.post<SubscriptionEndStatus>(
        `${basePath(party, id)}/end-request`,
        { reason },
      );
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [party, "subscriptions"] });
      qc.invalidateQueries({
        queryKey: [party, "subscriptions", vars.id, "end-status"],
      });
    },
  });
}

export function useConfirmSubscriptionEnd(party: Party) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<SubscriptionEndStatus>(
        `${basePath(party, id)}/end-confirm`,
      );
      return res.data;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [party, "subscriptions"] });
      qc.invalidateQueries({
        queryKey: [party, "subscriptions", id, "end-status"],
      });
      qc.invalidateQueries({ queryKey: ["customer", "bills"] });
      qc.invalidateQueries({ queryKey: ["distributor", "bills"] });
    },
  });
}

export function useRejectSubscriptionEnd(party: Party) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<SubscriptionEndStatus>(
        `${basePath(party, id)}/end-reject`,
      );
      return res.data;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [party, "subscriptions"] });
      qc.invalidateQueries({
        queryKey: [party, "subscriptions", id, "end-status"],
      });
    },
  });
}
