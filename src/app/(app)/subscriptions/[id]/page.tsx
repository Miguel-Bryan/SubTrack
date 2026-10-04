import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSubscription, endSubscription } from "@/actions/subscriptions";
import { deletePayment } from "@/actions/payments";
import { ConfirmForm } from "@/components/confirm-form";
import { EmptyState, PageHeader, Panel, Stat, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate, relativeDue } from "@/lib/dates";
import { formatXAF, plural, whatsappLink } from "@/lib/format";
import { withMoney } from "@/lib/status";

export const metadata: Metadata = { title: "Subscription" };

export default async function SubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await prisma.clientSubscription.findUnique({
    where: { id },
    include: { client: true, payments: { include: { recordedBy: true }, orderBy: { paidAt: "desc" } } },
  });
  if (!raw) notFound();
  const s = withMoney(raw);
  const open = s.lifecycle !== "renewed" && s.lifecycle !== "ended";
  const wa = whatsappLink(
    s.client.phone,
    `Hello ${s.client.fullName}, a reminder that your ${s.platform} subscription is due on ${formatDate(s.endDate)}.${s.balance > 0 ? ` Balance: ${formatXAF(s.balance)}.` : ""} Thank you!`,
  );

  return (
    <>
      <PageHeader
        title={`${s.platform} · ${s.plan}`}
        description={
          <>
            <Link href={`/clients/${s.clientId}`} className="font-medium text-brand-700 hover:underline">{s.client.fullName}</Link>
            {open && ` · ${s.daysLeft < 0 ? "ended" : "ends"} ${relativeDue(s.daysLeft, "ago").toLowerCase()}`}
          </>
        }
        actions={
          <>
            {s.balance > 0 && <Link href={`/payments/new?subscriptionId=${s.id}`} className="btn-primary">Record payment</Link>}
            <Link href={`/subscriptions/new?renew=${s.id}`} className={s.balance > 0 ? "btn-secondary" : "btn-primary"}>Renew</Link>
            <Link href={`/subscriptions/${s.id}/edit`} className="btn-secondary">Edit</Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Details" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
            <Stat label="Start date" value={formatDate(s.startDate)} />
            <Stat label="Duration" value={`${s.durationMonths} month${s.durationMonths > 1 ? "s" : ""}`} />
            <Stat label="Ends / due on" value={formatDate(s.endDate)} />
            <Stat label="Selling price" value={formatXAF(s.price)} />
            <Stat label="Paid so far" value={formatXAF(s.paid)} tone="green" />
            <Stat label="Remaining balance" value={s.balance > 0 ? formatXAF(s.balance) : "None"} tone={s.balance > 0 ? "red" : undefined} />
          </dl>
          {s.notes && <p className="border-t border-line px-4 py-3 text-sm whitespace-pre-wrap text-muted">{s.notes}</p>}
        </Panel>

        <Panel title="Status">
          <div className="space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted">Payment</span><StatusBadge kind={s.paymentState} /></div>
            <div className="flex items-center justify-between"><span className="text-muted">Subscription</span><StatusBadge kind={s.lifecycle} /></div>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">Send WhatsApp reminder</a>
            )}
            {open && (
              <ConfirmForm
                action={endSubscription.bind(null, s.id)}
                trigger="Mark as ended"
                triggerClassName="btn-secondary w-full"
                title="Mark this subscription as ended?"
                message="Use this when the client doesn't want to renew. It stops showing up as expired. You can reopen it from Edit."
                confirmLabel="Mark as ended"
                pendingLabel="Saving..."
                tone="primary"
              />
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Payment history" className="mt-6" action={s.balance > 0 ? <Link href={`/payments/new?subscriptionId=${s.id}`} className="btn-ghost btn-sm">Record payment</Link> : undefined}>
        {s.payments.length === 0 ? (
          <EmptyState title="No payments yet" text="Record each payment the client makes, including partial ones." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Recorded by</th>
                  <th>Notes</th>
                  <th className="sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {s.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{formatDate(p.paidAt)}</td>
                    <td className="num font-semibold">{formatXAF(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{p.reference ?? <span className="text-muted">None</span>}</td>
                    <td>{p.recordedBy?.name ?? <span className="text-muted">Removed user</span>}</td>
                    <td className="max-w-48 truncate">{p.notes}</td>
                    <td className="whitespace-nowrap text-right">
                      <Link href={`/payments/${p.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
                      <ConfirmForm
                        action={deletePayment.bind(null, p.id, `/subscriptions/${s.id}`)}
                        trigger="Delete"
                        title="Delete this payment?"
                        message={`${formatXAF(p.amount)} paid on ${formatDate(p.paidAt)} will be removed and the balance will go up by the same amount.`}
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

      <div className="mt-6 flex justify-end">
        <ConfirmForm
          action={deleteSubscription.bind(null, s.id)}
          trigger="Delete subscription"
          title="Delete this subscription?"
          message={`This also deletes ${plural(s.payments.length, "payment")} recorded on it. Use "Mark as ended" instead if the client simply stopped. This can't be undone.`}
          confirmLabel="Delete subscription"
        />
      </div>
    </>
  );
}
