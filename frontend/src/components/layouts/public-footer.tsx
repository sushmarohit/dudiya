import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function PublicFooter() {
  const t = useTranslations("landing.footer");
  const tc = useTranslations("common");
  const tn = useTranslations("landing.nav");

  return (
    <footer className="border-t border-[var(--brand-border)] bg-[var(--brand-navy)] text-[var(--brand-milk)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            {tc("appName")}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
            {t("tagline")}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-saffron)]">
            {tn("company")}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/about" className="hover:text-white">
                {tn("about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                {tn("contact")}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: "/", hash: "how-it-works" }}
                className="hover:text-white"
              >
                {tn("howItWorks")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-saffron)]">
            {tn("legal")}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/privacy" className="hover:text-white">
                {tn("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                {tn("terms")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/55 sm:px-6">
        {t("copyright")}
      </div>
    </footer>
  );
}
