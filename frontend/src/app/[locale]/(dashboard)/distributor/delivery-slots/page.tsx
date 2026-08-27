"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDeliverySlots,
  useCreateDeliverySlot,
  useDeleteDeliverySlot,
} from "@/hooks/use-distributor";
import { useFormSchemas } from "@/hooks/use-form-schemas";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function DistributorDeliverySlotsPage() {
  const tDistributor = useTranslations("distributor");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const { data: slots, isLoading } = useDeliverySlots();
  const createSlot = useCreateDeliverySlot();
  const deleteSlot = useDeleteDeliverySlot();
  const schemas = useFormSchemas();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.deliverySlotSchema),
  });

  const onSubmit = async (data: {
    label: string;
    startTime: string;
    endTime: string;
  }) => {
    try {
      await createSlot.mutateAsync(data);
      reset();
      showToast(tCommon("created"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleRemove = async (id: string) => {
    const ok = await confirm({
      title: tCommon("confirmRemoveSlotTitle"),
      description: tCommon("confirmRemoveSlotDescription"),
      confirmLabel: tCommon("remove"),
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await deleteSlot.mutateAsync(id);
      showToast(tCommon("deleted"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tDistributor("slots.title")}
        </h1>
        <p className="text-slate-600">{tDistributor("slots.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tDistributor("slots.addSlot")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-4 max-w-2xl"
          >
            <div className="space-y-2">
              <Label>{tDistributor("slots.slotName")}</Label>
              <Input placeholder="Morning" {...register("label")} />
            </div>
            <div className="space-y-2">
              <Label>{tDistributor("slots.startTime")}</Label>
              <Input type="time" {...register("startTime")} />
            </div>
            <div className="space-y-2">
              <Label>{tDistributor("slots.endTime")}</Label>
              <Input type="time" {...register("endTime")} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {tDistributor("slots.addSlot")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active slots</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-500">{tCommon("loading")}</p>
          ) : !slots?.length ? (
            <p className="text-slate-500">No delivery slots yet</p>
          ) : (
            <div className="space-y-2">
              {slots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-medium">{s.label}</p>
                    <p className="text-sm text-slate-500">
                      {s.startTime} – {s.endTime}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleRemove(s.id)}
                  >
                    {tCommon("remove")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
