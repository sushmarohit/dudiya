"use client";

import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Milk,
  Package,
  Clock,
  UserCircle,
  Search,
  Truck,
  X,
  Receipt,
  Activity,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { DashboardNavbar } from "@/components/layouts/dashboard-navbar";
import { NotificationArrivalWatcher } from "@/components/notifications/notification-arrival-watcher";
import { useDistributorProfile } from "@/hooks/use-distributor";
import { useCustomerProfile } from "@/hooks/use-customer";
import {
  isBillingEnabled,
  isSubscriptionFlowEnabled,
} from "@/lib/feature-flags";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/distributors", labelKey: "distributors", icon: Building2 },
  { href: "/admin/customers", labelKey: "customers", icon: Users },
  { href: "/admin/subscriptions", labelKey: "subscriptions", icon: Package },
  { href: "/admin/products", labelKey: "products", icon: Milk },
  { href: "/admin/operations", labelKey: "operations", icon: Activity },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

const distributorNav: NavItem[] = [
  { href: "/distributor/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/distributor/setup", labelKey: "setup", icon: Truck },
  { href: "/distributor/products", labelKey: "products", icon: Milk },
  { href: "/distributor/delivery-slots", labelKey: "deliverySlots", icon: Clock },
  { href: "/distributor/customers", labelKey: "customers", icon: Users },
  { href: "/distributor/subscriptions", labelKey: "subscriptions", icon: Package },
  { href: "/distributor/deliveries", labelKey: "deliveries", icon: Truck },
  { href: "/distributor/billing", labelKey: "billing", icon: Receipt },
  { href: "/distributor/settings", labelKey: "settings", icon: Settings },
];

const customerNav: NavItem[] = [
  { href: "/customer/profile", labelKey: "profile", icon: UserCircle },
  { href: "/customer/documents", labelKey: "documents", icon: FileText },
  { href: "/customer/find-distributor", labelKey: "findDistributor", icon: Search },
  { href: "/customer/subscriptions", labelKey: "subscriptions", icon: Package },
  { href: "/customer/deliveries", labelKey: "deliveries", icon: Truck },
  { href: "/customer/bills", labelKey: "bills", icon: Receipt },
];

function getNavForRole(role: UserRole): NavItem[] {
  const items = (() => {
    switch (role) {
      case "ADMIN":
        return adminNav;
      case "DISTRIBUTOR":
        return distributorNav;
      case "CUSTOMER":
        return customerNav;
      default:
        return [];
    }
  })();

  return items.filter((item) => {
    if (!isSubscriptionFlowEnabled() && item.href.includes("/subscriptions")) {
      return false;
    }
    if (!isBillingEnabled() && item.href.includes("/billing")) {
      return false;
    }
    if (!isBillingEnabled() && item.href.includes("/bills")) {
      return false;
    }
    return true;
  });
}

function getNavNamespace(role: UserRole): "adminNav" | "distributorNav" | "customerNav" {
  switch (role) {
    case "ADMIN":
      return "adminNav";
    case "DISTRIBUTOR":
      return "distributorNav";
    case "CUSTOMER":
      return "customerNav";
    default:
      return "adminNav";
  }
}

function NavLinks({
  navItems,
  pathname,
  tNav,
  onNavigate,
  variant = "sidebar",
}: {
  navItems: NavItem[];
  pathname: string;
  tNav: ReturnType<typeof useTranslations>;
  onNavigate?: () => void;
  variant?: "sidebar" | "bottom";
}) {
  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");

        if (variant === "bottom") {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium leading-tight sm:text-xs",
                active ? "text-emerald-700" : "text-slate-500",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate text-center">
                {tNav(item.labelKey)}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{tNav(item.labelKey)}</span>
          </Link>
        );
      })}
    </>
  );
}

function SidebarNav({
  navItems,
  pathname,
  tNav,
  onNavigate,
  onClose,
  showClose,
  tc,
}: {
  navItems: NavItem[];
  pathname: string;
  tNav: ReturnType<typeof useTranslations>;
  onNavigate?: () => void;
  onClose?: () => void;
  showClose?: boolean;
  tc: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      {showClose && onClose ? (
        <div className="flex items-center justify-end border-b border-slate-200 px-3 py-2 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={tc("closeMenu")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : null}
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4"
        aria-label="Main navigation"
      >
        <NavLinks
          navItems={navItems}
          pathname={pathname}
          tNav={tNav}
          onNavigate={onNavigate}
        />
      </nav>
    </>
  );
}

export function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navNamespace = getNavNamespace(role);
  const tNav = useTranslations(`nav.${navNamespace}`);
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: distributorProfile } = useDistributorProfile({
    enabled: role === "DISTRIBUTOR",
  });
  const { data: customerProfile } = useCustomerProfile({
    enabled: role === "CUSTOMER",
  });
  const navItems = getNavForRole(role);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isCustomer = role === "CUSTOMER";
  const navbarDisplayName =
    role === "DISTRIBUTOR"
      ? distributorProfile?.ownerName || user?.name
      : role === "CUSTOMER"
        ? customerProfile?.user?.name || user?.name
        : user?.name;

  useEffect(() => {
    if (role !== "CUSTOMER" || !customerProfile?.user) return;
    const { name, phone } = customerProfile.user;
    if (
      (name && name !== user?.name) ||
      (phone !== undefined && phone !== user?.phone)
    ) {
      updateUser({
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone: phone ?? undefined } : {}),
      });
    }
  }, [role, customerProfile, user?.name, user?.phone, updateUser]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  function handleSignOut() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <NotificationArrivalWatcher />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-white"
      >
        {tc("skipToContent")}
      </a>

      <DashboardNavbar
        role={role}
        userName={navbarDisplayName}
        userEmail={user?.email}
        onSignOut={handleSignOut}
        showMenuButton={!isCustomer}
        onOpenMenu={() => setMobileNavOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        {isCustomer ? (
          <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
            <SidebarNav navItems={navItems} pathname={pathname} tNav={tNav} tc={tc} />
          </aside>
        ) : (
          <>
            {mobileNavOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                  aria-label={tc("closeMenu")}
                  onClick={() => setMobileNavOpen(false)}
                />
                <aside className="fixed bottom-0 left-0 z-50 flex w-[min(100vw-2.5rem,280px)] max-w-full flex-col border-r border-slate-200 bg-white shadow-xl top-14 sm:top-16 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:shadow-none">
                  <SidebarNav
                    navItems={navItems}
                    pathname={pathname}
                    tNav={tNav}
                    onNavigate={() => setMobileNavOpen(false)}
                    onClose={() => setMobileNavOpen(false)}
                    showClose
                    tc={tc}
                  />
                </aside>
              </>
            ) : (
              <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
                <SidebarNav navItems={navItems} pathname={pathname} tNav={tNav} tc={tc} />
              </aside>
            )}
          </>
        )}

        <main
          id="main-content"
          className={cn(
            "min-w-0 flex-1 overflow-x-hidden overflow-y-auto",
            isCustomer && "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0",
          )}
          tabIndex={-1}
        >
          <div className="dashboard-page mx-auto w-full max-w-6xl p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>

      {isCustomer ? (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur lg:hidden"
          aria-label="Main navigation"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-around">
            <NavLinks
              navItems={navItems}
              pathname={pathname}
              tNav={tNav}
              variant="bottom"
            />
          </div>
        </nav>
      ) : null}
    </div>
  );
}
