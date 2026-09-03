"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DudiyaMark } from "@/components/brand/dudiya-mark";

type NavLink = {
  key: "about" | "contact" | "howItWorks";
  href: "/about" | "/contact" | "/";
  hash?: string;
};

const NAV_LINKS: NavLink[] = [
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/", key: "howItWorks", hash: "how-it-works" },
];

export function PublicHeader() {
  const t = useTranslations("landing.nav");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--brand-border)] bg-[var(--brand-milk)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5">
            <DudiyaMark
              className="shadow-sm transition-transform group-hover:scale-105"
              decorative
            />
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--brand-navy)] sm:text-2xl">
              {tc("appName")}
            </span>
          </Link>

          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label={t("main")}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={
                  link.hash
                    ? { pathname: link.href, hash: link.hash }
                    : link.href
                }
                className="text-sm font-medium text-[var(--brand-ink-muted)] transition-colors hover:text-[var(--brand-navy)]"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LocaleSwitcher />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost">{tc("signIn")}</Button>
            </Link>
            <Link href="/register" className="hidden sm:block">
              <Button>{tc("getStarted")}</Button>
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--brand-navy)] hover:bg-[var(--brand-sand)] md:hidden"
              aria-expanded={open}
              aria-controls="public-mobile-menu"
              aria-label={open ? tc("closeMenu") : tc("openMenu")}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          id="public-mobile-menu"
          className={cn(
            "absolute inset-x-0 top-full z-50 border-b border-[var(--brand-border)] bg-[var(--brand-milk)] shadow-lg md:hidden",
            open ? "block" : "hidden",
          )}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={
                  link.hash
                    ? { pathname: link.href, hash: link.hash }
                    : link.href
                }
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--brand-ink)] hover:bg-[var(--brand-sand)]"
                onClick={() => setOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--brand-border)] pt-3">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">
                  {tc("signIn")}
                </Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button className="w-full">{tc("getStarted")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {open ? (
        <button
          type="button"
          aria-label={tc("closeMenu")}
          className="fixed inset-0 z-40 bg-[var(--brand-navy)]/25 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
