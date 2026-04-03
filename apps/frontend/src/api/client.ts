const BASE = "/api";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    let detail = res.statusText;
    const d = data as { detail?: string | { msg: string }[] };
    if (typeof d?.detail === "string") {
      detail = d.detail;
    } else if (Array.isArray(d?.detail)) {
      detail = d.detail.map((x) => ("msg" in x ? x.msg : String(x))).join(", ");
    }
    throw new Error(detail);
  }
  return data as T;
}

export async function refreshSession(): Promise<void> {
  await apiFetch("/auth/refresh", { method: "POST" });
}
