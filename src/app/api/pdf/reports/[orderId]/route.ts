import { cookies } from "next/headers";
import { apiUrl } from "@/lib/api-url";

async function proxyPdf(apiPath: string) {
  const jar = await cookies();
  const token = jar.get("lab_session")?.value;
  const res = await fetch(apiUrl(apiPath), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(text || res.statusText, { status: res.status });
  }

  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  const disposition = res.headers.get("content-disposition");
  if (contentType) headers.set("Content-Type", contentType);
  if (disposition) headers.set("Content-Disposition", disposition);
  headers.set("Cache-Control", "no-store");

  return new Response(res.body, { status: 200, headers });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  return proxyPdf(`/api/pdf/reports/${orderId}`);
}
