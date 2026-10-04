import type { Metadata } from "next";
import Link from "next/link";
import { FilterForm, FilterSearch } from "@/components/filter-form";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatXAF } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { withMoney } from "@/lib/status";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = param((await searchParams).q).trim().toLowerCase();

  const clients = await prisma.client.findMany({
    orderBy: { fullName: "asc" },
    include: { subscriptions: { include: { payments: true } } },
  });

  const rows = clients
    .map((c) => {
      const subs = c.subscriptions.map((s) => withMoney(s));
      return {
        ...c,
        activeCount: subs.filter((s) => s.status === "ACTIVE" && s.daysLeft >= 0).length,
        balance: subs.reduce((sum, s) => sum + s.balance, 0),
      };
    })
    .filter((c) => !q || [c.fullName, c.phone, c.accountUsername].some((v) => v.toLowerCase().includes(q)));

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${clients.length} in total`}
        actions={<Link href="/clients/new" className="btn-primary">Add client</Link>}
      />
      <Panel>
        <FilterForm>
          <FilterSearch defaultValue={q} placeholder="Search by name, phone or username" />
          <button type="submit" className="btn-secondary">Search</button>
        </FilterForm>
        {rows.length === 0 ? (
          clients.length === 0 ? (
            <EmptyState
              title="No clients yet"
              text="Add your first client, then record the subscriptions you sold them."
              action={<Link href="/clients/new" className="btn-primary">Add client</Link>}
            />
          ) : (
            <EmptyState title="No client matches your search" text="Try a different name, phone number or username." />
          )
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Account username</th>
                  <th className="num">Active subscriptions</th>
                  <th className="num">Balance owed</th>
                  <th>Date added</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">
                      <Link href={`/clients/${c.id}`} className="text-brand-700 hover:underline">{c.fullName}</Link>
                    </td>
                    <td className="whitespace-nowrap">{c.phone}</td>
                    <td>{c.accountUsername}</td>
                    <td className="num">{c.activeCount}</td>
                    <td className={`num ${c.balance > 0 ? "font-semibold text-red-700" : "text-muted"}`}>{c.balance > 0 ? formatXAF(c.balance) : "None"}</td>
                    <td className="whitespace-nowrap">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
