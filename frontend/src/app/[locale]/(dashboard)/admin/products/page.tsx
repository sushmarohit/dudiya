"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAdminProducts,
  useAdminProductSubmissions,
  useCreateAdminProduct,
  useUpdateAdminProduct,
  useDeactivateAdminProduct,
  usePromoteAdminProduct,
  useRejectAdminProductPromotion,
  useKeepPrivateAdminProduct,
} from "@/hooks/use-admin";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHeader, ResponsiveTable } from "@/components/ui/responsive-table";
import type { Product, ProductCategory } from "@/types";
import { cn } from "@/lib/utils";

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

const EMPTY_FORM = {
  sku: "",
  name: "",
  category: "MILK" as ProductCategory,
  unit: "litre",
};

export default function AdminProductsPage() {
  const tAdmin = useTranslations("admin.products");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"catalog" | "submissions">("catalog");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: products, isLoading } = useAdminProducts(includeInactive);
  const { data: submissions, isLoading: submissionsLoading } =
    useAdminProductSubmissions();
  const createProduct = useCreateAdminProduct();
  const updateProduct = useUpdateAdminProduct();
  const deactivateProduct = useDeactivateAdminProduct();
  const promoteProduct = usePromoteAdminProduct();
  const rejectPromotion = useRejectAdminProductPromotion();
  const keepPrivate = useKeepPrivateAdminProduct();

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...form });
        showToast(tAdmin("updated"), "success");
      } else {
        await createProduct.mutateAsync(form);
        showToast(tAdmin("created"), "success");
      }
      resetForm();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleDeactivate(id: string) {
    const ok = await confirm({
      title: tCommon("confirmDeactivateTitle"),
      description: tCommon("confirmDeactivateDescription"),
      confirmLabel: tAdmin("deactivate"),
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await deactivateProduct.mutateAsync(id);
      showToast(tAdmin("deactivated"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handlePromote(id: string) {
    const ok = await confirm({
      title: tCommon("confirmActionTitle"),
      description: tAdmin("promote"),
      confirmLabel: tAdmin("promote"),
    });
    if (!ok) return;
    try {
      await promoteProduct.mutateAsync(id);
      showToast(tAdmin("promoted"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={tAdmin("title")} description={tAdmin("description")} />

      <div className="flex gap-2">
        <Button
          type="button"
          variant={tab === "catalog" ? "default" : "outline"}
          onClick={() => setTab("catalog")}
        >
          {tAdmin("catalogTab")}
        </Button>
        <Button
          type="button"
          variant={tab === "submissions" ? "default" : "outline"}
          onClick={() => setTab("submissions")}
        >
          {tAdmin("submissionsTab")}
          {submissions?.some((p) => p.promotionStatus === "PENDING_REVIEW") ? (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {submissions.filter((p) => p.promotionStatus === "PENDING_REVIEW").length}
            </span>
          ) : null}
        </Button>
      </div>

      {tab === "catalog" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? tAdmin("editProduct") : tAdmin("addProduct")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <div className="space-y-2">
                  <Label>{tAdmin("sku")}</Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                    disabled={!!editingId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tCommon("name")}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tAdmin("category")}</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as ProductCategory })
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
                  <Label>{tAdmin("unit")}</Label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-end gap-2 sm:col-span-2">
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                    {editingId ? tCommon("save") : tCommon("create")}
                  </Button>
                  {editingId ? (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      {tCommon("cancel")}
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>{tAdmin("catalogTab")}</CardTitle>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
                {tAdmin("showInactive")}
              </label>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-slate-500">{tCommon("loading")}</p>
              ) : !products?.length ? (
                <p className="text-slate-500">{tAdmin("emptyCatalog")}</p>
              ) : (
                <ResponsiveTable minWidth="640px">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="pb-2">{tAdmin("sku")}</th>
                        <th className="pb-2">{tCommon("name")}</th>
                        <th className="pb-2">{tAdmin("category")}</th>
                        <th className="pb-2">{tAdmin("unit")}</th>
                        <th className="pb-2">{tCommon("status")}</th>
                        <th className="pb-2">{tCommon("edit")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="py-2 font-mono text-xs">{p.sku}</td>
                          <td className="py-2">{p.name}</td>
                          <td className="py-2">{p.category}</td>
                          <td className="py-2">{p.unit}</td>
                          <td className="py-2">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                p.active
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {p.active ? tCommon("statuses.active") : tAdmin("inactive")}
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                                {tCommon("edit")}
                              </Button>
                              {p.active ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void handleDeactivate(p.id)}
                                >
                                  {tAdmin("deactivate")}
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ResponsiveTable>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{tAdmin("submissionsTab")}</CardTitle>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <p className="text-slate-500">{tCommon("loading")}</p>
            ) : !submissions?.length ? (
              <p className="text-slate-500">{tAdmin("emptySubmissions")}</p>
            ) : (
              <ResponsiveTable minWidth="720px">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="pb-2">{tCommon("product")}</th>
                      <th className="pb-2">{tAdmin("distributor")}</th>
                      <th className="pb-2">{tAdmin("promotionStatus")}</th>
                      <th className="pb-2">{tAdmin("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="py-2">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-slate-500">
                            {p.category} · {p.unit}
                          </div>
                        </td>
                        <td className="py-2">
                          {p.ownerDistributor?.businessName ?? "—"}
                          {p.ownerDistributor?.city ? (
                            <div className="text-xs text-slate-500">
                              {p.ownerDistributor.city}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                            {tAdmin(`promotionStatuses.${p.promotionStatus ?? "PRIVATE"}`)}
                          </span>
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => void handlePromote(p.id)}>
                              {tAdmin("promote")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await keepPrivate.mutateAsync(p.id);
                                  showToast(tAdmin("keptPrivate"), "success");
                                } catch (err) {
                                  showToast(getApiErrorMessage(err), "error");
                                }
                              }}
                            >
                              {tAdmin("keepPrivate")}
                            </Button>
                            {p.promotionStatus === "PENDING_REVIEW" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: tCommon("confirmActionTitle"),
                                    description: tAdmin("reject"),
                                    confirmLabel: tAdmin("reject"),
                                    variant: "destructive",
                                  });
                                  if (!ok) return;
                                  try {
                                    await rejectPromotion.mutateAsync(p.id);
                                    showToast(tAdmin("rejected"), "success");
                                  } catch (err) {
                                    showToast(getApiErrorMessage(err), "error");
                                  }
                                }}
                              >
                                {tAdmin("reject")}
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ResponsiveTable>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
