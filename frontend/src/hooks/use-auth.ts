import { useMutation } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { AuthResponse } from "@/types";
import type { LoginInput } from "@/lib/schemas";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await api.post<AuthResponse>("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post<AuthResponse>("/auth/register", data);
      return res.data;
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post("/auth/forgot-password", { email });
      return res.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await api.post("/auth/reset-password", data);
      return res.data;
    },
  });
}

export function useActivate() {
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await api.post<AuthResponse>("/auth/activate", data);
      return res.data;
    },
  });
}

export function useAuthErrorMessage(error: unknown) {
  return getErrorMessage(error);
}
