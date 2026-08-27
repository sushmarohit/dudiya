"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { formatAddressPreview } from "@/lib/address";
import type {
  CustomerWithSubscriptions,
  OnboardedVia,
  SubscriptionFrequency,
  UserStatus,
} from "@/types";

const frequencyKeyByValue: Record<SubscriptionFrequency, string> = {
  DAILY: "daily",
  ALTERNATE_DAY: "alternateDay",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

const statusKeyByValue: Record<UserStatus, string> = {
  ACTIVE: "active",
  PENDING: "pending",
  SUSPENDED: "suspended",
};

const onboardedViaKeyByValue: Record<OnboardedVia, string> = {
  SELF_SERVICE: "self",
  DISTRIBUTOR_LED: "distributor",
};

interface AdminCustomerDrawerProps {
  customer: CustomerWithSubscriptions | null;
  open: boolean;
  onClose: () => void;
}

export function AdminCustomerDrawer({
  customer,
  open,
  onClose,
}: AdminCustomerDrawerProps) {
  const tc = useTranslations("common");
  const ta = useTranslations("address");
  const te = useTranslations("empty");
  const tf = useTranslations("subscription.frequencies");
  const tCustomerProfile = useTranslations("customer.profile");
  const tDistributorCustomerDetail = useTranslations("distributor.customers.detail");
  const tAdminDistributors = useTranslations("admin.distributors");
  const tAdminSubscriptions = useTranslations("admin.subscriptions");

  if (!open || !customer) return null;

  const address = formatAddressPreview(
    customer as Parameters<typeof formatAddressPreview>[0],
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={tc("cancel")}
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-customer-drawer-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="admin-customer-drawer-title" className="text-lg font-semibold">
            {tDistributorCustomerDetail("title")}
          </h2>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label={tc("cancel")}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <section>
            <h3 className="text-sm font-medium text-slate-500">
              {tCustomerProfile("title")}
            </h3>
            <p className="mt-1 font-medium text-slate-900">
              {customer.user?.name || "—"}
            </p>
            <p className="text-sm text-slate-600">{customer.user?.email || "—"}</p>
            <p className="text-sm text-slate-600">{customer.user?.phone || "—"}</p>
            <p className="text-sm text-slate-500">
              {tc("status")}:{" "}
              {customer.user?.status
                ? tc(`statuses.${statusKeyByValue[customer.user.status]}`)
                : "—"}
            </p>
          </section>

          {address && (
            <section>
              <h3 className="text-sm font-medium text-slate-500">
                {ta("addressPreview")}
              </h3>
              <p className="mt-1 text-sm text-slate-700">{address}</p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-medium text-slate-500">
              {tAdminDistributors("title")}
            </h3>
            {!customer.distributorCustomers?.length ? (
              <p className="mt-1 text-sm text-slate-500">{te("noDistributors")}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {customer.distributorCustomers.map((link) => (
                  <li
                    key={link.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">
                      {link.distributor?.businessName || link.distributorId}
                    </p>
                    <p className="text-slate-500">
                      {tc(`onboardedVia.${onboardedViaKeyByValue[link.onboardedVia]}`)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-medium text-slate-500">
              {tAdminSubscriptions("title")}
            </h3>
            {!customer.subscriptions?.length ? (
              <p className="mt-1 text-sm text-slate-500">{te("noSubscriptions")}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {customer.subscriptions.map((sub) => (
                  <li
                    key={sub.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{sub.product?.name}</p>
                    <p className="text-slate-600">
                      {sub.distributor?.businessName} · {sub.quantity} ·{" "}
                      {tf(frequencyKeyByValue[sub.frequency])}
                    </p>
                    <p className="text-slate-500">
                      {tc("startDate")}: {formatDate(sub.startDate)} · {sub.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
