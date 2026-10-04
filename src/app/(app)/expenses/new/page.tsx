import type { Metadata } from "next";
import { createExpense } from "@/actions/expenses";
import { ExpenseForm } from "@/components/simple-forms";
import { PageHeader, Panel } from "@/components/ui";
import { toInputDate, today } from "@/lib/dates";

export const metadata: Metadata = { title: "Add expense" };

export default function NewExpensePage() {
  return (
    <>
      <PageHeader title="Add expense" />
      <Panel className="max-w-2xl p-5">
        <ExpenseForm action={createExpense} cancelHref="/expenses" submitLabel="Add expense" todayValue={toInputDate(today())} />
      </Panel>
    </>
  );
}
