import type { AxiosError } from "axios";
import axios from "axios";

type ApiErrorPayload = {
  code?: string;
  message?: string | string[];
  error?: string;
  params?: Record<string, string | number>;
};

export function getApiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as ApiErrorPayload | undefined;
  return data?.code ?? null;
}

export function getErrorMessage(
  error: unknown,
  translate?: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    if (data?.code && translate) {
      const key = `errors.${data.code}`;
      try {
        return translate(key, data.params);
      } catch {
        return translate("errors.GENERIC");
      }
    }
    if (Array.isArray(data?.message)) return data.message.join(", ");
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return translate ? translate("errors.GENERIC") : "Something went wrong";
}

export function getAxiosError(error: unknown): AxiosError | null {
  return axios.isAxiosError(error) ? error : null;
}
