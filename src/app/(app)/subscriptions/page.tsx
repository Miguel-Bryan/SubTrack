import type { Metadata } from "next";
import Link from "next/link";
import { FilterForm, FilterSearch, FilterSelect } from "@/components/filter-form";
import { EmptyState, PageHeader, Panel, StatusBadge, rowTone } from "@/components/ui";
import { formatDate, relativeDue } from "@/lib/dates";
import { formatXAF, plural } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { getSubscriptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Client subscriptions" };

const STATUS_OPTIONS = [
  { value: "current", label: "Current (not renewed or ended)" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
  { value: "past", label: "Renewed or ended" },
  { value: "all", label: "All subscriptions" },
];
const PAYMENT_OPTIONS = [
  { value: "", label: "Any payment status" },
  { value: "owing", label: "Has a balance" },
  { value: "overdue", label: "Overdue" },
  { value: "due_soon", label: "Due soon" },
  { value: "paid", label: "Fully paid" },
];

export default async function SubscriptionsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = param(sp.q).trim().toLowerCase();
  const payment = param(sp.payment);
  // When filtering by payment, include renewed/ended terms too (they can still owe money).
  const status = param(sp.status) || (payment ? "all" : "current");

  const all = await getSubscriptions();
  const rows = all
    .filter((s) => {
      if (q && ![s.client.fullName, s.platform, s.plan, s.client.accountUsername].some((v) => v.toLowerCase().includes(q))) return false;
      if (status === "current" && (s.lifecycle === "renewed" || s.lifecycle === "ended")) return false;
      if (status === "past" && s.lifecycle !== "renewed" && s.lifecycle !== "ended") return false;
      if (["active", "expiring", "expired"].includes(status) && s.lifecycle !== status) return false;
      if (payment === "owing" && s.balance <= 0) return false;
      if (payment === "paid" && s.balance > 0) return false;
      if (payment === "overdue" && s.paymentState !== "overdue") return false;
      if (payment === "due_soon" && s.paymentState !== "due_soon") return false;
      return true;
    })
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime());

  return (
    <>
      <PageHeader
        title="Client subscriptions"
        description={plural(rows.length, "subscription") + (rows.length !== all.length ? ` shown of ${all.length}` : "")}
        actions={<Link href="/subscriptions/new" className="btn-primary">Add subscription</Link>}
      />
      <Panel>
        <FilterForm>
          <FilterSearch defaultValue={q} placeholder="Search client, platform or plan" />
          <FilterSelect name="status" label="Subscription state" value={status} options={STATUS_OPTIONS} />
          <FilterSelect name="payment" label="Payment status" value={payment} options={PAYMENT_OPTIONS} />
          <button type="submit" className="btn-secondary">Apply</button>
        </FilterForm>
        {rows.length === 0 ? (
          all.length === 0 ? (
            <EmptyState
              title="No subscriptions yet"
              text="Add a client first, then record the subscription you sold them."
              action={<Link href="/subscriptions/new" className="btn-primary">Add subscription</Link>}
            />
          ) : (
            <EmptyState title="Nothing matches these filters" text="Change the filters or clear the search." action={<Link href="/subscriptions" className="btn-secondary">Clear filters</Link>} />
          )
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Subscription</th>
                  <th>Due / ends</th>
                  <th className="num">Price</th>
                  <th className="num">Paid</th>
                  <th className="num">Balance</th>
                  <th>Payment</th>
                  <th>State</th>
                  <th className="sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className={rowTone(s.paymentState) || rowTone(s.lifecycle)}>
                    <td className="font-medium">
                      <Link href={`/clients/${s.clientId}`} className="hover:underline">{s.client.fullName}</Link>
                    </td>
                    <td>
                      <Link href={`/subscriptions/${s.id}`} className="font-medium text-brand-700 hover:underline">{s.platform}</Link>
                      <span className="block text-xs text-muted">{s.plan} · {s.durationMonths} mo</span>
                    </td>
                    <td className="whitespace-nowrap">
                      {formatDate(s.endDate)}
                      {s.lifecycle !== "renewed" && s.lifecycle !== "ended" && <span className="block text-xs text-muted">{relativeDue(s.daysLeft, "ago")}</span>}
                    </td>
                    <td className="num">{formatXAF(s.price)}</td>
                    <td className="num">{formatXAF(s.paid)}</td>
                    <td className="num font-semibold">{formatXAF(s.balance)}</td>
                    <td><StatusBadge kind={s.paymentState} /></td>
                    <td><StatusBadge kind={s.lifecycle} /></td>
                    <td className="whitespace-nowrap text-right">
                      {(s.lifecycle === "expired" || s.lifecycle === "expiring") && (
                        <Link href={`/subscriptions/new?renew=${s.id}`} className="btn-ghost btn-sm">Renew</Link>
                      )}
                      {s.balance > 0 && <Link href={`/payments/new?subscriptionId=${s.id}`} className="btn-ghost btn-sm">Add payment</Link>}
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
