import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, Panel, StatusBadge, rowTone, TextLink } from "@/components/ui";
import { currentMonth, formatDate, formatMonth, relativeDue, today } from "@/lib/dates";
import { formatXAF, plural, whatsappLink } from "@/lib/format";
import { getMonthTotals, getProviders, getSubscriptions, summarize } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ym = currentMonth();
  const [subs, providers, month] = await Promise.all([getSubscriptions(), getProviders(), getMonthTotals(ym)]);
  const s = summarize(subs);

  const owing = subs.filter((x) => x.balance > 0).sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
  const overdueTotal = s.overdue.reduce((sum, x) => sum + x.balance, 0);
  const soonTotal = s.dueSoon.reduce((sum, x) => sum + x.balance, 0);

  const providersSoon = providers.filter((p) => p.state === "expiring");
  const providersLate = providers.filter((p) => p.state === "expired");
  const upcomingProviders = providers.filter((p) => p.state !== "cancelled").slice(0, 6);

  const heroTone = s.overdue.length ? "border-l-red-500" : s.dueSoon.length ? "border-l-amber-500" : "border-l-emerald-500";

  const alerts = [
    { tone: "red", count: s.overdue.length, text: plural(s.overdue.length, "overdue payment"), href: "/subscriptions?payment=overdue" },
    { tone: "amber", count: s.dueToday.length, text: `${plural(s.dueToday.length, "payment")} due today`, href: "/subscriptions?payment=due_soon" },
    { tone: "amber", count: s.dueNextDays.length, text: `${plural(s.dueNextDays.length, "payment")} due in the next 7 days`, href: "/subscriptions?payment=due_soon" },
    { tone: "red", count: providersLate.length, text: `${plural(providersLate.length, "provider subscription")} past the renewal date`, href: "/providers?state=expired" },
    { tone: "amber", count: providersSoon.length, text: `${plural(providersSoon.length, "provider subscription")} renewing within 7 days`, href: "/providers?state=expiring" },
    { tone: "red", count: s.expired.length, text: `${plural(s.expired.length, "client subscription")} expired: renew or end`, href: "/subscriptions?status=expired" },
  ].filter((a) => a.count > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-pine-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">{formatDate(today())} · {formatMonth(ym)} so far</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className={`panel border-l-4 p-5 lg:col-span-3 ${heroTone}`}>
          <p className="text-sm font-medium text-muted">Owed to you</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-pine-900 tabular-nums">{formatXAF(s.outstanding)}</p>
          <p className="mt-1 text-sm text-muted">
            {s.outstanding === 0 ? "Everyone is paid up." : `from ${plural(s.debtors, "client")}`}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-muted">Overdue</dt>
              <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${overdueTotal ? "text-red-700" : ""}`}>{formatXAF(overdueTotal)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Due within 7 days</dt>
              <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${soonTotal ? "text-amber-700" : ""}`}>{formatXAF(soonTotal)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Active clients</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{s.activeClients}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Active subscriptions</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{s.activeSubscriptions}</dd>
            </div>
          </dl>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <p className="text-sm font-medium text-muted">{formatMonth(ym)}</p>
          <dl className="mt-3 space-y-3">
            <div className="flex items-baseline justify-between">
              <dt className="text-sm">Revenue</dt>
              <dd className="font-semibold tabular-nums">{formatXAF(month.revenue)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-sm">Expenses</dt>
              <dd className="font-semibold tabular-nums">{formatXAF(month.expenses)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-sm font-medium">Estimated profit</dt>
              <dd className={`text-xl font-bold tabular-nums ${month.profit < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatXAF(month.profit)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">Payments received minus expenses recorded this month.</p>
        </section>
      </div>

      <Panel title="Needs attention">
        {alerts.length === 0 ? (
          <p className="px-4 py-4 text-sm text-emerald-800">Nothing needs attention right now: no overdue payments and no renewals in the next 7 days.</p>
        ) : (
          <ul className="divide-y divide-line">
            {alerts.map((a) => (
              <li key={a.text}>
                <Link
                  href={a.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 ${a.tone === "red" ? "border-l-4 border-red-500" : "border-l-4 border-amber-400"}`}
                >
                  <span className={`grid min-w-7 place-items-center rounded-full px-2 py-0.5 text-xs font-bold ${a.tone === "red" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>
                    {a.count}
                  </span>
                  <span className="font-medium">{a.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Upcoming client payments" action={<TextLink href="/subscriptions?payment=owing">View all</TextLink>}>
          {owing.length === 0 ? (
            <EmptyState title="Nobody owes you anything" text="Unpaid and partly paid subscriptions will show up here, soonest due first." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Subscription</th>
                    <th className="num">Balance</th>
                    <th>Due date</th>
                    <th>Status</th>
                    <th className="sr-only">Remind</th>
                  </tr>
                </thead>
                <tbody>
                  {owing.slice(0, 8).map((x) => {
                    const wa = whatsappLink(
                      x.client.phone,
                      `Hello ${x.client.fullName}, a reminder that your ${x.platform} subscription is due on ${formatDate(x.endDate)}. Balance: ${formatXAF(x.balance)}. Thank you!`,
                    );
                    return (
                      <tr key={x.id} className={rowTone(x.paymentState)}>
                        <td className="font-medium">
                          <Link href={`/clients/${x.clientId}`} className="hover:underline">{x.client.fullName}</Link>
                        </td>
                        <td>
                          <Link href={`/subscriptions/${x.id}`} className="hover:underline">{x.platform}</Link>
                          <span className="block text-xs text-muted">{x.plan}</span>
                        </td>
                        <td className="num font-semibold">{formatXAF(x.balance)}</td>
                        <td className="whitespace-nowrap">
                          {formatDate(x.endDate)}
                          <span className="block text-xs text-muted">{relativeDue(x.daysLeft)}</span>
                        </td>
                        <td><StatusBadge kind={x.paymentState} /></td>
                        <td>
                          {wa && (
                            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">WhatsApp</a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Upcoming provider renewals" action={<TextLink href="/providers">View all</TextLink>}>
          {upcomingProviders.length === 0 ? (
            <EmptyState
              title="No provider subscriptions yet"
              text="Add the Netflix, Spotify or Canva accounts you buy so you never miss a renewal."
              action={<Link href="/providers/new" className="btn-primary">Add provider subscription</Link>}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Renewal date</th>
                    <th className="num">Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingProviders.map((p) => (
                    <tr key={p.id} className={rowTone(p.state)}>
                      <td className="font-medium">
                        {p.platform}
                        {p.accountIdentifier && <span className="block text-xs font-normal text-muted">{p.accountIdentifier}</span>}
                      </td>
                      <td className="whitespace-nowrap">
                        {formatDate(p.renewalDate)}
                        <span className="block text-xs text-muted">{relativeDue(p.daysLeft, "ago")}</span>
                      </td>
                      <td className="num">{formatXAF(p.cost)}</td>
                      <td><StatusBadge kind={p.state} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {s.expired.length > 0 && (
        <Panel title="Expired subscriptions" action={<TextLink href="/subscriptions?status=expired">View all</TextLink>}>
          <ul className="divide-y divide-line">
            {s.expired.slice(0, 6).map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <Link href={`/clients/${x.clientId}`} className="font-medium hover:underline">{x.client.fullName}</Link>
                  <span className="text-muted"> · {x.platform} {x.plan}, ended {formatDate(x.endDate)}</span>
                </div>
                <Link href={`/subscriptions/new?renew=${x.id}`} className="btn-secondary btn-sm">Renew</Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
