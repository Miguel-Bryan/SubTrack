import { prisma } from "./db";
import { SOON_DAYS, monthRange, today } from "./dates";
import { withMoney, withProviderState } from "./status";

/** Every client subscription with derived money fields. Small business = small data, so we compute in JS. */
export async function getSubscriptions() {
  const now = today();
  const subs = await prisma.clientSubscription.findMany({
    include: { client: true, payments: true },
    orderBy: { endDate: "asc" },
  });
  return subs.map((s) => withMoney(s, now));
}
export type SubRow = Awaited<ReturnType<typeof getSubscriptions>>[number];

export async function getProviders() {
  const now = today();
  const rows = await prisma.providerSubscription.findMany({ orderBy: { renewalDate: "asc" } });
  return rows.map((p) => withProviderState(p, now));
}
export type ProviderRow = Awaited<ReturnType<typeof getProviders>>[number];

/** Cash-basis month totals: payments received and expenses spent within the month. */
export async function getMonthTotals(ym: string) {
  const { start, end } = monthRange(ym);
  const [rev, exp] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: start, lt: end } } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { spentAt: { gte: start, lt: end } } }),
  ]);
  const revenue = rev._sum.amount ?? 0;
  const expenses = exp._sum.amount ?? 0;
  return { revenue, expenses, profit: revenue - expenses };
}

/** Numbers shared by the dashboard and the reports page. */
export function summarize(subs: SubRow[]) {
  const live = subs.filter((s) => s.status === "ACTIVE" && s.daysLeft >= 0);
  const owing = subs.filter((s) => s.balance > 0);
  return {
    activeSubscriptions: live.length,
    activeClients: new Set(live.map((s) => s.clientId)).size,
    outstanding: owing.reduce((sum, s) => sum + s.balance, 0),
    debtors: new Set(owing.map((s) => s.clientId)).size,
    overdue: owing.filter((s) => s.daysLeft < 0),
    dueToday: owing.filter((s) => s.daysLeft === 0),
    dueSoon: owing.filter((s) => s.daysLeft >= 0 && s.daysLeft <= SOON_DAYS),
    dueNextDays: owing.filter((s) => s.daysLeft >= 1 && s.daysLeft <= SOON_DAYS),
    expired: subs.filter((s) => s.lifecycle === "expired"),
  };
}

/** Subscriptions a payment can be recorded against (those with a balance, plus the one being edited). */
export async function getPaymentOptions(editing?: { subscriptionId: string; amount: number }) {
  const subs = await getSubscriptions();
  return subs
    .filter((s) => s.balance > 0 || s.id === editing?.subscriptionId)
    .map((s) => ({
      id: s.id,
      clientName: s.client.fullName,
      label: `${s.platform} · ${s.plan}`,
      balance: s.balance + (s.id === editing?.subscriptionId ? editing.amount : 0),
    }))
    .sort((a, b) => a.clientName.localeCompare(b.clientName));
}
