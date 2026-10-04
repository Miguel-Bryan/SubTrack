"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { go } from "@/lib/flash";
import { expenseSchema, validate, type FormState } from "@/lib/validation";

export async function createExpense(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const v = validate(expenseSchema, fd);
  if (!v.ok) return v.state;
  await prisma.expense.create({ data: v.data });
  revalidatePath("/", "layout");
  go("/expenses", "ok", "Expense added");
}

export async function updateExpense(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const v = validate(expenseSchema, fd);
  if (!v.ok) return v.state;
  await prisma.expense.update({ where: { id }, data: v.data });
  revalidatePath("/", "layout");
  go("/expenses", "ok", "Expense updated");
}

export async function deleteExpense(id: string, _fd: FormData) {
  await requireUser();
  await prisma.expense.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  go("/expenses", "ok", "Expense deleted");
}
