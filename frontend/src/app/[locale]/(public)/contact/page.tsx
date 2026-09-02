"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/providers";

export default function ContactPage() {
  const t = useTranslations("pages.contact");
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      (e.target as HTMLFormElement).reset();
      showToast(t("success"), "success");
    }, 600);
  }

  return (
    <main>
      <section className="relative isolate min-h-[36vh] overflow-hidden">
        <Image
          src="/images/plain-dairy-table.jpg"
          alt={t("bannerAlt")}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[var(--brand-navy)]/90 to-[var(--brand-navy)]/50"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex min-h-[36vh] max-w-6xl flex-col justify-end px-4 pb-10 sm:px-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-base text-white/85">{t("subtitle")}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-[var(--brand-saffron-deep)]" />
            <div>
              <p className="font-medium text-[var(--brand-navy)]">{t("emailLabel")}</p>
              <a
                href="mailto:hello@dudiya.in"
                className="text-sm text-[var(--brand-ink-muted)] hover:text-[var(--brand-navy)]"
              >
                hello@dudiya.in
              </a>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="mt-0.5 h-5 w-5 text-[var(--brand-saffron-deep)]" />
            <div>
              <p className="font-medium text-[var(--brand-navy)]">{t("phoneLabel")}</p>
              <p className="text-sm text-[var(--brand-ink-muted)]">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-[var(--brand-saffron-deep)]" />
            <div>
              <p className="font-medium text-[var(--brand-navy)]">{t("addressLabel")}</p>
              <p className="text-sm text-[var(--brand-ink-muted)]">{t("address")}</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-[var(--brand-sand)] p-6 sm:p-8"
        >
          <div>
            <Label htmlFor="name">{t("form.name")}</Label>
            <Input id="name" name="name" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">{t("form.email")}</Label>
            <Input id="email" name="email" type="email" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="message">{t("form.message")}</Label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-saffron)]"
            />
          </div>
          <Button type="submit" disabled={sending} className="w-full sm:w-auto">
            {sending ? t("form.sending") : t("form.submit")}
          </Button>
        </form>
      </section>
    </main>
  );
}
