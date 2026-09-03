import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Copy text to clipboard in a way that works across modern and older browsers
 * (Clipboard API when available; textarea + execCommand fallback otherwise).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !text) return false;

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }

    return ok;
  } catch {
    return false;
  }
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
