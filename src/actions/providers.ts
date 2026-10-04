"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addMonths, today } from "@/lib/dates";
import { go } from "@/lib/flash";
import { fail, providerSchema, validate, type FormState } from "@/lib/validation";

function checkRules(v: { values: Record<string, string>; data: { capacity: number; occupiedSeats: number; purchaseDate: Date; renewalDate: Date } }) {
  const errors: Record<string, string> = {};
  if (v.data.occupiedSeats > v.data.capacity) errors.occupiedSeats = "Can't be more than the capacity";
  if (v.data.renewalDate < v.data.purchaseDate) errors.renewalDate = "Must be on or after the purchase date";
  return Object.keys(errors).length ? fail(v.values, errors) : null;
}

export async function createProvider(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const v = validate(providerSchema, fd);
  if (!v.ok) return v.state;
  const rule = checkRules(v);
  if (rule) return rule;

  const { recordExpense, ...data } = v.data;
  await prisma.$transaction(async (tx) => {
    await tx.providerSubscription.create({ data });
    if (recordExpense && data.cost > 0) {
      await tx.expense.create({
        data: {
          name: `${data.platform} purchase`,
          amount: data.cost,
          spentAt: data.purchaseDate,
          category: "Subscription purchase",
        },
      });
    }
  });
  revalidatePath("/", "layout");
  go("/providers", "ok", recordExpense ? "Provider subscription added and cost recorded as an expense" : "Provider subscription added");
}

export async function updateProvider(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const v = validate(providerSchema, fd);
  if (!v.ok) return v.state;
  const rule = checkRules(v);
  if (rule) return rule;

  const { recordExpense: _ignored, ...data } = v.data;
  await prisma.providerSubscription.update({ where: { id }, data });
  revalidatePath("/", "layout");
  go("/providers", "ok", "Provider subscription updated");
}

export async function deleteProvider(id: string, _fd: FormData) {
  await requireUser();
  await prisma.providerSubscription.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  go("/providers", "ok", "Provider subscription deleted");
}

/** Moves the renewal date forward by one billing period and optionally records the cost as an expense. */
export async function renewProvider(id: string, fd: FormData) {
  await requireUser();
  const p = await prisma.providerSubscription.findUnique({ where: { id } });
  if (!p) go("/providers", "err", "Provider subscription not found");

  const now = today();
  const base = p.renewalDate > now ? p.renewalDate : now; // late renewals start counting from today
  const renewalDate = addMonths(base, p.billingMonths);

  await prisma.$transaction(async (tx) => {
    await tx.providerSubscription.update({ where: { id }, data: { renewalDate, status: "ACTIVE" } });
    if (fd.get("recordExpense") && p.cost > 0) {
      await tx.expense.create({
        data: { name: `${p.platform} renewal`, amount: p.cost, spentAt: now, category: "Subscription purchase" },
      });
    }
  });
  revalidatePath("/", "layout");
  go("/providers", "ok", `${p.platform} renewed`);
}

/** Quick +/- on the seat counter (no page change). */
export async function adjustSeats(id: string, delta: number, _fd: FormData) {
  await requireUser();
  const p = await prisma.providerSubscription.findUnique({ where: { id } });
  if (!p) return;
  const occupiedSeats = Math.min(Math.max(p.occupiedSeats + delta, 0), p.capacity);
  await prisma.providerSubscription.update({ where: { id }, data: { occupiedSeats } });
  revalidatePath("/", "layout");
}
