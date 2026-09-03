import Image from "next/image";
import { ArrowRight, CheckCircle2, Home, MapPin, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const STEP_ICONS = [MapPin, Home, Truck, CheckCircle2] as const;

export default function HomePage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <main>
      {/* Full-bleed hero */}
      <section className="relative isolate min-h-[88vh] overflow-hidden">
        <Image
          src="/images/cow_man.webp"
          alt={t("hero.imageAlt")}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[var(--brand-navy)]/90 via-[var(--brand-navy)]/70 to-[var(--brand-navy)]/25"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--brand-navy)]/55 via-transparent to-[var(--brand-navy)]/20"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-14 pt-28 sm:justify-center sm:px-6 sm:pb-20 sm:pt-24">
          <p className="animate-fade-up font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--brand-saffron)] sm:text-5xl md:text-6xl">
            {tc("appName")}
          </p>
          <h1 className="animate-fade-up-delay-1 mt-3 max-w-xl text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl md:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
            {t("hero.description")}
          </p>
          <div className="animate-fade-up-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register/customer" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full bg-[var(--brand-saffron)] text-[var(--brand-navy)] hover:bg-[var(--brand-saffron-deep)] sm:w-auto"
              >
                {t("hero.customerCta")}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
            <Link href="/register/distributor" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
              >
                {t("hero.distributorCta")}
                <Truck className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-b border-[var(--brand-border)] bg-[var(--brand-sand)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-saffron-deep)]">
            {t("howItWorks.eyebrow")}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--brand-navy)] sm:text-4xl">
            {t("howItWorks.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-[var(--brand-ink-muted)] sm:text-lg">
            {t("howItWorks.description")}
          </p>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEP_ICONS.map((Icon, index) => {
              const step = String(index + 1);
              return (
                <li key={step} className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-navy)] text-[var(--brand-saffron)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--brand-saffron-deep)]">
                    {t("howItWorks.stepLabel", { step })}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
                    {t(`howItWorks.steps.${step}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--brand-ink-muted)]">
                    {t(`howItWorks.steps.${step}.body`)}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Who it's for — image-led, not card grid in hero style */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--brand-navy)] sm:text-4xl">
          {t("audiences.title")}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-[var(--brand-ink-muted)] sm:text-lg">
          {t("audiences.description")}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <article className="overflow-hidden rounded-2xl bg-[var(--brand-sand)]">
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/hero-milk-pour.jpg"
                alt={t("audiences.customers.imageAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-[var(--brand-navy)]">
                {t("audiences.customers.title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--brand-ink-muted)]">
                {t("audiences.customers.description")}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--brand-ink)]">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-saffron-deep)]" />
                  {t("audiences.customers.points.0")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-saffron-deep)]" />
                  {t("audiences.customers.points.1")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-saffron-deep)]" />
                  {t("audiences.customers.points.2")}
                </li>
              </ul>
              <Link href="/register/customer" className="mt-6 inline-block">
                <Button>
                  {t("audiences.customers.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl bg-[var(--brand-sand)]">
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/plain-milk-bottles.jpg"
                alt={t("audiences.distributors.imageAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-[var(--brand-navy)]">
                {t("audiences.distributors.title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--brand-ink-muted)]">
                {t("audiences.distributors.description")}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--brand-ink)]">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-saffron-deep)]" />
                  {t("audiences.distributors.points.0")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-saffron-deep)]" />
                  {t("audiences.distributors.points.1")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-saffron-deep)]" />
                  {t("audiences.distributors.points.2")}
                </li>
              </ul>
              <Link href="/register/distributor" className="mt-6 inline-block">
                <Button variant="outline">
                  {t("audiences.distributors.cta")}
                  <Truck className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Everyday milk strip */}
      <section className="relative overflow-hidden">
        <div className="grid md:grid-cols-3">
          {[
            {
              src: "/images/hero-milk-pour.jpg",
              alt: t("gallery.alts.0"),
            },
            {
              src: "/images/plain-dairy-table.jpg",
              alt: t("gallery.alts.1"),
            },
            {
              src: "/images/plain-cow-pasture.jpg",
              alt: t("gallery.alts.2"),
            },
          ].map((item) => (
            <div key={item.src} className="relative aspect-[4/3] md:aspect-[5/4]">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[var(--brand-navy)]/80 via-[var(--brand-navy)]/20 to-transparent">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white sm:text-3xl">
              {t("gallery.caption")}
            </p>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="bg-[var(--brand-navy)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-16">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white sm:text-3xl">
              {t("cta.title")}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/75 sm:text-base">
              {t("cta.description")}
            </p>
          </div>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-[var(--brand-saffron)] text-[var(--brand-navy)] hover:bg-[var(--brand-saffron-deep)]"
            >
              {tc("getStarted")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
