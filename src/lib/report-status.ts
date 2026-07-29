export type ReportWorkflowStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED";

export function reportStatusLabel(status: string) {
  switch (status) {
    case "QUEUED":
      return "In queue";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Completed";
    default:
      return status.replaceAll("_", " ");
  }
}

export function reportStatusTone(status: string): "green" | "amber" | "slate" | "teal" {
  switch (status) {
    case "COMPLETED":
      return "green";
    case "IN_PROGRESS":
      return "teal";
    case "QUEUED":
      return "amber";
    default:
      return "slate";
  }
}
