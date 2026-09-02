import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type IdentityDocumentType = "AADHAAR" | "PAN" | "OTHER";
export type IdentityDocumentStatus = "PENDING" | "VERIFIED" | "DECLINED";

export interface IdentityDocument {
  id: string;
  documentType: IdentityDocumentType;
  mimeType: string;
  originalName?: string | null;
  declaredName: string;
  matchedAgainst: string;
  ocrExtractedName?: string | null;
  ocrScore?: number | null;
  status: IdentityDocumentStatus;
  declineReason?: string | null;
  createdAt: string;
}

export interface IdentityStatus {
  identityVerified: boolean;
  documentsCount: number;
  verifiedCount: number;
  canProceed: boolean;
  registeredName?: string;
}

export function useIdentityStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["identity", "status"],
    queryFn: async () => {
      const res = await api.get<IdentityStatus>("/identity/status");
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useIdentityDocuments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["identity", "documents"],
    queryFn: async () => {
      const res = await api.get<IdentityDocument[]>("/identity/documents");
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useUploadIdentityDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      file: File;
      documentType: IdentityDocumentType;
      declaredName: string;
    }) => {
      const form = new FormData();
      form.append("file", data.file);
      form.append("documentType", data.documentType);
      form.append("declaredName", data.declaredName);
      const res = await api.post<IdentityDocument>("/identity/documents", form, {
        timeout: 120_000,
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: [
          (data, headers) => {
            if (data instanceof FormData && headers) {
              // Let the browser/axios set boundary for FormData
              delete (headers as Record<string, unknown>)["Content-Type"];
            }
            return data;
          },
        ],
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity"] });
      qc.invalidateQueries({ queryKey: ["distributor", "profile"] });
      qc.invalidateQueries({ queryKey: ["customer", "profile"] });
    },
  });
}

export function useDeleteIdentityDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/identity/documents/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["identity"] });
      qc.invalidateQueries({ queryKey: ["distributor", "profile"] });
      qc.invalidateQueries({ queryKey: ["customer", "profile"] });
    },
  });
}
