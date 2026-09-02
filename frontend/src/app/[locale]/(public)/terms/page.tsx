import { useTranslations } from "next-intl";

export default function TermsPage() {
  const t = useTranslations("pages.terms");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--brand-navy)] sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--brand-ink-muted)]">{t("updated")}</p>
      <div className="mt-10 space-y-8">
        {(["service", "accounts", "delivery", "payments", "changes"] as const).map(
          (key) => (
            <section key={key}>
              <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
                {t(`sections.${key}.title`)}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[var(--brand-ink-muted)]">
                {t(`sections.${key}.body`)}
              </p>
            </section>
          ),
        )}
      </div>
    </main>
  );
}
