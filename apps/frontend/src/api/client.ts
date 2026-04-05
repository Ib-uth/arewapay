const BASE = "/api";

type DetailObject = { message?: string; wait_seconds?: number; exhausted?: boolean };

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
    const d = data as { detail?: string | { msg: string }[] | DetailObject };
    if (typeof d?.detail === "string") {
      detail = d.detail;
    } else if (Array.isArray(d?.detail)) {
      detail = d.detail.map((x) => ("msg" in x ? x.msg : String(x))).join(", ");
    } else if (
      d?.detail &&
      typeof d.detail === "object" &&
      !Array.isArray(d.detail) &&
      "message" in d.detail &&
      typeof (d.detail as DetailObject).message === "string"
    ) {
      detail = (d.detail as DetailObject).message ?? detail;
    }
    throw new Error(detail);
  }
  return data as T;
}

export type OtpStatus = {
  wait_seconds: number;
  can_resend: boolean;
  exhausted: boolean;
  sends_used: number;
  max_sends: number;
  email_configured: boolean;
};

export async function fetchOtpStatus(email: string): Promise<OtpStatus> {
  const q = new URLSearchParams({ email });
  return apiFetch<OtpStatus>(`/auth/register/otp-status?${q.toString()}`);
}

export async function resendRegisterOtp(
  email: string,
): Promise<{ message: string; email_sent: boolean }> {
  const res = await fetch(`${BASE}/auth/register/resend`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: string | DetailObject;
    message?: string;
    email_sent?: boolean;
  };
  if (!res.ok) {
    const det = data.detail;
    if (
      typeof det === "object" &&
      det &&
      "wait_seconds" in det &&
      typeof det.wait_seconds === "number"
    ) {
      const err = new Error(det.message ?? "Please wait before resending.") as Error & {
        waitSeconds: number;
      };
      err.waitSeconds = det.wait_seconds;
      throw err;
    }
    if (typeof det === "object" && det?.exhausted) {
      throw new Error(det.message ?? "Too many code requests.");
    }
    const msg =
      typeof det === "string"
        ? det
        : typeof det === "object" && det && "message" in det && typeof det.message === "string"
          ? det.message
          : res.statusText;
    throw new Error(msg);
  }
  return {
    message: data.message ?? "Sent",
    email_sent: Boolean(data.email_sent),
  };
}

export async function refreshSession(): Promise<void> {
  await apiFetch("/auth/refresh", { method: "POST" });
}

async function postLogo(file: File): Promise<Response> {
  const fd = new FormData();
  fd.append("file", file);
  return fetch(`${BASE}/users/me/logo`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
}

/** Multipart upload does not go through apiFetch; refresh access cookie if it expired. */
export async function uploadLogo(file: File): Promise<{ logo_url: string }> {
  let res = await postLogo(file);
  if (res.status === 401) {
    try {
      await refreshSession();
    } catch {
      /* fall through to parse error */
    }
    res = await postLogo(file);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const d = data as { detail?: string };
    throw new Error(typeof d?.detail === "string" ? d.detail : res.statusText);
  }
  return data as { logo_url: string };
}
