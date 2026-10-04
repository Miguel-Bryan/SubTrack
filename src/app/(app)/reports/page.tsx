import type { Metadata } from "next";
import Link from "next/link";
import { FilterForm } from "@/components/filter-form";
import { PageHeader, Panel, Stat } from "@/components/ui";
import { currentMonth, formatMonth, isValidMonth, shiftMonth } from "@/lib/dates";
import { formatXAF } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { getMonthTotals, getSubscriptions, summarize } from "@/lib/queries";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const monthParam = param((await searchParams).month);
  const ym = isValidMonth(monthParam) ? monthParam : currentMonth();

  const [totals, subs] = await Promise.all([getMonthTotals(ym), getSubscriptions()]);
  const s = summarize(subs);

  return (
    <>
      <PageHeader title="Reports" description="A simple overview. Revenue is payments received in the month; expenses are what you recorded." />

      <Panel className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <h2 className="text-lg font-semibold text-pine-900">{formatMonth(ym)}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/reports?month=${shiftMonth(ym, -1)}`} className="btn-secondary btn-sm">Previous</Link>
            <Link href={`/reports?month=${shiftMonth(ym, 1)}`} className="btn-secondary btn-sm">Next</Link>
            <FilterFormInline ym={ym} />
          </div>
        </div>
        <dl className="grid gap-6 border-t border-line p-4 sm:grid-cols-3">
          <Stat label="Total revenue" value={formatXAF(totals.revenue)} />
          <Stat label="Total expenses" value={formatXAF(totals.expenses)} />
          <Stat label="Estimated profit" value={formatXAF(totals.profit)} tone={totals.profit < 0 ? "red" : "green"} />
        </dl>
      </Panel>

      <Panel title="Right now">
        <dl className="grid gap-6 p-4 sm:grid-cols-3">
          <Stat label="Outstanding client payments" value={formatXAF(s.outstanding)} tone={s.outstanding > 0 ? "red" : undefined} />
          <Stat label="Active clients" value={s.activeClients} />
          <Stat label="Active subscriptions" value={s.activeSubscriptions} />
        </dl>
        <p className="border-t border-line px-4 py-3 text-xs text-muted">These three numbers are as of today and don't change with the month.</p>
      </Panel>
    </>
  );
}

function FilterFormInline({ ym }: { ym: string }) {
  return (
    <FilterForm className="flex items-center">
      <label htmlFor="month" className="sr-only">Choose month</label>
      <input id="month" name="month" type="month" defaultValue={ym} className="input" />
    </FilterForm>
  );
}
