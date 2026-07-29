import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { requireClientContext } from "@/lib/session";
import { Badge, Card, EmptyState } from "@/components/ui";
import { ListSearch } from "@/components/list-search";
import { searchQuery } from "@/lib/search";
import { CreateLabUserForm } from "@/components/create-lab-user-form";
import { EditUserScreensForm } from "@/components/edit-user-screens-form";
import { ChangeUserPasswordForm } from "@/components/change-user-password-form";

function canManageLabUsers(session: { role: string; impersonatingClientId?: string | null }) {
  if (session.role === "CLIENT_ADMIN") return true;
  if (session.role === "SUPER_ADMIN" && session.impersonatingClientId) return true;
  return false;
}

type LabUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  allowedScreens: string[];
  createdAt: string;
};

function matchesUserQuery(user: LabUserRow, q: string) {
  const lower = q.toLowerCase();
  return user.name.toLowerCase().includes(lower) || user.email.toLowerCase().includes(lower);
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { session } = await requireClientContext();
  if (!canManageLabUsers(session)) redirect("/app");

  const q = searchQuery((await searchParams).q);

  const result = await apiFetch<{ users: LabUserRow[] }>("/api/v1/users");
  let users = result.ok ? result.data.users : [];
  if (result.ok && q) {
    users = users.filter((user) => matchesUserQuery(user, q));
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card title="Add user">
          <p className="mb-3 text-sm text-emerald-900/70">
            Create staff with selected screens, or another client admin with full access. Default
            password is <code className="rounded bg-emerald-100 px-1">lab123</code> if left blank.
            Only admins can change passwords later.
          </p>
          <CreateLabUserForm />
        </Card>

        <Card title={`Lab users (${users.length})`}>
          {!result.ok ? (
            <EmptyState>Could not load users: {result.error}</EmptyState>
          ) : null}
          <ListSearch action="/app/users" q={q} placeholder="Search name or email" />
          {result.ok && users.length === 0 ? (
            <EmptyState>
              {q ? "No users match that search." : "No users yet for this lab."}
            </EmptyState>
          ) : null}
          {result.ok && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="lab-table">
                <caption className="sr-only">Lab users</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Role</th>
                    <th scope="col">Screens</th>
                    <th scope="col">Password</th>
                    <th scope="col">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-emerald-900/55">{user.email}</p>
                      </td>
                      <td>
                        <Badge tone={user.role === "CLIENT_ADMIN" ? "teal" : "slate"}>
                          {user.role === "CLIENT_ADMIN" ? "Client admin" : "Staff"}
                        </Badge>
                      </td>
                      <td className="min-w-[14rem]">
                        <EditUserScreensForm
                          userId={user.id}
                          role={user.role}
                          allowedScreens={user.allowedScreens}
                        />
                      </td>
                      <td className="min-w-[12rem]">
                        <ChangeUserPasswordForm userId={user.id} userName={user.name} />
                      </td>
                      <td className="whitespace-nowrap text-sm text-emerald-900/65">
                        {new Date(user.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
