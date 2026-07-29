import { cookies } from "next/headers";
import { apiUrl } from "@/lib/api-url";
import { uiLog } from "@/lib/ui-log";

const COOKIE = "lab_session";

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; details?: unknown; status: number };
export type ApiResult<T> = ApiOk<T> | ApiErr;

type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string | undefined | null>;
  formData?: FormData;
};

async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResult<T>> {
  const url = new URL(apiUrl(path));
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value != null && value !== "") url.searchParams.set(key, value);
    }
  }

  const method = options.method ?? (options.body || options.formData ? "POST" : "GET");
  uiLog("apiFetch", `${method} ${url.origin}${url.pathname}`);

  const headers = new Headers();
  const token = await sessionToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    uiLog("apiFetch", "network error", { url: url.toString(), error: message }, "error");
    return {
      ok: false,
      error: `Cannot reach API at ${url.origin} (${message})`,
      status: 0,
    };
  }

  let json: { ok?: boolean; data?: T; error?: string; details?: unknown } = {};
  try {
    json = await res.json();
  } catch {
    uiLog("apiFetch", "invalid JSON", { status: res.status, path: url.pathname }, "error");
    return { ok: false, error: `Invalid API response (${res.status})`, status: res.status };
  }

  if (!res.ok || json.ok === false) {
    uiLog(
      "apiFetch",
      "error response",
      { status: res.status, error: json.error, path: url.pathname },
      "warn",
    );
    return {
      ok: false,
      error: json.error || `Request failed (${res.status})`,
      details: json.details,
      status: res.status,
    };
  }

  uiLog("apiFetch", "ok", { status: res.status, path: url.pathname });
  return { ok: true, data: json.data as T };
}
