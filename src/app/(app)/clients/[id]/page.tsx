import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteClient } from "@/actions/clients";
import { ConfirmForm } from "@/components/confirm-form";
import { EmptyState, PageHeader, Panel, Stat, StatusBadge, rowTone } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatXAF, plural, whatsappLink } from "@/lib/format";
import { withMoney } from "@/lib/status";

export const metadata: Metadata = { title: "Client" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      subscriptions: { include: { payments: { include: { recordedBy: true }, orderBy: { paidAt: "desc" } } }, orderBy: { endDate: "desc" } },
    },
  });
  if (!client) notFound();

  const subs = client.subscriptions.map((s) => withMoney(s));
  const payments = subs
    .flatMap((s) => s.payments.map((p) => ({ ...p, platform: s.platform, plan: s.plan })))
    .sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
  const billed = subs.reduce((sum, s) => sum + s.price, 0);
  const paid = subs.reduce((sum, s) => sum + s.paid, 0);
  const balance = subs.reduce((sum, s) => sum + s.balance, 0);
  const wa = whatsappLink(client.phone);

  return (
    <>
      <PageHeader
        title={client.fullName}
        description={`Client since ${formatDate(client.createdAt)}`}
        actions={
          <>
            <Link href={`/subscriptions/new?clientId=${client.id}`} className="btn-primary">Add subscription</Link>
            <Link href={`/clients/${client.id}/edit`} className="btn-secondary">Edit</Link>
            <ConfirmForm
              action={deleteClient.bind(null, client.id)}
              trigger="Delete"
              triggerClassName="btn-secondary text-red-700"
              title={`Delete ${client.fullName}?`}
              message={`This also deletes ${plural(subs.length, "subscription")} and ${plural(payments.length, "payment")} recorded for this client. This can't be undone.`}
              confirmLabel="Delete client"
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Contact" className="lg:col-span-1">
          <dl className="space-y-3 p-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted">Phone</dt>
              <dd className="mt-0.5">
                {client.phone}
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="ml-2 font-medium text-brand-700 hover:underline">WhatsApp</a>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Account username</dt>
              <dd className="mt-0.5">{client.accountUsername}</dd>
            </div>
            {client.notes && (
              <div>
                <dt className="text-xs font-medium text-muted">Notes</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{client.notes}</dd>
              </div>
            )}
          </dl>
        </Panel>

        <Panel title="Money" className="lg:col-span-2">
          <dl className="grid grid-cols-3 gap-4 p-4">
            <Stat label="Total sold" value={formatXAF(billed)} />
            <Stat label="Total paid" value={formatXAF(paid)} tone="green" />
            <Stat label="Still owes" value={balance > 0 ? formatXAF(balance) : "Nothing"} tone={balance > 0 ? "red" : undefined} />
          </dl>
        </Panel>
      </div>

      <Panel title="Subscriptions" className="mt-6">
        {subs.length === 0 ? (
          <EmptyState
            title="No subscriptions yet"
            text="Record what this client bought to start tracking due dates and payments."
            action={<Link href={`/subscriptions/new?clientId=${client.id}`} className="btn-primary">Add subscription</Link>}
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription</th>
                  <th>Period</th>
                  <th className="num">Price</th>
                  <th className="num">Paid</th>
                  <th className="num">Balance</th>
                  <th>Payment</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className={rowTone(s.paymentState)}>
                    <td className="font-medium">
                      <Link href={`/subscriptions/${s.id}`} className="text-brand-700 hover:underline">{s.platform}</Link>
                      <span className="block text-xs font-normal text-muted">{s.plan}</span>
                    </td>
                    <td className="whitespace-nowrap">{formatDate(s.startDate)} to {formatDate(s.endDate)}</td>
                    <td className="num">{formatXAF(s.price)}</td>
                    <td className="num">{formatXAF(s.paid)}</td>
                    <td className="num font-semibold">{formatXAF(s.balance)}</td>
                    <td><StatusBadge kind={s.paymentState} /></td>
                    <td><StatusBadge kind={s.lifecycle} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Payment history" className="mt-6">
        {payments.length === 0 ? (
          <EmptyState title="No payments yet" text="Payments you record for this client's subscriptions are listed here." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subscription</th>
                  <th className="num">Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Recorded by</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{formatDate(p.paidAt)}</td>
                    <td>{p.platform} <span className="text-muted">{p.plan}</span></td>
                    <td className="num font-semibold">{formatXAF(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{p.reference ?? <span className="text-muted">None</span>}</td>
                    <td>{p.recordedBy?.name ?? <span className="text-muted">Removed user</span>}</td>
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
