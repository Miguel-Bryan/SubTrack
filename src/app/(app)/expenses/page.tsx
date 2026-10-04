import type { Metadata } from "next";
import Link from "next/link";
import { deleteExpense } from "@/actions/expenses";
import { ConfirmForm } from "@/components/confirm-form";
import { FilterForm, FilterSearch, FilterSelect } from "@/components/filter-form";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, formatMonth, isValidMonth, monthRange } from "@/lib/dates";
import { formatXAF, plural } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = param(sp.q).trim().toLowerCase();
  const category = param(sp.category);
  const monthParam = param(sp.month);
  const month = isValidMonth(monthParam) ? monthParam : "";

  const expenses = await prisma.expense.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(month ? { spentAt: { gte: monthRange(month).start, lt: monthRange(month).end } } : {}),
    },
    orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
  });
  const rows = expenses.filter((e) => !q || [e.name, e.notes ?? ""].some((v) => v.toLowerCase().includes(q)));
  const total = rows.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        description={`${plural(rows.length, "expense")} · ${formatXAF(total)}${month ? ` in ${formatMonth(month)}` : " in total"}`}
        actions={<Link href="/expenses/new" className="btn-primary">Add expense</Link>}
      />
      <Panel>
        <FilterForm>
          <FilterSearch defaultValue={q} placeholder="Search by name or notes" />
          <div>
            <label htmlFor="month" className="sr-only">Month</label>
            <input id="month" name="month" type="month" defaultValue={month} className="input" />
          </div>
          <FilterSelect
            name="category"
            label="Category"
            value={category}
            options={[{ value: "", label: "Any category" }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <button type="submit" className="btn-secondary">Apply</button>
        </FilterForm>
        {rows.length === 0 ? (
          expenses.length === 0 && !q && !month && !category ? (
            <EmptyState title="No expenses yet" text="Record what you spend (provider purchases, internet, ads) so profit is accurate." action={<Link href="/expenses/new" className="btn-primary">Add expense</Link>} />
          ) : (
            <EmptyState title="No expenses match these filters" action={<Link href="/expenses" className="btn-secondary">Clear filters</Link>} />
          )
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense</th>
                  <th>Category</th>
                  <th className="num">Amount</th>
                  <th className="sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap">{formatDate(e.spentAt)}</td>
                    <td className="font-medium">
                      {e.name}
                      {e.notes && <span className="block max-w-xs truncate text-xs font-normal text-muted">{e.notes}</span>}
                    </td>
                    <td>{e.category}</td>
                    <td className="num font-semibold">{formatXAF(e.amount)}</td>
                    <td className="whitespace-nowrap text-right">
                      <Link href={`/expenses/${e.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
                      <ConfirmForm
                        action={deleteExpense.bind(null, e.id)}
                        trigger="Delete"
                        title="Delete this expense?"
                        message={`"${e.name}" (${formatXAF(e.amount)}) will be removed and this month's profit will go up by the same amount.`}
                        confirmLabel="Delete expense"
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
