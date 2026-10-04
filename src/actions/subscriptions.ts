"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { PAYMENT_METHODS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { addMonths, today } from "@/lib/dates";
import { go } from "@/lib/flash";
import { formatXAF } from "@/lib/format";
import { fail, subscriptionSchema, validate, type FormState } from "@/lib/validation";

/** Creates a new subscription. With `renewFromId` it is a renewal: the old term is marked RENEWED. */
export async function createSubscription(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const v = validate(subscriptionSchema, fd);
  if (!v.ok) return v.state;
  const d = v.data;

  if (d.initialAmount > d.price) {
    return fail(v.values, { initialAmount: "Cannot be more than the selling price" });
  }
  const client = await prisma.client.findUnique({ where: { id: d.clientId }, select: { id: true } });
  if (!client) return fail(v.values, { clientId: "Choose a client" });

  const method = (PAYMENT_METHODS as readonly string[]).includes(d.initialMethod ?? "") ? d.initialMethod! : "Other";
  const renewFromId = d.renewFromId || null;

  const sub = await prisma.$transaction(async (tx) => {
    const created = await tx.clientSubscription.create({
      data: {
        clientId: d.clientId,
        platform: d.platform,
        plan: d.plan,
        startDate: d.startDate,
        durationMonths: d.durationMonths,
        endDate: addMonths(d.startDate, d.durationMonths),
        price: d.price,
        notes: d.notes,
      },
    });
    if (d.initialAmount > 0) {
      await tx.payment.create({
        data: {
          subscriptionId: created.id,
          amount: d.initialAmount,
          paidAt: today(),
          method,
          recordedById: user.id,
        },
      });
    }
    if (renewFromId) {
      await tx.clientSubscription.updateMany({
        where: { id: renewFromId, clientId: d.clientId },
        data: { status: "RENEWED" },
      });
    }
    return created;
  });

  revalidatePath("/", "layout");
  go(`/subscriptions/${sub.id}`, "ok", renewFromId ? "Subscription renewed" : "Subscription added");
}

export async function updateSubscription(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const v = validate(subscriptionSchema, fd);
  if (!v.ok) return v.state;
  const d = v.data;

  const existing = await prisma.clientSubscription.findUnique({ where: { id }, include: { payments: true } });
  if (!existing) go("/subscriptions", "err", "Subscription not found");
  const paid = existing.payments.reduce((sum, p) => sum + p.amount, 0);
  if (d.price < paid) {
    return fail(v.values, { price: `Already paid ${formatXAF(paid)}, so the price can't be lower` });
  }

  await prisma.clientSubscription.update({
    where: { id },
    data: {
      platform: d.platform,
      plan: d.plan,
      startDate: d.startDate,
      durationMonths: d.durationMonths,
      endDate: addMonths(d.startDate, d.durationMonths),
      price: d.price,
      notes: d.notes,
      status: d.status ?? existing.status,
    },
  });
  revalidatePath("/", "layout");
  go(`/subscriptions/${id}`, "ok", "Subscription updated");
}

export async function endSubscription(id: string, _fd: FormData) {
  await requireUser();
  await prisma.clientSubscription.updateMany({ where: { id }, data: { status: "ENDED" } });
  revalidatePath("/", "layout");
  go(`/subscriptions/${id}`, "ok", "Subscription marked as ended");
}

export async function deleteSubscription(id: string, _fd: FormData) {
  await requireUser();
  const sub = await prisma.clientSubscription.findUnique({ where: { id }, select: { clientId: true } });
  await prisma.clientSubscription.deleteMany({ where: { id } }); // payments cascade
  revalidatePath("/", "layout");
  go(sub ? `/clients/${sub.clientId}` : "/subscriptions", "ok", "Subscription deleted");
}
