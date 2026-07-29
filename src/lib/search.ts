export function searchQuery(value: string | string[] | undefined) {
  if (!value) return "";
  return String(Array.isArray(value) ? value[0] : value).trim();
}
