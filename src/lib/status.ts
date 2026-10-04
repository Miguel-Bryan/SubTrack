import { SOON_DAYS, daysBetween, today } from "./dates";

export type PaymentState = "paid" | "partial" | "unpaid" | "due_soon" | "overdue";
export type Lifecycle = "active" | "expiring" | "expired" | "renewed" | "ended";
export type ProviderState = "active" | "expiring" | "expired" | "cancelled";

type SubInput = {
  price: number;
  endDate: Date;
  status: string;
  payments: { amount: number }[];
};

/**
 * Adds the derived money/status fields to a client subscription.
 *   balance = price - total payments
 *   paid    -> balance is 0
 *   overdue -> balance > 0 and the due (end) date has passed
 *   due_soon-> balance > 0 and due within SOON_DAYS (including today)
 */
export function withMoney<T extends SubInput>(sub: T, now: Date = today()) {
  const paid = sub.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(sub.price - paid, 0);
  const daysLeft = daysBetween(now, sub.endDate);

  let paymentState: PaymentState;
  if (balance === 0) paymentState = "paid";
  else if (daysLeft < 0) paymentState = "overdue";
  else if (daysLeft <= SOON_DAYS) paymentState = "due_soon";
  else if (paid > 0) paymentState = "partial";
  else paymentState = "unpaid";

  let lifecycle: Lifecycle;
  if (sub.status === "RENEWED") lifecycle = "renewed";
  else if (sub.status === "ENDED") lifecycle = "ended";
  else if (daysLeft < 0) lifecycle = "expired";
  else if (daysLeft <= SOON_DAYS) lifecycle = "expiring";
  else lifecycle = "active";

  return { ...sub, paid, balance, daysLeft, paymentState, lifecycle };
}

type ProviderInput = {
  renewalDate: Date;
  status: string;
  capacity: number;
  occupiedSeats: number;
};

export function withProviderState<T extends ProviderInput>(p: T, now: Date = today()) {
  const daysLeft = daysBetween(now, p.renewalDate);
  let state: ProviderState;
  if (p.status === "CANCELLED") state = "cancelled";
  else if (daysLeft < 0) state = "expired";
  else if (daysLeft <= SOON_DAYS) state = "expiring";
  else state = "active";
  return { ...p, daysLeft, state, availableSeats: Math.max(p.capacity - p.occupiedSeats, 0) };
}
