import { API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { UnreadCountResponse } from "@/hooks/use-notifications";
import type { AuthResponse } from "@/types";

export type NotificationStreamHandlers = {
  onNotification: (payload: UnreadCountResponse) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
};

/**
 * Fetch-based SSE client (Bearer Authorization).
 * Native EventSource cannot set auth headers with our localStorage JWT model.
 */
export async function openNotificationStream(
  handlers: NotificationStreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  const connectOnce = async (accessToken: string) => {
    const res = await fetch(`${API_BASE_URL}/notifications/stream`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "text/event-stream",
      },
      signal,
      cache: "no-store",
    });

    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        throw new Error("unauthorized");
      }
      return connectOnce(refreshed);
    }

    if (!res.ok || !res.body) {
      throw new Error(`stream_failed_${res.status}`);
    }

    handlers.onConnected?.();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseSseEvent(rawEvent);
        if (parsed?.type === "notification" && parsed.data) {
          try {
            const payload = JSON.parse(parsed.data) as UnreadCountResponse;
            handlers.onNotification(payload);
          } catch {
            // ignore malformed payloads
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
  };

  try {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      throw new Error("missing_token");
    }
    await connectOnce(token);
  } finally {
    handlers.onDisconnected?.();
  }
}

function parseSseEvent(raw: string): { type: string; data: string } | null {
  let type = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      type = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;
  return { type, data: dataLines.join("\n") };
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    useAuthStore.getState().clearAuth();
    return null;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      useAuthStore.getState().clearAuth();
      return null;
    }
    const data = (await res.json()) as AuthResponse;
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    useAuthStore.getState().clearAuth();
    return null;
  }
}
