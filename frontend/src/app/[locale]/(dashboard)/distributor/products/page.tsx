"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDistributorProducts,
  useUpdateDistributorProducts,
  useDistributorPricing,
  useCreatePricing,
  useUpdatePricing,
  useCreateCustomProduct,
  useDeactivateCustomProduct,
  useRequestProductPromotion,
} from "@/hooks/use-distributor";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { formatCurrency } from "@/lib/utils";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";
import type { ProductCategory } from "@/types";

const CATEGORIES: ProductCategory[] = [
  "MILK",
  "CURD",
  "PANEER",
  "EGGS",
  "LASSI",
  "GHEE",
  "BUTTER",
  "KHOYA",
];

export default function DistributorProductsPage() {
  const tDistributor = useTranslations("distributor");
  const tProducts = useTranslations("distributor.products");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const { data: products, isLoading } = useDistributorProducts();
  const updateProducts = useUpdateDistributorProducts();
  const { data: pricing } = useDistributorPricing();
  const createPricing = useCreatePricing();
  const updatePricing = useUpdatePricing();
  const createCustomProduct = useCreateCustomProduct();
  const deactivateCustomProduct = useDeactivateCustomProduct();
  const requestPromotion = useRequestProductPromotion();
  const schemas = useFormSchemas();

  const [customForm, setCustomForm] = useState({
    name: "",
    category: "MILK" as ProductCategory,
    unit: "litre",
    fatPercent: "",
    pricePerUnit: "",
  });

  const globalProducts = products?.filter((p) => !p.isCustom) ?? [];
  const customProducts = products?.filter((p) => p.isCustom) ?? [];
  const enabledProducts = products?.filter((p) => p.enabled) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.pricingSchema),
  });

  const onSubmit = async (data: {
    productId: string;
    fatPercent?: number;
    pricePerUnit: number;
  }) => {
    try {
      await createPricing.mutateAsync(data);
      reset();
      showToast("Pricing added", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  async function handleCreateCustom(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCustomProduct.mutateAsync({
        name: customForm.name,
        category: customForm.category,
        unit: customForm.unit,
        fatPercent: customForm.fatPercent
          ? Number(customForm.fatPercent)
          : undefined,
        pricePerUnit: customForm.pricePerUnit
          ? Number(customForm.pricePerUnit)
          : undefined,
      });
      setCustomForm({
        name: "",
        category: "MILK",
        unit: "litre",
        fatPercent: "",
        pricePerUnit: "",
      });
      showToast(tProducts("customCreated"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tDistributor("products.title")}
        description={tDistributor("products.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{tProducts("platformCatalog")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-500">{tCommon("loading")}</p>
          ) : (
            <div className="space-y-2">
              {globalProducts.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <input
                    type="checkbox"
                    checked={p.enabled ?? false}
                    onChange={async (e) => {
                      try {
                        await updateProducts.mutateAsync([
                          { productId: p.id, enabled: e.target.checked },
                        ]);
                      } catch (err) {
                        showToast(getApiErrorMessage(err), "error");
                      }
                    }}
                  />
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-slate-500">
                    {p.category} · {p.unit}
                  </span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tProducts("myProducts")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={handleCreateCustom}
            className="grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label>{tProducts("productName")}</Label>
              <Input
                value={customForm.name}
                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{tProducts("category")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={customForm.category}
                onChange={(e) =>
                  setCustomForm({
                    ...customForm,
                    category: e.target.value as ProductCategory,
                  })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{tProducts("unit")}</Label>
              <Input
                value={customForm.unit}
                onChange={(e) => setCustomForm({ ...customForm, unit: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{tProducts("fatPercent")}</Label>
              <Input
                type="number"
                step="0.1"
                value={customForm.fatPercent}
                onChange={(e) =>
                  setCustomForm({ ...customForm, fatPercent: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{tProducts("pricePerLiter")}</Label>
              <Input
                type="number"
                step="0.01"
                value={customForm.pricePerUnit}
                onChange={(e) =>
                  setCustomForm({ ...customForm, pricePerUnit: e.target.value })
                }
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createCustomProduct.isPending}>
                {tProducts("addCustomProduct")}
              </Button>
            </div>
          </form>

          {!customProducts.length ? (
            <p className="text-sm text-slate-500">{tProducts("noCustomProducts")}</p>
          ) : (
            <div className="space-y-2">
              {customProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-slate-600">
                      {p.category} · {p.unit}
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        {tProducts("customBadge")}
                      </span>
                    </div>
                    {p.promotionStatus ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {tProducts(`promotionStatuses.${p.promotionStatus}`)}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.promotionStatus !== "PENDING_REVIEW" &&
                    p.promotionStatus !== "PROMOTED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await requestPromotion.mutateAsync(p.id);
                            showToast(tProducts("promotionRequested"), "success");
                          } catch (err) {
                            showToast(getApiErrorMessage(err), "error");
                          }
                        }}
                      >
                        {tProducts("requestPromotion")}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const ok = await confirm({
                          title: tCommon("confirmDeactivateTitle"),
                          description: tCommon("confirmDeactivateDescription"),
                          confirmLabel: tProducts("deactivateCustom"),
                          variant: "destructive",
                        });
                        if (!ok) return;
                        try {
                          await deactivateCustomProduct.mutateAsync(p.id);
                          showToast(tProducts("customDeactivated"), "success");
                        } catch (err) {
                          showToast(getApiErrorMessage(err), "error");
                        }
                      }}
                    >
                      {tProducts("deactivateCustom")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tProducts("addPricing")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-2">
              <Label>{tCommon("product")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                {...register("productId")}
              >
                <option value="">{tProducts("productName")}</option>
                {enabledProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.isCustom ? ` (${tProducts("customBadge")})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{tProducts("fatPercent")}</Label>
              <Input type="number" step="0.1" {...register("fatPercent")} />
            </div>
            <div className="space-y-2">
              <Label>{tProducts("pricePerLiter")}</Label>
              <Input type="number" step="0.01" {...register("pricePerUnit")} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {tProducts("addProduct")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tProducts("pricingMatrix")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!pricing?.length ? (
            <p className="text-slate-500">{tProducts("noPricing")}</p>
          ) : (
            <ResponsiveTable minWidth="560px">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="pb-2">{tCommon("product")}</th>
                    <th className="pb-2">{tCommon("fatPercent")}</th>
                    <th className="pb-2">{tProducts("price")}</th>
                    <th className="pb-2">{tProducts("available")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="py-2">{p.product?.name || p.productId}</td>
                      <td className="py-2">{p.fatPercent ?? "—"}</td>
                      <td className="py-2">{formatCurrency(p.pricePerUnit)}</td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await updatePricing.mutateAsync({
                                id: p.id,
                                active: !p.active,
                              });
                            } catch (err) {
                              showToast(getApiErrorMessage(err), "error");
                            }
                          }}
                        >
                          {p.active ? tProducts("deactivate") : tProducts("activate")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
