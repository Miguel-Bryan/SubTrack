import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateExpense } from "@/actions/expenses";
import { ExpenseForm } from "@/components/simple-forms";
import { PageHeader, Panel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { toInputDate, today } from "@/lib/dates";

export const metadata: Metadata = { title: "Edit expense" };

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await prisma.expense.findUnique({ where: { id } });
  if (!e) notFound();
  return (
    <>
      <PageHeader title="Edit expense" />
      <Panel className="max-w-2xl p-5">
        <ExpenseForm
          action={updateExpense.bind(null, id)}
          cancelHref="/expenses"
          submitLabel="Save changes"
          todayValue={toInputDate(today())}
          expense={{ ...e, spentAt: toInputDate(e.spentAt) }}
        />
      </Panel>
    </>
  );
}
