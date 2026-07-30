/**
 * Map API/transport failures to messages safe to show end users.
 * Keeps short, actionable API validation messages; hides infra/status dumps.
 */
export function toUserError(
  status: number,
  apiError?: string | null,
  details?: unknown,
): string {
  const raw = (apiError || "").trim();
  const fromDetails = firstValidationMessage(details);

  if (status === 0) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (status === 401) {
    return "Please sign in again to continue.";
  }
  if (status === 403) {
    return isSafeUserMessage(raw) ? raw : "You don't have permission to do that.";
  }
  if (status === 404) {
    return isSafeUserMessage(raw) ? raw : "We couldn't find what you were looking for.";
  }
  if (status === 409) {
    return isSafeUserMessage(raw) ? raw : "That conflicts with an existing record.";
  }
  if (status === 400 || status === 422) {
    if (fromDetails && isSafeUserMessage(fromDetails)) return fromDetails;
    if (isSafeUserMessage(raw) && raw.toLowerCase() !== "validation failed") {
      return raw;
    }
    return "Please check the form and try again.";
  }
  if (status >= 500) {
    return "Something went wrong on our side. Please try again in a moment.";
  }
  if (isSafeUserMessage(raw)) return raw;
  return "Something went wrong. Please try again.";
}

function firstValidationMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
  if (d.formErrors?.[0]) return d.formErrors[0];
  if (d.fieldErrors) {
    for (const msgs of Object.values(d.fieldErrors)) {
      if (msgs?.[0]) return msgs[0];
    }
  }
  return null;
}

function isSafeUserMessage(msg: string): boolean {
  if (!msg) return false;
  if (msg.length > 180) return false;
  const lower = msg.toLowerCase();
  return !(
    /status\s*\d/.test(lower) ||
    lower.includes("internal server") ||
    lower.includes("prisma") ||
    lower.includes("sql") ||
    lower.includes("stack") ||
    lower.includes("exception") ||
    lower.includes("econnrefused") ||
    lower.includes("fetch failed") ||
    lower.includes("cannot reach api") ||
    lower.includes("invalid api response") ||
    /request failed\s*\(/.test(lower) ||
    lower.includes("etimedout") ||
    lower.includes("enotfound")
  );
}
