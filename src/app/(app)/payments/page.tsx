import type { Metadata } from "next";
import Link from "next/link";
import { deletePayment } from "@/actions/payments";
import { ConfirmForm } from "@/components/confirm-form";
import { FilterForm, FilterSearch, FilterSelect } from "@/components/filter-form";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { PAYMENT_METHODS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, formatMonth, isValidMonth, monthRange } from "@/lib/dates";
import { formatXAF, plural } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = param(sp.q).trim().toLowerCase();
  const method = param(sp.method);
  const monthParam = param(sp.month);
  const month = isValidMonth(monthParam) ? monthParam : "";

  const payments = await prisma.payment.findMany({
    where: {
      ...(method ? { method } : {}),
      ...(month ? { paidAt: { gte: monthRange(month).start, lt: monthRange(month).end } } : {}),
    },
    include: { subscription: { include: { client: true } }, recordedBy: true },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
  });
  const rows = payments.filter(
    (p) =>
      !q ||
      [p.subscription.client.fullName, p.subscription.platform, p.reference ?? ""].some((v) => v.toLowerCase().includes(q)),
  );
  const total = rows.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Payments"
        description={`${plural(rows.length, "payment")} · ${formatXAF(total)}${month ? ` in ${formatMonth(month)}` : " in total"}`}
        actions={<Link href="/payments/new" className="btn-primary">Record payment</Link>}
      />
      <Panel>
        <FilterForm>
          <FilterSearch defaultValue={q} placeholder="Search client, platform or reference" />
          <div>
            <label htmlFor="month" className="sr-only">Month</label>
            <input id="month" name="month" type="month" defaultValue={month} className="input" />
          </div>
          <FilterSelect
            name="method"
            label="Payment method"
            value={method}
            options={[{ value: "", label: "Any method" }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: m }))]}
          />
          <button type="submit" className="btn-secondary">Apply</button>
        </FilterForm>
        {rows.length === 0 ? (
          payments.length === 0 && !month && !method && !q ? (
            <EmptyState title="No payments yet" text="Record a payment from a client's subscription, or here." action={<Link href="/payments/new" className="btn-primary">Record payment</Link>} />
          ) : (
            <EmptyState title="No payments match these filters" action={<Link href="/payments" className="btn-secondary">Clear filters</Link>} />
          )
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Subscription</th>
                  <th className="num">Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Recorded by</th>
                  <th className="sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{formatDate(p.paidAt)}</td>
                    <td className="font-medium">
                      <Link href={`/clients/${p.subscription.clientId}`} className="hover:underline">{p.subscription.client.fullName}</Link>
                    </td>
                    <td>
                      <Link href={`/subscriptions/${p.subscriptionId}`} className="text-brand-700 hover:underline">{p.subscription.platform}</Link>
                      <span className="block text-xs text-muted">{p.subscription.plan}</span>
                    </td>
                    <td className="num font-semibold">{formatXAF(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{p.reference ?? <span className="text-muted">None</span>}</td>
                    <td>{p.recordedBy?.name ?? <span className="text-muted">Removed user</span>}</td>
                    <td className="whitespace-nowrap text-right">
                      <Link href={`/payments/${p.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
                      <ConfirmForm
                        action={deletePayment.bind(null, p.id, "/payments")}
                        trigger="Delete"
                        title="Delete this payment?"
                        message={`${formatXAF(p.amount)} from ${p.subscription.client.fullName} will be removed and their balance will go up by the same amount.`}
                        confirmLabel="Delete payment"
                      />
                    </td>
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
