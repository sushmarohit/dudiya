import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const t = useTranslations("pages.about");
  const tc = useTranslations("common");

  return (
    <main>
      <section className="relative isolate min-h-[42vh] overflow-hidden">
        <Image
          src="/images/plain-cow-pasture.jpg"
          alt={t("bannerAlt")}
          fill
          priority
          className="object-cover object-[center_40%]"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[var(--brand-navy)]/90 to-[var(--brand-navy)]/45"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex min-h-[42vh] max-w-6xl flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-12">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--brand-saffron)] sm:text-4xl">
            {tc("appName")}
          </p>
          <h1 className="mt-2 max-w-2xl text-2xl font-semibold text-white sm:text-3xl">
            {t("title")}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-lg leading-relaxed text-[var(--brand-ink-muted)]">
          {t("intro")}
        </p>
        <div className="mt-10 space-y-8">
          {(["mission", "promise", "india"] as const).map((key) => (
            <div key={key}>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
                {t(`${key}.title`)}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[var(--brand-ink-muted)]">
                {t(`${key}.body`)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Link href="/register">
            <Button size="lg">{t("cta")}</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
