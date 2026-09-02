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
    <div className="flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-sand)]">
            <Milk className="h-6 w-6 text-[var(--brand-navy)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--brand-navy)]">
            {t("title")}
          </h1>
          <p className="mt-2 text-[var(--brand-ink-muted)]">{t("description")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
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
          <Card>
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
        <p className="text-center text-sm text-[var(--brand-ink-muted)]">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="text-[var(--brand-saffron-deep)] hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
