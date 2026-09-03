import { Milk, Users, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default function RegisterPage() {
  const t = useTranslations("auth.register");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-sand)]">
            <Milk className="h-6 w-6 text-[var(--brand-navy)]" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--brand-navy)] sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-[var(--brand-ink-muted)]">{t("description")}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="border-[var(--brand-border)] bg-white/90 shadow-sm">
          <CardHeader>
            <Users className="h-8 w-8 text-[var(--brand-saffron-deep)]" />
            <CardTitle>{t("customerTitle")}</CardTitle>
            <CardDescription>{t("customerDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/register/customer">
              <Button className="w-full">{t("customerButton")}</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="border-[var(--brand-border)] bg-white/90 shadow-sm">
          <CardHeader>
            <Truck className="h-8 w-8 text-[var(--brand-saffron-deep)]" />
            <CardTitle>{t("distributorTitle")}</CardTitle>
            <CardDescription>{t("distributorDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/register/distributor">
              <Button className="w-full">{t("distributorButton")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-sm text-[var(--brand-ink-muted)]">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-[var(--brand-saffron-deep)] hover:underline"
        >
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
