import { apiFetch } from "@/lib/api-client";
import { requireSuperAdmin } from "@/lib/session";
import { Badge, Card, EmptyState, StatCard, TextLink } from "@/components/ui";
import { ListSearch } from "@/components/list-search";
import { searchQuery } from "@/lib/search";
import { impersonateClientAction } from "@/app/actions/auth";
import { AddClientForm } from "@/components/add-client-form";

type SuperClientRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  featureEmail: boolean;
  featureSms: boolean;
  featureWhatsapp: boolean;
  _count: { users: number; patients: number; orders: number };
};

export default async function SuperDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireSuperAdmin();
  const q = searchQuery((await searchParams).q);

  const result = await apiFetch<{ clients: SuperClientRow[]; allCount: number }>(
    "/api/v1/super/clients",
    { searchParams: { q: q || undefined } },
  );
  if (!result.ok) {
    return <EmptyState>Could not load clients: {result.error}</EmptyState>;
  }

  const { clients, allCount } = result.data;

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Clients" value={allCount} />
        <StatCard
          label="Messaging flags"
          value={clients.filter((c) => c.featureEmail || c.featureSms || c.featureWhatsapp).length}
          hint="in this view"
        />
        <StatCard label="Active labs" value={clients.filter((c) => c.isActive).length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card title="Add new client">
          <p className="mb-4 text-sm text-slate-600">
            Creates the lab tenant and a Client Admin login. Messaging flags stay off until you
            enable them.
          </p>
          <AddClientForm />
        </Card>

        <Card title={`All clients (${clients.length})`}>
          <ListSearch action="/super" q={q} placeholder="Search lab name, slug, email, or phone" />
          {clients.length === 0 ? (
            <EmptyState>
              {q ? "No clients match that search." : "No clients yet. Use the form to add the first lab."}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="lab-table">
                <caption className="sr-only">All lab clients</caption>
                <thead>
                  <tr>
                    <th scope="col">Lab</th>
                    <th scope="col">Status</th>
                    <th scope="col">Flags</th>
                    <th scope="col">Usage</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-slate-500">{client.slug}</div>
                      </td>
                      <td>
                        <Badge tone={client.isActive ? "green" : "red"}>
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="space-x-1">
                        {client.featureEmail ? <Badge tone="teal">Email</Badge> : null}
                        {client.featureSms ? <Badge tone="teal">SMS</Badge> : null}
                        {client.featureWhatsapp ? <Badge tone="teal">WhatsApp</Badge> : null}
                        {!client.featureEmail &&
                        !client.featureSms &&
                        !client.featureWhatsapp ? (
                          <span className="text-xs text-slate-400">None</span>
                        ) : null}
                      </td>
                      <td className="text-xs text-slate-600">
                        {client._count.users} users · {client._count.patients} patients ·{" "}
                        {client._count.orders} orders
                      </td>
                      <td className="space-x-3 text-right">
                        <TextLink href={`/super/clients/${client.id}`}>Configure</TextLink>
                        <form
                          action={impersonateClientAction.bind(null, client.id)}
                          className="inline"
                        >
                          <button
                            type="submit"
                            className="text-sm font-medium text-slate-900 underline"
                          >
                            Open app
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
