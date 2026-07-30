import { cookies } from "next/headers";
import { apiUrl } from "@/lib/api-url";
import { toUserError } from "@/lib/user-error";

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
  } catch {
    return {
      ok: false,
      error: toUserError(0),
      status: 0,
    };
  }

  let json: { ok?: boolean; data?: T; error?: string; details?: unknown } = {};
  try {
    json = await res.json();
  } catch {
    return {
      ok: false,
      error: toUserError(res.status, `Invalid API response (${res.status})`),
      status: res.status,
    };
  }

  if (!res.ok || json.ok === false) {
    return {
      ok: false,
      error: toUserError(
        res.status,
        json.error || `Request failed (${res.status})`,
        json.details,
      ),
      details: json.details,
      status: res.status,
    };
  }

  return { ok: true, data: json.data as T };
}
