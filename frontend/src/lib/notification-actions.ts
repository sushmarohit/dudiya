import type { Notification, NotificationType, UserRole } from "@/types";

export type NotificationAction = {
  labelKey: string;
  href: string;
};

function payloadId(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  const value = payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function getNotificationAction(
  notification: Notification,
  role: UserRole | null | undefined,
): NotificationAction | null {
  const payload = notification.payloadJson ?? undefined;
  const subscriptionId = payloadId(payload, "subscriptionId");
  const billId = payloadId(payload, "billId");
  const type = notification.type;

  switch (type) {
    case "SUBSCRIPTION_ACTIVATED":
      if (subscriptionId) {
        return {
          labelKey: "viewSubscription",
          href:
            role === "DISTRIBUTOR"
              ? `/distributor/subscriptions/${subscriptionId}`
              : `/customer/subscriptions/${subscriptionId}`,
        };
      }
      return {
        labelKey: "viewSubscriptions",
        href:
          role === "DISTRIBUTOR"
            ? "/distributor/subscriptions"
            : "/customer/subscriptions",
      };

    case "PAUSE_APPLIED":
    case "EXTRA_MILK_REQUEST":
      if (subscriptionId) {
        return {
          labelKey: "viewSubscription",
          href: `/distributor/subscriptions/${subscriptionId}`,
        };
      }
      return {
        labelKey: "viewSubscriptions",
        href: "/distributor/subscriptions",
      };

    case "BILL_GENERATED":
    case "PAYMENT_RECORDED":
      if (billId) {
        return {
          labelKey: "viewBill",
          href:
            role === "DISTRIBUTOR"
              ? `/distributor/bills/${billId}`
              : `/customer/bills/${billId}`,
        };
      }
      return {
        labelKey: "viewBills",
        href: role === "DISTRIBUTOR" ? "/distributor/billing" : "/customer/bills",
      };

    case "DISTRIBUTOR_APPROVED":
      return { labelKey: "continueSetup", href: "/distributor/setup" };

    case "DELIVERY_FAILED_SKIPPED":
    case "DELIVERY_REMINDER":
    case "DISTRIBUTOR_UNAVAILABLE":
    case "DELIVERY_JOURNEY_STARTED":
      return {
        labelKey:
          type === "DELIVERY_JOURNEY_STARTED"
            ? "todaysDelivery"
            : "viewDeliveries",
        href:
          role === "DISTRIBUTOR"
            ? "/distributor/deliveries"
            : "/customer/deliveries",
      };

    case "SUBSCRIPTION_END_REQUESTED":
    case "SUBSCRIPTION_END_CONFIRMED":
    case "SUBSCRIPTION_END_REJECTED":
      if (subscriptionId) {
        return {
          labelKey:
            type === "SUBSCRIPTION_END_CONFIRMED" && payload?.startFresh
              ? "startFresh"
              : "reviewEnd",
          href:
            role === "DISTRIBUTOR"
              ? `/distributor/subscriptions/${subscriptionId}`
              : `/customer/subscriptions/${subscriptionId}`,
        };
      }
      if (type === "SUBSCRIPTION_END_CONFIRMED" && role === "CUSTOMER") {
        return { labelKey: "startFresh", href: "/customer/find-distributor" };
      }
      return null;

    default:
      return null;
  }
}

export function notificationTypeLabelKey(type: NotificationType): string {
  const map: Record<NotificationType, string> = {
    SUBSCRIPTION_ACTIVATED: "types.subscriptionActivated",
    PAUSE_APPLIED: "types.pauseApplied",
    EXTRA_MILK_REQUEST: "types.extraMilk",
    BILL_GENERATED: "types.billGenerated",
    PAYMENT_RECORDED: "types.paymentRecorded",
    DISTRIBUTOR_APPROVED: "types.distributorApproved",
    DELIVERY_FAILED_SKIPPED: "types.deliveryUpdate",
    DELIVERY_REMINDER: "types.deliveryReminder",
    SUBSCRIPTION_END_REQUESTED: "types.endRequested",
    SUBSCRIPTION_END_CONFIRMED: "types.endConfirmed",
    SUBSCRIPTION_END_REJECTED: "types.endRejected",
    DISTRIBUTOR_UNAVAILABLE: "types.unavailable",
    DELIVERY_JOURNEY_STARTED: "types.journeyStarted",
  };
  return map[type] ?? "types.generic";
}
