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

/** Usage-based billing, invoices, and payment recording. */
export function isBillingEnabled(): boolean {
  return envFlag('FEATURE_BILLING_ENABLED');
}

export function getPublicFeatureFlags() {
  return {
    subscriptionFlowEnabled: isSubscriptionFlowEnabled(),
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
