/** Base URL for the LabSaaS API (server-side fetches from the web app). */
export function apiUrl(path: string) {
  const base = process.env.API_URL ?? "http://localhost:4000";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalized}`;
}
