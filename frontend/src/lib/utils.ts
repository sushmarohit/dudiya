import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateKey(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return formatDateKey(d);
}

export function dayFromDateKey(key: string): number {
  return Number(key.split("-")[2]) || 0;
}

export function formatDate(date: string | Date, locale = "en-IN") {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(year, month - 1, day));
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function localeToIntl(locale: string) {
  return locale === "hi" ? "hi-IN" : "en-IN";
}
