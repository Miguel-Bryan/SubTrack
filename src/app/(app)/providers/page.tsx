import type { Metadata } from "next";
import Link from "next/link";
import { adjustSeats, deleteProvider, renewProvider } from "@/actions/providers";
import { ConfirmForm } from "@/components/confirm-form";
import { CheckboxField } from "@/components/form";
import { FilterForm, FilterSearch, FilterSelect } from "@/components/filter-form";
import { EmptyState, PageHeader, Panel, StatusBadge, rowTone } from "@/components/ui";
import { BILLING_PERIODS } from "@/lib/constants";
import { formatDate, relativeDue } from "@/lib/dates";
import { formatXAF, plural } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { getProviders } from "@/lib/queries";

export const metadata: Metadata = { title: "Provider subscriptions" };

export default async function ProvidersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = param(sp.q).trim().toLowerCase();
  const state = param(sp.state);

  const all = await getProviders();
  const rows = all.filter(
    (p) =>
      (!q || [p.platform, p.accountIdentifier ?? ""].some((v) => v.toLowerCase().includes(q))) &&
      (!state || p.state === state),
  );
  const seatsFree = all.filter((p) => p.state !== "cancelled").reduce((sum, p) => sum + p.availableSeats, 0);

  return (
    <>
      <PageHeader
        title="Provider subscriptions"
        description={`${plural(all.length, "account")} we buy · ${plural(seatsFree, "free seat")} to sell`}
        actions={<Link href="/providers/new" className="btn-primary">Add provider subscription</Link>}
      />
      <Panel>
        <FilterForm>
          <FilterSearch defaultValue={q} placeholder="Search platform or account" />
          <FilterSelect
            name="state"
            label="Status"
            value={state}
            options={[
              { value: "", label: "Any status" },
              { value: "active", label: "Active" },
              { value: "expiring", label: "Expiring soon" },
              { value: "expired", label: "Expired" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <button type="submit" className="btn-secondary">Apply</button>
        </FilterForm>
        {rows.length === 0 ? (
          all.length === 0 ? (
            <EmptyState
              title="No provider subscriptions yet"
              text="Add the accounts you buy from providers, with their renewal date and how many seats you can resell."
              action={<Link href="/providers/new" className="btn-primary">Add provider subscription</Link>}
            />
          ) : (
            <EmptyState title="Nothing matches these filters" action={<Link href="/providers" className="btn-secondary">Clear filters</Link>} />
          )
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Purchased</th>
                  <th>Renewal</th>
                  <th className="num">Cost</th>
                  <th>Seats</th>
                  <th>Status</th>
                  <th className="sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const period = BILLING_PERIODS.find((b) => b.months === p.billingMonths)?.label ?? `${p.billingMonths} mo`;
                  return (
                    <tr key={p.id} className={rowTone(p.state)}>
                      <td className="font-medium">
                        {p.platform}
                        {p.accountIdentifier && <span className="block text-xs font-normal text-muted">{p.accountIdentifier}</span>}
                      </td>
                      <td className="whitespace-nowrap">{formatDate(p.purchaseDate)}</td>
                      <td className="whitespace-nowrap">
                        {formatDate(p.renewalDate)}
                        {p.state !== "cancelled" && <span className="block text-xs text-muted">{relativeDue(p.daysLeft, "ago")}</span>}
                      </td>
                      <td className="num">
                        {formatXAF(p.cost)}
                        <span className="block text-xs text-muted">{period}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <form action={adjustSeats.bind(null, p.id, -1)}>
                            <button type="submit" aria-label={`Free a seat on ${p.platform}`} disabled={p.occupiedSeats <= 0} className="btn-secondary btn-sm px-2 disabled:opacity-40">−</button>
                          </form>
                          <span className="min-w-14 text-center tabular-nums">{p.occupiedSeats} / {p.capacity}</span>
                          <form action={adjustSeats.bind(null, p.id, 1)}>
                            <button type="submit" aria-label={`Take a seat on ${p.platform}`} disabled={p.availableSeats <= 0} className="btn-secondary btn-sm px-2 disabled:opacity-40">+</button>
                          </form>
                        </div>
                        <span className={`mt-1 block text-xs ${p.availableSeats > 0 ? "font-medium text-emerald-700" : "text-muted"}`}>
                          {p.availableSeats > 0 ? `${p.availableSeats} available` : "Full"}
                        </span>
                      </td>
                      <td><StatusBadge kind={p.state} /></td>
                      <td className="whitespace-nowrap text-right">
                        <ConfirmForm
                          action={renewProvider.bind(null, p.id)}
                          trigger="Renew"
                          triggerClassName="btn-ghost btn-sm"
                          title={`Renew ${p.platform}?`}
                          message={`The renewal date moves forward by one billing period (${period.toLowerCase()}).`}
                          confirmLabel="Renew"
                          pendingLabel="Renewing..."
                          tone="primary"
                          fields={<CheckboxField name="recordExpense" label={`Record ${formatXAF(p.cost)} as an expense`} defaultChecked />}
                        />
                        <Link href={`/providers/${p.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
                        <ConfirmForm
                          action={deleteProvider.bind(null, p.id)}
                          trigger="Delete"
                          title={`Delete ${p.platform}?`}
                          message="Expenses already recorded for it stay in your expenses list."
                          confirmLabel="Delete"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
