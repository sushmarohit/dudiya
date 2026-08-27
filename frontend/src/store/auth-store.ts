"use client";

import { create } from "zustand";
import type { User } from "@/types";

const STORAGE_KEY = "milk-auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (patch: Partial<User>) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

function persist(state: Pick<AuthState, "user" | "accessToken" | "refreshToken">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (state.user?.role) {
    document.cookie = `milk-auth-role=${state.user.role}; path=/; SameSite=Lax`;
  }
}

function clearPersist() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = "milk-auth-role=; path=/; max-age=0";
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  setAuth: (user, accessToken, refreshToken) => {
    persist({ user, accessToken, refreshToken });
    set({ user, accessToken, refreshToken, hydrated: true });
  },

  setTokens: (accessToken, refreshToken) => {
    const current = useAuthStore.getState();
    persist({ user: current.user, accessToken, refreshToken });
    set({ accessToken, refreshToken });
  },

  updateUser: (patch) => {
    const current = useAuthStore.getState();
    if (!current.user) return;
    const user = { ...current.user, ...patch };
    persist({
      user,
      accessToken: current.accessToken!,
      refreshToken: current.refreshToken!,
    });
    set({ user });
  },

  clearAuth: () => {
    clearPersist();
    set({ user: null, accessToken: null, refreshToken: null });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          user: User;
          accessToken: string;
          refreshToken: string;
        };
        set({
          user: parsed.user,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          hydrated: true,
        });
        document.cookie = `milk-auth-role=${parsed.user.role}; path=/; SameSite=Lax`;
      } else {
        set({ hydrated: true });
      }
    } catch {
      clearPersist();
      set({ hydrated: true });
    }
  },
}));
