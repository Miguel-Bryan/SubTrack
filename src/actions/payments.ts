"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { go, safePath } from "@/lib/flash";
import { formatXAF } from "@/lib/format";
import { fail, paymentSchema, validate, type FormState } from "@/lib/validation";

/** Checks that the payment doesn't exceed what is still owed (ignoring `ignorePaymentId` when editing). */
async function checkAmount(subscriptionId: string, amount: number, ignorePaymentId?: string) {
  const sub = await prisma.clientSubscription.findUnique({
    where: { id: subscriptionId },
    include: { payments: true },
  });
  if (!sub) return { error: "Choose a subscription" as const };
  const paidElsewhere = sub.payments.filter((p) => p.id !== ignorePaymentId).reduce((s, p) => s + p.amount, 0);
  const balance = sub.price - paidElsewhere;
  if (amount > balance) {
    return { error: `Too high: only ${formatXAF(Math.max(balance, 0))} is still owed on this subscription` };
  }
  return { error: null };
}

export async function createPayment(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const v = validate(paymentSchema, fd);
  if (!v.ok) return v.state;

  const check = await checkAmount(v.data.subscriptionId, v.data.amount);
  if (check.error) return fail(v.values, { [check.error.startsWith("Choose") ? "subscriptionId" : "amount"]: check.error });

  await prisma.payment.create({
    data: {
      subscriptionId: v.data.subscriptionId,
      amount: v.data.amount,
      paidAt: v.data.paidAt,
      method: v.data.method,
      reference: v.data.reference,
      notes: v.data.notes,
      recordedById: user.id,
    },
  });
  revalidatePath("/", "layout");
  go(`/subscriptions/${v.data.subscriptionId}`, "ok", "Payment recorded");
}

export async function updatePayment(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const v = validate(paymentSchema, fd);
  if (!v.ok) return v.state;

  const check = await checkAmount(v.data.subscriptionId, v.data.amount, id);
  if (check.error) return fail(v.values, { [check.error.startsWith("Choose") ? "subscriptionId" : "amount"]: check.error });

  await prisma.payment.update({
    where: { id },
    data: {
      subscriptionId: v.data.subscriptionId,
      amount: v.data.amount,
      paidAt: v.data.paidAt,
      method: v.data.method,
      reference: v.data.reference,
      notes: v.data.notes,
    },
  });
  revalidatePath("/", "layout");
  go(`/subscriptions/${v.data.subscriptionId}`, "ok", "Payment updated");
}

export async function deletePayment(id: string, returnTo: string, _fd: FormData) {
  await requireUser();
  await prisma.payment.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  go(safePath(returnTo, "/payments"), "ok", "Payment deleted");
}
