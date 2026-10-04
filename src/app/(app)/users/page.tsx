import type { Metadata } from "next";
import Link from "next/link";
import { deleteUser } from "@/actions/users";
import { ConfirmForm } from "@/components/confirm-form";
import { PageHeader, Panel } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who can sign in. Admins can manage users; collaborators manage clients, subscriptions and payments."
        actions={<Link href="/users/new" className="btn-primary">Add user</Link>}
      />
      <Panel>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email / username</th>
                <th>Role</th>
                <th>Added</th>
                <th className="sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">
                    {u.name}
                    {u.id === me.id && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}
                  </td>
                  <td>{u.username}</td>
                  <td>{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td className="whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td className="whitespace-nowrap text-right">
                    <Link href={`/users/${u.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
                    {u.id !== me.id && (
                      <ConfirmForm
                        action={deleteUser.bind(null, u.id)}
                        trigger="Delete"
                        title={`Delete ${u.name}?`}
                        message="They won't be able to sign in any more. Payments they recorded stay, shown as recorded by a removed user."
                        confirmLabel="Delete user"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
