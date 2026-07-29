import { cookies } from "next/headers";
import { apiUrl } from "@/lib/api-url";

async function proxyJson(apiPath: string) {
  const jar = await cookies();
  const token = jar.get("lab_session")?.value;
  const res = await fetch(apiUrl(apiPath), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/api/pdf/invoices/${id}?signed=1`);
}
