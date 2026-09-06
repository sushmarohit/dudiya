import type { SubscriptionStatus } from "@/types";

const STATUS_MESSAGE_KEYS: Record<SubscriptionStatus, string> = {
  ACTIVE: "active",
  PAUSED: "paused",
  PENDING_APPROVAL: "pendingApproval",
  PENDING_CANCEL: "pendingCancel",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

export function subscriptionStatusMessageKey(
  status: SubscriptionStatus,
): string {
  return `statuses.${STATUS_MESSAGE_KEYS[status] ?? "pending"}`;
}
