export type UiLogLevel = "info" | "warn" | "error";

export type UiLogEntry = {
  id: number;
  at: string;
  level: UiLogLevel;
  scope: string;
  message: string;
  detail?: Record<string, unknown>;
};

const MAX_ENTRIES = 200;

type Listener = (entries: UiLogEntry[]) => void;

let seq = 0;
const entries: UiLogEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  const snapshot = entries.slice();
  for (const listener of listeners) listener(snapshot);
}

export function getUiLogs(): UiLogEntry[] {
  return entries.slice();
}

export function clearUiLogs() {
  entries.length = 0;
  emit();
}

export function subscribeUiLogs(listener: Listener): () => void {
  listeners.add(listener);
  listener(entries.slice());
  return () => {
    listeners.delete(listener);
  };
}

/** Client + server safe logger. Browser UI panel only updates in the browser. */
export function uiLog(
  scope: string,
  message: string,
  detail?: Record<string, unknown>,
  level: UiLogLevel = "info",
) {
  const entry: UiLogEntry = {
    id: ++seq,
    at: new Date().toISOString(),
    level,
    scope,
    message,
    detail,
  };

  const line = `[ui:${scope}] ${message}`;
  if (level === "error") console.error(line, detail ?? "");
  else if (level === "warn") console.warn(line, detail ?? "");
  else console.log(line, detail ?? "");

  if (typeof window !== "undefined") {
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
    emit();
  }

  return entry;
}
