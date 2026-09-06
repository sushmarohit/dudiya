"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, FileText, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDeleteIdentityDocument,
  useIdentityDocuments,
  useIdentityStatus,
  useUploadIdentityDocument,
  type IdentityDocumentType,
} from "@/hooks/use-identity";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { showToast } from "@/components/providers";
import { useConfirm } from "@/components/ui/confirm-dialog";

const DOC_TYPES: IdentityDocumentType[] = ["AADHAAR", "PAN", "OTHER"];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface IdentityDocumentsPanelProps {
  onVerifiedContinue?: () => void;
  showContinue?: boolean;
}

export function IdentityDocumentsPanel({
  onVerifiedContinue,
  showContinue = false,
}: IdentityDocumentsPanelProps) {
  const t = useTranslations("identity");
  const tCommon = useTranslations("common");
  const getApiErrorMessage = useApiErrorMessage();
  const confirm = useConfirm();
  const { data: status } = useIdentityStatus();
  const { data: documents, isLoading } = useIdentityDocuments();
  const upload = useUploadIdentityDocument();
  const remove = useDeleteIdentityDocument();

  const [documentType, setDocumentType] = useState<IdentityDocumentType>("AADHAAR");
  const [declaredName, setDeclaredName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const canUpload = (documents?.length ?? 0) < 2;
  const isImagePreview = !!file && file.type.startsWith("image/");
  const isPdfPreview = !!file && file.type === "application/pdf";

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clearSelectedFile = () => {
    setFile(null);
    setFileInputKey((k) => k + 1);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !declaredName.trim()) {
      showToast(t("uploadRequired"), "error");
      return;
    }
    try {
      const doc = await upload.mutateAsync({
        file,
        documentType,
        declaredName: declaredName.trim(),
      });
      if (doc.status === "VERIFIED") {
        showToast(t("verified"), "success");
      } else {
        showToast(t("declined"), "error");
      }
      setFile(null);
      setFileInputKey((k) => k + 1);
      setDeclaredName("");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t("deleteTitle"),
      description: t("deleteDescription"),
      confirmLabel: tCommon("delete"),
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(id);
      showToast(tCommon("deleted"), "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p>{t("instructions")}</p>
        {status?.registeredName ? (
          <p className="mt-2 font-medium">
            {t("registeredName")}: {status.registeredName}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">{t("limits")}</p>
      </div>

      {isLoading ? (
        <p className="text-slate-500">{tCommon("loading")}</p>
      ) : (
        <ul className="space-y-3">
          {(documents ?? []).map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {t(`types.${doc.documentType}`)}
                  {doc.originalName ? ` · ${doc.originalName}` : ""}
                </p>
                <p className="text-slate-600">
                  {t("declaredName")}: {doc.declaredName}
                </p>
                {doc.ocrExtractedName ? (
                  <p className="text-slate-500">
                    {t("ocrMatched")}: {doc.ocrExtractedName}
                    {typeof doc.ocrScore === "number"
                      ? ` (${Math.round(doc.ocrScore * 100)}%)`
                      : ""}
                  </p>
                ) : null}
                {doc.status === "VERIFIED" ? (
                  <p className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("verified")}
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-red-700">
                    <XCircle className="h-4 w-4" />
                    {doc.declineReason || t("declined")}
                  </p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleDelete(doc.id)}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {!documents?.length ? (
            <li className="text-sm text-slate-500">{t("noneYet")}</li>
          ) : null}
        </ul>
      )}

      {canUpload ? (
        <form onSubmit={handleUpload} className="space-y-4 rounded-lg border border-slate-200 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("documentType")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value as IdentityDocumentType)
                }
              >
                {DOC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("declaredName")}</Label>
              <Input
                value={declaredName}
                onChange={(e) => setDeclaredName(e.target.value)}
                placeholder={status?.registeredName || t("declaredNamePlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              {t("file")} <span className="text-red-600">*</span>
            </Label>
            <Input
              key={fileInputKey}
              type="file"
              required
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-slate-500">{t("fileRequiredHint")}</p>
          </div>
          {file && previewUrl ? (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label>{t("preview")}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearSelectedFile}
                >
                  {t("clearFile")}
                </Button>
              </div>
              {isImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={t("previewAlt")}
                  className="max-h-64 w-full rounded-md border border-slate-200 object-contain bg-white"
                />
              ) : isPdfPreview ? (
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4">
                  <FileText className="h-10 w-10 shrink-0 text-slate-500" />
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium text-slate-800">{file.name}</p>
                    <p className="text-slate-500">
                      {t("pdfPreview")} · {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <p className="truncate font-medium text-slate-800">{file.name}</p>
                  <p className="text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              )}
              {isImagePreview ? (
                <p className="truncate text-xs text-slate-500">
                  {file.name} · {formatFileSize(file.size)}
                </p>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" disabled={upload.isPending}>
            {upload.isPending ? t("uploadingOcr") : t("upload")}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-slate-600">{t("maxReached")}</p>
      )}

      {showContinue ? (
        <Button
          type="button"
          onClick={onVerifiedContinue}
          disabled={!status?.identityVerified}
        >
          {status?.identityVerified ? t("continue") : t("needVerified")}
        </Button>
      ) : null}
    </div>
  );
}
