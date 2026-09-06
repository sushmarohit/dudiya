/** Milk delivery subscriptions (create/manage recurring orders). */
export function isSubscriptionFlowEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTION_FLOW_ENABLED === "true";
}

/** Customer self-subscribe requires distributor accept/decline. */
export function isSubscriptionApprovalEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTION_APPROVAL_ENABLED === "true"
  );
}

/** Usage-based billing, invoices, and payment recording. */
export function isBillingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_BILLING_ENABLED === "true";
}

export type FeatureFlags = {
  subscriptionFlowEnabled: boolean;
  subscriptionApprovalEnabled: boolean;
  billingEnabled: boolean;
};

export function getFeatureFlags(): FeatureFlags {
  return {
    subscriptionFlowEnabled: isSubscriptionFlowEnabled(),
    subscriptionApprovalEnabled: isSubscriptionApprovalEnabled(),
    billingEnabled: isBillingEnabled(),
  };
}
