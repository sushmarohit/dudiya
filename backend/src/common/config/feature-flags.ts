import { HttpStatus } from '@nestjs/common';
import { ApiErrorCode } from '../errors/api-error-code.enum';
import { throwApi } from '../errors/throw-api';

function envFlag(name: string): boolean {
  return process.env[name] === 'true';
}

/** Milk delivery subscriptions (create/manage recurring orders). */
export function isSubscriptionFlowEnabled(): boolean {
  return envFlag('FEATURE_SUBSCRIPTION_FLOW_ENABLED');
}

/**
 * When enabled, customer self-service subscribe creates PENDING_APPROVAL
 * and requires distributor accept/decline. Distributor-led create stays ACTIVE.
 * When disabled, customer subscribe activates immediately (legacy behavior).
 */
export function isSubscriptionApprovalEnabled(): boolean {
  return envFlag('FEATURE_SUBSCRIPTION_APPROVAL_ENABLED');
}

/** Usage-based billing, invoices, and payment recording. */
export function isBillingEnabled(): boolean {
  return envFlag('FEATURE_BILLING_ENABLED');
}

export function getPublicFeatureFlags() {
  return {
    subscriptionFlowEnabled: isSubscriptionFlowEnabled(),
    subscriptionApprovalEnabled: isSubscriptionApprovalEnabled(),
    billingEnabled: isBillingEnabled(),
  };
}

export function assertSubscriptionFlowEnabled() {
  if (!isSubscriptionFlowEnabled()) {
    throwApi(ApiErrorCode.SUBSCRIPTION_FLOW_DISABLED, HttpStatus.FORBIDDEN);
  }
}

export function assertBillingEnabled() {
  if (!isBillingEnabled()) {
    throwApi(ApiErrorCode.BILLING_DISABLED, HttpStatus.FORBIDDEN);
  }
}
