import { Milk, Truck, Users, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 to-white">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start">
            <div className="flex min-w-0 items-center gap-2">
              <Milk className="h-7 w-7 shrink-0 text-emerald-600" aria-hidden="true" />
              <span className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                {tc("appName")}
              </span>
            </div>
            <LocaleSwitcher className="sm:hidden" />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LocaleSwitcher className="hidden sm:inline-flex" />
            <Link href="/login" className="flex-1 sm:flex-none">
              <Button variant="ghost" className="w-full sm:w-auto">
                {tc("signIn")}
              </Button>
            </Link>
            <Link href="/register" className="flex-1 sm:flex-none">
              <Button className="w-full sm:w-auto">{tc("getStarted")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-20">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 break-words sm:text-4xl md:text-5xl">
            {t("hero.title")}
            <span className="text-emerald-600">{t("hero.titleHighlight")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 break-words sm:mt-6 sm:text-lg">
            {t("hero.description")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <Link href="/register/customer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                {t("hero.customerCta")}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
            <Link href="/register/distributor" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t("hero.distributorCta")}
                <Truck className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-20">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <Users className="h-8 w-8 text-emerald-600" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold break-words">
                {t("features.customers.title")}
              </h3>
              <p className="mt-2 text-sm text-slate-600 break-words">
                {t("features.customers.description")}
              </p>
              <Link
                href="/register/customer"
                className="mt-4 inline-flex text-sm font-medium text-emerald-600 hover:underline"
              >
                {t("features.customers.cta")} →
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <Truck className="h-8 w-8 text-emerald-600" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold break-words">
                {t("features.distributors.title")}
              </h3>
              <p className="mt-2 text-sm text-slate-600 break-words">
                {t("features.distributors.description")}
              </p>
              <Link
                href="/register/distributor"
                className="mt-4 inline-flex text-sm font-medium text-emerald-600 hover:underline"
              >
                {t("features.distributors.cta")} →
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <Milk className="h-8 w-8 text-emerald-600" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold break-words">
                {t("features.subscriptionEngine.title")}
              </h3>
              <p className="mt-2 text-sm text-slate-600 break-words">
                {t("features.subscriptionEngine.description")}
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex text-sm font-medium text-emerald-600 hover:underline"
              >
                {t("features.subscriptionEngine.cta")} →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500 sm:py-8">
        {t("footer.text")}
      </footer>
    </div>
  );
}
