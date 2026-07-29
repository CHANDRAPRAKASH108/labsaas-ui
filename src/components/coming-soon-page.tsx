import { Card } from "@/components/ui";

export function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card title={title}>
      <p className="text-sm text-emerald-900/70">{description}</p>
      <p className="mt-3 inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
        Coming soon
      </p>
    </Card>
  );
}
