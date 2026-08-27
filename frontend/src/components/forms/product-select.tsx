"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types";

interface ProductSelectProps {
  id?: string;
  label?: string;
  products: Product[];
  value?: string;
  error?: string;
  disabled?: boolean;
  onChange: (productId: string) => void;
  placeholder?: string;
}

export function ProductSelect({
  id = "productId",
  label,
  products,
  value,
  error,
  disabled,
  onChange,
  placeholder,
}: ProductSelectProps) {
  const tc = useTranslations("common");
  const tf = useTranslations("forms");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label ?? tc("product")}</Label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder ?? tf("selectProduct")}</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.unit ? ` (${p.unit})` : ""}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
